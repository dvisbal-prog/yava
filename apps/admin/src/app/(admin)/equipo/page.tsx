import type { Metadata } from "next";
import { headers } from "next/headers";
import { Check, X } from "lucide-react";
import type { AdminRole } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { fmtDateTime, fmtRelativeDay } from "@/lib/format";
import { ROLE_LABEL, ROLE_PERMISSIONS } from "@/lib/roles";
import { firstParam, type SearchParams } from "@/lib/utils";
import { Card, CardBody, CardHeader, Note } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { FilterForm, FilterSearch } from "@/components/filters";
import { CopyLink, InviteDialog, MemberActions } from "./team-dialogs";

export const metadata: Metadata = { title: "Equipo" };

const ROLE_TONE: Record<AdminRole, "blue" | "green" | "yellow" | "neutral"> = { owner: "blue", finance: "green", operations: "yellow", support: "neutral" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [ctx, sp] = await Promise.all([requireSection("equipo"), searchParams]);
  const supabase = await createClient();
  const q = (firstParam(sp.q) ?? "").trim().toLowerCase();
  const roleFilter = firstParam(sp.rol) ?? "";

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const siteUrl = env.siteUrl ?? `${proto}://${host}`;

  const [{ data: members }, { data: invitations }, { data: activity }] = await Promise.all([
    supabase.from("admin_users").select("user_id,role,status,accepted_at,created_at,profile:profiles!admin_users_user_id_fkey(full_name,email,avatar_url)").order("created_at"),
    supabase.from("admin_invitations").select("id,email,role,token,expires_at,accepted_at,created_at").is("accepted_at", null).order("created_at", { ascending: false }),
    supabase.from("audit_log").select("id,action,entity,entity_id,reason,created_at,actor_id").in("entity", ["admin_user", "admin_invitation"]).order("created_at", { ascending: false }).limit(15),
  ]);
  const actorIds = [...new Set((activity ?? []).map((a) => a.actor_id).filter((x): x is string => Boolean(x)))];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] };
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? "—"]));

  const filtered = (members ?? []).filter((m) => {
    if (roleFilter && m.role !== roleFilter) return false;
    if (!q) return true;
    return (m.profile?.full_name ?? "").toLowerCase().includes(q) || (m.profile?.email ?? "").toLowerCase().includes(q);
  });
  const pending = (invitations ?? []).filter((i) => new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-5">
      <PageHeader title="Equipo y permisos" description="Gestiona los integrantes de tu equipo y sus niveles de acceso." actions={<InviteDialog siteUrl={siteUrl} />} />

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Integrantes del equipo" description="Los permisos se asignan por rol." />
            <div className="px-5 pb-3">
              <FilterForm resetHref="/equipo">
                <FilterSearch value={q} placeholder="Buscar por nombre o correo" />
              </FilterForm>
            </div>
            <DataTable
              rows={filtered}
              rowKey={(m) => m.user_id}
              emptyTitle="Sin integrantes"
              columns={[
                {
                  key: "u",
                  header: "Usuario",
                  cell: (m) => (
                    <span className="flex items-center gap-3">
                      <Avatar name={m.profile?.full_name ?? m.profile?.email} src={m.profile?.avatar_url} size="sm" />
                      <span>
                        <span className="block font-medium">
                          {m.profile?.full_name ?? "Sin nombre"} {m.user_id === ctx.userId ? <span className="text-xs text-muted">(tú)</span> : null}
                        </span>
                        <span className="block text-xs text-muted">{m.profile?.email ?? "—"}</span>
                      </span>
                    </span>
                  ),
                },
                { key: "r", header: "Rol", cell: (m) => <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Badge> },
                { key: "s", header: "Estado", cell: (m) => (m.status === "active" ? <Badge tone="green" dot>Activo</Badge> : m.status === "disabled" ? <Badge tone="red" dot>Deshabilitado</Badge> : <Badge tone="yellow" dot>Invitación pendiente</Badge>) },
                { key: "d", header: "Desde", cell: (m) => <span className="text-muted text-[13px]">{fmtRelativeDay(m.accepted_at ?? m.created_at)}</span> },
                { key: "a", header: "", align: "right", cell: (m) => <MemberActions userId={m.user_id} role={m.role} status={m.status} isSelf={m.user_id === ctx.userId} /> },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Invitaciones pendientes" description="Enlaces válidos por 7 días. Comparte el enlace por un canal seguro." />
            {pending.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted">No hay invitaciones pendientes.</p>
              </CardBody>
            ) : (
              <CardBody className="space-y-4">
                {pending.map((i) => (
                  <div key={i.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium">{i.email}</p>
                        <p className="text-xs text-muted">
                          Rol {ROLE_LABEL[i.role]} · creada {fmtDateTime(i.created_at)} · vence {fmtDateTime(i.expires_at)}
                        </p>
                      </div>
                      <Badge tone="yellow">Pendiente</Badge>
                    </div>
                    <CopyLink url={`${siteUrl}/invitacion/${i.token}`} />
                  </div>
                ))}
                <Note tone="warning">El envío automático del correo de invitación se hará después; por ahora el enlace se comparte manualmente.</Note>
              </CardBody>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Permisos por rol" description="Qué puede hacer cada rol." />
            <CardBody className="space-y-4">
              {(Object.keys(ROLE_PERMISSIONS) as AdminRole[]).map((r) => (
                <div key={r}>
                  <p className="text-[13px] font-semibold mb-1">
                    <Badge tone={ROLE_TONE[r]}>{ROLE_LABEL[r]}</Badge>
                  </p>
                  <ul className="space-y-0.5">
                    {ROLE_PERMISSIONS[r].map((p) => (
                      <li key={p.label} className="flex items-center gap-2 text-[13px]">
                        {p.allowed ? <Check className="h-3.5 w-3.5 text-green" aria-label="Permitido" /> : <X className="h-3.5 w-3.5 text-gray-300" aria-label="No permitido" />}
                        <span className={p.allowed ? "text-gray-700" : "text-gray-400"}>{p.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Actividad reciente" description="Cambios de equipo e invitaciones." />
            <CardBody>
              {(activity ?? []).length === 0 ? (
                <p className="text-sm text-muted">Sin actividad registrada.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(activity ?? []).map((a) => (
                    <li key={a.id} className="py-2 text-[13px]">
                      <p className="text-carbon">
                        <span className="font-medium">{a.actor_id ? (actorName.get(a.actor_id) ?? "—") : "Sistema"}</span> · {a.action}
                      </p>
                      <p className="text-xs text-muted">
                        {fmtDateTime(a.created_at)}
                        {a.reason ? ` · ${a.reason}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
