import React from "react";
import { Stack } from "expo-router";
import { colors } from "@yava/shared";

/** Hojas modales compartidas. */
export default function ModalLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />;
}
