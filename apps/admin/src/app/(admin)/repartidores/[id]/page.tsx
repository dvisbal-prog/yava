import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Mail, Phone } from "lucide-react";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signDocuments, docLabel } from "@/lib/storage";
import { fmtDate, fmtDateTime, fmtRelativeDay, formatRating } from "@/lib/format";
import { canManageFinance, canManageMerchants } from "@/lib/roles";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { KPI, StatInline } from "@/components/ui/kpi";
import { Badge, CourierStatusBadge, DocStatusBadge, OrderStatusBadge, SettlementStatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CourierDocumentReview, CourierStatusActions, WithdrawalActions } from "./courier-actions";

export const metadata: Metadata = { title: "Repartidor" };
const VEHICLE_LABEL: Record<string, string> = { moto: "Moto", bicicleta: "Bicicleta", carro: "Carro", a_pie: "A pie" };

export default async function CourierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireSection("repartidores"), params]);
  const supabase = await createClient();

  const { data: c } = await supabase.from("couriers").select("*, profile:profiles(full_name,avatar_url,phone,email,created_at), city:cities(name)").eq("user_id", id).maybeSingle();
  if (!c) notFound();

  const canManage = canManageMerchants(ctx.role);
  const canFinance = canManageFinance(ctx.role);

  const [{ data: docs }, { data: deliveries }, withdrawalsRes, { data: active }] = await Promise.all([
    supabase.from("courier_documents").select("id,doc_type,file_path,status,notes,reviewed_at,created_at").eq("courier_id", id).order("created_at"),
    supabase.from("order_summary").select("id,number,status,merchant_name,courier_payout,delivered_at,placed_at,city_name").eq("courier_id", id).order("placed_at", { ascending: false }).limit(30),
    canFinance ? supabase.from("courier_withdrawals").select("id,amount,status,reference,created_at,processed_at,bank_snapshot").eq("courier_id", id).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: null }),
    supabase.from("orders").select("id,number,status").eq("courier_id", id).in("status", ["assigned", "picked_up", "on_the_way"]).limit(1),
  ]);
  const urls = await signDocuments(supabase, (docs ?? []).map((d) => d.file_path));
  const bank = (c.bank_account && typeof c.bank_account === "object" && !Array.isArray(c.bank_account) ? c.bank_account : {}) as Record<string, string | undefined>;
  const activeOrder = active?.[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={c.profile?.full_name} src={c.profile?.avatar_url} size="lg" />
          <div>
            <p className="text-[13px] text-muted">
              <Link href="/repartidores" className="hover:text-carbon">
                Repartidores
              </Link>{" "}
              › {c.profile?.full_name ?? "Repartidor"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-xl font-bold text-carbon">{c.profile?.full_name ?? "Sin nombre"}</h1>
              <CourierStatusBadge status={c.status} />
              {activeOrder ? <Badge tone="blue" dot>En entrega</Badge> : c.is_online ? <Badge tone="green" dot>Disponible</Badge> : <Badge tone="gray" dot>Desconectado</Badge>}
            </div>
            <p className="text-sm text-muted mt-0.5">
              {VEHICLE_LABEL[c.vehicle] ?? c.vehicle}
              {c.plate ? ` ${c.plate}` : ""} · {c.city?.name ?? "—"} · {c.rating_count > 0 ? `★ ${formatRating(c.rating_avg)} (${c.rating_count} valoraciones)` : "Sin calificaciones"}
            </p>
          </div>
        </div>
        {canManage ? <CourierStatusActions id={c.user_id} status={c.status} /> : null}
      </div>

      {c.review_notes ? <Note tone={c.status === "suspended" ? "danger" : "neutral"}>Última nota de revisión: {c.review_notes}</Note> : null}

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <KPI label="Entregas totales" value={c.deliveries_count} tone="green" />
        <KPI label="Saldo disponible" value={formatCOP(c.balance, true)} hint="Tarifas de entrega acumuladas" tone="blue" />
        <KPI label="Última conexión" value={<span className="text-base">{fmtRelativeDay(c.last_seen_at)}</span>} />
        <KPI
          label="Pedido en curso"
          value={activeOrder ? <Link href={`/pedidos/${activeOrder.id}`} className="text-blue hover:underline text-base">#{activeOrder.number}</Link> : <span className="text-base text-muted">Ninguno</span>}
        />
      </div>

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Documentos" description="Archivos privados; los enlaces caducan en una hora." />
            {(docs ?? []).length === 0 ? (
              <EmptyState icon={FileText} title="Sin documentos cargados" />
            ) : (
              <DataTable
                rows={docs ?? []}
                rowKey={(d) => d.id}
                columns={[
                  { key: "t", header: "Documento", cell: (d) => <span className="font-medium">{docLabel(d.doc_type)}</span> },
                  { key: "s", header: "Estado", cell: (d) => <DocStatusBadge status={d.status} /> },
                  { key: "n", header: "Nota", cell: (d) => <span className="text-muted text-[13px]">{d.notes ?? "—"}</span> },
                  { key: "f", header: "Revisado", cell: (d) => <span className="text-muted text-[13px]">{d.reviewed_at ? fmtDateTime(d.reviewed_at) : `Subido ${fmtDate(d.created_at)}`}</span> },
                  {
                    key: "a",
                    header: "",
                    align: "right",
                    cell: (d) => (
                      <span className="flex items-center justify-end gap-2">
                        {urls.get(d.file_path) ? (
                          <a href={urls.get(d.file_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-blue hover:underline">
                            Ver <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Sin archivo</span>
                        )}
                        {canManage && d.status === "pending" ? <CourierDocumentReview docId={d.id} courierId={c.user_id} /> : null}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Card>
            <CardHeader title="Historial de entregas" description="Últimos 30 pedidos asignados." />
            <DataTable
              rows={deliveries ?? []}
              rowKey={(o) => o.id ?? ""}
              rowHref={(o) => `/pedidos/${o.id}`}
              emptyTitle="Sin entregas"
              columns={[
                { key: "n", header: "Pedido", cell: (o) => <span className="font-medium">#{o.number}</span> },
                { key: "m", header: "Comercio", cell: (o) => o.merchant_name ?? "Envío" },
                { key: "c", header: "Ciudad", cell: (o) => <span className="text-muted">{o.city_name ?? "—"}</span> },
                { key: "s", header: "Estado", cell: (o) => <OrderStatusBadge status={o.status} /> },
                { key: "p", header: "Pago repartidor", align: "right", cell: (o) => <span className="tabular-nums">{formatCOP(o.courier_payout)}</span> },
                { key: "d", header: "Fecha", align: "right", cell: (o) => <span className="text-muted">{fmtDateTime(o.delivered_at ?? o.placed_at)}</span> },
              ]}
            />
          </Card>

          {canFinance ? (
            <Card>
              <CardHeader title="Retiros" description="Ninguna transferencia se ejecuta automáticamente; aquí se registra la decisión." />
              <DataTable
                rows={withdrawalsRes.data ?? []}
                rowKey={(w) => w.id}
                emptyTitle="Sin solicitudes de retiro"
                columns={[
                  { key: "d", header: "Solicitado", cell: (w) => fmtDateTime(w.created_at) },
                  { key: "a", header: "Monto", align: "right", cell: (w) => <span className="tabular-nums font-medium">{formatCOP(w.amount, true)}</span> },
                  { key: "s", header: "Estado", cell: (w) => <SettlementStatusBadge status={w.status} /> },
                  { key: "r", header: "Referencia", cell: (w) => <span className="font-mono text-xs text-muted">{w.reference ?? "—"}</span> },
                  { key: "p", header: "Procesado", cell: (w) => <span className="text-muted text-[13px]">{w.processed_at ? fmtDateTime(w.processed_at) : "—"}</span> },
                  { key: "x", header: "", align: "right", cell: (w) => <WithdrawalActions id={w.id} courierId={c.user_id} status={w.status} /> },
                ]}
              />
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Información personal" />
            <CardBody className="space-y-2">
              <StatInline label="Documento" value={c.document_number ?? "—"} />
              <StatInline label="Teléfono" value={c.profile?.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.profile.phone}</span> : "—"} />
              <StatInline label="Correo" value={c.profile?.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {c.profile.email}</span> : "—"} />
              <StatInline label="Registrado" value={fmtDate(c.created_at)} />
              <StatInline label="ID" value={<span className="font-mono text-xs">{c.user_id.slice(0, 8)}</span>} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Cuenta bancaria" description="Se usa para liquidaciones y retiros." />
            <CardBody>
              {Object.keys(bank).length === 0 ? (
                <p className="text-sm text-muted">Sin cuenta registrada.</p>
              ) : (
                <>
                  <StatInline label="Banco" value={bank.bank ?? "—"} />
                  <StatInline label="Tipo" value={bank.type ?? "—"} />
                  <StatInline label="Número" value={<span className="font-mono">{bank.number ?? "—"}</span>} />
                  <StatInline label="Titular" value={bank.holder ?? "—"} />
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
