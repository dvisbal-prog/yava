import React from "react";
import { View, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Screen, Text, Card, ListRow, Badge } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { ADMIN_URL } from "@/features/owner/types";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

const ROLE_LABEL: Record<string, string> = { owner: "Acceso de dirección", finance: "Finanzas", operations: "Operaciones", support: "Soporte" };

/** Pantalla 104 · Cuenta de owners. */
export default function OwnerAccount() {
  const router = useRouter();
  const { profile, adminRole, updateProfile, signOut } = useAuth();
  const initials = (profile?.full_name ?? "YA").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const openWeb = (path = "") => Linking.openURL(`${ADMIN_URL}${path}`).catch(() => Alert.alert("No se pudo abrir", ADMIN_URL));

  return (
    <Screen>
      <Text variant="title" style={{ paddingTop: 12, marginBottom: 12 }}>Cuenta</Text>
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: 56, height: 56 }} contentFit="cover" /> : <Text variant="heading" tone="primary">{initials}</Text>}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="heading">{profile?.full_name ?? "Owner"}</Text>
            <Text variant="caption" tone="muted">{profile?.email ?? ""}</Text>
            <View style={{ marginTop: 4 }}><Badge label={`YAVA Owners · ${ROLE_LABEL[adminRole ?? "owner"]}`} tone="blue" /></View>
          </View>
        </View>
      </Card>

      <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>Resumen diario</Text>
      <SwitchRow label="Resumen diario" hint="Ingresos, pedidos y pendientes al cierre del día (20:00)" value={profile?.notifications_enabled ?? true}
        onValueChange={(v) => updateProfile({ notifications_enabled: v }).catch((e: unknown) => Alert.alert("No se pudo guardar", errorMessage(e)))} />
      <ListRow icon="notifications-outline" title="Alertas importantes" subtitle="Pedidos con demora, pagos y documentos" onPress={() => router.push("/(owner)/alerts")} />
      <ListRow icon="map-outline" title="Ciudades" subtitle="Todas · Puerto Colombia y Barranquilla" onPress={() => router.push("/(owner)/cities")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Seguridad y equipo</Text>
      <ListRow icon="shield-checkmark-outline" title="Seguridad" subtitle="Acceso solo por invitación · sesión protegida" chevron={false} />
      <ListRow icon="people-outline" title="Equipo y permisos" subtitle="Se gestionan en el panel web" onPress={() => openWeb("/team")} />
      <ListRow icon="open-outline" title="Abrir panel web" subtitle={ADMIN_URL.replace(/^https?:\/\//, "")} onPress={() => openWeb()} />
      <ListRow icon="help-circle-outline" title="Ayuda" subtitle="Documentación y soporte interno" onPress={() => openWeb("/help")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Sesión</Text>
      <ListRow icon="log-out-outline" title="Cerrar sesión" danger chevron={false} onPress={() => Alert.alert("Cerrar sesión", "¿Salir de YAVA Owners?", [{ text: "Cancelar", style: "cancel" }, { text: "Cerrar sesión", style: "destructive", onPress: () => signOut() }])} />
      <Text variant="small" tone="subtle" style={{ marginTop: 24, textAlign: "center" }}>El móvil prioriza consulta, resúmenes y alertas. Las aprobaciones se hacen en el panel web.</Text>
    </Screen>
  );
}
