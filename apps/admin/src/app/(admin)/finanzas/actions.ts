"use server";

import { revalidatePath } from "next/cache";
import type { SettlementStatus } from "@yava/shared";
import { actionContext, type AdminContext } from "@/lib/auth";
import { canManageFinance } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { fail, num, requireReason, str, type ActionResult } from "@/lib/actions";

async function financeCtx(): Promise<{ ctx: AdminContext } | { error: string }> {
  const auth = await actionContext();
  if ("error" in auth) return { error: auth.error };
  if (!canManageFinance(auth.ctx.role)) return { error: "Solo owner o finanzas pueden hacer esto." };
  return { ctx: auth.ctx };
}

export async function createExpenseAction(fd: FormData): Promise<ActionResult> {
  const auth = await financeCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const date = str(fd, "date");
  const city = str(fd, "city_id");
  const category = str(fd, "category");
  const description = str(fd, "description");
  const amount = num(fd, "amount");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Fecha no válida." };
  if (!category) return { ok: false, error: "Indica la categoría." };
  if (amount === null || amount <= 0) return { ok: false, error: "El monto debe ser mayor que cero." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operating_expenses")
    .insert({ date, city_id: city || null, category, description: description || null, amount: Math.round(amount), created_by: auth.ctx.userId })
    .select("id")
    .single();
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "expense.create", p_entity: "operating_expense", p_entity_id: data.id, p_reason: description || category, p_before: null, p_after: { date, category, amount: Math.round(amount), city_id: city || null } });
  revalidatePath("/finanzas/ingresos");
  return { ok: true, message: "Gasto registrado." };
}

export async function deleteExpenseAction(fd: FormData): Promise<ActionResult> {
  const auth = await financeCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("operating_expenses").select("date,category,amount,description").eq("id", id).single();
  const { error } = await supabase.from("operating_expenses").delete().eq("id", id);
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "expense.delete", p_entity: "operating_expense", p_entity_id: id, p_reason: reason, p_before: before ?? null, p_after: null });
  revalidatePath("/finanzas/ingresos");
  return { ok: true, message: "Gasto eliminado." };
}

export async function generateSettlementsAction(fd: FormData): Promise<ActionResult> {
  const auth = await financeCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const start = str(fd, "start");
  const end = str(fd, "end");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return { ok: false, error: "Indica el período completo." };
  if (start > end) return { ok: false, error: "La fecha inicial debe ser anterior a la final." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_generate_settlements", { p_start: start, p_end: end });
  if (error) return fail(error);
  revalidatePath("/finanzas/liquidaciones");
  return { ok: true, message: data === 0 ? "No hay pedidos entregados sin liquidar en ese período." : `Se generaron ${data} liquidación(es) pendientes.` };
}

export async function settlementTransitionAction(fd: FormData): Promise<ActionResult> {
  const auth = await financeCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const status = str(fd, "status");
  const reference = str(fd, "reference");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  if (status !== "approved" && status !== "paid" && status !== "rejected") return { ok: false, error: "Transición no válida." };
  if (status === "paid" && reference.length < 3) return { ok: false, error: "La referencia de la transferencia es obligatoria." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_settlement_transition", {
    p_id: id,
    p_status: status as SettlementStatus,
    p_reason: reason,
    ...(reference ? { p_reference: reference } : {}),
  });
  if (error) return fail(error);
  revalidatePath(`/finanzas/liquidaciones/${id}`);
  revalidatePath("/finanzas/liquidaciones");
  const msg = status === "approved" ? "Liquidación aprobada." : status === "paid" ? "Liquidación marcada como pagada." : "Liquidación rechazada.";
  return { ok: true, message: msg };
}
