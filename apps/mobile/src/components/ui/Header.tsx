import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "./Text";

export function Header({ title, subtitle, back = true, right, onBack, transparent }: {
  title?: string; subtitle?: string; back?: boolean; right?: React.ReactNode; onBack?: () => void; transparent?: boolean;
}) {
  const router = useRouter();
  return (
    <View style={[styles.row, transparent && { backgroundColor: "transparent" }]}>
      <View style={{ width: 40 }}>
        {back ? (
          <Pressable onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))} hitSlop={12} style={styles.btn}>
            <Ionicons name="chevron-back" size={24} color={colors.carbon} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: "center" }}>
        {title ? <Text variant="heading" numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text variant="caption" tone="muted" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={{ width: 40, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, height: 52, backgroundColor: colors.white },
  btn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
