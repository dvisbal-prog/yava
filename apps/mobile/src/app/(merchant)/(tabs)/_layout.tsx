import React from "react";
import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@yava/shared";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={typeof color === "string" ? color : colors.gray500} size={size} />;

/** Pestañas del comercio: Resumen · Pedidos · Menú · Cuenta. */
export default function MerchantTabsLayout() {
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
    </Tabs>
  );
}
