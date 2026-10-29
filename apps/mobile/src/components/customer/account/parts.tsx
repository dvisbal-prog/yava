import React from "react";
import { View, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors, formatCOP, formatRating } from "@yava/shared";
import { Text } from "@/components/ui";
import { ActivityIndicator } from "react-native";
import { merchantImage } from "@/lib/design-images";
import { favoriteProductPhoto } from "./photos";
import { etaText, feeText, type MerchantCardData } from "@/components/customer/MerchantCard";
import { ft } from "./kit";

/** En web un `<button>` no puede contener otro: las tarjetas con botón interno solo se anuncian como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);

/** Azul del marcador de favorito (34 mide #0148C9). */
export const BOOKMARK_BLUE = "#0148C9";

/** Marcador relleno del diseño (34): 13,9 × 18,5 pt, esquinas superiores redondeadas y muesca abajo. */
export function BookmarkIcon({ color = BOOKMARK_BLUE, width = 13.9, height = 18.5 }: { color?: string; width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 13.9 18.5">
      <Path d="M0 2.2Q0 0 2.2 0H11.7Q13.9 0 13.9 2.2V17.6Q13.9 18.5 13.1 18L6.95 13.6L0.8 18Q0 18.5 0 17.6Z" fill={color} />
    </Svg>
  );
}

/**
 * C27 · Pestañas subrayadas a media pantalla (34 "Restaurantes / Productos", 36 "En curso / Historial"):
 * activa 14,2 pt semibold `blueLink` con subrayado 2,8 pt `blue`; inactiva 14 pt regular gris; línea base 1 pt.
 */
