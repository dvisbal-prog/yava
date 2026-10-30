import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { merchantDesignImage, normalizeName, type DesignImage } from "@/lib/design-images";

/**
 * Baldosas de marca de las tiendas sin arte de diseño: el nombre de la tienda en negrita sobre un color sólido.
 * Es una baldosa tipográfica propia (no el logo de la cadena: nunca se copia ni se recrea su arte).
 * Clave: nombre normalizado (`normalizeName`) o slug.
 */
export const STORE_WORDMARKS: Record<string, { label: string; bg: string; fg: string }> = {
  d1: { label: "D1", bg: "#E30613", fg: "#FFFFFF" },
  olimpica: { label: "Olímpica", bg: "#FFD100", fg: "#C8102E" },
  carulla: { label: "Carulla", bg: "#00843D", fg: "#FFFFFF" },
  oxxo: { label: "OXXO", bg: "#D52B1E", fg: "#FFC72C" },
};

/**
 * Texto de la ficha pequeña: el nombre entero si tiene hasta 2 letras ("D1"); si no, la inicial ("O", "C"). Con 4 letras
 * ("OXXO") la letra quedaba de ~5 pt de borde a borde en la ficha de 22 pt.
 */
export function miniLabel(label: string): string {
  return label.length <= 2 ? label : label.slice(0, 1).toUpperCase();
}

/**
 * Fondo de los recortes de diseño cuadrados que se muestran enteros (`contain`) dentro de la baldosa 1,6:1 (logo de
 * una tienda sin fachada): el de Mercado del Puerto es una bolsa sobre menta `#D9F3E8` (esquinas del recorte).
 */
const LOGO_BG: Record<string, string> = {
  "mercado del puerto": "#D9F3E8",
};

type StoreLike = { name: string; slug?: string | null; logo_url?: string | null };

type TileArt =
  | { kind: "image"; source: DesignImage | { uri: string }; fit: "cover" | "contain"; bg: string }
  | { kind: "wordmark"; label: string; bg: string; fg: string };

/**
 * Arte de la baldosa: fachada de diseño → logo de diseño → baldosa tipográfica → `logo_url` → nombre en azul.
 * La fachada va primero: el logo de Mercado del Puerto es la misma bolsa de la tarjeta "Mercado" del Inicio, y así
 * las dos tiendas del diseño (Mercado del Puerto y Tienda de la Costa) se ven iguales, con su fachada de 25.
 */
export function storeTileArt(m: StoreLike): TileArt {
  const key = normalizeName(m.name);
  const front = merchantDesignImage(m, "storefront");
  if (front !== undefined) return { kind: "image", source: front, fit: "cover", bg: colors.surfaceGray };
  const logo = merchantDesignImage(m, "logo");
  if (logo !== undefined) return { kind: "image", source: logo, fit: "contain", bg: LOGO_BG[key] ?? colors.white };
  const mark = STORE_WORDMARKS[key] ?? STORE_WORDMARKS[normalizeName(m.slug?.replace(/-/g, " "))];
  if (mark) return { kind: "wordmark", ...mark };
  if (m.logo_url) return { kind: "image", source: { uri: m.logo_url }, fit: "contain", bg: colors.white };
  return { kind: "wordmark", label: m.name, bg: colors.blueSoft, fg: colors.blue };
}

/** Tamaño del nombre según su largo: "D1" grande, "Olímpica" mediano, nombres largos en dos líneas. */
function wordmarkSize(label: string, width: number): number {
  const k = width / 112;
  if (label.length <= 2) return 30 * k;
  if (label.length <= 4) return 22 * k;
  if (label.length <= 8) return 18.5 * k;
  return 13.5 * k;
}

/** Baldosa de tienda ≈ 1,6:1 (Inicio "Tiendas cerca de ti"). */
export function StoreLogoTile({ m, width, height, radius = 14, dimmed, style }: {
  m: StoreLike; width: number; height: number; radius?: number; dimmed?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const art = storeTileArt(m);
  return (
    <View style={[styles.tile, { width, height, borderRadius: radius, backgroundColor: art.bg }, art.kind === "image" && art.bg === colors.white && styles.bordered, dimmed && { opacity: 0.55 }, style]}>
      {art.kind === "image" ? (
        <Image source={art.source} style={StyleSheet.absoluteFill} contentFit={art.fit} transition={120} accessibilityIgnoresInvertColors />
      ) : (
        <Text numberOfLines={2} adjustsFontSizeToFit
          style={[styles.word, { color: art.fg, fontSize: wordmarkSize(art.label, width), lineHeight: wordmarkSize(art.label, width) * 1.12 }]}>
          {art.label}
        </Text>
      )}
    </View>
  );
}

/** Ficha pequeña cuadrada (20–22 pt) con el nombre corto (`miniLabel`) o el arte de la tienda: "logo · tienda · tiempo". */
export function StoreMiniLogo({ m, size = 20 }: { m: StoreLike; size?: number }) {
  const art = storeTileArt(m);
  const text = art.kind === "wordmark" ? miniLabel(art.label) : "";
  const fontSize = text.length > 1 ? size * 0.42 : size * 0.52;
  return (
    <View style={[styles.mini, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: art.bg }]}>
      {art.kind === "image" ? (
        <Image source={art.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      ) : (
        <Text numberOfLines={1} style={[styles.miniText, { color: art.fg, fontSize }]}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { overflow: "hidden", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  bordered: { borderWidth: 1, borderColor: colors.cardBorder },
  word: { fontWeight: "800", letterSpacing: -0.6, textAlign: "center" },
  mini: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  miniText: { fontWeight: "800", letterSpacing: -0.3, includeFontPadding: false },
});
