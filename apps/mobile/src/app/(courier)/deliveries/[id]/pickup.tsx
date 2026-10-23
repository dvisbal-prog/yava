import React, { useEffect, useState } from "react";
import { View, Alert, Linking, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Skeleton, StatusPill } from "@/components/ui";
import { MapCard } from "@/components/courier/MapCard";
import { ErrorState } from "@/components/merchant/Rows";
import { useCourierOrder, useOrderItems, useCourierSetStatus, getCurrentCoords } from "@/features/courier/useCourier";
import type { Coords } from "@/features/courier/useCourier";
import type { MerchantRow } from "@/features/merchant/types";
import { parseItemOptions } from "@/features/merchant/types";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { openInMaps } from "@/features/courier/maps";

/** Pantalla 62 · Recogida en el comercio. */
export default function CourierPickup() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const orderQ = useCourierOrder(id);
  const itemsQ = useOrderItems(id);
  const setStatus = useCourierSetStatus();
  useRealtimeOrder(id);
  const order = orderQ.data;
  const merchantQ = useQuery({
    queryKey: ["merchant", order?.merchant_id],
    enabled: !!order?.merchant_id,
    queryFn: async (): Promise<MerchantRow | null> => {
      const { data, error } = await supabase.from("merchants").select("*").eq("id", order?.merchant_id).maybeSingle();
      if (error) throw error;
      return (data as MerchantRow | null) ?? null;
    },
  });
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [me, setMe] = useState<Coords | null>(null);
  useEffect(() => { getCurrentCoords().then(setMe); }, []);
  useEffect(() => {
    if (order?.status === "on_the_way" || order?.status === "delivered") router.replace(order.status === "delivered" ? "/(courier)" : `/(courier)/deliveries/${id}/deliver`);
  }, [order?.status, id, router]);

  if (orderQ.isLoading) return <Screen><Header title="Recogida" /><Skeleton height={180} style={{ marginBottom: 12 }} /><Skeleton height={200} /></Screen>;
  if (orderQ.isError || !order) return <Screen><Header title="Recogida" /><ErrorState message={orderQ.isError ? errorMessage(orderQ.error) : "Pedido no encontrado"} onRetry={() => orderQ.refetch()} /></Screen>;

  const status = (order.status ?? "assigned") as OrderStatus;
  const m = merchantQ.data;
  const isShipment = order.type === "shipment";
  const pickup = isShipment ? (order.pickup_snapshot as { line1?: string; lat?: number; lng?: number; name?: string; phone?: string } | null) : null;
  const pickupLat = isShipment ? pickup?.lat ?? null : m?.lat ?? null;
  const pickupLng = isShipment ? pickup?.lng ?? null : m?.lng ?? null;
  const pickupName = isShipment ? pickup?.name ?? "Punto de recogida" : order.merchant_name ?? "Comercio";
  const pickupAddress = isShipment ? pickup?.line1 ?? "" : m?.address ?? "";
  const pickupPhone = isShipment ? pickup?.phone ?? null : m?.phone ?? null;
  const items = itemsQ.data ?? [];
  const allChecked = items.length === 0 || items.every((it) => checked[it.id]);
  const pickedUp = status === "picked_up";
  const ready = status === "ready" || status === "assigned";

  const confirmPickup = async () => {
    if (!order.id) return;
    if (!allChecked) { Alert.alert("Verifica los productos", "Marca todos los productos antes de confirmar la recogida."); return; }
    try {
      await setStatus.mutateAsync({ orderId: order.id, status: "picked_up" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert("No se pudo confirmar", errorMessage(e)); }
  };
  const startRoute = async () => {
    if (!order.id) return;
    try {
      await setStatus.mutateAsync({ orderId: order.id, status: "on_the_way" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.replace(`/(courier)/deliveries/${order.id}/deliver`);
    } catch (e) { Alert.alert("No se pudo iniciar la ruta", errorMessage(e)); }
  };

  return (
    <Screen padded={false} footer={pickedUp
      ? <Button title="Iniciar ruta al cliente" icon="navigate-outline" onPress={startRoute} loading={setStatus.isPending} />
      : <View>
          {!ready && !isShipment ? <Text variant="caption" tone="warning" style={{ textAlign: "center", marginBottom: 8 }}>El comercio aún está preparando el pedido. Puedes confirmar cuando te lo entreguen.</Text> : null}
          <Button title="Confirmar recogida" icon="checkmark" onPress={confirmPickup} loading={setStatus.isPending} disabled={!allChecked} />
        </View>}>
      <Header title="Recogida" subtitle={`Pedido #${order.number}`} right={<StatusPill status={status} />} onBack={() => router.replace("/(courier)")} />
      <View style={{ paddingHorizontal: 16 }}>
        <MapCard height={170} pins={[
          ...(me ? [{ lat: me.lat, lng: me.lng, kind: "me" as const, title: "Tú" }] : []),
          ...(pickupLat != null && pickupLng != null ? [{ lat: pickupLat, lng: pickupLng, kind: "merchant" as const, title: pickupName }] : []),
        ]} />
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name="storefront-outline" size={22} color={colors.blue} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="heading">{pickupName}</Text>
              <Text tone="muted">{pickupAddress}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {pickupPhone ? <Button title="Llamar" variant="outline" size="md" icon="call-outline" onPress={() => Linking.openURL(`tel:${pickupPhone}`).catch(() => {})} style={{ flex: 1 }} /> : null}
            <Button title="Abrir en Maps" variant="secondary" size="md" icon="map-outline" onPress={() => pickupLat != null && pickupLng != null ? openInMaps(pickupLat, pickupLng, pickupName) : Alert.alert("Sin coordenadas", pickupAddress || "El comercio no tiene ubicación registrada.")} style={{ flex: 1 }} />
          </View>
        </Card>

        <Text variant="heading" style={{ marginTop: 18, marginBottom: 8 }}>{isShipment ? "Paquete" : "Verifica los productos"}</Text>
        <Card padded={false}>
          {isShipment ? (
            <View style={{ padding: 14 }}>
              <Text>{(order.package_details as { description?: string } | null)?.description ?? "Paquete del cliente"}</Text>
              <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>Confirma que recibiste el paquete en buen estado.</Text>
            </View>
          ) : itemsQ.isLoading ? <Skeleton height={60} /> : items.map((it, idx) => {
            const opts = parseItemOptions(it.options);
            const on = !!checked[it.id];
            return (
              <Pressable key={it.id} onPress={() => { Haptics.selectionAsync().catch(() => {}); setChecked((c) => ({ ...c, [it.id]: !c[it.id] })); }}
                style={{ flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: idx ? 1 : 0, borderTopColor: colors.gray100 }}>
                <Ionicons name={on ? "checkbox" : "square-outline"} size={24} color={on ? colors.blue : colors.gray400} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={on ? { textDecorationLine: "line-through", color: colors.gray500 } : undefined}>{it.qty} x {it.name}</Text>
                  {opts.length ? <Text variant="caption" tone="muted">{opts.map((o) => o.name).join(" · ")}</Text> : null}
                  {it.notes ? <Text variant="caption" tone="warning">Nota: {it.notes}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </Card>
        {order.payment_method === "cash" ? (
          <Card style={{ marginTop: 12, backgroundColor: colors.redSoft, borderColor: colors.redSoft }}>
            <Text variant="bodyStrong" tone="danger">Pago en efectivo · cobra {formatCOP(order.total)} al entregar</Text>
          </Card>
        ) : null}
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
