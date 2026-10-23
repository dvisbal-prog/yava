import React from "react";
import { View } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

export function KPI({ label, value, hint, tone = "default", compact }: { label: string; value: string; hint?: string; tone?: "default" | "primary" | "success" | "danger"; compact?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50, borderRadius: radius.md, padding: compact ? 10 : 14, borderWidth: 1, borderColor: colors.gray200 }}>
      <Text variant="caption" tone="muted">{label}</Text>
      <Text variant={compact ? "heading" : "title"} tone={tone} style={{ marginTop: 2 }}>{value}</Text>
      {hint ? <Text variant="small" tone="subtle" style={{ marginTop: 2 }}>{hint}</Text> : null}
    </View>
  );
}
