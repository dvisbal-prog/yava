import React, { useState } from "react";
import { View, Switch } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@yava/shared";
import { Screen, Header, Text, ListRow, Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify, confirm } from "@/lib/dialog";
import { Avatar } from "@/components/customer";

/** Pantalla 72 (cliente) · Ajustes: notificaciones, idioma fijo, datos, cerrar sesión y eliminar cuenta. */
export default function Settings() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const updateProfile = useAuth((s) => s.updateProfile);
  const signOut = useAuth((s) => s.signOut);
  const clearCart = useCart((s) => s.clear);
  const setAddress = useLocation((s) => s.setAddress);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function saveProfile() {
    if (!name.trim()) { notify("Escribe tu nombre"); return; }
    setSaving(true);
    try { await updateProfile({ full_name: name.trim(), email: email.trim() || null }); notify("Datos guardados"); }
    catch (e) { notify("No se pudo guardar", errorMessage(e)); }
    finally { setSaving(false); }
  }

  async function toggleNotifications(v: boolean) {
    try { await updateProfile({ notifications_enabled: v }); } catch (e) { notify("No se pudo actualizar", errorMessage(e)); }
  }

  async function logout() {
    if (!(await confirm("Cerrar sesión", "¿Quieres salir de tu cuenta?", { okText: "Cerrar sesión", destructive: true }))) return;
    setBusy("logout");
    try { clearCart(); setAddress(null); await signOut(); router.replace("/(auth)" as never); }
    catch (e) { notify("Error", errorMessage(e)); } finally { setBusy(null); }
  }

  async function deleteAccount() {
    if (!(await confirm("Eliminar cuenta", "Se borrarán tus datos, direcciones y métodos de pago. Esta acción no se puede deshacer.", { okText: "Eliminar mi cuenta", destructive: true }))) return;
    if (!(await confirm("¿Estás seguro?", "Se eliminarán tus datos de forma permanente. Si tienes pedidos en curso, espera a que terminen.", { okText: "Sí, eliminar", cancelText: "No", destructive: true }))) return;
    setBusy("delete");
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      clearCart(); setAddress(null);
      await signOut();
      notify("Cuenta eliminada", "Tus datos personales fueron eliminados de YAVA.");
      router.replace("/(auth)" as never);
    } catch (e) { notify("No se pudo procesar", errorMessage(e)); } finally { setBusy(null); }
  }

  return (
    <Screen>
      <Header title="Ajustes" />
      <View style={{ alignItems: "center", marginTop: 12, marginBottom: 20 }}>
        <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={72} />
        <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>{profile?.phone ?? session?.user.email ?? ""}</Text>
      </View>

      <Text variant="heading" style={{ marginBottom: 10 }}>Datos personales</Text>
      <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" autoCapitalize="words" />
      <Input label="Correo" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
      <Button title="Guardar cambios" variant="secondary" size="md" onPress={saveProfile} loading={saving} />

      <Text variant="heading" style={{ marginTop: 28, marginBottom: 4 }}>Preferencias</Text>
      <ListRow icon="notifications-outline" title="Notificaciones" subtitle="Estado de pedidos y ofertas" chevron={false}
        right={<Switch value={profile?.notifications_enabled ?? true} onValueChange={toggleNotifications} trackColor={{ true: colors.blue }} />} />
      <ListRow icon="language-outline" title="Idioma" subtitle="Español (Colombia)" chevron={false} right={<Text variant="caption" tone="muted">Fijo</Text>} />
      <ListRow icon="location-outline" title="Direcciones" onPress={() => router.push("/(customer)/addresses" as never)} />
      <ListRow icon="card-outline" title="Métodos de pago" onPress={() => router.push("/(customer)/payment-methods" as never)} />

      <Text variant="heading" style={{ marginTop: 28, marginBottom: 4 }}>Cuenta</Text>
      <ListRow icon="log-out-outline" title="Cerrar sesión" onPress={() => { void logout(); }} chevron={false} />
      <ListRow icon="trash-outline" title="Eliminar cuenta" subtitle="Borra tus datos de YAVA" onPress={() => { void deleteAccount(); }} danger chevron={false} />
      {busy ? <Card style={{ marginTop: 12 }}><Text tone="muted">Procesando…</Text></Card> : null}
      <Text variant="small" tone="subtle" style={{ textAlign: "center", marginTop: 24 }}>YAVA · v1.0.0 · Términos y privacidad</Text>
    </Screen>
  );
}
