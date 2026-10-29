import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatRating } from "@yava/shared";
import { Text, Badge } from "@/components/ui";
import { etaText, feeText, merchantPhoto, type MerchantCardData } from "@/components/customer/MerchantCard";
import type { MerchantImageKind } from "@/lib/design-images";

/**
 * "★ 4,8 · 25–35 min · Envío $3.000" con las medidas de Explorar: estrella `star` y número 600 gris oscuro,
 * resto gris; `gap` = aire a cada lado del "·" (7,4 pt en 09).
 */
export function RatingRow({ rating, parts, size = 10.3, starSize, gap = 6.2, starGap = 5.4, starLeft = 0, starTop = -1.2, style, textStyle }: {
  rating: number; parts: string[]; size?: number; starSize?: number; gap?: number; starGap?: number; starLeft?: number; starTop?: number;
  style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>;
}) {
  const ss = starSize ?? size * 1.1;
  const items = [formatRating(Number(rating)), ...parts.filter(Boolean)];
  return (
    <View style={[styles.row, style]}>
      <Ionicons name="star" size={ss} color={colors.star} style={{ marginLeft: starLeft, marginRight: starGap, marginTop: starTop }} />
      {items.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Text style={[{ fontSize: size, lineHeight: size * 1.4, color: colors.textTertiary, marginHorizontal: gap }, textStyle]}>·</Text> : null}
          <Text numberOfLines={1} style={[{ fontSize: size, lineHeight: size * 1.4, color: i === 0 ? colors.gray700 : colors.textTertiary, fontWeight: i === 0 ? "600" : "400", flexShrink: i === 0 ? 0 : 1 }, textStyle]}>{t}</Text>
        </React.Fragment>
      ))}
    </View>
  );
}

/**
 * C8a · Tarjeta de 09 "Cerca de ti" medida en el PNG: foto a lo ancho de 99,8 pt (radio 10,5) y debajo, con 3,7 pt
 * de sangría, nombre 13 pt bold, "Ceviches · 25–35 min" 10,4 pt gris y "★ 4,8 · Envío $3.000" 10,3 pt.
 */
export function NearbyCard({ m, onPress, photoHeight = 99.8, photoKind = "nearby", style }: {
  m: MerchantCardData; onPress: () => void; photoHeight?: number; photoKind?: MerchantImageKind; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={m.name} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, style]}>
      <View>
        <Image source={merchantPhoto(m, photoKind)} style={[styles.photo, { height: photoHeight }, !m.is_open && styles.closed]} contentFit="cover" transition={120} />
        {!m.is_open ? <Badge label="Cerrado" tone="closed" style={styles.closedBadge} /> : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>{m.name}</Text>
        <Text numberOfLines={1} style={styles.meta}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(" · ")}</Text>
        <RatingRow rating={m.rating_avg} parts={[feeText(m.delivery_fee)]} size={10.3} gap={5.4} starLeft={1.2} starGap={4.6} starTop={0.4} style={{ marginTop: 2.2 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photo: { width: "100%", borderRadius: 10.5, backgroundColor: colors.surfaceGray },
  closed: { opacity: 0.55 },
  closedBadge: { position: "absolute", top: 8, left: 8 },
  body: { paddingLeft: 3.2 },
  name: { fontSize: 13, lineHeight: 16, fontWeight: "700", color: colors.ink, marginTop: 2.6 },
  meta: { fontSize: 10.4, lineHeight: 14, color: colors.textTertiary, marginTop: 3 },
  row: { flexDirection: "row", alignItems: "center" },
});
