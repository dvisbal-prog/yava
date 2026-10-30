import React from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ErrorState } from "@/components/customer";
import { OrderCard, OrderThumb, PaymentTile, PillButton, BoldCheck, useOrderPayment, addressLine, t, ORDER_GUTTER, BLUE_BRIGHT } from "@/components/customer/order/kit";
import { orderMerchantPhoto, orderItemPhoto } from "@/components/customer/order/photos";
import { useOrder, useOrderItems, useMyRating, useMerchant, useProductsByIds, relativeDateTime, requireAdultFor, type AddressSnapshot } from "@/features/customer";
import { confirm } from "@/lib/dialog";

const DIVIDER = "#DCE1E8";

/** Fila del resumen de pago de 23: etiqueta y valor en tinta 12,75 pt, paso de 23,3 pt. */
function SummaryRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "success" }) {
  return (
    <View style={styles.sumRow}>
      <Text style={strong ? t(14.15, "700", colors.ink, 18) : t(12.75, "400", colors.ink, 17)}>{label}</Text>
      <Text style={strong ? t(14.26, "700", colors.ink, 18) : t(12.75, "400", tone === "success" ? colors.green : colors.ink, 17)}>{value}</Text>
    </View>
  );
}

/**
 * Pantalla 23 · Pedido entregado (tanda-03/23-pedido-entregado.png): "← Pedido #1042", check + "Pedido entregado",
 * tarjeta del comercio, "Tu pedido", "Resumen de pago" con la fila VISA, "Entregado en" y los botones
 * "Calificar pedido" / "Volver a pedir" / "Tuve un problema".
 */