export function UnderlineTabs<T extends string>({ options, value, onChange, style, height = 30, labelTop = 0, activeSize = 14.4, inactiveSize = 14.1, weights }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>;
  /** Ancho relativo de cada pestaña (36 no las parte a la mitad: 192 / 172 pt). Por defecto, iguales. */
  weights?: number[];
  /** Alto total (hasta el borde inferior del subrayado) y aire sobre la etiqueta: 34 = 30/0, 36 = 35/9. */
  height?: number; labelTop?: number; activeSize?: number; inactiveSize?: number;
}) {
  return (
    <View style={[styles.tabs, { height }, style]} accessibilityRole="tablist">
      <View style={styles.tabsBase} />
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.tab, { paddingTop: labelTop }, weights?.[i] ? { flex: weights[i] } : null]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={active ? ft(activeSize, "600", colors.blueLink, 19) : ft(inactiveSize, "400", "#7A8398", 19)}>{o.label}</Text>
            {active ? <View style={styles.tabLine} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * C9 (34) · Tarjeta de restaurante favorito a lo ancho: 358 × 108 pt, radio 16, borde; foto a la izquierda de 178 pt
 * a sangre; nombre, categoría, "★ 4,8 · 25–35 min" y píldora "Envío $3.000"; marcador azul arriba a la derecha.
 */
export function FavoriteMerchantCard({ m, onPress, onToggle, style }: {
  m: MerchantCardData; onPress: () => void; onToggle?: () => void; style?: StyleProp<ViewStyle>;
}) {
  const eta = etaText(m.prep_min, m.prep_max);
  return (
    <Pressable onPress={onPress} accessibilityRole={onToggle ? CARD_ROLE : "button"} accessibilityLabel={m.name}
      style={({ pressed }) => [styles.mCard, { opacity: pressed ? 0.9 : 1 }, style]}>
      <View style={styles.mPhoto}>
        <Image source={merchantImage(m, "card")} style={[StyleSheet.absoluteFill, !m.is_open && { opacity: 0.55 }]} contentFit="cover" transition={120} />
      </View>
      <View style={styles.mBody}>
        <Text style={ft(13.3, "700", colors.ink, 18)} numberOfLines={1}>{m.name}</Text>
        {m.tagline ? <Text style={[ft(11.5, "400", colors.textTertiary, 16), { marginTop: 0.2 }]} numberOfLines={1}>{m.tagline}</Text> : null}
        <View style={styles.mRating}>
          <Ionicons name="star" size={13.5} color={colors.star} style={{ marginRight: 5.5, marginTop: -1 }} />
          <Text style={ft(12, "600", "#364461", 16)}>{formatRating(Number(m.rating_avg))}</Text>
          {eta ? <Text style={ft(12, "400", "#425272", 16)}>{"  ·  "}{eta}</Text> : null}
        </View>
        <View style={styles.feePill}>
          <Text style={ft(10.2, "400", "#4C566E", 14)} numberOfLines={1}>{m.is_open ? feeText(m.delivery_fee) : "Cerrado ahora"}</Text>
        </View>
      </View>
      {onToggle ? (
        <Pressable onPress={onToggle} hitSlop={12} style={styles.mMark} accessibilityRole="button" accessibilityLabel={`Quitar ${m.name} de favoritos`}>
          <BookmarkIcon />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/**
 * Tarjeta de producto de 34 "Tus productos favoritos": 358 × 88 pt, radio 16, borde; foto 106 × 77 radio 10 con
 * 8 pt de margen; nombre, comercio y precio; marcador azul arriba a la derecha.
 */
export function FavoriteProductCard({ p, merchantName, onPress, style, marked = true }: {
  p: { id: string; name: string; price: number; image_urls?: string[] | null; image_url?: string | null };
  merchantName?: string | null; onPress: () => void; style?: StyleProp<ViewStyle>; marked?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={p.name}
      style={({ pressed }) => [styles.pCard, { opacity: pressed ? 0.9 : 1 }, style]}>
      <Image source={favoriteProductPhoto(p)} style={styles.pPhoto} contentFit="cover" transition={120} />
      <View style={styles.pBody}>
        <Text style={ft(12.1, "600", colors.ink, 17)} numberOfLines={1}>{p.name}</Text>
        {merchantName ? <Text style={[ft(12.3, "400", colors.textTertiary, 16), { marginTop: -0.6 }]} numberOfLines={1}>{merchantName}</Text> : null}
        <Text style={[ft(11.2, "600", colors.ink, 16), { marginTop: merchantName ? 11.5 : 29.5 }]}>{formatCOP(p.price)}</Text>
      </View>
      {marked ? <View style={styles.pMark} pointerEvents="none"><BookmarkIcon /></View> : null}
    </Pressable>
  );
}

/**
 * CTA azul a lo ancho de estas pantallas (37 "Usar esta dirección", 39 "Hablar con soporte", 48 "Reintentar"):
 * alto 50, radio 13, azul #0049BB, texto 15,4 pt semibold blanco; `leading` (ícono a la izquierda) y `right` (precio + chevron).
 */
export function PrimaryCTA({ title, onPress, height = 50, radius = 13, fontSize = 15.4, weight = "600", leading, right, loading, disabled, style, pill, accessibilityLabel, color = CTA_BLUE }: {
  /** Azul del botón: cada PNG lo trae algo distinto (37 #0048B5, 39 #0047AC, 48 #003E9E). */
  color?: string;
  title: string; weight?: "500" | "600" | "700"; onPress?: () => void; height?: number; radius?: number; fontSize?: number; leading?: React.ReactNode; right?: React.ReactNode;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; pill?: boolean; accessibilityLabel?: string;
}) {
  const off = disabled && !loading;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [styles.cta, { height, borderRadius: pill ? height / 2 : radius, backgroundColor: off ? colors.disabledBg : pressed ? colors.blueDark : color }, style]}>
      {loading ? <ActivityIndicator color={colors.white} /> : (
        <View style={styles.ctaRow}>
          {leading ? <View style={{ marginRight: 9 }}>{leading}</View> : null}
          <Text style={ft(fontSize, weight, off ? colors.disabledText : colors.white, Math.round(fontSize * 1.3))} numberOfLines={1}>{title}</Text>
          {right}
        </View>
      )}
    </Pressable>
  );
}

/** Azul de los CTA de estas pantallas (37/39/48 miden #0049BB). */
export const CTA_BLUE = "#0049BB";

const styles = StyleSheet.create({
  cta: { alignItems: "center", justifyContent: "center", alignSelf: "stretch", paddingHorizontal: 18 },
  ctaRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row" },
  tabsBase: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, backgroundColor: "#E8EBEF" },
  tab: { flex: 1, alignItems: "center", paddingTop: 0 },
  tabLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2.8, backgroundColor: "#0A49E6", borderRadius: 1 },

  mCard: { flexDirection: "row", height: 108, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  mPhoto: { width: 178, marginLeft: -1, marginVertical: -1, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceGray },
  mBody: { flex: 1, paddingLeft: 12, paddingTop: 12, paddingRight: 30 },
  mRating: { flexDirection: "row", alignItems: "center", marginTop: 5.1 },
  feePill: { alignSelf: "flex-start", height: 21, borderRadius: 11, backgroundColor: "#F0F2F8", paddingHorizontal: 7.5, justifyContent: "center", marginTop: 8.1 },
  mMark: { position: "absolute", top: 12.4, right: 10 },

  pCard: { flexDirection: "row", height: 88, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, alignItems: "flex-start" },
  pPhoto: { width: 106, height: 77, borderRadius: 10, marginLeft: 7.5, marginTop: 4.6, backgroundColor: colors.surfaceGray },
  pBody: { flex: 1, paddingLeft: 12.1, paddingTop: 12.5, paddingRight: 30 },
  pMark: { position: "absolute", top: 14, right: 10 },
});
