import { useEffect, useState, useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";

const HEALTH_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""}/auth/v1/health`;
const RETRY_MS = 15_000;

function isNetworkError(e: unknown): boolean {
  const msg = typeof e === "string" ? e : ((e as { message?: string } | null)?.message ?? "");
  return /network request failed|failed to fetch|network|fetch/i.test(msg);
}

/**
 * Detecta pérdida de conexión sin @react-native-community/netinfo:
 * cuando una query falla por red, marca offline y reintenta un `fetch` liviano cada 15 s.
 */
export function useOnline(): { online: boolean; retry: () => Promise<void> } {
  const [online, setOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (res.ok || res.status < 500) {
        setOnline(true);
        onlineManager.setOnline(true);
        queryClient.invalidateQueries();
      }
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && isNetworkError(event.action.error)) {
        setOnline(false);
        onlineManager.setOnline(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (online) return;
    const id = setInterval(() => { void check(); }, RETRY_MS);
    return () => clearInterval(id);
  }, [online, check]);

  return { online, retry: check };
}
