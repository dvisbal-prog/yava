import React from "react";
import { View, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify, confirm } from "@/lib/dialog";
import { Radio, ErrorState } from "@/components/customer";
import { NavBar, ft, ACC_GUTTER } from "@/components/customer/account/kit";
import { PrimaryCTA } from "@/components/customer/account/parts";
import { LineIcon } from "@/components/customer/account/icons";
import { useAddresses, useCities, activateAddress, loginHref, type AddressRow } from "@/features/customer";

/** En web un `<button>` no puede contener otro: la tarjeta solo se anuncia como radio en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("radio" as const);

/**
 * Pantalla 37 · Mis direcciones (tanda-05/37-direcciones.png): chevron suelto, "Mis direcciones" H1 + subtítulo,
 * tarjetas C18 (radio, etiqueta + "Principal", dirección, ciudad, lápiz), tarjeta "+ Agregar dirección" y CTA fijo
 * "Usar esta dirección". Tocar una tarjeta activa la dirección; mantenerla presionada permite eliminarla.
 */
export default function Addresses() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const active = useLocation((s) => s.address);
  const setAddress = useLocation((s) => s.setAddress);
  const addresses = useAddresses();
  const cities = useCities();
  const cityName = (id: string | null) => cities.data?.find((c) => c.id === id)?.name ?? null;

  async function remove(a: AddressRow) {
    if (!(await confirm("Eliminar dirección", `¿Quieres eliminar "${a.label}"?`, { okText: "Eliminar", destructive: true }))) return;
    const { error } = await supabase.from("addresses").delete().eq("id", a.id);
    if (error) { notify("No se pudo eliminar", errorMessage(error)); return; }
    if (active?.id === a.id) setAddress(null);
    void qc.invalidateQueries({ queryKey: ["addresses"] });
  }

  const addNew = () => router.push("/(customer)/location" as never);
  const done = () => (router.canGoBack() ? router.back() : router.replace("/(customer)" as never));

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <NavBar backLeft={21.2} chevronHeight={21.7} chevronStroke={1.6} />
        <EmptyState icon="location-outline" title="Inicia sesión" body="Guarda tus direcciones para pedir más rápido." actionTitle="Iniciar sesión"
          onAction={() => router.push(loginHref("/(customer)/addresses") as never)} />
      </View>
    );
  }

  const list = addresses.data ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar backLeft={21.2} chevronHeight={21.7} chevronStroke={1.6} height={42} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1} accessibilityRole="header">Mis direcciones</Text>
        <Text style={styles.sub}>Selecciona la dirección de entrega</Text>

        {addresses.isLoading ? (
          <View style={{ gap: 11.6 }}>{[0, 1].map((i) => <Skeleton key={i} height={107} style={{ borderRadius: 18 }} />)}</View>
        ) : addresses.error ? (
          <ErrorState error={addresses.error} onRetry={() => { void addresses.refetch(); }} />
        ) : (
          <View style={{ gap: 11.6 }}>
            {!list.length ? (
              <EmptyState compact icon="location-outline" title="Aún no tienes direcciones" body="Agrega tu casa o tu trabajo para empezar a pedir." />
            ) : list.map((a) => {
              const selected = active?.id === a.id;
              const city = cityName(a.city_id);
              return (
                <Pressable key={a.id} onPress={() => { void activateAddress(a); }} onLongPress={() => { void remove(a); }}
                  accessibilityRole={CARD_ROLE} accessibilityState={{ checked: selected }} accessibilityLabel={`${a.label}, ${a.line1}`}
                  accessibilityHint="Mantén presionado para eliminar"
                  accessibilityActions={[{ name: "activate" }, { name: "delete", label: "Eliminar dirección" }]}
                  onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === "delete") void remove(a); else void activateAddress(a); }}
                  style={({ pressed }) => [styles.card, selected ? styles.cardOn : styles.cardOff, pressed && { opacity: 0.9 }]}>
                  <View style={styles.radio}><Radio selected={selected} size={22.6} ringColor="#B9BEC8" /></View>
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Text style={ft(16.6, "500", colors.ink, 22)} numberOfLines={1}>{a.label}</Text>
                      {a.is_default ? <View style={styles.badge}><Text style={ft(10.5, "500", colors.blueLink, 14)}>Principal</Text></View> : null}
                    </View>
                    <Text style={[ft(13.5, "400", colors.ink, 18), { marginTop: 5.7 }]} numberOfLines={2}>{[a.line1, a.line2].filter(Boolean).join(", ")}</Text>
                    {city ? <Text style={[ft(13.4, "400", "#6E7689", 18), { marginTop: 2.4 }]} numberOfLines={1}>{city}</Text> : null}
                  </View>
                  <Pressable onPress={() => router.push(`/(customer)/address?id=${a.id}` as never)} hitSlop={12} style={styles.edit}
                    accessibilityRole="button" accessibilityLabel={`Editar ${a.label}`}>
                    <LineIcon name="pencil" size={26} color="#536073" stroke={1.45} />
                  </Pressable>
                </Pressable>
              );
            })}
            <Pressable onPress={addNew} accessibilityRole="button" accessibilityLabel="Agregar dirección"
              style={({ pressed }) => [styles.addCard, pressed && { opacity: 0.85 }]}>
              <View style={styles.radio}><Ionicons name="add" size={27} color={colors.blueLink} /></View>
              <Text style={ft(14.6, "600", colors.blueLink, 19)}>Agregar dirección</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      {active ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
          <PrimaryCTA title="Usar esta dirección" onPress={done} weight="500" color="#0048B6" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 15.7, paddingBottom: 24 },
  h1: { ...ft(27.9, "700", colors.ink, 34), letterSpacing: -0.4, marginTop: 9.2, marginLeft: 3.6 },
  sub: { ...ft(14.9, "400", "#6E7689", 20), marginTop: 5, marginLeft: 3.7, marginBottom: 21 },
  card: { flexDirection: "row", alignItems: "flex-start", minHeight: 107.5, borderRadius: 18, borderWidth: 1, paddingBottom: 14 },
  cardOn: { backgroundColor: "#EEF5FE", borderColor: "#D6E6FD" },
  cardOff: { backgroundColor: colors.white, borderColor: "#E2E7EE" },
  radio: { width: 55, height: 64.5, alignItems: "center", justifyContent: "center", paddingLeft: 0 },
  cardBody: { flex: 1, paddingTop: 19.9 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  badge: { height: 21.2, borderRadius: 11, backgroundColor: colors.blueChip, paddingHorizontal: 10, justifyContent: "center", marginLeft: 9.7 },
  edit: { position: "absolute", top: 18.5, right: 15.4 },
  addCard: { flexDirection: "row", alignItems: "center", height: 68.4, borderRadius: 18, borderWidth: 1, borderColor: "#E2E7EE", backgroundColor: colors.white },
  footer: { paddingHorizontal: 15.5, paddingTop: 8, backgroundColor: colors.white },
});
