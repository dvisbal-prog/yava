import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useAddresses, useCities, activateAddress, loginHref } from "@/features/customer";
import { AuthScreen } from "@/components/customer/auth/AuthScreen";
import { AddressOption, AddAddressCard } from "@/components/customer/auth/AddressOption";

/**
 * Selector de dirección activa (desde el encabezado de Inicio y desde Revisar y pagar).
 * Mismo lenguaje visual que 37 · Mis direcciones: tarjetas con radio, "Principal" y "+ Agregar dirección".
 */
export default function AddressPicker() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const active = useLocation((s) => s.address);
  const addresses = useAddresses();
  const cities = useCities();

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(customer)" as never));
  const addNew = () => router.push(session ? "/(customer)/location" as never : "/(auth)/location" as never);
  const cityName = (id: string | null) => cities.data?.find((c) => c.id === id)?.name ?? null;

  return (
    <AuthScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>Dirección de entrega</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
      </View>

      {!session ? (
        <EmptyState icon="location-outline" title="¿Dónde te entregamos?" body="Usa tu ubicación para ver comercios cerca, o inicia sesión para guardar direcciones." actionTitle="Usar mi ubicación" onAction={() => router.push("/(auth)/location" as never)} secondaryTitle="Iniciar sesión" onSecondary={() => router.push(loginHref("/(customer)") as never)} />
      ) : addresses.isLoading ? <ListSkeleton rows={2} height={96} /> : addresses.error ? <ErrorState error={addresses.error} onRetry={() => { void addresses.refetch(); }} /> : !addresses.data?.length ? (
        <>
          <EmptyState icon="location-outline" title="Aún no tienes direcciones" body="Agrega una para ver los comercios que llegan hasta ti." compact />
          <AddAddressCard onPress={addNew} />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Selecciona la dirección de entrega</Text>
          {addresses.data.map((a) => (
            <AddressOption
              key={a.id}
              label={a.label}
              line={[a.line1, a.line2].filter(Boolean).join(", ")}
              city={cityName(a.city_id)}
              selected={active?.id === a.id}
              principal={a.is_default}
              onPress={async () => { await activateAddress(a); close(); }}
              onEdit={() => router.push(`/(customer)/address?id=${a.id}` as never)}
            />
          ))}
          <AddAddressCard onPress={addNew} />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17.5 },
  header: { flexDirection: "row", alignItems: "center", height: 52, marginBottom: 6 },
  title: { flex: 1, fontSize: 17.8, lineHeight: 23, fontWeight: "600", letterSpacing: -0.4, color: colors.ink },
  close: { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
  subtitle: { fontSize: 14.5, lineHeight: 20, letterSpacing: -0.25, color: colors.textTertiary, marginBottom: 16 },
});
