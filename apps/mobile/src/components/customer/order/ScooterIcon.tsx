import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

/**
 * Moto (scooter sin caja) del nodo "En camino" de la línea de tiempo de 21, calcada del PNG:
 * manubrio arriba a la derecha, escudo frontal, asiento inclinado, piso y dos ruedas de aro.
 * Coordenadas en medios puntos (cuadrícula del recorte); caja de tinta 18,5 × 14 pt.
 */
export function ScooterIcon({ color = "#FFFFFF", width = 19 }: { color?: string; width?: number }) {
  const height = (width * 29) / 38;
  const soft = { stroke: color, strokeWidth: 0.6, strokeLinejoin: "round" as const };
  return (
    <Svg width={width} height={height} viewBox="7 11 38 29">
      {/* Manubrio */}
      <Rect x={25} y={11} width={7} height={4} rx={1.3} fill={color} />
      {/* Escudo frontal y columna */}
      <Path d="M28 15 L32.5 15 L34 17.5 L36.5 19 L38.5 21.5 L39 24 L36 25 L33.5 25.5 L32.5 28 L31.5 30 L28 29 L29.5 25 L30 21 L29 17 Z" fill={color} {...soft} />
      {/* Asiento */}
      <Path d="M7.5 18 L8.5 17 L10.5 17.6 L24.5 18 L24.5 21 L23 22.5 L22.8 27.5 L19.5 27.5 L18.5 24 L16 22 L13.5 21 L10 20.5 L8 19.5 Z" fill={color} {...soft} />
      {/* Carrocería trasera y piso */}
      <Path d="M9 27 L10 24 L12 23.5 L14.5 24.5 L17.5 26.5 L23 27 L28 28 L31.5 28 L31 30 L30 33 L17 33 L16 30 L9 30 Z" fill={color} {...soft} />
      {/* Ruedas */}
      <Circle cx={12.9} cy={33} r={4.5} stroke={color} strokeWidth={3} fill="none" />
      <Circle cx={38.1} cy={32.6} r={4.55} stroke={color} strokeWidth={3.3} fill="none" />
    </Svg>
  );
}
