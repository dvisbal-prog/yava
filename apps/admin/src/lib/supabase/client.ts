"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@yava/shared";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Cliente de Supabase para componentes cliente (singleton por pestaña). */
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}
