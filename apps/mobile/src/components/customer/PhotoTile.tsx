import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import type { DesignImageSource } from "@/lib/design-images";

/**
 * Tile de categoría con foto (guía C6): foto a sangre con radio y etiqueta centrada debajo.
 * - 09 Restaurantes: 88 × 89 pt, radio 12, etiqueta 13 pt (por defecto). Fotos: `designImages.tileCeviches`…
 * - 25 Mercado: `size={{ width: 85, height: 83 }}`, `radius={14}`, `labelSize={14}`, fondo pastel en `bg`.
 * `selected` marca el tile con borde 2 pt `blue` (filtro activo).
 */
export function PhotoTile({ image, label, onPress, size = { width: 88, height: 89 }, radius = 12, labelSize = 12, bg = colors.surfaceSoft, selected, style }: {
  image: DesignImageSource | undefined; label: string; onPress?: () => void; size?: { width: number; height: number }; radius?: number; labelSize?: number;
  bg?: string; selected?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [{ width: size.width, alignItems: "center", opacity: pressed ? 0.85 : 1 }, style]}>
      <View style={[styles.photoWrap, { width: size.width, height: size.height, borderRadius: radius, backgroundColor: bg }, selected && styles.selected]}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={100} />
      </View>
      <Text numberOfLines={1} style={{ fontSize: labelSize, lineHeight: labelSize * 1.35, marginTop: 6, color: colors.ink, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photoWrap: { overflow: "hidden" },
  selected: { borderWidth: 2, borderColor: colors.blue },
});
