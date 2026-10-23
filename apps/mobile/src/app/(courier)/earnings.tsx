import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { colors, formatCOP, formatDate, formatTime } from "@yava/shared";
import { Screen, Text, KPI, Card, Button, Skeleton, EmptyState, ListRow } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { ErrorState, SectionTitle } from "@/components/merchant/Rows";
import { useCourierDashboard, useCourierHistory } from "@/features/courier/useCourier";
import { errorMessage } from "@/lib/errors";

type Range = "today" | "week" | "month";

/** Pantalla 64 · Ganancias. */
export default function CourierEarnings() {
  const router = useRouter();
  const dashQ = useCourierDashboard();
  const histQ = useCourierHistory(200);
  const [range, setRange] = useState<Range>("today");

  const { earnings, deliveries, list } = useMemo(() => {
    const all = (histQ.data ?? []).filter((o) => o.status === "delivered");
    const from = new Date(); from.setHours(0, 0, 0, 0);
    if (range === "week") from.setDate(from.getDate() - 6);
    if (range === "month") from.setDate(from.getDate() - 29);
    const inRange = all.filter((o) => o.delivered_at && new Date(o.delivered_at) >= from);
    return { earnings: inRange.reduce((a, o) => a + (o.courier_payout ?? 0), 0), deliveries: inRange.length, list: inRange };
  }, [histQ.data, range]);

  const d = dashQ.data;
  const kpiEarn = range === "today" ? d?.today_earnings ?? earnings : range === "week" ? d?.week_earnings ?? earnings : earnings;
  const kpiCount = range === "today" ? d?.today_deliveries ?? deliveries : range === "week" ? d?.week_deliveries ?? deliveries : deliveries;

  return (
    <Screen refreshing={histQ.isFetching && !histQ.isLoading} onRefresh={() => { dashQ.refetch(); histQ.refetch(); }}>
      <Text variant="title" style={{ paddingTop: 12, marginBottom: 12 }}>Ganancias</Text>
      <Segmented value={range} onChange={setRange} items={[{ key: "today", label: "Hoy" }, { key: "week", label: "Semana" }, { key: "month", label: "Mes" }]} />
      {dashQ.isError ? <ErrorState message={errorMessage(dashQ.error)} onRetry={() => dashQ.refetch()} /> : (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          {dashQ.isLoading && histQ.isLoading ? <><Skeleton height={76} style={{ flex: 1 }} /><Skeleton height={76} style={{ flex: 1 }} /></> : (
            <>
              <KPI label="Ganancias" value={formatCOP(kpiEarn)} tone="primary" compact />
              <KPI label="Entregas" value={String(kpiCount)} compact hint={kpiCount ? `${formatCOP(Math.round(kpiEarn / kpiCount))} por entrega` : undefined} />
            </>
          )}
        </View>
      )}
      <Card style={{ marginTop: 14, backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="muted">Saldo disponible</Text>
            {dashQ.isLoading ? <Skeleton width={140} height={30} /> : <Text variant="display" tone="primary">{formatCOP(d?.balance ?? 0)}</Text>}
          </View>
          <Button title="Retirar saldo" size="md" full={false} onPress={() => router.push("/(courier)/withdraw")} disabled={!d?.balance} />
        </View>
        <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>Calificación {Number(d?.rating ?? 0).toFixed(1).replace(".", ",")} · {d?.total_deliveries ?? 0} entregas en total</Text>
      </Card>

      <SectionTitle title="Entregas del periodo" actionTitle="Ver historial" onAction={() => router.push("/(courier)/history")} />
      {histQ.isLoading ? <><Skeleton height={56} style={{ marginBottom: 8 }} /><Skeleton height={56} style={{ marginBottom: 8 }} /></> : histQ.isError ? <ErrorState message={errorMessage(histQ.error)} onRetry={() => histQ.refetch()} /> : list.length === 0 ? (
        <EmptyState icon="bicycle-outline" title="Sin entregas en este periodo" body="Conéctate desde Inicio para recibir entregas." />
      ) : list.slice(0, 20).map((o) => (
        <ListRow key={o.id ?? ""} icon="checkmark-circle-outline" title={`#${o.number} · ${o.merchant_name ?? "Envío"}`} subtitle={`${formatDate(o.delivered_at)} · ${formatTime(o.delivered_at)}${o.payment_method === "cash" ? " · efectivo" : ""}`}
          right={<Text variant="bodyStrong" tone="success">+{formatCOP(o.courier_payout)}</Text>} chevron={false} />
      ))}
    </Screen>
  );
}
