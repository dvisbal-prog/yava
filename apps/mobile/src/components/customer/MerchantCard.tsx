import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, formatCOP, formatRating } from "@yava/shared";
import { Text, Badge } from "@/components/ui";
import { merchantImage, type MerchantImageKind } from "@/lib/design-images";

export interface MerchantCardData {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  cover_url: string | null;
  delivery_fee: number;
  prep_min: number;
  prep_max: number;
  rating_avg: number;
  rating_count: number;
  is_open: boolean;
  slug?: string | null;
}

/** Separador "·" con el aire del diseño (≈ 5 pt a cada lado a 10 pt). */
export const DOT = "\u2004·\u2004";
/** Separador "·" apretado de la tarjeta compacta (C9). */
export const DOT_TIGHT = " · ";

/** "25–35 min" con raya corta, como en los diseños. */
export function etaText(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "";
  if (min && max && min !== max) return `${min}–${max} min`;
  return `${min ?? max} min`;
}

/** "Envío $3.000" / "Envío gratis". */
export function feeText(fee: number): string {
  return fee > 0 ? `Envío ${formatCOP(fee)}` : "Envío gratis";
}

/** Foto de diseño del comercio (o la de la BD) para el tipo de tarjeta. */
export function merchantPhoto(m: MerchantCardData, kind: MerchantImageKind) {
  return merchantImage({ name: m.name, slug: m.slug, cover_url: m.cover_url, logo_url: m.logo_url }, kind);
}

/**
 * Fila "★ 4,8 · Envío $3.000" (C7/C9). `size` = tamaño del texto (10 en 08 carrusel, 8,6 en tarjeta compacta,
 * 13,5 en tarjetas anchas). `extra` agrega segmentos antes del envío (p. ej. el tiempo en 09/10).
 */
export function RatingLine({ rating, fee, size = 10, extra, showFee = true, style, dot = DOT }: {
  rating: number; fee?: number; size?: number; extra?: string[]; showFee?: boolean; style?: StyleProp<ViewStyle>; dot?: string;
}) {
  const parts = [...(extra ?? []), ...(showFee && fee !== undefined ? [feeText(fee)] : [])];
  return (
    <View style={[styles.rating, style]}>
      <View style={{ width: size * 1.2, height: size * 1.2, marginRight: size * 0.25, alignItems: "center", justifyContent: "center", transform: [{ translateY: -size * 0.1 }] }}>
        <Ionicons name="star" size={Math.round(size * 1.08)} color={colors.star} />
      </View>
      <Text numberOfLines={1} style={{ fontSize: size, lineHeight: size * 1.4, color: colors.textTertiary, flexShrink: 1 }}>
        <Text style={{ fontSize: size, lineHeight: size * 1.4, fontWeight: "600", color: colors.gray700 }}>{formatRating(Number(rating))}</Text>
        {parts.map((p) => `${dot}${p}`).join("")}
      </Text>
    </View>
  );
}

/**
 * C7 · Tarjeta del carrusel "Restaurantes cerca" (08): sin contenedor, foto 135 × 70 pt radio 10 y debajo
 * (con 1,6 pt de sangría, como en el PNG) nombre (11,5 bold), "Ceviches · 25–35 min" y "★ 4,8 · Envío $3.000".
 */
export function MerchantCarouselCard({ m, onPress, width = 135, photoHeight = 70, style, photoKind = "card" }: {
  m: MerchantCardData; onPress: () => void; width?: number; photoHeight?: number; style?: StyleProp<ViewStyle>;
  /** Tipo de foto de diseño (por defecto `card`; 08 usa `carousel`). */
  photoKind?: MerchantImageKind;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [{ width, opacity: pressed ? 0.88 : 1 }, style]}>
      <View>
        <Image source={merchantPhoto(m, photoKind)} style={[styles.carouselPhoto, { height: photoHeight }, !m.is_open && styles.closedPhoto]} contentFit="cover" transition={120} />
        {!m.is_open ? <Badge label="Cerrado" tone="closed" style={styles.closedBadge} /> : null}
      </View>
      <View style={{ paddingLeft: 1.6 }}>
        <Text variant="cardName" numberOfLines={1} style={{ marginTop: 3.5 }}>{m.name}</Text>
        <Text variant="meta" tone="tertiary" numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
        <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={10} style={{ marginTop: 3.2 }} />
      </View>
    </Pressable>
  );
}

