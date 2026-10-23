import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";

export interface SegmentItem<K extends string> { key: K; label: string; count?: number }

/** Control segmentado (Nuevos · En preparación · Listos / Hoy · Semana). */
export function Segmented<K extends string>({ items, value, onChange }: { items: SegmentItem<K>[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={styles.wrap}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} style={[styles.item, active && styles.active]}>
            <Text variant="caption" style={{ color: active ? colors.white : colors.gray700, fontWeight: "600" }} numberOfLines={1}>
              {it.label}{it.count != null ? ` ${it.count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: colors.gray100, borderRadius: radius.md, padding: 3 },
  item: { flex: 1, height: 34, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  active: { backgroundColor: colors.blue },
});
