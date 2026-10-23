import { useCallback } from "react";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/store/auth";
import { useNavIntent } from "./stores";

/**
 * Devuelve una función que verifica sesión. Si el usuario es invitado, lo lleva a
 * /(auth)/login guardando a dónde quería ir (`next`). Retorna true si hay sesión.
 */
export function useRequireAuth(): (next?: string) => boolean {
  const session = useAuth((s) => s.session);
  const router = useRouter();
  const pathname = usePathname();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  return useCallback((next?: string) => {
    if (session) return true;
    const target = next ?? pathname;
    setPendingNext(target);
    router.push(`/(auth)/login?next=${encodeURIComponent(target)}` as never);
    return false;
  }, [session, router, pathname, setPendingNext]);
}

export function loginHref(next?: string): string {
  return next ? `/(auth)/login?next=${encodeURIComponent(next)}` : "/(auth)/login";
}
