import React, { useState } from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, LayoutChangeEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import type { DesignImageSource } from "@/lib/design-images";

/** Fundido horizontal del color de la tarjeta (opaco a la izquierda) a transparente, sobre el borde izquierdo de la foto. */
function Fade({ color, id }: { color: string; id: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Foto a la derecha de una tarjeta de 33, al alto completo de la tarjeta. Con foto del diseño (`aspect` conocido) se
 * ancla al borde derecho con su proporción; con una foto de la BD ocupa el 58 % del ancho. En ambos casos un fundido
 * del color de fondo la mezcla con la parte de texto, como en el PNG.
 */
function OfferPhoto({ image, aspect, bg, fade = 34, id }: { image: DesignImageSource | undefined; aspect?: number; bg: string; fade?: number; id: string }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const width = aspect && box.h ? Math.min(box.w, box.h * aspect) : box.w * 0.58;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {box.w ? (
        <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width }}>
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right" transition={120} />
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: aspect ? fade : fade * 2.6 }}>
            <Fade color={bg} id={id} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Tarjeta de oferta de 33 (357 pt, radio 18): fondo crema que se funde con la foto de la derecha; "BOCAMAR" 8,2 pt
 * bold azul marino espaciado, título 16,8 pt bold (2–3 líneas), descripción 10,4 pt, precio/código 18 pt bold azul
 * marino y botón píldora azul "Pedir ahora ›" de 31 pt.
 */
export function OfferCard({ eyebrow, title, subtitle, highlight, cta, onCta, onHighlight, image, aspect, bg = "#FDF6EC", id, style }: {
  eyebrow?: string | null; title: string; subtitle?: string | null; highlight?: string | null; cta: string; onCta?: () => void; onHighlight?: () => void;
  image: DesignImageSource | undefined; aspect?: number; bg?: string; id: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.offer, { backgroundColor: bg }, style]}>
      <OfferPhoto image={image} aspect={aspect} bg={bg} id={id} />
      {eyebrow ? <Text numberOfLines={1} style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, !eyebrow && { marginTop: 14.4 }]}>{title}</Text>
      {subtitle ? <Text style={styles.desc}>{subtitle}</Text> : null}
      {/* Toda la tarjeta abre la oferta; el código y el botón van encima como hermanos (sin botones anidados en web). */}
      <Pressable onPress={onCta} disabled={!onCta} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={`${eyebrow ? `${eyebrow}. ` : ""}${title}`} />
      {highlight ? (
        <Pressable onPress={onHighlight} disabled={!onHighlight} hitSlop={6} style={{ alignSelf: "flex-start" }} accessibilityRole="button" accessibilityLabel={`Usar código ${highlight}`}>
          <Text style={styles.price}>{highlight}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onCta} disabled={!onCta} accessibilityRole="button" accessibilityLabel={cta}
        style={({ pressed }) => [styles.cta, !highlight && { marginTop: 12 }, { backgroundColor: pressed ? colors.blueDark : colors.blue }]}>
        <Text style={styles.ctaText}>{cta}</Text>
        <Ionicons name="chevron-forward" size={13} color={colors.white} style={{ marginLeft: 8, marginTop: 0.5 }} />
      </Pressable>
    </View>
  );
}

/**
 * Tarjeta gris de 33 "Descubre más" (357 × 93 pt, radio 18, fondo #F5F5F5): nombre 16,5 pt bold, categoría 10,5 pt y
 * "Desde $22.000" (precio 14,2 pt bold azul marino); foto a la derecha con fundido gris.
 */
