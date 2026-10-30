import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { colors, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";
import { discountOf, ALCOHOL_LEGAL } from "@/features/customer";

/** Resaltado amarillo del precio con descuento y de la insignia "-N%" (Inicio, tienda 26 y detalle 27). */
export const DEAL_YELLOW = "#FFE45C";

/**
 * Porcentaje de descuento entero según `compare_at_price` (0 si no hay precio anterior mayor). Se redondea hacia
 * abajo para no anunciar más descuento del real: $16.900 antes $19.900 es 15,08 % → "-15%"; 12,6 % → "-12%".
 */
export function discountPct(p: { price: number; compare_at_price?: number | null }): number {
  return Math.floor(discountOf({ price: p.price, compare_at_price: p.compare_at_price ?? null }) * 100 + 1e-9);
}

/** Texto para lectores de pantalla: "$16.900, antes $19.900, 15 % de descuento". */
export function dealLabel(p: { price: number; compare_at_price?: number | null }): string {
  const pct = discountPct(p);
  return pct ? `${formatCOP(p.price)}, antes ${formatCOP(p.compare_at_price ?? 0)}, ${pct} % de descuento` : formatCOP(p.price);
}

/** Insignia amarilla "-15%". `size` = alto en pt (18 en tarjetas, 22 en el detalle). */
export function DealBadge({ pct, size = 18, style }: { pct: number; size?: number; style?: StyleProp<ViewStyle> }) {
  if (pct <= 0) return null;
  return (
    <View style={[styles.badge, { height: size, borderRadius: size * 0.28, paddingHorizontal: size * 0.28 }, style]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.56, lineHeight: size * 0.72 }]}>{`-${pct}%`}</Text>
    </View>
  );
}

/** Precio anterior tachado en gris. */
export function BeforePrice({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  return <Text numberOfLines={1} style={[styles.before, style]}>{formatCOP(value)}</Text>;
}

/**
 * Leyenda legal obligatoria donde se anuncian o venden bebidas alcohólicas (Ley 124 de 1994; Ley 30 de 1986,
 * art. 16): Inicio "Cervezas y licores", sección de licores de la tienda (26) y detalle de un licor (27).
 */
export function AlcoholLegal({ style }: { style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.legal, style]} accessibilityRole="text">{ALCOHOL_LEGAL}</Text>;
}

const styles = StyleSheet.create({
  badge: { justifyContent: "center", alignSelf: "flex-start", backgroundColor: DEAL_YELLOW },
  badgeText: { fontWeight: "800", color: colors.ink },
  before: { fontSize: 11, lineHeight: 15, color: colors.textTertiary, textDecorationLine: "line-through" },
  // textSecondary sobre blanco ≈ 6,3:1 (textPlaceholder daba 2,9:1): discreta pero legible.
  legal: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
});
