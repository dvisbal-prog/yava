import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Text, Button, Card, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ErrorState } from "@/components/customer";
import { useOrder, etaLabel } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

const PAYMENT_WAIT_MS = 45_000;

/** Pantalla 20 · Pedido confirmado (también destino del redirect de Wompi). */
export default function OrderConfirmed() {
  const router = useRouter();
  const { id, retry } = useLocalSearchParams<{ id: string; retry?: string }>();
  const cart = useCart();
  const order = useOrder(id, { refetchInterval: 3000 });
  useRealtimeOrder(id);
  const [startedAt] = useState(Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const o = order.data;
  const waitingCard = o?.payment_method === "card" && o.status === "pending_payment" && o.payment_status !== "paid";

  useEffect(() => {
    if (!waitingCard) return;
    const id2 = setInterval(() => { if (Date.now() - startedAt > PAYMENT_WAIT_MS) setTimedOut(true); }, 1000);
    return () => clearInterval(id2);
  }, [waitingCard, startedAt]);

  // Con tarjeta la canasta se vacía solo cuando el pago quedó confirmado.
  useEffect(() => {
    if (o && !waitingCard && o.status !== "cancelled" && cart.lines.length) cart.clear();
  }, [o, waitingCard, cart]);

  useEffect(() => {
    if (o?.payment_method !== "card") return;
    if (o.payment_status !== "failed" && o.status !== "cancelled") return;
    // Reintento desde la pantalla 45: el "failed" es del intento anterior hasta que el pedido cambie después de `retry`.
    const retryFrom = retry ? Date.parse(retry) : NaN;
    if (o.status !== "cancelled" && !Number.isNaN(retryFrom) && (!o.updated_at || Date.parse(o.updated_at) <= retryFrom)) return;
    router.replace(`/(customer)/order/${id}/payment-failed` as never);
  }, [o, id, router, retry]);

  if (order.isLoading && !o) {
    return <Screen><View style={{ alignItems: "center", marginTop: 80, gap: 12 }}><Skeleton width={96} height={96} style={{ borderRadius: 48 }} /><Skeleton width="60%" height={24} /><Skeleton width="80%" height={14} /></View></Screen>;
  }
  if (order.error || !o) {
    return <Screen><ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} /><Button title="Ir al inicio" variant="ghost" onPress={() => router.replace("/(customer)" as never)} /></Screen>;
  }

  if (waitingCard) {
    return (
      <Screen footer={timedOut ? <View style={{ gap: 8 }}><Button title="Ver opciones de pago" onPress={() => router.replace(`/(customer)/order/${id}/payment-failed` as never)} /></View> : undefined}>
        <View style={styles.center}>
          <View style={[styles.circle, { backgroundColor: colors.yellowSoft }]}><Ionicons name="card-outline" size={44} color="#8A6400" /></View>
          <Text variant="display" style={{ marginTop: 24, textAlign: "center" }}>{timedOut ? "Aún no confirmamos tu pago" : "Confirmando tu pago…"}</Text>
          <Text tone="muted" style={{ marginTop: 8, textAlign: "center" }}>{timedOut ? "Si ya pagaste, dale unos segundos. Si no, puedes reintentar o cambiar el método." : "Esto toma unos segundos. No cierres la app."}</Text>
          <Text variant="caption" tone="subtle" style={{ marginTop: 20 }}>Pedido #{o.number} · {formatCOP(o.total)}</Text>
        </View>
      </Screen>
    );
  }

  const title = o.type === "shipment" ? "Envío confirmado" : "Pedido confirmado";
  const sub = o.type === "shipment" ? "Un repartidor recogerá tu paquete pronto." : `${o.merchant_name ?? "El comercio"} recibió tu pedido y empezará a prepararlo.`;

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        <Button title={o.type === "shipment" ? "Seguir envío" : "Seguir pedido"} onPress={() => router.replace(`/(customer)/order/${id}` as never)} />
        <Button title="Volver al inicio" variant="ghost" onPress={() => router.replace("/(customer)" as never)} />
      </View>
    }>
      <View style={styles.center}>
        <View style={styles.circle}><Ionicons name="checkmark" size={52} color={colors.white} /></View>
        <Text variant="display" style={{ marginTop: 24, textAlign: "center" }}>{title}</Text>
        <Text tone="muted" style={{ marginTop: 8, textAlign: "center" }}>{sub}</Text>
        <Card style={{ marginTop: 28, alignSelf: "stretch" }}>
          <View style={styles.row}><Text tone="muted">Pedido</Text><Text variant="bodyStrong">#{o.number}</Text></View>
          <View style={styles.row}><Text tone="muted">Llega en</Text><Text variant="bodyStrong">{etaLabel(o.eta_min, o.eta_max) || "Pronto"}</Text></View>
          <View style={styles.row}><Text tone="muted">Total</Text><Text variant="bodyStrong">{formatCOP(o.total)}</Text></View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}><Text tone="muted">Pago</Text><Text variant="bodyStrong">{o.payment_method === "cash" ? "Efectivo al recibir" : o.payment_method === "nequi" || o.payment_method === "daviplata" ? "Nequi / Daviplata al recibir" : "Tarjeta"}</Text></View>
        </Card>
        {o.payment_method !== "cash" && o.payment_method !== "card" && o.status === "pending_payment" ? (
          <Text variant="caption" tone="muted" style={{ marginTop: 12, textAlign: "center" }}>Pagarás con {o.payment_method === "nequi" ? "Nequi" : "Daviplata"} al recibir tu pedido.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 48, paddingHorizontal: 8 },
  circle: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
});
