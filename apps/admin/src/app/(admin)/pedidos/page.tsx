import type { Metadata } from "next";
import { ACTIVE_ORDER_STATUSES, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, formatCOP, type OrderStatus, type OrderType } from "@yava/shared";
import { Constants } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { bogotaDayEnd, bogotaDayStart, fmtDateTime } from "@/lib/format";
import { firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, OrderStatusBadge, PAYMENT_METHOD_LABEL, PaymentStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDate, FilterForm, FilterSearch, FilterSelect } from "@/components/filters";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Pedidos" };

const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp, cookieCity] = await Promise.all([requireSection("pedidos"), searchParams, getSelectedCity()]);
  const supabase = await createClient();

  const estado = firstParam(sp.estado) ?? "";
  const tipo = firstParam(sp.tipo) ?? "";
  const cityParam = firstParam(sp.ciudad);
  const city = cityParam === "all" ? null : (cityParam ?? cookieCity);
  const desde = firstParam(sp.desde) ?? "";
  const hasta = firstParam(sp.hasta) ?? "";
  const q = (firstParam(sp.q) ?? "").trim();
  const page = toInt(firstParam(sp.page), 1);

  const { data: cities } = await supabase.from("cities").select("id,name").order("name");

  let query = supabase
    .from("order_summary")
    .select("id,number,type,status,total,placed_at,merchant_name,customer_name,courier_name,city_name,payment_method,payment_status,items_count", { count: "exact" })
    .order("placed_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (estado === "activos") query = query.in("status", ACTIVE_ORDER_STATUSES);
  else if (estado && (Constants.public.Enums.order_status as readonly string[]).includes(estado)) query = query.eq("status", estado as OrderStatus);
  if (tipo && (Constants.public.Enums.order_type as readonly string[]).includes(tipo)) query = query.eq("type", tipo as OrderType);
  if (city) query = query.eq("city_id", city);
  if (desde) query = query.gte("placed_at", bogotaDayStart(desde));
  if (hasta) query = query.lte("placed_at", bogotaDayEnd(hasta));
  if (q) {
    const num = Number.parseInt(q.replace("#", ""), 10);
    const safe = q.replace(/[%,()]/g, " ");
    query = Number.isFinite(num) && String(num) === q.replace("#", "")
      ? query.eq("number", num)
      : query.or(`customer_name.ilike.%${safe}%,merchant_name.ilike.%${safe}%,courier_name.ilike.%${safe}%`);
  }

  const { data: rows, count, error } = await query;

  return (
    <div className="space-y-4">
      <RealtimeRefresh table="orders" />
      <PageHeader title="Control de pedidos" description="Seguimiento en vivo de todos los pedidos de la plataforma" />

      <Card className="p-4">
        <FilterForm resetHref="/pedidos">
          <FilterSearch value={q} placeholder="N.º de pedido, cliente, comercio o repartidor" />
          <FilterSelect
            name="estado"
            label="Estado"
            value={estado}
            options={[
              { value: "", label: "Todos los estados" },
              { value: "activos", label: "Activos" },
              ...(Constants.public.Enums.order_status as readonly OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
            ]}
          />
          <FilterSelect
            name="tipo"
            label="Tipo"
            value={tipo}
            options={[{ value: "", label: "Todos los tipos" }, ...(Constants.public.Enums.order_type as readonly OrderType[]).map((t) => ({ value: t, label: ORDER_TYPE_LABEL[t] }))]}
          />
          <FilterSelect
            name="ciudad"
            label="Ciudad"
            value={city ?? "all"}
            options={[{ value: "all", label: "Todas las ciudades" }, ...(cities ?? []).map((c) => ({ value: c.id, label: c.name }))]}
          />
          <FilterDate name="desde" label="Desde" value={desde} />
          <FilterDate name="hasta" label="Hasta" value={hasta} />
        </FilterForm>
      </Card>

      <Card>
        {error ? <p className="p-5 text-sm text-red">{error.message}</p> : null}
        <DataTable
          caption="Pedidos"
          rows={rows ?? []}
          rowKey={(r) => r.id ?? ""}
          rowHref={(r) => `/pedidos/${r.id}`}
          emptyTitle="No hay pedidos con estos filtros"
          emptyDescription="Ajusta los filtros o limpia la búsqueda."
          columns={[
            { key: "n", header: "Pedido", cell: (r) => <span className="font-semibold">#{r.number}</span> },
            { key: "tipo", header: "Tipo", cell: (r) => <Badge tone="neutral">{r.type ? ORDER_TYPE_LABEL[r.type] : "—"}</Badge> },
            { key: "m", header: "Comercio", cell: (r) => r.merchant_name ?? (r.type === "shipment" ? "Envío punto a punto" : "—") },
            { key: "c", header: "Cliente", cell: (r) => r.customer_name ?? "—" },
            { key: "r", header: "Repartidor", cell: (r) => <span className={r.courier_name ? "" : "text-gray-400"}>{r.courier_name ?? "Sin asignar"}</span> },
            { key: "city", header: "Ciudad", cell: (r) => <span className="text-muted">{r.city_name ?? "—"}</span> },
            { key: "s", header: "Estado", cell: (r) => <OrderStatusBadge status={r.status} /> },
            {
              key: "pay",
              header: "Pago",
              cell: (r) => (
                <span className="inline-flex items-center gap-1.5 text-[13px]">
                  {PAYMENT_METHOD_LABEL[r.payment_method ?? ""] ?? r.payment_method} <PaymentStatusBadge status={r.payment_status} />
                </span>
              ),
            },
            { key: "t", header: "Total", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatCOP(r.total, true)}</span> },
            { key: "h", header: "Fecha", align: "right", cell: (r) => <span className="text-muted whitespace-nowrap">{fmtDateTime(r.placed_at)}</span> },
          ]}
          footer={<Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={sp} basePath="/pedidos" />}
        />
      </Card>
    </div>
  );
}
