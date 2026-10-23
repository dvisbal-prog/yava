import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ORDER_TYPE_LABEL, formatCOP, type OrderType } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { fetchOverview, parseRange, rangeBounds } from "@/lib/overview";
import { fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { canAccess } from "@/lib/roles";
import { buildQuery, firstParam, type SearchParams } from "@/lib/utils";
import { Card, CardHeader, Note } from "@/components/ui/card";
import { KPI } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, DemoNote } from "@/components/ui/page-header";
import { RangeChips } from "@/components/range-chips";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [ctx, sp, city] = await Promise.all([requireSection("reportes"), searchParams, getSelectedCity()]);
  const range = parseRange(firstParam(sp.range));
  const { from, to, fromDay, toDay } = rangeBounds(range);
  const supabase = await createClient();
  const showRevenue = canAccess(ctx.role, "finanzas");

  let ordersQ = supabase.from("orders").select("merchant_id,status,items_subtotal,commission_amount,service_fee,placed_at,delivered_at,city_id").gte("placed_at", from).lte("placed_at", to).limit(20000);
  if (city) ordersQ = ordersQ.eq("city_id", city);

  const [overview, { data: citySummary }, { data: orders }, { data: merchants }] = await Promise.all([
    fetchOverview(supabase, from, to, city),
    supabase.from("city_summary").select("*").order("city_name"),
    ordersQ,
    supabase.from("merchants").select("id,name,category,city:cities(name)"),
  ]);

  const rows = orders ?? [];
  const delivered = rows.filter((o) => o.status === "delivered");
  const cancelled = rows.filter((o) => o.status === "cancelled");
  const finished = delivered.length + cancelled.length;
  const cancelRate = finished ? cancelled.length / finished : 0;
  const deliveryMinutes = delivered
    .map((o) => (o.delivered_at ? (new Date(o.delivered_at).getTime() - new Date(o.placed_at).getTime()) / 60000 : null))
    .filter((m): m is number => m !== null && m > 0 && m < 24 * 60);
  const avgDelivery = deliveryMinutes.length ? Math.round(deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length) : null;

  const byMerchant = new Map<string, { orders: number; sales: number; revenue: number }>();
  for (const o of delivered) {
    if (!o.merchant_id) continue;
    const cur = byMerchant.get(o.merchant_id) ?? { orders: 0, sales: 0, revenue: 0 };
    cur.orders += 1;
    cur.sales += o.items_subtotal;
    cur.revenue += o.commission_amount + o.service_fee;
    byMerchant.set(o.merchant_id, cur);
  }
  const merchantMap = new Map((merchants ?? []).map((m) => [m.id, m]));
  const top = [...byMerchant.entries()]
    .map(([id, v]) => ({ id, name: merchantMap.get(id)?.name ?? "—", category: merchantMap.get(id)?.category, city: merchantMap.get(id)?.city?.name ?? "—", ...v }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  const totalSales = overview.by_city.reduce((a, c) => a + c.sales, 0);
  const totalRevenue = overview.by_city.reduce((a, c) => a + c.revenue, 0);
  const totalOrders = overview.by_city.reduce((a, c) => a + c.orders, 0);
  const typeTotal = overview.by_type.reduce((a, t) => a + t.revenue, 0);
  const csvHref = `/reportes/csv${buildQuery(sp, { from: fromDay, to: toDay, city: city ?? null, range: null })}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reportes"
        description={`Análisis de la operación de YAVA · ${fmtDate(from)} – ${fmtDate(to)}`}
        actions={
          <>
            <RangeChips active={range} searchParams={sp} basePath="/reportes" />
            <ButtonLink href={csvHref} variant="outline" size="md" prefetch={false}>
              <Download className="h-4 w-4" aria-hidden /> Descargar CSV
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <KPI label="Pedidos entregados" value={fmtNumber(overview.delivered)} tone="green" />
        <KPI label="Ticket promedio por pedido" value={formatCOP(overview.avg_ticket, true)} hint="Productos, sin envío ni tarifas" />
        <KPI label="Tasa de cancelación" value={fmtPercent(cancelRate, 1)} hint={`${fmtNumber(cancelled.length)} de ${fmtNumber(finished)} pedidos terminados`} tone={cancelRate > 0.1 ? "red" : "neutral"} />
        <KPI label="Tiempo medio de entrega" value={avgDelivery !== null ? `${avgDelivery} min` : "—"} hint="Desde el pedido hasta la entrega" tone="blue" />
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader title="Desempeño por ciudad" description="Pedidos entregados en el período." />
          <DataTable
            dense
            rows={[...overview.by_city, { city: "Total", city_id: "__total", orders: totalOrders, sales: totalSales, revenue: totalRevenue }]}
            rowKey={(r) => r.city_id}
            emptyTitle="Sin datos"
            columns={[
              { key: "c", header: "Ciudad", cell: (r) => <span className={r.city_id === "__total" ? "font-semibold" : "font-medium"}>{r.city}</span> },
              { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders) },
              { key: "s", header: "Ventas de comercios", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.sales, true)}</span> },
              ...(showRevenue ? [{ key: "r", header: "Ingresos YAVA", align: "right" as const, cell: (r: { revenue: number }) => <span className="tabular-nums font-medium">{formatCOP(r.revenue, true)}</span> }] : []),
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Desempeño por categoría" />
          <DataTable
            dense
            rows={overview.by_type}
            rowKey={(r) => r.type}
            emptyTitle="Sin datos"
            columns={[
              { key: "c", header: "Categoría", cell: (r) => <Badge tone="neutral">{ORDER_TYPE_LABEL[r.type as OrderType] ?? r.type}</Badge> },
              { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders) },
              { key: "s", header: "Ventas de comercios", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.sales, true)}</span> },
              ...(showRevenue
                ? [
                    { key: "r", header: "Ingresos YAVA", align: "right" as const, cell: (r: { revenue: number }) => <span className="tabular-nums font-medium">{formatCOP(r.revenue, true)}</span> },
                    { key: "pct", header: "%", align: "right" as const, cell: (r: { revenue: number }) => <span className="text-muted">{typeTotal ? fmtPercent(r.revenue / typeTotal) : "—"}</span> },
                  ]
                : []),
            ]}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Estado de las ciudades hoy" description="Vista `city_summary`: actividad del día en curso." />
        <DataTable
          dense
          rows={(citySummary ?? []).filter((c) => !city || c.city_id === city)}
          rowKey={(r) => r.city_id ?? ""}
          emptyTitle="Sin ciudades"
          columns={[
            { key: "c", header: "Ciudad", cell: (r) => <span className="font-medium">{r.city_name}</span> },
            { key: "d", header: "Entregados hoy", align: "right", cell: (r) => fmtNumber(r.delivered_orders) },
            { key: "a", header: "Activos", align: "right", cell: (r) => fmtNumber(r.active_orders) },
            { key: "m", header: "Comercios activos", align: "right", cell: (r) => fmtNumber(r.active_merchants) },
            { key: "r", header: "Repartidores en línea", align: "right", cell: (r) => fmtNumber(r.online_couriers) },
            { key: "s", header: "Ventas hoy", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.merchant_sales, true)}</span> },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Top comercios" description="Por ventas de productos en el período." />
        <DataTable
          dense
          rows={top}
          rowKey={(r) => r.id}
          rowHref={canAccess(ctx.role, "comercios") ? (r) => `/comercios/${r.id}` : undefined}
          emptyTitle="Sin ventas en el período"
          columns={[
            { key: "n", header: "Comercio", cell: (r) => <span className="font-medium">{r.name}</span> },
            { key: "cat", header: "Categoría", cell: (r) => <span className="text-muted">{r.category ? ORDER_TYPE_LABEL[r.category] : "—"}</span> },
            { key: "city", header: "Ciudad", cell: (r) => <span className="text-muted">{r.city}</span> },
            { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders) },
            { key: "s", header: "Ventas", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.sales, true)}</span> },
            ...(showRevenue ? [{ key: "r", header: "Ingresos YAVA", align: "right" as const, cell: (r: { revenue: number }) => <span className="tabular-nums">{formatCOP(r.revenue, true)}</span> }] : []),
          ]}
        />
      </Card>
      <Note>Las ventas de comercios se cobran por cuenta de terceros y no son ingresos de YAVA.</Note>
      <DemoNote />
    </div>
  );
}
