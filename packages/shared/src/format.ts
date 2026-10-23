/** $38.000 — formato COP sin decimales con punto de miles. */
export function formatCOP(value: number | null | undefined, withCode = false): string {
  const n = Math.round(value ?? 0);
  const s = "$" + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + s + (withCode ? " COP" : "");
}

export function formatRating(v: number | null | undefined): string {
  return (v ?? 0).toFixed(1).replace(".", ",");
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export function orderNumber(n: number): string {
  return `#${n}`;
}
