import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { colors, shadows, formatCOP, computeTotals, lineTotal } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { designImages } from "@/lib/design-images";
import { PriceBreakdown, ErrorState } from "@/components/customer";
import { NavBar, PillButton } from "@/components/customer/cart/parts";
import { CheckoutMapCard } from "@/components/customer/cart/MapCard";
import { DocLinesIcon } from "@/components/customer/cart/LineIcons";
import { OutOfCoverage, LoginRequired } from "@/components/customer/cart/CheckoutStates";
import { EmptyCart } from "@/components/customer/cart/EmptyCart";
import { etaSpaced, isStoreCart, useSubstitution } from "@/components/customer/cart/helpers";
import { useAddresses, useCoverage, useCoupon, usePaymentMethods, useCheckout, activateAddress, loginHref, WOMPI_PUBLIC_KEY, openWompi, type OrderSummaryRow } from "@/features/customer";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Fila C17a de "Finalizar pedido": ícono a la izquierda, título 15/600, 1–2 líneas 13,5 gris y acción a la derecha. */
function Row({ icon, ion, ionSize = 25, leading, title, lines, onPress, right, chevron = "forward", danger, subtitleTone, divider = true, a11y, tall, iconTop, chevronTop, iconShift, rowStyle }: {
  icon?: IconName;
  /** Ícono de Ionicons cuando su dibujo se parece más al del PNG (etiqueta y carrito de 16). */
  ion?: keyof typeof Ionicons.glyphMap;
  ionSize?: number;
  leading?: React.ReactNode; title: string; lines?: (string | null | undefined)[]; onPress?: () => void; right?: React.ReactNode;
  chevron?: "forward" | "down" | "up" | false; danger?: boolean; subtitleTone?: "link" | "danger" | "success"; divider?: boolean; a11y?: string;
  /** Filas de Pago, Cupón y Resumen: 61 pt en vez de 58. */
  tall?: boolean;
  /** Distancia del ícono al tope del contenido (fila de dirección: el pin va a la altura del título, no centrado). */
  iconTop?: number;
  /** Igual para el chevron (en la fila de dirección queda entre el título y la 1.ª línea, no centrado en las tres). */
  chevronTop?: number;
  /** Corrimiento fino del ícono [x, y] en pt: en el PNG los íconos no van centrados en la fila sino un poco más arriba. */
  iconShift?: [number, number];
  rowStyle?: StyleProp<ViewStyle>;
}) {
  const shown = (lines ?? []).filter(Boolean) as string[];
  const subColor = subtitleTone === "link" ? colors.blueLink : subtitleTone === "danger" ? colors.red : subtitleTone === "success" ? colors.green : colors.textTertiary;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={a11y}
      style={({ pressed }) => [styles.row, tall && styles.rowTall, divider && styles.rowDivider, rowStyle, pressed && { backgroundColor: colors.surfaceSoft }]}>
      <View style={[styles.rowIcon, iconTop !== undefined && { alignSelf: "flex-start", marginTop: iconTop }, iconShift && { transform: [{ translateX: iconShift[0] }, { translateY: iconShift[1] }] }]}>{leading ?? (ion ? <Ionicons name={ion} size={ionSize} color={danger ? colors.red : colors.ink} /> : icon ? <MaterialCommunityIcons name={icon} size={26} color={danger ? colors.red : colors.ink} /> : null)}</View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.rowTitle, danger ? { color: colors.red } : null]}>{title}</Text>
        {shown.map((l, i) => (
          <Text key={i} numberOfLines={1} style={[styles.rowSub, { color: i === 0 ? subColor : colors.textTertiary }]}>{l}</Text>
        ))}
      </View>
      {right ?? (chevron ? <Ionicons name={chevron === "forward" ? "chevron-forward" : chevron === "down" ? "chevron-down" : "chevron-up"} size={19} color={colors.iconGray} style={[{ marginLeft: 8 }, chevronTop !== undefined && { alignSelf: "flex-start", marginTop: chevronTop }]} /> : null)}
    </Pressable>
  );
}

