import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors } from "@yava/shared";

// Logo aprobado (assets/images/logo-horizontal.png, ver assets/images/LEEME.txt).
const LOGO_HORIZONTAL = require("../../../../assets/images/logo-horizontal.png");

/**
 * Pantalla 01 · Apertura: fondo blanco y el logo horizontal centrado (229 × 64 pt, medido en
 * tanda-01/01-apertura.png). Es la vista que se ve mientras carga la sesión, justo después del splash nativo.
 */
export function Apertura() {
  return (
    <View style={styles.root} accessibilityLabel="Cargando YAVA" accessibilityRole="progressbar">
      <Image source={LOGO_HORIZONTAL} style={styles.logo} contentFit="fill" accessibilityLabel="YAVA" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  // En el PNG el centro del logo cae al 49,2 % del alto de la pantalla (no al 50 %): se sube ≈ 7 pt.
  logo: { width: 229, height: 64, marginBottom: 13.6 },
});
