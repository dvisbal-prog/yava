import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import { etaText, feeText, merchantPhoto, type MerchantCardData } from "@/components/customer/MerchantCard";
import { designImages, type DesignImageSource } from "@/lib/design-images";
import { RatingRow } from "./NearbyCard";

/** Nombre y presentación ("Banano (1 kg)" → "Banano" + "1 kg"; "Mango Tommy (unidad)" → "1 unidad"): la misma función que 26, 27 y 28. */
export { splitUnit } from "@/components/customer/store/featured";

/** Sigla + número sin cortar entre líneas: "Protector solar SPF 50" se parte "Protector solar / SPF 50" (29), no "SPF / 50". */
export function keepCodeTogether(name: string): string {
  return name.replace(/\b([A-Z]{2,}) (\d)/g, "$1\u00A0$2");
}

/** Título de sección + "Ver todos ›" con tamaño propio (25 mide 16,6 pt; 29 mide 15,5 pt). */
export function BrowseSection({ title, actionTitle = "Ver todos", onAction, size = 16.5, style }: {
  title: string; actionTitle?: string; onAction?: () => void; size?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: size, lineHeight: 21, fontWeight: "700", letterSpacing: -0.25, color: colors.ink }}>{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={{ flexDirection: "row", alignItems: "center", marginRight: -4.6 }}>
          <Text style={styles.link}>{actionTitle}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.blueLink} style={{ marginLeft: -1, marginTop: 1 }} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * C5 · Banner crema de 25 "Tu mercado, a domicilio" (357 × 130,7 pt, radio 16): título 23,5 pt bold azul marino en dos
 * líneas, subtítulo 13,4 pt gris azulado y a la derecha la foto del diseño (bolsa + destellos) pegada a los bordes.
 */
export function MarketBanner({ title, subtitle, onPress, style }: { title: string; subtitle: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={`${title.replace("\n", " ")}. ${subtitle.replace("\n", " ")}`}
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.92 : 1 }, style]}>
      <Image source={designImages.bannerMercadoCompleto} style={styles.bannerPhoto} contentFit="cover" contentPosition="right" transition={0} />
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerSub}>{subtitle}</Text>
    </Pressable>
  );
}

/**
 * Tarjeta de tienda de 25 "Tiendas cercanas" (183,8 pt, radio 16, borde + sombra): fachada 107,6 pt con corazón
 * blanco arriba-derecha, nombre 11,5 pt 600, categoría 9,7 pt gris y "⏱ 30–45 min · 🚚 Envío $3.000".
 */
