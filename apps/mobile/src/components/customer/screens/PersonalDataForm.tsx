import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { isAddressRoute, isLocationRoute } from "./AddressForm";

/** Pantalla 05 · Completa tus datos. Se usa desde (auth) y desde (customer). */
export function PersonalDataForm({ group }: { group: "auth" | "customer" }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const profile = useAuth((s) => s.profile);
  const session = useAuth((s) => s.session);
  const updateProfile = useAuth((s) => s.updateProfile);
  const pendingNext = useNavIntent((s) => s.pendingNext);
  const setPendingNext = useNavIntent((s) => s.setPendingNext);

  const existing = (profile?.full_name ?? "").trim().split(" ");
  const [firstName, setFirstName] = useState(existing[0] ?? "");
  const [lastName, setLastName] = useState(existing.slice(1).join(" "));
  const [email, setEmail] = useState(profile?.email ?? session?.user.email ?? "");
  // Consentimiento de marketing: desmarcado por defecto. Aún no hay columna propia en `profiles`
  // (no debe mezclarse con `notifications_enabled`, que son los avisos del pedido), así que no se guarda.
  const [news, setNews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const next = params.next ?? pendingNext ?? "/(customer)";

  async function save() {
    if (!firstName.trim()) { setError("Escribe tu nombre."); return; }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { setError("Revisa el correo."); return; }
    setSaving(true); setError(null);
    try {
      await updateProfile({ full_name: `${firstName.trim()} ${lastName.trim()}`.trim(), email: email.trim() || null });
      setPendingNext(null);
      // Si venía de guardar una dirección (07), seguimos ahí con lo que ya había escrito.
      if (isAddressRoute(next)) { router.replace(next as never); return; }
      // ¿Ya tiene direcciones? Si no, seguimos con ubicación (06).
      const uid = session?.user.id;
      const { count } = uid ? await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", uid) : { count: 1 };
      if (!count) router.replace(`/(${group})/location?next=${encodeURIComponent(isLocationRoute(next) ? "/(customer)" : next)}` as never);
      else router.replace(next as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen footer={
      <View>
        <Button title="Guardar y continuar" onPress={save} loading={saving} />
        <Text variant="caption" tone="muted" style={{ textAlign: "center", marginTop: 10 }}>Puedes editar tus datos desde tu cuenta.</Text>
      </View>
    }>
      <Header back={router.canGoBack()} />
      <Text variant="display" style={{ marginTop: 8 }}>Completa tus datos</Text>
      <Text tone="muted" style={{ marginTop: 6, marginBottom: 24 }}>Así sabremos quién recibe el pedido.</Text>
      <Input label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="María" autoCapitalize="words" textContentType="givenName" />
      <Input label="Apellidos" value={lastName} onChangeText={setLastName} placeholder="Pérez" autoCapitalize="words" textContentType="familyName" />
      <Input label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="maria@example.com" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" error={error} />
      <Pressable
        onPress={() => setNews((v) => !v)}
        style={styles.check}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: news }}
      >
        <View style={[styles.box, news && styles.boxOn]}>
          {news ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
        </View>
        <Text style={{ flex: 1 }}>Quiero recibir novedades y ofertas</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginTop: 4 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.gray300, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: colors.white },
  boxOn: { backgroundColor: colors.blue, borderColor: colors.blue },
});
