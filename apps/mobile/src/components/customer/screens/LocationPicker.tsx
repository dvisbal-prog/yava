import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { type Region } from "react-native-maps";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "@/components/ui";
import { fetchCoverage, DEFAULT_COORDS } from "@/features/customer";
import type { Coverage } from "@/features/customer";
import { useLocation } from "@/store/location";
import { useAuth } from "@/store/auth";
import { loginHref } from "@/features/customer/useRequireAuth";
import { errorMessage } from "@/lib/errors";
import { designImages } from "@/lib/design-images";
import { AuthBack } from "@/components/customer/auth/AuthBack";
import { AuthButton, NO_WEB_OUTLINE } from "@/components/customer/auth/Field";
import { MapPin, NoCoverageArea } from "@/components/customer/auth/MapPin";

type Status = "idle" | "locating" | "denied" | "ready" | "error";
type Point = { lat: number; lng: number };

/** Espera tras mover el mapa antes de geocodificar y consultar cobertura. */
const SETTLE_MS = 400;

/**
 * Medidas de tanda-01/06-ubicacion.png y tanda-06/46-fuera-de-cobertura.png (pt).
 * El mapa va de la barra de búsqueda hasta 47 pt por debajo del borde superior de la hoja (06), así su centro
 * (donde está el pin = la coordenada elegida) cae donde lo pone el diseño. La hoja de 46 es más alta y tapa más
 * mapa, pero el mapa y el pin no se mueven.
 */
const MAP_TOP = 109.4;
/** Alto del contenido de la hoja de 06 (asa → borde inferior del CTA). */
const SHEET_CONTENT = 221.2;
/** Tramo de mapa que queda debajo de la hoja (así el centro del mapa = el pin cae donde lo pone el PNG). */
const MAP_UNDER_SHEET = 47;
/** Separación entre el botón de ubicar y la hoja. */
const LOCATE_GAP = 20.9;
/** Separación entre el CTA y el borde inferior, además del indicador de inicio. */
const SHEET_BOTTOM = 6.3;

/** Estilo del mapa en Android (Google Maps) con la paleta del diseño (§1.1 "Mapa"). En iOS se usa `mutedStandard`. */
const ANDROID_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F2F2F3" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6E7689" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#DCF0C6" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#EDEDED" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#A4D8FD" }] },
];

/** Dirección legible del punto ("Calle 2 # 3-45"); vacío si no se pudo (p. ej. en web). */
async function reverseLabel(c: Point): Promise<string> {
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: c.lat, longitude: c.lng });
    if (!a) return "";
    return [a.street, a.streetNumber].filter(Boolean).join(" # ") || a.name || "";
  } catch {
    return ""; // geocodificación opcional
  }
}

/** Coordenadas de una dirección escrita; null si no se encontró o no hay geocodificador (web). */
async function geocode(query: string, city?: string | null): Promise<Point | null> {
  try {
    const q = [query, city, "Atlántico", "Colombia"].filter(Boolean).join(", ");
    const [r] = await Location.geocodeAsync(q);
    return r ? { lat: r.latitude, lng: r.longitude } : null;
  } catch {
    return null;
  }
}

/**
 * Pantalla 06 · Ubicación (permiso, GPS, cobertura, mapa con pin fijo al centro) y su estado 46 · Fuera de cobertura.
 * El buscador ubica una dirección escrita; si no se encuentra (o en web), sigue al formulario (07) con lo escrito.
 * La tarjeta de dirección también abre el formulario para escribirla a mano.
 */
