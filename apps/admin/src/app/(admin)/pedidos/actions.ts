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

type OrderAction = "cancel" | "release_courier" | "force_status";

/**
 * Toda acción administrativa sobre un pedido pasa por admin_order_action: aplica el cambio con bloqueo de fila,
 * deja la nota "Admin · …: motivo" en la línea de tiempo (order_events) y registra la auditoría, en una sola transacción.
 */
async function runOrderAction(id: string, action: OrderAction, reason: string, status?: OrderStatus): Promise<ActionResult | null> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_order_action", {
    p_order_id: id,
    p_action: action,
    p_reason: reason,
    ...(status ? { p_status: status } : {}),
  });
  if (error) return fail(error);
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
  return null;
}

export async function cancelOrderAction(fd: FormData): Promise<ActionResult> {
  const auth = await actionContext();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!canManageOrders(auth.ctx.role)) return { ok: false, error: "Tu rol solo permite consultar pedidos." };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };

  const failed = await runOrderAction(id, "cancel", reason);
  if (failed) return failed;
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
  const { data: before, error: e1 } = await supabase.from("orders").select("status,courier_id").eq("id", id).single();
  if (e1 || !before) return fail(e1, "Pedido no encontrado.");
  if (before.status === "delivered" || before.status === "cancelled") return { ok: false, error: "El pedido ya terminó; no se puede reasignar." };
  if (!before.courier_id) return { ok: false, error: "El pedido no tiene repartidor asignado." };

  // El RPC conserva el estado de preparación del comercio (no lo marca "Listo" antes de tiempo).
  const failed = await runOrderAction(id, "release_courier", reason);
  if (failed) return failed;
  return { ok: true, message: "Repartidor liberado. El pedido vuelve a estar disponible para otros repartidores." };
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

  // "Cancelado" usa la cancelación completa (motivo, reembolso pendiente y aviso al cliente).
  const failed = status === "cancelled" ? await runOrderAction(id, "cancel", reason) : await runOrderAction(id, "force_status", reason, status);
  if (failed) return failed;
  return { ok: true, message: status === "cancelled" ? "Pedido cancelado." : "Estado actualizado." };
}
