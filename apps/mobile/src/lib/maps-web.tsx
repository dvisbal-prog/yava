// Sustituto web de react-native-maps (metro.config.js lo resuelve solo en web).
// react-native-maps no carga en react-native-web; aquí se muestra un mapa de OpenStreetMap sin interacción.
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
type LatLng = { latitude: number; longitude: number };

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  region?: Region;
  initialRegion?: Region;
  children?: React.ReactNode;
};

export type MapViewHandle = {
  animateToRegion: (r: Region, duration?: number) => void;
  animateCamera: (c: { center?: LatLng }) => void;
  fitToCoordinates: (coords: LatLng[]) => void;
};

function embedUrl(r: Region) {
  const left = r.longitude - r.longitudeDelta / 2;
  const right = r.longitude + r.longitudeDelta / 2;
  const top = r.latitude + r.latitudeDelta / 2;
  const bottom = r.latitude - r.latitudeDelta / 2;
  const bbox = [left, bottom, right, top].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
}

const FALLBACK: Region = { latitude: 11.0, longitude: -74.95, latitudeDelta: 0.02, longitudeDelta: 0.02 };

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView({ style, region, initialRegion }, ref) {
  const [current, setCurrent] = useState<Region>(region ?? initialRegion ?? FALLBACK);
  const shown = region ?? current;
  useImperativeHandle(ref, () => ({
    animateToRegion: (r) => setCurrent(r),
    animateCamera: (c) => { if (c.center) setCurrent((p) => ({ ...p, ...c.center })); },
    fitToCoordinates: (coords) => {
      if (!coords.length) return;
      const lats = coords.map((c) => c.latitude);
      const lngs = coords.map((c) => c.longitude);
      const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setCurrent({ latitude: lat, longitude: lng, latitudeDelta: Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.6), longitudeDelta: Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.6) });
    },
  }), []);
  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#EEF1F5" }, style]}>
      {React.createElement("iframe", {
        title: "Mapa",
        src: embedUrl(shown),
        style: { border: 0, width: "100%", height: "100%" },
        loading: "lazy",
      })}
    </View>
  );
});

export default MapView;
export const Marker = (_props: Record<string, unknown>) => null;
export const Polyline = (_props: Record<string, unknown>) => null;
export const Circle = (_props: Record<string, unknown>) => null;
export const Callout = (_props: Record<string, unknown>) => null;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = undefined;
