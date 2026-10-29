import React from "react";
import { View, ViewProps, StyleSheet, Pressable } from "react-native";
import { colors, radius, shadows } from "@yava/shared";

/**
 * Tarjeta blanca (guía C17/C20): radio 16, borde 1 px `cardBorder`, sin sombra.
 * - `variant="elevated"`: borde + `shadows.card` (tiendas, productos de 25/29, tarjeta grande de 10).
 * - `variant="soft"`: gris `surfaceSoft` sin borde (resumen de 28, aviso de 47, repartidor de 21).
 * - `variant="selected"`: `blueTint` + borde 1,5 pt `blueText` (opción seleccionada, C18).
 * `radius` permite 12/14/18 según la pantalla.
 */
export function Card({ style, onPress, children, padded = true, variant = "outline", radius: r = radius.r16, ...rest }: ViewProps & {
  onPress?: () => void; padded?: boolean; variant?: "outline" | "elevated" | "soft" | "selected"; radius?: number;
}) {
  const content = (
    <View style={[styles.card, { borderRadius: r }, VARIANT[variant], padded && { padding: 14 }, style]} {...rest}>{children}</View>
  );
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>{content}</Pressable>;
  return content;
}

const VARIANT = {
  outline: { borderWidth: 1, borderColor: colors.cardBorder },
  elevated: { borderWidth: 1, borderColor: colors.cardBorder, ...shadows.card },
  soft: { backgroundColor: colors.surfaceSoft, borderWidth: 0 },
  selected: { backgroundColor: colors.blueTint, borderWidth: 1.5, borderColor: colors.blueText },
} as const;

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white },
});
