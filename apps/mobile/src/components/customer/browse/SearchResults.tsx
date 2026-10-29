import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Badge } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import { etaText, feeText, merchantPhoto, type MerchantCardData } from "@/components/customer/MerchantCard";
import { merchantImage, type DesignImageSource } from "@/lib/design-images";
import { RatingRow } from "./NearbyCard";

/**
 * C13 · Fila de plato de 10 (medida en tanda-02/10-busqueda.png): foto 118 × 99,8 pt (radio 6,5), a 15,7 pt el nombre
 * 14,85 pt 600, precio 13,1 pt bold y descripción 10,25 pt gris en 2 líneas; "+" azul de 32 pt a la derecha (un poco
 * por debajo del centro). Separador a 6,9 pt de la foto; `last` deja el separador final más abajo (13,4 pt).
 */
export function DishRow({ name, price, description, image, onPress, onAdd, last, style }: {
  name: string; price: number | null; description?: string | null; image: DesignImageSource | undefined; onPress: () => void; onAdd?: () => void;
  last?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <View>
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [styles.dish, { opacity: pressed ? 0.9 : 1 }]}>
          <Image source={image} style={styles.dishPhoto} contentFit="cover" transition={120} />
          <View style={styles.dishBody}>
            <Text numberOfLines={1} style={styles.dishName}>{name}</Text>
            {price != null ? <Text style={styles.dishPrice}>{formatCOP(price)}</Text> : null}
            {description ? <Text numberOfLines={2} style={styles.dishDesc}>{description}</Text> : null}
          </View>
        </Pressable>
        <AddButton size={32.3} onPress={onAdd ?? onPress} accessibilityLabel={`Agregar ${name}`} style={styles.dishAdd} />
      </View>
      <View style={[styles.sep, { marginTop: last ? 13.4 : 6.9 }]} />
    </View>
  );
}

export type HeroMerchant = MerchantCardData;

/**
 * C8b · Tarjeta grande de restaurante de 10: borde + radio 16, foto superior de 137,6 pt, sello circular blanco de
 * 82 pt (si el comercio tiene sello en el diseño), nombre 15,4 pt bold, "Ceviches · Cocina de mar" 10,65 pt gris,
 * "★ 4,8 · 25–35 min · Envío $3.000" 11,1 pt y chevron gris a la derecha.
 */
export function RestaurantHeroCard({ m, onPress, style }: { m: HeroMerchant; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const seal = merchantImage({ name: m.name, slug: m.slug, logo_url: null }, "seal");
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [styles.hero, { opacity: pressed ? 0.92 : 1 }, style]}>
      <Image source={merchantPhoto(m, "hero")} style={[styles.heroPhoto, !m.is_open && { opacity: 0.55 }]} contentFit="cover" transition={120} />
      {seal ? <View style={styles.seal}><Image source={seal} style={{ width: 70, height: 70 }} contentFit="contain" /></View> : null}
      {!m.is_open ? <Badge label="Cerrado" tone="closed" style={{ position: "absolute", top: 10, right: 10 }} /> : null}
      <View style={styles.heroBody}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.heroName}>{m.name}</Text>
          {m.tagline ? <Text numberOfLines={1} style={styles.heroMeta}>{m.tagline}</Text> : null}
          <RatingRow rating={m.rating_avg} parts={[etaText(m.prep_min, m.prep_max), feeText(m.delivery_fee)]} size={11.1} gap={6.6} starSize={13.4} starGap={5.4} starTop={-0.6} style={{ marginTop: 7.1 }} />
        </View>
        <Ionicons name="chevron-forward" size={16.5} color={colors.textTertiary} style={{ marginTop: -8, marginRight: -1.6 }} />
      </View>
    </Pressable>
  );
}

/**
 * C9 (41) · Fila de restaurante a lo ancho: tarjeta 357 × 104 pt (radio 14, borde), foto izquierda de 186 pt a sangre,
 * nombre 13 pt bold, categoría 10,8 pt gris, "★ 4,8 · 25–35 min" y "Envío $3.000" en líneas de 10 pt; chevron gris.
 */
