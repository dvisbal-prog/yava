import React from "react";
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, View, StyleProp } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

/**
 * Variantes (guía C15):
 * - `primary` (C15a): azul `blue`, texto blanco.
 * - `secondary` (C15c suave): `blueSoft` + texto `blueText` ("Volver al pedido", "Volver a pedir").
 * - `outline` (C15e): blanco, borde gris `#D5D9E1`, texto `blueText` ("Ver detalle", "Reintentar").
 * - `outlineBlue` (C15d): blanco, borde 1,5 pt `blueText`, texto `blueText` ("Elegir", "Ver detalle" de 36).
 * - `ghost` (C15h enlace): sin fondo, texto `blueLink` ("Seguir sin complementos", "Volver al inicio").
 * - `danger` (C15f): blanco, borde 1,5 pt rojo, texto rojo ("Confirmar cancelación").
 * - `dangerFill`: rojo relleno, texto blanco (acciones destructivas fuertes de comercio/repartidor).
 * - `accent`: amarillo de marca con texto tinta.
 * - `dark`: negro (botón Apple de 02).
 * `shape="pill"` = C15b (CTA de barras inferiores). `disabled` usa `disabledBg/disabledText` (C15g).
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "outlineBlue" | "ghost" | "danger" | "dangerFill" | "accent" | "dark";
type Size = "sm" | "md" | "lg";

const BG: Record<ButtonVariant, string> = {
  primary: colors.blue, secondary: colors.blueSoft, outline: colors.white, outlineBlue: colors.white, ghost: "transparent",
  danger: colors.white, dangerFill: colors.red, accent: colors.yellow, dark: "#111111",
};
const FG: Record<ButtonVariant, string> = {
  primary: colors.white, secondary: colors.blueText, outline: colors.blueText, outlineBlue: colors.blueText, ghost: colors.blueLink,
  danger: colors.red, dangerFill: colors.white, accent: colors.ink, dark: colors.white,
};
const BORDER: Partial<Record<ButtonVariant, { borderWidth: number; borderColor: string }>> = {
  outline: { borderWidth: 1, borderColor: colors.gray300 },
  outlineBlue: { borderWidth: 1.5, borderColor: colors.blueText },
  danger: { borderWidth: 1.5, borderColor: colors.red },
};

export function Button({ title, onPress, variant = "primary", size = "lg", loading, disabled, icon, style, full = true, right, shape = "rounded", iconRight, leading }: {
  title: string; onPress?: () => void; variant?: ButtonVariant; size?: Size; loading?: boolean; disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>; full?: boolean; right?: React.ReactNode;
  /** `rounded` = radio 14 (C15a); `pill` = radio completo (C15b). */
  shape?: "rounded" | "pill";
  /** Ícono a la derecha del texto (p. ej. `chevron-forward`). */
  iconRight?: keyof typeof Ionicons.glyphMap;
  /** Nodo a la izquierda del texto (p. ej. logo de Google). */
  leading?: React.ReactNode;
}) {
  const isDisabled = disabled || loading;
  const solidDisabled = disabled && !loading && (variant === "primary" || variant === "accent" || variant === "dangerFill" || variant === "dark");
  const bg = solidDisabled ? colors.disabledBg : BG[variant];
  const fg = solidDisabled ? colors.disabledText : FG[variant];
  const h = { sm: 36, md: 44, lg: 50 }[size];
  const r = shape === "pill" ? h / 2 : size === "sm" ? radius.r10 : radius.r14;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed && variant === "primary" ? colors.blueDark : bg, height: h, borderRadius: r, alignSelf: full ? "stretch" : "flex-start", paddingHorizontal: variant === "ghost" ? 4 : size === "sm" ? 14 : 18 },
        BORDER[variant],
        { opacity: disabled && !solidDisabled ? 0.5 : pressed && variant !== "primary" ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {leading ? <View style={{ marginRight: 10 }}>{leading}</View> : null}
          {icon ? <Ionicons name={icon} size={size === "sm" ? 16 : 19} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text variant={size === "sm" ? "bodyM" : "button"} style={{ color: fg, fontWeight: "600" }} numberOfLines={1}>{title}</Text>
          {iconRight ? <Ionicons name={iconRight} size={size === "sm" ? 15 : 18} color={fg} style={{ marginLeft: 6 }} /> : null}
          {right}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