export function StoreCard({ m, onPress, favorite, onFavorite, style }: {
  m: MerchantCardData; onPress: () => void; favorite?: boolean; onFavorite?: () => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.store, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <Image source={merchantPhoto(m, "storefront")} style={[styles.storePhoto, !m.is_open && { opacity: 0.55 }]} contentFit="cover" transition={120} />
        <View style={styles.storeBody}>
          <Text numberOfLines={1} style={styles.storeName}>{m.name}</Text>
          {m.tagline ? <Text numberOfLines={1} style={styles.storeSub}>{m.tagline}</Text> : null}
          <View style={styles.storeMeta}>
            <Ionicons name="time-outline" size={14.2} color={colors.textTertiary} />
            <Text style={[styles.metaText, { marginLeft: 5.2 }]}>{m.is_open ? etaText(m.prep_min, m.prep_max) : "Cerrado"}</Text>
            <Text style={[styles.metaText, { marginHorizontal: 6.4 }]}>·</Text>
            <MaterialCommunityIcons name="truck-outline" size={15.5} color={colors.textTertiary} />
            <Text numberOfLines={1} style={[styles.metaText, { marginLeft: 5.4, flexShrink: 1 }]}>{feeText(m.delivery_fee)}</Text>
          </View>
        </View>
      </Pressable>
      {onFavorite ? (
        <Pressable onPress={onFavorite} hitSlop={8} accessibilityRole="button" accessibilityLabel={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} style={styles.heart}>
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={17.5} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * C12c de 25 "Lo esencial": caja blanca 114,5 × 101 pt (radio 14, borde + sombra) con la foto y el "+" de 26,8 pt
 * abajo-derecha; debajo, nombre 10,5 pt 600, unidad 9 pt gris y precio 12 pt bold.
 */
export function EssentialCard({ name, unit, price, image, onPress, onAdd, disabled, width = 114.5, style }: {
  name: string; unit?: string | null; price: number; image: DesignImageSource | undefined; onPress: () => void; onAdd?: () => void; disabled?: boolean;
  width?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <View style={styles.essBox}>
          <Image source={image} style={[StyleSheet.absoluteFill, { margin: 0.9 }, disabled && { opacity: 0.5 }]} contentFit="cover" transition={120} />
        </View>
        <Text numberOfLines={1} style={styles.essName}>{name}</Text>
        {unit ? <Text numberOfLines={1} style={styles.essUnit}>{unit}</Text> : null}
        <Text style={styles.essPrice}>{formatCOP(price)}</Text>
      </Pressable>
      <AddButton size={30.8} onPhoto onPress={onAdd} disabled={disabled || !onAdd} accessibilityLabel={`Agregar ${name}`} style={styles.essAdd} />
    </View>
  );
}

export interface PharmacyCategory { key: string; title: string; subtitle: string; image: DesignImageSource }

/**
 * C4 de 29: tarjeta pastel 175 × 106 pt (radio 14) con la foto completa del diseño de fondo; título 13,9 pt bold en
 * una o dos líneas y subtítulo 10,1 pt gris en dos líneas.
 */
export function PharmacyCategoryCard({ item, onPress, selected, style }: { item: PharmacyCategory; onPress?: () => void; selected?: boolean; style?: StyleProp<ViewStyle> }) {
  const twoLines = item.title.includes("\n");
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }} accessibilityLabel={`${item.title.replace("\n", " ")}. ${item.subtitle.replace("\n", " ")}`}
      style={({ pressed }) => [styles.phCat, { opacity: pressed ? 0.9 : 1 }, style]}>
      <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      {selected ? <View style={[StyleSheet.absoluteFill, styles.phCatSel]} /> : null}
      <Text style={styles.phCatTitle}>{item.title}</Text>
      <Text style={[styles.phCatSub, { marginTop: twoLines ? 7.2 : 8.5 }]}>{item.subtitle}</Text>
    </Pressable>
  );
}

/**
 * Tarjeta de farmacia de 29 "Farmacias cercanas" (sin contenedor): fachada 177 × 122,9 pt (radio 12) con la insignia
 * blanca "⏱ 30–40 min" abajo-derecha, nombre 11,4 pt bold, categoría 9,8 pt gris y "★ 4,8 · Envío $3.000".
 */
export function PharmacyCard({ m, onPress, width = 177.3, style }: { m: MerchantCardData; onPress: () => void; width?: number; style?: StyleProp<ViewStyle> }) {
  const eta = etaText(m.prep_min, m.prep_max);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [{ width, opacity: pressed ? 0.9 : 1 }, style]}>
      <View>
        <Image source={merchantPhoto(m, "storefrontCard")} style={[styles.phPhoto, !m.is_open && { opacity: 0.55 }]} contentFit="cover" transition={120} />
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={13.4} color={colors.ink} />
          <Text style={styles.badgeText}>{m.is_open ? eta : "Cerrado"}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.phName}>{m.name}</Text>
      {m.tagline ? <Text numberOfLines={1} style={styles.phSub}>{m.tagline}</Text> : null}
      <RatingRow rating={m.rating_avg} parts={[feeText(m.delivery_fee)]} size={9.8} gap={5.4} starSize={11.6} starGap={5.4} starLeft={2.2} starTop={-0.6} style={{ marginTop: 4.4 }} />
    </Pressable>
  );
}

/**
 * C12c de 29 "Productos destacados": tarjeta 117,5 × 163,5 pt (radio 14, borde) con la foto arriba, nombre 9,9 pt en
 * hasta dos líneas, precio 10,5 pt bold abajo y "+" de 26,8 pt abajo-derecha.
 */
