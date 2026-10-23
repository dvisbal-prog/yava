import { NextResponse, type NextRequest } from "next/server";
import { ORDER_TYPE_LABEL, type OrderType } from "@yava/shared";
import { getAdminContext } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { fetchOverview, rangeBounds, parseRange } from "@/lib/overview";

function csvEscape(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exporta el reporte del período como CSV (separador `;`, compatible con Excel es-CO). */
export async function GET(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!canAccess(ctx.role, "reportes")) return new NextResponse("Sin acceso", { status: 404 });
  const sp = request.nextUrl.searchParams;
  const { from, to, fromDay, toDay } = rangeBounds(parseRange(sp.get("range") ?? undefined), sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const city = sp.get("city") || null;
  const showRevenue = canAccess(ctx.role, "finanzas");

  const supabase = await createClient();
  const [overview, { data: cities }] = await Promise.all([fetchOverview(supabase, from, to, city), supabase.from("cities").select("id,name")]);
  const cityName = city ? (cities ?? []).find((c) => c.id === city)?.name ?? city : "Todas";

  const lines: (string | number)[][] = [];
  lines.push(["YAVA · Reporte", `${fromDay} a ${toDay}`, `Ciudad: ${cityName}`]);
  lines.push([]);
  lines.push(["Indicador", "Valor"]);
  lines.push(["Pedidos entregados", overview.delivered]);
  lines.push(["Pedidos cancelados", overview.cancelled]);
  lines.push(["Ventas de comercios (COP)", overview.merchant_sales]);
  lines.push(["Ticket promedio (COP)", Math.round(overview.avg_ticket)]);
  if (showRevenue) {
    lines.push(["Ingresos YAVA (COP)", overview.yava_revenue]);
    lines.push(["Comisiones (COP)", overview.commissions]);
    lines.push(["Tarifas de servicio (COP)", overview.service_fees]);
    lines.push(["Descuentos (COP)", overview.discounts]);
    lines.push(["Costos de pasarela (COP)", overview.gateway_fees]);
  }
  lines.push([]);
  lines.push(["Ciudad", "Pedidos", "Ventas de comercios (COP)", ...(showRevenue ? ["Ingresos YAVA (COP)"] : [])]);
  for (const c of overview.by_city) lines.push([c.city, c.orders, c.sales, ...(showRevenue ? [c.revenue] : [])]);
  lines.push([]);
  lines.push(["Categoría", "Pedidos", "Ventas de comercios (COP)", ...(showRevenue ? ["Ingresos YAVA (COP)"] : [])]);
  for (const t of overview.by_type) lines.push([ORDER_TYPE_LABEL[t.type as OrderType] ?? t.type, t.orders, t.sales, ...(showRevenue ? [t.revenue] : [])]);

  const body = "﻿" + lines.map((l) => l.map(csvEscape).join(";")).join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yava-reporte-${fromDay}_${toDay}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
