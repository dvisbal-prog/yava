import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { View, ActivityIndicator } from "react-native";
import { queryClient } from "@/lib/query";
import { useAuth, useEffectiveRole } from "@/store/auth";
import { colors } from "@yava/shared";
import { usePushNotifications } from "@/hooks/usePushNotifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Grupo de rutas al que pertenece cada rol. */
const ROLE_GROUP = { customer: "(customer)", merchant: "(merchant)", courier: "(courier)", owner: "(owner)" } as const;

function AuthGate({ children }: { children: React.ReactNode }) {
  const role = useEffectiveRole();
  const segments = useSegments();
  const router = useRouter();
  const init = useAuth((s) => s.init);
  usePushNotifications();

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (role === "loading") return;
    SplashScreen.hideAsync().catch(() => {});
    const group = segments[0] as string | undefined;
    const inAuth = group === "(auth)";
    const inRoleGroup = Object.values(ROLE_GROUP).includes(group as never);
    if (role === "guest") {
      // Invitados pueden explorar la app de cliente; solo las acciones protegidas piden acceso.
      if (!inAuth && group !== "(customer)" && group !== "modal") router.replace("/(customer)");
      return;
    }
    const target = ROLE_GROUP[role];
    // Un rol no debe estar en el grupo de otro rol ni en pantallas de acceso.
    if (inAuth || (inRoleGroup && group !== target)) router.replace(`/${target}` as never);
  }, [role, segments, router]);

  if (role === "loading") {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}><ActivityIndicator color={colors.blue} /></View>;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(customer)" />
              <Stack.Screen name="(merchant)" />
              <Stack.Screen name="(courier)" />
              <Stack.Screen name="(owner)" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
