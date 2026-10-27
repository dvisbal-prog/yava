import React, { useEffect, useState } from "react";
import { View, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Skeleton, StatusPill } from "@/components/ui";
import { MapCard } from "@/components/courier/MapCard";
import { CodePad } from "@/components/courier/CodePad";
import { ErrorState } from "@/components/merchant/Rows";
import { useCourierOrder, useCourierSetStatus, getCurrentCoords } from "@/features/courier/useCourier";
import type { Coords } from "@/features/courier/useCourier";
import { parseAddress, addressLine } from "@/features/merchant/types";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { errorMessage } from "@/lib/errors";
import { openInMaps } from "@/features/courier/maps";
import { confirm, notify } from "@/lib/dialog";

/** Pantalla 63 · Confirmar entrega (código de 4 dígitos o efectivo). */
export default function CourierDeliver() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const orderQ = useCourierOrder(id);
  const setStatus = useCourierSetStatus();
  useRealtimeOrder(id);
  const order = orderQ.data;
  const [code, setCode] = useState("");
  const [me, setMe] = useState<Coords | null>(null);
  const [done, setDone] = useState<{ payout: number } | null>(null);
  useEffect(() => { getCurrentCoords().then(setMe); }, []);

  if (orderQ.isLoading) return <Screen><Header title="Entrega" /><Skeleton height={170} style={{ marginBottom: 12 }} /><Skeleton height={220} /></Screen>;
  if (orderQ.isError || !order) return <Screen><Header title="Entrega" /><ErrorState message={orderQ.isError ? errorMessage(orderQ.error) : "Pedido no encontrado"} onRetry={() => orderQ.refetch()} /></Screen>;

  if (done) {
    return (
      <Screen footer={<Button title="Volver al inicio" onPress={() => router.replace("/(courier)")} />}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="checkmark" size={52} color={colors.green} />
          </View>
          <Text variant="display" style={{ marginTop: 24, textAlign: "center" }}>¡Entrega completada!</Text>
          <Text variant="title" tone="primary" style={{ marginTop: 8 }}>Ganaste {formatCOP(done.payout)}</Text>
          <Text tone="muted" style={{ marginTop: 8, textAlign: "center" }}>Pedido #{order.number} entregado. El pago ya está en tu saldo.</Text>
        </View>
      </Screen>
    );
  }

  const status = (order.status ?? "on_the_way") as OrderStatus;
  const addr = parseAddress(order.address_snapshot);
  const isCash = order.payment_method === "cash";
  const payout = order.courier_payout ?? 0;

  const complete = async (deliveryCode: string) => {
    if (!order.id) return;
    try {
      await setStatus.mutateAsync({ orderId: order.id, status: "delivered", code: deliveryCode });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDone({ payout });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setCode("");
      notify("No se pudo confirmar", errorMessage(e));
    }
  };

  const confirmCash = async () => {
    const ok = await confirm(`Cobrar ${formatCOP(order.total)}`, "¿Recibiste el pago completo en efectivo?", { okText: "Sí, entregado", cancelText: "Todavía no" });
    if (ok) await complete("EFECTIVO");
  };

  return (
    <Screen padded={false} footer={<View>
      <Button title="Confirmar entrega" icon="checkmark" onPress={() => complete(code)} loading={setStatus.isPending} disabled={code.length !== 4} />
      {isCash ? <Button title={`Entregado con efectivo · ${formatCOP(order.total)}`} variant="accent" onPress={confirmCash} disabled={setStatus.isPending} style={{ marginTop: 6 }} /> : null}
    </View>}>
      <Header title="Confirmar entrega" subtitle={`Pedido #${order.number}`} right={<StatusPill status={status} />} onBack={() => router.replace("/(courier)")} />
      <View style={{ paddingHorizontal: 16 }}>
        <MapCard height={150} pins={[
          ...(me ? [{ lat: me.lat, lng: me.lng, kind: "me" as const, title: "Tú" }] : []),
          ...(order.delivery_lat != null && order.delivery_lng != null ? [{ lat: order.delivery_lat, lng: order.delivery_lng, kind: "customer" as const, title: order.customer_name ?? "Cliente" }] : []),
        ]} />
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name="home-outline" size={22} color={colors.red} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="heading">{order.customer_name ?? "Cliente"}</Text>
              <Text tone="muted">{addr.label ? `${addr.label} · ` : ""}{addressLine(addr)}</Text>
              {addr.instructions ? <Text variant="caption" tone="warning" style={{ marginTop: 4 }}>{addr.instructions}</Text> : null}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {order.customer_phone ? <Button title="Llamar" variant="outline" size="md" icon="call-outline" onPress={() => Linking.openURL(`tel:${order.customer_phone}`).catch(() => {})} style={{ flex: 1 }} /> : null}
            <Button title="Chat" variant="outline" size="md" icon="chatbubble-ellipses-outline" onPress={() => router.push(`/(courier)/deliveries/${order.id}/chat`)} style={{ flex: 1 }} />
            <Button title="Maps" variant="secondary" size="md" icon="map-outline" onPress={() => order.delivery_lat != null && order.delivery_lng != null ? openInMaps(order.delivery_lat, order.delivery_lng, addressLine(addr)) : notify("Sin coordenadas", addressLine(addr))} style={{ flex: 1 }} />
          </View>
        </Card>
        {isCash ? (
          <Card style={{ marginTop: 12, backgroundColor: colors.redSoft, borderColor: colors.redSoft }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="cash-outline" size={22} color={colors.red} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text variant="heading" tone="danger">Cobrar {formatCOP(order.total)}</Text>
                <Text variant="caption" tone="muted">Pide el código al cliente o confirma la entrega con efectivo.</Text>
              </View>
            </View>
          </Card>
        ) : null}
        <Text variant="heading" style={{ marginTop: 18, textAlign: "center" }}>Código de entrega</Text>
        <Text variant="caption" tone="muted" style={{ textAlign: "center", marginBottom: 14 }}>Pídele al cliente los 4 dígitos que aparecen en su app.</Text>
        <CodePad value={code} onChange={setCode} />
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
