import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export { formatCOP, formatRating } from "@yava/shared";

const TZ_OPTS: Intl.DateTimeFormatOptions = { timeZone: "America/Bogota" };

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", { ...TZ_OPTS, hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { ...TZ_OPTS, day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDate(iso)} ${fmtTime(iso)}`.replace(/\.$/, "") || d.toISOString();
}

/** "Hoy, 12:22" / "Ayer, 10:35" / "22 oct 2026 12:22" */
export function fmtRelativeDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isToday(d)) return `Hoy, ${fmtTime(iso)}`;
  if (isYesterday(d)) return `Ayer, ${fmtTime(iso)}`;
  return fmtDateTime(iso);
}

export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  return `hace ${formatDistanceToNowStrict(new Date(iso), { locale: es })}`;
}

export function fmtPercent(rate: number | null | undefined, digits = 0): string {
  return `${((rate ?? 0) * 100).toFixed(digits).replace(".", ",")} %`;
}

export function fmtNumber(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("es-CO");
}

export function fmtDayLabel(day: string): string {
  // day viene como YYYY-MM-DD
  const [y, m, d] = day.split("-").map(Number);
  return format(new Date(y, (m ?? 1) - 1, d ?? 1), "d MMM", { locale: es });
}

export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE", TZ_OPTS); // YYYY-MM-DD
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("sv-SE", TZ_OPTS);
}

/** Convierte una fecha local (YYYY-MM-DD) de Bogotá a ISO de inicio/fin del día. */
export function bogotaDayStart(day: string): string {
  return `${day}T00:00:00-05:00`;
}
export function bogotaDayEnd(day: string): string {
  return `${day}T23:59:59.999-05:00`;
}

/** Número de cuenta enmascarado: "···· 1234". Nunca muestra más de los últimos 4 dígitos. */
export function maskAccount(number: string | null | undefined): string {
  const digits = (number ?? "").replace(/\s+/g, "");
  if (!digits) return "—";
  return `···· ${digits.slice(-4)}`;
}
