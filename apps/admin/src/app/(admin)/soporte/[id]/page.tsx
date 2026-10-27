import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ChevronRight } from "lucide-react";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtAgo, fmtDateTime, fmtTime } from "@/lib/format";
import { canAccess, canManageSupport } from "@/lib/roles";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { StatInline } from "@/components/ui/kpi";
import { Badge, OrderStatusBadge, PriorityBadge, SupportStatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { CaseActions, Composer } from "./case-panel";

export const metadata: Metadata = { title: "Caso de soporte" };
const ROLE_LABEL: Record<string, string> = { customer: "Cliente", merchant: "Comercio", courier: "Repartidor", admin: "Equipo" };

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireSection("soporte"), params]);
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("support_cases")
    .select("*, opener:profiles!support_cases_opened_by_fkey(full_name,phone,email,avatar_url), assignee:profiles!support_cases_assigned_to_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const [{ data: messages }, { data: order }] = await Promise.all([
    supabase.from("support_messages").select("id,sender_id,body,internal,created_at").eq("case_id", id).order("created_at"),
    c.order_id ? supabase.from("order_summary").select("id,number,status,total,merchant_name,merchant_id,placed_at,address_snapshot,courier_name").eq("id", c.order_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id))];
  const { data: senders } = senderIds.length ? await supabase.from("profiles").select("id,full_name,avatar_url").in("id", senderIds) : { data: [] };
  const senderMap = new Map((senders ?? []).map((s) => [s.id, s]));
  const canManage = canManageSupport(ctx.role);
  const open = c.status === "open" || c.status === "in_progress";
  const address = order?.address_snapshot && typeof order.address_snapshot === "object" && !Array.isArray(order.address_snapshot) ? (order.address_snapshot as Record<string, unknown>) : {};

  return (
    <div className="space-y-5">
      <RealtimeRefresh table="support_messages" filter={`case_id=eq.${id}`} debounceMs={300} />
      <div>
        <p className="text-[13px] text-muted">
          <Link href="/soporte" className="hover:text-carbon">
            Soporte
          </Link>{" "}
          › Caso #S{c.number}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <h1 className="text-xl font-bold text-carbon">
            #S{c.number} · {c.subject}
          </h1>
          <SupportStatusBadge status={c.status} />
          <PriorityBadge priority={c.priority} />
          <Badge tone="neutral">{c.category}</Badge>
        </div>
        <p className="text-sm text-muted mt-0.5">
          Abierto por {c.opener?.full_name ?? "—"} ({ROLE_LABEL[c.opener_role] ?? c.opener_role}) {fmtAgo(c.created_at)} · {fmtDateTime(c.created_at)}
        </p>
      </div>

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Conversación" description={c.description ? undefined : "Sin descripción inicial"} />
            <CardBody className="space-y-3">
              {c.description ? (
                <div className="flex gap-3">
                  <Avatar name={c.opener?.full_name} src={c.opener?.avatar_url} size="sm" />
                  <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-2 text-sm">
                    <p className="text-[11px] text-muted mb-0.5">
                      {c.opener?.full_name ?? "Usuario"} · {fmtTime(c.created_at)}
                    </p>
                    {c.description}
                  </div>
                </div>
              ) : null}
              {(messages ?? []).length === 0 && !c.description ? <EmptyState title="Sin mensajes" /> : null}
              {(messages ?? []).map((m) => {
                const sender = senderMap.get(m.sender_id);
                const fromTeam = m.sender_id !== c.opened_by;
                return (
                  <div key={m.id} className={`flex gap-3 ${fromTeam ? "flex-row-reverse" : ""}`}>
                    <Avatar name={sender?.full_name} src={sender?.avatar_url} size="sm" />
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.internal ? "bg-yellow-soft border border-yellow/60 text-[#5c4400]" : fromTeam ? "bg-blue-soft text-blue-dark" : "bg-gray-100 text-carbon"}`}>
                      <p className="text-[11px] opacity-70 mb-0.5 flex items-center gap-1">
                        {m.internal ? <Lock className="h-3 w-3" aria-label="Nota interna" /> : null}
                        {sender?.full_name ?? (fromTeam ? "Equipo YAVA" : "Usuario")} · {fmtTime(m.created_at)}
                        {m.internal ? " · Nota interna" : ""}
                      </p>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
          {canManage ? <Composer caseId={c.id} disabled={!open} /> : <Note>Tu rol no puede responder casos.</Note>}
          {!open && c.resolution ? <Note tone="info">Resolución: {c.resolution}</Note> : null}
        </div>

        <div className="space-y-5">
          {order ? (
            <Card>
              <CardHeader title="Pedido relacionado" action={canAccess(ctx.role, "pedidos") ? <Link href={`/pedidos/${order.id}`} className="text-[13px] text-blue hover:underline inline-flex items-center">Ver pedido <ChevronRight className="h-3.5 w-3.5" /></Link> : null} />
              <CardBody>
                <StatInline label="Pedido" value={<span className="font-semibold">#{order.number}</span>} />
                <StatInline label="Estado" value={<OrderStatusBadge status={order.status} />} />
                <StatInline label="Comercio" value={order.merchant_id && canAccess(ctx.role, "comercios") ? <Link href={`/comercios/${order.merchant_id}`} className="text-blue hover:underline">{order.merchant_name}</Link> : (order.merchant_name ?? "Envío")} />
                <StatInline label="Total" value={formatCOP(order.total, true)} />
                <StatInline label="Hora del pedido" value={fmtTime(order.placed_at)} />
                <StatInline label="Repartidor" value={order.courier_name ?? "—"} />
                <StatInline label="Dirección" value={<span className="text-right">{String(address.line1 ?? "—")}{address.city ? `, ${String(address.city)}` : ""}</span>} />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Pedido relacionado" />
              <CardBody>
                <p className="text-sm text-muted">Este caso no está vinculado a un pedido.</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Quien abre el caso" />
            <CardBody>
              <StatInline label="Nombre" value={c.opener?.full_name ?? "—"} />
              <StatInline label="Rol" value={ROLE_LABEL[c.opener_role] ?? c.opener_role} />
              <StatInline label="Teléfono" value={c.opener?.phone ?? "—"} />
              <StatInline label="Correo" value={c.opener?.email ?? "—"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Acciones del caso" description={c.assignee ? `Asignado a ${c.assignee.full_name}` : "Sin asignar"} />
            <CardBody>{canManage ? <CaseActions caseId={c.id} status={c.status} assignedToMe={c.assigned_to === ctx.userId} priority={c.priority} /> : null}</CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
