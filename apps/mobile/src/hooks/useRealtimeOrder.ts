import { useEffect, useId } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";

/**
 * Topic único por instancia del hook. supabase-js reutiliza el canal si el topic ya existe, y agregar
 * `.on(...)` a un canal ya suscrito lanza un error: por eso seguimiento (21) + chat (22) montados a la vez
 * con el mismo `order:${id}` hacían caer la app. useId() da un id estable y distinto por instancia.
 */
function useChannelSuffix() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Suscribe a cambios de un pedido y refresca las queries relacionadas. */
export function useRealtimeOrder(orderId: string | undefined) {
  const suffix = useChannelSuffix();
  useEffect(() => {
    if (!orderId) return;
    const ch = supabase
      .channel(`order:${orderId}:${suffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["order-messages", orderId] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_events", filter: `order_id=eq.${orderId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["order-events", orderId] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [orderId, suffix]);
}

/** Suscribe a todos los pedidos visibles (comercio / repartidor / cliente). */
export function useRealtimeOrders(enabled = true) {
  const suffix = useChannelSuffix();
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel(`orders:all:${suffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
        queryClient.invalidateQueries({ queryKey: ["courier"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [enabled, suffix]);
}
