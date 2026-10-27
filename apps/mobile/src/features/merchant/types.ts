import type { Tables } from "@yava/shared";

export type MerchantRow = Tables<"merchants">;
export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;
export type OrderSummaryRow = Tables<"order_summary">;
export type ProductRow = Tables<"products">;
export type ProductCategoryRow = Tables<"product_categories">;
export type OptionGroupRow = Tables<"product_option_groups">;
export type OptionRow = Tables<"product_options">;
export type MerchantHoursRow = Tables<"merchant_hours">;
export type MerchantDocumentRow = Tables<"merchant_documents">;
export type SettlementRow = Tables<"settlements">;
export type SettlementOrderRow = Tables<"settlement_orders">;
export type CityRow = Tables<"cities">;

/** Cuenta bancaria guardada como jsonb en merchants/couriers. */
export interface BankAccount {
  bank: string;
  type: string;
  number: string;
  holder: string;
}

export function parseBankAccount(v: unknown): BankAccount | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    bank: typeof o.bank === "string" ? o.bank : "",
    type: typeof o.type === "string" ? o.type : "",
    number: typeof o.number === "string" ? o.number : "",
    holder: typeof o.holder === "string" ? o.holder : "",
  };
}

/** Número de cuenta enmascarado: "···· 1234" (solo los últimos 4 dígitos). */
export function maskAccountNumber(number: string | null | undefined): string {
  const raw = (number ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  const last4 = (digits || raw.replace(/\s/g, "")).slice(-4);
  return last4 ? `···· ${last4}` : "";
}

/** "Bancolombia · Ahorros ···· 1234" para mostrar la cuenta sin exponer el número completo. */
export function formatBankAccount(b: BankAccount): string {
  const head = [b.bank, b.type].filter(Boolean).join(" · ");
  const masked = maskAccountNumber(b.number);
  return [head, masked].filter(Boolean).join(" ");
}

/** Dirección guardada en orders.address_snapshot. */
export interface AddressSnapshot {
  label?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  instructions?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function parseAddress(v: unknown): AddressSnapshot {
  if (!v || typeof v !== "object") return {};
  return v as AddressSnapshot;
}

export function addressLine(a: AddressSnapshot): string {
  return [a.line1, a.line2, a.city].filter(Boolean).join(", ");
}

/** Opción elegida dentro de order_items.options. */
export interface ItemOption {
  name: string;
  price_delta: number;
  group_id?: string;
  option_id?: string;
}

export function parseItemOptions(v: unknown): ItemOption[] {
  if (!Array.isArray(v)) return [];
  return v.filter((o): o is ItemOption => !!o && typeof o === "object" && typeof (o as ItemOption).name === "string");
}

export interface MerchantDashboard {
  sales: number;
  orders: number;
  to_prepare: number;
  preparing: number;
  ready: number;
  payout: number;
  week: { day: string; sales: number }[];
}

export const EMPTY_DASHBOARD: MerchantDashboard = { sales: 0, orders: 0, to_prepare: 0, preparing: 0, ready: 0, payout: 0, week: [] };

/** Inicio del día de hoy (hora local del dispositivo) en ISO. */
export function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const WEEKDAY_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "HH:MM:SS" → "HH:MM" */
export function shortTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export const SETTLEMENT_LABEL: Record<string, string> = { pending: "En proceso", approved: "Programado", paid: "Pagado", rejected: "Rechazado" };
export const SETTLEMENT_TONE: Record<string, "yellow" | "blue" | "green" | "red"> = { pending: "yellow", approved: "blue", paid: "green", rejected: "red" };
