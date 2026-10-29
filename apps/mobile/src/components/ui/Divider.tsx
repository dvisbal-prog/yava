import React from "react";
import { View } from "react-native";
import { colors, spacing } from "@yava/shared";

/** Separador 1 px `divider` (guía §1.5). `thick` = franja gris de 8 pt a sangre (rompe el margen de 18 pt). */
export function Divider({ space = 12, thick, inset = 0 }: { space?: number; thick?: boolean; inset?: number }) {
  return <View style={{ height: thick ? 8 : 1, backgroundColor: thick ? colors.surfaceSoft : colors.divider, marginVertical: space, marginHorizontal: thick ? -spacing.gutter : inset }} />;
}
