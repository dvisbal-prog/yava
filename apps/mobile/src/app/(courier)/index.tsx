import React, { useCallback, useState } from "react";
import { View, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, ORDER_STATUS_LABEL } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { Screen, Text, KPI, Card, Button, Skeleton, EmptyState } from "@/components/ui";
import { MapCard } from "@/components/courier/MapCard";
import { DeliveryCard } from "@/components/courier/DeliveryCard";
import { ErrorState, SectionTitle, StatusDot } from "@/components/merchant/Rows";
import { useMyCourier, useCourierDashboard, useAvailableOrders, useSetOnline, useLocationTracking, useCourierOrder } from "@/features/courier/useCourier";
import type { Coords } from "@/features/courier/useCourier";
import { parseAddress, addressLine } from "@/features/merchant/types";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 60 · Inicio del repartidor. */
export default function CourierHome() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const courierQ = useMyCourier();
  const courier = courierQ.data;
  const dashQ = useCourierDashboard();
  const setOnline = useSetOnline();
  const online = !!courier?.is_online;
  const [coords, setCoords] = useState<Coords | null>(courier?.current_lat != null && courier.current_lng != null ? { lat: courier.current_lat, lng: courier.current_lng } : null);
  const activeId = dashQ.data?.active_order ?? null;
  const activeQ = useCourierOrder(activeId ?? undefined);
  const availableQ = useAvailableOrders(coords?.lat ?? null, coords?.lng ?? null, online);

  const onDenied = useCallback(() => {
    Alert.alert("Necesitamos tu ubicación", "Para recibir entregas cercanas activa el permiso de ubicación. Te pondremos como no disponible.", [{ text: "Entendido" }]);
    setOnline.mutate(false);
  }, [setOnline]);
  useLocationTracking(online, activeId, setCoords, onDenied);

  const toggle = async (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try { await setOnline.mutateAsync(v); } catch (e) { Alert.alert("No se pudo cambiar", errorMessage(e)); }
  };

  const active = activeQ.data;
  const activeStatus = (active?.status ?? "assigned") as OrderStatus;
  const goActive = () => {
    if (!active?.id) return;
    router.push(activeStatus === "on_the_way" ? `/(courier)/deliveries/${active.id}/deliver` : `/(courier)/deliveries/${active.id}/pickup`);
  };

  return (
    <Screen refreshing={dashQ.isFetching && !dashQ.isLoading} onRefresh={() => { dashQ.refetch(); availableQ.refetch(); courierQ.refetch(); }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Hola, {profile?.full_name?.split(" ")[0] ?? "repartidor"}</Text>
          <StatusDot label={online ? "Disponible" : "No disponible"} active={online} />
        </View>
        <Switch value={online} onValueChange={toggle} disabled={!courier || setOnline.isPending} trackColor={{ true: colors.green, false: colors.gray300 }} thumbColor={colors.white} />
      </View>

      {dashQ.isError ? <ErrorState message={errorMessage(dashQ.error)} onRetry={() => dashQ.refetch()} /> : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {dashQ.isLoading ? <><Skeleton height={76} style={{ flex: 1 }} /><Skeleton height={76} style={{ flex: 1 }} /></> : (
            <>
              <KPI label="Ganancias hoy" value={formatCOP(dashQ.data?.today_earnings ?? 0)} tone="primary" compact />
              <KPI label="Entregas hoy" value={String(dashQ.data?.today_deliveries ?? 0)} compact hint={`Saldo ${formatCOP(dashQ.data?.balance ?? 0)}`} />
            </>
          )}
        </View>
      )}

      {active ? (
        <Card style={{ marginTop: 14, backgroundColor: colors.blueSoft, borderColor: colors.blue }} onPress={goActive}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="navigate-circle" size={28} color={colors.blue} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Entrega en curso · #{active.number}</Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>{ORDER_STATUS_LABEL[activeStatus]} · {active.merchant_name ?? "Envío"} → {addressLine(parseAddress(active.address_snapshot))}</Text>
            </View>
            <Text variant="heading" tone="primary">{formatCOP(active.courier_payout)}</Text>
          </View>
          <Button title={activeStatus === "on_the_way" ? "Confirmar entrega" : "Ir a la recogida"} size="md" onPress={goActive} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <View style={{ marginTop: 14 }}>
        <MapCard height={180} pins={[
          ...(coords ? [{ lat: coords.lat, lng: coords.lng, kind: "me" as const, title: "Tú" }] : []),
          ...(availableQ.data ?? []).filter((o) => o.merchant_lat != null && o.merchant_lng != null).slice(0, 10).map((o) => ({ lat: o.merchant_lat as number, lng: o.merchant_lng as number, kind: "merchant" as const, title: o.merchant_name ?? "Comercio" })),
        ]} />
        {!online ? <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>Conéctate para compartir tu ubicación y ver entregas cercanas.</Text> : null}
      </View>

      <SectionTitle title="Entregas disponibles" actionTitle={availableQ.data?.length ? `${availableQ.data.length} cerca` : undefined} />
      {!online ? (
        <EmptyState icon="power-outline" title="Estás desconectado" body="Activa Disponible para empezar a recibir entregas." actionTitle="Conectarme" onAction={() => toggle(true)} />
      ) : availableQ.isLoading ? <><Skeleton height={100} style={{ marginBottom: 12 }} /><Skeleton height={100} /></> : availableQ.isError ? <ErrorState message={errorMessage(availableQ.error)} onRetry={() => availableQ.refetch()} /> : (availableQ.data ?? []).length === 0 ? (
        <EmptyState icon="time-outline" title="Sin entregas por ahora" body="Te avisaremos cuando haya una entrega cerca de ti. Actualizamos cada 10 segundos." />
      ) : (availableQ.data ?? []).map((o) => <DeliveryCard key={o.id} order={o} onPress={() => router.push(`/(courier)/offer/${o.id}`)} />)}
    </Screen>
  );
}
