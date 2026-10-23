import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@yava/shared";
import { env } from "@/lib/env";

/** Cliente de Supabase para server components, server actions y route handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un server component: el proxy ya refresca la sesión.
        }
      },
    },
  });
}

export type ServerClient = Awaited<ReturnType<typeof createClient>>;
