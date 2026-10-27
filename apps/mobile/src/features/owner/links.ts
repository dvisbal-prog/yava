import { Linking, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { notify } from "@/lib/dialog";
import { ADMIN_URL } from "./types";

/** URL absoluta del panel web para una ruta (p. ej. "/finanzas/liquidaciones"). */
export function adminUrl(path = ""): string {
  if (!path) return ADMIN_URL;
  return `${ADMIN_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Abre el panel web; si el sistema no puede abrirlo, muestra la URL para abrirla a mano. */
export async function openAdmin(path = ""): Promise<void> {
  const url = adminUrl(path);
  try {
    await Linking.openURL(url);
  } catch {
    notify("No se pudo abrir el panel web", `Ábrelo desde tu navegador: ${url}`);
  }
}

export type ShareResult = "shared" | "copied" | "cancelled";

/**
 * Comparte un texto con la hoja nativa. En web usa navigator.share si existe;
 * si no (o falla sin que el usuario cancele), copia el texto con expo-clipboard.
 */
export async function shareText(title: string, message: string): Promise<ShareResult> {
  if (Platform.OS !== "web") {
    const r = await Share.share({ title, message });
    return r.action === Share.dismissedAction ? "cancelled" : "shared";
  }
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.share === "function") {
    try {
      await nav.share({ title, text: message });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
      // NotAllowedError u otro fallo del navegador: se copia como respaldo.
    }
  }
  await Clipboard.setStringAsync(message);
  return "copied";
}
