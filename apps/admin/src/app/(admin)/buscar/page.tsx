import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShoppingBag, Store, User } from "lucide-react";
import { formatCOP } from "@yava/shared";
import { requireSection } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";
import { canAccess } from "@/lib/roles";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { MerchantStatusBadge, OrderStatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Búsqueda" };
const ROLE_LABEL: Record<string, string> = { customer: "Cliente", merchant: "Comercio", courier: "Repartidor", admin: "Equipo" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [ctx, sp] = await Promise.all([requireSection("buscar"), searchParams]);
  const q = (sp.q ?? "").trim();
  if (!q) {
    return (
      <div>
        <PageHeader title="Búsqueda" />
        <Card>
          <EmptyState icon={Search} title="Escribe algo para buscar" description="Pedidos por número, comercios por nombre y usuarios por nombre, correo o teléfono." />
        </Card>
      </div>
    );
  }
  const supabase = await createClient();
  const safe = q.replace(/[%,()]/g, " ");
  const num = Number.parseInt(q.replace("#", ""), 10);
  const isNum = Number.isFinite(num) && /^#?\d+$/.test(q);

  const [{ data: orders }, { data: merchants }, { data: profiles }] = await Promise.all([
    canAccess(ctx.role, "pedidos")
      ? (isNum
          ? supabase.from("order_summary").select("id,number,status,total,merchant_name,customer_name,placed_at").eq("number", num).limit(20)
          : supabase.from("order_summary").select("id,number,status,total,merchant_name,customer_name,placed_at").or(`customer_name.ilike.%${safe}%,merchant_name.ilike.%${safe}%`).order("placed_at", { ascending: false }).limit(20))
      : Promise.resolve({ data: [] }),
    canAccess(ctx.role, "comercios") ? supabase.from("merchants").select("id,name,status,category,logo_url,city:cities(name)").ilike("name", `%${safe}%`).limit(20) : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id,full_name,email,phone,role,avatar_url").or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`).limit(20),
  ]);

  const total = (orders?.length ?? 0) + (merchants?.length ?? 0) + (profiles?.length ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader title={`Resultados para “${q}”`} description={`${total} coincidencia(s)`} />
      {total === 0 ? (
        <Card>
          <EmptyState icon={Search} title="Sin resultados" description="Prueba con el número de pedido, el nombre del comercio o el correo del usuario." />
        </Card>
      ) : null}

      {(orders?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-gray-500" /> Pedidos</span>} />
          <DataTable
            dense
            rows={orders ?? []}
            rowKey={(o) => o.id ?? ""}
            rowHref={(o) => `/pedidos/${o.id}`}
            columns={[
              { key: "n", header: "Pedido", cell: (o) => <span className="font-medium">#{o.number}</span> },
              { key: "m", header: "Comercio", cell: (o) => o.merchant_name ?? "Envío" },
              { key: "c", header: "Cliente", cell: (o) => o.customer_name ?? "—" },
              { key: "s", header: "Estado", cell: (o) => <OrderStatusBadge status={o.status} /> },
              { key: "t", header: "Total", align: "right", cell: (o) => formatCOP(o.total, true) },
              { key: "d", header: "Fecha", align: "right", cell: (o) => <span className="text-muted">{fmtDateTime(o.placed_at)}</span> },
            ]}
          />
        </Card>
      ) : null}

      {(merchants?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-gray-500" /> Comercios</span>} />
          <DataTable
            dense
            rows={merchants ?? []}
            rowKey={(m) => m.id}
            rowHref={(m) => `/comercios/${m.id}`}
            columns={[
              { key: "n", header: "Comercio", cell: (m) => <span className="flex items-center gap-2"><Avatar name={m.name} src={m.logo_url} size="sm" /> <span className="font-medium">{m.name}</span></span> },
              { key: "c", header: "Ciudad", cell: (m) => <span className="text-muted">{m.city?.name ?? "—"}</span> },
              { key: "s", header: "Estado", cell: (m) => <MerchantStatusBadge status={m.status} /> },
            ]}
          />
        </Card>
      ) : null}

      {(profiles?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /> Usuarios</span>} />
          <DataTable
            dense
            rows={profiles ?? []}
            rowKey={(p) => p.id}
            rowHref={(p) => (p.role === "courier" && canAccess(ctx.role, "repartidores") ? `/repartidores/${p.id}` : canAccess(ctx.role, "pedidos") ? `/pedidos?q=${encodeURIComponent(p.full_name ?? "")}` : undefined)}
            columns={[
              { key: "n", header: "Nombre", cell: (p) => <span className="flex items-center gap-2"><Avatar name={p.full_name} src={p.avatar_url} size="sm" /> <span className="font-medium">{p.full_name ?? "Sin nombre"}</span></span> },
              { key: "e", header: "Correo", cell: (p) => <span className="text-muted">{p.email ?? "—"}</span> },
              { key: "t", header: "Teléfono", cell: (p) => <span className="text-muted">{p.phone ?? "—"}</span> },
              { key: "r", header: "Rol", cell: (p) => <Badge tone="neutral">{ROLE_LABEL[p.role] ?? p.role}</Badge> },
            ]}
          />
        </Card>
      ) : null}
      {canAccess(ctx.role, "pedidos") || canAccess(ctx.role, "comercios") ? (
        <p className="text-xs text-muted">
          ¿No encuentras lo que buscas? Usa los filtros de{" "}
          {canAccess(ctx.role, "pedidos") ? <Link href="/pedidos" className="text-blue hover:underline">Pedidos</Link> : null}
          {canAccess(ctx.role, "pedidos") && canAccess(ctx.role, "comercios") ? " o " : null}
          {canAccess(ctx.role, "comercios") ? <Link href="/comercios" className="text-blue hover:underline">Comercios</Link> : null}.
        </p>
      ) : null}
    </div>
  );
}
