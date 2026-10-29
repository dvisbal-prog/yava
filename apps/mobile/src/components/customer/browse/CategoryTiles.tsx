import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import type { DesignImageSource } from "@/lib/design-images";

export interface TileItem {
  key: string;
  label: string;
  image: DesignImageSource | undefined;
  /** Peso del ancho (los tiles de 09 miden 87,3 / 86,4 / 86,3 / 77,1 pt). */
  flex?: number;
  /** Fondo pastel detrás de la foto (25). */
  bg?: string;
}

/**
 * Fila de tiles con foto (C6) que ocupa todo el ancho: foto a sangre con radio y etiqueta centrada debajo.
 * Medidas por defecto de 09 (alto 87,3, radio 13, etiqueta 10,15 pt a 7,3 pt de la foto); 25 pasa las suyas.
 */
export function CategoryTiles({ items, selected, onSelect, height = 87.3, radius = 13, gap = 7.7, labelSize = 10.15, labelGap = 4.35, style }: {
  items: TileItem[]; selected?: string | null; onSelect?: (key: string) => void; height?: number; radius?: number; gap?: number;
  labelSize?: number; labelGap?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {items.map((t) => {
        const sel = selected === t.key;
        return (
          <Pressable key={t.key} onPress={onSelect ? () => onSelect(t.key) : undefined} disabled={!onSelect}
            accessibilityRole="button" accessibilityLabel={t.label} accessibilityState={{ selected: sel }}
            style={({ pressed }) => [{ flex: t.flex ?? 1, alignItems: "center", opacity: pressed ? 0.85 : 1 }]}>
            <View style={[styles.photo, { height, borderRadius: radius, backgroundColor: t.bg ?? colors.surfaceSoft }]}>
              <Image source={t.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={100} />
              {sel ? <View style={[StyleSheet.absoluteFill, styles.selected, { borderRadius: radius }]} /> : null}
            </View>
            <Text numberOfLines={1} style={{ fontSize: labelSize, lineHeight: Math.round(labelSize * 1.28), marginTop: labelGap, color: sel ? colors.blueText : colors.ink, fontWeight: sel ? "600" : "400", textAlign: "center" }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  photo: { width: "100%", overflow: "hidden" },
  selected: { borderWidth: 2, borderColor: colors.blue },
});