export function FeaturedProductCard({ name, price, image, imageFrame, onPress, onAdd, disabled, width = 117.5, style }: {
  name: string; price: number; image: DesignImageSource | undefined; imageFrame?: { width: number; height: number; left?: number; top?: number };
  onPress: () => void; onAdd?: () => void; disabled?: boolean; width?: number; style?: StyleProp<ViewStyle>;
}) {
  const frame = imageFrame ?? { width: width - 12, height: 98.8, left: 6, top: 4.2 };
  return (
    <View style={[styles.feat, { width }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.9 : 1 }]}>
        <Image source={image} style={[{ position: "absolute", left: frame.left ?? 6, top: frame.top ?? 4.2, width: frame.width, height: frame.height }, disabled && { opacity: 0.5 }]} contentFit="contain" transition={120} />
        <Text numberOfLines={2} style={styles.featName}>{keepCodeTogether(name)}</Text>
        <Text style={styles.featPrice}>{formatCOP(price)}</Text>
      </Pressable>
      <AddButton size={27.3} onPress={onAdd} disabled={disabled || !onAdd} accessibilityLabel={`Agregar ${name}`} style={styles.featAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontSize: 10.5, lineHeight: 14, fontWeight: "500", color: colors.blueLink },
  banner: { height: 130.7, borderRadius: 16, backgroundColor: "#FEF6E0", overflow: "hidden", paddingLeft: 13.6 },
  bannerPhoto: { position: "absolute", right: 0, top: 0, bottom: 0, width: 207 },
  bannerTitle: { fontSize: 23.5, lineHeight: 24, fontWeight: "700", letterSpacing: -0.4, color: "#002A6E", marginTop: 23.9 },
  bannerSub: { fontSize: 13.4, lineHeight: 16.7, color: "#4A6079", marginTop: 5.3 },
  store: { width: 183.8, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, boxShadow: "0px 2px 8px rgba(16, 24, 48, 0.05)" },
  storePhoto: { width: "100%", height: 107.6, borderTopLeftRadius: 15, borderTopRightRadius: 15, backgroundColor: colors.surfaceGray },
  storeBody: { paddingLeft: 7.4, paddingRight: 6, paddingBottom: 8.9 },
  storeName: { fontSize: 11.5, lineHeight: 15, fontWeight: "600", color: colors.ink, marginTop: 4.5 },
  storeSub: { fontSize: 9.7, lineHeight: 13, color: colors.textTertiary, marginTop: 1 },
  storeMeta: { flexDirection: "row", alignItems: "center", height: 14, marginTop: 7.3 },
  metaText: { fontSize: 9.5, lineHeight: 13, color: colors.textTertiary },
  heart: { position: "absolute", top: 9.3, right: 9, width: 17.5, height: 17.5, alignItems: "center", justifyContent: "center" },
  essBox: { height: 101, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden", boxShadow: "0px 2px 8px rgba(16, 24, 48, 0.05)" },
  essName: { fontSize: 10.5, lineHeight: 14, fontWeight: "600", color: colors.ink, marginTop: 2.6, marginLeft: 5.4 },
  essUnit: { fontSize: 9, lineHeight: 13, color: colors.textTertiary, marginTop: 1.4, marginLeft: 5.4 },
  essPrice: { fontSize: 12, lineHeight: 16, fontWeight: "700", color: colors.ink, marginTop: 3.3, marginLeft: 5.4 },
  essAdd: { position: "absolute", left: 79.7, top: 69.1 },
  phCat: { height: 106.2, borderRadius: 14, overflow: "hidden", backgroundColor: colors.pastelSky, paddingLeft: 12 },
  phCatSel: { borderRadius: 14, borderWidth: 2, borderColor: colors.blue },
  phCatTitle: { fontSize: 13.9, lineHeight: 16.6, fontWeight: "700", letterSpacing: -0.1, color: "#00011A", marginTop: 20.6 },
  phCatSub: { fontSize: 10.1, lineHeight: 14.3, color: "#4C5569" },
  phPhoto: { width: "100%", height: 122.9, borderRadius: 12, backgroundColor: colors.surfaceGray },
  badge: { position: "absolute", right: 4.5, bottom: 5.5, height: 22, borderRadius: 11, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingLeft: 6.6, paddingRight: 8.4 },
  badgeText: { fontSize: 9.4, lineHeight: 13, color: colors.ink, marginLeft: 5 },
  phName: { fontSize: 11.4, lineHeight: 15, fontWeight: "700", color: colors.ink, marginTop: 2.5, marginLeft: 1.2 },
  phSub: { fontSize: 9.8, lineHeight: 13, color: "#57637E", marginTop: 2, marginLeft: 1.6 },
  feat: { height: 163.5, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  featName: { fontSize: 9.9, lineHeight: 13.8, color: colors.ink, marginTop: 104.6, marginLeft: 8.4, marginRight: 8 },
  featPrice: { position: "absolute", left: 8.2, bottom: 12.4, fontSize: 10.7, lineHeight: 14, fontWeight: "600", color: colors.ink },
  featAdd: { position: "absolute", right: 6, bottom: 9.7 },
});
