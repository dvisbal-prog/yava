import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text, StatusPill, Button } from "@/components/ui";
import type { OrderSummaryRow } from "@/features/customer/types";
import { relativeDateTime, etaLabel } from "@/features/customer/helpers";

export function OrderCard({ o, onPress, onReorder, onRate }: { o: OrderSummaryRow; onPress: () => void; onReorder?: () => void; onRate?: () => void }) {
  const title = o.type === "shipment" ? "Envío" : (o.merchant_name ?? "Pedido");
  const count = Number(o.items_count ?? 0);
  const active = o.status && !["delivered", "cancelled"].includes(o.status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {o.type === "shipment" ? (
          <View style={[styles.img, { alignItems: "center", justifyContent: "center", backgroundColor: colors.yellowSoft }]}><Ionicons name="cube-outline" size={22} color="#8A6400" /></View>
        ) : (
          <Image source={{ uri: o.merchant_logo ?? undefined }} style={styles.img} contentFit="cover" />
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{title}</Text>
          <Text variant="caption" tone="muted">{o.type === "shipment" ? "Paquete" : `${count} ${count === 1 ? "producto" : "productos"}`} · #{o.number}</Text>
        </View>
        <Text variant="bodyStrong">{formatCOP(o.total)}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        {o.status ? <StatusPill status={o.status} /> : <View />}
        <Text variant="caption" tone="muted">{active && o.eta_min ? `Llega en ${etaLabel(o.eta_min, o.eta_max)}` : relativeDateTime(o.delivered_at ?? o.cancelled_at ?? o.placed_at)}</Text>
      </View>
      {!active && (onReorder || onRate) ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <Button title="Ver detalle" variant="outline" size="sm" onPress={onPress} style={{ flex: 1 }} />
          {o.status === "delivered" && onRate ? <Button title="Calificar" variant="secondary" size="sm" onPress={onRate} style={{ flex: 1 }} /> : null}
          {onReorder && o.type !== "shipment" ? <Button title="Volver a pedir" size="sm" onPress={onReorder} style={{ flex: 1 }} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, padding: 14, marginBottom: 12 },
  img: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.gray100 },
});
