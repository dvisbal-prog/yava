import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

export function SectionHeader({ title, actionTitle = "Ver todos", onAction, style }: { title: string; actionTitle?: string; onAction?: () => void; style?: object }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, style]}>
      <Text variant="heading">{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{actionTitle}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}
