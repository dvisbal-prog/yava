import type { AdminRole, Tables } from "@yava/shared";

export type OwnerAlertRow = Tables<"owner_alerts">;
export type CitySummaryRow = Tables<"city_summary">;

export interface OverviewByType { type: "food" | "market" | "pharmacy" | "shipment"; orders: number; sales: number; revenue: number }
export interface OverviewByCity { city: string; city_id: string; orders: number; sales: number; revenue: number }
export interface OverviewHourly { hour: number; orders: number }

export interface AdminOverview {
  merchant_sales: number;
  yava_revenue: number;
  commissions: number;
  service_fees: number;
  discounts: number;
  gateway_fees: number;
  collected: number;
  delivery_fees: number;
  merchant_payouts: number;
  courier_payouts: number;
  delivered: number;
  active: number;
  cancelled: number;
  avg_ticket: number;
  active_merchants: number;
  online_couriers: number;
  merchants_to_review: number;
  couriers_to_review: number;
  open_cases: number;
  pending_settlements: number;
  pending_merchant_settlements: number;
  pending_courier_settlements: number;
  opex: number;
  hourly: OverviewHourly[];
  by_type: OverviewByType[];
  by_city: OverviewByCity[];
}

export const EMPTY_OVERVIEW: AdminOverview = {
  merchant_sales: 0, yava_revenue: 0, commissions: 0, service_fees: 0, discounts: 0, gateway_fees: 0, collected: 0, delivery_fees: 0,
  merchant_payouts: 0, courier_payouts: 0, delivered: 0, active: 0, cancelled: 0, avg_ticket: 0, active_merchants: 0, online_couriers: 0,
  merchants_to_review: 0, couriers_to_review: 0, open_cases: 0, pending_settlements: 0, pending_merchant_settlements: 0, pending_courier_settlements: 0,
  opex: 0, hourly: [], by_type: [], by_city: [],
};

/** Resultado estimado = ingresos − descuentos YAVA − pasarela − gastos operativos. */
export function estimatedResult(o: AdminOverview): number {
  return o.yava_revenue - o.discounts - o.gateway_fees - o.opex;
}

export type RangeKey = "today" | "7d" | "30d";
export const RANGE_LABEL: Record<RangeKey, string> = { today: "Hoy", "7d": "7 días", "30d": "30 días" };

export function rangeFrom(key: RangeKey): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (key === "7d") d.setDate(d.getDate() - 6);
  if (key === "30d") d.setDate(d.getDate() - 29);
  return d.toISOString();
}

export function rangeTitle(key: RangeKey): string {
  const today = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  if (key === "today") return `Hoy ${today}`;
  return `${RANGE_LABEL[key]} · hasta ${today}`;
}

/** Panel web (Next.js). EXPO_PUBLIC_ADMIN_URL lo sobrescribe; sin barra final. */
export const ADMIN_URL = (process.env.EXPO_PUBLIC_ADMIN_URL || "https://yava-panel.vercel.app").replace(/\/+$/, "");

/** Rutas del panel web (apps/admin/src/app/(admin)). */
export const ADMIN_PATHS = {
  orders: "/pedidos",
  merchants: "/comercios",
  couriers: "/repartidores",
  settlements: "/finanzas/liquidaciones",
  reconciliation: "/finanzas/conciliacion",
  support: "/soporte",
  team: "/equipo",
} as const;

/** Roles de admin que usan la app de owners; el resto trabaja en el panel web. */
export const OWNER_APP_ROLES: readonly AdminRole[] = ["owner", "finance"];
export function canUseOwnerApp(role: AdminRole | null | undefined): boolean {
  return !!role && OWNER_APP_ROLES.includes(role);
}

/** owner_alerts solo es legible por el rol owner (RLS "alerts read" = is_owner()). */
export function canSeeAlerts(role: AdminRole | null | undefined): boolean {
  return role === "owner";
}

/** Secciones del panel web que solo ve el owner (equipo y soporte no están en el rol finanzas). */
export function canOpenOwnerOnlySections(role: AdminRole | null | undefined): boolean {
  return role === "owner";
}

export interface AlertTarget { path: string; label: string }

/**
 * Destino de una alerta en el panel web según `entity`. Con `entity_id` abre el detalle;
 * sin él, el listado de la sección. null si la entidad no tiene página.
 */
export function alertTarget(a: Pick<OwnerAlertRow, "entity" | "entity_id">): AlertTarget | null {
  const id = a.entity_id ? encodeURIComponent(a.entity_id) : null;
  switch (a.entity) {
    case "order":
    case "orders":
    case "orders_unassigned":
    case "orders_delayed":
      return { path: id ? `${ADMIN_PATHS.orders}/${id}` : ADMIN_PATHS.orders, label: "Revisar con operaciones" };
    case "merchant":
    case "merchants":
      return { path: id ? `${ADMIN_PATHS.merchants}/${id}` : ADMIN_PATHS.merchants, label: id ? "Ver solicitud" : "Ver solicitudes" };
    case "courier":
    case "couriers":
      return { path: id ? `${ADMIN_PATHS.couriers}/${id}` : ADMIN_PATHS.couriers, label: id ? "Ver solicitud" : "Ver solicitudes" };
    case "settlement":
    case "settlements":
      return { path: id ? `${ADMIN_PATHS.settlements}/${id}` : ADMIN_PATHS.settlements, label: "Ver liquidación" };
    case "support_case":
    case "support_cases":
    case "support":
      return { path: id ? `${ADMIN_PATHS.support}/${id}` : ADMIN_PATHS.support, label: "Ver caso" };
    case "payment":
    case "payments":
      return { path: ADMIN_PATHS.reconciliation, label: "Ver conciliación" };
    default:
      return null;
  }
}
