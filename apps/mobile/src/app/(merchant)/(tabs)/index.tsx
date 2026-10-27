import React, { useMemo, useState } from "react";
import { View, Switch } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Text, KPI, Card, Button, Skeleton, EmptyState } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { BarChart } from "@/components/merchant/BarChart";
import { OrderCard } from "@/components/merchant/OrderCard";
import { ErrorState, SectionTitle, StatusDot } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantDashboard, useMerchantOrders, useToggleMerchantClosed } from "@/features/merchant/useMerchant";
import { startOfToday, startOfDaysAgo, WEEKDAY_SHORT } from "@/features/merchant/types";
import { notify } from "@/lib/dialog";
import { errorMessage, isUnauthorized } from "@/lib/errors";

type Range = "today" | "week";

/** Pantalla 50 · Panel del comercio. */
export default function MerchantHome() {
  const router = useRouter();
  const merchantQ = useMyMerchant();
  const merchant = merchantQ.data;
  const [range, setRange] = useState<Range>("today");
  const from = range === "today" ? startOfToday() : startOfDaysAgo(6);
  const dashQ = useMerchantDashboard(merchant?.id, from);
  const pendingQ = useMerchantOrders(merchant?.id, ["placed", "accepted"]);
  const toggle = useToggleMerchantClosed();

  const isOpen = !!merchant && !merchant.manual_closed && merchant.accepts_orders;
  const onToggle = async (value: boolean) => {
    if (!merchant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try { await toggle.mutateAsync({ merchantId: merchant.id, closed: !value }); }
    catch (e) { notify("No se pudo cambiar el estado", errorMessage(e)); }
  };

  const bars = useMemo(() => {
    const week = dashQ.data?.week ?? [];
    const days: { label: string; value: number; highlight?: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = week.find((w) => w.day === key);
      days.push({ label: WEEKDAY_SHORT[d.getDay()], value: found?.sales ?? 0, highlight: i === 0 });
    }
    return days;
  }, [dashQ.data]);

  const refresh = () => { merchantQ.refetch(); dashQ.refetch(); pendingQ.refetch(); };

  return (
    <Screen refreshing={dashQ.isFetching && !dashQ.isLoading} onRefresh={refresh}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          {merchant ? <Text variant="title">{merchant.name}</Text> : <Skeleton width={160} height={26} />}
          {merchant ? <Text variant="caption" tone="muted">{merchant.tagline ?? ""}{merchant.tagline ? " · " : ""}{merchant.address?.split(",").pop()?.trim() ?? ""}</Text> : null}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <StatusDot label={isOpen ? "Abierto" : "Cerrado"} active={isOpen} />
          <Switch value={isOpen} onValueChange={onToggle} disabled={!merchant || toggle.isPending} trackColor={{ true: colors.green, false: colors.gray300 }} thumbColor={colors.white} style={{ marginTop: 4 }} />
        </View>
      </View>
      {merchant && merchant.status === "paused" ? <Card style={{ marginBottom: 12, backgroundColor: colors.yellowSoft, borderColor: colors.yellow }}><Text variant="caption">Tu comercio está pausado por YAVA. Contacta a soporte para reactivarlo.</Text></Card> : null}

      <Segmented items={[{ key: "today", label: "Hoy" }, { key: "week", label: "Semana" }]} value={range} onChange={setRange} />

      {dashQ.isError ? (
        isUnauthorized(dashQ.error)
          ? <ErrorState message="No tienes permiso para ver las ventas de este comercio. Pídele acceso al administrador o escríbenos a soporte." />
          : <ErrorState message={errorMessage(dashQ.error)} onRetry={() => dashQ.refetch()} />
      ) : (
        <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
          {dashQ.isLoading ? <><Skeleton height={76} style={{ flex: 1 }} /><Skeleton height={76} style={{ flex: 1 }} /><Skeleton height={76} style={{ flex: 1 }} /></> : (
            <>
              <KPI label="Ventas" value={formatCOP(dashQ.data?.sales ?? 0)} tone="primary" compact />
              <KPI label="Pedidos" value={String(dashQ.data?.orders ?? 0)} compact />
              <KPI label="Por preparar" value={String(dashQ.data?.to_prepare ?? 0)} tone={(dashQ.data?.to_prepare ?? 0) > 0 ? "danger" : "default"} compact />
            </>
          )}
        </View>
      )}
      {dashQ.data ? <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>Recibes {formatCOP(dashQ.data.payout)} por los pedidos entregados en este periodo.</Text> : null}

      <SectionTitle title="Ventas esta semana" actionTitle="Ver liquidaciones" onAction={() => router.push("/(merchant)/settlements")} />
      {dashQ.isError ? null : <Card>{dashQ.isLoading ? <Skeleton height={140} /> : <BarChart bars={bars} formatValue={(v) => formatCOP(v)} />}</Card>}

      <SectionTitle title="Pedidos por atender" actionTitle="Ver pedidos" onAction={() => router.navigate("/(merchant)/orders")} />
      {pendingQ.isLoading ? <Skeleton height={120} style={{ marginBottom: 12 }} /> : pendingQ.isError ? <ErrorState message={errorMessage(pendingQ.error)} onRetry={() => pendingQ.refetch()} /> : (pendingQ.data ?? []).length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="Todo al día" body="No tienes pedidos pendientes por aceptar." />
      ) : (
        <>
          {(pendingQ.data ?? []).slice(0, 3).map((o) => <OrderCard key={o.id ?? ""} order={o} compact onPress={() => router.push(`/(merchant)/order/${o.id}`)} />)}
          {(pendingQ.data ?? []).length > 3 ? <Button title={`Ver los ${(pendingQ.data ?? []).length} pedidos`} variant="secondary" onPress={() => router.navigate("/(merchant)/orders")} /> : null}
        </>
      )}
      {(dashQ.data?.preparing ?? 0) > 0 ? <Button title={`Vista cocina · ${dashQ.data?.preparing} en preparación`} variant="outline" icon="flame-outline" onPress={() => router.push("/(merchant)/prepare")} style={{ marginTop: 12 }} /> : null}
    </Screen>
  );
}
