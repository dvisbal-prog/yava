import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

/**
 * Pulgar de "¿Cómo fue la entrega?" (24), dibujado como en el PNG: puño con manga separada y dedos con muescas.
 * `filled` = relleno (opción elegida); si no, contorno fino de 1,4 pt. `down` lo gira 180° (👎: manga a la derecha).
 * Medidas: caja de tinta 28 × 28 pt.
 */
const HAND =
  "M9.6 28 L23 28 C24.6 28 25.8 26.9 25.8 25.4 C25.8 24.4 25.3 23.6 24.6 23 C25.9 22.6 26.8 21.6 26.8 20.3 " +
  "C26.8 19.6 26.5 18.9 26 18.5 C27 18.1 27.6 17.1 27.6 16 C27.6 15.3 27.3 14.6 26.8 14.2 C27.6 13.7 28 12.9 28 12 " +
  "C28 10.7 26.9 9.6 25.6 9.6 L19.6 9.6 L19.6 3.4 C19.6 1.5 18.2 0 16.4 0 C14.6 0 13.3 1.5 13.3 3.4 L13.3 5.4 " +
  "C13.3 6.1 13 6.8 12.6 7.3 L8 12.6 C7.5 13.2 7.2 13.9 7.2 14.7 L7.2 25.6 C7.2 26.9 8.3 28 9.6 28 Z";

export function ThumbIcon({ down = false, filled = false, color, size = 28, stroke = 1.4 }: {
  down?: boolean; filled?: boolean; color: string; size?: number; stroke?: number;
}) {
  // Con contorno, el trazo va por dentro de la caja (se encoge la figura medio trazo por lado).
  const inset = filled ? 0 : stroke / 2;
  const k = (28 - 2 * inset) / 28;
  const paint = filled ? { fill: color } : { fill: "none", stroke: color, strokeWidth: stroke / k, strokeLinejoin: "round" as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <G transform={`${down ? "rotate(180 14 14) " : ""}translate(${inset} ${inset}) scale(${k})`}>
        <Rect x={0.2} y={11.4} width={5.4} height={16.6} rx={2.6} {...paint} />
        <Path d={HAND} {...paint} />
      </G>
    </Svg>
  );
}
