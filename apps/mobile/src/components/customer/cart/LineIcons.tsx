import React from "react";
import Svg, { Path } from "react-native-svg";
import { colors } from "@yava/shared";

/**
 * Íconos de trazo redondeado dibujados a partir del PNG 28 (los de Ionicons/MCI tienen otro dibujo:
 * casa con chimenea, globo relleno). Medidas en pt, trazo 1,9.
 */

/** Globo de mensaje con dos líneas ("Si falta un producto", 28): 24 × 22 pt. */
export function ChatLinesIcon({ color = colors.ink, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size * (22 / 24)} viewBox="0 0 24 22" fill="none">
      <Path
        d="M4.1 1.4H20.1A3 3 0 0 1 23.1 4.4V14.6A3 3 0 0 1 20.1 17.6H10.4L5.8 21.3V17.6H4.1A3 3 0 0 1 1.1 14.6V4.4A3 3 0 0 1 4.1 1.4Z"
        stroke={color} strokeWidth={1.9} strokeLinejoin="round"
      />
      <Path d="M6.6 7.3H14.6M6.6 11.8H10.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

/** Hoja con esquina cortada y tres líneas ("Entrega en la puerta", 16): 22 × 24 pt, trazo 2,2. */
export function DocLinesIcon({ color = colors.ink, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size * (22 / 24)} height={size} viewBox="0 0 22 24" fill="none">
      <Path d="M5.2 2.2H13.5L19.2 8V19.2A3 3 0 0 1 16.2 22.2H5.2A3 3 0 0 1 2.2 19.2V5.2A3 3 0 0 1 5.2 2.2Z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M6.6 7.6H9.3M6.9 11.8H15M6.9 16.3H15" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Flecha ← de "Agregar cupón" (19): trazo 1,9 pt como en el PNG (la de Ionicons mide 3 pt de grosor).
 * Tinta de 18 × 16,2 pt dentro de un lienzo de 20 × 18.
 */
export function ArrowBackIcon({ color = colors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={18} viewBox="0 0 20 18" fill="none">
      <Path d="M18.05 9H1.95M9.1 1.85L1.95 9L9.1 16.15" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Casa con puerta de arco (dirección de entrega, 28): 24 × 24 pt. */
export function HouseIcon({ color = colors.ink, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1.6 11.4L11.5 2.4L21.4 11.4" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.7 9.6V22.3H20.3V9.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.6 22.3V17.6A1.9 1.9 0 0 1 13.4 17.6V22.3" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
