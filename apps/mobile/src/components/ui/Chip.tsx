import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: colors.blue, borderColor: colors.blue }]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.white : colors.gray700} style={{ marginRight: 4 }} /> : null}
      <Text variant="caption" style={{ color: selected ? colors.white : colors.gray700, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white, marginRight: 8 },
});
