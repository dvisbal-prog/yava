import type { Metadata } from "next";
import { MERCHANT_STATUS_LABEL, type MerchantCategory, type MerchantStatus, Constants } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { daysAgoISO, bogotaDayStart, fmtPercent, formatRating } from "@/lib/format";
import { buildQuery, firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, MerchantStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filters";

export const metadata: Metadata = { title: "Comercios" };

const PAGE_SIZE = 20;
const CATEGORY_LABEL: Record<MerchantCategory, string> = { food: "Comida", market: "Mercado", pharmacy: "Farmacia" };

export default async function MerchantsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp, cookieCity] = await Promise.all([requireSection("comercios"), searchParams, getSelectedCity()]);
  const supabase = await createClient();

  const tab = firstParam(sp.tab) === "revisar" ? "revisar" : "todos";
  const estado = firstParam(sp.estado) ?? "";
  const categoria = firstParam(sp.categoria) ?? "";
  const cityParam = firstParam(sp.ciudad);
  const city = cityParam === "all" ? null : (cityParam ?? cookieCity);
  const q = (firstParam(sp.q) ?? "").trim();
  const page = toInt(firstParam(sp.page), 1);

  let query = supabase
    .from("merchants")
    .select("id,name,category,status,rating_avg,rating_count,commission_rate,logo_url,created_at,city:cities(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (tab === "revisar") query = query.in("status", ["pending", "under_review"]);
  else if (estado && (Constants.public.Enums.merchant_status as readonly string[]).includes(estado)) query = query.eq("status", estado as MerchantStatus);
  if (categoria && (Constants.public.Enums.merchant_category as readonly string[]).includes(categoria)) query = query.eq("category", categoria as MerchantCategory);
  if (city) query = query.eq("city_id", city);
  if (q) query = query.ilike("name", `%${q.replace(/[%,()]/g, " ")}%`);

  const [{ data: rows, count, error }, { count: toReview }, { data: cities }, { data: recent }] = await Promise.all([
    query,
    supabase.from("merchants").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    supabase.from("cities").select("id,name").order("name"),
    supabase.from("orders").select("merchant_id").eq("status", "delivered").gte("delivered_at", bogotaDayStart(daysAgoISO(30))).limit(10000),
  ]);

  const orders30 = new Map<string, number>();
  for (const o of recent ?? []) if (o.merchant_id) orders30.set(o.merchant_id, (orders30.get(o.merchant_id) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <PageHeader title="Comercios" description="Solicitudes, estado operativo y catálogo de los comercios aliados" />

      <Tabs
        active={tab}
        items={[
          { key: "todos", label: "Todos", href: `/comercios${buildQuery(sp, { tab: null, page: null })}` },
          { key: "revisar", label: "Por revisar", count: toReview ?? 0, href: `/comercios${buildQuery(sp, { tab: "revisar", estado: null, page: null })}` },
        ]}
      />

      <Card className="p-4">
        <FilterForm resetHref="/comercios" hidden={{ tab: tab === "revisar" ? "revisar" : undefined }}>
          <FilterSearch value={q} placeholder="Buscar comercio por nombre" />
          <FilterSelect
            name="categoria"
            label="Categoría"
            value={categoria}
            options={[{ value: "", label: "Todas las categorías" }, ...(Constants.public.Enums.merchant_category as readonly MerchantCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]}
          />
          {tab !== "revisar" ? (
            <FilterSelect
              name="estado"
              label="Estado"
              value={estado}
              options={[{ value: "", label: "Todos los estados" }, ...(Constants.public.Enums.merchant_status as readonly MerchantStatus[]).map((s) => ({ value: s, label: MERCHANT_STATUS_LABEL[s] }))]}
            />
          ) : null}
          <FilterSelect name="ciudad" label="Ciudad" value={city ?? "all"} options={[{ value: "all", label: "Todas las ciudades" }, ...(cities ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
        </FilterForm>
      </Card>

      <Card>
        {error ? <p className="p-5 text-sm text-red">{error.message}</p> : null}
        <DataTable
          caption="Comercios"
          rows={rows ?? []}
          rowKey={(r) => r.id}
          rowHref={(r) => `/comercios/${r.id}`}
          emptyTitle={tab === "revisar" ? "No hay comercios por revisar" : "No hay comercios con estos filtros"}
          columns={[
            {
              key: "n",
              header: "Comercio",
              cell: (r) => (
                <span className="flex items-center gap-3">
                  <Avatar name={r.name} src={r.logo_url} size="sm" />
                  <span className="font-medium">{r.name}</span>
                </span>
              ),
            },
            { key: "cat", header: "Categoría", cell: (r) => <Badge tone="neutral">{CATEGORY_LABEL[r.category]}</Badge> },
            { key: "city", header: "Ciudad", cell: (r) => <span className="text-muted">{r.city?.name ?? "—"}</span> },
            { key: "s", header: "Estado", cell: (r) => <MerchantStatusBadge status={r.status} /> },
            { key: "rating", header: "Calificación", align: "right", cell: (r) => (r.rating_count > 0 ? <span className="tabular-nums">★ {formatRating(r.rating_avg)} <span className="text-muted text-xs">({r.rating_count})</span></span> : <span className="text-gray-400">—</span>) },
            { key: "o30", header: "Pedidos 30 d", align: "right", cell: (r) => <span className="tabular-nums">{orders30.get(r.id) ?? 0}</span> },
            { key: "com", header: "Comisión", align: "right", cell: (r) => <span className="tabular-nums">{fmtPercent(r.commission_rate)}</span> },
            { key: "go", header: "", align: "right", cell: (r) => <span className="text-blue text-[13px]">{["pending", "under_review"].includes(r.status) ? "Revisar ›" : "Ver ›"}</span> },
          ]}
          footer={<Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={sp} basePath="/comercios" />}
        />
      </Card>
    </div>
  );
}
