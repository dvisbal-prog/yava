import React, { useRef, useState } from "react";
import { View, Pressable, TextInput, StyleSheet, Platform, type StyleProp, type ViewStyle, type TextInputProps } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";
import { RowChevron, ft } from "./kit";

/**
 * Piezas de 31 "Envía un paquete" y 32 "Revisa tu envío" (tanda-04).
 */

/** Ámbar del pin de destino (31 mide #FCB005) y su círculo (#FDF4DD). */
export const DEST_AMBER = "#FCB005";
export const DEST_AMBER_SOFT = "#FDF4DD";
/** Rojo del pin de entrega en el mapa de 32. */
export const DROP_RED = "#E4393A";

/**
 * Tarjeta de dirección de 31 (Recogida / Destino): 362 × 81 pt, fondo `#F9FAFC`, borde `#E7EAF0`, radio 16;
 * círculo 42 pt con pin; etiqueta gris, dirección editable (se escribe en la misma tarjeta) y una tercera línea
 * (ciudad, o un segundo campo opcional con la ciudad como texto de ayuda); chevron a la derecha.
 */
export function AddressCard({ label, tone, value, onChangeText, placeholder, secondValue, onChangeSecond, secondPlaceholder, city, style }: {
  label: string; tone: "pickup" | "dropoff"; value: string; onChangeText: (t: string) => void; placeholder: string;
  /** Segundo campo opcional (apartamento/referencia) que se muestra como la tercera línea gris. */
  secondValue?: string; onChangeSecond?: (t: string) => void; secondPlaceholder?: string;
  city?: string | null; style?: StyleProp<ViewStyle>;
}) {
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const pickup = tone === "pickup";
  return (
    <Pressable onPress={() => input.current?.focus()} style={[styles.addrCard, style]} accessibilityLabel={`${label}: ${value || placeholder}`}>
      <View style={[styles.addrCircle, { backgroundColor: pickup ? "#EAF1FD" : DEST_AMBER_SOFT }]}>
        <Ionicons name="location" size={24} color={pickup ? colors.blue : DEST_AMBER} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ft(13.3, "500", "#5A6476", 17)}>{label}</Text>
        <TextInput ref={input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.blueText} style={[styles.addrInput, ft(14, "500", colors.ink, 19)]} accessibilityLabel={`Dirección de ${label.toLowerCase()}`} />
        {onChangeSecond ? (
          <TextInput value={secondValue} onChangeText={onChangeSecond} placeholder={secondPlaceholder ?? city ?? ""} placeholderTextColor="#6E7689"
            selectionColor={colors.blueText} style={[styles.addrInput, ft(12.9, "400", "#6E7689", 17), { marginTop: 0 }]}
            accessibilityLabel="Apartamento, oficina o referencia (opcional)" />
        ) : city ? <Text style={[ft(12.9, "400", "#6E7689", 17), { marginTop: 1.5 }]} numberOfLines={1}>{city}</Text> : null}
      </View>
      <RowChevron color="#515E72" size={19} style={{ marginRight: 9.6 }} />
    </Pressable>
  );
}

/** Campo de 31 dentro de la tarjeta del destinatario: label 12,2 pt gris + caja 38 pt radio 10. */
export function FormField({ label, error, ...rest }: TextInputProps & { label: string; error?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={ft(11.8, "400", "#5A6173", 16)}>{label}</Text>
      <TextInput placeholderTextColor={colors.textPlaceholder} selectionColor={colors.blueText} accessibilityLabel={label}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }} onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        style={[styles.field, ft(13.6, "400", colors.ink, 19), focused && styles.fieldFocus, error && { borderColor: colors.red }]} />
    </View>
  );
}

