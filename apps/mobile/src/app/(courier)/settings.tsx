import React from "react";
import { Linking, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Screen, Header, Text, ListRow } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { useSetOnline } from "@/features/courier/useCourier";
import { LEGAL_URLS } from "@/features/courier/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";
import { alert, confirm, notify } from "@/lib/dialog";

const openLegal = (url: string) => {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => notify("No se pudo abrir", url)));
};

/** Pantalla 72 · Ajustes de la cuenta. */
export default function CourierSettings() {
  const { profile, session, updateProfile, signOut } = useAuth();
  const setOnline = useSetOnline();

  const toggleNotifications = async (v: boolean) => {
    try { await updateProfile({ notifications_enabled: v }); } catch (e) { notify("No se pudo guardar", errorMessage(e)); }
  };

  const confirmSignOut = async () => {
    const ok = await confirm("Cerrar sesión", "Te pondremos como no disponible antes de salir.", { okText: "Cerrar sesión", destructive: true });
    if (!ok) return;
    try { await setOnline.mutateAsync(false); } catch { /* seguir */ }
    await signOut();
  };

  const deleteAccount = async () => {
    const ok = await confirm("Eliminar cuenta", "Se eliminarán tus datos personales y documentos. Debes tener el saldo retirado y ninguna entrega en curso. ¿Continuar?", { okText: "Eliminar cuenta", destructive: true });
    if (!ok || !session) return;
    try {
      try { await setOnline.mutateAsync(false); } catch { /* seguir */ }
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      alert("Cuenta eliminada", "Tus datos personales fueron eliminados de YAVA.", [{ text: "Entendido", onPress: () => { signOut(); } }]);
    } catch (e) { notify("No se pudo eliminar", errorMessage(e)); }
  };

  return (
    <Screen padded={false}>
      <Header title="Ajustes" />
      <Text variant="caption" tone="muted" style={{ paddingHorizontal: 16, marginTop: 8 }}>Notificaciones</Text>
      <SwitchRowWrap>
        <SwitchRow label="Notificaciones" hint="Nuevas entregas, pagos y novedades" value={profile?.notifications_enabled ?? true} onValueChange={toggleNotifications} />
      </SwitchRowWrap>
      <Text variant="caption" tone="muted" style={{ paddingHorizontal: 16, marginTop: 20 }}>Privacidad y legales</Text>
      <SwitchRowWrap>
        <ListRow icon="document-text-outline" title="Política de privacidad" onPress={() => openLegal(LEGAL_URLS.privacy)} />
        <ListRow icon="shield-checkmark-outline" title="Términos de uso" onPress={() => openLegal(LEGAL_URLS.terms)} />
      </SwitchRowWrap>
      <Text variant="caption" tone="muted" style={{ paddingHorizontal: 16, marginTop: 20 }}>Cuenta</Text>
      <SwitchRowWrap>
        <ListRow icon="mail-outline" title={profile?.email ?? profile?.phone ?? "Cuenta"} subtitle="Datos de acceso" chevron={false} />
        <ListRow icon="log-out-outline" title="Cerrar sesión" onPress={confirmSignOut} chevron={false} />
        <ListRow icon="trash-outline" title="Eliminar cuenta" onPress={deleteAccount} danger chevron={false} />
      </SwitchRowWrap>
      <Text variant="small" tone="subtle" style={{ marginTop: 24, textAlign: "center" }}>YAVA Repartidores · v1.0</Text>
    </Screen>
  );
}

function SwitchRowWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ paddingHorizontal: 16 }}>{children}</View>;
}
