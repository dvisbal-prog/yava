import React, { useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@yava/shared";
import { EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify, confirm } from "@/lib/dialog";
import { OrderCard, ErrorState } from "@/components/customer";
import { NavBar } from "@/components/customer/account/kit";
import { UnderlineTabs } from "@/components/customer/account/parts";
import { useMyOrders, splitOrders, loginHref, type OrderSummaryRow, type OrderItemRow, type MerchantPublic } from "@/features/customer";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";

/**
 * Pantalla 36 · Mis pedidos (tanda-05/36-mis-pedidos.png): chevron + "Mis pedidos", pestañas subrayadas
 * "En curso / Historial" y tarjetas C20b (miniatura, estado, fecha, total, "Ver detalle" + "Volver a pedir").
 */
export default function Orders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      if (!merchant) { notify("Comercio no disponible", "Este comercio ya no está activo."); return; }
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
      if (cart.lines.length && cart.merchant?.id !== cm.id) {
        if (await confirm("Ya tienes una canasta", "¿Quieres reemplazarla con este pedido?", { okText: "Reemplazar", destructive: true })) doIt();
      } else doIt();
    } catch (e) {
      notify("No se pudo repetir el pedido", errorMessage(e));
    }
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(customer)/account" as never));

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <NavBar title="Mis pedidos" onBack={goBack} />
        <EmptyState icon="receipt-outline" title="Inicia sesión para ver tus pedidos" actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/orders") as never)} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar title="Mis pedidos" onBack={goBack} />
      <UnderlineTabs options={[{ value: "active", label: `En curso${active.length ? ` · ${active.length}` : ""}` }, { value: "past", label: "Historial" }]}
        value={tab} onChange={setTab} height={35.1} labelTop={8.6} activeSize={12.7} inactiveSize={13.85} weights={[192.2, 172.1]} style={styles.tabs} />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => { void orders.refetch(); }} tintColor={colors.blue} />}>
        {orders.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={155} style={{ borderRadius: 18 }} />)
        ) : orders.error ? <ErrorState error={orders.error} onRetry={() => { void orders.refetch(); }} /> : !list.length ? (
          tab === "active"
            ? <EmptyState icon="bicycle-outline" title="No tienes pedidos en curso" body="Cuando pidas algo, podrás seguirlo aquí en tiempo real." actionTitle="Pedir ahora" onAction={() => router.replace("/(customer)" as never)} />
            : <EmptyState icon="receipt-outline" title="Aún no tienes pedidos anteriores" body="Tu historial aparecerá aquí." />
        ) : list.map((o) => (
          <OrderCard key={o.id} o={o} onPress={() => router.push(o.status === "delivered" ? `/(customer)/order/${o.id}/delivered` as never : `/(customer)/order/${o.id}` as never)}
            onReorder={o.merchant_id ? () => reorder(o) : undefined} onRate={() => router.push(`/(customer)/order/${o.id}/rate` as never)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  tabs: { marginLeft: 14.8, marginRight: 13.9 },
  list: { paddingHorizontal: 13.4, paddingTop: 11.6, gap: 11.2 },
});
