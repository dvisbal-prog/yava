import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { designImages } from "@/lib/design-images";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { ErrorState } from "@/components/customer";
import { OrderCard, OrderThumb, PaymentTile, PillButton, useOrderPayment, t } from "@/components/customer/order/kit";
import { orderMerchantPhoto } from "@/components/customer/order/photos";
import { useOrder, useMerchant, useCheckout, openWompi, type CustomerPaymentChoice } from "@/features/customer";

/** Grises medidos en tanda-06/45-pago-fallido.png. */
const SUB = "#535E75";
const META = "#56627A";

/**
 * Pantalla 45 · Pago fallido (tanda-06/45-pago-fallido.png): ilustración, "No pudimos procesar el pago",
 * tarjeta del pedido, método de pago, "Cambiar método de pago" / "Reintentar" y "Volver a la canasta".
 * Si el pedido ya venció (el cron lo pasa a cancelado + fallido) se ve igual, sin "Reintentar".
 */
export default function PaymentFailed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Si el pago termina aprobándose (webhook tardío o reintento), salimos de aquí.
  const order = useOrder(id, { refetchInterval: 5000 });
  useRealtimeOrder(id);
  const checkout = useCheckout();
  const [busy, setBusy] = useState<string | null>(null);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const pay = useOrderPayment(o);
  /** `selectedAt` del store al abrir Métodos de pago; null = no estamos eligiendo método. */
  const choosingSince = useRef<number | null>(null);

  useEffect(() => {
    if (o?.payment_status === "paid" && o.status !== "pending_payment" && o.status !== "cancelled") {
      router.replace(`/(customer)/order/${id}/confirmed` as never);
    }
  }, [o, id, router]);

  async function retry() {
    if (!o) return;
    setBusy("retry");
    // Línea base del servidor: la pantalla 20 ignora el "failed" anterior hasta que el pedido cambie después de esto.
    const since = o.updated_at ?? new Date().toISOString();
    try {
      await openWompi(id, o.total ?? 0);
      router.replace(`/(customer)/order/${id}/confirmed?retry=${encodeURIComponent(since)}` as never);
    } catch (e) {
      notify("No se pudo abrir el pago", errorMessage(e));
    } finally { setBusy(null); }
  }

  function changeMethod() {
    if (!o) return;
    // Deja marcado el método del pedido; cualquier elección en la pantalla 17 cambia `selectedAt`.
    checkout.setMethod("card", o.payment_method_id ?? null);
    choosingSince.current = useCheckout.getState().selectedAt;
    router.push("/(customer)/payment-methods?select=1" as never);
  }

  const applyMethod = useCallback(async (method: CustomerPaymentChoice) => {
    if (!o) return;
    // Otra tarjeta: el usuario sigue aquí y toca "Reintentar" (Wompi pide los datos de la tarjeta).
    if (method === "card" && o.status === "pending_payment") return;
    setBusy("change");
    try {
      // Efectivo / Nequi (o pedido ya vencido): se anula el intento con tarjeta y se vuelve a "Revisar y pagar".
      // Con tarjeta la canasta solo se vacía al confirmar el pago, así que sigue intacta.
      if (o.status === "pending_payment" && o.payment_status !== "paid") {
        const { error } = await supabase.rpc("cancel_order", { p_order_id: id, p_reason: "Cambio de método de pago" });
        if (error) throw error;
      }
      router.replace("/(customer)/checkout" as never);
    } catch (e) {
      notify("No se pudo cambiar", errorMessage(e));
    } finally { setBusy(null); }
  }, [o, id, router]);

  // Al volver de Métodos de pago: aplicar solo si el usuario eligió algo.
  useFocusEffect(useCallback(() => {
    const since = choosingSince.current;
    if (since == null) return;
    choosingSince.current = null;
    const { method, selectedAt } = useCheckout.getState();
    if (selectedAt === since) return;
    void applyMethod(method);
  }, [applyMethod]));

  const root = [styles.root, { paddingTop: insets.top }];

  if (order.error || (!order.isLoading && !o)) {
    return (
      <View style={[root, { paddingHorizontal: 17.5 }]}>
        <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
        <PillButton title="Volver a la canasta" variant="link" height={40} fontSize={12.3} onPress={() => router.replace("/(customer)/cart" as never)} />
      </View>
    );
  }

  const cancelled = o?.status === "cancelled";
  const shipment = o?.type === "shipment";
  const m = merchant.data;
  const photo = shipment ? designImages.envioCaja
    : o ? orderMerchantPhoto({ name: o.merchant_name ?? m?.name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo ?? m?.logo_url }, "failed") : undefined;
  const count = o?.items_count ?? 0;

  return (
    <View style={root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} showsVerticalScrollIndicator={false}>
        <Image source={designImages.pagoFallidoLimpio} style={styles.art} contentFit="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.title} accessibilityRole="header">No pudimos procesar el pago</Text>
        <Text style={styles.subtitle}>Tu pedido aún no se ha confirmado.</Text>

        {/* Pedido (C20a) */}
        <OrderCard style={styles.orderCard}>
          {o ? <OrderThumb source={photo} width={104.4} height={81.3} radius={12} /> : <Skeleton width={104.4} height={81.3} style={{ borderRadius: 12 }} />}
          <View style={styles.orderText}>
            {o ? (
              <>
                <Text style={t(16.1, "600", colors.ink, 20)} numberOfLines={1}>{shipment ? "Envío" : o.merchant_name}</Text>
                <Text style={[t(12.8, "400", META, 17), { marginTop: 0.6 }]}>
                  {shipment ? "Paquete punto a punto" : `${count} ${count === 1 ? "producto" : "productos"}`}
                </Text>
                <Text style={[t(11.8, "400", META, 18), { marginTop: 2.6 }]}>
                  Total  <Text style={t(13.75, "700", colors.ink, 18)}>{formatCOP(o.total)}</Text>
                </Text>
              </>
            ) : (
              <View style={{ gap: 8 }}><Skeleton width={110} height={16} /><Skeleton width={80} height={12} /><Skeleton width={100} height={14} /></View>
            )}
          </View>
        </OrderCard>

        {/* Método de pago */}
        <OrderCard style={styles.payCard} onPress={o && !busy ? changeMethod : undefined} accessibilityLabel={`Método de pago: ${pay.label}. Cambiar`}>
          <PaymentTile isVisa={pay.isVisa} icon={pay.icon} width={49.5} height={32.8} />
          <Text style={[t(14.2, "400", colors.ink, 19), { flex: 1, marginLeft: 13.4 }]} numberOfLines={1}>{o ? pay.label : ""}</Text>
          <Ionicons name="chevron-forward" size={20} color="#7C859A" style={{ marginRight: 12.8 }} />
        </OrderCard>

        <Text style={styles.note}>Revisa tu método de pago o intenta de nuevo.</Text>

        <PillButton title="Cambiar método de pago" height={48.9} radius={14} fontSize={14.5} style={styles.primary}
          onPress={changeMethod} loading={busy === "change"} disabled={!o || busy !== null} />
        {!cancelled ? (
          <PillButton title="Reintentar" variant="outline" height={50.3} radius={14} fontSize={14} color="#0A3DB8" style={styles.retry}
            onPress={() => { void retry(); }} loading={busy === "retry"} disabled={!o || busy !== null} />
        ) : null}
        <Pressable onPress={() => router.replace("/(customer)/cart" as never)} accessibilityRole="button" hitSlop={10}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <Text style={t(12.6, "500", colors.blueLink, 16)}>Volver a la canasta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 18 },
  art: { width: 93.8, height: 103.1, alignSelf: "center", marginTop: 88.3, marginLeft: 4.8 },
  // Titular de 45: letra más alta y apretada que SF a 24 pt (mismo ancho de tinta, 24,5 pt de alto con descendentes).
  title: { fontSize: 25.4, lineHeight: 30, fontWeight: "700", color: colors.ink, textAlign: "center", letterSpacing: -0.75, marginTop: 15.3 },
  subtitle: { fontSize: 17.4, lineHeight: 21, color: SUB, textAlign: "center", marginTop: 11.6 },
  orderCard: { flexDirection: "row", alignItems: "center", height: 107.1, marginTop: 26.8, paddingLeft: 12.5 },
  orderText: { flex: 1, marginLeft: 15.3, paddingRight: 10 },
  payCard: { flexDirection: "row", alignItems: "center", height: 66.5, marginTop: 16.7, paddingLeft: 16.6 },
  note: { fontSize: 12.1, lineHeight: 16, color: "#4B5568", textAlign: "center", marginTop: 18.8 },
  primary: { marginTop: 21.1 },
  retry: { marginTop: 10.7, borderColor: "#A3AABA" },
  link: { alignSelf: "center", marginTop: 23.1, paddingVertical: 2 },
});
