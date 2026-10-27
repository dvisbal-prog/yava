import type { ServerClient } from "@/lib/supabase/server";
import { docLabel } from "@/lib/storage";

/** Documentos obligatorios del comercio (mismos que pide el registro móvil, pantalla 49). */
export const MERCHANT_REQUIRED_DOCS = ["rut", "camara_comercio", "cedula"] as const;

/** Documentos obligatorios del repartidor (pantalla 58): los del vehículo solo para moto y carro. */
export function courierRequiredDocs(vehicle: string | null | undefined): string[] {
  const base = ["cedula", "foto"];
  return vehicle === "moto" || vehicle === "carro" ? [...base, "licencia", "soat", "tarjeta_propiedad"] : base;
}

export interface DocRow {
  doc_type: string;
  status: string;
  created_at: string;
}

export interface DocsReadiness {
  ready: boolean;
  missing: string[];
  pending: string[];
  rejected: string[];
}

/**
 * Revisa la última versión de cada tipo de documento.
 * Listo = todos los obligatorios aprobados y ningún otro documento a la espera de revisión.
 */
export function docsReadiness(required: readonly string[], docs: DocRow[]): DocsReadiness {
  const latest = new Map<string, DocRow>();
  for (const d of [...docs].sort((a, b) => a.created_at.localeCompare(b.created_at))) latest.set(d.doc_type, d);
  const missing = required.filter((t) => !latest.has(t));
  const pending = [...latest.values()].filter((d) => d.status === "pending").map((d) => d.doc_type);
  const rejected = required.filter((t) => latest.get(t)?.status === "rejected");
  return { ready: missing.length === 0 && pending.length === 0 && rejected.length === 0, missing, pending, rejected };
}

/** Explicación corta de por qué todavía no se puede aprobar (null si está listo). */
export function docsBlocker(r: DocsReadiness): string | null {
  if (r.ready) return null;
  const parts: string[] = [];
  if (r.missing.length) parts.push(`faltan ${r.missing.map(docLabel).join(", ")}`);
  if (r.pending.length) parts.push(`por revisar ${r.pending.map(docLabel).join(", ")}`);
  if (r.rejected.length) parts.push(`rechazados ${r.rejected.map(docLabel).join(", ")}`);
  return `Aprueba primero los documentos: ${parts.join("; ")}.`;
}

/** Comprobación en el servidor (server actions) antes de aprobar un comercio. */
export async function merchantDocsBlocker(supabase: ServerClient, merchantId: string): Promise<string | null> {
  const { data, error } = await supabase.from("merchant_documents").select("doc_type,status,created_at").eq("merchant_id", merchantId);
  if (error) return "No pudimos verificar los documentos del comercio.";
  return docsBlocker(docsReadiness(MERCHANT_REQUIRED_DOCS, data ?? []));
}

/** Comprobación en el servidor (server actions) antes de aprobar un repartidor. */
export async function courierDocsBlocker(supabase: ServerClient, courierId: string, vehicle: string | null | undefined): Promise<string | null> {
  const { data, error } = await supabase.from("courier_documents").select("doc_type,status,created_at").eq("courier_id", courierId);
  if (error) return "No pudimos verificar los documentos del repartidor.";
  return docsBlocker(docsReadiness(courierRequiredDocs(vehicle), data ?? []));
}
