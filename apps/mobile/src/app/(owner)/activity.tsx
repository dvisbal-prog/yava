import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatTime, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { Screen, Text, KPI, Card, Chip, Badge, Skeleton, EmptyState, StatusPill, ListRow } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { HourlyChart } from "@/components/owner/HourlyChart";
import { ErrorState, SectionTitle, StatusDot } from "@/components/merchant/Rows";
import { OverviewError } from "@/components/owner/OverviewError";
import { useAdminOverview, useActiveOrders, useRecentOrders, useOnlineCouriers, useOpenMerchants } from "@/features/owner/useOwner";
import { useCities } from "@/features/merchant/useMerchant";
import { VEHICLE_LABEL } from "@/features/courier/types";
import type { CourierRow } from "@/features/courier/types";
import { errorMessage } from "@/lib/errors";

type Seg = "orders" | "merchants" | "couriers";

/** Pantalla 102 · Operación en vivo. */
export default function OwnerActivity() {
  const [city, setCity] = useState<string | null>(null);
  const [seg, setSeg] = useState<Seg>("orders");
  const { data: cities } = useCities();
  const ov = useAdminOverview("today", city);
  const active = useActiveOrders(city);
  const recent = useRecentOrders(city, 30);
  const couriers = useOnlineCouriers(city);
  const merchants = useOpenMerchants(city);
  const o = ov.data;
  const openCount = (merchants.data ?? []).filter((m) => m.is_open).length;

  return (
    <Screen refreshing={active.isFetching && !active.isLoading} onRefresh={() => { ov.refetch(); active.refetch(); recent.refetch(); couriers.refetch(); merchants.refetch(); }}>
      <View style={{ paddingTop: 12, marginBottom: 10 }}>
        <Text variant="title">Actividad</Text>
        <Text variant="caption" tone="muted">Hoy · Actualizado {formatTime(new Date().toISOString())}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="Todas las ciudades" selected={!city} onPress={() => setCity(null)} />
        {(cities ?? []).map((c) => <Chip key={c.id} label={c.name} selected={city === c.id} onPress={() => setCity(c.id)} />)}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <KPI label="Pedidos activos" value={String(active.data?.length ?? o?.active ?? 0)} tone="primary" compact />
        <KPI label="Comercios abiertos" value={merchants.isLoading ? "…" : `${openCount}/${merchants.data?.length ?? 0}`} compact />
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <KPI label="Repartidores conectados" value={String(couriers.data?.length ?? o?.online_couriers ?? 0)} compact />
        <KPI label="Incidencias" value={String(o?.open_cases ?? 0)} tone={(o?.open_cases ?? 0) > 0 ? "danger" : "default"} compact />
      </View>

      <SectionTitle title="Pedidos por hora" />
      <Card>{ov.isLoading ? <Skeleton height={110} /> : ov.isError ? <OverviewError error={ov.error} onRetry={() => ov.refetch()} /> : <HourlyChart data={o?.hourly ?? []} />}</Card>

      <View style={{ marginTop: 18 }}>
        <Segmented value={seg} onChange={setSeg} items={[{ key: "orders", label: "Pedidos" }, { key: "merchants", label: "Comercios" }, { key: "couriers", label: "Repartidores" }]} />
      </View>
      <View style={{ marginTop: 12 }}>
        {seg === "orders" ? (
          active.isLoading ? <Skeleton height={200} /> : active.isError ? <ErrorState message={errorMessage(active.error)} onRetry={() => active.refetch()} /> : (
            <>
              {(active.data ?? []).length === 0 ? <EmptyState icon="receipt-outline" title="Sin pedidos activos" body="Los pedidos en curso aparecerán aquí en tiempo real." /> : (active.data ?? []).map((r) => (
                <Card key={r.id ?? ""} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">#{r.number} · {r.merchant_name ?? ORDER_TYPE_LABEL[r.type ?? "shipment"]}</Text>
                      <Text variant="caption" tone="muted">{formatTime(r.placed_at)} · {r.city_name ?? ""}{r.courier_name ? ` · ${r.courier_name}` : ""}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text variant="bodyStrong">{formatCOP(r.total)}</Text>
                      <StatusPill status={(r.status ?? "placed") as OrderStatus} />
                    </View>
                  </View>
                </Card>
              ))}
              <Text variant="heading" style={{ marginTop: 12, marginBottom: 6 }}>Últimos pedidos</Text>
              {(recent.data ?? []).filter((r) => r.status === "delivered" || r.status === "cancelled").slice(0, 10).map((r) => (
                <ListRow key={r.id ?? ""} title={`#${r.number} · ${r.merchant_name ?? "Envío"}`} subtitle={`${formatTime(r.delivered_at ?? r.cancelled_at ?? r.placed_at)} · ${ORDER_STATUS_LABEL[(r.status ?? "delivered") as OrderStatus]}`} right={<Text variant="bodyStrong">{formatCOP(r.total)}</Text>} chevron={false} />
              ))}
            </>
          )
        ) : seg === "merchants" ? (
          merchants.isLoading ? <Skeleton height={200} /> : merchants.isError ? <ErrorState message={errorMessage(merchants.error)} onRetry={() => merchants.refetch()} /> : (merchants.data ?? []).length === 0 ? <EmptyState icon="storefront-outline" title="Sin comercios activos" /> : (
            [...(merchants.data ?? [])].sort((a, b) => Number(b.is_open) - Number(a.is_open)).map((m) => (
              <ListRow key={m.id} icon="storefront-outline" title={m.name} subtitle={ORDER_TYPE_LABEL[m.category as keyof typeof ORDER_TYPE_LABEL] ?? m.category} right={<StatusDot label={m.is_open ? "Abierto" : m.manual_closed ? "Cerrado manual" : "Cerrado"} active={m.is_open} />} chevron={false} />
            ))
          )
        ) : (
          couriers.isLoading ? <Skeleton height={200} /> : couriers.isError ? <ErrorState message={errorMessage(couriers.error)} onRetry={() => couriers.refetch()} /> : (couriers.data ?? []).length === 0 ? <EmptyState icon="bicycle-outline" title="Sin repartidores conectados" body="Los repartidores en línea aparecerán aquí." /> : (
            (couriers.data ?? []).map((c) => (
              <ListRow key={c.user_id} icon="bicycle-outline" title={c.name ?? "Repartidor"} subtitle={`${VEHICLE_LABEL[c.vehicle as CourierRow["vehicle"]] ?? c.vehicle} · visto ${c.last_seen_at ? formatTime(c.last_seen_at) : "—"}`}
                right={<Badge label={c.current_lat != null ? "Con ubicación" : "Sin ubicación"} tone={c.current_lat != null ? "green" : "gray"} />} chevron={false} />
            ))
          )
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        <Ionicons name="information-circle-outline" size={16} color={colors.gray400} style={{ marginRight: 6 }} />
        <Text variant="small" tone="subtle" style={{ flex: 1 }}>Datos en vivo vía Realtime y actualización automática cada 15–60 s.</Text>
      </View>
    </Screen>
  );
}