/** Pantalla 16 · Finalizar pedido (tanda-02/16-pago.png), + aviso de fuera de cobertura. */
export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const cart = useCart();
  const activeAddress = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const addresses = useAddresses();
  const checkout = useCheckout();
  const paymentMethods = usePaymentMethods();
  const coupon = useCoupon(cart.couponCode);
  const substitution = useSubstitution((s) => s.choice);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);

  // Si no hay dirección activa, usa la principal.
  useEffect(() => {
    if (activeAddress || !addresses.data?.length) return;
    const def = addresses.data.find((a) => a.is_default) ?? addresses.data[0];
    void activateAddress(def);
  }, [activeAddress, addresses.data]);

  const coverage = useCoverage(activeAddress?.lat, activeAddress?.lng);
  const outOfCoverage = activeAddress?.lat != null && coverage.data === null && !coverage.isLoading && !coverage.error;

  // Sin llave de Wompi no ofrecemos tarjeta.
  useEffect(() => { if (checkout.method === "card" && !WOMPI_PUBLIC_KEY) checkout.setMethod("cash"); }, [checkout]);

  const couponValid = useMemo(() => {
    const c = coupon.data;
    if (!c) return null;
    const now = Date.now();
    if ((c.valid_to && new Date(c.valid_to).getTime() < now) || (c.valid_from && new Date(c.valid_from).getTime() > now)) return null;
    if (c.merchant_id && c.merchant_id !== cart.merchant?.id) return null;
    return c;
  }, [coupon.data, cart.merchant?.id]);

  const totals = useMemo(() => computeTotals({
    lines: cart.lines, deliveryFee: cart.merchant?.delivery_fee ?? 0,
    coupon: couponValid ? { type: couponValid.type, value: couponValid.value, min_order: couponValid.min_order } : null,
  }), [cart.lines, cart.merchant?.delivery_fee, couponValid]);

  const savedCard = paymentMethods.data?.find((p) => p.id === checkout.paymentMethodId) ?? paymentMethods.data?.find((p) => p.method === "card");
  const storeCart = isStoreCart(cart.merchant?.category);

  async function placeOrder() {
    if (!session) { router.push(loginHref("/(customer)/checkout") as never); return; }
    if (!cart.merchant || !activeAddress) return;
    setPlacing(true); setError(null);
    try {
      const items = cart.lines.map((l) => ({ product_id: l.product_id, qty: l.qty, option_ids: l.options.map((o) => o.option_id), notes: l.notes ?? null }));
      // En mercado/farmacia, la preferencia "Si falta un producto" (28) viaja en las notas del pedido.
      const notes = [cart.notes.trim(), storeCart ? `Si falta un producto: ${substitution}.` : ""].filter(Boolean).join("\n");
      const { data, error: e } = await supabase.rpc("place_order", {
        p_merchant_id: cart.merchant.id, p_address_id: activeAddress.id, p_items: items, p_payment_method: checkout.method,
        p_payment_method_id: checkout.method === "card" ? (savedCard?.id ?? undefined) : undefined,
        p_coupon_code: couponValid && totals.discount > 0 ? couponValid.code : undefined, p_notes: notes || undefined,
      });
      if (e) throw e;
      const order = data as OrderSummaryRow;
      void qc.invalidateQueries({ queryKey: ["orders"] });
      if (checkout.method === "card" && WOMPI_PUBLIC_KEY && order.id) {
        // La canasta se vacía cuando el pago se confirma (pantalla 20); así se puede reintentar o cambiar método (45).
        await openWompi(order.id, order.total ?? totals.total);
        router.replace(`/(customer)/order/${order.id}/confirmed` as never);
        return;
      }
      cart.clear();
      router.replace(`/(customer)/order/${order.id}/confirmed` as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPlacing(false);
    }
  }

  if (!session) return <LoginRequired onLogin={() => router.push(loginHref("/(customer)/checkout") as never)} />;
  if (!cart.lines.length || !cart.merchant) {
    return <EmptyCart title="Finalizar pedido" onExplore={() => router.replace("/(customer)/restaurants?category=food" as never)} onHome={() => router.replace("/(customer)" as never)} />;
  }
  if (outOfCoverage) {
    return (
      <OutOfCoverage address={activeAddress?.line1}
        onChange={() => router.push("/(customer)/location?next=%2F(customer)%2Fcheckout" as never)}
        onHome={() => router.replace("/(customer)" as never)}
        onNotify={() => notify("Te avisaremos", "Te notificaremos cuando YAVA llegue a tu zona.")} />
    );
  }

  const merchant = cart.merchant;
  const count = cart.lines.reduce((a, l) => a + l.qty, 0);
  const eta = etaSpaced((merchant.prep_min ?? 0) + 10, (merchant.prep_max ?? 0) + 15);
  const editAddress = activeAddress ? () => router.push(`/(customer)/address?id=${activeAddress.id}&next=${encodeURIComponent("/(customer)/checkout")}` as never) : undefined;

  // Pago: tarjeta guardada (VISA del diseño), efectivo o Nequi.
  const isCard = checkout.method === "card";
  const brand = savedCard?.brand ?? "Tarjeta";
  const payLine = checkout.method === "cash" ? "Efectivo · Pagas al recibir" : checkout.method === "nequi" ? "Nequi / Daviplata · Al recibir" : savedCard ? `${brand} •••• ${savedCard.last4 ?? ""}` : "Tarjeta · Pago seguro con Wompi";
  const visaTile = isCard && /visa/i.test(brand);
  const payLeading = visaTile ? <Image source={designImages.pagoVisa} style={styles.visa} contentFit="contain" />
    // Sin tarjeta Visa: ícono de línea como el resto de filas (el billete relleno de MCI se veía más pesado).
    : <Ionicons name={checkout.method === "cash" ? "cash-outline" : checkout.method === "nequi" ? "phone-portrait-outline" : "card-outline"} size={27} color={colors.ink} />;

  // Cupón
  const couponLine = couponValid
    ? (totals.discount > 0 ? `${couponValid.code} · ${couponValid.description ?? "Aplicado"}` : `${couponValid.code} · Pedido mínimo ${formatCOP(couponValid.min_order)}`)
    : cart.couponCode && !coupon.isLoading ? "Cupón no válido para este pedido" : "Agregar cupón";
  const couponTone = couponValid ? (totals.discount > 0 ? "success" : undefined) : cart.couponCode && !coupon.isLoading ? "danger" : "link";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="circle" title="Finalizar pedido" titleX={57.2} titleTop={15.2} titleStyle={{ fontSize: 16.4 }} backSize={31} backLeft={17.1} backTop={10.2} height={50} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {activeAddress?.lat != null && activeAddress?.lng != null ? (
          <CheckoutMapCard lat={activeAddress.lat} lng={activeAddress.lng} style={styles.map}
            onAdjust={() => router.push("/(customer)/location?next=%2F(customer)%2Fcheckout" as never)} />
        ) : null}

        <View style={styles.rows}>
          {addresses.isLoading && !activeAddress ? (
            <View style={[styles.row, styles.rowDivider]}><Skeleton height={44} /></View>
          ) : activeAddress ? (
            <Row leading={<Feather name="map-pin" size={22} color="#3A4253" />} title={activeAddress.label} lines={[[activeAddress.line1, activeAddress.line2].filter(Boolean).join(", "), cityName]}
              onPress={() => router.push("/modal/address-picker" as never)} a11y={`Dirección: ${activeAddress.label}. Cambiar`} iconTop={6.9} chevronTop={14.6} />
          ) : (
            <Row icon="map-marker-outline" title="Agrega una dirección" lines={["Necesitamos saber dónde entregarte"]} danger
              onPress={() => router.push("/(customer)/location?next=%2F(customer)%2Fcheckout" as never)} />
          )}
          {coverage.error ? <ErrorState error={coverage.error} onRetry={() => { void coverage.refetch(); }} compact /> : null}
          {activeAddress ? (
            <Row leading={<DocLinesIcon />} iconShift={[0.6, -3]} title="Entrega en la puerta" lines={[activeAddress.instructions || "Agrega indicaciones para el repartidor"]} onPress={editAddress} />
          ) : null}
          <Row icon="clock-outline" iconShift={[0, -4.5]} title="Entrega estimada" lines={[eta]}
            onPress={() => notify("Entrega estimada", `Incluye la preparación en ${merchant.name} y el trayecto hasta tu dirección.`)} />
          <Row leading={payLeading} title="Pago" lines={[payLine]} onPress={() => router.push("/(customer)/payment-methods?select=1" as never)}
            right={<View style={styles.change}><Text style={styles.changeText}>Cambiar</Text></View>} a11y="Pago. Cambiar método" tall iconShift={visaTile ? [2.6, -0.5] : [0, -3]} />
          <Row ion="pricetag-outline" iconShift={[-1, -5.2]} title="Cupón" lines={[couponLine]} subtitleTone={couponTone} onPress={() => router.push("/(customer)/coupon" as never)} tall />
          <Row ion="cart-outline" ionSize={27.5} iconShift={[0.5, -3.4]} rowStyle={{ paddingTop: 13.4, paddingBottom: 10 }} chevronTop={0.3} title={`Resumen de ${merchant.name}`} lines={[`${count} ${count === 1 ? "producto" : "productos"}`]}
            chevron={showItems ? "up" : "down"} onPress={() => setShowItems((v) => !v)} tall />
          {showItems ? (
            <View style={styles.items}>
              {cart.lines.map((l, i) => (
                <View key={`${l.product_id}-${i}`} style={styles.item}>
                  <Text variant="bodyS" style={{ flex: 1, paddingRight: 12 }} numberOfLines={2}>
                    {l.qty} × {l.name}{l.options.length ? <Text variant="bodyS" tone="tertiary">{` (${l.options.map((o) => o.name).join(", ")})`}</Text> : null}
                  </Text>
                  <Text variant="bodyS">{formatCOP(lineTotal(l))}</Text>
                </View>
              ))}
              <Pressable onPress={() => router.push("/(customer)/cart" as never)} hitSlop={8} style={{ paddingVertical: 6, alignSelf: "flex-start" }} accessibilityRole="button">
                <Text variant="bodyS" style={{ color: colors.blueLink, fontWeight: "600" }}>Editar canasta</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <PriceBreakdown subtotal={totals.subtotal} deliveryFee={totals.deliveryFee} serviceFee={totals.serviceFee} discount={totals.discount} total={totals.total}
          sizes={{ label: 12.2, value: 13.6, total: 14.2, totalValue: 13.3 }} style={styles.summary} />
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom + 16, 14) }]}>
        {error ? <Text variant="bodyS" style={styles.error}>{error}</Text> : null}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barLabel}>Total a pagar</Text>
            <Text style={styles.barTotal}>{formatCOP(totals.total)}</Text>
          </View>
          <PillButton title="Hacer pedido" onPress={placeOrder} loading={placing} disabled={!activeAddress || coverage.isLoading} height={47.5}
            tone={!activeAddress ? "disabled" : "blue"} color="#034ECC" style={{ width: 176.4 }} textStyle={{ fontSize: 15.9, fontWeight: "500" }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  map: { marginHorizontal: 12.5, marginTop: 1.7 },
  rows: { marginHorizontal: 13.4, marginTop: 5 },
  row: { flexDirection: "row", alignItems: "center", paddingTop: 9.1, paddingBottom: 10.5, paddingRight: 3, minHeight: 58 },
  rowTall: { paddingTop: 11.2, paddingBottom: 12.2 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowTitle: { fontSize: 14.6, lineHeight: 20, fontWeight: "600", color: colors.ink },
  rowSub: { fontSize: 12.8, lineHeight: 18 },
  rowIcon: { width: 37.8, alignItems: "center", marginRight: 12.3 },
  visa: { width: 36, height: 31.4, borderRadius: 6 },
  change: { height: 33.7, paddingHorizontal: 15, borderRadius: 13, backgroundColor: "#EAEDF1", alignItems: "center", justifyContent: "center", marginRight: -1.5 },
  changeText: { fontSize: 13.3, lineHeight: 18, fontWeight: "500", color: colors.ink },
  items: { paddingLeft: 50.1, paddingTop: 6, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  item: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 4 },
  summary: { marginLeft: 18.5, marginRight: 16, marginTop: 9.5 },
  bar: { paddingHorizontal: 18.5, paddingTop: 14.5, backgroundColor: colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, ...shadows.bar },
  error: { color: colors.red, textAlign: "center", marginBottom: 8 },
  barLabel: { fontSize: 11.4, lineHeight: 16, color: colors.textTertiary, marginTop: 0.5 },
  barTotal: { fontSize: 22.6, lineHeight: 26, fontWeight: "700", color: colors.ink, letterSpacing: -0.3, marginTop: -1.3 },
});
