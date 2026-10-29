import React from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Título de sección + enlace "Ver todos ›" (08, 14, 25, 29, 33, 34, 41).
 * Título `section` (16,5 pt bold); enlace 10,5 pt medium `blueLink` con chevron.
 * Por defecto deja 9 pt hasta el contenido (medido en 08).
 */
export function SectionHeader({ title, actionTitle = "Ver todos", onAction, style }: { title: string; actionTitle?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9.2 }, style]}>
      <Text variant="section" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", marginRight: -4.6 }} accessibilityRole="link">
          <Text variant="link" tone="link">{actionTitle}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.blueLink} style={{ marginLeft: -1, marginTop: 1 }} />
        </Pressable>
      ) : null}
    </View>
  );
}
