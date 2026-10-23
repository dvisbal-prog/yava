import React, { useState } from "react";
import { View, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";

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
  const [news, setNews] = useState(profile?.notifications_enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const next = params.next ?? pendingNext ?? "/(customer)";

  async function save() {
    if (!firstName.trim()) { setError("Escribe tu nombre."); return; }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { setError("Revisa el correo."); return; }
    setSaving(true); setError(null);
    try {
      await updateProfile({ full_name: `${firstName.trim()} ${lastName.trim()}`.trim(), email: email.trim() || null, notifications_enabled: news });
      setPendingNext(null);
      // ¿Ya tiene direcciones? Si no, seguimos con ubicación (06).
      const uid = session?.user.id;
      const { count } = uid ? await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", uid) : { count: 1 };
      if (!count) router.replace(`/(${group})/location?next=${encodeURIComponent(next)}` as never);
      else router.replace(next as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button title="Guardar y continuar" onPress={save} loading={saving} />}>
      <Header back={router.canGoBack()} />
      <Text variant="display" style={{ marginTop: 8 }}>Completa tus datos</Text>
      <Text tone="muted" style={{ marginTop: 6, marginBottom: 24 }}>Así sabremos quién recibe el pedido.</Text>
      <Input label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="María" autoCapitalize="words" textContentType="givenName" />
      <Input label="Apellidos" value={lastName} onChangeText={setLastName} placeholder="Pérez" autoCapitalize="words" textContentType="familyName" />
      <Input label="Correo electrónico (opcional)" value={email} onChangeText={setEmail} placeholder="maria@example.com" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" error={error} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Text style={{ flex: 1, paddingRight: 12 }}>Quiero recibir novedades y ofertas</Text>
        <Switch value={news} onValueChange={setNews} trackColor={{ true: colors.blue }} />
      </View>
      <Text variant="caption" tone="subtle" style={{ marginTop: 16, textAlign: "center" }}>Puedes editar tus datos desde tu cuenta.</Text>
    </Screen>
  );
}
