import type { Tables } from "@yava/shared";

export type CourierRow = Tables<"couriers">;
export type CourierDocumentRow = Tables<"courier_documents">;
export type CourierWithdrawalRow = Tables<"courier_withdrawals">;
export type OrderMessageRow = Tables<"order_messages">;

export interface CourierDashboard {
  today_earnings: number;
  today_deliveries: number;
  week_earnings: number;
  week_deliveries: number;
  balance: number | null;
  rating: number | null;
  total_deliveries: number | null;
  active_order: string | null;
}

export const EMPTY_COURIER_DASHBOARD: CourierDashboard = {
  today_earnings: 0, today_deliveries: 0, week_earnings: 0, week_deliveries: 0, balance: 0, rating: 0, total_deliveries: 0, active_order: null,
};

/** Fila devuelta por courier_available_orders. */
export interface AvailableOrder {
  id: string;
  number: number;
  type: "food" | "market" | "pharmacy" | "shipment";
  status: string;
  merchant_name: string | null;
  merchant_address: string | null;
  merchant_lat: number | null;
  merchant_lng: number | null;
  delivery_address: unknown;
  delivery_lat: number | null;
  delivery_lng: number | null;
  courier_payout: number;
  total: number;
  placed_at: string;
  distance_km: number | null;
}

export const VEHICLE_LABEL: Record<CourierRow["vehicle"], string> = { moto: "Moto", bicicleta: "Bicicleta", carro: "Carro", a_pie: "A pie" };

export const COURIER_DOC_TYPES: { type: string; label: string; hint: string; required: boolean; vehicleOnly?: boolean }[] = [
  { type: "cedula", label: "Documento de identidad", hint: "Cédula de ciudadanía", required: true },
  { type: "licencia", label: "Licencia de conducción", hint: "Licencia vigente", required: true, vehicleOnly: true },
  { type: "soat", label: "SOAT", hint: "Seguro obligatorio vigente", required: true, vehicleOnly: true },
  { type: "tarjeta_propiedad", label: "Documento del vehículo", hint: "Tarjeta de propiedad", required: true, vehicleOnly: true },
  { type: "foto", label: "Foto de perfil", hint: "Una foto clara de tu rostro", required: true },
  { type: "antecedentes", label: "Antecedentes", hint: "Certificado de antecedentes (opcional)", required: false },
];

export const DOC_STATUS_LABEL: Record<CourierDocumentRow["status"], string> = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

/** Enlaces públicos de Privacidad y Términos (panel web). */
export const LEGAL_URLS = {
  privacy: "https://yava-panel.vercel.app/legal/privacidad",
  terms: "https://yava-panel.vercel.app/legal/terminos",
} as const;

/** Enmascara un número de cuenta o celular: "3001234567" → "···· 4567". */
export function maskAccount(number: string | null | undefined): string {
  const clean = (number ?? "").replace(/\s/g, "");
  return clean ? `···· ${clean.slice(-4)}` : "";
}

export function formatKm(km: number | null | undefined): string {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
