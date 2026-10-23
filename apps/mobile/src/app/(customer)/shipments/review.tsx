import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Divider } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useLocation } from "@/store/location";
import { PriceRow, ErrorState } from "@/components/customer";
import { useShipmentFees, useShipmentDraft, useCheckout, useRequireAuth, type OrderSummaryRow } from "@/features/customer";

const SIZE_LABEL = { small: "Paquete pequeño · Hasta 2 kg", medium: "Paquete mediano · Hasta 8 kg", large: "Paquete grande · Hasta 15 kg" } as const;

/** Pantalla 32 · Revisa tu envío (cotización y confirmación). */
export default function ReviewShipment() {
  const router = useRouter();
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const { draft, reset } = useShipmentDraft();
  const fees = useShipmentFees();
  const checkout = useCheckout();
  const cityId = useLocation((s) => s.cityId);
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

  return (
    <Screen footer={
      <View>
        {error ? <Text tone="danger" variant="caption" style={{ marginBottom: 8, textAlign: "center" }}>{error}</Text> : null}
        <Button title={`Confirmar envío · ${formatCOP(total)}`} onPress={confirm} loading={busy} />
        <Text variant="small" tone="subtle" style={{ textAlign: "center", marginTop: 8 }}>El seguimiento estará disponible al confirmar.</Text>
      </View>
    }>
      <Header title="Revisa tu envío" />
      <Card style={{ marginTop: 8 }}>
        <View style={styles.pt}><View style={[styles.dot, { backgroundColor: colors.carbon }]} /><View style={{ flex: 1 }}><Text variant="caption" tone="muted">Recogida</Text><Text variant="bodyStrong">{[draft.pickupLine1, draft.pickupLine2].filter(Boolean).join(", ")}</Text></View></View>
        <View style={styles.vline} />
        <View style={styles.pt}><View style={[styles.dot, { backgroundColor: colors.blue }]} /><View style={{ flex: 1 }}><Text variant="caption" tone="muted">Entrega</Text><Text variant="bodyStrong">{draft.dropoffLine1}</Text><Text variant="caption" tone="muted">{draft.recipientName} · {draft.recipientPhone}</Text></View></View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="cube-outline" size={22} color={colors.blue} />
          <View style={{ marginLeft: 10, flex: 1 }}><Text variant="bodyStrong">{SIZE_LABEL[draft.size]}</Text><Text variant="caption" tone="muted">{draft.packageType}{draft.description ? ` · ${draft.description}` : ""}</Text></View>
        </View>
        <Divider space={10} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="time-outline" size={22} color={colors.blue} />
          <View style={{ marginLeft: 10, flex: 1 }}><Text variant="bodyStrong">35-50 min</Text><Text variant="caption" tone="muted">Tiempo estimado de entrega</Text></View>
        </View>
        <Divider space={10} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={method === "cash" ? "cash-outline" : "phone-portrait-outline"} size={22} color={colors.blue} />
          <View style={{ marginLeft: 10, flex: 1 }}><Text variant="bodyStrong">{method === "cash" ? "Efectivo" : "Nequi / Daviplata"}</Text><Text variant="caption" tone="muted">Pagas al recoger el paquete</Text></View>
          <Button title="Cambiar" variant="ghost" size="sm" full={false} onPress={() => router.push("/(customer)/payment-methods?select=1" as never)} />
        </View>
      </Card>

      <View style={{ marginTop: 20 }}>
        {fees.error ? <ErrorState error={fees.error} onRetry={() => { void fees.refetch(); }} compact /> : null}
        <PriceRow label="Envío" value={formatCOP(shipping)} />
        <PriceRow label="Servicio" value={formatCOP(service)} />
        <Divider space={6} />
        <PriceRow label="Total" value={formatCOP(total)} strong />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  pt: { flexDirection: "row", alignItems: "flex-start" },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, marginRight: 12 },
  vline: { width: 2, height: 18, backgroundColor: colors.gray200, marginLeft: 5, marginVertical: 2 },
});
