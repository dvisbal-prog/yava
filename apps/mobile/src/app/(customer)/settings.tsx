import React, { useState } from "react";
import { View, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@yava/shared";
import { Screen, Header, Text, ListRow, Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
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
    if (!name.trim()) { Alert.alert("Escribe tu nombre"); return; }
    setSaving(true);
    try { await updateProfile({ full_name: name.trim(), email: email.trim() || null }); Alert.alert("Datos guardados"); }
    catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
    finally { setSaving(false); }
  }

  async function toggleNotifications(v: boolean) {
    try { await updateProfile({ notifications_enabled: v }); } catch (e) { Alert.alert("No se pudo actualizar", errorMessage(e)); }
  }

  function logout() {
    Alert.alert("Cerrar sesión", "¿Quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: async () => {
        setBusy("logout");
        try { clearCart(); setAddress(null); await signOut(); router.replace("/(auth)" as never); }
        catch (e) { Alert.alert("Error", errorMessage(e)); } finally { setBusy(null); }
      } },
    ]);
  }

  function deleteAccount() {
    Alert.alert("Eliminar cuenta", "Se borrarán tus datos, direcciones y métodos de pago. Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar mi cuenta", style: "destructive", onPress: () => {
        Alert.alert("¿Estás seguro?", "Confirma para enviar la solicitud de eliminación.", [
          { text: "No", style: "cancel" },
          { text: "Sí, eliminar", style: "destructive", onPress: async () => {
            setBusy("delete");
            try {
              // La eliminación del usuario en Auth requiere permisos de servicio: se registra un caso de soporte
              // con prioridad alta y se cierra la sesión. TODO(backend): Edge Function `delete_account`.
              const { error } = await supabase.from("support_cases").insert({ opened_by: session?.user.id as string, opener_role: "customer", category: "account", subject: "Eliminar cuenta", description: "El usuario solicitó eliminar su cuenta desde la app.", status: "open", priority: "high" });
              if (error) throw error;
              clearCart(); setAddress(null);
              await signOut();
              Alert.alert("Solicitud enviada", "Eliminaremos tu cuenta en máximo 72 horas.");
              router.replace("/(auth)" as never);
            } catch (e) { Alert.alert("No se pudo procesar", errorMessage(e)); } finally { setBusy(null); }
          } },
        ]);
      } },
    ]);
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
      <ListRow icon="log-out-outline" title="Cerrar sesión" onPress={logout} chevron={false} />
      <ListRow icon="trash-outline" title="Eliminar cuenta" subtitle="Borra tus datos de YAVA" onPress={deleteAccount} danger chevron={false} />
      {busy ? <Card style={{ marginTop: 12 }}><Text tone="muted">Procesando…</Text></Card> : null}
      <Text variant="small" tone="subtle" style={{ textAlign: "center", marginTop: 24 }}>YAVA · v1.0.0 · Términos y privacidad</Text>
    </Screen>
  );
}
