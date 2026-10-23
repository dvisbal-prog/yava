import type { Metadata } from "next";
import { formatCOP, type SettlementStatus } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysAgoISO, fmtDate, fmtNumber } from "@/lib/format";
import { firstParam, toInt, type SearchParams } from "@/lib/utils";
import { Card, Note } from "@/components/ui/card";
import { KPI } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { Badge, SETTLEMENT_STATUS_LABEL, SettlementStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader, DemoNote } from "@/components/ui/page-header";
import { FilterForm, FilterSelect } from "@/components/filters";
import { FinanceTabs } from "../finance-tabs";
import { GenerateSettlementsDialog } from "./generate-dialog";

export const metadata: Metadata = { title: "Liquidaciones" };
const PAGE_SIZE = 20;
const STATUSES: SettlementStatus[] = ["pending", "approved", "paid", "rejected"];

export default async function SettlementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [, sp] = await Promise.all([requireSection("finanzas"), searchParams]);
  const supabase = await createClient();

  const payee = firstParam(sp.tipo) ?? "";
  const estado = firstParam(sp.estado) ?? "";
  const page = toInt(firstParam(sp.page), 1);

  let query = supabase
    .from("settlements")
    .select("id,payee_type,payee_id,period_start,period_end,orders_count,gross,commissions,net,status,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (payee === "merchant" || payee === "courier") query = query.eq("payee_type", payee);
  if (STATUSES.includes(estado as SettlementStatus)) query = query.eq("status", estado as SettlementStatus);

  const [{ data: rows, count, error }, { data: pendingAll }] = await Promise.all([
    query,
    supabase.from("settlements").select("payee_type,net,status").in("status", ["pending", "approved"]),
  ]);

  // Nombres de beneficiarios
  const merchantIds = [...new Set((rows ?? []).filter((r) => r.payee_type === "merchant").map((r) => r.payee_id))];
  const courierIds = [...new Set((rows ?? []).filter((r) => r.payee_type === "courier").map((r) => r.payee_id))];
  const [{ data: merchants }, { data: couriers }] = await Promise.all([
    merchantIds.length ? supabase.from("merchants").select("id,name").in("id", merchantIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    courierIds.length ? supabase.from("profiles").select("id,full_name").in("id", courierIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);
  const names = new Map<string, string>();
  for (const m of merchants ?? []) names.set(m.id, m.name);
  for (const c of couriers ?? []) names.set(c.id, c.full_name ?? "Repartidor");

  const pendingMerchants = (pendingAll ?? []).filter((s) => s.payee_type === "merchant");
  const pendingCouriers = (pendingAll ?? []).filter((s) => s.payee_type === "courier");
  const sum = (xs: { net: number }[]) => xs.reduce((a, s) => a + s.net, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Liquidaciones" description="Gestión de pagos a comercios y repartidores" actions={<GenerateSettlementsDialog defaultStart={daysAgoISO(7)} defaultEnd={daysAgoISO(1)} />} />
      <FinanceTabs active="liquidaciones" />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KPI label="Pendiente comercios" value={formatCOP(sum(pendingMerchants), true)} hint={`${pendingMerchants.length} liquidación(es) pendientes o aprobadas`} tone="yellow" />
        <KPI label="Pendiente repartidores" value={formatCOP(sum(pendingCouriers), true)} hint={`${pendingCouriers.length} liquidación(es) pendientes o aprobadas`} tone="yellow" />
        <KPI label="Total pendiente" value={formatCOP(sum(pendingAll ?? []), true)} hint="Obligaciones por pagar a terceros" tone="blue" />
      </div>

      <Note tone="info">Ninguna transferencia se ejecuta automáticamente; aquí se registra la decisión. Revisa destinatario, cuenta y monto antes de aprobar o marcar como pagada.</Note>

      <Card className="p-4">
        <FilterForm resetHref="/finanzas/liquidaciones">
          <FilterSelect name="tipo" label="Beneficiario" value={payee} options={[{ value: "", label: "Comercios y repartidores" }, { value: "merchant", label: "Comercios" }, { value: "courier", label: "Repartidores" }]} />
          <FilterSelect name="estado" label="Estado" value={estado} options={[{ value: "", label: "Todos los estados" }, ...STATUSES.map((s) => ({ value: s, label: SETTLEMENT_STATUS_LABEL[s] }))]} />
        </FilterForm>
      </Card>

      <Card>
        {error ? <p className="p-5 text-sm text-red">{error.message}</p> : null}
        <DataTable
          caption="Liquidaciones"
          rows={rows ?? []}
          rowKey={(r) => r.id}
          rowHref={(r) => `/finanzas/liquidaciones/${r.id}`}
          emptyTitle="No hay liquidaciones con estos filtros"
          emptyDescription="Genera las liquidaciones del período con el botón superior."
          columns={[
            { key: "p", header: "Período", cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</span> },
            { key: "b", header: "Beneficiario", cell: (r) => <span className="font-medium">{names.get(r.payee_id) ?? "—"}</span> },
            { key: "t", header: "Tipo", cell: (r) => <Badge tone="neutral">{r.payee_type === "merchant" ? "Comercio" : "Repartidor"}</Badge> },
            { key: "o", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.orders_count) },
            { key: "g", header: "Bruto", align: "right", cell: (r) => <span className="tabular-nums text-muted">{formatCOP(r.gross)}</span> },
            { key: "n", header: "Monto", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatCOP(r.net, true)}</span> },
            { key: "s", header: "Estado", cell: (r) => <SettlementStatusBadge status={r.status} /> },
            { key: "a", header: "", align: "right", cell: (r) => <span className="text-blue text-[13px]">{r.status === "pending" || r.status === "approved" ? "Revisar ›" : "Ver ›"}</span> },
          ]}
          footer={<Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} searchParams={sp} basePath="/finanzas/liquidaciones" />}
        />
      </Card>
      <DemoNote />
    </div>
  );
}