export default function OrderDelivered() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const items = useOrderItems(id);
  const rating = useMyRating(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const products = useProductsByIds((items.data ?? []).map((it) => it.product_id).filter((x): x is string => Boolean(x)));
  const pay = useOrderPayment(o);
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
    // Si el pedido tenía licores, la verificación de edad va primero (consulta las categorías a la BD).
    const productIds = (items.data ?? []).map((it) => it.product_id).filter((x): x is string => Boolean(x));
    requireAdultFor(productIds, null, () => {
      if (cart.lines.length && cart.merchant?.id !== cm.id) {
        void confirm("Ya tienes una canasta", "¿Quieres reemplazarla con este pedido?", { okText: "Reemplazar", destructive: true }).then((ok) => { if (ok) doIt(); });
      } else doIt();
    });
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(customer)/orders" as never));
  const header = (title: string) => (
    <View style={styles.header}>
      <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Atrás" style={styles.back}>
        <Ionicons name="arrow-back" size={23} color={colors.ink} />
      </Pressable>
      <Text style={[t(14.05, "600", colors.ink, 18), styles.headerTitle]} numberOfLines={1} accessibilityRole="header">{title}</Text>
    </View>
  );
  const root = [styles.root, { paddingTop: insets.top }];

  if (order.isLoading && !o) {
    return (
      <View style={root}>
        {header("Pedido")}
        <View style={{ paddingHorizontal: ORDER_GUTTER, gap: 12, marginTop: 6.7 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}><Skeleton width={40} height={40} style={{ borderRadius: 20 }} /><Skeleton width={160} height={18} /></View>
          <Skeleton height={75} style={{ borderRadius: 16 }} />
          <Skeleton width={110} height={16} />
          <Skeleton height={54} style={{ borderRadius: 10 }} />
          <Skeleton height={54} style={{ borderRadius: 10 }} />
          <Skeleton height={110} />
        </View>
      </View>
    );
  }
  if (order.error || !o) {
    return (
      <View style={root}>
        {header("Pedido")}
        <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
      </View>
    );
  }

  const m = merchant.data;
  const mData = { name: o.merchant_name ?? m?.name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo ?? m?.logo_url };
  const productById = new Map((products.data ?? []).map((p) => [p.id, p]));
  const rated = Boolean(rating.data);
  const list = items.data ?? [];

  return (
    <View style={root}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) }} showsVerticalScrollIndicator={false}>
        {header(`Pedido #${o.number}`)}

        <View style={styles.body}>
          {/* Check + título */}
          <View style={styles.hero}>
            <View style={styles.check}><BoldCheck width={18} stroke={2.7} /></View>
            <View style={{ marginLeft: 11.3, marginTop: 0.9, flex: 1 }}>
              <Text style={[t(18.4, "700", colors.ink, 23), { letterSpacing: -0.1 }]}>Pedido entregado</Text>
              <Text style={[t(12.57, "400", "#4C5676", 16), { marginTop: -0.3 }]}>{relativeDateTime(o.delivered_at).replace(" · ", ", ")}</Text>
            </View>
          </View>

          {/* Comercio (C20a) */}
          {o.merchant_name ? (
            <OrderCard style={styles.merchantCard} onPress={o.merchant_id ? () => router.push(`/(customer)/merchant/${o.merchant_id}` as never) : undefined} accessibilityLabel={`Ver ${o.merchant_name}`}>
              <OrderThumb source={orderMerchantPhoto(mData, "delivered")} width={126.1} height={60} radius={10} />
              <View style={styles.merchantText}>
                <Text style={t(14.95, "600", colors.ink, 19)} numberOfLines={1}>{o.merchant_name}</Text>
                <Text style={[t(11.4, "400", colors.textSecondary, 15), { marginTop: 3 }]} numberOfLines={1}>{m?.tagline ?? ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#14243D" style={{ marginRight: 4 }} />
            </OrderCard>
          ) : null}

          {/* Tu pedido */}
          <Text style={[t(16.4, "700", colors.ink, 21), { marginTop: 13.5 }]}>{o.type === "shipment" ? "Tu envío" : "Tu pedido"}</Text>
          <View style={{ marginTop: 12.3 }}>
            {items.isLoading ? <Skeleton height={54} /> : !list.length ? (
              <Text style={t(12.75, "400", colors.textTertiary, 17)}>{o.type === "shipment" ? "Envío de paquete punto a punto" : "Sin productos"}</Text>
            ) : list.map((it, i) => {
              const p = it.product_id ? productById.get(it.product_id) : undefined;
              return (
                <React.Fragment key={it.id}>
                  {i > 0 ? <View style={styles.itemDivider} /> : null}
                  <View style={styles.itemRow}>
                    <OrderThumb source={orderItemPhoto({ name: it.name, image_urls: p?.image_urls }, "delivered")} width={56.8} height={54} radius={10} />
                    <View style={styles.itemText}>
                      <Text style={t(12.85, "600", colors.ink, 17)} numberOfLines={2}>{it.name}</Text>
                      <Text style={[t(11.4, "400", "#606B82", 15), { marginTop: 2 }]}>{it.qty} {it.qty === 1 ? "unidad" : "unidades"}</Text>
                    </View>
                    <Text style={[t(14.3, "400", colors.ink, 18), { marginTop: 5.4 }]}>{formatCOP(it.total)}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
          <View style={[styles.rule, { marginTop: 11.3 }]} />

          {/* Resumen de pago */}
          <Text style={[t(16.3, "700", colors.ink, 21), { marginTop: 12.8 }]}>Resumen de pago</Text>
          <View style={{ marginTop: 7.3 }}>
            <SummaryRow label="Productos" value={formatCOP(o.items_subtotal ?? 0)} />
            <SummaryRow label="Envío" value={(o.delivery_fee ?? 0) > 0 ? formatCOP(o.delivery_fee) : "Gratis"} />
            <SummaryRow label="Servicio" value={formatCOP(o.service_fee ?? 0)} />
            {(o.discount ?? 0) > 0 ? <SummaryRow label="Descuento" value={`-${formatCOP(o.discount)}`} tone="success" /> : null}
          </View>
          <View style={[styles.rule, { marginTop: 4.9 }]} />
          <View style={{ marginTop: 7.5 }}>
            <SummaryRow label={o.payment_status === "paid" ? "Total pagado" : "Total"} value={formatCOP(o.total ?? 0)} strong />
          </View>
          <Pressable onPress={() => router.push(`/(customer)/order/${id}/detail` as never)} accessibilityRole="button" accessibilityLabel={`Pago: ${pay.label}. Ver detalle`}
            style={({ pressed }) => [styles.payRow, pressed && { opacity: 0.7 }]}>
            <PaymentTile isVisa={pay.isVisa} icon={pay.icon} width={34.6} height={24.5} variant="solid" />
            <Text style={[t(12.63, "400", "#343C50", 17), styles.payText]} numberOfLines={1}>{pay.label}</Text>
            <Ionicons name="chevron-forward" size={15} color="#7F8CA1" />
          </Pressable>
          <View style={[styles.rule, { height: StyleSheet.hairlineWidth, backgroundColor: "#DDE1E7" }]} />

          {/* Entregado en */}
          <Text style={[t(16.2, "700", colors.ink, 21), { marginTop: 12.8 }]}>Entregado en</Text>
          <View style={styles.addrRow}>
            <View style={styles.pin}><Ionicons name="location" size={20.5} color="#303D4F" /></View>
            <View style={{ flex: 1, marginLeft: 12.2, marginTop: -0.1 }}>
              <Text style={t(12, "600", colors.ink, 16)}>{addr.label ?? "Dirección"}</Text>
              <Text style={[t(10.7, "400", "#616C81", 15), { marginTop: -0.3 }]} numberOfLines={2}>{addressLine(addr)}</Text>
              {o.city_name ? <Text style={[t(10.7, "400", "#7E8799", 15), { marginTop: 1.2 }]}>{o.city_name}</Text> : null}
            </View>
          </View>

          {/* Acciones */}
          <View style={{ marginTop: 16.5, gap: 7 }}>
            {!rated ? <PillButton title="Calificar pedido" bg={BLUE_BRIGHT} height={39.2} radius={13} fontSize={12.87} onPress={() => router.push(`/(customer)/order/${id}/rate` as never)} /> : null}
            {o.type !== "shipment" ? (
              <PillButton title="Volver a pedir" variant={rated ? "primary" : "soft"} bg={rated ? BLUE_BRIGHT : undefined} height={38.8} radius={13} fontSize={12.16} color={rated ? undefined : "#0040C8"}
                onPress={reorder} disabled={!merchant.data || !items.data} />
            ) : null}
          </View>
          <Pressable onPress={() => router.push(`/(customer)/support?order=${id}` as never)} hitSlop={8} accessibilityRole="button" style={styles.problem}>
            <Text style={t(10.92, "500", "#0B4CF2", 15)}>Tuve un problema</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 40 },
  back: { position: "absolute", left: 14.2, top: 5.85, width: 23, height: 23 },
  headerTitle: { position: "absolute", left: 56.8, right: 20, top: 7.9 },
  body: { paddingHorizontal: ORDER_GUTTER },
  hero: { flexDirection: "row", alignItems: "flex-start", marginTop: 6.7 },
  check: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EAF1FD", alignItems: "center", justifyContent: "center" },
  // En 23 la tarjeta del comercio sobresale ≈ 1,7 pt del margen por cada lado (x 15,2 → 377,5).
  merchantCard: { marginTop: 14, marginHorizontal: -1.7, height: 75.3, flexDirection: "row", alignItems: "center", paddingLeft: 8.35, paddingRight: 0.5 },
  merchantText: { flex: 1, marginLeft: 12.5, marginBottom: 4.8 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 54 },
  itemText: { flex: 1, marginLeft: 12.9, paddingRight: 10, paddingTop: 6.2 },
  itemDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E1E5EC", marginLeft: 69.4, marginTop: 7.9, marginBottom: 8.8 },
  rule: { height: 0.9, backgroundColor: DIVIDER },
  sumRow: { height: 23.3, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  payRow: { flexDirection: "row", alignItems: "center", marginTop: 10.3, marginBottom: 13.8 },
  payText: { flex: 1, marginLeft: 13, marginBottom: 2.6 },
  addrRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8.7 },
  pin: { width: 34.2, height: 34.2, borderRadius: 17.1, backgroundColor: "#F5F7FA", alignItems: "center", justifyContent: "center", marginLeft: 1 },
  problem: { alignSelf: "center", marginTop: 10.1, paddingVertical: 0 },
});
