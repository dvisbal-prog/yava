import React from "react";
import { Stack } from "expo-router";
import { colors } from "@yava/shared";

/** Registro de comercio (49, 65) y repartidor (57–59). Accesible para cualquier usuario autenticado. */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
      <Stack.Screen name="merchant-register" />
      <Stack.Screen name="merchant-review" />
      <Stack.Screen name="courier-register" />
      <Stack.Screen name="courier-documents" />
      <Stack.Screen name="courier-review" />
    </Stack>
  );
}
