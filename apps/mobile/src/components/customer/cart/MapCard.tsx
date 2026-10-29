import React from "react";
import { View, Pressable, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Tarjeta de mapa de "Finalizar pedido" (16, guía C30): mapa fijo (sin gestos) centrado en la dirección,
 * pin azul con halo y píldora blanca "Ajustar ubicación ⌖" abajo al centro.
 */
export function CheckoutMapCard({ lat, lng, onAdjust, style }: { lat: number; lng: number; onAdjust?: () => void; style?: StyleProp<ViewStyle> }) {
  const region = { latitude: lat, longitude: lng, latitudeDelta: 0.0028, longitudeDelta: 0.0075 };
  return (
    <View style={[styles.card, style]}>
      {/* En web el mapa es un iframe de OpenStreetMap: se agranda para dejar fuera de la tarjeta sus controles y créditos. */}
      <View style={Platform.OS === "web" ? styles.webFrame : StyleSheet.absoluteFill} pointerEvents="none">
        <MapView
          style={StyleSheet.absoluteFill}
          region={region}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          showsCompass={false}
          showsPointsOfInterests={false}
          mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
          liteMode={Platform.OS === "android"}
        />
      </View>
      <View style={styles.pinWrap} pointerEvents="none">
        <View style={styles.halo} />
        <Ionicons name="location" size={30} color={colors.blue} style={styles.pin} />
        {/* Punto blanco macizo del PNG: en el glifo de Ionicons es un aro hueco con un punto azul y dejaba ver el mapa. */}
        <View style={styles.pinDot} />
      </View>
      {onAdjust ? (
        <Pressable onPress={onAdjust} accessibilityRole="button" style={({ pressed }) => [styles.adjust, shadows.soft, pressed && { opacity: 0.85 }]}>
          <Text style={styles.adjustText}>Ajustar ubicación</Text>
          <Ionicons name="locate" size={15} color={colors.ink} style={{ marginLeft: 8 }} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: 120, borderRadius: 14, overflow: "hidden", backgroundColor: "#EEF1F5" },
  webFrame: { position: "absolute", left: -70, right: -70, top: -60, bottom: -60 },
  pinWrap: { position: "absolute", left: 0, right: 0, top: 24, alignItems: "center" },
  halo: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(10,71,240,0.10)" },
  pin: { position: "absolute", top: 9.7 },
  pinDot: { position: "absolute", top: 17.05, width: 7.8, height: 7.8, borderRadius: 3.9, backgroundColor: colors.white },
  adjust: { position: "absolute", bottom: 8, alignSelf: "center", height: 27.7, borderRadius: 14, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingLeft: 13, paddingRight: 11 },
  adjustText: { fontSize: 12.6, lineHeight: 16, fontWeight: "600", color: colors.ink },
});
