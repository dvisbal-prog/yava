import React, { useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatRating } from "@yava/shared";
import { Text, Button, Card, Skeleton, StatusPill } from "@/components/ui";
import { Timeline, Avatar, ErrorState, type TimelineStep } from "@/components/customer";
import { useOrder, useCourier, useMerchant, orderHeadline, etaLabel, TRACKING_STATUSES, type AddressSnapshot } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

/** Pantalla 21 · Seguimiento del pedido (mapa, línea de tiempo, repartidor, código de entrega). */
export default function OrderTracking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id, { refetchInterval: 20_000 });
  useRealtimeOrder(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const courier = useCourier(o?.courier_id, o?.status);

  useEffect(() => {
    if (o?.status === "delivered") router.replace(`/(customer)/order/${id}/delivered` as never);
  }, [o?.status, id, router]);

  const addr = (o?.address_snapshot ?? {}) as AddressSnapshot;
  const pickup = (o?.pickup_snapshot ?? null) as AddressSnapshot | null;
  const home = o?.delivery_lat != null && o.delivery_lng != null ? { latitude: o.delivery_lat, longitude: o.delivery_lng } : null;
  const shop = merchant.data?.lat != null && merchant.data.lng != null ? { latitude: merchant.data.lat, longitude: merchant.data.lng } : pickup?.lat != null && pickup.lng != null ? { latitude: pickup.lat, longitude: pickup.lng } : null;
  const rider = courier.data?.current_lat != null && courier.data.current_lng != null && o?.status && TRACKING_STATUSES.includes(o.status) ? { latitude: courier.data.current_lat, longitude: courier.data.current_lng } : null;

  const region = useMemo(() => {
    const pts = [home, shop, rider].filter((p): p is { latitude: number; longitude: number } => Boolean(p));
    if (!pts.length) return { latitude: 10.9878, longitude: -74.9547, latitudeDelta: 0.03, longitudeDelta: 0.03 };
    const lats = pts.map((p) => p.latitude), lngs = pts.map((p) => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2, latitudeDelta: Math.max(0.012, (maxLat - minLat) * 1.8), longitudeDelta: Math.max(0.012, (maxLng - minLng) * 1.8) };
  }, [home, shop, rider]);

  const steps: TimelineStep[] = useMemo(() => {
    if (!o) return [];
    const s = o.status;
    const idx = ["pending_payment", "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way", "delivered"].indexOf(s ?? "placed");
    const onWay = idx >= 6;
    return [
      { label: "Confirmado", at: o.accepted_at ?? (idx >= 2 ? o.placed_at : null), done: idx >= 2, current: idx === 1 },
      { label: "Preparado", at: o.ready_at, done: idx >= 4, current: idx === 2 || idx === 3 },
      { label: "En camino", at: o.picked_up_at, done: onWay, current: idx === 4 || idx === 5 },
      { label: "Entregado", at: o.delivered_at, done: idx >= 8, current: onWay && idx < 8 },
    ];
  }, [o]);

  if (order.isLoading && !o) {
    return <View style={{ flex: 1, backgroundColor: colors.white }}><Skeleton width="100%" height={260} style={{ borderRadius: 0 }} /><View style={{ padding: 16, gap: 10 }}><Skeleton width="70%" height={24} /><Skeleton width="40%" height={14} /><Skeleton width="100%" height={120} /></View></View>;
  }
  if (order.error || !o) {
    return <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}><Pressable onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 8 }}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable><ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} /></View>;
  }

  const cancelled = o.status === "cancelled";
  const canCancel = o.status && ["pending_payment", "placed", "accepted"].includes(o.status);
  const headline = orderHeadline(o.status ?? "placed");
  const etaText = o.eta_min ? `Llega en ${etaLabel(o.eta_min, o.eta_max)}` : "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ height: 300 }}>
        {Platform.OS !== "web" ? (
          <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation={false}>
            {shop ? <Marker coordinate={shop} title={o.merchant_name ?? "Recogida"} anchor={{ x: 0.5, y: 0.5 }}><View style={[styles.pin, { backgroundColor: colors.carbon }]}><Ionicons name="storefront" size={16} color={colors.white} /></View></Marker> : null}
            {home ? <Marker coordinate={home} title="Tu casa" anchor={{ x: 0.5, y: 0.5 }}><View style={[styles.pin, { backgroundColor: colors.blue }]}><Ionicons name="home" size={16} color={colors.white} /></View></Marker> : null}
            {rider ? <Marker coordinate={rider} title={o.courier_name ?? "Repartidor"} anchor={{ x: 0.5, y: 0.5 }}><View style={[styles.pin, { backgroundColor: colors.yellow }]}><Ionicons name="bicycle" size={16} color={colors.carbon} /></View></Marker> : null}
          </MapView>
        ) : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.gray100 }]} />}
        <View style={[styles.topBar, { top: insets.top + 6 }]}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(customer)/orders" as never))} style={styles.circleBtn}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable>
          <View style={styles.titleChip}><Text variant="caption" style={{ fontWeight: "600" }}>Pedido #{o.number} · {o.type === "shipment" ? "Envío" : o.merchant_name}</Text></View>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text variant="title">{headline}</Text>
            {etaText && !cancelled ? <Text tone="muted" style={{ marginTop: 2 }}>{etaText}</Text> : null}
          </View>
          {o.status ? <StatusPill status={o.status} /> : null}
        </View>

        {!cancelled ? <View style={{ marginTop: 20 }}><Timeline steps={steps} /></View> : (
          <Card style={{ marginTop: 16, backgroundColor: colors.redSoft, borderColor: colors.redSoft }}><Text tone="danger">{o.cancel_reason ?? "El pedido fue cancelado."}</Text></Card>
        )}

        {o.courier_id ? (
          <Card style={{ marginTop: 20, flexDirection: "row", alignItems: "center" }}>
            <Avatar name={o.courier_name} size={48} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyStrong">{o.courier_name ?? "Tu repartidor"}</Text>
              <Text variant="caption" tone="muted">Tu domiciliario{courier.data ? ` · ★ ${formatRating(Number(courier.data.rating_avg))} · ${courier.data.deliveries_count} entregas` : ""}</Text>
            </View>
            {o.courier_phone ? <Pressable onPress={() => Linking.openURL(`tel:${o.courier_phone}`)} style={styles.roundAction}><Ionicons name="call-outline" size={20} color={colors.blue} /></Pressable> : null}
            <Pressable onPress={() => router.push(`/(customer)/order/${id}/chat` as never)} style={[styles.roundAction, { marginLeft: 8 }]}><Ionicons name="chatbubble-outline" size={20} color={colors.blue} /></Pressable>
          </Card>
        ) : null}

        {!cancelled ? (
          <Card style={{ marginTop: 16, alignItems: "center", backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
            <Text variant="caption" tone="muted">Código de entrega</Text>
            <Text style={{ fontSize: 40, fontWeight: "800", letterSpacing: 8, color: colors.blue, marginTop: 4 }}>{o.delivery_code ?? "----"}</Text>
            <Text variant="caption" tone="muted">Compártelo al recibir tu pedido.</Text>
          </Card>
        ) : null}

        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="home-outline" size={18} color={colors.gray500} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text variant="bodyStrong">{addr.label ?? "Entrega"}</Text>
              <Text variant="caption" tone="muted">{[addr.line1, addr.line2].filter(Boolean).join(" · ")}</Text>
            </View>
          </View>
        </Card>

        <Pressable onPress={() => router.push(`/(customer)/order/${id}/detail` as never)} style={styles.linkRow}>
          <Text variant="bodyStrong">Ver detalle</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}><Text variant="bodyStrong">{formatCOP(o.total)}</Text><Ionicons name="chevron-forward" size={18} color={colors.gray400} /></View>
        </Pressable>
        <Pressable onPress={() => router.push(`/(customer)/help?order=${id}` as never)} style={styles.linkRow}>
          <Text variant="bodyStrong">Ayuda</Text><Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Pressable>
        {canCancel ? <Button title="Cancelar pedido" variant="ghost" onPress={() => router.push(`/(customer)/order/${id}/cancel` as never)} style={{ marginTop: 8 }} /> : null}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  sheet: { flex: 1, marginTop: -20, backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  topBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", shadowColor: colors.black, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  titleChip: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, shadowColor: colors.black, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  pin: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  roundAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
});
