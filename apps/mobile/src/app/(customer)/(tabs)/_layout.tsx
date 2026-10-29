import React from "react";
import { Tabs } from "expo-router/js-tabs";
import { colors } from "@yava/shared";
import { ScreenBottomInset } from "@/components/ui";
import { FloatingTabBar, useTabBarSpace } from "@/components/customer/FloatingTabBar";

/**
 * Pestañas del cliente: Inicio · Ofertas · Favoritos · Cuenta, con la barra flotante del diseño (C21)
 * y el botón de búsqueda circular a la derecha. El contenido de cada pestaña pasa por detrás de la barra:
 * `Screen` agrega solo el espacio inferior (vía `ScreenBottomInset`); las pantallas con ScrollView propio
 * usan `useTabBarSpace()`.
 */
export default function TabsLayout() {
  const tabSpace = useTabBarSpace();
  return (
    <ScreenBottomInset.Provider value={tabSpace}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.white } }}
      >
        <Tabs.Screen name="index" options={{ title: "Inicio" }} />
        <Tabs.Screen name="offers" options={{ title: "Ofertas" }} />
        <Tabs.Screen name="favorites" options={{ title: "Favoritos" }} />
        <Tabs.Screen name="account" options={{ title: "Cuenta" }} />
      </Tabs>
    </ScreenBottomInset.Provider>
  );
}
