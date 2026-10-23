import React from "react";
import { View } from "react-native";
import { formatCOP } from "@yava/shared";
import { Text, Divider } from "@/components/ui";

export function PriceRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "default" | "success" | "muted" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text variant={strong ? "bodyStrong" : "body"} tone={tone === "muted" ? "muted" : "default"}>{label}</Text>
      <Text variant={strong ? "heading" : "body"} tone={tone ?? "default"}>{value}</Text>
    </View>
  );
}

export function PriceBreakdown({ subtotal, deliveryFee, serviceFee, discount, total, totalLabel = "Total" }: {
  subtotal: number; deliveryFee: number; serviceFee: number; discount: number; total: number; totalLabel?: string;
}) {
  return (
    <View>
      <PriceRow label="Productos" value={formatCOP(subtotal)} />
      <PriceRow label="Envío" value={deliveryFee > 0 ? formatCOP(deliveryFee) : "Gratis"} />
      <PriceRow label="Servicio" value={formatCOP(serviceFee)} />
      {discount > 0 ? <PriceRow label="Descuento" value={`-${formatCOP(discount)}`} tone="success" /> : null}
      <Divider space={6} />
      <PriceRow label={totalLabel} value={formatCOP(total)} strong />
    </View>
  );
}
