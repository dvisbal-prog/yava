import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Text, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { useOrder, useCheckout, openWompi, type CustomerPaymentChoice } from "@/features/customer";

/** Pantalla 45 · Pago fallido: reintentar o cambiar método. */
export default function PaymentFailed() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Si el pago termina aprobándose (webhook tardío o reintento), salimos de aquí.
  const order = useOrder(id, { refetchInterval: 5000 });
  useRealtimeOrder(id);
  const checkout = useCheckout();
  const [busy, setBusy] = useState<string | null>(null);
  const o = order.data;
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
    // Otra tarjeta: el usuario sigue aquí y toca "Reintentar pago" (Wompi pide los datos de la tarjeta).
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

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        <Button title="Reintentar pago" onPress={() => { void retry(); }} loading={busy === "retry"} disabled={!o || o.status === "cancelled" || busy !== null} />
        <Button title="Cambiar método de pago" variant="outline" onPress={changeMethod} loading={busy === "change"} disabled={!o || busy !== null} />
        <Button title="Volver al inicio" variant="ghost" onPress={() => router.replace("/(customer)" as never)} />
      </View>
    }>
      <View style={styles.center}>
        <View style={styles.circle}><Ionicons name="close" size={52} color={colors.white} /></View>
        <Text variant="display" style={{ marginTop: 24, textAlign: "center" }}>No pudimos procesar tu pago</Text>
        <Text tone="muted" style={{ marginTop: 8, textAlign: "center" }}>Tu banco rechazó la transacción o se agotó el tiempo. No se hizo ningún cobro.</Text>
        {o ? <Text variant="caption" tone="subtle" style={{ marginTop: 20 }}>Pedido #{o.number} · {formatCOP(o.total)}</Text> : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 64, paddingHorizontal: 8 },
  circle: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.red, alignItems: "center", justifyContent: "center" },
});
