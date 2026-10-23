import React from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatDate, formatTime } from "@yava/shared";
import { Screen, Header, Text, Button, StatusPill, Divider, Skeleton } from "@/components/ui";
import { PriceBreakdown, ErrorState } from "@/components/customer";
import { useOrder, useOrderItems, type AddressSnapshot } from "@/features/customer";

/** Detalle del pedido: ítems, desglose, dirección y pago. */
export default function OrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const items = useOrderItems(id);
  const o = order.data;
  const addr = (o?.address_snapshot ?? {}) as AddressSnapshot;

  if (order.isLoading && !o) return <Screen><Header title="Detalle" /><View style={{ gap: 12, marginTop: 12 }}><Skeleton height={60} /><Skeleton height={140} /></View></Screen>;
  if (order.error || !o) return <Screen><Header title="Detalle" /><ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} /></Screen>;

  return (
    <Screen footer={o.status === "delivered" ? <Button title="Tuve un problema" variant="outline" onPress={() => router.push(`/(customer)/support?order=${id}` as never)} /> : undefined}>
      <Header title={`Pedido #${o.number}`} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <View><Text variant="heading">{o.type === "shipment" ? "Envío" : o.merchant_name}</Text><Text variant="caption" tone="muted">{formatDate(o.placed_at)} · {formatTime(o.placed_at)}</Text></View>
        {o.status ? <StatusPill status={o.status} /> : null}
      </View>
      <Divider space={16} />
      <Text variant="heading" style={{ marginBottom: 6 }}>Productos</Text>
      {items.isLoading ? <Skeleton height={40} /> : !items.data?.length ? <Text tone="muted">{o.type === "shipment" ? "Paquete punto a punto" : "Sin productos"}</Text> : items.data.map((it) => {
        const opts = Array.isArray(it.options) ? (it.options as { name: string }[]) : [];
        return (
          <View key={it.id} style={{ flexDirection: "row", paddingVertical: 8 }}>
            <Text variant="bodyStrong" style={{ width: 32 }}>{it.qty}×</Text>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text>{it.name}</Text>
              {opts.length ? <Text variant="caption" tone="muted">{opts.map((x) => x.name).join(", ")}</Text> : null}
              {it.notes ? <Text variant="caption" tone="subtle">“{it.notes}”</Text> : null}
            </View>
            <Text>{formatCOP(it.total)}</Text>
          </View>
        );
      })}
      {o.notes ? <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>Instrucciones: {o.notes}</Text> : null}
      <Divider space={16} />
      <Text variant="heading" style={{ marginBottom: 6 }}>Resumen de pago</Text>
      <PriceBreakdown subtotal={o.items_subtotal ?? 0} deliveryFee={o.delivery_fee ?? 0} serviceFee={o.service_fee ?? 0} discount={o.discount ?? 0} total={o.total ?? 0} />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <Ionicons name={o.payment_method === "cash" ? "cash-outline" : o.payment_method === "card" ? "card-outline" : "phone-portrait-outline"} size={18} color={colors.gray500} />
        <Text variant="caption" tone="muted" style={{ marginLeft: 8 }}>{o.payment_method === "cash" ? "Efectivo" : o.payment_method === "card" ? "Tarjeta" : "Nequi / Daviplata"} · {o.payment_status === "paid" ? "Pagado" : "Pendiente"}</Text>
      </View>
      <Divider space={16} />
      <Text variant="heading" style={{ marginBottom: 6 }}>Dirección</Text>
      <Text variant="bodyStrong">{addr.label ?? "Entrega"}</Text>
      <Text tone="muted">{[addr.line1, addr.line2].filter(Boolean).join(", ")}</Text>
      {addr.instructions ? <Text variant="caption" tone="subtle">{addr.instructions}</Text> : null}
    </Screen>
  );
}
