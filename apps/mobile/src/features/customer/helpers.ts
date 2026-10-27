import type { OrderStatus } from "@yava/shared";
import type { MerchantHourRow, NearbyMerchant } from "./types";
import type { MerchantFilters } from "./stores";

/** "25-35 min" */
export function etaLabel(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "";
  if (min && max && min !== max) return `${min}-${max} min`;
  return `${min ?? max} min`;
}

/** Centro de Puerto Colombia: respaldo cuando no hay ubicación. */
export const DEFAULT_COORDS = { lat: 10.9878, lng: -74.9547 };

export function applyMerchantFilters(list: NearbyMerchant[], f: MerchantFilters): NearbyMerchant[] {
  let out = list.filter((m) => {
    if (f.openNow && !m.is_open) return false;
    if (f.maxTime !== null && m.prep_max > f.maxTime) return false;
    if (f.delivery === "free" && m.delivery_fee > 0) return false;
    if (f.delivery === 3000 && m.delivery_fee > 3000) return false;
    if (f.minRating !== null && Number(m.rating_avg) < f.minRating) return false;
    if (f.tag && !m.tags.some((t) => t.toLowerCase() === f.tag?.toLowerCase())) return false;
    return true;
  });
  if (f.sort === "fastest") out = [...out].sort((a, b) => a.prep_max - b.prep_max);
  else if (f.sort === "rating") out = [...out].sort((a, b) => Number(b.rating_avg) - Number(a.rating_avg));
  return out;
}

/** Colombia está en UTC−5 todo el año (sin horario de verano). */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Fecha "corrida" a la hora de Bogotá: leer siempre con getUTC*() (no depende de la zona del dispositivo o navegador). */
function bogota(d: Date): Date {
  return new Date(d.getTime() + BOGOTA_OFFSET_MS);
}

/** "08:05", "21:40" (24 h, hora de Bogotá). */
function hhmm(b: Date): string {
  return `${String(b.getUTCHours()).padStart(2, "0")}:${String(b.getUTCMinutes()).padStart(2, "0")}`;
}

/** Etiqueta del siguiente horario de apertura: "Abre hoy a las 12:00" / "Abre mañana a las 08:00" (hora de Bogotá). */
export function nextOpeningLabel(hours: MerchantHourRow[]): string | null {
  if (!hours.length) return null;
  const now = bogota(new Date());
  const today = now.getUTCDay();
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (let i = 0; i < 7; i++) {
    const wd = (today + i) % 7;
    const slots = hours.filter((h) => h.weekday === wd).sort((a, b) => a.opens.localeCompare(b.opens));
    for (const s of slots) {
      const [hh, mm] = s.opens.split(":").map(Number);
      const opensMin = hh * 60 + mm;
      if (i === 0 && opensMin <= nowMin) continue;
      const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      if (i === 0) return `Abre hoy a las ${time}`;
      if (i === 1) return `Abre mañana a las ${time}`;
      const names = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      return `Abre el ${names[wd]} a las ${time}`;
    }
  }
  return null;
}

export function orderHeadline(status: OrderStatus): string {
  switch (status) {
    case "pending_payment": return "Esperando tu pago";
    case "placed": return "Pedido recibido";
    case "accepted": return "El comercio confirmó tu pedido";
    case "preparing": return "Están preparando tu pedido";
    case "ready": return "Tu pedido está listo";
    case "assigned": return "Un repartidor va por tu pedido";
    case "picked_up":
    case "on_the_way": return "Tu pedido está en camino";
    case "delivered": return "Pedido entregado";
    case "cancelled": return "Pedido cancelado";
  }
}

/** Detecta la franquicia por el BIN. */
export function detectCardBrand(num: string): string {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^(36|38|30[0-5])/.test(d)) return "Diners";
  return "Tarjeta";
}

export function maskCardNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function maskExpiry(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  return d.replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_, a: string, b: string, c: string) => [a, b, c].filter(Boolean).join(" "));
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const dayKey = (b: Date) => `${b.getUTCFullYear()}-${b.getUTCMonth()}-${b.getUTCDate()}`;

/** "Hoy · 12:40", "Ayer · 19:15", "18 oct · 21:08" (24 h, hora de Bogotá). */
export function relativeDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = bogota(new Date(iso));
  if (Number.isNaN(d.getTime())) return "";
  const now = bogota(new Date());
  const time = hhmm(d);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey(d) === dayKey(now)) return `Hoy · ${time}`;
  if (dayKey(d) === dayKey(yesterday)) return `Ayer · ${time}`;
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} · ${time}`;
}