/**
 * C9 · Tarjeta compacta horizontal ("Para tu próximo antojo", 08): 198 × 72 pt, borde `cardBorder`, radio 12,
 * foto a la izquierda (89 pt, a sangre) y a la derecha nombre, meta y calificación.
 */
export function MerchantCompactCard({ m, onPress, width = 198, height = 72, style, photoKind = "card" }: {
  m: MerchantCardData; onPress: () => void; width?: number; height?: number; style?: StyleProp<ViewStyle>;
  /** Tipo de foto de diseño (por defecto `card`; 08 usa `compact`). */
  photoKind?: MerchantImageKind;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name}
      style={({ pressed }) => [styles.compact, { width, height, opacity: pressed ? 0.88 : 1 }, style]}>
      <View style={styles.compactPhoto}>
        <Image source={merchantPhoto(m, photoKind)} style={[StyleSheet.absoluteFill, !m.is_open && styles.closedPhoto]} contentFit="cover" transition={120} />
      </View>
      <View style={styles.compactBody}>
        <Text numberOfLines={1} style={styles.compactName}>{m.name}</Text>
        <Text variant="metaS" tone="tertiary" numberOfLines={1} style={{ marginTop: 2.7 }}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT_TIGHT)}</Text>
        <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={8.1} dot={DOT_TIGHT} style={{ marginTop: 4.6 }} />
      </View>
    </Pressable>
  );
}

/**
 * C8a · Tarjeta ancha sin contenedor (09 "Cerca de ti"): foto a lo ancho 101 pt radio 12 y debajo nombre,
 * meta y calificación con tiempo.
 */
export function MerchantWideCard({ m, onPress, photoHeight = 101, style }: { m: MerchantCardData; onPress: () => void; photoHeight?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, style]}>
      <View>
        <Image source={merchantPhoto(m, "wide")} style={[styles.widePhoto, { height: photoHeight }, !m.is_open && styles.closedPhoto]} contentFit="cover" transition={120} />
        {!m.is_open ? <Badge label="Cerrado" tone="closed" style={styles.closedBadge} /> : null}
      </View>
      <Text variant="bodyL" style={{ fontWeight: "700", marginTop: 6 }} numberOfLines={1}>{m.name}</Text>
      <Text variant="caption2" tone="tertiary" numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
      <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={12} style={{ marginTop: 3 }} />
    </Pressable>
  );
}

/**
 * C8b · Tarjeta grande con sello (10 "Restaurantes"): borde + sombra de tarjeta, radio 16, foto superior 137 pt,
 * sello circular blanco opcional (`seal`) y cuerpo con nombre, categoría y "★ 4,8 · 25–35 min · Envío $3.000".
 */
export function MerchantHeroCard({ m, onPress, photoHeight = 137, seal = true, style }: { m: MerchantCardData; onPress: () => void; photoHeight?: number; seal?: boolean; style?: StyleProp<ViewStyle> }) {
  const sealImg = merchantImage({ name: m.name, slug: m.slug, logo_url: m.logo_url }, "seal");
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [styles.hero, { opacity: pressed ? 0.92 : 1 }, style]}>
      <Image source={merchantPhoto(m, "wide")} style={[{ width: "100%", height: photoHeight, backgroundColor: colors.surfaceGray }, !m.is_open && styles.closedPhoto]} contentFit="cover" transition={120} />
      {seal && sealImg ? (
        <View style={styles.seal}><Image source={sealImg} style={{ width: "86%", height: "86%" }} contentFit="contain" /></View>
      ) : null}
      {!m.is_open ? <Badge label="Cerrado" tone="closed" style={[styles.closedBadge, { left: undefined, right: 10 }]} /> : null}
      <View style={styles.heroBody}>
        <View style={{ flex: 1 }}>
          <Text variant="h3" style={{ fontSize: 17.5, lineHeight: 22 }} numberOfLines={1}>{m.name}</Text>
          {m.tagline ? <Text variant="bodyS" tone="tertiary" numberOfLines={1}>{m.tagline}</Text> : null}
          <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={13} extra={[etaText(m.prep_min, m.prep_max)]} style={{ marginTop: 3 }} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

