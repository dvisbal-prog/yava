"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@yava/shared";
import { Constants } from "@yava/shared";
import { actionContext } from "@/lib/auth";
import { canManageOrders } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { fail, requireReason, str, type ActionResult } from "@/lib/actions";

function isOrderStatus(v: string): v is OrderStatus {
  return (Constants.public.Enums.order_status as readonly string[]).includes(v);
}

export async function cancelOrderAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageOrders(auth.ctx.role)) return { ok: false, error: "Tu rol solo permite consultar pedidos." };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: id, p_reason: reason });
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "order.cancel", p_entity: "order", p_entity_id: id, p_reason: reason, p_before: null, p_after: { status: "cancelled" } });
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
  return { ok: true, message: "Pedido cancelado." };
}

export async function reassignCourierAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageOrders(auth.ctx.role)) return { ok: false, error: "Tu rol solo permite consultar pedidos." };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };

  const supabase = await createClient();
  const { data: before, error: e1 } = await supabase.from("orders").select("id,status,courier_id,type").eq("id", id).single();
  if (e1 || !before) return fail(e1, "Pedido no encontrado.");
  if (["delivered", "cancelled"].includes(before.status)) return { ok: false, error: "El pedido ya terminó; no se puede reasignar." };

  // Vuelve a quedar disponible para repartidores: sin courier y en estado listo (o nuevo si es envío).
  const nextStatus: OrderStatus = before.type === "shipment" ? "placed" : "ready";
  const { error } = await supabase.from("orders").update({ courier_id: null, status: nextStatus, assigned_at: null }).eq("id", id);
  if (error) return fail(error);
  await supabase.rpc("audit", {
    p_action: "order.reassign",
    p_entity: "order",
    p_entity_id: id,
    p_reason: reason,
    p_before: { status: before.status, courier_id: before.courier_id },
    p_after: { status: nextStatus, courier_id: null, note: "Repartidor liberado por administración" },
  });
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
  return { ok: true, message: "Repartidor liberado. El pedido vuelve a estar disponible." };
}

export async function forceStatusAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageOrders(auth.ctx.role)) return { ok: false, error: "Solo owner u operaciones pueden forzar estados." };
  const id = str(fd, "id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (!isOrderStatus(status)) return { ok: false, error: "Estado no válido." };

  const supabase = await createClient();
  const { data: before, error: e1 } = await supabase.from("orders").select("status").eq("id", id).single();
  if (e1 || !before) return fail(e1, "Pedido no encontrado.");
  if (before.status === status) return { ok: false, error: "El pedido ya está en ese estado." };
  const { error } = await supabase.from("orders").update({ status, ...(status === "cancelled" ? { cancel_reason: reason } : {}) }).eq("id", id);
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "order.force_status", p_entity: "order", p_entity_id: id, p_reason: reason, p_before: { status: before.status }, p_after: { status } });
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
  return { ok: true, message: "Estado actualizado." };
}
