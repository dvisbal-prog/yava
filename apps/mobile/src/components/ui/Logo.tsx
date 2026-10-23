import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "./Text";

/** Símbolo YAVA: fondo amarillo redondeado, Y azul y punto rojo. Reemplazar por logo-aprobado.png cuando esté en assets. */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="0" y="0" width="64" height="64" rx="16" fill={colors.yellow} />
      <Path d="M18 14 L32 34 L46 14" stroke={colors.blue} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="28" y="33" width="8" height="18" rx="4" fill={colors.blue} />
      <Circle cx="50" cy="48" r="5" fill={colors.red} />
    </Svg>
  );
}

export function Logo({ size = 56, word = true }: { size?: number; word?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <LogoMark size={size} />
      {word ? <Text style={{ fontSize: size * 0.6, fontWeight: "800", color: colors.blue, marginLeft: size * 0.25, letterSpacing: 1 }}>YAVA</Text> : null}
    </View>
  );
}
