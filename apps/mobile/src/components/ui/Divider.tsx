import React from "react";
import { View } from "react-native";
import { colors } from "@yava/shared";
export function Divider({ space = 12, thick }: { space?: number; thick?: boolean }) {
  return <View style={{ height: thick ? 8 : 1, backgroundColor: thick ? colors.gray100 : colors.gray200, marginVertical: space, marginHorizontal: thick ? -16 : 0 }} />;
}
