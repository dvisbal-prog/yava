import React, { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { colors, formatTime } from "@yava/shared";
import { Screen, Header, Text, Button, Card, EmptyState, StatusPill } from "@/components/ui";
import type { OrderStatus } from "@yava/shared";
import { ErrorState, ListSkeleton } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantOrders, useMerchantSetStatus } from "@/features/merchant/useMerchant";
import type { OrderItemRow } from "@/features/merchant/types";
import { parseItemOptions } from "@/features/merchant/types";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";

function elapsed(from: string | null | undefined, now: number): string {
  if (!from) return "--:--";
  const s = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Pantalla 53 · Vista cocina: pedidos en preparación con temporizador. */
export default function MerchantPrepare() {
  const router = useRouter();
  const { data: merchant } = useMyMerchant();
  const ordersQ = useMerchantOrders(merchant?.id, ["accepted", "preparing"]);
  const setStatus = useMerchantSetStatus();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

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

  const mark = async (orderId: string, s: "preparing" | "ready") => {
    try {
      await setStatus.mutateAsync({ orderId, status: s });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert("No se pudo actualizar", errorMessage(e)); }
  };

  return (
    <Screen refreshing={ordersQ.isFetching && !ordersQ.isLoading} onRefresh={() => ordersQ.refetch()} padded={false}>
      <Header title="En preparación" subtitle={`${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`} />
      <View style={{ paddingHorizontal: 16 }}>
        {ordersQ.isLoading ? <ListSkeleton rows={2} height={160} /> : ordersQ.isError ? <ErrorState message={errorMessage(ordersQ.error)} onRetry={() => ordersQ.refetch()} /> : orders.length === 0 ? (
          <EmptyState icon="flame-outline" title="Cocina despejada" body="Los pedidos aceptados aparecerán aquí con su temporizador." actionTitle="Ver pedidos nuevos" onAction={() => router.replace("/(merchant)/orders")} />
        ) : orders.map((o) => {
          const items = (itemsQ.data ?? []).filter((it) => it.order_id === o.id);
          const mins = o.accepted_at ? (now - new Date(o.accepted_at).getTime()) / 60000 : 0;
          const late = o.eta_min != null && mins > o.eta_min;
          return (
            <Card key={o.id ?? ""} style={{ marginBottom: 12 }} onPress={() => router.push(`/(merchant)/order/${o.id}`)}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text variant="title" style={{ flex: 1 }}>#{o.number}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="title" tone={late ? "danger" : "primary"}>{elapsed(o.accepted_at, now)}</Text>
                  <Text variant="small" tone="muted">{o.eta_min ? `Meta ${o.eta_min} min` : `Aceptado ${formatTime(o.accepted_at)}`}</Text>
                </View>
              </View>
              <View style={{ marginTop: 6 }}><StatusPill status={(o.status ?? "preparing") as OrderStatus} /></View>
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
                {items.map((it) => {
                  const opts = parseItemOptions(it.options);
                  return (
                    <View key={it.id} style={{ marginBottom: 6 }}>
                      <Text variant="bodyStrong">{it.qty} x {it.name}</Text>
                      {opts.length ? <Text variant="caption" tone="muted">{opts.map((x) => x.name).join(" · ")}</Text> : null}
                      {it.notes ? <Text variant="caption" tone="warning">Nota: {it.notes}</Text> : null}
                    </View>
                  );
                })}
                {o.notes ? <Text variant="caption" tone="warning">Cliente: {o.notes}</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                {o.status === "accepted" ? <Button title="En preparación" variant="outline" size="md" onPress={() => o.id && mark(o.id, "preparing")} disabled={setStatus.isPending} style={{ flex: 1 }} /> : null}
                <Button title="Listo" size="md" icon="checkmark" onPress={() => o.id && mark(o.id, "ready")} disabled={setStatus.isPending} style={{ flex: 1 }} />
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
