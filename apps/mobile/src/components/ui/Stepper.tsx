import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

export function Stepper({ value, onChange, min = 0, max = 99, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? 30 : 40;
  return (
    <View style={[styles.wrap, { height: h }]}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} hitSlop={8} style={[styles.btn, { width: h }]}>
        <Ionicons name={value <= 1 && min === 0 ? "trash-outline" : "remove"} size={18} color={colors.blue} />
      </Pressable>
      <Text variant="bodyStrong" style={{ minWidth: 24, textAlign: "center" }}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} hitSlop={8} style={[styles.btn, { width: h }]}>
        <Ionicons name="add" size={18} color={colors.blue} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.pill, backgroundColor: colors.white },
  btn: { height: "100%", alignItems: "center", justifyContent: "center" },
});
