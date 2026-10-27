import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Screen, Text, Card, ListRow, Badge } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { ADMIN_PATHS, ADMIN_URL, canOpenOwnerOnlySections, canSeeAlerts } from "@/features/owner/types";
import { openAdmin } from "@/features/owner/links";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";
import { confirm, notify } from "@/lib/dialog";

const ROLE_LABEL: Record<string, string> = { owner: "Acceso de dirección", finance: "Finanzas", operations: "Operaciones", support: "Soporte" };

/** Pantalla 104 · Cuenta de owners. */
export default function OwnerAccount() {
  const router = useRouter();
  const { profile, adminRole, updateProfile, signOut } = useAuth();
  const initials = (profile?.full_name ?? "YA").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const ownerOnly = canOpenOwnerOnlySections(adminRole);
  const onSignOut = async () => {
    if (await confirm("Cerrar sesión", "¿Salir de YAVA Owners?", { okText: "Cerrar sesión", destructive: true })) await signOut();
  };

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
        onValueChange={(v) => updateProfile({ notifications_enabled: v }).catch((e: unknown) => notify("No se pudo guardar", errorMessage(e)))} />
      {canSeeAlerts(adminRole) ? <ListRow icon="notifications-outline" title="Alertas importantes" subtitle="Pedidos con demora, pagos y documentos" onPress={() => router.push("/(owner)/alerts")} /> : null}
      <ListRow icon="map-outline" title="Ciudades" subtitle="Todas · Puerto Colombia y Barranquilla" onPress={() => router.push("/(owner)/cities")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Seguridad y equipo</Text>
      <ListRow icon="shield-checkmark-outline" title="Seguridad" subtitle="Acceso solo por invitación · sesión protegida" chevron={false} />
      {ownerOnly ? <ListRow icon="people-outline" title="Equipo y permisos" subtitle="Se gestionan en el panel web" onPress={() => { void openAdmin(ADMIN_PATHS.team); }} /> : null}
      <ListRow icon="open-outline" title="Abrir panel web" subtitle={ADMIN_URL.replace(/^https?:\/\//, "")} onPress={() => { void openAdmin(); }} />
      {ownerOnly ? <ListRow icon="help-circle-outline" title="Ayuda" subtitle="Casos de soporte en el panel web" onPress={() => { void openAdmin(ADMIN_PATHS.support); }} /> : null}

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Sesión</Text>
      <ListRow icon="log-out-outline" title="Cerrar sesión" danger chevron={false} onPress={() => { void onSignOut(); }} />
      <Text variant="small" tone="subtle" style={{ marginTop: 24, textAlign: "center" }}>El móvil prioriza consulta, resúmenes y alertas. Las aprobaciones se hacen en el panel web.</Text>
    </Screen>
  );
}
