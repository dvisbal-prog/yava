import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Image } from "expo-image";
import { colors, radius, spacing } from "@yava/shared";
import { Text } from "@/components/ui";
import { promoImage, hasPromoDesignArt } from "@/lib/design-images";
import type { PromotionRow } from "@/features/customer/types";

const H = 95;

/**
 * Banner amarillo (guía C5, 08 "El sabor de la costa"): fondo `bannerYellow` con dos manchas redondas,
 * título 20 pt bold `blueNavy`, subtítulo `blueNavy` y foto del plato a la derecha.
 * Las promociones sin arte de diseño usan su `image_url` recortada en semicírculo y muestran el cupón.
 */
/** Lo mínimo para dibujar un banner (una fila de `promotions` o un banner fijo). */
export type PromoBannerData = Pick<PromotionRow, "title" | "subtitle" | "image_url" | "coupon_code">;

export function PromoBannerCard({ promo, onPress, width }: { promo: PromoBannerData; onPress?: () => void; width: number }) {
  const art = hasPromoDesignArt(promo);
  const img = promoImage(promo);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${promo.title}. ${promo.subtitle ?? ""}`}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.94 : 1 }]}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      {img ? (
        art
          ? <Image source={img} style={styles.art} contentFit="cover" contentPosition="top left" transition={0} />
          : <Image source={img} style={styles.photo} contentFit="cover" transition={150} />
      ) : null}
      <View style={styles.text}>
        <Text variant="banner" tone="navy" numberOfLines={1}>{promo.title}</Text>
        {promo.subtitle ? <Text variant="bodyS" tone="navy" numberOfLines={art ? 1 : 2} style={{ maxWidth: art ? undefined : 170 }}>{promo.subtitle}</Text> : null}
        {!art && promo.coupon_code ? (
          <View style={styles.code}><Text variant="caption2" style={{ color: colors.blueNavy, fontWeight: "700" }}>{promo.coupon_code}</Text></View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Banner(es) del Inicio. La primera promoción se ve exactamente como el diseño; si hay más, se pueden
 * deslizar página por página (sin asomar la siguiente, como en el PNG). `dots` muestra el indicador debajo
 * (apagado por defecto porque el diseño no lo tiene y agregaría 12 pt de alto).
 */
export function PromoBanner({ items, onPress, dots = false }: { items: PromotionRow[]; onPress: (p: PromotionRow) => void; dots?: boolean }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  if (!items.length) return null;
  const w = width - spacing.gutter * 2;
  if (items.length === 1) {
    return <View style={{ paddingHorizontal: spacing.gutter }}><PromoBannerCard promo={items[0]} width={w} onPress={() => onPress(items[0])} /></View>;
  }
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };
  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}>
        {items.map((p) => (
          <View key={p.id} style={{ width, paddingHorizontal: spacing.gutter }}>
            <PromoBannerCard promo={p} width={w} onPress={() => onPress(p)} />
          </View>
        ))}
      </ScrollView>
      {dots ? (
        <View style={styles.dots} pointerEvents="none">
          {items.map((p, i) => <View key={p.id} style={[styles.dot, i === page && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: H, borderRadius: radius.r14, overflow: "hidden", backgroundColor: colors.bannerYellow },
  // Manchas medidas en 08 (centro y radio en pt relativos al banner).
  blobTop: { position: "absolute", left: 230, top: -31, width: 152, height: 152, borderRadius: 76, backgroundColor: colors.bannerBlobSoft },
  blobBottom: { position: "absolute", left: 174, top: 79, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bannerBlob },
  art: { position: "absolute", left: 191.5, top: 4.6, right: 0, bottom: 0 },
  photo: { position: "absolute", right: 0, top: 0, bottom: 0, width: 150, borderTopLeftRadius: 60, borderBottomLeftRadius: 60 },
  text: { position: "absolute", left: 16.3, top: 29, right: 150 },
  code: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2, marginTop: 6 },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: 7, gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.blueNavy, width: 12 },
});
