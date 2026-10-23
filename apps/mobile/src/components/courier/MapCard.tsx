import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";

export interface MapPin { lat: number; lng: number; title?: string; kind: "me" | "merchant" | "customer" }

const PIN_COLOR: Record<MapPin["kind"], string> = { me: colors.blue, merchant: colors.yellow, customer: colors.red };
const PIN_ICON: Record<MapPin["kind"], keyof typeof Ionicons.glyphMap> = { me: "navigate", merchant: "storefront", customer: "home" };

/** Mapa con pines (repartidor, comercio, cliente). En web muestra un marcador de posición. */
export function MapCard({ pins, height = 200, style }: { pins: MapPin[]; height?: number; style?: object }) {
  const valid = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (Platform.OS === "web" || !valid.length) {
    return (
      <View style={[styles.box, { height, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray100 }, style]}>
        <Ionicons name="map-outline" size={28} color={colors.gray400} />
        <Text variant="caption" tone="muted" style={{ marginTop: 6 }}>{valid.length ? "Mapa no disponible en web" : "Sin ubicación todavía"}</Text>
      </View>
    );
  }
  const lats = valid.map((p) => p.lat);
  const lngs = valid.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.6),
  };
  return (
    <View style={[styles.box, { height }, style]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} region={region} showsUserLocation={false} toolbarEnabled={false}>
        {valid.map((p, i) => (
          <Marker key={`${p.kind}-${i}`} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.title} pinColor={PIN_COLOR[p.kind]}>
            <View style={[styles.pin, { backgroundColor: PIN_COLOR[p.kind] }]}>
              <Ionicons name={PIN_ICON[p.kind]} size={14} color={p.kind === "merchant" ? colors.carbon : colors.white} />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.gray200 },
  pin: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
});
