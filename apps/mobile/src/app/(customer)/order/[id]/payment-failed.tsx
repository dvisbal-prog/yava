import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Text, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useOrder, useCheckout, openWompi } from "@/features/customer";

/** Pantalla 45 · Pago fallido: reintentar o cambiar método. */
export default function PaymentFailed() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const checkout = useCheckout();
  const [busy, setBusy] = useState<string | null>(null);
  const o = order.data;

  async function retry() {
    if (!o) return;
    setBusy("retry");
    try {
      await openWompi(id, o.total ?? 0);
      router.replace(`/(customer)/order/${id}/confirmed` as never);
    } finally { setBusy(null); }
  }

  async function changeMethod() {
    setBusy("change");
    try {
      if (o && o.status === "pending_payment") {
        const { error } = await supabase.rpc("cancel_order", { p_order_id: id, p_reason: "Cambio de método de pago" });
        if (error) throw error;
      }
      checkout.setMethod("cash");
      router.replace("/(customer)/checkout" as never);
    } catch (e) {
      Alert.alert("No se pudo cambiar", errorMessage(e));
    } finally { setBusy(null); }
  }

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        <Button title="Reintentar pago" onPress={retry} loading={busy === "retry"} disabled={!o || o.status === "cancelled"} />
        <Button title="Cambiar método de pago" variant="outline" onPress={changeMethod} loading={busy === "change"} />
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
