import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { colors, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Medidas del resumen de precios (guía C20c). Por defecto, las de 16 "Finalizar pedido":
 * etiqueta 12,2 pt `textTertiary`, valor 13,6 pt tinta, filas cada 25 pt, separador y "Total" 14,2 pt bold.
 */
export interface PriceSizes {
  /** Tamaño de la etiqueta ("Productos", "Envío"…). */
  label: number;
  /** Tamaño del valor ("$34.000"). */
  value: number;
  /** Alto de cada fila (paso vertical). */
  row: number;
  /** Etiqueta y valor de la fila "Total". */
  total: number;
  totalValue: number;
  /** Espacio arriba y abajo del separador antes de "Total". */
  gap: number;
  /** Espacio bajo el separador si difiere del de arriba (44). Por defecto, `gap`. */
  gapBelow?: number;
}
export const PRICE_SIZES_DEFAULT: PriceSizes = { label: 12.2, value: 13.6, row: 25, total: 14.2, totalValue: 13.3, gap: 8.3 };

export function PriceRow({ label, value, strong, tone, sizes = PRICE_SIZES_DEFAULT }: {
  label: string; value: string; strong?: boolean; tone?: "default" | "success" | "muted"; sizes?: PriceSizes;
}) {
  const ls = strong ? sizes.total : sizes.label;
  const vs = strong ? sizes.totalValue : sizes.value;
  const valueColor = tone === "success" ? colors.green : tone === "muted" ? colors.textTertiary : colors.ink;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: strong ? Math.round(ls * 1.45) : sizes.row }}>
      <Text style={{ fontSize: ls, lineHeight: Math.round(ls * 1.35), fontWeight: strong ? "700" : "400", color: strong ? colors.ink : colors.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: vs, lineHeight: Math.round(vs * 1.35), fontWeight: strong ? "700" : "400", color: valueColor }}>{value}</Text>
    </View>
  );
}

/**
 * Resumen de pago (C20c): Productos, Envío, Servicio, Descuento (si hay), separador y Total.
 * `card` lo pone dentro de la tarjeta gris `#F7F9FB` radio 16 (28). `sizes` ajusta las medidas por pantalla.
 */
export function PriceBreakdown({ subtotal, deliveryFee, serviceFee, discount, total, totalLabel = "Total", card, sizes = PRICE_SIZES_DEFAULT, style }: {
  subtotal: number; deliveryFee: number; serviceFee: number; discount: number; total: number; totalLabel?: string;
  card?: boolean; sizes?: Partial<PriceSizes>; style?: StyleProp<ViewStyle>;
}) {
  const s: PriceSizes = { ...PRICE_SIZES_DEFAULT, ...sizes };
  return (
    <View style={[card && { backgroundColor: "#F7F9FB", borderRadius: 16, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 12 }, style]}>
      <PriceRow label="Productos" value={formatCOP(subtotal)} sizes={s} />
      <PriceRow label="Envío" value={deliveryFee > 0 ? formatCOP(deliveryFee) : "Gratis"} sizes={s} />
      <PriceRow label="Servicio" value={formatCOP(serviceFee)} sizes={s} />
      {discount > 0 ? <PriceRow label="Descuento" value={`-${formatCOP(discount)}`} tone="success" sizes={s} /> : null}
      <View style={{ height: 1, backgroundColor: colors.divider, marginTop: s.gap, marginBottom: s.gapBelow ?? s.gap }} />
      <PriceRow label={totalLabel} value={formatCOP(total)} strong sizes={s} />
    </View>
  );
}
