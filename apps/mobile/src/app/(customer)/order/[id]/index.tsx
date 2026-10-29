import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Linking, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, formatCOP, formatRating, shadows } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { Timeline, Avatar, ErrorState, type TimelineStep } from "@/components/customer";
import { TrackingMap } from "@/components/customer/order/TrackingMap";
import { shortCourierName, time12, t, KeyholeLock } from "@/components/customer/order/kit";
import { courierPhoto } from "@/components/customer/order/photos";
import { PendingOrderView } from "@/components/customer/order/PendingOrderView";
import { useOrder, useCourier, useMerchant, orderHeadline, etaLabel, TRACKING_STATUSES, type AddressSnapshot } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

const STATUS_ORDER = ["pending_payment", "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way", "delivered"];
const SECONDARY = "#5F6984";

/**
 * Pantalla 21 · Seguimiento del pedido (tanda-03/21-seguimiento.png): mapa a pantalla completa con restaurante,
 * repartidor, casa y ruta; botón ← y tarjeta "Pedido #…"; hoja fija con título, ETA, línea de tiempo,
 * repartidor (chat/llamar), código de entrega y "Ver detalle · $… ›" / "Ayuda ›".
 * Mientras el comercio no acepta el pedido se muestra el detalle del pedido en curso (`PendingOrderView`, fondo de 47),
 * con el menú ⋮ para cancelar o pedir ayuda.
 */
