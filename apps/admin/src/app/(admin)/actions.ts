"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CITY_COOKIE } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";

export async function setCityAction(cityId: string): Promise<void> {
  const store = await cookies();
  if (!cityId || cityId === "all") store.delete(CITY_COOKIE);
  else store.set(CITY_COOKIE, cityId, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
