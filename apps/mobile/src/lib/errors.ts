interface ErrorLike {
  message?: string;
  code?: string;
  details?: string | null;
}

function asErrorLike(e: unknown): ErrorLike {
  if (typeof e === "string") return { message: e };
  if (e && typeof e === "object") return e as ErrorLike;
  return {};
}

/** Código de Postgres/PostgREST del error (p. ej. "23503"), si lo trae. */
export function errorCode(e: unknown): string | null {
  const code = asErrorLike(e).code;
  return typeof code === "string" && code ? code : null;
}

/** Violación de llave foránea (23503): p. ej. borrar un producto que ya está en pedidos. */
export function isForeignKeyViolation(e: unknown): boolean {
  return errorCode(e) === "23503";
}

/** El backend rechazó la operación por permisos ('No autorizado', código 42501). */
export function isUnauthorized(e: unknown): boolean {
  const { message = "" } = asErrorLike(e);
  return errorCode(e) === "42501" || /^no autorizado/i.test(message.trim());
}

/** Convierte errores de Supabase/Postgres a mensajes legibles en español. */
export function errorMessage(e: unknown): string {
  if (!e) return "Ocurrió un error. Intenta de nuevo.";
  const { message, details } = asErrorLike(e);
  const msg = message ?? "";
  if (isForeignKeyViolation(e)) {
    const text = `${msg} ${details ?? ""}`;
    const isDelete = /update or delete on table/i.test(text);
    if (isDelete && /"products"/.test(text) && /"order_items"/.test(text)) return "Este producto ya tiene pedidos; puedes pausarlo en lugar de eliminarlo.";
    if (isDelete) return "No se puede eliminar porque tiene información relacionada.";
    return "Algunos datos relacionados ya no existen. Actualiza e intenta de nuevo.";
  }
  if (/network|fetch/i.test(msg)) return "Sin conexión. Revisa tu internet e intenta de nuevo.";
  if (/invalid login|invalid credentials/i.test(msg)) return "Datos de acceso incorrectos.";
  if (/token has expired|otp/i.test(msg)) return "El código no es válido o venció. Pide uno nuevo.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Espera un momento.";
  return msg || "Ocurrió un error. Intenta de nuevo.";
}
