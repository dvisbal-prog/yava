import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Button, Badge, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { ErrorState, ListSkeleton, RadioRow } from "@/components/customer";
import { useAddresses, activateAddress, loginHref } from "@/features/customer";

/** Selector de dirección activa (desde el encabezado de Inicio y desde Revisar y pagar). */
export default function AddressPicker() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const active = useLocation((s) => s.address);
  const addresses = useAddresses();

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(customer)" as never));

  return (
    <Screen edges={["top", "bottom"]} footer={
      <View style={{ gap: 8 }}>
        <Button title="Agregar dirección" icon="add" variant="secondary" onPress={() => router.push(session ? "/(customer)/location" as never : "/(auth)/location" as never)} />
      </View>
    }>
      <Header title="Dirección de entrega" back={false} right={<Pressable onPress={close} hitSlop={10}><Ionicons name="close" size={24} color={colors.carbon} /></Pressable>} />
      {!session ? (
        <EmptyState icon="location-outline" title="¿Dónde te entregamos?" body="Usa tu ubicación para ver comercios cerca, o inicia sesión para guardar direcciones." actionTitle="Usar mi ubicación" onAction={() => router.push("/(auth)/location" as never)} secondaryTitle="Iniciar sesión" onSecondary={() => router.push(loginHref("/(customer)") as never)} />
      ) : addresses.isLoading ? <ListSkeleton rows={2} height={48} /> : addresses.error ? <ErrorState error={addresses.error} onRetry={() => { void addresses.refetch(); }} /> : !addresses.data?.length ? (
        <EmptyState icon="location-outline" title="Aún no tienes direcciones" body="Agrega una para ver los comercios que llegan hasta ti." />
      ) : (
        <View style={{ marginTop: 8 }}>
          <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>Selecciona la dirección de entrega</Text>
          {addresses.data.map((a) => (
            <RadioRow key={a.id} title={a.label} subtitle={[a.line1, a.line2].filter(Boolean).join(", ")} selected={active?.id === a.id} icon={a.label === "Casa" ? "home-outline" : a.label === "Trabajo" ? "briefcase-outline" : "location-outline"}
              right={a.is_default ? <Badge label="Principal" tone="blue" /> : undefined}
              onPress={async () => { await activateAddress(a); close(); }} />
          ))}
        </View>
      )}
    </Screen>
  );
}