export default function OrderTracking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id, { refetchInterval: 20_000 });
  useRealtimeOrder(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const courier = useCourier(o?.courier_id, o?.status);
  const [sheetH, setSheetH] = useState(420);

  useEffect(() => {
    if (o?.status === "delivered") router.replace(`/(customer)/order/${id}/delivered` as never);
  }, [o?.status, id, router]);

  const addr = (o?.address_snapshot ?? {}) as AddressSnapshot;
  const pickup = (o?.pickup_snapshot ?? null) as AddressSnapshot | null;
  const home = o?.delivery_lat != null && o.delivery_lng != null ? { latitude: o.delivery_lat, longitude: o.delivery_lng } : null;
  const shop = merchant.data?.lat != null && merchant.data.lng != null ? { latitude: merchant.data.lat, longitude: merchant.data.lng } : pickup?.lat != null && pickup.lng != null ? { latitude: pickup.lat, longitude: pickup.lng } : null;
  const rider = courier.data?.current_lat != null && courier.data.current_lng != null && o?.status && TRACKING_STATUSES.includes(o.status) ? { latitude: courier.data.current_lat, longitude: courier.data.current_lng } : null;

  const steps: TimelineStep[] = useMemo(() => {
    if (!o) return [];
    const idx = STATUS_ORDER.indexOf(o.status ?? "placed");
    return [
      { label: "Confirmado", time: time12(o.accepted_at ?? (idx >= 2 ? o.placed_at : null)), done: idx >= 2, current: idx < 2 },
      { label: "Preparado", time: time12(o.ready_at), done: idx >= 4, current: idx === 2 || idx === 3 },
      { label: "En camino", time: time12(o.picked_up_at), done: idx >= 8, current: idx >= 4 && idx < 8 },
    ];
  }, [o]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(customer)/orders" as never));

  if (order.isLoading && !o) {
    return (
      <View style={styles.root}>
        <Skeleton width="100%" height={380} style={{ borderRadius: 0 }} />
        <View style={{ padding: 20, gap: 12 }}><Skeleton width="75%" height={24} /><Skeleton width="40%" height={15} /><Skeleton height={60} /><Skeleton height={80} style={{ borderRadius: 18 }} /></View>
      </View>
    );
  }
  if (order.error || !o) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Atrás" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
      </View>
    );
  }

  // Recibido o esperando el pago: detalle del pedido en curso (aún no hay repartidor ni ruta que mostrar).
  if (o.status === "placed" || o.status === "pending_payment") {
    return (
      <PendingOrderView order={o} onBack={goBack}
        onCancel={() => router.push(`/(customer)/order/${id}/cancel` as never)}
        onHelp={() => router.push(`/(customer)/help?order=${id}` as never)} />
    );
  }

  const cancelled = o.status === "cancelled";
  const canCancel = o.status && ["pending_payment", "placed", "accepted"].includes(o.status);
  const headline = orderHeadline(o.status ?? "placed");
  const eta = o.eta_min ? `Llega en ${etaLabel(o.eta_min, o.eta_max).replace("-", "–")}` : "";
  const shopAddress = (merchant.data?.address ?? pickup?.line1 ?? "").split(",")[0];
  const courierImg = courierPhoto(o.courier_name, "main");
  const c = courier.data;

  return (
    <View style={styles.root}>
      <TrackingMap shop={shop} rider={rider} home={home} shopName={o.type === "shipment" ? "Recogida" : o.merchant_name} shopAddress={shopAddress}
        homeLabel={addr.label === "Casa" || !addr.label ? "Tu casa" : addr.label} homeLines={[addr.line1, addr.line2].filter((x): x is string => Boolean(x))}
        visible={screenH - sheetH + 24} topInset={insets.top} />

      {/* Botón ← y tarjeta del pedido */}
      <View style={[styles.topBar, { top: insets.top + 6.75 }]} pointerEvents="box-none">
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Atrás" style={({ pressed }) => [styles.backBtn, shadows.soft, pressed && { opacity: 0.8 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={[styles.chip, shadows.soft]}>
          <Text style={t(11.8, "700", colors.ink, 15)} numberOfLines={1}>Pedido #{o.number}</Text>
          <Text style={[t(9.15, "400", "#6A728D", 12), { marginTop: 1.4 }]} numberOfLines={1}>{o.type === "shipment" ? "Envío" : o.merchant_name}</Text>
        </View>
      </View>

      {/* Hoja fija */}
      <View style={[styles.sheet, { maxHeight: screenH - insets.top - 120 }]} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 7 }} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.pad}>
            <Text style={[t(23.7, "700", colors.ink, 28), { letterSpacing: -0.3, marginTop: 13.2 }]} accessibilityRole="header">{headline}</Text>
            {eta && !cancelled ? <Text style={[t(15.5, "400", SECONDARY, 20), { marginTop: 4.7, marginLeft: 1.6 }]}>{eta}</Text> : null}
          </View>

          {!cancelled ? (
            <View style={{ marginTop: 12.4, paddingHorizontal: 17.5 }}><Timeline steps={steps} /></View>
          ) : (
            <View style={[styles.pad, { marginTop: 14 }]}>
              <View style={styles.cancelNote}><Ionicons name="close-circle" size={20} color={colors.red} /><Text style={[t(13, "500", colors.red, 18), { flex: 1, marginLeft: 8 }]}>{o.cancel_reason ?? "El pedido fue cancelado."}</Text></View>
            </View>
          )}

          {o.courier_id ? (
            <View style={styles.courierCard}>
              {courierImg ? <Image source={courierImg} style={styles.avatar} contentFit="cover" /> : <Avatar name={o.courier_name} size={59.5} />}
              <View style={{ flex: 1, marginLeft: 11.7 }}>
                <Text style={t(11.9, "600", colors.ink, 16)} numberOfLines={1}>{shortCourierName(o.courier_name)}</Text>
                <Text style={[t(10.2, "400", SECONDARY, 14), { marginTop: 2.5 }]}>Tu domiciliario</Text>
                {c ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12.5} color={colors.star} />
                    <Text style={[t(11.4, "600", "#2C3550", 15), { marginLeft: 4 }]}>{formatRating(Number(c.rating_avg))}</Text>
                    <Text style={t(11.4, "400", SECONDARY, 15)}>{`  ·  ${c.deliveries_count} entregas`}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={() => router.push(`/(customer)/order/${id}/chat` as never)} accessibilityRole="button" accessibilityLabel="Chatear con el repartidor"
                style={({ pressed }) => [styles.roundBtn, pressed && { opacity: 0.75 }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={22.5} color={colors.blue} />
              </Pressable>
              {o.courier_phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${o.courier_phone}`)} accessibilityRole="button" accessibilityLabel="Llamar al repartidor"
                  style={({ pressed }) => [styles.roundBtn, { marginLeft: 9.2 }, pressed && { opacity: 0.75 }]}>
                  <Ionicons name="call-outline" size={21} color={colors.blue} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!cancelled ? (
            <View style={[styles.codeCard, { marginTop: o.courier_id ? 8.9 : 19.7 }]}>
              <View style={styles.lock}><KeyholeLock /></View>
              <View style={{ flex: 1, marginLeft: 17.6 }}>
                <Text style={t(10.5, "400", "#63708B", 14)}>Código de entrega</Text>
                <Text style={[t(20.6, "700", colors.ink, 25), { marginTop: 2, letterSpacing: 0.3 }]}>{o.delivery_code ?? "----"}</Text>
                <Text style={[t(9.7, "400", "#69748F", 13), { marginTop: 0.8 }]}>Compártelo al recibir tu pedido.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.links}>
            <Pressable onPress={() => router.push(`/(customer)/order/${id}/detail` as never)} accessibilityRole="button" hitSlop={8} style={styles.link}>
              <Text style={t(12.2, "600", colors.blueLink, 16)}>Ver detalle · {formatCOP(o.total)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.blueLink} style={{ marginLeft: 6 }} />
            </Pressable>
            <Pressable onPress={() => router.push(`/(customer)/help?order=${id}` as never)} accessibilityRole="button" hitSlop={8} style={styles.link}>
              <Text style={t(12.6, "600", colors.blueLink, 16)}>Ayuda</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.blueLink} style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
          {canCancel ? (
            <Pressable onPress={() => router.push(`/(customer)/order/${id}/cancel` as never)} accessibilityRole="button" hitSlop={8} style={styles.cancelLink}>
              <Text style={t(12, "600", colors.red, 16)}>Cancelar pedido</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF1F5" },
  topBar: { position: "absolute", left: 17.5, flexDirection: "row", alignItems: "center" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  chip: { marginLeft: 10, height: 40, borderRadius: 14, backgroundColor: colors.white, paddingLeft: 10.7, paddingRight: 14.5, justifyContent: "center", maxWidth: 240 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0px -4px 16px rgba(16, 24, 48, 0.06)" },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#D3D8E2", marginTop: 11.2 },
  pad: { paddingHorizontal: 20.3 },
  cancelNote: { flexDirection: "row", alignItems: "center", backgroundColor: colors.redSoft, borderRadius: 14, padding: 12 },
  courierCard: { flexDirection: "row", alignItems: "center", marginTop: 19.7, marginHorizontal: 18.3, height: 80, borderRadius: 18, backgroundColor: "#F3F6FB", paddingLeft: 11.7, paddingRight: 11.2 },
  avatar: { width: 59.5, height: 59.5, borderRadius: 29.75, backgroundColor: colors.surfaceGray },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 1.9 },
  roundBtn: { width: 42.5, height: 42.5, borderRadius: 21.25, backgroundColor: "#E6EDFC", alignItems: "center", justifyContent: "center" },
  codeCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 18.5, height: 78.5, borderRadius: 16, borderWidth: 0.75, borderColor: "#E3E6EC", backgroundColor: colors.white, paddingLeft: 16.4 },
  lock: { width: 44.3, height: 44.3, borderRadius: 22.15, backgroundColor: "#E6EFFD", alignItems: "center", justifyContent: "center" },
  links: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26.1, paddingLeft: 20.3, paddingRight: 18 },
  link: { flexDirection: "row", alignItems: "center" },
  cancelLink: { alignSelf: "center", marginTop: 14 },
});
