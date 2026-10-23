import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatTime } from "@yava/shared";
import { Screen, Text, KPI, Card, Chip, Badge, Skeleton, ListRow } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { HourlyChart } from "@/components/owner/HourlyChart";
import { ErrorState, SectionTitle } from "@/components/merchant/Rows";
import { useAdminOverview, useOwnerAlerts } from "@/features/owner/useOwner";
import { useCities } from "@/features/merchant/useMerchant";
import { estimatedResult, rangeTitle, RANGE_LABEL } from "@/features/owner/types";
import type { RangeKey } from "@/features/owner/types";
import { errorMessage } from "@/lib/errors";

/** Pantalla 98 · Resumen de dirección. */
export default function OwnerHome() {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>("today");
  const [city, setCity] = useState<string | null>(null);
  const { data: cities } = useCities();
  const q = useAdminOverview(range, city);
  const alertsQ = useOwnerAlerts(true);
  const o = q.data;
  const pendingAlerts = alertsQ.data?.length ?? 0;

  return (
    <Screen refreshing={q.isFetching && !q.isLoading} onRefresh={() => { q.refetch(); alertsQ.refetch(); }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="small" tone="primary" style={{ letterSpacing: 1 }}>YAVA OWNERS</Text>
          <Text variant="title">Resumen</Text>
          <Text variant="caption" tone="muted">{rangeTitle(range)} · Actualizado {formatTime(new Date().toISOString())}</Text>
        </View>
        <Pressable onPress={() => router.push("/(owner)/alerts")} hitSlop={8} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="notifications-outline" size={26} color={colors.carbon} />
          {pendingAlerts ? <View style={{ position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text variant="small" tone="inverse">{pendingAlerts}</Text></View> : null}
        </Pressable>
      </View>
      <Segmented value={range} onChange={setRange} items={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ key: k, label: RANGE_LABEL[k] }))} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <Chip label="Todas las ciudades" selected={!city} onPress={() => setCity(null)} />
        {(cities ?? []).map((c) => <Chip key={c.id} label={c.name} selected={city === c.id} onPress={() => setCity(c.id)} />)}
      </ScrollView>

      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.isLoading || !o ? (
        <View style={{ marginTop: 14 }}><Skeleton height={90} style={{ marginBottom: 8 }} /><Skeleton height={90} style={{ marginBottom: 8 }} /><Skeleton height={160} /></View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <KPI label="Ingresos YAVA" value={formatCOP(o.yava_revenue)} hint="Antes de impuestos" tone="primary" compact />
            <KPI label="Resultado estimado" value={formatCOP(estimatedResult(o))} hint="Antes de impuestos" tone={estimatedResult(o) >= 0 ? "success" : "danger"} compact />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <KPI label="Pedidos entregados" value={String(o.delivered)} compact hint={o.cancelled ? `${o.cancelled} cancelados` : undefined} />
            <KPI label="Pedidos activos" value={String(o.active)} compact hint={`${o.online_couriers} repartidores en línea`} />
          </View>

          <SectionTitle title={range === "today" ? "Pedidos por hora" : "Pedidos por hora del día"} actionTitle="Ver más" onAction={() => router.push("/(owner)/activity")} />
          <Card><HourlyChart data={o.hourly} /></Card>

          <Card style={{ marginTop: 12, backgroundColor: colors.gray50 }} onPress={() => router.push("/(owner)/finance")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">Ventas de comercios</Text>
                <Text variant="heading">{formatCOP(o.merchant_sales)} <Text variant="caption" tone="muted">· {o.delivered} pedidos</Text></Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
            </View>
            <Text variant="small" tone="subtle" style={{ marginTop: 4 }}>Las ventas de comercios no son ingresos de YAVA.</Text>
          </Card>

          {pendingAlerts || o.open_cases ? (
            <Card style={{ marginTop: 12, borderColor: colors.redSoft, backgroundColor: colors.redSoft }} onPress={() => router.push("/(owner)/alerts")}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="warning-outline" size={20} color={colors.red} style={{ marginRight: 10 }} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>{pendingAlerts ? `${pendingAlerts} ${pendingAlerts === 1 ? "alerta requiere" : "alertas requieren"} atención` : `${o.open_cases} incidencias abiertas`}</Text>
                {o.open_cases ? <Badge label={`${o.open_cases} casos`} tone="red" /> : null}
              </View>
            </Card>
          ) : null}

          <SectionTitle title="Liquidaciones pendientes" actionTitle="Ver más" onAction={() => router.push("/(owner)/payouts")} />
          <Card padded={false}>
            <View style={{ paddingHorizontal: 12 }}>
              <ListRow icon="storefront-outline" title="Comercios" subtitle={`${formatCOP(o.pending_merchant_settlements)} por pagar`} right={<Text variant="bodyStrong">{formatCOP(o.pending_merchant_settlements)}</Text>} onPress={() => router.push("/(owner)/payouts")} />
              <ListRow icon="bicycle-outline" title="Repartidores" subtitle={`${formatCOP(o.pending_courier_settlements)} por pagar`} right={<Text variant="bodyStrong">{formatCOP(o.pending_courier_settlements)}</Text>} onPress={() => router.push("/(owner)/payouts")} />
            </View>
          </Card>

          <SectionTitle title="Accesos" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
            {[
              { title: "Ingresos", icon: "cash-outline" as const, to: "/(owner)/finance" },
              { title: "Ciudades", icon: "map-outline" as const, to: "/(owner)/cities" },
              { title: "Pagos pendientes", icon: "wallet-outline" as const, to: "/(owner)/payouts" },
              { title: "Operación en vivo", icon: "pulse-outline" as const, to: "/(owner)/activity" },
            ].map((a) => (
              <Pressable key={a.title} onPress={() => router.push(a.to)} style={{ width: "50%", padding: 4 }}>
                <Card>
                  <Ionicons name={a.icon} size={22} color={colors.blue} />
                  <Text variant="bodyStrong" style={{ marginTop: 8 }}>{a.title}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
            <KPI label="Comercios por revisar" value={String(o.merchants_to_review)} compact />
            <KPI label="Repartidores por revisar" value={String(o.couriers_to_review)} compact />
          </View>
        </>
      )}
    </Screen>
  );
}
