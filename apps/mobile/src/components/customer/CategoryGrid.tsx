import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages, type DesignImage } from "@/lib/design-images";

export type HomeCategory = "food" | "market" | "pharmacy" | "shipment";

/**
 * Marco de la foto dentro de la tarjeta, medido en 08: anclada abajo-derecha y desbordando hasta el borde
 * (el recorte dejó ~4 pt de margen que aquí se cubren escalando un 5 %).
 */
interface PhotoFrame { width: number; height: number }

export interface CategoryCardData {
  key: string;
  title: string;
  /** Dos líneas, separadas con "\n" como en el diseño ("Restaurantes\ny más"). */
  subtitle: string;
  bg: string;
  image: DesignImage;
  frame: PhotoFrame;
}

/** Las 4 tarjetas del Inicio (08). */
export const HOME_CATEGORIES: (CategoryCardData & { key: HomeCategory })[] = [
  { key: "food", title: "Comida", subtitle: "Restaurantes\ny más", bg: colors.cream, image: designImages.categoriaComida, frame: { width: 91.5, height: 92.4 } },
  { key: "market", title: "Mercado", subtitle: "Todo para\ntu casa", bg: colors.pastelMint, image: designImages.categoriaMercado, frame: { width: 91, height: 91.9 } },
  { key: "pharmacy", title: "Farmacia", subtitle: "Salud y\nbienestar", bg: colors.pastelSky, image: designImages.categoriaFarmacia, frame: { width: 91, height: 91.9 } },
  { key: "shipment", title: "Envíos", subtitle: "Paquetes\ny más", bg: colors.pastelLavender, image: designImages.categoriaEnvios, frame: { width: 103, height: 91.9 } },
];

/**
 * Tarjeta pastel de categoría (guía C4): fondo plano sin borde ni sombra, radio 14, título 15 pt bold,
 * subtítulo en dos líneas y foto pegada abajo-derecha. `height` 97 en 08; 106 en farmacia (29).
 */
export function CategoryCard({ item, onPress, height = 97, style }: { item: CategoryCardData; onPress?: () => void; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.subtitle.replace("\n", " ")}`}
      style={({ pressed }) => [styles.card, { height, backgroundColor: item.bg, opacity: pressed ? 0.9 : 1 }, style]}>
      <Image source={item.image} style={[styles.photo, item.frame]} contentFit="cover" contentPosition="top left" transition={0} />
      <View style={styles.text}>
        <Text variant="cardTitle">{item.title}</Text>
        <Text tone="category" style={styles.sub}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );
}

/** Rejilla 2 × 2 de tarjetas pastel (08). Separación 10 pt. */
export function CategoryGrid({ onSelect, items = HOME_CATEGORIES }: { onSelect: (c: HomeCategory) => void; items?: (CategoryCardData & { key: HomeCategory })[] }) {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.key} style={styles.cell}>
          <CategoryCard item={it} onPress={() => onSelect(it.key)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 9 },
  cell: { width: "48.6%" },
  card: { borderRadius: radius.r14, overflow: "hidden" },
  photo: { position: "absolute", right: 0, bottom: 0 },
  text: { paddingLeft: 14, paddingTop: 21.5 },
  sub: { fontSize: 10.3, lineHeight: 13.2, marginTop: 6 },
});
