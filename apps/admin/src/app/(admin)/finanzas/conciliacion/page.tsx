import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { getSelectedCity } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { fetchOverview, parseRange, rangeBounds } from "@/lib/overview";
import { fmtDate, fmtDateTime, fmtNumber } from "@/lib/format";
import { canAccess } from "@/lib/roles";
import { firstParam, type SearchParams } from "@/lib/utils";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { StatInline } from "@/components/ui/kpi";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader, DemoNote } from "@/components/ui/page-header";
import { PAYMENT_METHOD_LABEL, PaymentStatusBadge } from "@/components/ui/badge";
import { RangeChips } from "@/components/range-chips";
import { FinanceTabs } from "../finance-tabs";

export const metadata: Metadata = { title: "Conciliación" };

export default async function ReconciliationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [ctx, sp, city] = await Promise.all([requireSection("finanzas"), searchParams, getSelectedCity()]);
  const range = parseRange(firstParam(sp.range));
  const { from, to } = rangeBounds(range);
  const supabase = await createClient();

  let ordersQ = supabase.from("orders").select("id,payment_method,payment_status,total,items_subtotal,delivery_fee,service_fee,discount,merchant_payout,courier_payout,gateway_fee,commission_amount,coupon_id").eq("status", "delivered").gte("delivered_at", from).lte("delivered_at", to).limit(20000);
  if (city) ordersQ = ordersQ.eq("city_id", city);

  const [overview, { data: orders }, { data: payments }] = await Promise.all([
    fetchOverview(supabase, from, to, city),
    ordersQ,
    supabase.from("payments").select("id,order_id,provider,provider_ref,amount,status,gateway_fee,created_at,order:orders!inner(number,city_id,delivered_at,status)").gte("created_at", from).lte("created_at", to).order("created_at", { ascending: false }).limit(200),
  ]);

  const rows = orders ?? [];
  const collected = overview.merchant_sales + overview.delivery_fees + overview.service_fees - overview.discounts;
  const toMerchants = overview.merchant_payouts;
  const toCouriers = overview.courier_payouts;
  const gateway = overview.gateway_fees;
  const yava = overview.yava_revenue - overview.discounts - gateway + (toMerchantsAdjust(rows));
  const distributed = toMerchants + toCouriers + gateway + yava;
  const diff = collected - distributed;
  const balanced = diff === 0;

  // Por método de pago
  const byMethod = new Map<string, { count: number; total: number; paid: number; pending: number; failed: number }>();
  for (const o of rows) {
    const cur = byMethod.get(o.payment_method) ?? { count: 0, total: 0, paid: 0, pending: 0, failed: 0 };
    cur.count += 1;
    cur.total += o.total;
    if (o.payment_status === "paid") cur.paid += o.total;
    else if (o.payment_status === "failed" || o.payment_status === "refunded") cur.failed += o.total;
    else cur.pending += o.total;
    byMethod.set(o.payment_method, cur);
  }

  const filteredPayments = (payments ?? []).filter((p) => !city || p.order?.city_id === city);

  return (
    <div className="space-y-5">
      <PageHeader title="Conciliación" description="Cobros por cuenta de terceros y su distribución" actions={<RangeChips active={range} searchParams={sp} basePath="/finanzas/conciliacion" />} />
      <FinanceTabs active="conciliacion" />

      <div className={`rounded-lg border p-4 flex items-center gap-3 ${balanced ? "border-green/40 bg-green-soft" : "border-red/40 bg-red-soft"}`} role="status">
        {balanced ? <CheckCircle2 className="h-5 w-5 text-green" aria-hidden /> : <AlertTriangle className="h-5 w-5 text-red" aria-hidden />}
        <div>
          <p className={`text-sm font-semibold ${balanced ? "text-green" : "text-red"}`}>{balanced ? "La conciliación cuadra: diferencia $0" : `Diferencia de ${formatCOP(diff, true)}`}</p>
          <p className="text-xs text-gray-700">
            Cobrado a clientes {formatCOP(collected, true)} · Distribuido {formatCOP(distributed, true)} · {fmtNumber(overview.delivered)} pedidos entregados del {fmtDate(from)} al {fmtDate(to)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader title="Total cobrado a clientes" description="Productos + envío + servicio − descuentos" />
          <CardBody>
            <StatInline label="Productos de los comercios" value={formatCOP(overview.merchant_sales, true)} />
            <StatInline label="+ Envío" value={formatCOP(overview.delivery_fees, true)} />
            <StatInline label="+ Tarifa de servicio" value={formatCOP(overview.service_fees, true)} />
            <StatInline label="− Descuentos" value={`− ${formatCOP(overview.discounts, true)}`} />
            <div className="border-t border-border my-1" />
            <div className="flex items-baseline justify-between py-1.5">
              <span className="font-semibold">= Total cobrado</span>
              <span className="font-bold text-lg tabular-nums">{formatCOP(collected, true)}</span>
            </div>
            <p className="text-xs text-muted mt-1">Recaudo registrado en pedidos: {formatCOP(overview.collected, true)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Distribución del total cobrado" description="A quién pertenece cada peso recaudado" />
          <CardBody>
            <StatInline label="Comercios (neto a pagar)" value={formatCOP(toMerchants, true)} />
            <StatInline label="+ Repartidores (tarifas de entrega)" value={formatCOP(toCouriers, true)} />
            <StatInline label="+ Costos de pasarela" value={formatCOP(gateway, true)} />
            <StatInline label="+ Contribución YAVA" value={formatCOP(yava, true)} />
            <div className="border-t border-border my-1" />
            <div className="flex items-baseline justify-between py-1.5">
              <span className="font-semibold">= Distribuido</span>
              <span className="font-bold text-lg tabular-nums">{formatCOP(distributed, true)}</span>
            </div>
            <div className={`flex items-baseline justify-between py-1.5 font-semibold ${balanced ? "text-green" : "text-red"}`}>
              <span>Diferencia</span>
              <span className="tabular-nums">{formatCOP(diff, true)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Por método de pago" description="Pedidos entregados en el período según su método y estado de pago." />
        <DataTable
          dense
          rows={[...byMethod.entries()].map(([method, v]) => ({ method, ...v }))}
          rowKey={(r) => r.method}
          emptyTitle="Sin pedidos entregados"
          columns={[
            { key: "m", header: "Método", cell: (r) => <span className="font-medium">{PAYMENT_METHOD_LABEL[r.method] ?? r.method}</span> },
            { key: "c", header: "Pedidos", align: "right", cell: (r) => fmtNumber(r.count) },
            { key: "t", header: "Total", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.total, true)}</span> },
            { key: "p", header: "Pagado", align: "right", cell: (r) => <span className="tabular-nums text-green">{formatCOP(r.paid, true)}</span> },
            { key: "pe", header: "Pendiente", align: "right", cell: (r) => <span className="tabular-nums">{formatCOP(r.pending, true)}</span> },
            { key: "f", header: "Fallido / reembolsado", align: "right", cell: (r) => <span className={`tabular-nums ${r.failed ? "text-red" : ""}`}>{formatCOP(r.failed, true)}</span> },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Transacciones de pasarela" description="Registros de `payments` con referencia del proveedor (últimas 200 del período)." />
        <DataTable
          dense
          rows={filteredPayments}
          rowKey={(p) => p.id}
          emptyTitle="Sin transacciones de pasarela en el período"
          emptyDescription="Los pagos en efectivo no generan registros de pasarela."
          columns={[
            { key: "d", header: "Fecha", cell: (p) => <span className="text-muted">{fmtDateTime(p.created_at)}</span> },
            { key: "o", header: "Pedido", cell: (p) => (canAccess(ctx.role, "pedidos") ? <Link href={`/pedidos/${p.order_id}`} className="text-blue hover:underline font-medium">#{p.order?.number}</Link> : <span className="font-medium">#{p.order?.number}</span>) },
            { key: "prov", header: "Proveedor", cell: (p) => p.provider },
            { key: "ref", header: "Referencia", cell: (p) => <span className="font-mono text-xs">{p.provider_ref ?? "—"}</span> },
            { key: "s", header: "Estado", cell: (p) => <PaymentStatusBadge status={p.status} /> },
            { key: "a", header: "Monto", align: "right", cell: (p) => <span className="tabular-nums">{formatCOP(p.amount, true)}</span> },
            { key: "g", header: "Pasarela", align: "right", cell: (p) => <span className="tabular-nums text-muted">{formatCOP(p.gateway_fee)}</span> },
          ]}
        />
      </Card>
      <Note>Los pedidos en efectivo se cobran por el repartidor; su conciliación con el saldo del repartidor se revisa en Liquidaciones.</Note>
      <DemoNote />
    </div>
  );
}

/**
 * Cuando un cupón lo financia el comercio, el descuento sale del pago al comercio (no de YAVA).
 * Ajuste para que la distribución cuadre con lo cobrado: suma los descuentos que no financia YAVA.
 */
function toMerchantsAdjust(rows: { items_subtotal: number; commission_amount: number; merchant_payout: number; discount: number }[]): number {
  let adj = 0;
  for (const o of rows) {
    const expectedPayout = o.items_subtotal - o.commission_amount;
    const merchantFunded = expectedPayout - o.merchant_payout; // > 0 si el comercio financió el descuento
    if (merchantFunded > 0) adj += merchantFunded;
  }
  return adj;
}
