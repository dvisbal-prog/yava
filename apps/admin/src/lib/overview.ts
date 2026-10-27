import type { Json } from "@yava/shared";
import type { ServerClient } from "@/lib/supabase/server";
import { errorText } from "@/lib/actions";
import { bogotaDayEnd, bogotaDayStart, daysAgoISO, todayISO } from "@/lib/format";

export interface Overview {
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
  hourly: { hour: number; orders: number }[];
  by_type: { type: string; orders: number; sales: number; revenue: number }[];
  by_city: { city: string; city_id: string; orders: number; sales: number; revenue: number }[];
}

function n(v: Json | undefined): number {
  return typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;
}
function s(v: Json | undefined): string {
  return typeof v === "string" ? v : "";
}
function obj(v: Json): Record<string, Json | undefined> {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function arr(v: Json | undefined): Json[] {
  return Array.isArray(v) ? v : [];
}

export function parseOverview(json: Json | null): Overview {
  const o = obj(json ?? {});
  return {
    merchant_sales: n(o.merchant_sales),
    yava_revenue: n(o.yava_revenue),
    commissions: n(o.commissions),
    service_fees: n(o.service_fees),
    discounts: n(o.discounts),
    gateway_fees: n(o.gateway_fees),
    collected: n(o.collected),
    delivery_fees: n(o.delivery_fees),
    merchant_payouts: n(o.merchant_payouts),
    courier_payouts: n(o.courier_payouts),
    delivered: n(o.delivered),
    active: n(o.active),
    cancelled: n(o.cancelled),
    avg_ticket: n(o.avg_ticket),
    active_merchants: n(o.active_merchants),
    online_couriers: n(o.online_couriers),
    merchants_to_review: n(o.merchants_to_review),
    couriers_to_review: n(o.couriers_to_review),
    open_cases: n(o.open_cases),
    pending_settlements: n(o.pending_settlements),
    pending_merchant_settlements: n(o.pending_merchant_settlements),
    pending_courier_settlements: n(o.pending_courier_settlements),
    opex: n(o.opex),
    hourly: arr(o.hourly).map((h) => ({ hour: n(obj(h).hour), orders: n(obj(h).orders) })),
    by_type: arr(o.by_type).map((t) => ({ type: s(obj(t).type), orders: n(obj(t).orders), sales: n(obj(t).sales), revenue: n(obj(t).revenue) })),
    by_city: arr(o.by_city).map((c) => ({ city: s(obj(c).city), city_id: s(obj(c).city_id), orders: n(obj(c).orders), sales: n(obj(c).sales), revenue: n(obj(c).revenue) })),
  };
}

export type RangeKey = "hoy" | "7d" | "30d";
export const RANGE_LABEL: Record<RangeKey, string> = { hoy: "Hoy", "7d": "7 días", "30d": "30 días" };

export function parseRange(v: string | undefined): RangeKey {
  return v === "7d" || v === "30d" ? v : "hoy";
}

/** Rango [from, to] en ISO con zona de Bogotá y sus fechas (YYYY-MM-DD). */
export function rangeBounds(range: RangeKey, fromParam?: string, toParam?: string) {
  const today = todayISO();
  let fromDay = range === "hoy" ? today : range === "7d" ? daysAgoISO(6) : daysAgoISO(29);
  let toDay = today;
  if (fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam)) fromDay = fromParam;
  if (toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) toDay = toParam;
  return { fromDay, toDay, from: bogotaDayStart(fromDay), to: bogotaDayEnd(toDay) };
}

/**
 * Resumen de la plataforma. admin_overview exige rol admin (lanza 'No autorizado' si no):
 * aquí el error se traduce a un mensaje legible. Lanza; las páginas que quieren degradar con gracia
 * usan `tryFetchOverview`.
 */
export async function fetchOverview(supabase: ServerClient, from: string, to: string, city: string | null): Promise<Overview> {
  const res = await tryFetchOverview(supabase, from, to, city);
  if (res.error !== null) throw new Error(res.error);
  return res.overview;
}

export async function tryFetchOverview(
  supabase: ServerClient,
  from: string,
  to: string,
  city: string | null,
): Promise<{ overview: Overview; error: null } | { overview: null; error: string }> {
  try {
    const { data, error } = await supabase.rpc("admin_overview", { p_from: from, p_to: to, ...(city ? { p_city: city } : {}) });
    if (error) return { overview: null, error: overviewErrorText(error) };
    return { overview: parseOverview(data), error: null };
  } catch (e) {
    return { overview: null, error: overviewErrorText(e) };
  }
}

function overviewErrorText(e: unknown): string {
  const msg = errorText(e, "No pudimos cargar el resumen.");
  return msg === "No tienes permiso para esta acción." ? "Tu cuenta no tiene permiso para ver el resumen de la plataforma." : msg;
}
