import { Linking, Platform } from "react-native";

/** Abre una coordenada en la app de mapas del sistema (Apple Maps / Google Maps). */
export function openInMaps(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url = Platform.OS === "ios" ? `maps:?q=${q}&ll=${lat},${lng}` : `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {}));
}
