import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Bike, CheckCircle2, ChevronRight, LifeBuoy, Store, TrendingUp, XCircle, Clock } from "lucide-react";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { fetchOverview, parseRange, rangeBounds } from "@/lib/overview";
import { fmtTime, fmtNumber } from "@/lib/format";
import { canAccess } from "@/lib/roles";
import { firstParam, type SearchParams } from "@/lib/utils";
import { KPI } from "@/components/ui/kpi";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { OrderStatusBadge } from "@/components/ui/badge";
import { PageHeader, DemoNote } from "@/components/ui/page-header";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { RangeChips } from "@/components/range-chips";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Panorama" };

export default async function PanoramaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [ctx, sp, city] = await Promise.all([requireSection("panorama"), searchParams, getSelectedCity()]);
  const range = parseRange(firstParam(sp.range));
  const { from, to } = rangeBounds(range);
  const supabase = await createClient();

  let recent = supabase
    .from("order_summary")
    .select("id,number,merchant_name,status,total,placed_at,type")
    .order("placed_at", { ascending: false })
    .limit(8);
  if (city) recent = recent.eq("city_id", city);

  const [overview, { data: recentOrders }] = await Promise.all([fetchOverview(supabase, from, to, city), recent]);

  const showFinance = canAccess(ctx.role, "finanzas");
  const rangeTitle = range === "hoy" ? "del día" : range === "7d" ? "de los últimos 7 días" : "de los últimos 30 días";

  return (
    <div className="space-y-5">
      <RealtimeRefresh table="orders" debounceMs={2000} />
      <PageHeader title="Panorama general" description="Actividad de la plataforma" actions={<RangeChips active={range} searchParams={sp} basePath="/" />} />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Ventas de comercios" value={formatCOP(overview.merchant_sales, true)} icon={Store} hint={`Ventas ${rangeTitle} · no son ingresos de YAVA`} />
        {showFinance ? (
          <KPI label="Ingresos YAVA" value={formatCOP(overview.yava_revenue, true)} icon={TrendingUp} tone="blue" hint="Comisiones + tarifas de servicio" />
        ) : (
          <KPI label="Ticket promedio" value={formatCOP(overview.avg_ticket, true)} icon={TrendingUp} tone="blue" hint="Productos por pedido entregado" />
        )}
        <KPI label="Pedidos entregados" value={fmtNumber(overview.delivered)} icon={CheckCircle2} tone="green" />
        <KPI label="Pedidos activos" value={fmtNumber(overview.active)} icon={Clock} tone="yellow" hint={<Link href="/pedidos?estado=activos" className="text-blue hover:underline">Ver más ›</Link>} />
      </div>

      <Note tone="info">Las ventas de comercios no son ingresos de YAVA.</Note>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Operación ahora" description="Pedidos recibidos por hora" />
          <CardBody>
            <HourlyChart data={overview.hourly} />
          </CardBody>
        </Card>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-1">
          <MiniStat icon={Store} value={overview.active_merchants} label="comercios activos" tone="blue" />
          <MiniStat icon={Bike} value={overview.online_couriers} label="repartidores conectados" tone="green" />
          <MiniStat icon={XCircle} value={overview.cancelled} label="cancelados" tone="red" />
          <MiniStat icon={LifeBuoy} value={overview.open_cases} label="incidencias abiertas" tone="yellow" href={canAccess(ctx.role, "soporte") ? "/soporte" : undefined} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pedidos recientes"
            action={
              canAccess(ctx.role, "pedidos") ? (
                <Link href="/pedidos" className="text-[13px] text-blue hover:underline inline-flex items-center gap-0.5">
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
          />
          <DataTable
            dense
            rows={recentOrders ?? []}
            rowKey={(r) => r.id ?? ""}
            rowHref={canAccess(ctx.role, "pedidos") ? (r) => `/pedidos/${r.id}` : undefined}
            emptyTitle="Aún no hay pedidos"
            columns={[
              { key: "n", header: "Pedido", cell: (r) => <span className="font-medium">#{r.number}</span> },
              { key: "m", header: "Comercio", cell: (r) => r.merchant_name ?? (r.type === "shipment" ? "Envío" : "—") },
              { key: "s", header: "Estado", cell: (r) => <OrderStatusBadge status={r.status} /> },
              { key: "t", header: "Total", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.total, true)}</span> },
              { key: "h", header: "Hora", align: "right", cell: (r) => <span className="text-muted">{fmtTime(r.placed_at)}</span> },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title="Comercios por revisar" />
          <CardBody>
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-md bg-yellow-soft text-[#8a6400] flex items-center justify-center" aria-hidden>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-carbon">{overview.merchants_to_review}</p>
                <p className="text-[13px] text-muted -mt-0.5">comercios por revisar</p>
              </div>
            </div>
            <p className="text-[13px] text-muted mt-3">Tienen documentos pendientes o están a la espera de aprobación.</p>
            {canAccess(ctx.role, "comercios") ? (
              <Link href="/comercios?tab=revisar" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue hover:underline">
                Revisar <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
            {overview.couriers_to_review > 0 && canAccess(ctx.role, "repartidores") ? (
              <p className="mt-4 pt-4 border-t border-border text-[13px] text-gray-700">
                <Link href="/repartidores?tab=revisar" className="text-blue hover:underline">
                  {overview.couriers_to_review} repartidor{overview.couriers_to_review === 1 ? "" : "es"} con documentación pendiente ›
                </Link>
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
      <DemoNote />
    </div>
  );
}

function MiniStat({ icon: Icon, value, label, tone, href }: { icon: typeof Store; value: number; label: string; tone: "blue" | "green" | "red" | "yellow"; href?: string }) {
  const t = {
    blue: "bg-blue-soft text-blue",
    green: "bg-green-soft text-green",
    red: "bg-red-soft text-red",
    yellow: "bg-yellow-soft text-[#8a6400]",
  }[tone];
  const content = (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3 h-full">
      <span className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${t}`} aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold text-carbon leading-6">{fmtNumber(value)}</p>
        <p className="text-[13px] text-muted truncate">{label}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:bg-gray-50 rounded-lg">
      {content}
    </Link>
  ) : (
    content
  );
}
