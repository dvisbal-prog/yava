import React, { useEffect, useState } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";
import { useOnline } from "@/features/customer/useOnline";
import { BackChevron, ft } from "@/components/customer/account/kit";
import { PrimaryCTA } from "@/components/customer/account/parts";

/** Banner superior "Sin conexión" con reintento (se muestra cuando el cliente cierra la pantalla completa de 48). */
export function OfflineBanner({ online: onlineProp, retry: retryProp }: { online?: boolean; retry?: () => Promise<void> } = {}) {
  const own = useOnline();
  const online = onlineProp ?? own.online;
  const retry = retryProp ?? own.retry;
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.white} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text variant="bodyStrong" tone="inverse">Sin conexión</Text>
        <Text variant="small" tone="inverse" style={{ opacity: 0.9 }}>Revisa tu internet. Reintentamos cada 15 segundos.</Text>
      </View>
      <Pressable onPress={() => { void retry(); }} hitSlop={8} style={styles.btn} accessibilityRole="button">
        <Text variant="caption" style={{ color: colors.carbon, fontWeight: "700" }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

/**
 * Pantalla 48 · Sin conexión (tanda-06/48-sin-conexion.png), a pantalla completa sobre el app del cliente:
 * chevron + "YAVA", nube tachada, "Sin conexión", texto, CTA "Reintentar" y "Tus datos guardados seguirán aquí.".
 * El chevron la oculta y deja el banner superior para seguir viendo lo guardado; al volver la red desaparece sola
 * (el app reintenta cada 15 s y al tocar "Reintentar").
 */
export function OfflineScreen() {
  const { online, retry } = useOnline();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [dismissed, setDismissed] = useState(false);
  // En el PNG la nube empieza 194 pt bajo el encabezado (iPhone de 852 pt); en pantallas bajas se centra el bloque (≈ 319 pt).
  const top = Math.max(16, Math.min(193.8, (height - insets.top - insets.bottom - 49.2 - 319) / 2));
  const [checking, setChecking] = useState(false);

  // Cada pérdida de conexión vuelve a mostrar la pantalla completa.
  useEffect(() => { if (online) setDismissed(false); }, [online]);

  if (online) return null;
  if (dismissed) return <View style={styles.bannerLayer}><OfflineBanner online={online} retry={retry} /></View>;

  async function onRetry() {
    setChecking(true);
    try { await retry(); } finally { setChecking(false); }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]} accessibilityViewIsModal>
      <View style={styles.header}>
        <Pressable onPress={() => setDismissed(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar y ver lo guardado" style={styles.back}>
          <BackChevron height={18.2} stroke={2.3} />
        </Pressable>
        <Text style={styles.brand} accessibilityRole="header">YAVA</Text>
      </View>
      <View style={[styles.body, { paddingTop: top }]}>
        <Image source={designImages.sinConexion} style={styles.art} contentFit="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.title} accessibilityRole="header">Sin conexión</Text>
        <Text style={styles.text}>Revisa tu conexión a internet{"\n"}e intenta de nuevo.</Text>
        <PrimaryCTA title="Reintentar" onPress={() => { void onRetry(); }} loading={checking} height={54} radius={14} fontSize={17.5} color="#003F9F" style={styles.cta} />
        <Text style={styles.note}>Tus datos guardados seguirán aquí.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.carbon, paddingHorizontal: 16, paddingBottom: 10 },
  btn: { backgroundColor: colors.yellow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  bannerLayer: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 },
  screen: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.white, zIndex: 50 },
  header: { height: 49.2, flexDirection: "row", alignItems: "center" },
  back: { position: "absolute", left: 19.6, top: 15.4 },
  brand: { ...ft(18.8, "700", colors.ink, 24), letterSpacing: -0.2, marginLeft: 47.6, marginTop: -2.4 },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 19.4 },
  art: { width: 107.2, height: 84 },
  title: { ...ft(27.2, "700", colors.ink, 33), letterSpacing: -0.5, marginTop: 23.4, textAlign: "center" },
  text: { ...ft(16, "400", "#5A6476", 20), marginTop: 10.5, textAlign: "center" },
  cta: { alignSelf: "stretch", marginTop: 29.5 },
  note: { ...ft(14, "400", "#6E7689", 19), marginTop: 22, textAlign: "center" },
});