/** Tarjeta ancha con contenedor para carruseles (versión anterior; se conserva por compatibilidad). */
export function MerchantCardWide({ m, onPress, width = 240 }: { m: MerchantCardData; onPress: () => void; width?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wide, { width, opacity: pressed ? 0.9 : 1 }]}>
      <Image source={merchantPhoto(m, "card")} style={[styles.cover, !m.is_open && styles.closedPhoto]} contentFit="cover" transition={150} />
      {!m.is_open ? <Badge label="Cerrado" tone="closed" style={styles.closedBadge} /> : null}
      <View style={{ paddingHorizontal: 12, paddingTop: 9, paddingBottom: 12 }}>
        <Text variant="bodyL" style={{ fontWeight: "700" }} numberOfLines={1}>{m.name}</Text>
        <Text variant="caption2" tone="tertiary" numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
        <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={11.5} style={{ marginTop: 3 }} />
      </View>
    </Pressable>
  );
}

/** Fila para listas verticales (Restaurantes, Favoritos, Mercado): foto 76 pt radio 12 + textos. */
export function MerchantRow({ m, onPress, right }: { m: MerchantCardData; onPress: () => void; right?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
      <Image source={merchantPhoto(m, "card")} style={[styles.rowImg, !m.is_open && { opacity: 0.5 }]} contentFit="cover" transition={150} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="bodyL" style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>{m.name}</Text>
          {!m.is_open ? <Badge label="Cerrado" tone="closed" /> : null}
          {right}
        </View>
        <Text variant="caption2" tone="tertiary" numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
        <RatingLine rating={m.rating_avg} fee={m.delivery_fee} size={12} style={{ marginTop: 3 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rating: { flexDirection: "row", alignItems: "center" },
  carouselPhoto: { width: "100%", borderRadius: radius.r10, backgroundColor: colors.surfaceGray },
  closedPhoto: { opacity: 0.55 },
  closedBadge: { position: "absolute", top: 6, left: 6 },
  compact: { flexDirection: "row", borderRadius: radius.r12, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  /** A sangre a la izquierda (la recorta el radio de la tarjeta) y con esquinas derechas redondeadas de 5 pt, como en 08. */
  compactPhoto: { width: 88.5, backgroundColor: colors.surfaceGray, borderTopRightRadius: 5, borderBottomRightRadius: 5, overflow: "hidden" },
  compactBody: { flex: 1, paddingLeft: 9.5, paddingRight: 2, paddingTop: 14.4 },
  compactName: { fontSize: 9.6, lineHeight: 13, fontWeight: "700", color: colors.ink },
  widePhoto: { width: "100%", borderRadius: radius.r12, backgroundColor: colors.surfaceGray },
  hero: { backgroundColor: colors.white, borderRadius: radius.r16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden", ...shadows.card },
  seal: { position: "absolute", top: 8, left: 8, width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...shadows.soft },
  heroBody: { flexDirection: "row", alignItems: "center", padding: 12 },
  wide: { backgroundColor: colors.white, borderRadius: radius.r16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden", marginRight: 12 },
  cover: { width: "100%", height: 120, backgroundColor: colors.surfaceGray },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowImg: { width: 76, height: 76, borderRadius: radius.r12, backgroundColor: colors.surfaceGray },
});
