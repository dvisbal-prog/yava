import React from "react";
import { View } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

type Tone = "blue" | "yellow" | "green" | "red" | "gray" | "orange";
const map: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: colors.blueSoft, fg: colors.blue }, yellow: { bg: colors.yellowSoft, fg: "#8A6400" }, green: { bg: colors.greenSoft, fg: colors.green },
  red: { bg: colors.redSoft, fg: colors.red }, gray: { bg: colors.gray100, fg: colors.gray700 }, orange: { bg: colors.orangeSoft, fg: "#B35C00" },
};
export function Badge({ label, tone = "gray" }: { label: string; tone?: Tone }) {
  return (
    <View style={{ backgroundColor: map[tone].bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: "flex-start" }}>
      <Text variant="small" style={{ color: map[tone].fg }}>{label}</Text>
    </View>
  );
}
