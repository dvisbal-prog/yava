import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { AdminRole, Tables } from "@yava/shared";
import { createClient } from "@/lib/supabase/server";
import { canAccess, type Section } from "@/lib/roles";

export interface AdminContext {
  userId: string;
  email: string | null;
  role: AdminRole;
  profile: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "email" | "phone"> | null;
}

/** Contexto del administrador actual (cacheado por petición). Redirige si no hay sesión o acceso. */
export const getAdminContext = cache(async (): Promise<AdminContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: admin }, { data: profile }] = await Promise.all([
    supabase.from("admin_users").select("role,status").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name,avatar_url,email,phone").eq("id", user.id).maybeSingle(),
  ]);

  if (!admin || admin.status !== "active") redirect("/sin-acceso");

  return { userId: user.id, email: user.email ?? null, role: admin.role, profile };
});

/** Exige acceso a una sección; si el rol no la tiene, 404 (no se revela su existencia). */
export async function requireSection(section: Section): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!canAccess(ctx.role, section)) notFound();
  return ctx;
}

/** Para server actions: devuelve el contexto o un error legible. */
export async function actionContext(): Promise<{ ctx: AdminContext } | { error: string }> {
  try {
    const ctx = await getAdminContext();
    return { ctx };
  } catch {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
}
