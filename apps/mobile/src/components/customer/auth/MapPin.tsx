import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";
import { colors } from "@yava/shared";

/** Gota del pin (24 × 31,7 unidades): cabeza circular y punta abajo. */
const DROP = "M12 0C5.4 0 0 5.4 0 12c0 7.9 10.1 18.4 11.1 19.4a1.3 1.3 0 0 0 1.8 0C13.9 30.4 24 19.9 24 12 24 5.4 18.6 0 12 0z";

/** Alto total del pin "entrega" (06) medido desde la punta del pin hasta el centro del punto de abajo. */
const TIP_TO_DOT = 8.4;

/**
 * Pin del mapa de ubicación (06 / 46), centrado sobre el punto elegido.
 * - `blue` (06): gota azul 27 × 35,5 pt con punto blanco, y debajo el punto azul con halo (el punto es la coordenada).
 * - `gray` (46): gota gris oscuro 25 × 33 pt con sombra elíptica; la punta es la coordenada.
 * El contenedor mide `size` × `size` y su centro es la coordenada: úsalo centrado sobre el mapa.
 */
export function MapPin({ tone = "blue", size = 120 }: { tone?: "blue" | "gray"; size?: number }) {
  const c = size / 2;
  if (tone === "gray") {
    const w = 25.2, h = w * 31.7 / 24;
    return (
      <View pointerEvents="none" style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Ellipse cx={c} cy={c + 6} rx={8} ry={3.2} fill="rgba(0,0,0,0.13)" />
        </Svg>
        <View style={[styles.abs, { left: c - w / 2 - 1.5, top: c - h - 1.5 + 0.5 }]}>
          <Svg width={w + 3} height={h + 3} viewBox="-1.5 -1.5 27 34.7">
            <Path d={DROP} fill="#465160" stroke={colors.white} strokeWidth={1.4} />
            <Circle cx={12} cy={12} r={3.3} fill={colors.white} />
          </Svg>
        </View>
      </View>
    );
  }
  const w = 27.2, h = w * 31.7 / 24;
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={17.2} fill="rgba(0,93,226,0.10)" />
        <Circle cx={c} cy={c} r={5.8} fill={colors.white} />
        <Circle cx={c} cy={c} r={4.4} fill="#005DE2" />
      </Svg>
      <View style={[styles.abs, { left: c - w / 2 - 1.5, top: c - TIP_TO_DOT - h - 1.5 }]}>
        <Svg width={w + 3} height={h + 3} viewBox="-1.5 -1.5 27 34.7">
          <Path d={DROP} fill={colors.blue} stroke={colors.white} strokeWidth={1.2} />
          <Circle cx={12} cy={12} r={3.9} fill={colors.white} />
        </Svg>
      </View>
    </View>
  );
}

/**
 * Mancha gris de "zona sin cobertura" (46): polígono redondeado alrededor del pin, gris al ~15 %.
 * El contenedor mide 520 × 520 pt y su centro es el pin.
 */
export function NoCoverageArea() {
  return (
    <View pointerEvents="none" style={{ width: 520, height: 520 }}>
      <Svg width={520} height={520} viewBox="0 0 520 520">
        <Path
          d="M200 140 C250 118 330 122 380 150 C430 178 455 230 452 290 C450 350 430 410 380 440 C330 468 260 466 210 450 C170 436 140 405 132 365 C124 320 140 285 150 250 C160 210 165 160 200 140 Z"
          fill="rgba(60,60,64,0.15)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});
