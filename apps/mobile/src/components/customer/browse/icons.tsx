import React from "react";
import Svg, { Path } from "react-native-svg";
import { colors } from "@yava/shared";

/** Tienda con toldo de ondas (segmento "Restaurantes" de 10), 16 × 17 pt a `size` 18. */
export function ShopIcon({ size = 18, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 1.05} viewBox="0 0 18 19" fill="none">
      <Path d="M4.3 1.6H13.7Q14.5 1.6 14.9 2.3L16.6 6.2V15.9Q16.6 17.7 14.8 17.7H3.2Q1.4 17.7 1.4 15.9V6.2L3.1 2.3Q3.5 1.6 4.3 1.6Z"
        stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
      <Path d="M1.4 6.4V7.6A1.9 1.9 0 0 0 5.2 7.6A1.9 1.9 0 0 0 9 7.6A1.9 1.9 0 0 0 12.8 7.6A1.9 1.9 0 0 0 16.6 7.6V6.4"
        stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M5.2 3.4V7.6M9 3.4V7.6M12.8 3.4V7.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
