import React, { useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { Screen, Header, Text, Skeleton, EmptyState } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { AlertCard } from "@/components/owner/AlertCard";
import { ErrorState, SwitchRow } from "@/components/merchant/Rows";
import { useOwnerAlerts, useAcknowledgeAlert } from "@/features/owner/useOwner";
import { alertTarget, canSeeAlerts } from "@/features/owner/types";
import { openAdmin } from "@/features/owner/links";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";

type Seg = "pending" | "all" | "critical";

/** Pantalla 103 · Alertas. */
export default function OwnerAlerts() {
  const [seg, setSeg] = useState<Seg>("pending");
  const q = useOwnerAlerts(false);
  const ack = useAcknowledgeAlert();
  const { profile, adminRole, updateProfile } = useAuth();
  const allowed = canSeeAlerts(adminRole);
  const list = (q.data ?? []).filter((a) => seg === "all" || (seg === "pending" ? !a.acknowledged_at : a.severity === "critical"));
  const pending = (q.data ?? []).filter((a) => !a.acknowledged_at).length;

  const acknowledge = async (id: number) => {
    try { await ack.mutateAsync(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
    catch (e) { notify("No se pudo reconocer", errorMessage(e)); }
  };

  if (!allowed) {
    return (
      <Screen padded={false}>
        <Header title="Alertas" />
        <EmptyState icon="lock-closed-outline" title="Alertas solo para dirección" body="Las alertas de la plataforma las recibe el rol owner. Consulta pagos y liquidaciones en Finanzas." />
      </Screen>
    );
  }

  return (
    <Screen padded={false} refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <Header title="Alertas" subtitle={pending ? `${pending} requieren atención` : "Todo en orden"} />
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented value={seg} onChange={setSeg} items={[{ key: "pending", label: "Pendientes", count: pending }, { key: "critical", label: "Críticas" }, { key: "all", label: "Todas" }]} />
        <View style={{ height: 12 }} />
        {q.isLoading ? <><Skeleton height={110} style={{ marginBottom: 12 }} /><Skeleton height={110} /></> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : list.length === 0 ? (
          <EmptyState icon="shield-checkmark-outline" title={seg === "pending" ? "Sin alertas pendientes" : "Sin alertas"} body="Te avisaremos sobre pedidos con demora, comercios por revisar y cobros en revisión." />
        ) : list.map((a) => {
          const target = alertTarget(a);
          return (
            <AlertCard key={a.id} alert={a} onAcknowledge={() => acknowledge(a.id)} acknowledging={ack.isPending && ack.variables === a.id}
              onPress={target ? () => { void openAdmin(target.path); } : undefined} actionLabel={target?.label} />
          );
        })}
        <Text variant="heading" style={{ marginTop: 16 }}>Preferencias</Text>
        <SwitchRow label="Recibir alertas importantes" hint="Te avisaremos sobre pedidos, pagos y documentos que requieran tu atención." value={profile?.notifications_enabled ?? true} onValueChange={(v) => updateProfile({ notifications_enabled: v }).catch((e: unknown) => notify("No se pudo guardar", errorMessage(e)))} />
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
