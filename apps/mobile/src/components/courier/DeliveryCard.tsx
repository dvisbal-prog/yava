import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatTime } from "@yava/shared";
import { Card, Text, Badge } from "@/components/ui";
import type { AvailableOrder } from "@/features/courier/types";
import { formatKm } from "@/features/courier/types";
import { parseAddress, addressLine } from "@/features/merchant/types";

/** Tarjeta de entrega disponible (pantalla 60). */
export function DeliveryCard({ order, onPress }: { order: AvailableOrder; onPress: () => void }) {
  const addr = parseAddress(order.delivery_address);
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Ionicons name={order.type === "shipment" ? "cube-outline" : "storefront-outline"} size={20} color={colors.carbon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{order.merchant_name ?? "Envío"} · #{order.number}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>{order.merchant_address ?? ""}</Text>
        </View>
        <Text variant="heading" tone="primary">{formatCOP(order.courier_payout)}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
        <Ionicons name="location-outline" size={16} color={colors.gray500} />
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1, marginLeft: 4 }}>{addressLine(addr) || "Dirección de entrega"}</Text>
        {order.distance_km != null ? <Badge label={formatKm(order.distance_km)} tone="gray" /> : null}
        <Text variant="small" tone="subtle" style={{ marginLeft: 8 }}>{formatTime(order.placed_at)}</Text>
      </View>
    </Card>
  );
}
