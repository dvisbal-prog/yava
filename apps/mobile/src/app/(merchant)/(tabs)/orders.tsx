import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Screen, Text, Button, EmptyState } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { OrderCard } from "@/components/merchant/OrderCard";
import { ErrorState, ListSkeleton, StatusDot } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantOrders } from "@/features/merchant/useMerchant";
import type { OrderItemRow } from "@/features/merchant/types";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";

type Seg = "new" | "preparing" | "ready";
const SEG_STATUSES: Record<Seg, string[]> = { new: ["placed"], preparing: ["accepted", "preparing"], ready: ["ready", "assigned"] };

/** Pantalla 51 · Pedidos del comercio. */
export default function MerchantOrders() {
  const router = useRouter();
  const { data: merchant } = useMyMerchant();
  const ordersQ = useMerchantOrders(merchant?.id, ["placed", "accepted", "preparing", "ready", "assigned"]);
  const [seg, setSeg] = useState<Seg>("new");
  const orders = ordersQ.data ?? [];
  const ids = orders.map((o) => o.id ?? "").filter(Boolean);

  const itemsQ = useQuery({
    queryKey: ["order-items", "many", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<OrderItemRow[]> => {
      const { data, error } = await supabase.from("order_items").select("*").in("order_id", ids);
      if (error) throw error;
      return (data ?? []) as OrderItemRow[];
    },
  });

  // Sonido + haptic cuando llega un pedido nuevo
  const knownNew = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!ordersQ.data) return;
    const current = new Set(ordersQ.data.filter((o) => o.status === "placed").map((o) => o.id ?? ""));
    if (knownNew.current) {
      const fresh = [...current].filter((id) => !knownNew.current?.has(id));
      if (fresh.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Notifications.scheduleNotificationAsync({ content: { title: "Nuevo pedido", body: `${fresh.length === 1 ? "Tienes un pedido nuevo" : `Tienes ${fresh.length} pedidos nuevos`} por aceptar.`, sound: true }, trigger: null }).catch(() => {});
      }
    }
    knownNew.current = current;
  }, [ordersQ.data]);

  const counts = useMemo(() => ({
    new: orders.filter((o) => SEG_STATUSES.new.includes(o.status ?? "")).length,
    preparing: orders.filter((o) => SEG_STATUSES.preparing.includes(o.status ?? "")).length,
    ready: orders.filter((o) => SEG_STATUSES.ready.includes(o.status ?? "")).length,
  }), [orders]);
  const visible = orders.filter((o) => SEG_STATUSES[seg].includes(o.status ?? ""));
  const isOpen = !!merchant && !merchant.manual_closed && merchant.accepts_orders;

  return (
    <Screen refreshing={ordersQ.isFetching && !ordersQ.isLoading} onRefresh={() => ordersQ.refetch()}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Pedidos</Text>
          <Text variant="caption" tone="muted">{merchant?.name ?? ""}</Text>
        </View>
        <StatusDot label={isOpen ? "Disponible" : "Cerrado"} active={isOpen} />
      </View>
      <Segmented value={seg} onChange={setSeg} items={[
        { key: "new", label: "Nuevos", count: counts.new },
        { key: "preparing", label: "En preparación", count: counts.preparing },
        { key: "ready", label: "Listos", count: counts.ready },
      ]} />
      <View style={{ height: 14 }} />
      {ordersQ.isLoading ? <ListSkeleton rows={3} height={180} /> : ordersQ.isError ? <ErrorState message={errorMessage(ordersQ.error)} onRetry={() => ordersQ.refetch()} /> : visible.length === 0 ? (
        <EmptyState icon={seg === "new" ? "notifications-outline" : seg === "preparing" ? "flame-outline" : "bag-check-outline"}
          title={seg === "new" ? "Sin pedidos nuevos" : seg === "preparing" ? "Nada en preparación" : "Nada listo por entregar"}
          body={seg === "new" ? "Los pedidos nuevos aparecerán aquí al instante." : seg === "preparing" ? "Acepta un pedido para empezar a prepararlo." : "Cuando marques un pedido como listo, aparecerá aquí hasta que el repartidor lo recoja."} />
      ) : visible.map((o) => (
        <OrderCard key={o.id ?? ""} order={o} items={(itemsQ.data ?? []).filter((it) => it.order_id === o.id)} onPress={() => router.push(`/(merchant)/order/${o.id}`)} />
      ))}
      {seg === "preparing" && counts.preparing > 0 ? <Button title="Abrir vista cocina" variant="secondary" icon="flame-outline" onPress={() => router.push("/(merchant)/prepare")} /> : null}
    </Screen>
  );
}
