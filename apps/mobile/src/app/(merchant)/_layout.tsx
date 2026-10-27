import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Stack } from "expo-router";
import { colors } from "@yava/shared";
import { useMyMerchant } from "@/features/merchant/useMerchant";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";

/** Al abrir un enlace directo (p. ej. /order/123 en web), las pestañas quedan debajo para poder volver. */
export const unstable_settings = { initialRouteName: "(tabs)" };

/** El asistente de producto maneja su propio "atrás" por pasos: sin gesto de deslizar para salir. */
const wizard = { gestureEnabled: false } as const;

/**
 * Grupo del comercio: Stack con las pestañas en (tabs) (Resumen · Pedidos · Menú · Cuenta) y el resto
 * de pantallas apiladas encima. Redirige a registro/revisión si el comercio no está activo.
 */
export default function MerchantLayout() {
  const { data: merchant, isLoading, isError } = useMyMerchant();
  useRealtimeOrders(!!merchant);

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}><ActivityIndicator color={colors.blue} /></View>;
  }
  if (!isError) {
    if (!merchant) return <Redirect href="/(onboarding)/merchant-register" />;
    if (merchant.status !== "active" && merchant.status !== "paused") return <Redirect href="/(onboarding)/merchant-review" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/new" options={wizard} />
      <Stack.Screen name="product/[id]" options={wizard} />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="prepare" />
      <Stack.Screen name="hours" />
      <Stack.Screen name="bank" />
      <Stack.Screen name="settlements" />
      <Stack.Screen name="settlement/[id]" />
    </Stack>
  );
}
