import { Alert, Platform, type AlertButton } from "react-native";

/**
 * Reemplazo de Alert.alert que también funciona en web (react-native-web no implementa Alert).
 * En web: 0–1 botones → window.alert; 2+ botones → window.confirm con el primer botón que no sea "cancel"
 * como aceptar. Con 3+ botones en web solo se ofrece ese botón: para elecciones múltiples usar un sheet propio.
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = buttons ?? [];
  const cancel = actions.find((b) => b.style === "cancel");
  const primary = actions.find((b) => b.style !== "cancel");
  if (actions.length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
    return;
  }
  if (window.confirm(text)) primary?.onPress?.();
  else cancel?.onPress?.();
}

/** Mensaje informativo con un solo botón. */
export function notify(title: string, message?: string) {
  alert(title, message);
}

/** Confirmación sí/no. Resuelve true si el usuario acepta. */
export function confirm(
  title: string,
  message?: string,
  opts: { okText?: string; cancelText?: string; destructive?: boolean } = {},
): Promise<boolean> {
  const { okText = "Aceptar", cancelText = "Cancelar", destructive = false } = opts;
  return new Promise((resolve) => {
    alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      { text: okText, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ]);
  });
}
