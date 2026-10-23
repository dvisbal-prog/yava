import type { Metadata } from "next";
import { formatCOP, type Json } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, fmtPercent } from "@/lib/format";
import { firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDate, FilterForm, FilterSearch, FilterSelect } from "@/components/filters";
import { CityDialog, DeleteZoneButton, SettingsForm, ZoneDialog } from "./settings-forms";

export const metadata: Metadata = { title: "Configuración" };
const PAGE_SIZE = 25;

const ENTITY_LABEL: Record<string, string> = {
  order: "Pedido",
  merchant: "Comercio",
  merchant_document: "Documento de comercio",
  courier: "Repartidor",
  courier_document: "Documento de repartidor",
  courier_withdrawal: "Retiro",
  settlement: "Liquidación",
  product: "Producto",
  admin_user: "Integrante",
  admin_invitation: "Invitación",
  platform_setting: "Configuración",
  city: "Ciudad",
  delivery_zone: "Zona",
  operating_expense: "Gasto operativo",
  support_case: "Caso de soporte",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp] = await Promise.all([requireSection("configuracion"), searchParams]);
  const supabase = await createClient();
  const tab = firstParam(sp.tab) === "zonas" ? "zonas" : firstParam(sp.tab) === "historial" ? "historial" : "general";

  const [{ data: settings }, { data: cities }, { data: zones }] = await Promise.all([
    supabase.from("platform_settings").select("key,value,description,updated_at"),
    supabase.from("cities").select("id,name,department,center_lat,center_lng,active").order("name"),
    supabase.from("delivery_zones").select("id,city_id,name,center_lat,center_lng,radius_km,base_delivery_fee,active").order("name"),
  ]);
  const settingsMap: Record<string, Json | undefined> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value;
  const cityName = new Map((cities ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-5">
      <PageHeader title="Configuración" description="Gestiona la información general de la plataforma." />
      <Tabs
        active={tab}
        items={[
          { key: "general", label: "General y tarifas", href: "/configuracion" },
          { key: "zonas", label: "Ciudades y zonas", href: "/configuracion?tab=zonas" },
          { key: "historial", label: "Historial de cambios", href: "/configuracion?tab=historial" },
        ]}
      />

      {tab === "general" ? (
        <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Tarifas y parámetros" description="Configuración actual para nuevos pedidos. Cada cambio requiere motivo y queda en el historial." />
            <CardBody>
              <SettingsForm settings={settingsMap} />
            </CardBody>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Resumen actual" />
              <CardBody className="space-y-1 text-sm">
                <Row label="Tarifa de servicio" value={formatCOP(Number(settingsMap.service_fee ?? 0), true)} />
                <Row label="Envío punto a punto" value={formatCOP(Number(settingsMap.shipment_base_fee ?? 0), true)} />
                <Row label="Comisión base" value={fmtPercent(Number(settingsMap.default_commission_rate ?? 0), 1)} />
                <Row label="Retiro mínimo" value={formatCOP(Number(settingsMap.min_withdrawal ?? 0), true)} />
                <Row label="Efectivo" value={settingsMap.cash_enabled === true || settingsMap.cash_enabled === "true" ? "Habilitado" : "Deshabilitado"} />
                <Row label="Moneda" value="COP · Peso colombiano" />
                <Row label="Zona horaria" value="(GMT-5) Bogotá" />
              </CardBody>
            </Card>
            <Note>El RPC <code>place_order</code> lee <code>service_fee</code> al crear cada pedido; los pedidos existentes no cambian.</Note>
          </div>
        </div>
      ) : null}

      {tab === "zonas" ? (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Ciudades" description="Ciudades donde puedes operar y recibir pedidos." action={<CityDialog />} />
            <DataTable
              dense
              rows={cities ?? []}
              rowKey={(c) => c.id}
              emptyTitle="Sin ciudades"
              columns={[
                { key: "n", header: "Ciudad", cell: (c) => <span className="font-medium">{c.name}</span> },
                { key: "d", header: "Departamento", cell: (c) => <span className="text-muted">{c.department ?? "—"}</span> },
                { key: "c", header: "Centro", cell: (c) => <span className="font-mono text-xs text-muted">{c.center_lat?.toFixed(4) ?? "—"}, {c.center_lng?.toFixed(4) ?? "—"}</span> },
                { key: "z", header: "Zonas", align: "right", cell: (c) => (zones ?? []).filter((z) => z.city_id === c.id).length },
                { key: "s", header: "Estado", cell: (c) => (c.active ? <Badge tone="green" dot>Activa</Badge> : <Badge tone="gray" dot>Inactiva</Badge>) },
                { key: "a", header: "", align: "right", cell: (c) => <CityDialog city={c} /> },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Zonas de cobertura" description="Radio de servicio y tarifa base de envío por zona." action={<ZoneDialog cities={cities ?? []} />} />
            <DataTable
              dense
              rows={zones ?? []}
              rowKey={(z) => z.id}
              emptyTitle="Sin zonas"
              columns={[
                { key: "n", header: "Zona", cell: (z) => <span className="font-medium">{z.name}</span> },
                { key: "c", header: "Ciudad", cell: (z) => <span className="text-muted">{cityName.get(z.city_id) ?? "—"}</span> },
                { key: "ctr", header: "Centro", cell: (z) => <span className="font-mono text-xs text-muted">{z.center_lat.toFixed(4)}, {z.center_lng.toFixed(4)}</span> },
                { key: "r", header: "Radio", align: "right", cell: (z) => `${z.radius_km} km` },
                { key: "f", header: "Tarifa base", align: "right", cell: (z) => <span className="tabular-nums">{formatCOP(z.base_delivery_fee, true)}</span> },
                { key: "s", header: "Estado", cell: (z) => (z.active ? <Badge tone="green" dot>Activa</Badge> : <Badge tone="gray" dot>Inactiva</Badge>) },
                { key: "a", header: "", align: "right", cell: (z) => <span className="inline-flex items-center gap-1"><ZoneDialog zone={z} cities={cities ?? []} /><DeleteZoneButton id={z.id} /></span> },
              ]}
            />
          </Card>
        </div>
      ) : null}

      {tab === "historial" ? <AuditTab sp={sp} /> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

async function AuditTab({ sp }: { sp: SearchParams }) {
  const supabase = await createClient();
  const entity = firstParam(sp.entidad) ?? "";
  const actor = firstParam(sp.actor) ?? "";
  const desde = firstParam(sp.desde) ?? "";
  const hasta = firstParam(sp.hasta) ?? "";
  const q = (firstParam(sp.q) ?? "").trim();
  const page = toInt(firstParam(sp.page), 1);

  const { data: admins } = await supabase.from("admin_users").select("user_id,profile:profiles!admin_users_user_id_fkey(full_name)");
  const actorOptions = (admins ?? []).map((a) => ({ value: a.user_id, label: a.profile?.full_name ?? a.user_id.slice(0, 8) }));
  const actorName = new Map(actorOptions.map((a) => [a.value, a.label]));

  let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entity) query = query.eq("entity", entity);
  if (actor) query = query.eq("actor_id", actor);
  if (desde) query = query.gte("created_at", `${desde}T00:00:00-05:00`);
  if (hasta) query = query.lte("created_at", `${hasta}T23:59:59-05:00`);
  if (q) query = query.or(`action.ilike.%${q}%,reason.ilike.%${q}%,entity_id.ilike.%${q}%`);
  const { data: rows, count } = await query;

  return (
    <Card>
      <CardHeader title="Historial de cambios" description="Registro de auditoría: quién hizo qué, cuándo y por qué, con el antes y el después." />
      <div className="px-5 pb-3">
        <FilterForm resetHref="/configuracion?tab=historial" hidden={{ tab: "historial" }}>
          <FilterSearch value={q} placeholder="Acción, motivo o ID" />
          <FilterSelect name="entidad" label="Entidad" value={entity} options={[{ value: "", label: "Todas las entidades" }, ...Object.entries(ENTITY_LABEL).map(([v, l]) => ({ value: v, label: l }))]} />
          <FilterSelect name="actor" label="Actor" value={actor} options={[{ value: "", label: "Todos los actores" }, ...actorOptions]} />
          <FilterDate name="desde" label="Desde" value={desde} />
          <FilterDate name="hasta" label="Hasta" value={hasta} />
        </FilterForm>
      </div>
      <ul className="divide-y divide-border">
        {(rows ?? []).length === 0 ? <li className="p-8 text-center text-sm text-muted">Sin registros con estos filtros.</li> : null}
        {(rows ?? []).map((r) => (
          <li key={r.id} className="px-5 py-3">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted whitespace-nowrap">{fmtDateTime(r.created_at)}</span>
              <span className="font-medium">{r.actor_id ? (actorName.get(r.actor_id) ?? "—") : "Sistema"}</span>
              <Badge tone="blue">{r.action}</Badge>
              <Badge tone="neutral">{ENTITY_LABEL[r.entity] ?? r.entity}</Badge>
              {r.entity_id ? <span className="font-mono text-xs text-muted">{r.entity_id.slice(0, 8)}</span> : null}
            </div>
            {r.reason ? <p className="text-[13px] text-gray-700 mt-1">Motivo: {r.reason}</p> : null}
            {r.before || r.after ? (
              <details className="mt-1">
                <summary className="text-xs text-blue cursor-pointer">Ver antes / después</summary>
                <Diff before={r.before} after={r.after} />
              </details>
            ) : null}
          </li>
        ))}
      </ul>
      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={{ ...sp, tab: "historial" }} basePath="/configuracion" />
    </Card>
  );
}

function Diff({ before, after }: { before: Json | null; after: Json | null }) {
  const b = (before && typeof before === "object" && !Array.isArray(before) ? before : {}) as Record<string, Json | undefined>;
  const a = (after && typeof after === "object" && !Array.isArray(after) ? after : {}) as Record<string, Json | undefined>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
  if (keys.length === 0) return <p className="text-xs text-muted mt-1">Sin diferencias de campos.</p>;
  const fmt = (v: Json | undefined) => (v === undefined ? "—" : typeof v === "string" ? v : JSON.stringify(v));
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr className="text-muted">
            <th className="text-left pr-4 font-medium">Campo</th>
            <th className="text-left pr-4 font-medium">Antes</th>
            <th className="text-left font-medium">Después</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td className="pr-4 py-0.5 font-mono">{k}</td>
              <td className="pr-4 py-0.5 text-red line-through break-all max-w-[280px]">{fmt(b[k])}</td>
              <td className="py-0.5 text-green break-all max-w-[280px]">{fmt(a[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
