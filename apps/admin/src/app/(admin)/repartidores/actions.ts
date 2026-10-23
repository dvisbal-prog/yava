"use server";

import { revalidatePath } from "next/cache";
import { Constants, type CourierStatus } from "@yava/shared";
import { actionContext } from "@/lib/auth";
import { canManageFinance, canManageMerchants } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
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
  const { data: before, error: e1 } = await supabase.from("courier_withdrawals").select("status,amount,courier_id").eq("id", id).single();
  if (e1 || !before) return fail(e1, "Retiro no encontrado.");
  if (status === "approved" && before.status !== "pending") return { ok: false, error: "Solo se aprueban retiros pendientes." };
  if (status === "paid" && before.status !== "approved") return { ok: false, error: "Primero debe aprobarse." };
  if (status === "rejected" && before.status === "paid") return { ok: false, error: "Un retiro pagado no se puede rechazar." };

  const { error } = await supabase
    .from("courier_withdrawals")
    .update({ status, processed_by: auth.ctx.userId, processed_at: new Date().toISOString(), ...(reference ? { reference } : {}) })
    .eq("id", id);
  if (error) return fail(error);

  if (status === "rejected") {
    // Devolver el saldo al repartidor (request_withdrawal lo descontó al solicitar).
    const { data: c } = await supabase.from("couriers").select("balance").eq("user_id", before.courier_id).single();
    if (c) await supabase.from("couriers").update({ balance: c.balance + before.amount }).eq("user_id", before.courier_id);
  }

  await supabase.rpc("audit", {
    p_action: `withdrawal.${status}`,
    p_entity: "courier_withdrawal",
    p_entity_id: id,
    p_reason: reason,
    p_before: { status: before.status, amount: before.amount },
    p_after: { status, reference: reference || null },
  });
  revalidatePath(`/repartidores/${courierId}`);
  const msg = status === "approved" ? "Retiro aprobado." : status === "paid" ? "Retiro marcado como pagado." : "Retiro rechazado y saldo devuelto.";
  return { ok: true, message: msg };
}