export function LocationPicker({ group }: { group: "auth" | "customer" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ next?: string }>();
  const session = useAuth((s) => s.session);
  const setCoords = useLocation((s) => s.setCoords);
  const setCity = useLocation((s) => s.setCity);
  const cityName = useLocation((s) => s.cityName);
  const [status, setStatus] = useState<Status>("idle");
  const [coords, setLocal] = useState<Point | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string>("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<React.ComponentRef<typeof MapView>>(null);
  const searchRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  /** Id de la última consulta: las respuestas de consultas anteriores se descartan. */
  const reqId = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSettle = useCallback(() => {
    if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
  }, []);

  useEffect(() => () => { cancelSettle(); reqId.current += 1; }, [cancelSettle]);

  /** Cobertura y dirección del punto; solo se aplica la respuesta de la consulta más reciente. */
  const resolvePoint = useCallback(async (c: Point) => {
    const id = ++reqId.current;
    setChecking(true); setError(null);
    const [cov, label] = await Promise.all([
      fetchCoverage(c.lat, c.lng).then(
        (value) => ({ ok: true as const, value }),
        (e: unknown) => ({ ok: false as const, e }),
      ),
      reverseLabel(c),
    ]);
    if (id !== reqId.current) return;
    if (cov.ok) {
      setCoverage(cov.value);
      if (cov.value) setCity(cov.value.city_id, cov.value.city_name);
    } else {
      setCoverage(undefined);
      setError(errorMessage(cov.e));
    }
    setPlaceLabel(label);
    setChecking(false);
  }, [setCity]);

  /** Mueve el mapa a un punto y consulta su cobertura (GPS o búsqueda). */
  const goTo = useCallback((c: Point) => {
    cancelSettle(); // manda sobre un movimiento del mapa que aún no se consultó
    setLocal(c);
    setStatus("ready");
    mapRef.current?.animateToRegion({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 600);
    void resolvePoint(c);
  }, [cancelSettle, resolvePoint]);

  const locate = useCallback(async () => {
    setStatus("locating"); setError(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") { setStatus("denied"); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      setStatus("error"); setError(errorMessage(e));
    }
  }, [goTo]);

  useEffect(() => { void locate(); }, [locate]);

  function onRegionChange(r: Region) {
    const c = { lat: r.latitude, lng: r.longitude };
    setLocal(c);
    reqId.current += 1; // invalida la consulta en curso: era de otro punto
    setChecking(true); // el botón espera la cobertura del nuevo punto
    cancelSettle();
    settleTimer.current = setTimeout(() => { settleTimer.current = null; void resolvePoint(c); }, SETTLE_MS);
  }

  function goManual(line1?: string) {
    if (!session) {
      // Escribir una dirección es guardarla: el invitado inicia sesión y vuelve a ubicación de cliente.
      router.push(loginHref("/(customer)/location") as never);
      return;
    }
    const q = new URLSearchParams();
    if (coords) { q.set("lat", String(coords.lat)); q.set("lng", String(coords.lng)); }
    if (params.next) q.set("next", params.next);
    const label = line1 ?? placeLabel;
    if (label) q.set("line1", label);
    router.push(`/(${group})/address?${q.toString()}` as never);
  }

  async function search() {
    const text = query.trim();
    if (!text || searching) return;
    setSearching(true);
    const found = await geocode(text, coverage?.city_name ?? cityName);
    setSearching(false);
    if (found) goTo(found);
    else goManual(text); // sin resultado (o en web): se escribe a mano en 07
  }

  function confirm() {
    if (!coords) return;
    setCoords(coords);
    if (!session) {
      // Invitado: explora con este punto. Guardar la dirección pide cuenta y se hace después,
      // así no se pierde nada al iniciar sesión.
      if (coverage) setCity(coverage.city_id, coverage.city_name);
      router.dismissTo("/(customer)" as never);
      return;
    }
    goManual();
  }

  function changeAddress() {
    setQuery("");
    searchRef.current?.focus();
  }

  function goHome() {
    router.dismissTo("/(customer)" as never);
  }

  const region: Region = { latitude: DEFAULT_COORDS.lat, longitude: DEFAULT_COORDS.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const outOfCoverage = coverage === null && !checking;
  const sheetPad = Math.max(insets.bottom, 16) + SHEET_BOTTOM;

  const cardTitle = placeLabel || (status === "locating" ? "Buscando tu ubicación…" : status === "denied" || status === "error" ? "Elige el punto en el mapa" : "Mueve el mapa para ajustar el pin");
  const cardSubtitle = status === "denied" ? "Sin permiso de ubicación: mueve el mapa o busca tu dirección."
    : status === "error" ? (error ?? "No pudimos ubicarte.")
    : checking ? "Verificando cobertura…"
    : error ? error
    : coverage ? `${coverage.city_name}, Atlántico` : "";

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: colors.white, zIndex: 2 }}>
        <View style={styles.header}>
          <AuthBack plain iconSize={outOfCoverage ? 28 : 26.7} stroke={outOfCoverage ? 34 : 38} iconColor={outOfCoverage ? colors.ink : colors.blue} style={outOfCoverage ? styles.backOut : styles.back} />
          <Text style={[styles.title, outOfCoverage && styles.titleOut]} numberOfLines={1}>{outOfCoverage ? "Dirección de entrega" : "Ubicación de entrega"}</Text>
        </View>
        <View style={[styles.search, shadows.soft]}>
          {searching ? <ActivityIndicator size="small" color={colors.ink} style={styles.searchIcon} /> : <Ionicons name="search" size={19.1} color={colors.ink} style={styles.searchIcon} />}
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            placeholder={outOfCoverage ? "Buscar otra dirección" : "Busca una dirección"}
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.blueText}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.searchInput, NO_WEB_OUTLINE]}
            accessibilityLabel="Buscar una dirección"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Borrar búsqueda" style={styles.clear}>
              <Ionicons name="close" size={15} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.stage}>
        <View style={[styles.map, { bottom: sheetPad + SHEET_CONTENT - MAP_UNDER_SHEET }]} pointerEvents={Platform.OS === "web" ? "none" : "auto"}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onRegionChangeComplete={onRegionChange}
            mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
            customMapStyle={Platform.OS === "android" ? ANDROID_MAP_STYLE : undefined}
            showsPointsOfInterests={false}
            showsCompass={false}
            toolbarEnabled={false}
          />
          <View style={styles.center} pointerEvents="none">
            {outOfCoverage ? <View style={styles.area}><NoCoverageArea /></View> : null}
            <MapPin tone={outOfCoverage ? "gray" : "blue"} />
          </View>
        </View>

        {!outOfCoverage ? (
          <Pressable onPress={locate} accessibilityRole="button" accessibilityLabel="Usar mi ubicación actual"
            style={({ pressed }) => [styles.locate, shadows.float, { bottom: sheetPad + SHEET_CONTENT + LOCATE_GAP, opacity: pressed ? 0.85 : 1 }]}>
            {status === "locating" ? <ActivityIndicator color={colors.blue} /> : <Ionicons name="locate" size={25} color={colors.blue} />}
          </Pressable>
        ) : null}

        {outOfCoverage ? (
          <View style={[styles.sheet, { paddingBottom: sheetPad }]}>
            <View style={[styles.handle, styles.handleOut]} />
            <Image source={designImages.sinCobertura} style={styles.outIcon} contentFit="contain" accessibilityIgnoresInvertColors />
            <Text style={styles.outTitle}>Aún no llegamos a esta zona</Text>
            <Text style={styles.outBody}>Prueba con otra dirección{cityName ? ` en ${cityName}` : ""}.</Text>
            <AuthButton title="Cambiar dirección" onPress={changeAddress} height={42.9} radius={12} color="#0041A5" textStyle={styles.outCta} style={styles.outPrimary} />
            <AuthButton title="Volver al inicio" variant="outline" onPress={goHome} height={42.9} radius={12} textStyle={[styles.outCta, { color: colors.blueLink }]} style={styles.outSecondary} />
          </View>
        ) : (
          <View style={[styles.sheet, { paddingBottom: sheetPad }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{status === "denied" ? "Activa tu ubicación" : "Ajusta el punto de entrega"}</Text>
            <Text style={styles.sheetSubtitle}>{status === "denied" ? "O mueve el mapa hasta tu dirección." : "Mueve el mapa hasta tu ubicación."}</Text>
            <View style={styles.card}>
              <Pressable onPress={() => goManual()} accessibilityRole="button" accessibilityLabel="Escribir la dirección" style={({ pressed }) => [styles.cardMain, { opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="location" size={23.6} color={colors.iconGray} style={styles.cardPin} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{cardTitle}</Text>
                  {cardSubtitle ? <Text style={[styles.cardSubtitle, (status === "error" || (error && !checking)) && { color: colors.red }]} numberOfLines={2}>{cardSubtitle}</Text> : null}
                </View>
              </Pressable>
              {status === "denied" || status === "error" ? (
                <Pressable onPress={locate} hitSlop={8} accessibilityRole="button" style={styles.retry}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </Pressable>
              ) : null}
            </View>
            <AuthButton title="Confirmar ubicación" onPress={confirm} disabled={!coords || checking || !coverage} loading={checking} height={49} radius={12} color="#023E99" textStyle={styles.cta} style={styles.ctaBtn} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", height: 49.4 },
  back: { position: "absolute", left: 12, top: 10.6 },
  backOut: { position: "absolute", left: 11.9, top: 11.1 },
  title: { marginLeft: 54.8, fontSize: 17.8, lineHeight: 23, fontWeight: "600", letterSpacing: -0.4, color: colors.ink, marginTop: 0.4 },
  titleOut: { marginLeft: 55.7 },
  search: {
    flexDirection: "row", alignItems: "center", height: 45.8, marginHorizontal: 18.4, borderRadius: 21, borderWidth: 1, borderColor: colors.searchBorder,
    backgroundColor: colors.white, paddingLeft: 12.8, paddingRight: 12,
  },
  searchIcon: { width: 19.1, marginTop: 1.6 },
  searchInput: { flex: 1, alignSelf: "stretch", marginLeft: 9.9, fontSize: 15.5, letterSpacing: -0.15, color: colors.ink, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
  stage: { flex: 1, marginTop: MAP_TOP - 49.4 - 45.8 },
  map: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden", backgroundColor: "#F2F2F3" },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  area: { position: "absolute", width: 520, height: 520 },
  locate: {
    position: "absolute", right: 13.4, width: 50, height: 50, borderRadius: 25, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center",
  },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18,
  },
  handle: { alignSelf: "center", width: 32.8, height: 4.2, borderRadius: 2.1, backgroundColor: "#D8DCE0", marginTop: 9.2 },
  sheetTitle: { marginTop: 18.2, marginLeft: 3, fontSize: 22.3, lineHeight: 27, fontWeight: "700", letterSpacing: -0.2, color: colors.ink },
  sheetSubtitle: { marginTop: 3.2, marginLeft: 4, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.36, color: colors.textSecondary },
  card: {
    flexDirection: "row", alignItems: "center", minHeight: 63.7, paddingVertical: 8, marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: "#DFE5ED",
    backgroundColor: colors.white, paddingLeft: 15.7, paddingRight: 14,
  },
  cardMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  cardPin: { width: 23.6 },
  cardText: { flex: 1, marginLeft: 12.5 },
  cardTitle: { fontSize: 15.4, lineHeight: 20, fontWeight: "600", letterSpacing: -0.35, color: colors.ink },
  cardSubtitle: { marginTop: 3, fontSize: 12.5, lineHeight: 17, letterSpacing: -0.19, color: colors.textTertiary },
  retry: { marginLeft: 8, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  retryText: { fontSize: 13.5, lineHeight: 18, fontWeight: "600", color: colors.blueText },
  ctaBtn: { marginTop: 13 },
  cta: { fontSize: 15.6, lineHeight: 21, fontWeight: "500", letterSpacing: -0.16 },
  handleOut: { width: 37.4, marginTop: 8.3 },
  outIcon: { width: 58.2, height: 55.9, marginTop: 11.3, marginLeft: 4.2 },
  outTitle: { marginTop: 3.6, marginLeft: 6.5, fontSize: 19.3, lineHeight: 26, fontWeight: "700", letterSpacing: -0.39, color: colors.ink },
  outBody: { marginTop: 4.6, marginLeft: 7.5, fontSize: 14.4, lineHeight: 20, letterSpacing: -0.39, color: colors.textSecondary },
  outPrimary: { marginTop: 17.2, marginHorizontal: 6 },
  outSecondary: { marginTop: 8.8, marginHorizontal: 6.5 },
  outCta: { fontSize: 13.4, lineHeight: 20, fontWeight: "500" },
});
