import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@yava/shared";
import { useMyCourier, useRealtimeCourier } from "@/features/courier/useCourier";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";
import { useAuth } from "@/store/auth";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={typeof color === "string" ? color : colors.gray500} size={size} />;
const hidden = { href: null } as const;
const hiddenNoTab = { href: null, tabBarStyle: { display: "none" as const } } as const;

/** Tabs del repartidor: Inicio · Entregas · Ganancias · Perfil. Si no está activo, va a la revisión. */
export default function CourierLayout() {
  const uid = useAuth((s) => s.session?.user.id);
  const { data: courier, isLoading, isError } = useMyCourier();
  useRealtimeCourier(uid);
  useRealtimeOrders(!!courier && courier.status === "active");

  if (isLoading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}><ActivityIndicator color={colors.blue} /></View>;
  if (!isError) {
    if (!courier) return <Redirect href="/(onboarding)/courier-register" />;
    if (courier.status === "pending") return <Redirect href="/(onboarding)/courier-documents" />;
    if (courier.status !== "active") return <Redirect href="/(onboarding)/courier-review" />;
  }

  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.gray500,
      tabBarStyle: { borderTopColor: colors.gray200, backgroundColor: colors.white }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      sceneStyle: { backgroundColor: colors.white },
    }}>
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="history" options={{ title: "Entregas", tabBarIcon: icon("bicycle-outline") }} />
      <Tabs.Screen name="earnings" options={{ title: "Ganancias", tabBarIcon: icon("wallet-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: icon("person-circle-outline") }} />
      <Tabs.Screen name="offer/[id]" options={hiddenNoTab} />
      <Tabs.Screen name="deliveries/[id]/pickup" options={hiddenNoTab} />
      <Tabs.Screen name="deliveries/[id]/deliver" options={hiddenNoTab} />
      <Tabs.Screen name="deliveries/[id]/chat" options={hiddenNoTab} />
      <Tabs.Screen name="withdraw" options={hidden} />
      <Tabs.Screen name="settings" options={hidden} />
    </Tabs>
  );
}
