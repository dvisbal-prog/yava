import React from "react";
import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@yava/shared";

type Icon = keyof typeof Ionicons.glyphMap;
function icon(active: Icon, inactive: Icon) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => <Ionicons name={focused ? active : inactive} size={size} color={typeof color === "string" ? color : focused ? colors.blue : colors.gray500} />;
}

/** Pestañas inferiores: Inicio · Ofertas · Favoritos · Cuenta. */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: colors.gray500,
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      tabBarStyle: { borderTopColor: colors.gray200, backgroundColor: colors.white },
    }}>
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="offers" options={{ title: "Ofertas", tabBarIcon: icon("pricetag", "pricetag-outline") }} />
      <Tabs.Screen name="favorites" options={{ title: "Favoritos", tabBarIcon: icon("heart", "heart-outline") }} />
      <Tabs.Screen name="account" options={{ title: "Cuenta", tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}
