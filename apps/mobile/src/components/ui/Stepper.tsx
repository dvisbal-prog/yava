import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

/**
 * Selector de cantidad (guía C14).
 * - `outline` (por defecto, C14a): píldora blanca con borde `border` y divisores verticales; "−" | n | "+" tinta.
 * - `filled` (C14b): fondo `#F1F2F5` sin borde (27, 44).
 * - `cart` (C14c): con papelera cuando la cantidad es 1 y `min` = 0 (15).
 */
export function Stepper({ value, onChange, min = 0, max = 99, size = "md", variant = "outline" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md" | "lg"; variant?: "outline" | "filled" | "cart";
}) {
  const h = size === "sm" ? 32 : size === "lg" ? 50 : 40;
  const w = size === "sm" ? 30 : size === "lg" ? 46 : 40;
  const trash = value <= 1 && min === 0;
  const filled = variant === "filled";
  const divider = variant === "outline";
  return (
    <View style={[styles.wrap, { height: h }, filled ? styles.filled : styles.outline]}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} hitSlop={8} style={[styles.btn, { width: w }]} accessibilityLabel={trash ? "Quitar" : "Disminuir"} disabled={value <= min && !trash}>
        <Ionicons name={trash ? "trash-outline" : "remove"} size={size === "sm" ? 17 : 20} color={value <= min && !trash ? colors.textPlaceholder : colors.ink} />
      </Pressable>
      {divider ? <View style={[styles.div, { height: h * 0.55 }]} /> : null}
      <Text variant="bodyL" style={{ minWidth: size === "lg" ? 40 : 28, textAlign: "center", fontWeight: "500" }}>{value}</Text>
      {divider ? <View style={[styles.div, { height: h * 0.55 }]} /> : null}
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} hitSlop={8} style={[styles.btn, { width: w }]} accessibilityLabel="Aumentar" disabled={value >= max}>
        <Ionicons name="add" size={size === "sm" ? 18 : 21} color={value >= max ? colors.textPlaceholder : colors.ink} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filled: { backgroundColor: "#F1F2F5" },
  btn: { height: "100%", alignItems: "center", justifyContent: "center" },
  div: { width: 1, backgroundColor: colors.border },
});
