import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function toInt(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type SearchParams = Record<string, string | string[] | undefined>;

/** Construye un query string a partir de los searchParams actuales y cambios. */
export function buildQuery(current: SearchParams, patch: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const val = firstParam(v);
    if (val) sp.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") sp.delete(k);
    else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
