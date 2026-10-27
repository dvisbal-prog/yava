import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateTime, fmtNumber, maskAccount } from "@/lib/format";
import { canAccess } from "@/lib/roles";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { StatInline } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { Badge, OrderStatusBadge, SettlementStatusBadge } from "@/components/ui/badge";
import { MaskedAccount } from "@/components/ui/masked-account";
import { SettlementActions } from "./settlement-actions";

export const metadata: Metadata = { title: "Liquidación" };

export default async function SettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireSection("finanzas"), params]);
  const supabase = await createClient();

  const { data: s } = await supabase.from("settlements").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();

  const [payeeRes, { data: so }, { data: actors }] = await Promise.all([
    s.payee_type === "merchant"
      ? supabase.from("merchants").select("id,name,legal_name,tax_id,bank_account,city:cities(name)").eq("id", s.payee_id).maybeSingle()
      : supabase.from("couriers").select("user_id,document_number,bank_account,profile:profiles(full_name,phone,email),city:cities(name)").eq("user_id", s.payee_id).maybeSingle(),
    supabase.from("settlement_orders").select("order_id,amount,order:order_summary(number,status,delivered_at,items_subtotal,commission_amount,customer_name,merchant_name)").eq("settlement_id", id),
    supabase.from("profiles").select("id,full_name").in("id", [s.approved_by ?? "", s.paid_by ?? ""].filter(Boolean)),
  ]);
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? "—"]));

  const payee = payeeRes.data as
    | { id: string; name: string; legal_name: string | null; tax_id: string | null; bank_account: unknown; city: { name: string } | null }
    | { user_id: string; document_number: string | null; bank_account: unknown; profile: { full_name: string | null; phone: string | null; email: string | null } | null; city: { name: string } | null }
    | null;
  const payeeName = payee ? ("name" in payee ? payee.name : (payee.profile?.full_name ?? "Repartidor")) : "—";
  const payeeHref = payee
    ? "name" in payee
      ? canAccess(ctx.role, "comercios")
        ? `/comercios/${payee.id}`
        : null
      : canAccess(ctx.role, "repartidores")
        ? `/repartidores/${payee.user_id}`
        : null
    : null;
  const canOpenOrders = canAccess(ctx.role, "pedidos");
  const bankSnap = (s.bank_snapshot && typeof s.bank_snapshot === "object" && !Array.isArray(s.bank_snapshot) ? s.bank_snapshot : {}) as Record<string, string | undefined>;
  const bankNow = (payee?.bank_account && typeof payee.bank_account === "object" && !Array.isArray(payee.bank_account) ? payee.bank_account : {}) as Record<string, string | undefined>;
  const bankChanged = JSON.stringify(bankSnap) !== JSON.stringify(bankNow) && Object.keys(bankNow).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            <Link href="/finanzas/liquidaciones" className="hover:text-carbon">
              Liquidaciones
            </Link>{" "}
            › {payeeName}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-xl font-bold text-carbon">Revisar liquidación · {payeeName}</h1>
            <SettlementStatusBadge status={s.status} />
            <Badge tone="neutral">{s.payee_type === "merchant" ? "Comercio" : "Repartidor"}</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">
            Período {fmtDate(s.period_start)} – {fmtDate(s.period_end)} · {fmtNumber(s.orders_count)} pedidos entregados · creada {fmtDateTime(s.created_at)}
          </p>
        </div>
      </div>

      <Note tone="info">Ninguna transferencia se ejecuta automáticamente; aquí se registra la decisión. Los datos del destinatario y el monto se revisan antes de confirmar.</Note>

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Resumen de la liquidación" />
            <CardBody>
              {s.payee_type === "merchant" ? (
                <>
                  <StatInline label="Ventas de productos" value={formatCOP(s.gross, true)} />
                  <StatInline label="Comisión YAVA" value={`− ${formatCOP(s.commissions, true)}`} />
                </>
              ) : (
                <StatInline label="Tarifas de entrega" value={formatCOP(s.gross, true)} />
              )}
              {s.adjustments !== 0 ? <StatInline label="Ajustes" value={formatCOP(s.adjustments, true)} /> : null}
              <div className="border-t border-border my-1" />
              <div className="flex items-baseline justify-between py-1.5">
                <span className="font-semibold">Neto a pagar {s.payee_type === "merchant" ? "al comercio" : "al repartidor"}</span>
                <span className="font-bold text-xl tabular-nums">{formatCOP(s.net, true)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pedidos incluidos" description={`${fmtNumber(so?.length ?? 0)} pedidos entregados en el período`} />
            <DataTable
              dense
              rows={so ?? []}
              rowKey={(r) => r.order_id}
              rowHref={canOpenOrders ? (r) => `/pedidos/${r.order_id}` : undefined}
              emptyTitle="Sin pedidos"
              columns={[
                { key: "n", header: "Pedido", cell: (r) => <span className="font-medium">#{r.order?.number}</span> },
                { key: "d", header: "Entregado", cell: (r) => <span className="text-muted">{fmtDateTime(r.order?.delivered_at)}</span> },
                { key: "c", header: s.payee_type === "merchant" ? "Cliente" : "Comercio", cell: (r) => (s.payee_type === "merchant" ? r.order?.customer_name : r.order?.merchant_name) ?? "—" },
                { key: "s", header: "Estado", cell: (r) => <OrderStatusBadge status={r.order?.status} /> },
                ...(s.payee_type === "merchant"
                  ? [
                      { key: "g", header: "Productos", align: "right" as const, cell: (r: { order: { items_subtotal: number | null } | null }) => <span className="tabular-nums text-muted">{formatCOP(r.order?.items_subtotal)}</span> },
                      { key: "k", header: "Comisión", align: "right" as const, cell: (r: { order: { commission_amount: number | null } | null }) => <span className="tabular-nums text-muted">− {formatCOP(r.order?.commission_amount)}</span> },
                    ]
                  : []),
                { key: "a", header: "Monto", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatCOP(r.amount)}</span> },
              ]}
            />
          </Card>

          {s.notes ? (
            <Card>
              <CardHeader title="Bitácora" />
              <CardBody>
                <pre className="text-[13px] text-gray-700 whitespace-pre-wrap font-sans">{s.notes.trim()}</pre>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Información del beneficiario" />
            <CardBody>
              <StatInline label="Nombre" value={payeeHref ? <Link href={payeeHref} className="text-blue hover:underline">{payeeName}</Link> : payeeName} />
              {payee && "name" in payee ? (
                <>
                  <StatInline label="Razón social" value={payee.legal_name ?? "—"} />
                  <StatInline label="NIT" value={payee.tax_id ?? "—"} />
                </>
              ) : payee ? (
                <>
                  <StatInline label="Documento" value={payee.document_number ?? "—"} />
                  <StatInline label="Teléfono" value={payee.profile?.phone ?? "—"} />
                </>
              ) : null}
              <StatInline label="Ciudad" value={payee?.city?.name ?? "—"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Cuenta registrada" description="Instantánea tomada al generar la liquidación." />
            <CardBody>
              {Object.keys(bankSnap).length === 0 ? (
                <Note tone="warning">El beneficiario no tiene cuenta bancaria registrada. No apruebes hasta obtenerla.</Note>
              ) : (
                <>
                  <StatInline label="Banco" value={bankSnap.bank ?? "—"} />
                  <StatInline label="Tipo" value={bankSnap.type ?? "—"} />
                  <StatInline label="Número" value={<MaskedAccount masked={maskAccount(bankSnap.number)} full={bankSnap.number} />} />
                  <StatInline label="Titular" value={bankSnap.holder ?? "—"} />
                </>
              )}
              {bankChanged ? <Note tone="warning" className="mt-3">La cuenta actual del beneficiario difiere de la registrada aquí. Verifica antes de pagar: {bankNow.bank} · {maskAccount(bankNow.number)}</Note> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Decisión" />
            <CardBody className="space-y-3">
              {s.approved_at ? (
                <p className="text-[13px] text-gray-700">
                  Aprobada por <strong>{actorName.get(s.approved_by ?? "") ?? "—"}</strong> el {fmtDateTime(s.approved_at)}.{s.approval_reason ? ` Motivo: ${s.approval_reason}` : ""}
                </p>
              ) : null}
              {s.paid_at ? (
                <p className="text-[13px] text-gray-700">
                  Pagada por <strong>{actorName.get(s.paid_by ?? "") ?? "—"}</strong> el {fmtDateTime(s.paid_at)}. Referencia: <span className="font-mono">{s.payment_reference ?? "—"}</span>
                </p>
              ) : null}
              <SettlementActions id={s.id} status={s.status} net={formatCOP(s.net, true)} payee={payeeName} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
