import React from "react";
import { View } from "react-native";
import type { AdminRole } from "@yava/shared";
import { Screen, Text, Logo, EmptyState } from "@/components/ui";
import { ADMIN_URL } from "@/features/owner/types";
import { openAdmin } from "@/features/owner/links";
import { useAuth } from "@/store/auth";
import { confirm } from "@/lib/dialog";

const ROLE_NAME: Partial<Record<AdminRole, string>> = { operations: "operaciones", support: "soporte" };

/** Roles de admin sin acceso a la app de owners (operaciones, soporte): se les envía al panel web. */
export function WebPanelOnly({ role }: { role: AdminRole }) {
  const signOut = useAuth((s) => s.signOut);
  const roleName = ROLE_NAME[role];

  const onSignOut = async () => {
    if (await confirm("Cerrar sesión", "¿Salir de YAVA?", { okText: "Cerrar sesión", destructive: true })) await signOut();
  };

  return (
    <Screen scroll={false}>
      <View style={{ paddingTop: 12 }}><Logo size={32} /></View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <EmptyState
          icon="desktop-outline"
          title="Usa el panel web"
          body={`${roleName ? `Tu rol de ${roleName}` : "Tu rol"} trabaja desde el panel web de YAVA. La app de owners es solo para dirección y finanzas.`}
          actionTitle="Abrir panel web"
          onAction={() => { void openAdmin(); }}
          secondaryTitle="Cerrar sesión"
          onSecondary={() => { void onSignOut(); }}
        />
        <Text variant="small" tone="subtle" style={{ textAlign: "center" }}>{ADMIN_URL.replace(/^https?:\/\//, "")}</Text>
      </View>
    </Screen>
  );
}
