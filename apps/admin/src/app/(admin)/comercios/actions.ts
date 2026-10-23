"use server";

import { revalidatePath } from "next/cache";
import { Constants, type MerchantStatus } from "@yava/shared";
import { actionContext } from "@/lib/auth";
import { canEditCommission, canManageMerchants } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { fail, num, requireReason, str, type ActionResult } from "@/lib/actions";

function isMerchantStatus(v: string): v is MerchantStatus {
  return (Constants.public.Enums.merchant_status as readonly string[]).includes(v);
}

export async function setMerchantStatusAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageMerchants(auth.ctx.role)) return { ok: false, error: "Solo owner u operaciones cambian el estado de comercios." };
  const id = str(fd, "id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (!isMerchantStatus(status)) return { ok: false, error: "Estado no válido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_merchant_status", { p_id: id, p_status: status, p_reason: reason });
  if (error) return fail(error);
  revalidatePath(`/comercios/${id}`);
  revalidatePath("/comercios");
  return { ok: true, message: "Estado del comercio actualizado." };
}

export async function reviewMerchantDocumentAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageMerchants(auth.ctx.role)) return { ok: false, error: "Sin permiso para revisar documentos." };
  const docId = str(fd, "doc_id");
  const merchantId = str(fd, "merchant_id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!docId || !reason || (status !== "approved" && status !== "rejected")) return { ok: false, error: "Datos incompletos." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("merchant_documents").select("status,doc_type").eq("id", docId).single();
  const { error } = await supabase
    .from("merchant_documents")
    .update({ status, notes: reason, reviewed_by: auth.ctx.userId, reviewed_at: new Date().toISOString() })
    .eq("id", docId);
  if (error) return fail(error);
  await supabase.rpc("audit", {
    p_action: `merchant_document.${status}`,
    p_entity: "merchant_document",
    p_entity_id: docId,
    p_reason: reason,
    p_before: before ? { status: before.status, doc_type: before.doc_type } : null,
    p_after: { status, merchant_id: merchantId },
  });
  revalidatePath(`/comercios/${merchantId}`);
  return { ok: true, message: status === "approved" ? "Documento aprobado." : "Documento rechazado." };
}

export async function toggleProductAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageMerchants(auth.ctx.role)) return { ok: false, error: "Sin permiso para gestionar el catálogo." };
  const productId = str(fd, "product_id");
  const merchantId = str(fd, "merchant_id");
  const status = str(fd, "status");
  if (!productId || (status !== "paused" && status !== "published")) return { ok: false, error: "Datos incompletos." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("products").select("status,name").eq("id", productId).single();
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return fail(error);
  await supabase.rpc("audit", {
    p_action: `product.${status}`,
    p_entity: "product",
    p_entity_id: productId,
    p_reason: status === "paused" ? "Pausado desde administración" : "Activado desde administración",
    p_before: before ? { status: before.status } : null,
    p_after: { status, name: before?.name ?? null, merchant_id: merchantId },
  });
  revalidatePath(`/comercios/${merchantId}`);
  return { ok: true, message: status === "paused" ? "Producto pausado." : "Producto activado." };
}

export async function updateCommissionAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canEditCommission(auth.ctx.role)) return { ok: false, error: "Solo owner o finanzas editan la comisión." };
  const id = str(fd, "id");
  const pct = num(fd, "commission_pct");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (pct === null || pct < 0 || pct > 50) return { ok: false, error: "La comisión debe estar entre 0 % y 50 %." };
  const rate = Math.round(pct * 100) / 10000;
  const supabase = await createClient();
  const { data: before } = await supabase.from("merchants").select("commission_rate").eq("id", id).single();
  const { error } = await supabase.from("merchants").update({ commission_rate: rate }).eq("id", id);
  if (error) return fail(error);
  await supabase.rpc("audit", {
    p_action: "merchant.commission",
    p_entity: "merchant",
    p_entity_id: id,
    p_reason: reason,
    p_before: { commission_rate: before?.commission_rate ?? null },
    p_after: { commission_rate: rate },
  });
  revalidatePath(`/comercios/${id}`);
  revalidatePath("/comercios");
  return { ok: true, message: "Comisión actualizada. Aplica a nuevos pedidos." };
}
