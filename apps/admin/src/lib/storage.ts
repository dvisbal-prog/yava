import type { ServerClient } from "@/lib/supabase/server";

/** URLs firmadas (1 h) para archivos del bucket privado `documents`. */
export async function signDocuments(supabase: ServerClient, paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data } = await supabase.storage.from("documents").createSignedUrls(paths, 3600);
  for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  return map;
}

export const DOC_TYPE_LABEL: Record<string, string> = {
  cedula: "Cédula de ciudadanía",
  licencia: "Licencia de conducción",
  soat: "SOAT",
  tarjeta_propiedad: "Tarjeta de propiedad",
  tecnomecanica: "Revisión técnico-mecánica",
  foto: "Foto",
  antecedentes: "Antecedentes",
  rut: "RUT",
  camara_comercio: "Cámara de comercio",
  cedula_representante: "Cédula del representante",
  certificado_bancario: "Certificado bancario",
  registro_sanitario: "Registro sanitario / INVIMA",
};

export function docLabel(t: string): string {
  return DOC_TYPE_LABEL[t] ?? t.replace(/_/g, " ");
}
