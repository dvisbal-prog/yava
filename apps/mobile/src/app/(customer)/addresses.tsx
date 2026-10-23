import React from "react";
import { View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Button, Badge, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { RadioRow, ErrorState, ListSkeleton } from "@/components/customer";
import { useAddresses, activateAddress, loginHref, type AddressRow } from "@/features/customer";

/** Pantalla 37 · Mis direcciones. */
export default function Addresses() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const active = useLocation((s) => s.address);
  const setAddress = useLocation((s) => s.setAddress);
  const addresses = useAddresses();

  function remove(a: AddressRow) {
    Alert.alert("Eliminar dirección", `¿Quieres eliminar "${a.label}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        const { error } = await supabase.from("addresses").delete().eq("id", a.id);
        if (error) { Alert.alert("No se pudo eliminar", errorMessage(error)); return; }
        if (active?.id === a.id) setAddress(null);
        void qc.invalidateQueries({ queryKey: ["addresses"] });
      } },
    ]);
  }

  if (!session) {
    return <Screen><Header title="Mis direcciones" /><EmptyState icon="location-outline" title="Inicia sesión" body="Guarda tus direcciones para pedir más rápido." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/addresses") as never)} /></Screen>;
  }

  return (
    <Screen footer={<Button title="Agregar dirección" icon="add" variant="secondary" onPress={() => router.push("/(customer)/location" as never)} />}>
      <Header title="Mis direcciones" />
      <Text variant="caption" tone="muted" style={{ marginTop: 8, marginBottom: 4 }}>Selecciona la dirección de entrega</Text>
      {addresses.isLoading ? <ListSkeleton rows={2} height={52} /> : addresses.error ? <ErrorState error={addresses.error} onRetry={() => { void addresses.refetch(); }} /> : !addresses.data?.length ? (
        <EmptyState icon="location-outline" title="Aún no tienes direcciones" body="Agrega tu casa o tu trabajo para empezar a pedir." />
      ) : addresses.data.map((a) => (
        <RadioRow key={a.id} title={a.label} subtitle={[a.line1, a.line2].filter(Boolean).join(", ")} selected={active?.id === a.id} icon={a.label === "Casa" ? "home-outline" : a.label === "Trabajo" ? "briefcase-outline" : "location-outline"}
          onPress={() => { void activateAddress(a); }}
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {a.is_default ? <Badge label="Principal" tone="blue" /> : null}
              <Pressable hitSlop={8} onPress={() => router.push(`/(customer)/address?id=${a.id}` as never)} style={{ padding: 4 }}><Ionicons name="create-outline" size={20} color={colors.gray500} /></Pressable>
              <Pressable hitSlop={8} onPress={() => remove(a)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={20} color={colors.gray500} /></Pressable>
            </View>
          } />
      ))}
      {active ? <Button title="Usar esta dirección" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(customer)" as never))} style={{ marginTop: 20 }} /> : null}
    </Screen>
  );
}
