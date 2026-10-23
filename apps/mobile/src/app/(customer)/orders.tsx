import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius } from "@yava/shared";
import { Screen, Header, Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { OrderCard, ErrorState, ListSkeleton } from "@/components/customer";
import { useMyOrders, splitOrders, loginHref, type OrderSummaryRow, type OrderItemRow, type MerchantPublic } from "@/features/customer";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";

/** Pantalla 36 · Mis pedidos (En curso / Historial). */
export default function Orders() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const orders = useMyOrders();
  useRealtimeOrders(Boolean(session));
  const cart = useCart();
  const [tab, setTab] = useState<"active" | "past">("active");
  const { active, past } = useMemo(() => splitOrders(orders.data ?? []), [orders.data]);
  const list = tab === "active" ? active : past;

  async function reorder(o: OrderSummaryRow) {
    if (!o.merchant_id) return;
    try {
      const [{ data: items, error: ie }, { data: m, error: me }] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", o.id as string),
        supabase.from("merchant_public").select("*").eq("id", o.merchant_id).maybeSingle(),
      ]);
      if (ie) throw ie; if (me) throw me;
      const merchant = m as MerchantPublic | null;
      if (!merchant) { Alert.alert("Comercio no disponible", "Este comercio ya no está activo."); return; }
      const cm = { id: merchant.id ?? "", name: merchant.name ?? "", delivery_fee: merchant.delivery_fee ?? 0, category: merchant.category ?? "food", prep_min: merchant.prep_min ?? 0, prep_max: merchant.prep_max ?? 0 };
      const doIt = () => {
        cart.clear();
        ((items ?? []) as OrderItemRow[]).forEach((it) => {
          if (!it.product_id) return;
          const opts = Array.isArray(it.options) ? (it.options as { option_id: string; group_id: string; name: string; price_delta: number }[]) : [];
          cart.addLine(cm, { product_id: it.product_id, name: it.name, unit_price: it.unit_price, qty: it.qty, notes: it.notes ?? undefined, options: opts });
        });
        router.push("/(customer)/cart" as never);
      };
      if (cart.lines.length && cart.merchant?.id !== cm.id) Alert.alert("Ya tienes una canasta", "¿Quieres reemplazarla con este pedido?", [{ text: "Cancelar", style: "cancel" }, { text: "Reemplazar", style: "destructive", onPress: doIt }]);
      else doIt();
    } catch (e) {
      Alert.alert("No se pudo repetir el pedido", errorMessage(e));
    }
  }

  if (!session) {
    return <Screen><Header title="Mis pedidos" /><EmptyState icon="receipt-outline" title="Inicia sesión para ver tus pedidos" actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/orders") as never)} /></Screen>;
  }

  return (
    <Screen refreshing={orders.isRefetching} onRefresh={() => { void orders.refetch(); }}>
      <Header title="Mis pedidos" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(customer)/account" as never))} />
      <View style={styles.tabs}>
        {(["active", "past"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text variant="bodyStrong" style={{ color: tab === t ? colors.white : colors.gray700 }}>{t === "active" ? `En curso${active.length ? ` · ${active.length}` : ""}` : "Historial"}</Text>
          </Pressable>
        ))}
      </View>
      {orders.isLoading ? <ListSkeleton rows={3} height={56} /> : orders.error ? <ErrorState error={orders.error} onRetry={() => { void orders.refetch(); }} /> : !list.length ? (
        tab === "active"
          ? <EmptyState icon="bicycle-outline" title="No tienes pedidos en curso" body="Cuando pidas algo, podrás seguirlo aquí en tiempo real." actionTitle="Pedir ahora" onAction={() => router.replace("/(customer)" as never)} />
          : <EmptyState icon="receipt-outline" title="Aún no tienes pedidos anteriores" body="Tu historial aparecerá aquí." />
      ) : list.map((o) => (
        <OrderCard key={o.id} o={o} onPress={() => router.push(o.status === "delivered" ? `/(customer)/order/${o.id}/delivered` as never : `/(customer)/order/${o.id}` as never)}
          onReorder={o.merchant_id ? () => reorder(o) : undefined} onRate={() => router.push(`/(customer)/order/${o.id}/rate` as never)} />
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: colors.gray100, borderRadius: radius.pill, padding: 4, marginTop: 8, marginBottom: 16 },
  tab: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.blue },
});
