import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Button, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ErrorState, PriceBreakdown } from "@/components/customer";
import { OrderCard, OrderThumb, PaymentTile, PillButton, BoldCheck, useOrderPayment, addressLine, t, ORDER_GUTTER } from "@/components/customer/order/kit";
import { orderMerchantPhoto, orderItemPhoto } from "@/components/customer/order/photos";
import { useOrder, useOrderItems, useMerchant, useProductsByIds, etaLabel, type AddressSnapshot } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

const PAYMENT_WAIT_MS = 45_000;

/** "25–35 min" con raya, como en el diseño. */
const etaDash = (min?: number | null, max?: number | null) => etaLabel(min, max).replace("-", "–");

/**
 * Pantalla 20 · Pedido confirmado (tanda-03/20-pedido-confirmado.png); también destino del redirect de Wompi.
 * Círculo con check, título centrado, tarjeta del comercio con "Llegará en", "Tu pedido" con resumen de pago,
 * dirección, método de pago y los botones "Seguir pedido ›" / "Ver detalle".
 */
export default function OrderConfirmed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, retry } = useLocalSearchParams<{ id: string; retry?: string }>();
  const cart = useCart();
  const order = useOrder(id, { refetchInterval: 3000 });
  const items = useOrderItems(id);
  useRealtimeOrder(id);
  const [startedAt] = useState(Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const products = useProductsByIds((items.data ?? []).map((it) => it.product_id).filter((x): x is string => Boolean(x)));
  const pay = useOrderPayment(o);
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

  const root = [styles.root, { paddingTop: insets.top }];

  if (order.isLoading && !o) {
    return (
      <View style={root}>
        <View style={{ alignItems: "center", paddingTop: 8.3, gap: 12 }}>
          <Skeleton width={53} height={53} style={{ borderRadius: 27 }} />
          <Skeleton width={200} height={22} />
          <Skeleton width={180} height={13} />
        </View>
        <View style={{ paddingHorizontal: ORDER_GUTTER, gap: 10, marginTop: 24 }}>
          <Skeleton height={86} style={{ borderRadius: 16 }} />
          <Skeleton height={290} style={{ borderRadius: 16 }} />
          <Skeleton height={68} style={{ borderRadius: 16 }} />
        </View>
      </View>
    );
  }
  if (order.error || !o) {
    return (
      <View style={[root, { paddingHorizontal: ORDER_GUTTER }]}>
        <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
        <Button title="Ir al inicio" variant="ghost" onPress={() => router.replace("/(customer)" as never)} />
      </View>
    );
  }

  // Esperando la confirmación de Wompi (mismo sistema visual: círculo azul claro + título + subtítulo).
  if (waitingCard) {
    return (
      <View style={root}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: ORDER_GUTTER, paddingBottom: Math.max(insets.bottom, 16) }}>
          <View style={[styles.circle, { marginTop: 8.3 }]}><Ionicons name="card-outline" size={27} color={colors.blue} /></View>
          <Text style={[styles.title, { marginTop: 5 }]}>{timedOut ? "Aún no confirmamos tu pago" : "Confirmando tu pago…"}</Text>
          <Text style={[styles.subtitle, { paddingHorizontal: 12 }]}>{timedOut ? "Si ya pagaste, dale unos segundos. Si no, puedes reintentar o cambiar el método." : "Esto toma unos segundos. No cierres la app."}</Text>
          <Text style={styles.number}>#{o.number} · {formatCOP(o.total)}</Text>
          {timedOut ? (
            <PillButton title="Ver opciones de pago" height={42.5} style={{ marginTop: 24 }} onPress={() => router.replace(`/(customer)/order/${id}/payment-failed` as never)} />
          ) : null}
        </ScrollView>
      </View>
    );
  }

  const shipment = o.type === "shipment";
  const title = shipment ? "Envío confirmado" : "Pedido confirmado";
  const sub = shipment ? "Un repartidor recogerá tu paquete pronto." : `${o.merchant_name ?? "El comercio"} ya recibió tu pedido.`;
  const addr = (o.address_snapshot ?? {}) as AddressSnapshot;
  const m = merchant.data;
  const mData = { name: o.merchant_name ?? m?.name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo ?? m?.logo_url };
  const productById = new Map((products.data ?? []).map((p) => [p.id, p]));
  const eta = etaDash(o.eta_min, o.eta_max);
  const cashLike = o.payment_method !== "card";

  return (
    <View style={root}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) }} showsVerticalScrollIndicator={false}>
        <View style={[styles.circle, { marginTop: 8.3 }]} accessibilityElementsHidden importantForAccessibility="no">
          <BoldCheck width={23.6} stroke={3} />
        </View>
        <Text style={[styles.title, { marginTop: 6.4 }]} accessibilityRole="header">{title}</Text>
        <Text style={[styles.subtitle, { marginTop: 4 }]}>{sub}</Text>
        <Text style={[styles.number, { marginTop: 2.2 }]}>#{o.number}</Text>

        <View style={styles.cards}>
          {/* Comercio + tiempo estimado (C20a) */}
          {!shipment ? (
            <OrderCard style={styles.merchantCard}>
              <OrderThumb source={orderMerchantPhoto(mData, "confirmed")} width={101.2} height={69.7} radius={10} />
              <View style={styles.merchantText}>
                <Text style={t(16, "600")} numberOfLines={1}>{o.merchant_name}</Text>
                <Text style={[t(12, "400", colors.textSecondary, 16), { marginTop: 1.6 }]} numberOfLines={1}>{m?.tagline ?? ""}</Text>
              </View>
              {eta ? (
                <>
                  <View style={styles.vDivider} />
                  <View style={styles.etaCol}>
                    <Text style={t(10.4, "400", colors.textSecondary, 14)}>Llegará en</Text>
                    <Text style={[t(18.5, "700", colors.ink, 23), { marginTop: 1.3, letterSpacing: -0.2 }]} numberOfLines={1}>{eta}</Text>
                  </View>
                </>
              ) : null}
            </OrderCard>
          ) : null}

          {/* Tu pedido */}
          <OrderCard style={styles.itemsCard}>
            <Text style={t(15.25, "700", colors.ink, 20)}>Tu pedido</Text>
            <View style={{ marginTop: 5 }}>
              {items.isLoading ? <Skeleton height={56} style={{ marginVertical: 6 }} /> : !items.data?.length ? (
                <Text style={[t(12.75, "400", colors.textTertiary, 17), { paddingVertical: 10 }]}>{shipment ? "Envío de paquete punto a punto" : "Sin productos"}</Text>
              ) : items.data.map((it, i, all) => {
                const p = it.product_id ? productById.get(it.product_id) : undefined;
                return (
                  <View key={it.id} style={[styles.itemRow, i === all.length - 1 && { paddingBottom: 9.9 }]}>
                    <OrderThumb source={orderItemPhoto({ name: it.name, image_urls: p?.image_urls }, "confirmed")} width={58.2} height={55.5} radius={10} />
                    <View style={styles.itemText}>
                      <Text style={t(12.4, "500", colors.ink, 17)} numberOfLines={2}>{it.name}</Text>
                      <Text style={[t(12.9, "400", "#323F57", 17), { marginTop: 2.8 }]}>{formatCOP(it.unit_price)}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={t(12.75, "400", "#46546C", 17)}>{it.qty} x</Text>
                      <Text style={t(12.5, "400", "#182843", 17)}>{formatCOP(it.total)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <PriceBreakdown
              subtotal={o.items_subtotal ?? 0} deliveryFee={o.delivery_fee ?? 0} serviceFee={o.service_fee ?? 0} discount={o.discount ?? 0} total={o.total ?? 0}
              totalLabel={cashLike ? "Total a pagar" : "Total pagado"}
              sizes={{ label: 11.8, value: 12.3, row: 20.1, total: 13.15, totalValue: 13.9, gap: 6.2 }}
              style={{ marginTop: 7.1 }}
            />
          </OrderCard>

          {/* Dirección de entrega */}
          <OrderCard style={styles.infoCard}>
            <View style={styles.pinCircle}><Ionicons name="location" size={22} color={colors.iconGray} /></View>
            <View style={{ flex: 1, marginLeft: 15.2 }}>
              <Text style={t(11.45, "600", colors.ink, 15)}>Dirección de entrega</Text>
              <Text style={[t(10.75, "400", "#3A4558", 15), { marginTop: 1.3 }]} numberOfLines={2}>
                {[addr.label, addressLine(addr)].filter(Boolean).join(" · ")}
              </Text>
              {o.city_name ? <Text style={t(10.7, "400", colors.textTertiary, 15)}>{o.city_name}</Text> : null}
            </View>
          </OrderCard>

          {/* Método de pago */}
          <OrderCard style={[styles.infoCard, styles.payCard]}>
            <PaymentTile isVisa={pay.isVisa} icon={pay.icon} width={50.3} height={33.7} />
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={t(11.35, "600", colors.ink, 15)}>Método de pago</Text>
              <Text style={[t(11.5, "400", colors.textSecondary, 15), { marginTop: 3 }]}>{pay.label}{cashLike ? " · al recibir" : ""}</Text>
            </View>
          </OrderCard>

          <PillButton title={shipment ? "Seguir envío" : "Seguir pedido"} chevron height={42.5} fontSize={13.6} style={styles.primary}
            onPress={() => router.replace(`/(customer)/order/${id}` as never)} />
          <PillButton title="Ver detalle" variant="outline" height={38.8} fontSize={11.95} style={styles.secondary}
            onPress={() => router.push(`/(customer)/order/${id}/detail` as never)} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  circle: { alignSelf: "center", width: 53, height: 53, borderRadius: 26.5, backgroundColor: "#E1ECFD", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22.2, lineHeight: 27, fontWeight: "700", color: colors.ink, textAlign: "center", letterSpacing: -0.2 },
  subtitle: { fontSize: 13.2, lineHeight: 18, color: colors.textSecondary, textAlign: "center" },
  number: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, textAlign: "center" },
  cards: { paddingHorizontal: ORDER_GUTTER, gap: 9.4, marginTop: 8.9 },
  merchantCard: { flexDirection: "row", alignItems: "center", height: 86.4, paddingHorizontal: 7.3 },
  merchantText: { flex: 1, marginLeft: 12.4, paddingBottom: 1 },
  vDivider: { width: 1, height: 53, backgroundColor: "#E1E5EC" },
  etaCol: { width: 117, paddingLeft: 17.6, paddingBottom: 1 },
  itemsCard: { paddingHorizontal: 11.6, paddingTop: 9.1, paddingBottom: 11.9 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6.8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E1E5EC" },
  itemText: { flex: 1, marginLeft: 11.5, paddingRight: 8, alignSelf: "flex-start", paddingTop: 7.5 },
  // "1 x" y el total quedan ≈ 2 pt por encima del centro de la foto (20).
  itemRight: { width: 85.9, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  infoCard: { flexDirection: "row", alignItems: "center", minHeight: 68, paddingHorizontal: 11, paddingVertical: 8 },
  payCard: { minHeight: 58.7 },
  pinCircle: { width: 38.8, height: 38.8, borderRadius: 19.4, backgroundColor: "#ECF4FD", alignItems: "center", justifyContent: "center" },
  primary: { marginTop: 1.7, marginHorizontal: 1 },
  secondary: { marginTop: -0.7 },
});
