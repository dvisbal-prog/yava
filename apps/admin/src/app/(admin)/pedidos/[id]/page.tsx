import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageSquare, Phone } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, formatCOP, type Json } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, fmtTime, fmtPercent } from "@/lib/format";
import { canAccess, canManageOrders } from "@/lib/roles";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { Badge, OrderStatusBadge, PAYMENT_METHOD_LABEL, PaymentStatusBadge, ORDER_STATUS_TONE } from "@/components/ui/badge";
import { StatInline } from "@/components/ui/kpi";
import { EmptyState } from "@/components/ui/empty-state";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { OrderActions } from "./order-actions";

export const metadata: Metadata = { title: "Detalle del pedido" };

function addr(snapshot: Json | null): { line1: string; line2: string | null; city: string | null; instructions: string | null } {
  const o = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
  const g = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);
  return { line1: g("line1") ?? "—", line2: g("line2"), city: g("city"), instructions: g("instructions") };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireSection("pedidos"), params]);
  const supabase = await createClient();

  const { data: order } = await supabase.from("order_summary").select("*").eq("id", id).maybeSingle();
  if (!order || !order.id || !order.status) notFound();

  const [{ data: items }, { data: events }, { data: payments }, { data: messages }, { data: eventActors }] = await Promise.all([
    supabase.from("order_items").select("id,name,qty,unit_price,total,options,notes").eq("order_id", id),
    supabase.from("order_events").select("id,status,note,created_at,actor_id").eq("order_id", id).order("created_at"),
    supabase.from("payments").select("id,provider,provider_ref,amount,status,gateway_fee,created_at").eq("order_id", id).order("created_at"),
    supabase.from("order_messages").select("id,sender_id,body,created_at").eq("order_id", id).order("created_at"),
    supabase.from("profiles").select("id,full_name").in("id", [order.customer_id ?? "", order.courier_id ?? ""].filter(Boolean)),
  ]);

  const names = new Map((eventActors ?? []).map((p) => [p.id, p.full_name ?? "—"]));
  const delivery = addr(order.address_snapshot);
  const pickup = order.pickup_snapshot ? addr(order.pickup_snapshot) : null;
  const canManage = canManageOrders(ctx.role);

  return (
    <div className="space-y-5">
      <RealtimeRefresh table="orders" filter={`id=eq.${id}`} />
      <RealtimeRefresh table="order_messages" filter={`order_id=eq.${id}`} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            <Link href="/pedidos" className="hover:text-carbon">
              Pedidos
            </Link>{" "}
            › Pedido #{order.number}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-bold text-carbon">Pedido #{order.number}</h1>
            <OrderStatusBadge status={order.status} />
            <Badge tone="neutral">{order.type ? ORDER_TYPE_LABEL[order.type] : ""}</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">
            Recibido {fmtDateTime(order.placed_at)} · {order.city_name ?? "—"}
          </p>
        </div>
        {canManage ? <OrderActions id={order.id} status={order.status} hasCourier={Boolean(order.courier_id)} /> : <Note>Tu rol solo permite consultar pedidos.</Note>}
      </div>

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Línea de tiempo" />
            <CardBody>
              {(events ?? []).length === 0 ? (
                <EmptyState title="Sin eventos" />
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {(events ?? []).map((e) => (
                    <li key={e.id} className="pl-5 relative">
                      <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${dotColor(ORDER_STATUS_TONE[e.status])}`} aria-hidden />
                      <p className="text-sm font-medium text-carbon">{ORDER_STATUS_LABEL[e.status]}</p>
                      <p className="text-xs text-muted">
                        {fmtDateTime(e.created_at)}
                        {e.actor_id ? ` · ${names.get(e.actor_id) ?? "Sistema"}` : ""}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              {order.cancel_reason ? <Note tone="danger" className="mt-4">Motivo de cancelación: {order.cancel_reason}</Note> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={order.type === "shipment" ? "Paquete" : "Ítems"} description={order.type === "shipment" ? "Envío punto a punto" : `${order.items_count ?? 0} producto(s)`} />
            <CardBody>
              {order.type === "shipment" ? (
                <pre className="text-[13px] text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-3">{JSON.stringify(order.package_details ?? {}, null, 2)}</pre>
              ) : (
                <ul className="divide-y divide-border">
                  {(items ?? []).map((it) => (
                    <li key={it.id} className="py-2.5 flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-carbon">
                          {it.qty} × {it.name}
                        </p>
                        {Array.isArray(it.options) && it.options.length > 0 ? (
                          <p className="text-xs text-muted">{(it.options as { name?: string }[]).map((o) => o.name).filter(Boolean).join(", ")}</p>
                        ) : null}
                        {it.notes ? <p className="text-xs text-muted italic">“{it.notes}”</p> : null}
                      </div>
                      <span className="tabular-nums">{formatCOP(it.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Chat del pedido" description="Solo lectura · conversación cliente ↔ repartidor" />
            <CardBody>
              {(messages ?? []).length === 0 ? (
                <EmptyState icon={MessageSquare} title="Sin mensajes" />
              ) : (
                <ul className="space-y-2">
                  {(messages ?? []).map((m) => {
                    const mine = m.sender_id === order.courier_id;
                    return (
                      <li key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-gray-100 text-carbon" : "bg-blue-soft text-blue-dark"}`}>
                          <p className="text-[11px] opacity-70 mb-0.5">
                            {mine ? (order.courier_name ?? "Repartidor") : (order.customer_name ?? "Cliente")} · {fmtTime(m.created_at)}
                          </p>
                          {m.body}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Desglose económico" />
            <CardBody>
              <StatInline label="Productos" value={formatCOP(order.items_subtotal)} />
              <StatInline label="Envío" value={formatCOP(order.delivery_fee)} />
              <StatInline label="Tarifa de servicio" value={formatCOP(order.service_fee)} />
              <StatInline label="Descuento" value={`− ${formatCOP(order.discount)}`} />
              <div className="border-t border-border my-1" />
              <div className="flex items-baseline justify-between py-1.5">
                <span className="font-semibold">Total cobrado</span>
                <span className="font-bold text-lg tabular-nums">{formatCOP(order.total, true)}</span>
              </div>
              <div className="border-t border-border my-1" />
              <StatInline label={`Comisión YAVA (${fmtPercent(order.commission_rate)})`} value={formatCOP(order.commission_amount)} muted />
              <StatInline label="Pago al comercio" value={formatCOP(order.merchant_payout)} muted />
              <StatInline label="Pago al repartidor" value={formatCOP(order.courier_payout)} muted />
              <StatInline label="Costo de pasarela" value={formatCOP(order.gateway_fee)} muted />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pago" />
            <CardBody>
              <StatInline label="Método" value={PAYMENT_METHOD_LABEL[order.payment_method ?? ""] ?? order.payment_method} />
              <StatInline label="Estado" value={<PaymentStatusBadge status={order.payment_status} />} />
              {(payments ?? []).length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {(payments ?? []).map((p) => (
                    <li key={p.id} className="text-[13px] flex items-center justify-between gap-2">
                      <span className="text-muted truncate">
                        {p.provider} · {p.provider_ref ?? "sin referencia"}
                      </span>
                      <span className="flex items-center gap-2">
                        <PaymentStatusBadge status={p.status} /> <span className="tabular-nums">{formatCOP(p.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted mt-2">Sin registros de pasarela (pago en efectivo o pendiente).</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Participantes" />
            <CardBody className="space-y-4">
              <Party label="Cliente" name={order.customer_name} phone={order.customer_phone} />
              {order.merchant_id ? (
                <Party label="Comercio" name={order.merchant_name} href={canAccess(ctx.role, "comercios") ? `/comercios/${order.merchant_id}` : undefined} />
              ) : pickup ? (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Recogida</p>
                  <p className="text-sm">{pickup.line1}</p>
                </div>
              ) : null}
              <Party label="Repartidor" name={order.courier_name ?? "Sin asignar"} phone={order.courier_phone} href={order.courier_id && canAccess(ctx.role, "repartidores") ? `/repartidores/${order.courier_id}` : undefined} />
              <div>
                <p className="text-xs text-muted uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Entrega
                </p>
                <p className="text-sm">
                  {delivery.line1}
                  {delivery.line2 ? `, ${delivery.line2}` : ""}
                </p>
                <p className="text-xs text-muted">{delivery.city ?? order.city_name}</p>
                {delivery.instructions ? <p className="text-xs text-muted italic mt-0.5">“{delivery.instructions}”</p> : null}
              </div>
              {order.notes ? <Note>Nota del cliente: {order.notes}</Note> : null}
              <p className="text-xs text-muted">
                Código de entrega: <span className="font-mono text-carbon">{order.delivery_code}</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Party({ label, name, phone, href }: { label: string; name: string | null | undefined; phone?: string | null; href?: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      {href ? (
        <Link href={href} className="text-sm font-medium text-blue hover:underline">
          {name ?? "—"}
        </Link>
      ) : (
        <p className="text-sm font-medium">{name ?? "—"}</p>
      )}
      {phone ? (
        <p className="text-xs text-muted flex items-center gap-1">
          <Phone className="h-3 w-3" /> {phone}
        </p>
      ) : null}
    </div>
  );
}

function dotColor(tone: string): string {
  switch (tone) {
    case "green":
      return "bg-green";
    case "red":
      return "bg-red";
    case "yellow":
      return "bg-yellow";
    case "orange":
      return "bg-orange";
    case "blue":
      return "bg-blue";
    default:
      return "bg-gray-300";
  }
}
