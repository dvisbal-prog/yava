/** Convierte errores de Supabase/Postgres a mensajes legibles en español. */
export function errorMessage(e: unknown): string {
  if (!e) return "Ocurrió un error. Intenta de nuevo.";
  const msg = typeof e === "string" ? e : (e as { message?: string }).message ?? "";
  if (/network|fetch/i.test(msg)) return "Sin conexión. Revisa tu internet e intenta de nuevo.";
  if (/invalid login|invalid credentials/i.test(msg)) return "Datos de acceso incorrectos.";
  if (/token has expired|otp/i.test(msg)) return "El código no es válido o venció. Pide uno nuevo.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Espera un momento.";
  return msg || "Ocurrió un error. Intenta de nuevo.";
}