export function DiscoverCard({ name, tagline, fromPrice, image, aspect, onPress, id, style }: {
  name: string; tagline?: string | null; fromPrice?: string | null; image: DesignImageSource | undefined; aspect?: number; onPress: () => void; id: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [styles.discover, { opacity: pressed ? 0.95 : 1 }, style]}>
      <OfferPhoto image={image} aspect={aspect} bg="#F5F5F5" id={id} fade={30} />
      <Text numberOfLines={1} style={styles.discName}>{name}</Text>
      {tagline ? <Text numberOfLines={1} style={styles.discTag}>{tagline}</Text> : null}
      {fromPrice ? (
        <Text style={styles.discFrom}>Desde <Text style={styles.discPrice}>{fromPrice}</Text></Text>
      ) : null}
    </Pressable>
  );
}

export type OfferFilter = "all" | "food" | "market" | "pharmacy";

/** C10d · Chips de categoría de 33: 35 pt de alto; activo azul con texto blanco 12 pt 600, inactivos `#F3F4F8` con ícono. */
export function OfferChips({ value, onChange }: { value: OfferFilter; onChange: (v: OfferFilter) => void }) {
  const items: { key: OfferFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "Todas" },
    { key: "food", label: "Comida", icon: <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={value === "food" ? colors.white : colors.ink} /> },
    { key: "market", label: "Mercado", icon: <Ionicons name="cart-outline" size={17.5} color={value === "market" ? colors.white : colors.ink} /> },
    { key: "pharmacy", label: "Farmacia", icon: <MaterialCommunityIcons name="plus-thick" size={19.5} color={value === "pharmacy" ? colors.white : colors.ink} /> },
  ];
  return (
    <View style={styles.chips}>
      {items.map((it) => {
        const on = value === it.key;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={it.label}
            style={({ pressed }) => [styles.chip, { backgroundColor: on ? colors.blue : "#F3F4F8", paddingLeft: it.icon ? 14.2 : 16.7, paddingRight: it.icon ? 13.6 : 17.6, opacity: pressed ? 0.85 : 1 }]}>
            {it.icon}
            <Text style={[styles.chipText, it.icon ? { marginLeft: it.key === "food" ? 10.4 : 8.4 } : null, on ? { color: colors.white, fontWeight: "600", fontSize: 12 } : null]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  offer: { borderRadius: 18, overflow: "hidden", paddingLeft: 15.4, paddingBottom: 12 },
  eyebrow: { fontSize: 8.2, lineHeight: 11, fontWeight: "700", letterSpacing: 0.45, color: colors.blueNavy, marginTop: 12.1 },
  title: { fontSize: 16.8, lineHeight: 19.9, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, marginTop: 4.2, maxWidth: 132 },
  desc: { fontSize: 10.4, lineHeight: 14.8, color: colors.textSecondary, marginTop: 3, maxWidth: 108 },
  price: { fontSize: 18, lineHeight: 22, fontWeight: "700", letterSpacing: -0.2, color: colors.blueNavy, marginTop: 5 },
  cta: { alignSelf: "flex-start", height: 31, borderRadius: 15.5, backgroundColor: colors.blue, flexDirection: "row", alignItems: "center", paddingLeft: 15.4, paddingRight: 18.4, marginTop: 8.5, marginLeft: -1.4 },
  ctaText: { fontSize: 10.4, lineHeight: 14, fontWeight: "600", color: colors.white },
  discover: { height: 93, borderRadius: 18, overflow: "hidden", backgroundColor: "#F5F5F5", paddingLeft: 14.6 },
  discName: { fontSize: 16.5, lineHeight: 20, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, marginTop: 22.4, maxWidth: 150 },
  discTag: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary, marginTop: 2.6, maxWidth: 150 },
  discFrom: { fontSize: 10.5, lineHeight: 18, color: colors.textSecondary, marginTop: 2.6 },
  discPrice: { fontSize: 14.2, fontWeight: "700", color: colors.blueNavy },
  chips: { flexDirection: "row", gap: 6.5 },
  chip: { height: 35, borderRadius: 17.5, flexDirection: "row", alignItems: "center" },
  chipText: { fontSize: 10.5, lineHeight: 15, color: colors.ink },
});
