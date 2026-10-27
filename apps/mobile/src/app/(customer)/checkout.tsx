import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, computeTotals } from "@yava/shared";
import { Screen, Header, Text, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { PriceBreakdown, ErrorState } from "@/components/customer";
import { useAddresses, useCoverage, useCoupon, usePaymentMethods, useCheckout, activateAddress, etaLabel, loginHref, WOMPI_PUBLIC_KEY, openWompi, type OrderSummaryRow } from "@/features/customer";

function Row({ icon, title, subtitle, onPress, actionLabel = "Cambiar", danger }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; actionLabel?: string; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={[styles.iconBox, danger && { backgroundColor: colors.redSoft }]}><Ionicons name={icon} size={20} color={danger ? colors.red : colors.blue} /></View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" tone={danger ? "danger" : "muted"} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {onPress ? <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{actionLabel}</Text> : null}
    </Pressable>
  );
}

/** Pantalla 16 · Revisar y pagar (+ 46 fuera de cobertura). */
export default function Checkout() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const cart = useCart();
  const activeAddress = useLocation((s) => s.address);
  const addresses = useAddresses();
  const checkout = useCheckout();
  const paymentMethods = usePaymentMethods();
  const coupon = useCoupon(cart.couponCode);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const methodLabel = checkout.method === "cash" ? "Efectivo" : checkout.method === "nequi" ? "Nequi / Daviplata" : savedCard ? `${savedCard.brand ?? "Tarjeta"} •••• ${savedCard.last4 ?? ""}` : "Tarjeta";
  const methodSubtitle = checkout.method === "cash" ? "Pagas al recibir" : checkout.method === "nequi" ? "Pagas al recibir con transferencia" : "Pago seguro con Wompi";

  async function placeOrder() {
    if (!session) { router.push(loginHref("/(customer)/checkout") as never); return; }
    if (!cart.merchant || !activeAddress) return;
    setPlacing(true); setError(null);
    try {
      const items = cart.lines.map((l) => ({ product_id: l.product_id, qty: l.qty, option_ids: l.options.map((o) => o.option_id), notes: l.notes ?? null }));
      const { data, error: e } = await supabase.rpc("place_order", {
        p_merchant_id: cart.merchant.id, p_address_id: activeAddress.id, p_items: items, p_payment_method: checkout.method,
        p_payment_method_id: checkout.method === "card" ? (savedCard?.id ?? undefined) : undefined,
        p_coupon_code: couponValid && totals.discount > 0 ? couponValid.code : undefined, p_notes: cart.notes.trim() || undefined,
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

  if (!session) {
    return (
      <Screen><Header title="Revisar y pagar" />
        <EmptyState icon="lock-closed-outline" title="Inicia sesión para pedir" body="Guarda tu dirección y sigue tu pedido en tiempo real." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/checkout") as never)} />
      </Screen>
    );
  }
  if (!cart.lines.length || !cart.merchant) {
    return (
      <Screen><Header title="Revisar y pagar" />
        <EmptyState icon="basket-outline" title="Tu canasta está vacía" actionTitle="Ver restaurantes" onAction={() => router.replace("/(customer)/restaurants?category=food" as never)} />
      </Screen>
    );
  }
  if (outOfCoverage) {
    return (
      <Screen><Header title="Revisar y pagar" />
        <EmptyState icon="map-outline" title="Aún no llegamos a tu zona" body={`${activeAddress?.line1 ?? "Tu dirección"} está fuera de nuestra cobertura. Prueba con otra dirección en Puerto Colombia o Barranquilla.`}
          actionTitle="Cambiar dirección" onAction={() => router.push("/modal/address-picker" as never)}
          secondaryTitle="Avísame cuando lleguen" onSecondary={() => notify("Te avisaremos", "Te notificaremos cuando YAVA llegue a tu zona.")} />
        <Button title="Volver al inicio" variant="ghost" onPress={() => router.replace("/(customer)" as never)} />
      </Screen>
    );
  }

  const eta = etaLabel((cart.merchant.prep_min ?? 0) + 10, (cart.merchant.prep_max ?? 0) + 15);

  return (
    <Screen footer={
      <View>
        {error ? <Text tone="danger" variant="caption" style={{ marginBottom: 8, textAlign: "center" }}>{error}</Text> : null}
        <Button title={`Pagar ${formatCOP(totals.total)}`} onPress={placeOrder} loading={placing} disabled={!activeAddress || coverage.isLoading} />
      </View>
    }>
      <Header title="Revisar y pagar" />
      <Card padded={false} style={{ marginTop: 8 }}>
        {addresses.isLoading && !activeAddress ? <View style={{ padding: 14 }}><Skeleton height={40} /></View> : activeAddress ? (
          <Row icon="location-outline" title={`${activeAddress.label} · ${activeAddress.line1}`} subtitle={[activeAddress.line2, activeAddress.instructions].filter(Boolean).join(" · ") || undefined} onPress={() => router.push("/modal/address-picker" as never)} />
        ) : (
          <Row icon="location-outline" title="Agrega una dirección" subtitle="Necesitamos saber dónde entregarte" onPress={() => router.push("/(customer)/location?next=%2F(customer)%2Fcheckout" as never)} actionLabel="Agregar" danger />
        )}
        {coverage.error ? <ErrorState error={coverage.error} onRetry={() => { void coverage.refetch(); }} compact /> : null}
        <Row icon="time-outline" title={`Llega en ${eta}`} subtitle={`${cart.merchant.name} · ${cart.lines.reduce((a, l) => a + l.qty, 0)} productos`} />
        <Row icon={checkout.method === "cash" ? "cash-outline" : checkout.method === "nequi" ? "phone-portrait-outline" : "card-outline"} title={methodLabel} subtitle={methodSubtitle} onPress={() => router.push("/(customer)/payment-methods?select=1" as never)} />
        <Row icon="pricetag-outline" title={couponValid ? `Cupón ${couponValid.code}` : "Agregar cupón"}
          subtitle={couponValid ? (totals.discount > 0 ? (couponValid.description ?? "Aplicado") : `Pedido mínimo ${formatCOP(couponValid.min_order)}`) : cart.couponCode && !coupon.isLoading ? "Cupón no válido para este pedido" : "¿Tienes un código?"}
          onPress={() => router.push("/(customer)/coupon" as never)} actionLabel={couponValid ? "Cambiar" : "Agregar"} danger={Boolean(cart.couponCode && !coupon.isLoading && !couponValid)} />
      </Card>

      <Text variant="heading" style={{ marginTop: 24, marginBottom: 6 }}>Tu pedido</Text>
      {cart.lines.map((l, i) => (
        <View key={`${l.product_id}-${i}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
          <Text style={{ flex: 1, paddingRight: 12 }} numberOfLines={1}>{l.qty} × {l.name}{l.options.length ? ` (${l.options.map((o) => o.name).join(", ")})` : ""}</Text>
          <Text>{formatCOP((l.unit_price + l.options.reduce((a, o) => a + o.price_delta, 0)) * l.qty)}</Text>
        </View>
      ))}
      <Pressable onPress={() => router.push("/(customer)/cart" as never)} hitSlop={8} style={{ paddingVertical: 6 }}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>Editar canasta</Text></Pressable>

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 6 }}>Resumen de pago</Text>
      <PriceBreakdown subtotal={totals.subtotal} deliveryFee={totals.deliveryFee} serviceFee={totals.serviceFee} discount={totals.discount} total={totals.total} />
      <Text variant="small" tone="subtle" style={{ marginTop: 12 }}>Al pagar aceptas los Términos de YAVA. El total se confirma en el servidor.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
});
