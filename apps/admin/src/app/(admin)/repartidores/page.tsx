import type { Metadata } from "next";
import { Bike, UserCheck, Wifi, AlertTriangle } from "lucide-react";
import { COURIER_STATUS_LABEL, Constants, formatCOP, type CourierStatus } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/format";
import { buildQuery, firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { KPI } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { Badge, CourierStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { ChipTabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filters";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Repartidores" };

const PAGE_SIZE = 20;
const VEHICLE_LABEL: Record<string, string> = { moto: "Moto", bicicleta: "Bicicleta", carro: "Carro", a_pie: "A pie" };

export default async function CouriersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp, cookieCity] = await Promise.all([requireSection("repartidores"), searchParams, getSelectedCity()]);
  const supabase = await createClient();

  const tab = firstParam(sp.tab) ?? "todos";
  const estado = firstParam(sp.estado) ?? "";
  const cityParam = firstParam(sp.ciudad);
  const city = cityParam === "all" ? null : (cityParam ?? cookieCity);
  const q = (firstParam(sp.q) ?? "").trim();
  const page = toInt(firstParam(sp.page), 1);

  // Nombres: la búsqueda por nombre se resuelve primero en profiles (RLS admin).
  let idsByName: string[] | null = null;
  if (q) {
    const { data: ps } = await supabase.from("profiles").select("id").or(`full_name.ilike.%${q.replace(/[%,()]/g, " ")}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(200);
    idsByName = (ps ?? []).map((p) => p.id);
  }

  let query = supabase
    .from("couriers")
    .select("user_id,vehicle,plate,status,is_online,rating_avg,rating_count,deliveries_count,balance,last_seen_at,profile:profiles(full_name,avatar_url,phone),city:cities(name)", { count: "exact" })
    .order("is_online", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (tab === "revisar") query = query.in("status", ["pending", "under_review"]);
  else if (tab === "disponibles") query = query.eq("is_online", true).eq("status", "active");
  else if (estado && (Constants.public.Enums.courier_status as readonly string[]).includes(estado)) query = query.eq("status", estado as CourierStatus);
  if (city) query = query.eq("city_id", city);
  if (idsByName) query = idsByName.length ? query.in("user_id", idsByName) : query.in("user_id", ["00000000-0000-0000-0000-000000000000"]);

  const [{ data: rows, count, error }, { count: total }, { count: online }, { count: toReview }, { data: cities }, { data: busy }] = await Promise.all([
    query,
    supabase.from("couriers").select("user_id", { count: "exact", head: true }),
    supabase.from("couriers").select("user_id", { count: "exact", head: true }).eq("is_online", true),
    supabase.from("couriers").select("user_id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    supabase.from("cities").select("id,name").order("name"),
    supabase.from("orders").select("courier_id").in("status", ["assigned", "picked_up", "on_the_way"]).not("courier_id", "is", null),
  ]);
  const busyIds = new Set((busy ?? []).map((o) => o.courier_id));

  return (
    <div className="space-y-4">
      <RealtimeRefresh table="couriers" debounceMs={3000} />
      <PageHeader title="Repartidores" description="Gestión de repartidores y su actividad" />

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <KPI label="Conectados" value={online ?? 0} hint={`de ${total ?? 0} registrados`} icon={Wifi} tone="green" />
        <KPI label="En entrega" value={busyIds.size} hint="repartidores con pedido activo" icon={Bike} tone="blue" />
        <KPI label="Por revisar" value={toReview ?? 0} hint="documentación pendiente" icon={AlertTriangle} tone="yellow" />
        <KPI label="Activos" value={(total ?? 0) - (toReview ?? 0)} hint="cuentas aprobadas" icon={UserCheck} />
      </div>

      <Card className="p-4 space-y-3">
        <ChipTabs
          active={tab}
          items={[
            { key: "todos", label: "Todos", count: total ?? 0, href: `/repartidores${buildQuery(sp, { tab: null, page: null })}` },
            { key: "disponibles", label: "Disponibles", count: online ?? 0, href: `/repartidores${buildQuery(sp, { tab: "disponibles", estado: null, page: null })}` },
            { key: "revisar", label: "Por revisar", count: toReview ?? 0, href: `/repartidores${buildQuery(sp, { tab: "revisar", estado: null, page: null })}` },
          ]}
        />
        <FilterForm resetHref="/repartidores" hidden={{ tab: tab !== "todos" ? tab : undefined }}>
          <FilterSearch value={q} placeholder="Buscar repartidor por nombre, teléfono o correo" />
          {tab === "todos" ? (
            <FilterSelect name="estado" label="Estado" value={estado} options={[{ value: "", label: "Todos los estados" }, ...(Constants.public.Enums.courier_status as readonly CourierStatus[]).map((s) => ({ value: s, label: COURIER_STATUS_LABEL[s] }))]} />
          ) : null}
          <FilterSelect name="ciudad" label="Ciudad" value={city ?? "all"} options={[{ value: "all", label: "Todas las ciudades" }, ...(cities ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
        </FilterForm>
      </Card>

      <Card>
        {error ? <p className="p-5 text-sm text-red">{error.message}</p> : null}
        <DataTable
          caption="Repartidores"
          rows={rows ?? []}
          rowKey={(r) => r.user_id}
          rowHref={(r) => `/repartidores/${r.user_id}`}
          emptyTitle="No hay repartidores con estos filtros"
          columns={[
            {
              key: "n",
              header: "Nombre",
              cell: (r) => (
                <span className="flex items-center gap-3">
                  <Avatar name={r.profile?.full_name} src={r.profile?.avatar_url} size="sm" />
                  <span>
                    <span className="block font-medium">{r.profile?.full_name ?? "Sin nombre"}</span>
                    <span className="block text-xs text-muted">{r.profile?.phone ?? ""}</span>
                  </span>
                </span>
              ),
            },
            { key: "v", header: "Vehículo", cell: (r) => <span>{VEHICLE_LABEL[r.vehicle] ?? r.vehicle}{r.plate ? <span className="text-muted text-xs"> · {r.plate}</span> : null}</span> },
            { key: "c", header: "Ciudad", cell: (r) => <span className="text-muted">{r.city?.name ?? "—"}</span> },
            { key: "s", header: "Estado", cell: (r) => <CourierStatusBadge status={r.status} /> },
            {
              key: "o",
              header: "Conexión",
              cell: (r) => (busyIds.has(r.user_id) ? <Badge tone="blue" dot>En entrega</Badge> : r.is_online ? <Badge tone="green" dot>Disponible</Badge> : <Badge tone="gray" dot>Desconectado</Badge>),
            },
            { key: "r", header: "Calificación", align: "right", cell: (r) => (r.rating_count > 0 ? <span className="tabular-nums">★ {formatRating(r.rating_avg)}</span> : <span className="text-gray-400">—</span>) },
            { key: "d", header: "Entregas", align: "right", cell: (r) => <span className="tabular-nums">{r.deliveries_count}</span> },
            { key: "b", header: "Saldo", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.balance)}</span> },
            { key: "go", header: "", align: "right", cell: (r) => <span className="text-blue text-[13px]">{["pending", "under_review"].includes(r.status) ? "Revisar ›" : "Ver ›"}</span> },
          ]}
          footer={<Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={sp} basePath="/repartidores" />}
        />
      </Card>
    </div>
  );
}
