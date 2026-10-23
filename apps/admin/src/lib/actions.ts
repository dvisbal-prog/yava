/** Resultado estándar de una server action. */
export type ActionResult = { ok: true; message?: string; data?: Record<string, string> } | { ok: false; error: string };

export function fail(error: unknown, fallback = "No se pudo completar la acción."): ActionResult {
  if (typeof error === "string") return { ok: false, error };
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return { ok: false, error: humanize((error as { message: string }).message) };
  }
  return { ok: false, error: fallback };
}

function humanize(msg: string): string {
  if (/permission denied|Sin permiso|42501/i.test(msg)) return "No tienes permiso para esta acción.";
  if (/JWT|expired/i.test(msg)) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  return msg;
}

export function requireReason(reason: FormDataEntryValue | null): string | null {
  const r = typeof reason === "string" ? reason.trim() : "";
  return r.length >= 3 ? r : null;
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function num(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(/\./g, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
