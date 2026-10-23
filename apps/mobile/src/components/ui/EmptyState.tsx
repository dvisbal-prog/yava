import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "./Text";
import { Button } from "./Button";

export function EmptyState({ icon = "search-outline", title, body, actionTitle, onAction, secondaryTitle, onSecondary }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string; actionTitle?: string; onAction?: () => void; secondaryTitle?: string; onSecondary?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Ionicons name={icon} size={40} color={colors.blue} />
      </View>
      <Text variant="heading" style={{ textAlign: "center", marginBottom: 8 }}>{title}</Text>
      {body ? <Text tone="muted" style={{ textAlign: "center", marginBottom: 20 }}>{body}</Text> : null}
      {actionTitle ? <Button title={actionTitle} onPress={onAction} full={false} size="md" /> : null}
      {secondaryTitle ? <Button title={secondaryTitle} onPress={onSecondary} variant="ghost" full={false} size="md" style={{ marginTop: 6 }} /> : null}
    </View>
  );
}
