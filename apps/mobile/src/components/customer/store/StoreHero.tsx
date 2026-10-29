import React from "react";
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { IconButton } from "@/components/ui";
import { designImages, type DesignImageSource } from "@/lib/design-images";

/** Alto de la barra de estado dibujada en los PNG (83 px ÷ 2,165): la foto de portada empieza ahí arriba. */
export const DESIGN_STATUS_BAR = 38.3;

/**
 * Portadas con recorte extendido: la foto sigue unas filas por debajo del borde de la hoja blanca para que sus
 * esquinas redondeadas muestren foto (como en el PNG) y no un color plano. Recorte base → [extendido, alto/ancho].
 */
const EXTENDED = new Map<DesignImageSource, [DesignImageSource, number]>([
  [designImages.productoCevicheClasicoDetalle, [designImages.productoCevicheClasicoDetalleExt, 532 / 851]],
  [designImages.mercadoPortadaTienda, [designImages.mercadoPortadaTiendaExt, 384 / 851]],
  [designImages.bocamarPortada, [designImages.bocamarPortadaExt, 598 / 851]],
]);

/** Cambia un recorte de portada por su versión extendida (si la hay) con su proporción alto/ancho. */
export function extendedHero(source: DesignImageSource | undefined, aspect: number): { source?: DesignImageSource; aspect: number } {
  const ext = source !== undefined ? EXTENDED.get(source) : undefined;
  return ext ? { source: ext[0], aspect: ext[1] } : { source, aspect };
}

/**
 * Portada a sangre (guía C25) para 12, 13, 26 y 43.
 * - `height`: alto visible bajo la barra de estado, hasta donde termina la foto (12: 167; con hoja blanca encima:
 *   borde de la hoja + su radio, p. ej. 13: 197,5 + 6,5).
 * - `aspect`: alto/ancho natural de la foto (los recortes del diseño empiezan en el tope de la pantalla del PNG).
 *   La foto se coloca como en el PNG: su tope queda 38 pt por encima del contenido (o en el borde si el
 *   `insets.top` real es mayor) y, si no alcanza a cubrir la caja (barra de estado más alta que la del PNG),
 *   se agranda para cubrirla: nunca queda una franja de color plano bajo la foto.
 * - `bottomRadius`: 24 en 12 (portada sola); 0 cuando una hoja blanca la monta.
 * - `left` / `right`: botones flotantes (`HeroButton`).
 */
export function StoreHero({ source, height, aspect, bottomRadius = 0, left, right, dim, style, buttonsLeft = 13, buttonsTop = 10, buttonsGap = 7.5, stretch = true, background = colors.surfaceGray }: {
  source?: DesignImageSource; height: number; aspect: number; bottomRadius?: number;
  left?: React.ReactNode; right?: React.ReactNode; dim?: boolean; style?: StyleProp<ViewStyle>;
  /** Posición de los botones flotantes (pt desde el borde izquierdo y desde `insets.top`). */
  buttonsLeft?: number; buttonsTop?: number; buttonsGap?: number;
  /** `false`: la foto conserva su alto natural aunque la caja sea más alta (lo que sobra toma `background`). */
  stretch?: boolean; background?: string;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const boxH = insets.top + height;
  const imgTop = Math.min(0, insets.top - DESIGN_STATUS_BAR);
  const imgH = stretch ? Math.max(width * aspect, boxH - imgTop) : width * aspect;
  return (
    <View style={[{ height: boxH, overflow: "hidden", backgroundColor: background, borderBottomLeftRadius: bottomRadius, borderBottomRightRadius: bottomRadius }, style]}>
      {source ? (
        <Image source={source} style={{ position: "absolute", left: 0, top: imgTop, width, height: imgH, opacity: dim ? 0.92 : 1 }}
          contentFit="cover" contentPosition="top" transition={150} />
      ) : null}
      <View style={[styles.bar, { top: insets.top + buttonsTop, left: buttonsLeft }]} pointerEvents="box-none">
        <View>{left}</View>
        <View style={[styles.right, { gap: buttonsGap }]}>{right}</View>
      </View>
    </View>
  );
}

/** Botón circular blanco con sombra suave sobre la portada (C25): 37,5 pt, ícono tinta 20. */
export function HeroButton({ icon, onPress, label, size = 37.5, iconSize = 20, color, style }: {
  icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; label: string; size?: number; iconSize?: number; color?: string; style?: StyleProp<ViewStyle>;
}) {
  return <IconButton icon={icon} variant="white" size={size} iconSize={iconSize} color={color} onPress={onPress} accessibilityLabel={label} style={style} />;
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: 13, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  right: { flexDirection: "row", gap: 7.5 },
});
