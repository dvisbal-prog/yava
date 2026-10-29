import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@yava/shared";
import { Text } from "./Text";
import { IconButton } from "./IconButton";

/**
 * Variantes del encabezado de navegación (guía C2):
 * - `circle` (por defecto, C2a): botón atrás circular gris 34 pt + título en línea a la izquierda (07, 09, 10, 15, 16).
 * - `chevron` (C2b): chevron suelto 24 pt + título en línea (17, 22, 24, 28, 36, 42…). Con `align="center"` el título va centrado (32, 38).
 * - `large` (C2c): chevron suelto arriba y H1 debajo con subtítulo (05, 18, 37).
 * - `arrow` (C2d): flecha ← + título en línea (19, 23, 39).
 */
export type HeaderVariant = "circle" | "chevron" | "large" | "arrow";

export function Header({ title, subtitle, back = true, right, onBack, transparent, variant = "circle", align = "left", backColor }: {
  title?: string; subtitle?: string; back?: boolean; right?: React.ReactNode; onBack?: () => void; transparent?: boolean;
  variant?: HeaderVariant; align?: "left" | "center"; backColor?: string;
}) {
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));
  const bg = transparent ? "transparent" : colors.white;

  const backBtn = !back ? null : variant === "circle" ? (
    <IconButton icon="chevron-back" size={34} iconSize={19} variant="gray" color={backColor} onPress={goBack} accessibilityLabel="Atrás" />
  ) : (
    <Pressable onPress={goBack} hitSlop={12} style={styles.plainBack} accessibilityRole="button" accessibilityLabel="Atrás">
      <Ionicons name={variant === "arrow" ? "arrow-back" : "chevron-back"} size={24} color={backColor ?? colors.ink} />
    </Pressable>
  );

  if (variant === "large") {
    return (
      <View style={[styles.large, { backgroundColor: bg }]}>
        <View style={styles.largeTop}>
          <View>{backBtn}</View>
          <View>{right}</View>
        </View>
        {title ? <Text variant="h1" style={{ marginTop: 18 }}>{title}</Text> : null}
        {subtitle ? <Text variant="bodyM" tone="secondary" style={{ marginTop: 6 }}>{subtitle}</Text> : null}
      </View>
    );
  }

  const centered = align === "center";
  return (
    <View style={[styles.row, { backgroundColor: bg }]}>
      {centered ? <View style={styles.side}>{backBtn}</View> : backBtn}
      <View style={[styles.titleBox, centered ? { alignItems: "center" } : { marginLeft: back ? (variant === "circle" ? 12 : 8) : 0 }]}>
        {title ? <Text variant="navTitle" numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text variant="caption2" tone="tertiary" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {centered ? <View style={[styles.side, { alignItems: "flex-end" }]}>{right}</View> : right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.gutter - 1, minHeight: 52, paddingVertical: 8 },
  side: { width: 44 },
  titleBox: { flex: 1, justifyContent: "center" },
  plainBack: { width: 30, height: 34, alignItems: "flex-start", justifyContent: "center" },
  large: { paddingHorizontal: spacing.gutter, paddingTop: 8, paddingBottom: 12 },
  largeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
});
