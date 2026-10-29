import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

export interface SegmentOption<T extends string> { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }

/**
 * Control segmentado (guía C10b/C10f).
 * - `variant="pills"` (C10b, 10): píldoras separadas a lo ancho; activa `blueSoft` + `blueText` 600, inactiva `#F6F7F8`.
 * - `variant="bar"` (C10f, 26): contenedor gris `#F3F5F8` con el segmento activo `blueSoft`.
 */
export function Segmented<T extends string>({ options, value, onChange, variant = "pills", height }: {
  options: SegmentOption<T>[]; value: T; onChange: (v: T) => void; variant?: "pills" | "bar"; height?: number;
}) {
  const h = height ?? (variant === "bar" ? 41 : 38);
  return (
    <View style={[styles.row, variant === "bar" && [styles.bar, { height: h }]]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: active }}
            style={[styles.seg, { height: variant === "bar" ? h - 6 : h }, variant === "pills" && { backgroundColor: active ? colors.blueSoft : "#F6F7F8" }, variant === "bar" && active && { backgroundColor: colors.blueSoft }]}>
            {o.icon ? <Ionicons name={o.icon} size={18} color={active ? colors.blueText : colors.ink} style={{ marginRight: 7 }} /> : null}
            <Text variant="bodyM" style={{ color: active ? colors.blueText : colors.textTertiary, fontWeight: active ? "600" : "400" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  bar: { backgroundColor: "#F3F5F8", borderRadius: radius.pill, padding: 3, gap: 0, alignItems: "center" },
  seg: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
});
