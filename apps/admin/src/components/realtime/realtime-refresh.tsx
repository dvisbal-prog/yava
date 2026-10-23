"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Se suscribe a cambios Realtime de una tabla y refresca el server component.
 * Agrupa ráfagas de eventos (debounce) para no saturar el servidor.
 */
export function RealtimeRefresh({ table, filter, debounceMs = 800 }: { table: string; filter?: string; debounceMs?: number }) {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-${table}-${filter ?? "all"}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, () => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => router.refresh(), debounceMs);
      })
      .subscribe();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [table, filter, debounceMs, router]);

  return null;
}
