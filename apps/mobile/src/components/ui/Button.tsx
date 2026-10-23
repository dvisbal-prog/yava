import React from "react";
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, View } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

export function Button({ title, onPress, variant = "primary", size = "lg", loading, disabled, icon, style, full = true, right }: {
  title: string; onPress?: () => void; variant?: Variant; size?: Size; loading?: boolean; disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle; full?: boolean; right?: React.ReactNode;
}) {
  const bg = { primary: colors.blue, secondary: colors.blueSoft, outline: colors.white, ghost: "transparent", danger: colors.red, accent: colors.yellow }[variant];
  const fg = { primary: colors.white, secondary: colors.blue, outline: colors.carbon, ghost: colors.blue, danger: colors.white, accent: colors.carbon }[variant];
  const h = { sm: 36, md: 44, lg: 52 }[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base, { backgroundColor: bg, height: h, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1, alignSelf: full ? "stretch" : "flex-start" },
        variant === "outline" && { borderWidth: 1, borderColor: colors.gray300 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text variant={size === "sm" ? "caption" : "bodyStrong"} style={{ color: fg }}>{title}</Text>
          {right}
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
