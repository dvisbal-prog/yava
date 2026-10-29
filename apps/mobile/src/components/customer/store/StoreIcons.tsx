import React from "react";
import Svg, { Rect, Circle, Path } from "react-native-svg";
import { colors } from "@yava/shared";

/**
 * Íconos dibujados sobre los PNG cuando ningún set de @expo/vector-icons tiene la misma silueta.
 */

/** Repartidor en moto con caja de domicilios (12, franja "Envío"): ≈ 14,5 × 13 pt. `size` = alto en pt. */
export function RiderIcon({ size = 13, color = "#7C849A" }: { size?: number; color?: string }) {
  return (
    <Svg width={(size * 14.6) / 13} height={size} viewBox="0 0 14.6 13">
      {/* caja trasera */}
      <Rect x={0} y={2.7} width={5.5} height={3.3} rx={0.45} fill={color} />
      {/* cabeza */}
      <Circle cx={7.55} cy={1.25} r={1.2} fill={color} />
      {/* torso y brazo hasta el manubrio */}
      <Path d="M7.1 2.9 L6.5 6.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
      <Path d="M7.4 3.3 L10.3 5.3 L12.5 5.4" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* horquilla delantera */}
      <Path d="M12.1 5.2 L13.2 9.3" stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      {/* chasis */}
      <Path d="M1.3 6.1 H8.4 L10 7.9 H12.4 L12 9.3 H7.9 L6.8 8.3 H1.3 Z" fill={color} />
      {/* ruedas */}
      <Circle cx={2.65} cy={10.55} r={1.75} stroke={color} strokeWidth={1.25} fill="none" />
      <Circle cx={11.85} cy={10.55} r={1.75} stroke={color} strokeWidth={1.25} fill="none" />
    </Svg>
  );
}

/** Tienda con toldo relleno de 3 ondas y cuerpo en "U" (30, tarjeta de la farmacia): ≈ 23,4 × 22,6 pt. */
export function StoreAwningIcon({ size = 23, color = colors.blue }: { size?: number; color?: string }) {
  return (
    <Svg width={(size * 23.4) / 22.6} height={size} viewBox="0 0 23.4 22.6">
      {/* toldo */}
      <Path
        d="M4.6 0 H18.8 Q20.3 0 20.8 1.4 L23.4 9.2 A3.9 3.9 0 0 1 15.6 9.6 A3.9 3.9 0 0 1 7.8 9.6 A3.9 3.9 0 0 1 0 9.2 L2.6 1.4 Q3.1 0 4.6 0 Z"
        fill={color}
      />
      {/* franjas blancas del toldo */}
      <Path d="M8.3 1.2 L7.1 9.4 M15.1 1.2 L16.3 9.4" stroke="#FFFFFF" strokeWidth={0.9} strokeLinecap="round" />
      {/* cuerpo */}
      <Path d="M2.9 13 V20.4 Q2.9 21.8 4.3 21.8 H19.1 Q20.5 21.8 20.5 20.4 V13" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

/** Hoja de contorno con nervio central (30, fila "Ingredientes"): ≈ 14 × 14 pt. */
export function LeafIcon({ size = 14.5, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M1.6 15 C1 8.6 5.4 2.2 14.9 1.1 C14.6 9.4 9.4 14.4 1.6 15 Z" stroke={color} strokeWidth={1.25} fill="none" strokeLinejoin="round" />
      <Path d="M1.8 14.8 L8.6 7.6" stroke={color} strokeWidth={1.25} strokeLinecap="round" />
    </Svg>
  );
}
