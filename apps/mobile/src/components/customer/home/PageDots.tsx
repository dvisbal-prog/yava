import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors } from "@yava/shared";

/** Píldora gris con puntos de página (carrusel de pautas y cuadrícula de tiendas del Inicio); el activo es azul y alargado. */
export function PageDots({ count, index, style }: { count: number; index: number; style?: StyleProp<ViewStyle> }) {
  if (count < 2) return null;
  return (
    <View style={[styles.wrap, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.pill}>
        {Array.from({ length: count }).map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotOn]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 15, paddingHorizontal: 7, borderRadius: 999, backgroundColor: colors.surfaceGray },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#C3C9D5" },
  dotOn: { width: 13, backgroundColor: colors.blue },
});
