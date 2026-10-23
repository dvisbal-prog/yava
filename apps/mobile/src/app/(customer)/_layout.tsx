import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@yava/shared";
import { useAuth } from "@/store/auth";
import { useNavIntent } from "@/features/customer/stores";
import { OfflineBanner } from "@/components/customer/OfflineBanner";

/**
 * Grupo de cliente: Stack con las pestañas anidadas en (tabs) y el resto de pantallas
 * (comercio, producto, canasta, pedidos…) como pantallas apiladas. Incluye el banner "Sin conexión" (48).
 */
export default function CustomerLayout() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const pendingNext = useNavIntent((s) => s.pendingNext);
  const setPendingNext = useNavIntent((s) => s.setPendingNext);

  // Continuación tras iniciar sesión: completar perfil (05) o ir a donde quería el usuario (`next`).
  useEffect(() => {
    if (!session || !profile) return;
    if (!profile.full_name) {
      router.replace("/(customer)/personal-data" as never);
      return;
    }
    if (pendingNext) {
      setPendingNext(null);
      router.replace(pendingNext as never);
    }
  }, [session, profile, pendingNext, setPendingNext, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}
