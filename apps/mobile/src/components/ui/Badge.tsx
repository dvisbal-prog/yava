import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows } from "@yava/shared";
import { Text } from "./Text";

/**
 * Píldoras de estado (guía C24). Tonos legados: blue, yellow, green, red, gray, orange.
 * Tonos del diseño: `delivered` ("✓ Entregado"), `principal`, `closed` ("Cerrado"),
 * `unavailable` ("No disponible"), `time` (etiqueta blanca sobre foto con reloj).
 */
export type BadgeTone = "blue" | "yellow" | "green" | "red" | "gray" | "orange" | "delivered" | "principal" | "closed" | "unavailable" | "time";

const map: Record<BadgeTone, { bg: string; fg: string; icon?: keyof typeof Ionicons.glyphMap; iconColor?: string }> = {
  blue: { bg: colors.blueSoft, fg: colors.blueText },
  yellow: { bg: colors.yellowSoft, fg: "#7A5600" },
  green: { bg: colors.greenSoft, fg: colors.greenText },
  red: { bg: colors.redSoft, fg: colors.red },
  gray: { bg: colors.surfaceGray, fg: colors.gray700 },
  orange: { bg: colors.orangeSoft, fg: "#B35000" },
  delivered: { bg: colors.greenSoft, fg: colors.greenText, icon: "checkmark-circle", iconColor: "#08913A" },
  principal: { bg: colors.blueChip, fg: colors.blueText },
  closed: { bg: colors.closedGray, fg: colors.white },
  unavailable: { bg: colors.amberPill, fg: colors.amberPillText, icon: "alert-circle", iconColor: colors.ink },
  time: { bg: colors.white, fg: colors.ink, icon: "time-outline", iconColor: colors.ink },
};

export function Badge({ label, tone = "gray", icon, style }: { label: string; tone?: BadgeTone; icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle> }) {
  const t = map[tone];
  const ic = icon ?? t.icon;
  return (
    <View style={[{ backgroundColor: t.bg, paddingHorizontal: ic ? 8 : 9, height: 22, borderRadius: radius.pill, alignSelf: "flex-start", flexDirection: "row", alignItems: "center" }, tone === "time" ? shadows.soft : null, style]}>
      {ic ? <Ionicons name={ic} size={13} color={t.iconColor ?? t.fg} style={{ marginRight: 4 }} /> : null}
      <Text variant="caption2" style={{ color: t.fg, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}
