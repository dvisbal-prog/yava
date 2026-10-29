import React from "react";
import { Pressable, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { colors, radius, shadows } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

/**
 * Chips (guía C10):
 * - `select` (por defecto, C10c): blanco con borde `border`; seleccionado `blueChip` + borde 1,5 pt `blueText` + texto 600 `blueText` (11, 24, formularios).
 * - `filter` (C10a): blanco con borde `searchBorder` y sombra suave, ícono tinta 17 + texto 500 (09 "Mejor valorados"); seleccionado igual que `select`.
 * - `fill` (C10d): gris `#F1F2F8` sin borde; seleccionado azul `blue` con texto blanco (33 "Todas").
 * - `suggest` (C10e): `blueSoft` con lupa y texto `blueText` (41).
 * `trailingIcon` agrega un ícono a la derecha (p. ej. `chevron-down` en "Ordenar ⌄").
 */
export type ChipVariant = "select" | "filter" | "fill" | "suggest";

export function Chip({ label, selected, onPress, icon, variant = "select", trailingIcon, style, height }: {
  label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: ChipVariant;
  trailingIcon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>; height?: number;
}) {
  const v = variant;
  const sel = !!selected;
  const bg = v === "fill" ? (sel ? colors.blue : "#F1F2F8") : v === "suggest" ? colors.blueSoft : sel ? colors.blueChip : colors.white;
  const fg = v === "fill" ? (sel ? colors.white : colors.ink) : v === "suggest" || sel ? colors.blueText : v === "filter" ? colors.ink : colors.gray700;
  const border = v === "fill" || v === "suggest" ? null : sel ? { borderWidth: 1.5, borderColor: colors.blueText } : { borderWidth: 1, borderColor: v === "filter" ? colors.searchBorder : colors.border };
  const h = height ?? (v === "fill" || v === "suggest" ? 34 : 32);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: sel }}
      style={({ pressed }) => [
        styles.chip, { height: h, backgroundColor: bg, opacity: pressed ? 0.8 : 1 }, border,
        v === "filter" && !sel ? shadows.soft : null, style,
      ]}
    >
      {icon || v === "suggest" ? <Ionicons name={icon ?? "search"} size={16} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text variant="bodyS" style={{ color: fg, fontWeight: sel || v === "suggest" ? "600" : v === "filter" ? "500" : "400" }} numberOfLines={1}>{label}</Text>
      {trailingIcon ? <Ionicons name={trailingIcon} size={14} color={fg} style={{ marginLeft: 4 }} /> : null}
    </Pressable>
  );
}

/** Chip doble de 09: [ícono | "Ordenar ⌄"] con divisor vertical. */
export function SplitChip({ icon = "options-outline", label, onPressIcon, onPress, active }: {
  icon?: keyof typeof Ionicons.glyphMap; label: string; onPressIcon?: () => void; onPress?: () => void; active?: boolean;
}) {
  return (
    <View style={[styles.chip, styles.split, active && { borderColor: colors.blueText, borderWidth: 1.5 }]}>
      <Pressable onPress={onPressIcon ?? onPress} hitSlop={6} style={styles.splitIcon} accessibilityLabel="Filtros">
        <Ionicons name={icon} size={17} color={active ? colors.blueText : colors.ink} />
      </Pressable>
      <View style={styles.splitDivider} />
      <Pressable onPress={onPress} hitSlop={6} style={styles.splitLabel}>
        <Text variant="bodyS" style={{ fontWeight: "500", color: active ? colors.blueText : colors.ink }}>{label}</Text>
        <Ionicons name="chevron-down" size={14} color={active ? colors.blueText : colors.ink} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 13, borderRadius: radius.pill, marginRight: 8 },
  split: { height: 32, paddingHorizontal: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBorder, ...shadows.soft },
  splitIcon: { width: 37, height: "100%", alignItems: "center", justifyContent: "center" },
  splitDivider: { width: 1, height: 18, backgroundColor: colors.border },
  splitLabel: { flexDirection: "row", alignItems: "center", paddingLeft: 10, paddingRight: 12, height: "100%" },
});