/** Selector "Documentos ⌄" (39 pt radio 12) con la lista de opciones desplegable debajo. */
export function SelectField({ value, options, onChange, accessibilityLabel }: { value: string; options: string[]; onChange: (v: string) => void; accessibilityLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityLabel={`${accessibilityLabel}: ${value}`} accessibilityState={{ expanded: open }}
        style={[styles.select, open && styles.fieldFocus]}>
        <Text style={[ft(13.5, "400", colors.ink, 19), { flex: 1 }]}>{value}</Text>
        <DownChevron up={open} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {options.map((o, i) => (
            <Pressable key={o} onPress={() => { onChange(o); setOpen(false); }} accessibilityRole="menuitem" accessibilityState={{ selected: o === value }}
              style={({ pressed }) => [styles.menuRow, i > 0 && styles.menuDivider, pressed && { backgroundColor: colors.surfaceSoft }]}>
              <Text style={[ft(14, o === value ? "600" : "400", o === value ? colors.blueText : colors.ink, 19), { flex: 1 }]}>{o}</Text>
              {o === value ? <Ionicons name="checkmark" size={18} color={colors.blueText} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Tarjeta de tamaño de 31 (115 × 118,6 pt, radio 14): caja a escala, radio arriba a la derecha, nombre y peso.
 * En el PNG cada caja tiene su propio tope (`boxTop`) y la tarjeta seleccionada sube el nombre para dar lugar al peso.
 */
export function SizeCard({ label, hint, boxWidth, boxHeight, boxTop, selected, onPress }: {
  label: string; hint: string; boxWidth: number; boxHeight: number; boxTop: number; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${label}, ${hint}`}
      style={[styles.size, selected ? styles.sizeOn : styles.sizeOff]}>
      <View style={[styles.sizeBox, { top: boxTop }]} pointerEvents="none">
        <Image source={designImages.envioCaja} style={{ width: boxWidth, height: boxHeight }} contentFit="fill" />
      </View>
      <View style={[styles.sizeRadio, selected ? styles.sizeRadioOn : styles.sizeRadioOff]}>{selected ? <View style={styles.sizeDot} /> : null}</View>
      <View style={[styles.sizeTexts, { top: selected ? 76.4 : 82 }]} pointerEvents="none">
        <Text style={ft(selected ? 11.9 : 12, selected ? "600" : "500", selected ? colors.blueText : colors.ink, 17)}>{label}</Text>
        {selected ? <Text style={[ft(11, "400", "#5A6173", 15), { marginTop: 0.2 }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Chevron "⌄" fino del selector de 31 (tinta 10,6 × 6,5 pt, trazo 1,6). */
function DownChevron({ up }: { up?: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" style={up ? { transform: [{ rotate: "180deg" }] } : undefined}>
      <Path d="M3.5 5.8L8 10.3L12.5 5.8" stroke={colors.ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

type LatLng = { latitude: number; longitude: number };

/** Pin del mapa con la dirección debajo (32): gota de color + "Calle 2 # 3-45" / "Recogida". */
function MapLabelPin({ color, title, subtitle }: { color: string; title: string; subtitle: string }) {
  return (
    <View style={styles.mapPinBox}>
      <Ionicons name="location" size={34} color={color} />
      <Text style={[ft(11.5, "600", colors.ink, 15), styles.mapPinText]} numberOfLines={1}>{title}</Text>
      <Text style={[ft(10.4, "400", "#5A6476", 14), styles.mapPinText]} numberOfLines={1}>{subtitle}</Text>
    </View>
  );
}

/**
 * Mapa de 32 (C30): tarjeta 362 × 153 pt radio 18, sin gestos, encuadra recogida y entrega con la línea azul
 * `#0558F2` entre ambas y los pines con su dirección (azul = recogida, rojo = entrega). En web es el mapa estático
 * de `lib/maps-web.tsx` (sin pines propios).
 */
export function ShipmentMap({ pickup, dropoff, pickupLabel, dropoffLabel, style }: {
  pickup: LatLng | null; dropoff: LatLng | null; pickupLabel: string; dropoffLabel: string; style?: StyleProp<ViewStyle>;
}) {
  const pts = [pickup, dropoff].filter(Boolean) as LatLng[];
  if (!pts.length) {
    return (
      <View style={[styles.map, styles.mapEmpty, style]}>
        <Ionicons name="map-outline" size={28} color={colors.textPlaceholder} />
        <Text style={[ft(12.5, "400", "#6E7689", 17), { marginTop: 6 }]}>Ubicaremos tu envío al confirmar.</Text>
      </View>
    );
  }
  const lats = pts.map((p) => p.latitude);
  const lngs = pts.map((p) => p.longitude);
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max(0.006, (Math.max(...lats) - Math.min(...lats)) * 2.4),
    longitudeDelta: Math.max(0.012, (Math.max(...lngs) - Math.min(...lngs)) * 1.6),
  };
  return (
    <View style={[styles.map, style]} pointerEvents="none">
      {/* En web el mapa es un iframe de OpenStreetMap: se agranda para dejar fuera de la tarjeta sus controles y créditos. */}
      <View style={Platform.OS === "web" ? styles.mapWebFrame : StyleSheet.absoluteFill}>
      <MapView style={StyleSheet.absoluteFill} region={region} initialRegion={region} scrollEnabled={false} zoomEnabled={false} pitchEnabled={false}
        rotateEnabled={false} toolbarEnabled={false} showsCompass={false} showsPointsOfInterests={false}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"} liteMode={Platform.OS === "android"}>
        {pickup && dropoff ? <Polyline coordinates={[pickup, dropoff]} strokeColor="#0558F2" strokeWidth={4} /> : null}
        {pickup ? (
          <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <MapLabelPin color={colors.blue} title={pickupLabel} subtitle="Recogida" />
          </Marker>
        ) : null}
        {dropoff ? (
          <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <MapLabelPin color={DROP_RED} title={dropoffLabel} subtitle="Entrega" />
          </Marker>
        ) : null}
      </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 153.4, borderRadius: 18, overflow: "hidden", backgroundColor: "#EEF1F5" },
  mapEmpty: { alignItems: "center", justifyContent: "center" },
  mapWebFrame: { position: "absolute", left: -70, right: -70, top: -60, bottom: -60 },
  /** El centro de la caja (anclaje 0,5) coincide con la punta del pin: 34 pt de pin arriba y 34 pt de texto abajo. */
  mapPinBox: { width: 140, height: 68, alignItems: "center", justifyContent: "flex-start" },
  mapPinText: { textShadowColor: "rgba(255,255,255,0.9)", textShadowRadius: 3 },
  addrCard: { flexDirection: "row", alignItems: "center", minHeight: 81, borderRadius: 16, borderWidth: 1, borderColor: "#E7EAF0", backgroundColor: "#F9FAFC", paddingLeft: 13.4, paddingVertical: 9 },
  addrCircle: { width: 41.6, height: 41.6, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 14.3 },
  addrInput: { padding: 0, margin: 0, marginTop: 1, minHeight: 19 },
  field: { height: 38.3, borderRadius: 10, borderWidth: 1, borderColor: "#E0E5EC", backgroundColor: colors.white, paddingHorizontal: 12.9, marginTop: 3 },
  fieldFocus: { borderColor: colors.blueText, borderWidth: 1.5 },
  select: { flexDirection: "row", alignItems: "center", height: 39.2, borderRadius: 12, borderWidth: 1, borderColor: "#DCE1E9", backgroundColor: colors.white, paddingLeft: 15.3, paddingRight: 10.2 },
  menu: { marginTop: 6, borderRadius: 12, borderWidth: 1, borderColor: "#DCE1E9", backgroundColor: colors.white, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", height: 42, paddingHorizontal: 15.3 },
  menuDivider: { borderTopWidth: 1, borderTopColor: "#EEF0F4" },
  size: { flex: 1, height: 118.6, borderRadius: 14 },
  sizeOn: { backgroundColor: "#EBF2FD", borderWidth: 1.3, borderColor: "#1E56D6" },
  sizeOff: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#E2E7EF" },
  sizeRadio: { position: "absolute", top: 8.6, right: 7.6, width: 15.7, height: 15.7, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  sizeRadioOn: { borderWidth: 5.2, borderColor: colors.blue },
  sizeRadioOff: { borderWidth: 1.2, borderColor: "#A2A9B6" },
  sizeDot: { width: 0, height: 0 },
  sizeBox: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  sizeTexts: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
