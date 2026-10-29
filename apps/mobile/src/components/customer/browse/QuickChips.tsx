import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "@/components/ui";
import { SlidersIcon } from "./BrowseHeader";

/**
 * Chips de filtro rápido de 09 (C10a), medidos en el PNG: alto 32 pt, píldora blanca con borde `searchBorder`
 * y sombra suave; ícono tinta de 12,5 pt, texto 11,2 pt 500 y 10 pt de relleno lateral.
 * `active` pinta el estado seleccionado (azul claro + borde azul), igual que los chips de selección.
 */
export function QuickChip({ label, icon, onPress, active, style }: {
  label: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; active?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fg = active ? colors.blueText : colors.ink;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, active && styles.active, { opacity: pressed ? 0.8 : 1 }, style]}>
      {icon ? <Ionicons name={icon} size={14.5} color={fg} style={{ marginRight: 5.4 }} /> : null}
      <Text numberOfLines={1} style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Chip doble [ícono de filtros | "Ordenar ⌄"] de 09: los dos lados abren los filtros. */
export function SortChip({ label = "Ordenar", onPressIcon, onPress, active, style }: {
  label?: string; onPressIcon?: () => void; onPress?: () => void; active?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fg = active ? colors.blueText : colors.ink;
  return (
    <View style={[styles.chip, styles.split, active && styles.active, style]}>
      <Pressable onPress={onPressIcon ?? onPress} hitSlop={6} style={styles.splitIcon} accessibilityRole="button" accessibilityLabel="Filtros">
        <SlidersIcon size={13.6} color={fg} />
      </Pressable>
      <View style={[styles.divider, active && { backgroundColor: colors.blueChip }]} />
      <Pressable onPress={onPress} hitSlop={6} style={styles.splitLabel} accessibilityRole="button" accessibilityLabel={label}>
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
        <Ionicons name="chevron-down" size={12} color={fg} style={{ marginLeft: 4.4, marginTop: 1 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { height: 32, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingLeft: 8.3, paddingRight: 8.7, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBorder, ...shadows.soft },
  active: { backgroundColor: colors.blueChip, borderColor: colors.blueText, borderWidth: 1.5 },
  label: { fontSize: 11, lineHeight: 15, fontWeight: "500", color: colors.ink },
  split: { paddingLeft: 0, paddingRight: 0 },
  splitIcon: { width: 36, height: "100%", alignItems: "center", justifyContent: "center", paddingLeft: 1.5 },
  divider: { width: 1, height: "100%", backgroundColor: colors.searchBorder },
  splitLabel: { flexDirection: "row", alignItems: "center", height: "100%", paddingLeft: 7.5, paddingRight: 8 },
});
