"use server";

import { revalidatePath } from "next/cache";
import { Constants, type AdminRole } from "@yava/shared";
import { actionContext, type AdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fail, requireReason, str, type ActionResult } from "@/lib/actions";

function isRole(v: string): v is AdminRole {
  return (Constants.public.Enums.admin_role as readonly string[]).includes(v);
}

async function ownerCtx(): Promise<{ ctx: AdminContext } | { error: string }> {
  const auth = await actionContext();
  if ("error" in auth) return { error: auth.error };
  if (auth.ctx.role !== "owner") return { error: "Solo el owner gestiona el equipo." };
  return { ctx: auth.ctx };
}

export async function inviteAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Correo no válido." };
  if (!isRole(role)) return { ok: false, error: "Rol no válido." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_invite", { p_email: email, p_role: role });
  if (error) return fail(error);
  revalidatePath("/equipo");
  return { ok: true, message: "Invitación creada. Copia el enlace y compártelo.", data: { token: data.token, email } };
}

export async function changeRoleAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const userId = str(fd, "user_id");
  const role = str(fd, "role");
  const reason = requireReason(fd.get("reason"));
  if (!userId || !reason) return { ok: false, error: "Indica un motivo." };
  if (!isRole(role)) return { ok: false, error: "Rol no válido." };
  if (userId === auth.ctx.userId && role !== "owner") return { ok: false, error: "No puedes quitarte el rol de owner a ti mismo." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("admin_users").select("role,status").eq("user_id", userId).single();
  const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", userId);
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "admin_user.role", p_entity: "admin_user", p_entity_id: userId, p_reason: reason, p_before: before ? { role: before.role } : null, p_after: { role } });
  revalidatePath("/equipo");
  return { ok: true, message: "Rol actualizado." };
}

export async function setMemberStatusAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const userId = str(fd, "user_id");
  const status = str(fd, "status");
  const reason = requireReason(fd.get("reason"));
  if (!userId || !reason) return { ok: false, error: "Indica un motivo." };
  if (status !== "active" && status !== "disabled") return { ok: false, error: "Estado no válido." };
  if (userId === auth.ctx.userId) return { ok: false, error: "No puedes deshabilitar tu propia cuenta." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("admin_users").select("status").eq("user_id", userId).single();
  const { error } = await supabase.from("admin_users").update({ status }).eq("user_id", userId);
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: `admin_user.${status}`, p_entity: "admin_user", p_entity_id: userId, p_reason: reason, p_before: before ? { status: before.status } : null, p_after: { status } });
  revalidatePath("/equipo");
  return { ok: true, message: status === "disabled" ? "Integrante deshabilitado." : "Integrante habilitado." };
}
