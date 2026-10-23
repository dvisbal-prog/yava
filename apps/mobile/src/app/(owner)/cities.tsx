import React, { useState } from "react";
import { View } from "react-native";
import { colors, formatCOP, ORDER_TYPE_LABEL } from "@yava/shared";
import { Screen, Header, Text, Card, Skeleton, EmptyState } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { ErrorState, SectionTitle } from "@/components/merchant/Rows";
import { useAdminOverview } from "@/features/owner/useOwner";
import { rangeTitle, RANGE_LABEL } from "@/features/owner/types";
import type { RangeKey } from "@/features/owner/types";
import { errorMessage } from "@/lib/errors";

interface Row { name: string; orders: number; sales: number; revenue: number }

function Table({ rows, total }: { rows: Row[]; total: Row }) {
  const Cell = ({ children, flex = 1, right, strong, muted }: { children: string; flex?: number; right?: boolean; strong?: boolean; muted?: boolean }) => (
    <Text variant={strong ? "bodyStrong" : "caption"} tone={muted ? "muted" : "default"} style={{ flex, textAlign: right ? "right" : "left" }} numberOfLines={1}>{children}</Text>
  );
  return (
    <Card padded={false}>
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: colors.gray50, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Cell flex={1.4} muted>Nombre</Cell><Cell right muted>Pedidos</Cell><Cell flex={1.3} right muted>Ventas</Cell><Cell flex={1.3} right muted>Ingresos</Cell>
      </View>
      {rows.map((r) => (
        <View key={r.name} style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
          <Cell flex={1.4} strong>{r.name}</Cell><Cell right>{String(r.orders)}</Cell><Cell flex={1.3} right>{formatCOP(r.sales)}</Cell><Cell flex={1.3} right>{formatCOP(r.revenue)}</Cell>
        </View>
      ))}
      <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.gray200 }}>
        <Cell flex={1.4} strong>Total</Cell><Cell right strong>{String(total.orders)}</Cell><Cell flex={1.3} right strong>{formatCOP(total.sales)}</Cell><Cell flex={1.3} right strong>{formatCOP(total.revenue)}</Cell>
      </View>
    </Card>
  );
}

/** Pantalla 100 · Comparativo por ciudad y categoría. */
export default function OwnerCities() {
  const [range, setRange] = useState<RangeKey>("today");
  const q = useAdminOverview(range, null);
  const o = q.data;
  const sum = (rows: Row[]): Row => rows.reduce((a, r) => ({ name: "Total", orders: a.orders + r.orders, sales: a.sales + r.sales, revenue: a.revenue + r.revenue }), { name: "Total", orders: 0, sales: 0, revenue: 0 });
  const byCity: Row[] = (o?.by_city ?? []).map((c) => ({ name: c.city, orders: c.orders, sales: c.sales, revenue: c.revenue })).sort((a, b) => b.sales - a.sales);
  const byType: Row[] = (o?.by_type ?? []).map((t) => ({ name: ORDER_TYPE_LABEL[t.type] ?? t.type, orders: t.orders, sales: t.sales, revenue: t.revenue })).sort((a, b) => b.sales - a.sales);

  return (
    <Screen padded={false} refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <Header title="Reportes" subtitle={rangeTitle(range)} />
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented value={range} onChange={setRange} items={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ key: k, label: RANGE_LABEL[k] }))} />
        {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.isLoading ? <View style={{ marginTop: 14 }}><Skeleton height={160} style={{ marginBottom: 12 }} /><Skeleton height={160} /></View> : byCity.length === 0 && byType.length === 0 ? (
          <EmptyState icon="bar-chart-outline" title="Sin pedidos entregados" body="Cuando haya entregas en el periodo, verás el comparativo por ciudad y categoría." />
        ) : (
          <>
            <SectionTitle title="Por ciudad" />
            <Table rows={byCity} total={sum(byCity)} />
            <SectionTitle title="Por categoría" />
            <Table rows={byType} total={sum(byType)} />
            <Text variant="small" tone="subtle" style={{ marginTop: 12 }}>Ventas = productos vendidos por los comercios (no son ingresos de YAVA). Ingresos = comisiones + tarifas de servicio.</Text>
          </>
        )}
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
