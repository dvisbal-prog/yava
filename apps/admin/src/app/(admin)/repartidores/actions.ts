"use server";

import { revalidatePath } from "next/cache";
import { Constants, type CourierStatus } from "@yava/shared";
import { actionContext } from "@/lib/auth";
import { canManageFinance, canManageMerchants } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { courierDocsBlocker } from "@/lib/documents";
import { fail, requireReason, str, type ActionResult } from "@/lib/actions";

function isCourierStatus(v: string): v is CourierStatus {
  return (Constants.public.Enums.courier_status as readonly string[]).includes(v);
}

export async function setCourierStatusAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageMerchants(auth.ctx.role)) return { ok: false, error: "Solo owner u operaciones cambian el estado de repartidores." };
  const id = str(fd, "id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (!isCourierStatus(status)) return { ok: false, error: "Estado no válido." };
  const supabase = await createClient();
  if (status === "active") {
    const { data: current, error: e1 } = await supabase.from("couriers").select("status,vehicle").eq("user_id", id).single();
    if (e1 || !current) return fail(e1, "Repartidor no encontrado.");
    // Aprobar una solicitud exige documentos aprobados (reactivar a un suspendido no).
    if (current.status === "pending" || current.status === "under_review") {
      const blocker = await courierDocsBlocker(supabase, id, current.vehicle);
      if (blocker) return { ok: false, error: blocker };
    }
  }
  const { error } = await supabase.rpc("admin_set_courier_status", { p_id: id, p_status: status, p_reason: reason });
  if (error) return fail(error);
  revalidatePath(`/repartidores/${id}`);
  revalidatePath("/repartidores");
  return { ok: true, message: "Estado del repartidor actualizado." };
}

export async function reviewCourierDocumentAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageMerchants(auth.ctx.role)) return { ok: false, error: "Sin permiso para revisar documentos." };
  const docId = str(fd, "doc_id");
  const courierId = str(fd, "courier_id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!docId || !reason || (status !== "approved" && status !== "rejected")) return { ok: false, error: "Datos incompletos." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("courier_documents").select("status,doc_type").eq("id", docId).single();
  const { error } = await supabase
    .from("courier_documents")
    .update({ status, notes: reason, reviewed_by: auth.ctx.userId, reviewed_at: new Date().toISOString() })
    .eq("id", docId);
  if (error) return fail(error);
  await supabase.rpc("audit", {
    p_action: `courier_document.${status}`,
    p_entity: "courier_document",
    p_entity_id: docId,
    p_reason: reason,
    p_before: before ? { status: before.status, doc_type: before.doc_type } : null,
    p_after: { status, courier_id: courierId },
  });
  revalidatePath(`/repartidores/${courierId}`);
  return { ok: true, message: status === "approved" ? "Documento aprobado." : "Documento rechazado." };
}

export async function withdrawalTransitionAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageFinance(auth.ctx.role)) return { ok: false, error: "Solo owner o finanzas gestionan retiros." };
  const id = str(fd, "id");
  const courierId = str(fd, "courier_id");
  const status = str(fd, "status");
  const reference = str(fd, "reference");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (status !== "approved" && status !== "paid" && status !== "rejected") return { ok: false, error: "Transición no válida." };
  if (status === "paid" && reference.length < 3) return { ok: false, error: "La referencia de la transferencia es obligatoria." };

  const supabase = await createClient();
  // Solo validación de la transición (lectura). La escritura, la devolución de saldo, la notificación
  // y la auditoría ocurren de forma atómica en admin_withdrawal_transition (FOR UPDATE).
  const { data: before, error: e1 } = await supabase.from("courier_withdrawals").select("status").eq("id", id).single();
  if (e1 || !before) return fail(e1, "Retiro no encontrado.");
  if (status === "approved" && before.status !== "pending") return { ok: false, error: "Solo se aprueban retiros pendientes." };
  if (status === "paid" && before.status !== "approved") return { ok: false, error: "Primero debe aprobarse." };
  if (before.status === "paid" || before.status === "rejected") return { ok: false, error: "El retiro ya fue procesado." };

  const { error } = await supabase.rpc("admin_withdrawal_transition", {
    p_id: id,
    p_status: status,
    p_reason: reason,
    ...(reference ? { p_reference: reference } : {}),
  });
  if (error) return fail(error);

  if (courierId) revalidatePath(`/repartidores/${courierId}`);
  revalidatePath("/repartidores");
  const msg = status === "approved" ? "Retiro aprobado." : status === "paid" ? "Retiro marcado como pagado." : "Retiro rechazado y saldo devuelto.";
  return { ok: true, message: msg };
}
