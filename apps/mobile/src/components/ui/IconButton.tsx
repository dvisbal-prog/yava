import React from "react";
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "./Text";

type IconName = keyof typeof Ionicons.glyphMap;
export type IconButtonVariant = "gray" | "white" | "plain" | "blue" | "soft";

const BG: Record<IconButtonVariant, string> = {
  gray: colors.surfaceGray,
  white: colors.white,
  plain: "transparent",
  blue: colors.blue,
  soft: colors.blueSoft,
};
const FG: Record<IconButtonVariant, string> = {
  gray: colors.ink,
  white: colors.ink,
  plain: colors.ink,
  blue: colors.white,
  soft: colors.blueText,
};

/**
 * Botón circular con ícono (C2 atrás, C25 botones sobre portada, C21 búsqueda).
 * - `gray`: círculo `surfaceGray` 32–36 pt (atrás en 03/07/09/10).
 * - `white`: círculo blanco con sombra suave (sobre fotos: 12/13/26/30/43; búsqueda de la barra 53 pt).
 * - `plain`: solo el ícono (chevron suelto de 17/22/24…).
 * - `blue` / `soft`: azul relleno o azul suave.
 * `badge` muestra un contador rojo arriba a la derecha.
 */
export function IconButton({ icon, onPress, size = 34, iconSize, variant = "gray", color, badge, accessibilityLabel, style, disabled, shadow }: {
  icon: IconName; onPress?: () => void; size?: number; iconSize?: number; variant?: IconButtonVariant; color?: string;
  badge?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; disabled?: boolean; shadow?: "soft" | "float" | "none";
}) {
  const sh = shadow ?? (variant === "white" ? "soft" : "none");
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: BG[variant], opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        sh !== "none" ? shadows[sh] : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.53)} color={color ?? FG[variant]} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Contador rojo (bolsa del carrito, campana). Úsalo dentro de un contenedor `position: relative`. */
export function CountBadge({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  if (!count) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute", top: -4, right: -6, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.red, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.white,
  },
  badgeText: { color: colors.white, fontSize: 9.5, lineHeight: 12, fontWeight: "700" },
});
