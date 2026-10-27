import React from "react";
import { Image } from "expo-image";

// Generados desde YAVA/reinicio-v2/logo-aprobado.png (ver assets/images/LEEME.txt).
const LOGO_HORIZONTAL = require("../../../assets/images/logo-horizontal.png");
const LOGO_MARK = require("../../../assets/images/logo-mark.png");
/** Proporción ancho/alto de logo-horizontal.png (1138×300). */
const HORIZONTAL_RATIO = 1138 / 300;

/** Símbolo YAVA (cuadro amarillo con la Y y el punto rojo), para usos cuadrados. */
export function LogoMark({ size = 56 }: { size?: number }) {
  return <Image source={LOGO_MARK} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="YAVA" />;
}

/** Logo aprobado. `size` es la altura; con `word={false}` muestra solo el símbolo. */
export function Logo({ size = 56, word = true }: { size?: number; word?: boolean }) {
  if (!word) return <LogoMark size={size} />;
  return (
    <Image
      source={LOGO_HORIZONTAL}
      style={{ height: size, width: Math.round(size * HORIZONTAL_RATIO) }}
      contentFit="contain"
      accessibilityLabel="YAVA"
    />
  );
}
