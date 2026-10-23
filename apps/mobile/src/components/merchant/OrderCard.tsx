import React from "react";
import { View } from "react-native";
import { formatCOP, formatTime } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { colors } from "@yava/shared";
import { Card, Text, Button, StatusPill } from "@/components/ui";
import type { OrderSummaryRow, OrderItemRow } from "@/features/merchant/types";
import { parseAddress, addressLine } from "@/features/merchant/types";

function shortName(full: string | null | undefined): string {
  if (!full) return "Cliente";
  const [first, last] = full.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first;
}

/** Tarjeta de pedido para el comercio (pantalla 51). */
export function OrderCard({ order, items, onPress, actionTitle = "Ver pedido", compact }: {
  order: OrderSummaryRow; items?: OrderItemRow[]; onPress: () => void; actionTitle?: string; compact?: boolean;
}) {
  const addr = parseAddress(order.address_snapshot);
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <Text variant="heading">#{order.number}</Text>
        <Text variant="caption" tone="muted" style={{ marginLeft: 8, flex: 1 }}>{formatTime(order.placed_at)}</Text>
        {order.status ? <StatusPill status={order.status as OrderStatus} /> : null}
      </View>
      <Text variant="bodyStrong">{shortName(order.customer_name)}</Text>
      {!compact ? <Text variant="caption" tone="muted" numberOfLines={2}>{addr.label ? `${addr.label} · ` : ""}{addressLine(addr)}</Text> : null}
      {items && items.length ? (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
          {items.map((it) => (
            <View key={it.id} style={{ flexDirection: "row", marginBottom: 2 }}>
              <Text variant="caption" style={{ flex: 1 }}>{it.qty} x {it.name}</Text>
              <Text variant="caption" tone="muted">{formatCOP(it.total)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="muted">{order.items_count ?? 0} {order.items_count === 1 ? "producto" : "productos"}</Text>
          <Text variant="bodyStrong">{formatCOP(order.items_subtotal)}</Text>
        </View>
        <Button title={actionTitle} size="sm" full={false} variant="secondary" onPress={onPress} />
      </View>
    </Card>
  );
}
