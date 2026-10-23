import React from "react";
import { Stack } from "expo-router";
import { colors } from "@yava/shared";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />;
}
