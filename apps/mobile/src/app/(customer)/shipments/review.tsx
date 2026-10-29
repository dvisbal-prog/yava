import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { designImages } from "@/lib/design-images";
import { useLocation } from "@/store/location";
import { ErrorState } from "@/components/customer";
import { NavBar, ft } from "@/components/customer/account/kit";
import { LineIcon } from "@/components/customer/account/icons";
import { PrimaryCTA } from "@/components/customer/account/parts";
import { ShipmentMap } from "@/components/customer/account/shipment";
import { useShipmentFees, useShipmentDraft, useCheckout, useRequireAuth, maskPhone, type OrderSummaryRow } from "@/features/customer";

const SIZE_TITLE = { small: "Paquete pequeño", medium: "Paquete mediano", large: "Paquete grande" } as const;
const SIZE_HINT = { small: "Hasta 2 kg", medium: "Hasta 8 kg", large: "Hasta 15 kg" } as const;

/** Círculo de ícono de las tarjetas de 32 (`#E9F0FB`, 37 pt). */
function IconCircle({ children, size = 37 }: { children: React.ReactNode; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#E9F0FB", alignItems: "center", justifyContent: "center" }}>{children}</View>;
}

/** Punto de la ruta (12 pt) dentro de su halo (21,7 pt). */
function RouteDot({ color, halo }: { color: string; halo: string }) {
  return (
    <View style={[styles.routeHalo, { backgroundColor: halo }]}><View style={[styles.routeDot, { backgroundColor: color }]} /></View>
  );
}

/**
 * Pantalla 32 · Revisa tu envío (tanda-04/32-envio-cotizacion.png): chevron + título centrado, mapa con la ruta,
 * tarjeta de ruta (Recogida → Entrega), destinatario con botón de llamar, paquete, tiempo estimado, precios,
 * método de pago con "Cambiar ›" y CTA "Confirmar envío · $9.000 ›" con la nota de seguimiento.
 */
export default function ReviewShipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const { draft, reset } = useShipmentDraft();
  const fees = useShipmentFees();
  const checkout = useCheckout();
  const cityId = useLocation((s) => s.cityId);
  const cityName = useLocation((s) => s.cityName) ?? "Puerto Colombia";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = fees.data?.shipment ?? 8000;
  const service = fees.data?.service ?? 1000;
  const total = shipping + service;
  const method = checkout.method === "card" ? "cash" : checkout.method;

  async function confirm() {
    if (!requireAuth("/(customer)/shipments/review")) return;
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc("place_shipment", {
        p_pickup: { line1: draft.pickupLine1, line2: draft.pickupLine2 || null, lat: draft.pickupLat, lng: draft.pickupLng, city_id: cityId },
        p_dropoff: { label: "Destino", line1: draft.dropoffLine1, lat: draft.dropoffLat, lng: draft.dropoffLng, recipient_name: draft.recipientName, recipient_phone: draft.recipientPhone.replace(/\D/g, ""), city_id: cityId },
        p_package: { type: draft.packageType, size: draft.size, description: draft.description || null },
        p_payment_method: method, p_notes: draft.description || undefined,
      });
      if (e) throw e;
      const order = data as OrderSummaryRow;
      reset();
      void qc.invalidateQueries({ queryKey: ["orders"] });
      router.replace(`/(customer)/order/${order.id}/confirmed` as never);
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  }

  const pickup = draft.pickupLat != null && draft.pickupLng != null ? { latitude: draft.pickupLat, longitude: draft.pickupLng } : null;
  const dropoff = draft.dropoffLat != null && draft.dropoffLng != null ? { latitude: draft.dropoffLat, longitude: draft.dropoffLng } : null;
  const phone = draft.recipientPhone.replace(/\D/g, "");

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar title="Revisa tu envío" center titleStyle={styles.title} height={46.4} backLeft={19.5} chevronHeight={17.3} chevronStroke={2.1} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ShipmentMap pickup={pickup} dropoff={dropoff} pickupLabel={draft.pickupLine1} dropoffLabel={draft.dropoffLine1} />

        <View style={[styles.card, styles.route]}>
          <View style={styles.routeRail}>
            <RouteDot color="#004EDB" halo="#E2EDFC" />
            <View style={styles.routeDash}>{Array.from({ length: 8 }).map((_, i) => <View key={i} style={styles.dash} />)}</View>
            <RouteDot color="#D60D14" halo="#FDE9EA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ft(12.5, "600", colors.ink, 18)}>Recogida</Text>
            <Text style={[ft(11.8, "400", "#5A6476", 15.7), { marginTop: 1.2 }]} numberOfLines={2}>{[draft.pickupLine1, draft.pickupLine2].filter(Boolean).join(", ")}</Text>
            <Text style={ft(11.8, "400", "#5A6476", 15.7)}>{cityName}</Text>
            <Text style={[ft(12.5, "600", colors.ink, 18), { marginTop: 12.4 }]}>Entrega</Text>
            <Text style={[ft(11.8, "400", "#5A6476", 15.7), { marginTop: 1.2 }]} numberOfLines={2}>{draft.dropoffLine1}</Text>
            <Text style={ft(11.8, "400", "#5A6476", 15.7)}>{cityName}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.row, { height: 56.8 }]}>
          <IconCircle><LineIcon name="user" size={24} color="#0A3FA8" stroke={1.7} /></IconCircle>
          <View style={styles.rowBody}>
            <Text style={ft(13.1, "600", colors.ink, 19)} numberOfLines={1}>{draft.recipientName}</Text>
            <Text style={[ft(12.1, "400", "#5A6476", 17), { marginTop: 1.5 }]}>{maskPhone(draft.recipientPhone)}</Text>
          </View>
          {phone.length === 10 ? (
            <Pressable onPress={() => { void Linking.openURL(`tel:${phone}`); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Llamar a ${draft.recipientName}`} style={{ marginRight: 15 }}>
              <Ionicons name="call" size={19} color={colors.blue} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.card, styles.row, { height: 58.6 }]}>
          {/* Caja de cartón propia de 32 (sin la cinta azul de los tamaños de 31). */}
          <Image source={designImages.envioCajaRevision} style={{ width: 48.5, height: 44.8, marginLeft: -1.9 }} contentFit="contain" />
          <View style={[styles.rowBody, { marginLeft: 16.4 }]}>
            <Text style={ft(12, "600", colors.ink, 18)}>{SIZE_TITLE[draft.size]}</Text>
            <Text style={[ft(11.1, "400", "#5A6476", 17), { marginTop: 1.5 }]} numberOfLines={1}>
              {draft.packageType} · {SIZE_HINT[draft.size]}{draft.description ? ` · ${draft.description}` : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.row, { height: 56.8 }]}>
          <IconCircle><Ionicons name="time-outline" size={22} color="#0A3FA8" /></IconCircle>
          <View style={[styles.rowBody, { marginLeft: 16 }]}>
            <Text style={ft(11.8, "400", "#5A6476", 17)}>Tiempo estimado de entrega</Text>
            <Text style={[ft(13.4, "700", colors.ink, 20), { marginTop: 1 }]}>35 – 50 min</Text>
          </View>
        </View>

        <View style={[styles.card, styles.prices]}>
          {fees.isLoading ? <Skeleton height={60} /> : fees.error ? <ErrorState error={fees.error} onRetry={() => { void fees.refetch(); }} compact /> : null}
          <View style={styles.priceRow}><Text style={ft(11.7, "400", "#5A6476", 17)}>Envío</Text><Text style={ft(11.8, "400", "#4C566E", 17)}>{formatCOP(shipping)}</Text></View>
          <View style={[styles.priceRow, { marginTop: 2.4 }]}><Text style={ft(11.7, "400", "#5A6476", 17)}>Servicio</Text><Text style={ft(11.8, "400", "#4C566E", 17)}>{formatCOP(service)}</Text></View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}><Text style={ft(12.9, "700", colors.ink, 19)}>Total</Text><Text style={ft(15.5, "700", colors.ink, 23)}>{formatCOP(total)}</Text></View>
        </View>

        <View style={[styles.card, styles.row, { height: 45.3 }]}>
          <View style={styles.payTile}>
            <Ionicons name={method === "cash" ? "cash-outline" : "phone-portrait-outline"} size={17} color={colors.white} />
          </View>
          <Text style={[ft(12.4, "400", colors.ink, 18), { flex: 1, marginLeft: 16.5 }]} numberOfLines={1}>
            {method === "cash" ? "Efectivo · al recoger" : "Nequi / Daviplata"}
          </Text>
          <Pressable onPress={() => router.push("/(customer)/payment-methods?select=1" as never)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cambiar método de pago" style={styles.change}>
            <Text style={ft(12.1, "500", colors.blueLink, 18)}>Cambiar</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.blueLink} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 6, 12) }]}>
        {error ? <Text style={[ft(12.5, "500", colors.red, 17), { textAlign: "center", marginBottom: 8 }]} accessibilityLiveRegion="polite">{error}</Text> : null}
        <PrimaryCTA title={`Confirmar envío · ${formatCOP(total)}`} onPress={() => { void confirm(); }} loading={busy} pill height={44.4} fontSize={12.8} color="#0041A7"
          right={<Ionicons name="chevron-forward" size={15.5} color={colors.white} style={{ marginLeft: 7 }} />} />
        <Text style={styles.note}>El seguimiento estará disponible al confirmar.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  title: { ...ft(16.1, "700", colors.ink, 23), marginHorizontal: 70 },
  content: { paddingHorizontal: 15.7, paddingTop: 0.2, paddingBottom: 16, gap: 7.8 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, marginHorizontal: 0.5 },
  route: { flexDirection: "row", marginTop: 2.8, paddingTop: 10.6, paddingBottom: 12.4, paddingLeft: 14.7 },
  routeRail: { width: 21.7, alignItems: "center", marginRight: 18.5 },
  routeHalo: { width: 21.7, height: 21.7, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeDash: { height: 36.7, justifyContent: "space-evenly", alignItems: "center", marginVertical: 1.5 },
  dash: { width: 1.8, height: 2.9, borderRadius: 1, backgroundColor: "#8F96A8" },
  row: { flexDirection: "row", alignItems: "center", paddingLeft: 14.7 },
  rowBody: { flex: 1, marginLeft: 14.3 },
  prices: { paddingLeft: 12.4, paddingRight: 10.6, paddingTop: 9.7, paddingBottom: 6.8 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceDivider: { height: 1, backgroundColor: "#E9EBF0", marginTop: 6.5, marginBottom: 4.4 },
  payTile: { width: 37.9, height: 25.9, borderRadius: 5, backgroundColor: "#0A3FA8", alignItems: "center", justifyContent: "center" },
  change: { flexDirection: "row", alignItems: "center", marginRight: 7.6 },
  footer: { paddingHorizontal: 16.6, paddingTop: 8, backgroundColor: colors.white },
  note: { ...ft(10.4, "400", "#5A6476", 15), textAlign: "center", marginTop: 6.9 },
});
