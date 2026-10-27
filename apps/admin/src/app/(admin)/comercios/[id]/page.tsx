import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { formatCOP, type MerchantCategory } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signDocuments, docLabel } from "@/lib/storage";
import { bogotaDayStart, daysAgoISO, fmtDate, fmtDateTime, fmtPercent, formatRating, maskAccount } from "@/lib/format";
import { MERCHANT_REQUIRED_DOCS, docsBlocker, docsReadiness } from "@/lib/documents";
import { canAccess, canEditCommission, canManageFinance, canManageMerchants } from "@/lib/roles";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { KPI, StatInline } from "@/components/ui/kpi";
import { Badge, DocStatusBadge, MerchantStatusBadge, OrderStatusBadge, SettlementStatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { MaskedAccount } from "@/components/ui/masked-account";
import { CommissionDialog, DocumentReview, MerchantStatusActions, ProductToggle } from "./merchant-actions";

export const metadata: Metadata = { title: "Ficha del comercio" };

const CATEGORY_LABEL: Record<MerchantCategory, string> = { food: "Comida", market: "Mercado", pharmacy: "Farmacia" };
const WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const PRODUCT_STATUS: Record<string, { label: string; tone: "green" | "yellow" | "gray" }> = {
  published: { label: "Publicado", tone: "green" },
  paused: { label: "Pausado", tone: "yellow" },
  draft: { label: "Borrador", tone: "gray" },
};
type Tab = "resumen" | "documentos" | "catalogo" | "horarios" | "liquidaciones" | "pedidos";

export default async function MerchantDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [ctx, { id }, sp] = await Promise.all([requireSection("comercios"), params, searchParams]);
  const supabase = await createClient();

  const { data: m } = await supabase.from("merchants").select("*, city:cities(name)").eq("id", id).maybeSingle();
  if (!m) notFound();

  // Liquidaciones solo para roles con Finanzas (operaciones no las ve: la RLS las oculta y su detalle da 404).
  const showSettlements = canAccess(ctx.role, "finanzas");
  const tabs: Tab[] = ["resumen", "documentos", "catalogo", "horarios", ...(showSettlements ? (["liquidaciones"] as const) : []), "pedidos"];
  const tab: Tab = tabs.includes(sp.tab as Tab) ? (sp.tab as Tab) : m.status === "pending" || m.status === "under_review" ? "documentos" : "resumen";
  const canManage = canManageMerchants(ctx.role);
  const canCommission = canEditCommission(ctx.role);
  const canOpenOrders = canAccess(ctx.role, "pedidos");

  const [{ data: docs }, { data: orders30 }, { data: owner }, { count: docsPending }] = await Promise.all([
    supabase.from("merchant_documents").select("id,doc_type,file_path,status,notes,reviewed_at,created_at").eq("merchant_id", id).order("created_at"),
    supabase.from("orders").select("status,items_subtotal,commission_amount,merchant_payout,delivered_at,placed_at").eq("merchant_id", id).gte("placed_at", bogotaDayStart(daysAgoISO(30))).limit(5000),
    m.owner_id ? supabase.from("profiles").select("full_name,email,phone").eq("id", m.owner_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("merchant_documents").select("id", { count: "exact", head: true }).eq("merchant_id", id).eq("status", "pending"),
  ]);

  const delivered = (orders30 ?? []).filter((o) => o.status === "delivered");
  const cancelled = (orders30 ?? []).filter((o) => o.status === "cancelled");
  const sales = delivered.reduce((a, o) => a + o.items_subtotal, 0);
  const commissions = delivered.reduce((a, o) => a + o.commission_amount, 0);
  const payouts = delivered.reduce((a, o) => a + o.merchant_payout, 0);

  const reviewing = m.status === "pending" || m.status === "under_review" || m.status === "rejected";
  const approveBlocker = reviewing ? docsBlocker(docsReadiness(MERCHANT_REQUIRED_DOCS, docs ?? [])) : null;

  const bank = (m.bank_account && typeof m.bank_account === "object" && !Array.isArray(m.bank_account) ? m.bank_account : {}) as Record<string, string | undefined>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={m.name} src={m.logo_url} size="lg" />
          <div>
            <p className="text-[13px] text-muted">
              <Link href="/comercios" className="hover:text-carbon">
                Comercios
              </Link>{" "}
              › {m.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-xl font-bold text-carbon">{m.name}</h1>
              <MerchantStatusBadge status={m.status} />
              <Badge tone="neutral">{CATEGORY_LABEL[m.category]}</Badge>
              {m.featured ? <Badge tone="yellow">Destacado</Badge> : null}
            </div>
            <p className="text-sm text-muted mt-0.5">
              {m.tagline ? `${m.tagline} · ` : ""}
              {m.city?.name ?? "—"} · {m.address ?? "Sin dirección"} · Registrado {fmtDate(m.created_at)}
            </p>
          </div>
        </div>
        {canManage ? <MerchantStatusActions id={m.id} status={m.status} approveBlocker={approveBlocker} /> : null}
      </div>

      {canManage && approveBlocker ? <Note tone="warning">{approveBlocker}</Note> : null}
      {m.review_notes ? <Note tone={m.status === "rejected" || m.status === "suspended" ? "danger" : "neutral"}>Última nota de revisión: {m.review_notes}</Note> : null}

      <Tabs
        active={tab}
        items={[
          { key: "resumen", label: "Resumen", href: `/comercios/${id}?tab=resumen` },
          { key: "documentos", label: "Documentos", count: docsPending ?? 0, href: `/comercios/${id}?tab=documentos` },
          { key: "catalogo", label: "Catálogo", href: `/comercios/${id}?tab=catalogo` },
          { key: "horarios", label: "Horarios", href: `/comercios/${id}?tab=horarios` },
          ...(showSettlements ? [{ key: "liquidaciones", label: "Liquidaciones", href: `/comercios/${id}?tab=liquidaciones` }] : []),
          { key: "pedidos", label: "Pedidos", href: `/comercios/${id}?tab=pedidos` },
        ]}
      />

      {tab === "resumen" ? (
        <div className="space-y-5">
          <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            <KPI label="Ventas 30 días" value={formatCOP(sales, true)} hint="Productos vendidos · no son ingresos de YAVA" />
            <KPI label="Pedidos entregados 30 d" value={delivered.length} hint={`${cancelled.length} cancelado(s)`} tone="green" />
            <KPI label="Comisión generada 30 d" value={formatCOP(commissions, true)} hint={`Tasa actual ${fmtPercent(m.commission_rate, 1)}`} tone="blue" />
            <KPI label="Calificación" value={m.rating_count > 0 ? `★ ${formatRating(m.rating_avg)}` : "—"} hint={`${m.rating_count} valoraciones`} />
          </div>
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader title="Datos del comercio" />
              <CardBody>
                <StatInline label="Razón social" value={m.legal_name ?? "—"} />
                <StatInline label="NIT" value={m.tax_id ?? "—"} />
                <StatInline label="Teléfono" value={m.phone ?? "—"} />
                <StatInline label="Responsable" value={owner?.full_name ?? "—"} />
                <StatInline label="Correo" value={owner?.email ?? "—"} />
                <StatInline label="Acepta pedidos" value={m.accepts_orders ? "Sí" : "No"} />
                <StatInline label="Cerrado manualmente" value={m.manual_closed ? "Sí" : "No"} />
                <StatInline label="Tiempo de preparación" value={`${m.prep_min}–${m.prep_max} min`} />
                <StatInline label="Pedido mínimo" value={formatCOP(m.min_order)} />
                <StatInline label="Tarifa de envío" value={formatCOP(m.delivery_fee)} />
              </CardBody>
            </Card>
            <div className="space-y-5">
              <Card>
                <CardHeader title="Condiciones económicas" action={canCommission ? <CommissionDialog id={m.id} currentRate={m.commission_rate} /> : null} />
                <CardBody>
                  <StatInline label="Comisión YAVA" value={fmtPercent(m.commission_rate, 1)} />
                  <StatInline label="Pagado al comercio 30 d" value={formatCOP(payouts, true)} />
                  {!canCommission ? <p className="text-xs text-muted mt-2">Solo owner o finanzas pueden editar la comisión.</p> : null}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Cuenta bancaria" description="Se usa en las liquidaciones; revísala antes de aprobar pagos." />
                <CardBody>
                  {Object.keys(bank).length === 0 ? (
                    <p className="text-sm text-muted">Sin cuenta registrada.</p>
                  ) : (
                    <>
                      <StatInline label="Banco" value={bank.bank ?? "—"} />
                      <StatInline label="Tipo" value={bank.type ?? "—"} />
                      <StatInline label="Número" value={<MaskedAccount masked={maskAccount(bank.number)} full={canManageFinance(ctx.role) ? bank.number : null} />} />
                      <StatInline label="Titular" value={bank.holder ?? "—"} />
                    </>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
          {m.description ? (
            <Card>
              <CardHeader title="Descripción" />
              <CardBody>
                <p className="text-sm text-gray-700">{m.description}</p>
                {m.tags.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {m.tags.map((t) => (
                      <Badge key={t} tone="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "documentos" ? <DocumentsTab merchantId={id} docs={docs ?? []} canManage={canManage} /> : null}
      {tab === "catalogo" ? <CatalogTab merchantId={id} canManage={canManage} /> : null}
      {tab === "horarios" ? <HoursTab merchantId={id} /> : null}
      {tab === "liquidaciones" && showSettlements ? <SettlementsTab merchantId={id} /> : null}
      {tab === "pedidos" ? <OrdersTab merchantId={id} linkOrders={canOpenOrders} /> : null}
    </div>
  );
}

async function DocumentsTab({ merchantId, docs, canManage }: { merchantId: string; docs: { id: string; doc_type: string; file_path: string; status: string; notes: string | null; reviewed_at: string | null; created_at: string }[]; canManage: boolean }) {
  const supabase = await createClient();
  const urls = await signDocuments(supabase, docs.map((d) => d.file_path));
  return (
    <Card>
      <CardHeader title="Documentos del comercio" description="Archivos privados; los enlaces caducan en una hora." />
      {docs.length === 0 ? (
        <EmptyState icon={FileText} title="Sin documentos cargados" description="El comercio aún no ha subido documentación." />
      ) : (
        <DataTable
          rows={docs}
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
                  {canManage && d.status === "pending" ? <DocumentReview docId={d.id} merchantId={merchantId} /> : null}
                </span>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}

async function CatalogTab({ merchantId, canManage }: { merchantId: string; canManage: boolean }) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id,name,price,status,track_stock,stock,image_urls,category:product_categories(name)")
    .eq("merchant_id", merchantId)
    .order("sort")
    .order("name");
  return (
    <Card>
      <CardHeader title="Catálogo" description={`${products?.length ?? 0} producto(s)`} />
      <DataTable
        rows={products ?? []}
        rowKey={(p) => p.id}
        emptyTitle="Sin productos"
        columns={[
          {
            key: "n",
            header: "Producto",
            cell: (p) => (
              <span className="flex items-center gap-3">
                {p.image_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_urls[0]} alt="" className="h-9 w-9 rounded object-cover bg-gray-100" />
                ) : (
                  <span className="h-9 w-9 rounded bg-gray-100" aria-hidden />
                )}
                <span>
                  <span className="block font-medium">{p.name}</span>
                  <span className="block text-xs text-muted">{p.category?.name ?? "Sin categoría"}</span>
                </span>
              </span>
            ),
          },
          { key: "p", header: "Precio", align: "right", cell: (p) => <span className="tabular-nums">{formatCOP(p.price)}</span> },
          { key: "st", header: "Existencias", align: "right", cell: (p) => (p.track_stock ? <span className={`tabular-nums ${(p.stock ?? 0) === 0 ? "text-red" : ""}`}>{p.stock ?? 0}</span> : <span className="text-gray-400">—</span>) },
          { key: "s", header: "Estado", cell: (p) => <Badge tone={PRODUCT_STATUS[p.status]?.tone ?? "gray"}>{PRODUCT_STATUS[p.status]?.label ?? p.status}</Badge> },
          { key: "a", header: "", align: "right", cell: (p) => (canManage ? <ProductToggle productId={p.id} merchantId={merchantId} status={p.status} /> : null) },
        ]}
      />
    </Card>
  );
}

async function HoursTab({ merchantId }: { merchantId: string }) {
  const supabase = await createClient();
  const { data: hours } = await supabase.from("merchant_hours").select("id,weekday,opens,closes").eq("merchant_id", merchantId).order("weekday").order("opens");
  const byDay = new Map<number, { opens: string; closes: string }[]>();
  for (const h of hours ?? []) byDay.set(h.weekday, [...(byDay.get(h.weekday) ?? []), { opens: h.opens, closes: h.closes }]);
  return (
    <Card>
      <CardHeader title="Horarios de atención" description="Horario local (America/Bogota). Lo edita el comercio desde la app." />
      <CardBody>
        <ul className="divide-y divide-border">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <li key={d} className="py-2 flex items-center justify-between text-sm">
              <span className="font-medium">{WEEKDAY[d]}</span>
              <span className="text-gray-700 tabular-nums">{byDay.get(d)?.map((r) => `${r.opens.slice(0, 5)} – ${r.closes.slice(0, 5)}`).join(" · ") ?? <span className="text-gray-400">Cerrado</span>}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

async function SettlementsTab({ merchantId }: { merchantId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settlements").select("id,period_start,period_end,orders_count,gross,commissions,net,status,paid_at").eq("payee_type", "merchant").eq("payee_id", merchantId).order("period_end", { ascending: false }).limit(50);
  return (
    <Card>
      <CardHeader title="Liquidaciones" description="Pagos al comercio por período." />
      {error ? <Note className="m-5">No tienes permiso para ver liquidaciones (solo owner y finanzas).</Note> : null}
      <DataTable
        rows={data ?? []}
        rowKey={(s) => s.id}
        rowHref={(s) => `/finanzas/liquidaciones/${s.id}`}
        emptyTitle="Sin liquidaciones"
        columns={[
          { key: "p", header: "Período", cell: (s) => `${fmtDate(s.period_start)} – ${fmtDate(s.period_end)}` },
          { key: "o", header: "Pedidos", align: "right", cell: (s) => s.orders_count },
          { key: "g", header: "Ventas", align: "right", cell: (s) => <span className="tabular-nums">{formatCOP(s.gross)}</span> },
          { key: "c", header: "Comisión", align: "right", cell: (s) => <span className="tabular-nums">− {formatCOP(s.commissions)}</span> },
          { key: "n", header: "Neto", align: "right", cell: (s) => <span className="tabular-nums font-medium">{formatCOP(s.net, true)}</span> },
          { key: "s", header: "Estado", cell: (s) => <SettlementStatusBadge status={s.status} /> },
        ]}
      />
    </Card>
  );
}

async function OrdersTab({ merchantId, linkOrders }: { merchantId: string; linkOrders: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.from("order_summary").select("id,number,status,total,placed_at,customer_name,courier_name").eq("merchant_id", merchantId).order("placed_at", { ascending: false }).limit(50);
  return (
    <Card>
      <CardHeader title="Últimos pedidos" description="Los 50 más recientes." />
      <DataTable
        rows={data ?? []}
        rowKey={(o) => o.id ?? ""}
        rowHref={linkOrders ? (o) => `/pedidos/${o.id}` : undefined}
        emptyTitle="Sin pedidos"
        columns={[
          { key: "n", header: "Pedido", cell: (o) => <span className="font-medium">#{o.number}</span> },
          { key: "c", header: "Cliente", cell: (o) => o.customer_name ?? "—" },
          { key: "r", header: "Repartidor", cell: (o) => o.courier_name ?? <span className="text-gray-400">—</span> },
          { key: "s", header: "Estado", cell: (o) => <OrderStatusBadge status={o.status} /> },
          { key: "t", header: "Total", align: "right", cell: (o) => <span className="tabular-nums">{formatCOP(o.total)}</span> },
          { key: "d", header: "Fecha", align: "right", cell: (o) => <span className="text-muted">{fmtDateTime(o.placed_at)}</span> },
        ]}
      />
    </Card>
  );
}
