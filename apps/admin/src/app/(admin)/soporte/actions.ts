"use server";

import { revalidatePath } from "next/cache";
import { actionContext, type AdminContext } from "@/lib/auth";
import { canManageSupport } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { fail, requireReason, str, type ActionResult } from "@/lib/actions";

async function supportCtx(): Promise<{ ctx: AdminContext } | { error: string }> {
  const auth = await actionContext();
  if ("error" in auth) return { error: auth.error };
  if (!canManageSupport(auth.ctx.role)) return { error: "Tu rol no gestiona casos de soporte." };
  return { ctx: auth.ctx };
}

export async function assignToMeAction(fd: FormData): Promise<ActionResult> {
  const auth = await supportCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const supabase = await createClient();
  const { error } = await supabase.from("support_cases").update({ assigned_to: auth.ctx.userId, status: "in_progress" }).eq("id", id).in("status", ["open", "in_progress"]);
  if (error) return fail(error);
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/soporte");
  return { ok: true, message: "Caso asignado a ti." };
}

export async function sendSupportMessageAction(fd: FormData): Promise<ActionResult> {
  const auth = await supportCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const body = str(fd, "body");
  const internal = str(fd, "internal") === "1";
  if (!id || body.length === 0) return { ok: false, error: "Escribe un mensaje." };
  const supabase = await createClient();
  const { error } = await supabase.from("support_messages").insert({ case_id: id, sender_id: auth.ctx.userId, body, internal });
  if (error) return fail(error);
  // Si estaba abierto, pasa a en revisión al responder.
  await supabase.from("support_cases").update({ status: "in_progress", assigned_to: auth.ctx.userId }).eq("id", id).eq("status", "open");
  revalidatePath(`/soporte/${id}`);
  return { ok: true, message: internal ? "Nota interna guardada." : "Respuesta enviada." };
}

export async function setPriorityAction(fd: FormData): Promise<ActionResult> {
  const auth = await supportCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const priority = str(fd, "priority");
  if (!["baja", "normal", "alta", "urgente"].includes(priority)) return { ok: false, error: "Prioridad no válida." };
  const supabase = await createClient();
  const { error } = await supabase.from("support_cases").update({ priority }).eq("id", id);
  if (error) return fail(error);
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/soporte");
  return { ok: true, message: "Prioridad actualizada." };
}

export async function resolveCaseAction(fd: FormData): Promise<ActionResult> {
  const auth = await supportCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const status = str(fd, "status") === "closed" ? "closed" : "resolved";
  const resolution = requireReason(fd.get("reason"));
  if (!id || !resolution) return { ok: false, error: "Describe la resolución." };
  const supabase = await createClient();
  const { error } = await supabase.from("support_cases").update({ status, resolution, resolved_at: new Date().toISOString(), assigned_to: auth.ctx.userId }).eq("id", id);
  if (error) return fail(error);
  await supabase.from("support_messages").insert({ case_id: id, sender_id: auth.ctx.userId, body: `Caso ${status === "closed" ? "cerrado" : "resuelto"}: ${resolution}`, internal: false });
  await supabase.rpc("audit", { p_action: `support_case.${status}`, p_entity: "support_case", p_entity_id: id, p_reason: resolution, p_before: null, p_after: { status } });
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/soporte");
  return { ok: true, message: status === "closed" ? "Caso cerrado." : "Caso resuelto." };
}

export async function reopenCaseAction(fd: FormData): Promise<ActionResult> {
  const auth = await supportCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  const supabase = await createClient();
  const { error } = await supabase.from("support_cases").update({ status: "in_progress", resolution: null, resolved_at: null }).eq("id", id);
  if (error) return fail(error);
  await supabase.from("support_messages").insert({ case_id: id, sender_id: auth.ctx.userId, body: `Caso reabierto: ${reason}`, internal: true });
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/soporte");
  return { ok: true, message: "Caso reabierto." };
}
