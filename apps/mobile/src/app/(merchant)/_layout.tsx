import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@yava/shared";
import { useMyMerchant } from "@/features/merchant/useMerchant";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={typeof color === "string" ? color : colors.gray500} size={size} />;
const hidden = { href: null } as const;
const hiddenNoTab = { href: null, tabBarStyle: { display: "none" as const } } as const;

/** Tabs del comercio: Resumen · Pedidos · Menú · Cuenta. Redirige a revisión si el comercio no está activo. */
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
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.gray500,
      tabBarStyle: { borderTopColor: colors.gray200, backgroundColor: colors.white }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      sceneStyle: { backgroundColor: colors.white },
    }}>
      <Tabs.Screen name="index" options={{ title: "Resumen", tabBarIcon: icon("grid-outline") }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos", tabBarIcon: icon("receipt-outline") }} />
      <Tabs.Screen name="menu" options={{ title: "Menú", tabBarIcon: icon("restaurant-outline") }} />
      <Tabs.Screen name="account" options={{ title: "Cuenta", tabBarIcon: icon("person-circle-outline") }} />
      <Tabs.Screen name="prepare" options={hidden} />
      <Tabs.Screen name="order/[id]" options={hidden} />
      <Tabs.Screen name="product/new" options={hiddenNoTab} />
      <Tabs.Screen name="product/[id]" options={hiddenNoTab} />
      <Tabs.Screen name="hours" options={hidden} />
      <Tabs.Screen name="bank" options={hidden} />
      <Tabs.Screen name="settlements" options={hidden} />
      <Tabs.Screen name="settlement/[id]" options={hidden} />
    </Tabs>
  );
}
