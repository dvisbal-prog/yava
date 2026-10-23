import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "./Text";

export function ListRow({ icon, title, subtitle, right, onPress, chevron = true, danger, left }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; chevron?: boolean; danger?: boolean; left?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gray50 }]}>
      {left ?? (icon ? <View style={styles.iconBox}><Ionicons name={icon} size={20} color={danger ? colors.red : colors.blue} /></View> : null)}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" tone={danger ? "danger" : "default"}>{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted">{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && chevron ? <Ionicons name="chevron-forward" size={18} color={colors.gray400} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
});
