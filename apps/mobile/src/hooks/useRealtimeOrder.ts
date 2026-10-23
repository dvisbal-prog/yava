import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";

/** Suscribe a cambios de un pedido y refresca las queries relacionadas. */
export function useRealtimeOrder(orderId: string | undefined) {
  useEffect(() => {
    if (!orderId) return;
    const ch = supabase
      .channel(`order:${orderId}`)
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
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);
}

/** Suscribe a todos los pedidos visibles (comercio / repartidor / cliente). */
export function useRealtimeOrders(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel("orders:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
        queryClient.invalidateQueries({ queryKey: ["courier"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [enabled]);
}
