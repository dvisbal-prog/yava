import type { Metadata } from "next";
import { ORDER_TYPE_LABEL, formatCOP, type OrderType } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { fetchOverview, parseRange, rangeBounds } from "@/lib/overview";
import { fmtDate, fmtDayLabel, fmtNumber, todayISO } from "@/lib/format";
import { firstParam, type SearchParams } from "@/lib/utils";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { KPI, StatInline } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader, DemoNote } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DailyChart } from "@/components/charts/daily-chart";
import { WaterfallChart } from "@/components/charts/waterfall-chart";
import { RangeChips } from "@/components/range-chips";
import { FinanceTabs } from "../finance-tabs";
import { DeleteExpenseButton, EXPENSE_CATEGORY_LABEL, NewExpenseDialog } from "./expense-dialogs";

export const metadata: Metadata = { title: "Ingresos" };

export default async function RevenuePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp, city] = await Promise.all([requireSection("finanzas"), searchParams, getSelectedCity()]);
  const range = parseRange(firstParam(sp.range));
  const { from, to, fromDay, toDay } = rangeBounds(range);
  const supabase = await createClient();

  let daily = supabase.from("daily_finance").select("*").gte("day", fromDay).lte("day", toDay).order("day");
  if (city) daily = daily.eq("city_id", city);
  let expensesQ = supabase.from("operating_expenses").select("id,date,category,description,amount,city:cities(name)").gte("date", fromDay).lte("date", toDay).order("date", { ascending: false });
  if (city) expensesQ = expensesQ.eq("city_id", city);

  const [overview, { data: dailyRows }, { data: expenses }, { data: cities }] = await Promise.all([
    fetchOverview(supabase, from, to, city),
    daily,
    expensesQ,
    supabase.from("cities").select("id,name").order("name"),
  ]);

  // Descuentos financiados por YAVA: la vista daily_finance ya resta los descuentos con cupón;
  // en el P&L usamos la cifra agregada de descuentos del período (cupones de YAVA).
  const grossRevenue = overview.yava_revenue;
  const fundedDiscounts = overview.discounts;
  const gateway = overview.gateway_fees;
  const contribution = grossRevenue - fundedDiscounts - gateway;
  const opex = (expenses ?? []).reduce((a, e) => a + e.amount, 0);
  const result = contribution - opex;

  const byDay = new Map<string, { ingresos: number; contribucion: number; ventas: number }>();
  for (const r of dailyRows ?? []) {
    if (!r.day) continue;
    const cur = byDay.get(r.day) ?? { ingresos: 0, contribucion: 0, ventas: 0 };
    cur.ingresos += r.yava_gross_revenue ?? 0;
    cur.contribucion += r.yava_contribution ?? 0;
    cur.ventas += r.merchant_sales ?? 0;
    byDay.set(r.day, cur);
  }
  const chart = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day: fmtDayLabel(day), ...v }));

  const byType = new Map<string, { orders: number; sales: number; revenue: number }>();
  for (const r of dailyRows ?? []) {
    const k = r.type ?? "food";
    const cur = byType.get(k) ?? { orders: 0, sales: 0, revenue: 0 };
    cur.orders += r.delivered_orders ?? 0;
    cur.sales += r.merchant_sales ?? 0;
    cur.revenue += r.yava_gross_revenue ?? 0;
    byType.set(k, cur);
  }

  const periodLabel = fromDay === toDay ? `del ${fmtDate(from)}` : `del ${fmtDate(from)} al ${fmtDate(to)}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Finanzas" description="Ingresos, costos y resultado operativo de la plataforma" actions={<RangeChips active={range} searchParams={sp} basePath="/finanzas/ingresos" />} />
      <FinanceTabs active="ingresos" />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Ventas de comercios" value={formatCOP(overview.merchant_sales, true)} hint={`${fmtNumber(overview.delivered)} pedidos entregados · no son ingresos de YAVA`} />
        <KPI label="Ingresos YAVA" value={formatCOP(grossRevenue, true)} hint="Comisiones + tarifas de servicio" tone="blue" />
        <KPI label="Resultado operativo estimado" value={formatCOP(result, true)} hint="Antes de impuestos" tone={result >= 0 ? "green" : "red"} />
        <KPI label="Liquidaciones pendientes" value={formatCOP(overview.pending_settlements, true)} hint={`Comercios ${formatCOP(overview.pending_merchant_settlements)} · Repartidores ${formatCOP(overview.pending_courier_settlements)}`} tone="yellow" />
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader title="De dónde vienen los ingresos" description={`Composición de los ingresos de YAVA ${periodLabel}.`} />
          <CardBody>
            <StatInline label="Ventas de productos de los comercios" value={formatCOP(overview.merchant_sales, true)} muted />
            <p className="text-[11px] text-muted -mt-1 mb-2">Se cobran por cuenta de terceros; no son ingresos de YAVA.</p>
            <StatInline label={`Comisión a comercios (${overview.merchant_sales ? ((overview.commissions / overview.merchant_sales) * 100).toFixed(1).replace(".", ",") : "0"} % sobre ventas)`} value={formatCOP(overview.commissions, true)} />
            <StatInline label="Tarifas de servicio" value={formatCOP(overview.service_fees, true)} />
            <div className="border-t border-border my-1" />
            <div className="flex items-baseline justify-between py-1.5">
              <span className="font-semibold">= Ingresos brutos YAVA</span>
              <span className="font-bold tabular-nums">{formatCOP(grossRevenue, true)}</span>
            </div>
            <StatInline label="− Descuentos financiados por YAVA" value={`− ${formatCOP(fundedDiscounts, true)}`} />
            <StatInline label="− Costos de pasarela" value={`− ${formatCOP(gateway, true)}`} />
            <div className="border-t border-border my-1" />
            <div className="flex items-baseline justify-between py-1.5">
              <span className="font-semibold">= Contribución</span>
              <span className="font-bold tabular-nums">{formatCOP(contribution, true)}</span>
            </div>
            <StatInline label="− Gastos operativos" value={`− ${formatCOP(opex, true)}`} />
            <div className="border-t border-border my-1" />
            <div className="flex items-baseline justify-between py-1.5">
              <span className="font-semibold">= Resultado operativo estimado</span>
              <span className={`font-bold text-lg tabular-nums ${result < 0 ? "text-red" : "text-carbon"}`}>{formatCOP(result, true)}</span>
            </div>
            <Note tone="warning" className="mt-3">Antes de impuestos; no equivale a dinero disponible. Las ventas de los comercios y el recaudo total no son ganancias de YAVA.</Note>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Resultado del período" description={`Ingresos, descuentos, costos y gastos ${periodLabel}.`} />
          <CardBody>
            <WaterfallChart
              steps={[
                { label: "Ingresos YAVA", value: grossRevenue, kind: "total" },
                { label: "Descuentos", value: -fundedDiscounts, kind: "out" },
                { label: "Pasarela", value: -gateway, kind: "out" },
                { label: "Gastos", value: -opex, kind: "out" },
                { label: "Resultado", value: result, kind: "total" },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Evolución diaria" description="Ingresos brutos y contribución por día de entrega (hora de Bogotá)." />
        <CardBody>{chart.length === 0 ? <p className="text-sm text-muted py-8 text-center">Sin pedidos entregados en el período.</p> : <DailyChart data={chart} showSales={false} />}</CardBody>
      </Card>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader title="Por ciudad" />
          <DataTable
            dense
            rows={overview.by_city}
            rowKey={(r) => r.city_id}
            emptyTitle="Sin datos"
            columns={[
              { key: "c", header: "Ciudad", cell: (r) => <span className="font-medium">{r.city}</span> },
              { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders) },
              { key: "s", header: "Ventas de comercios", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.sales, true)}</span> },
              { key: "r", header: "Ingresos YAVA", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatCOP(r.revenue, true)}</span> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Por categoría" />
          <DataTable
            dense
            rows={[...byType.entries()].map(([type, v]) => ({ type, ...v }))}
            rowKey={(r) => r.type}
            emptyTitle="Sin datos"
            columns={[
              { key: "c", header: "Categoría", cell: (r) => <Badge tone="neutral">{ORDER_TYPE_LABEL[r.type as OrderType] ?? r.type}</Badge> },
              { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders) },
              { key: "s", header: "Ventas de comercios", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.sales, true)}</span> },
              { key: "r", header: "Ingresos YAVA", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatCOP(r.revenue, true)}</span> },
            ]}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Gastos operativos" description={`Total del período: ${formatCOP(opex, true)}`} action={<NewExpenseDialog cities={cities ?? []} defaultDate={todayISO()} />} />
        <DataTable
          dense
          rows={expenses ?? []}
          rowKey={(e) => e.id}
          emptyTitle="Sin gastos registrados en el período"
          columns={[
            { key: "d", header: "Fecha", cell: (e) => fmtDate(e.date) },
            { key: "city", header: "Ciudad", cell: (e) => <span className="text-muted">{e.city?.name ?? "General"}</span> },
            { key: "c", header: "Categoría", cell: (e) => <Badge tone="neutral">{EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}</Badge> },
            { key: "desc", header: "Descripción", cell: (e) => e.description ?? "—" },
            { key: "a", header: "Monto", align: "right", cell: (e) => <span className="tabular-nums">{formatCOP(e.amount, true)}</span> },
            { key: "x", header: "", align: "right", cell: (e) => <DeleteExpenseButton id={e.id} /> },
          ]}
        />
      </Card>
      <DemoNote />
    </div>
  );
}
