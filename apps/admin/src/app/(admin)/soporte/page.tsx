import type { Metadata } from "next";
import Link from "next/link";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtAgo } from "@/lib/format";
import { buildQuery, firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, PRIORITY_LABEL, PriorityBadge, SUPPORT_STATUS_LABEL, SupportStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { ChipTabs } from "@/components/ui/tabs";
import { FilterForm, FilterSearch, FilterSelect } from "@/components/filters";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";

export const metadata: Metadata = { title: "Soporte" };
const PAGE_SIZE = 20;
const ROLE_LABEL: Record<string, string> = { customer: "Cliente", merchant: "Comercio", courier: "Repartidor", admin: "Equipo" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [ctx, sp] = await Promise.all([requireSection("soporte"), searchParams]);
  const supabase = await createClient();

  const tab = firstParam(sp.tab) ?? "abiertos";
  const prioridad = firstParam(sp.prioridad) ?? "";
  const mine = firstParam(sp.mios) === "1";
  const q = (firstParam(sp.q) ?? "").trim();
  const page = toInt(firstParam(sp.page), 1);

  let query = supabase
    .from("support_cases")
    .select("id,number,subject,category,status,priority,opener_role,opened_by,assigned_to,order_id,created_at,updated_at,opener:profiles!support_cases_opened_by_fkey(full_name),assignee:profiles!support_cases_assigned_to_fkey(full_name),order:orders(number)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (tab === "abiertos") query = query.in("status", ["open", "in_progress"]);
  else if (tab === "resueltos") query = query.in("status", ["resolved", "closed"]);
  if (prioridad) query = query.eq("priority", prioridad);
  if (mine) query = query.eq("assigned_to", ctx.userId);
  if (q) {
    const num = Number.parseInt(q.replace(/[#S]/gi, ""), 10);
    query = Number.isFinite(num) && /^#?S?\d+$/i.test(q) ? query.eq("number", num) : query.ilike("subject", `%${q.replace(/[%,()]/g, " ")}%`);
  }

  const [{ data: rows, count, error }, { count: openCount }, { count: progressCount }, { count: resolvedCount }] = await Promise.all([
    query,
    supabase.from("support_cases").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("support_cases").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("support_cases").select("id", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
  ]);

  return (
    <div className="space-y-4">
      <RealtimeRefresh table="support_messages" debounceMs={2000} />
      <PageHeader title="Soporte" description={`${(openCount ?? 0) + (progressCount ?? 0)} casos abiertos`} />

      <Card className="p-4 space-y-3">
        <ChipTabs
          active={tab}
          items={[
            { key: "abiertos", label: "Abiertos", count: (openCount ?? 0) + (progressCount ?? 0), href: `/soporte${buildQuery(sp, { tab: null, page: null })}` },
            { key: "resueltos", label: "Resueltos", count: resolvedCount ?? 0, href: `/soporte${buildQuery(sp, { tab: "resueltos", page: null })}` },
            { key: "todos", label: "Todos", href: `/soporte${buildQuery(sp, { tab: "todos", page: null })}` },
          ]}
        />
        <FilterForm resetHref="/soporte" hidden={{ tab: tab !== "abiertos" ? tab : undefined }}>
          <FilterSearch value={q} placeholder="N.º de caso o asunto" />
          <FilterSelect name="prioridad" label="Prioridad" value={prioridad} options={[{ value: "", label: "Todas las prioridades" }, ...Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))]} />
          <FilterSelect name="mios" label="Asignación" value={mine ? "1" : ""} options={[{ value: "", label: "Todos los casos" }, { value: "1", label: "Asignados a mí" }]} />
        </FilterForm>
      </Card>

      <Card>
        {error ? <p className="p-5 text-sm text-red">{error.message}</p> : null}
        <DataTable
          caption="Casos de soporte"
          rows={rows ?? []}
          rowKey={(r) => r.id}
          rowHref={(r) => `/soporte/${r.id}`}
          emptyTitle={tab === "abiertos" ? "No hay casos abiertos" : "Sin casos"}
          columns={[
            { key: "n", header: "Caso", cell: (r) => <span className="font-semibold">#S{r.number}</span> },
            {
              key: "s",
              header: "Asunto",
              cell: (r) => (
                <span>
                  <span className="block font-medium">{r.subject}</span>
                  <span className="block text-xs text-muted">
                    {r.opener?.full_name ?? "—"} · {ROLE_LABEL[r.opener_role] ?? r.opener_role}
                    {r.order ? ` · Pedido #${r.order.number}` : ""}
                  </span>
                </span>
              ),
            },
            { key: "c", header: "Categoría", cell: (r) => <Badge tone="neutral">{r.category}</Badge> },
            { key: "p", header: "Prioridad", cell: (r) => <PriorityBadge priority={r.priority} /> },
            { key: "st", header: "Estado", cell: (r) => <SupportStatusBadge status={r.status} /> },
            { key: "a", header: "Asignado a", cell: (r) => <span className={r.assignee ? "" : "text-gray-400"}>{r.assignee?.full_name ?? "Sin asignar"}</span> },
            { key: "t", header: "Actualizado", align: "right", cell: (r) => <span className="text-muted whitespace-nowrap">{fmtAgo(r.updated_at)}</span> },
          ]}
          footer={<Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={sp} basePath="/soporte" />}
        />
      </Card>
      <p className="text-xs text-muted">
        Estados: {Object.values(SUPPORT_STATUS_LABEL).join(" · ")}. Los casos los abren clientes, comercios y repartidores desde la app;{" "}
        <Link href="/pedidos" className="text-blue hover:underline">
          revisa el pedido vinculado
        </Link>{" "}
        antes de responder.
      </p>
    </div>
  );
}
