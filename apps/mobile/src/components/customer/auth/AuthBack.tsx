import React from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "@yava/shared";

/**
 * Botón "atrás" de las pantallas de acceso: círculo gris (03/04/07, `size` 37–40 pt) o chevron suelto
 * (`plain`, 05 tinta fino / 06 azul / 46 tinta). Sin historial vuelve al inicio.
 * El chevron tiene la geometría del `chevron-back` de Ionicons (caja `iconSize`), con grosor configurable
 * (`stroke` en unidades de 512; Ionicons usa 48).
 */
export function AuthBack({ size = 37, color = colors.surfaceGray, iconSize = 26, iconColor = colors.ink, plain, onPress, style, iconShift, stroke = 48 }: {
  size?: number; color?: string; iconSize?: number; iconColor?: string; plain?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>;
  /** Corrimiento del chevron dentro del círculo (pt), para calzar con el PNG. */
  iconShift?: { x: number; y: number };
  stroke?: number;
}) {
  const router = useRouter();
  const goBack = onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/" as never)));
  const shift = plain ? null : { marginLeft: 2 * (iconShift?.x ?? -iconSize * 0.04), marginTop: 2 * (iconShift?.y ?? 0) };
  return (
    <Pressable
      onPress={goBack}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Atrás"
      style={({ pressed }) => [
        styles.base,
        plain ? { width: iconSize, height: iconSize } : { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 512 512" style={shift}>
        <Polyline points="328 112 184 256 328 400" fill="none" stroke={iconColor} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
});
