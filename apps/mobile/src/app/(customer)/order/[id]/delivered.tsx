import React from "react";
import { View, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Divider, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { PriceBreakdown, ErrorState } from "@/components/customer";
import { useOrder, useOrderItems, useMyRating, useMerchant, relativeDateTime, type AddressSnapshot } from "@/features/customer";

/** Pantalla 23 · Pedido entregado. */
export default function OrderDelivered() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const items = useOrderItems(id);
  const rating = useMyRating(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const cart = useCart();
  const addr = (o?.address_snapshot ?? {}) as AddressSnapshot;

  function reorder() {
    if (!o || !merchant.data || !items.data) return;
    const m = merchant.data;
    const cm = { id: m.id ?? "", name: m.name ?? "", delivery_fee: m.delivery_fee ?? 0, category: m.category ?? "food", prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0 };
    const doIt = () => {
      cart.clear();
      items.data?.forEach((it) => {
        if (!it.product_id) return;
        const opts = Array.isArray(it.options) ? (it.options as { option_id: string; group_id: string; name: string; price_delta: number }[]) : [];
        cart.addLine(cm, { product_id: it.product_id, name: it.name, unit_price: it.unit_price, qty: it.qty, notes: it.notes ?? undefined, options: opts });
      });
      router.push("/(customer)/cart" as never);
    };
    if (cart.lines.length && cart.merchant?.id !== cm.id) Alert.alert("Ya tienes una canasta", "¿Quieres reemplazarla con este pedido?", [{ text: "Cancelar", style: "cancel" }, { text: "Reemplazar", style: "destructive", onPress: doIt }]);
    else doIt();
  }

  if (order.isLoading && !o) return <Screen><Header title="Pedido" /><View style={{ gap: 12, marginTop: 12 }}><Skeleton height={80} /><Skeleton height={160} /><Skeleton height={120} /></View></Screen>;
  if (order.error || !o) return <Screen><Header title="Pedido" /><ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} /></Screen>;

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        {!rating.data ? <Button title="Calificar pedido" onPress={() => router.push(`/(customer)/order/${id}/rate` as never)} /> : null}
        {o.type !== "shipment" ? <Button title="Volver a pedir" variant={rating.data ? "primary" : "outline"} onPress={reorder} /> : null}
        <Button title="Tuve un problema" variant="ghost" onPress={() => router.push(`/(customer)/support?order=${id}` as never)} />
      </View>
    }>
      <Header title={`Pedido #${o.number}`} onBack={() => (router.canGoBack() ? router.back() : router.replace("/(customer)/orders" as never))} />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" }}><Ionicons name="checkmark" size={26} color={colors.green} /></View>
        <View style={{ marginLeft: 12 }}>
          <Text variant="title">Pedido entregado</Text>
          <Text tone="muted">{relativeDateTime(o.delivered_at)}</Text>
        </View>
      </View>

      {o.merchant_name ? (
        <Card style={{ marginTop: 20, flexDirection: "row", alignItems: "center" }}>
          <Image source={{ uri: o.merchant_logo ?? undefined }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.gray100 }} contentFit="cover" />
          <View style={{ marginLeft: 12, flex: 1 }}><Text variant="bodyStrong">{o.merchant_name}</Text><Text variant="caption" tone="muted">{merchant.data?.tagline ?? ""}</Text></View>
        </Card>
      ) : null}

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 6 }}>Tu pedido</Text>
      {items.isLoading ? <Skeleton height={40} /> : (items.data ?? []).map((it) => (
        <View key={it.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text>{it.name}</Text>
            <Text variant="caption" tone="muted">{it.qty} {it.qty === 1 ? "unidad" : "unidades"}</Text>
          </View>
          <Text>{formatCOP(it.total)}</Text>
        </View>
      ))}
      {o.type === "shipment" ? <Text tone="muted">Envío de paquete</Text> : null}

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 6 }}>Resumen de pago</Text>
      <PriceBreakdown subtotal={o.items_subtotal ?? 0} deliveryFee={o.delivery_fee ?? 0} serviceFee={o.service_fee ?? 0} discount={o.discount ?? 0} total={o.total ?? 0} totalLabel="Total pagado" />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <Ionicons name={o.payment_method === "cash" ? "cash-outline" : o.payment_method === "card" ? "card-outline" : "phone-portrait-outline"} size={18} color={colors.gray500} />
        <Text variant="caption" tone="muted" style={{ marginLeft: 8 }}>{o.payment_method === "cash" ? "Efectivo" : o.payment_method === "card" ? "Tarjeta" : "Nequi / Daviplata"}</Text>
      </View>

      <Divider space={16} />
      <Text variant="heading" style={{ marginBottom: 6 }}>Entregado en</Text>
      <Text variant="bodyStrong">{addr.label ?? "Dirección"}</Text>
      <Text tone="muted">{[addr.line1, addr.line2].filter(Boolean).join(", ")}</Text>
    </Screen>
  );
}
