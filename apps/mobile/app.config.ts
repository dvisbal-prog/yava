import type { ConfigContext, ExpoConfig } from "expo/config";

// Llaves de Google Maps desde el entorno (EAS env o .env). app.json no interpola ${VAR}:
// en Android un ${...} literal rompe el manifest. Sin llave, el mapa de Android queda en blanco pero no se cae.
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_KEY || "SIN_LLAVE_GOOGLE_MAPS";
  const iosKey = process.env.GOOGLE_MAPS_IOS_KEY;
  return {
    ...config,
    name: config.name ?? "YAVA",
    slug: config.slug ?? "yava",
    ios: { ...config.ios, ...(iosKey ? { config: { ...config.ios?.config, googleMapsApiKey: iosKey } } : {}) },
    android: { ...config.android, config: { ...config.android?.config, googleMaps: { apiKey: androidKey } } },
  };
};
