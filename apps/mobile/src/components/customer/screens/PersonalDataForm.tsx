import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { AuthScreen } from "@/components/customer/auth/AuthScreen";
import { AuthBack } from "@/components/customer/auth/AuthBack";
import { Field, Checkbox, AuthButton, LOOK_PROFILE } from "@/components/customer/auth/Field";
import { isAddressRoute, isLocationRoute } from "./AddressForm";

/** Pantalla 05 · Completa tus datos. Se usa desde (auth) y desde (customer). Medidas de tanda-01/05-datos-personales.png. */
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
    <AuthScreen
      footerStyle={styles.footer}
      bottomGap={21}
      footer={
        <>
          <AuthButton title="Guardar y continuar" onPress={save} loading={saving} height={46.6} radius={10.5} color="#003E94" textStyle={styles.ctaText} />
          <Text style={styles.note}>Puedes editar tus datos desde tu cuenta.</Text>
        </>
      }
    >
      <AuthBack plain iconSize={23.5} stroke={30} style={styles.back} />
      <Text variant="h1" style={styles.title}>Completa tus datos</Text>
      <Text tone="secondary" style={styles.subtitle}>Así sabremos quién recibe el pedido.</Text>

      <Field look={LOOK_PROFILE} label="Nombre" containerStyle={styles.first} value={firstName} onChangeText={setFirstName} placeholder="María" autoCapitalize="words" textContentType="givenName" autoComplete="given-name" />
      <Field look={LOOK_PROFILE} label="Apellidos" containerStyle={styles.next} value={lastName} onChangeText={setLastName} placeholder="Pérez" autoCapitalize="words" textContentType="familyName" autoComplete="family-name" />
      <Field look={LOOK_PROFILE} label="Correo electrónico" containerStyle={styles.next} value={email} onChangeText={setEmail} placeholder="maria@example.com" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" autoComplete="email" error={error} />

      <Checkbox checked={news} onToggle={() => setNews((v) => !v)} label="Quiero recibir novedades y ofertas" size={21.7} radius={6} style={styles.check} labelStyle={styles.checkLabel} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: 10.1, marginLeft: 12.2 },
  title: { marginTop: 31, marginHorizontal: 19.4 },
  subtitle: { fontSize: 16.2, lineHeight: 21, letterSpacing: -0.36, marginTop: 3.2, marginHorizontal: 19.4 },
  first: { marginTop: 27, marginHorizontal: 19.4 },
  next: { marginTop: 19.1, marginHorizontal: 19.4 },
  check: { marginTop: 31.5, marginHorizontal: 19.4 },
  checkLabel: { fontSize: 14, lineHeight: 20, letterSpacing: -0.42, marginLeft: 14.8 },
  footer: { paddingHorizontal: 18.9 },
  ctaText: { fontSize: 15.2, lineHeight: 20, fontWeight: "600", letterSpacing: -0.45 },
  note: { fontSize: 11.7, lineHeight: 16, letterSpacing: -0.38, color: colors.textTertiary, textAlign: "center", marginTop: 12.3 },
});
