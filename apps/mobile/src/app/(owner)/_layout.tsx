import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@yava/shared";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrder";
import { WebPanelOnly } from "@/components/owner/WebPanelOnly";
import { canUseOwnerApp } from "@/features/owner/types";
import { useAuth } from "@/store/auth";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={typeof color === "string" ? color : colors.gray500} size={size} />;
const hidden = { href: null } as const;

/**
 * Tabs de owners: Resumen · Finanzas · Actividad · Cuenta. El acceso (97) lo cubre el login general + AuthGate.
 * Solo owner y finanzas usan esta app (RLS de liquidaciones/alertas); operaciones y soporte ven "Usa el panel web".
 */
export default function OwnerLayout() {
  const adminRole = useAuth((s) => s.adminRole);
  const allowed = canUseOwnerApp(adminRole);
  useRealtimeOrders(allowed);
  // Sin rol de admin (p. ej. justo al cerrar sesión) AuthGate redirige; no se pinta nada mientras tanto.
  if (!adminRole) return null;
  if (!allowed) return <WebPanelOnly role={adminRole} />;
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.gray500,
      tabBarStyle: { borderTopColor: colors.gray200, backgroundColor: colors.white }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      sceneStyle: { backgroundColor: colors.white },
    }}>
      <Tabs.Screen name="index" options={{ title: "Resumen", tabBarIcon: icon("grid-outline") }} />
      <Tabs.Screen name="finance" options={{ title: "Finanzas", tabBarIcon: icon("cash-outline") }} />
      <Tabs.Screen name="activity" options={{ title: "Actividad", tabBarIcon: icon("pulse-outline") }} />
      <Tabs.Screen name="account" options={{ title: "Cuenta", tabBarIcon: icon("person-circle-outline") }} />
      <Tabs.Screen name="cities" options={hidden} />
      <Tabs.Screen name="payouts" options={hidden} />
      <Tabs.Screen name="alerts" options={hidden} />
    </Tabs>
  );
}
