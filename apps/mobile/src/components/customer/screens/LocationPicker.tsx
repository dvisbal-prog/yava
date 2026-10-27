import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Button, Card } from "@/components/ui";
import { fetchCoverage, DEFAULT_COORDS } from "@/features/customer";
import type { Coverage } from "@/features/customer";
import { useLocation } from "@/store/location";
import { useAuth } from "@/store/auth";
import { loginHref } from "@/features/customer/useRequireAuth";
import { errorMessage } from "@/lib/errors";

type Status = "idle" | "locating" | "denied" | "ready" | "error";
type Point = { lat: number; lng: number };

/** Espera tras mover el mapa antes de geocodificar y consultar cobertura. */
const SETTLE_MS = 400;

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

/** Pantalla 06 · Ubicación (permiso, GPS, cobertura, mapa con pin arrastrable). */
export function LocationPicker({ group }: { group: "auth" | "customer" }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const session = useAuth((s) => s.session);
  const setCoords = useLocation((s) => s.setCoords);
  const setCity = useLocation((s) => s.setCity);
  const [status, setStatus] = useState<Status>("idle");
  const [coords, setLocal] = useState<Point | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string>("");
  const mapRef = useRef<React.ComponentRef<typeof MapView>>(null);
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

  const locate = useCallback(async () => {
    setStatus("locating"); setError(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") { setStatus("denied"); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      cancelSettle(); // el GPS manda sobre un movimiento del mapa que aún no se consultó
      setLocal(c);
      setStatus("ready");
      mapRef.current?.animateToRegion({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 600);
      void resolvePoint(c);
    } catch (e) {
      setStatus("error"); setError(errorMessage(e));
    }
  }, [cancelSettle, resolvePoint]);

  useEffect(() => { void locate(); }, [locate]);

  function onRegionChange(r: Region) {
    const c = { lat: r.latitude, lng: r.longitude };
    setLocal(c);
    reqId.current += 1; // invalida la consulta en curso: era de otro punto
    setChecking(true); // el botón espera la cobertura del nuevo punto
    cancelSettle();
    settleTimer.current = setTimeout(() => { settleTimer.current = null; void resolvePoint(c); }, SETTLE_MS);
  }

  function goManual() {
    if (!session) {
      // Escribir una dirección es guardarla: el invitado inicia sesión y vuelve a ubicación de cliente.
      router.push(loginHref("/(customer)/location") as never);
      return;
    }
    const q = new URLSearchParams();
    if (coords) { q.set("lat", String(coords.lat)); q.set("lng", String(coords.lng)); }
    if (params.next) q.set("next", params.next);
    if (placeLabel) q.set("line1", placeLabel);
    router.push(`/(${group})/address?${q.toString()}` as never);
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

  const region: Region = { latitude: DEFAULT_COORDS.lat, longitude: DEFAULT_COORDS.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const outOfCoverage = coverage === null && !checking;

  return (
    <Screen scroll={false} padded={false} footer={
      <View style={{ gap: 8 }}>
        <Button title={outOfCoverage ? "Aún no llegamos a tu zona" : "Confirmar ubicación"} onPress={confirm} disabled={!coords || checking || !coverage} loading={checking} />
        <Button title="Ingresar dirección manualmente" variant="ghost" onPress={goManual} />
      </View>
    }>
      <Header title="Ubicación de entrega" back={router.canGoBack()} />
      <View style={{ flex: 1 }}>
        {Platform.OS !== "web" ? (
          <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={region} onRegionChangeComplete={onRegionChange} showsUserLocation>
            {coords ? <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} pinColor={colors.blue} /> : null}
          </MapView>
        ) : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.gray100 }]} />}
        <View style={styles.overlay}>
          <Card>
            {status === "locating" ? (
              <View style={styles.row}><Ionicons name="navigate-outline" size={20} color={colors.blue} /><Text style={{ marginLeft: 10, flex: 1 }}>Buscando tu ubicación…</Text></View>
            ) : status === "denied" ? (
              <View>
                <Text variant="bodyStrong">Sin permiso de ubicación</Text>
                <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>Activa la ubicación o ingresa tu dirección manualmente.</Text>
                <Button title="Intentar de nuevo" variant="secondary" size="sm" full={false} onPress={locate} style={{ marginTop: 10 }} />
              </View>
            ) : status === "error" ? (
              <View>
                <Text variant="bodyStrong">No pudimos ubicarte</Text>
                <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>{error}</Text>
                <Button title="Reintentar" variant="secondary" size="sm" full={false} onPress={locate} style={{ marginTop: 10 }} />
              </View>
            ) : (
              <View>
                <View style={styles.row}>
                  <Ionicons name="location" size={20} color={outOfCoverage ? colors.red : colors.blue} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>{placeLabel || "Mueve el mapa para ajustar el pin"}</Text>
                    <Text variant="caption" tone={outOfCoverage ? "danger" : "muted"}>
                      {checking ? "Verificando cobertura…" : error ? error : coverage ? `${coverage.city_name}, Atlántico` : outOfCoverage ? "Aún no llegamos a esta zona. Prueba con otra dirección." : ""}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 16, right: 16, bottom: 16 },
  row: { flexDirection: "row", alignItems: "center" },
});