export function MerchantResultRow({ m, onPress, style }: { m: MerchantCardData; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [styles.rowCard, { opacity: pressed ? 0.9 : 1 }, style]}>
      <Image source={merchantPhoto(m, "card")} style={[styles.rowPhoto, !m.is_open && { opacity: 0.55 }]} contentFit="cover" transition={120} />
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.rowName}>{m.name}</Text>
        {m.tagline ? <Text numberOfLines={1} style={styles.rowMeta}>{m.tagline}</Text> : null}
        <RatingRow rating={m.rating_avg} parts={[etaText(m.prep_min, m.prep_max)]} size={9.9} gap={6.4} starSize={10.6} starGap={5.6} starTop={-0.4} style={{ marginTop: 5.2 }} />
        <Text numberOfLines={1} style={styles.rowFee}>{m.is_open ? feeText(m.delivery_fee) : "Cerrado"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16.5} color={colors.textTertiary} style={{ marginRight: 7.2, marginTop: 2 }} />
    </Pressable>
  );
}

/** C10e · Chip de sugerencia (41): fondo `blueSoft`, lupa y texto 11,1 pt 600 `blueText`, 35,6 pt de alto. */
export function SuggestChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Buscar ${label}`} style={({ pressed }) => [styles.suggest, { opacity: pressed ? 0.8 : 1 }]}>
      <Ionicons name="search" size={16.2} color={colors.blueText} />
      <Text numberOfLines={1} style={styles.suggestText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dish: { flexDirection: "row", height: 99.8 },
  dishPhoto: { width: 118.2, height: 99.8, borderRadius: 6.5, backgroundColor: colors.surfaceGray },
  dishBody: { flex: 1, paddingLeft: 15, paddingRight: 52 },
  dishName: { fontSize: 14.85, lineHeight: 19, fontWeight: "600", color: colors.ink, marginTop: 7.5 },
  dishPrice: { fontSize: 13.1, lineHeight: 17, fontWeight: "700", color: colors.ink, marginTop: 1.5 },
  dishDesc: { fontSize: 10.25, lineHeight: 14.3, color: colors.textTertiary, marginTop: 7.8 },
  dishAdd: { position: "absolute", right: 0, top: 41.1 },
  sep: { height: 1, backgroundColor: "#EDEFF4" },
  hero: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  heroPhoto: { width: "100%", height: 137.6, backgroundColor: colors.surfaceGray },
  seal: { position: "absolute", top: 7.85, left: 7.8, width: 81.3, height: 81.3, borderRadius: 40.65, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  heroBody: { flexDirection: "row", alignItems: "center", paddingLeft: 11.6, paddingRight: 12.4, paddingTop: 8, paddingBottom: 12.4 },
  heroName: { fontSize: 15.4, lineHeight: 17, fontWeight: "700", color: colors.ink },
  heroMeta: { fontSize: 10.65, lineHeight: 13, color: colors.textTertiary, marginTop: 4.6 },
  rowCard: { flexDirection: "row", alignItems: "center", height: 104, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  rowPhoto: { width: 186.4, height: "100%", backgroundColor: colors.surfaceGray },
  rowBody: { flex: 1, paddingLeft: 13.6, paddingTop: 1 },
  rowName: { fontSize: 13, lineHeight: 16, fontWeight: "700", color: colors.ink },
  rowMeta: { fontSize: 10.8, lineHeight: 14, color: colors.textTertiary, marginTop: 5.8 },
  rowFee: { fontSize: 10, lineHeight: 14, color: colors.textTertiary, marginTop: 3.1 },
  suggest: { height: 35.6, borderRadius: 17.8, backgroundColor: colors.blueSoft, flexDirection: "row", alignItems: "center", paddingLeft: 13, paddingRight: 14.3 },
  suggestText: { fontSize: 11.1, lineHeight: 15, fontWeight: "600", color: colors.blueText, marginLeft: 7.4 },
});
