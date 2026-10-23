import React from "react";
import { Alert, View } from "react-native";
import { Screen, Header, Text, ListRow } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { useSetOnline } from "@/features/courier/useCourier";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 72 · Ajustes de la cuenta. */
export default function CourierSettings() {
  const { profile, session, updateProfile, signOut } = useAuth();
  const setOnline = useSetOnline();

  const toggleNotifications = async (v: boolean) => {
    try { await updateProfile({ notifications_enabled: v }); } catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
  };

  const confirmSignOut = () => Alert.alert("Cerrar sesión", "Te pondremos como no disponible antes de salir.", [
    { text: "Cancelar", style: "cancel" },
    { text: "Cerrar sesión", style: "destructive", onPress: async () => { try { await setOnline.mutateAsync(false); } catch { /* seguir */ } await signOut(); } },
  ]);

  const deleteAccount = () => Alert.alert("Eliminar cuenta", "Enviaremos la solicitud a soporte. Tus entregas pendientes y saldo se revisan antes de cerrar la cuenta. ¿Continuar?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Eliminar cuenta", style: "destructive", onPress: async () => {
      try {
        if (!session) return;
        const { error } = await supabase.from("support_cases").insert({ opened_by: session.user.id, opener_role: "courier", category: "cuenta", subject: "Solicitud de eliminación de cuenta", description: `El repartidor ${profile?.full_name ?? ""} solicita eliminar su cuenta desde la app.`, status: "open", priority: "normal" });
        if (error) throw error;
        try { await setOnline.mutateAsync(false); } catch { /* seguir */ }
        Alert.alert("Solicitud enviada", "Soporte procesará la eliminación en los próximos días. Cerraremos tu sesión.", [{ text: "Entendido", onPress: () => signOut() }]);
      } catch (e) { Alert.alert("No se pudo enviar", errorMessage(e)); }
    } },
  ]);

  return (
    <Screen padded={false}>
      <Header title="Ajustes" />
      <Text variant="caption" tone="muted" style={{ paddingHorizontal: 16, marginTop: 8 }}>Notificaciones</Text>
      <SwitchRowWrap>
        <SwitchRow label="Notificaciones" hint="Nuevas entregas, pagos y novedades" value={profile?.notifications_enabled ?? true} onValueChange={toggleNotifications} />
      </SwitchRowWrap>
      <Text variant="caption" tone="muted" style={{ paddingHorizontal: 16, marginTop: 20 }}>Cuenta</Text>
      <SwitchRowWrap>
        <ListRow icon="mail-outline" title={profile?.email ?? profile?.phone ?? "Cuenta"} subtitle="Datos de acceso" chevron={false} />
        <ListRow icon="log-out-outline" title="Cerrar sesión" onPress={confirmSignOut} chevron={false} />
        <ListRow icon="trash-outline" title="Eliminar cuenta" subtitle="Solicitud a soporte con confirmación" onPress={deleteAccount} danger chevron={false} />
      </SwitchRowWrap>
      <Text variant="small" tone="subtle" style={{ marginTop: 24, textAlign: "center" }}>YAVA Repartidores · v1.0</Text>
    </Screen>
  );
}

function SwitchRowWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ paddingHorizontal: 16 }}>{children}</View>;
}
