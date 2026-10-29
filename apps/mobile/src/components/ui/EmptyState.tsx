import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "./Text";
import { Button } from "./Button";

/** Tres trazos "destello" (amarillos por defecto) arriba a la derecha de una ilustración (19, 41, 42, 45). */
export function Sparks({ color = colors.spark, size = 1 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.sparks, { transform: [{ scale: size }] }]} pointerEvents="none">
      <View style={[styles.spark, { backgroundColor: color, transform: [{ rotate: "-35deg" }], left: 0, top: 14 }]} />
      <View style={[styles.spark, { backgroundColor: color, transform: [{ rotate: "0deg" }], left: 11, top: 2 }]} />
      <View style={[styles.spark, { backgroundColor: color, transform: [{ rotate: "35deg" }], left: 22, top: 12 }]} />
    </View>
  );
}

/**
 * Estado vacío / ilustrado (guía C23): ilustración centrada, título h3, cuerpo `textSecondary` y CTA.
 * Con `image` usa una ilustración recortada del diseño (`designImages.vacioCanasta`…); si no, dibuja
 * un círculo pastel con el ícono y destellos (`tone` cambia el color).
 */
export function EmptyState({ icon = "search-outline", title, body, actionTitle, onAction, secondaryTitle, onSecondary, image, imageSize = 110, tone = "blue", compact }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string; actionTitle?: string; onAction?: () => void; secondaryTitle?: string; onSecondary?: () => void;
  image?: number; imageSize?: number; tone?: "blue" | "red" | "gray"; compact?: boolean;
}) {
  const bg = tone === "red" ? colors.redSoft : tone === "gray" ? colors.surfaceGray : colors.blueSoft;
  const fg = tone === "red" ? colors.red : tone === "gray" ? colors.iconGray : colors.blue;
  return (
    <View style={{ alignItems: "center", paddingVertical: compact ? 24 : 44, paddingHorizontal: 28 }}>
      {image ? (
        <Image source={image} style={{ width: imageSize, height: imageSize, marginBottom: 22 }} contentFit="contain" />
      ) : (
        <View style={{ marginBottom: 22 }}>
          <View style={[styles.circle, { backgroundColor: bg }]}><Ionicons name={icon} size={40} color={fg} /></View>
          <View style={styles.sparksPos}><Sparks color={tone === "red" ? colors.red : colors.spark} /></View>
        </View>
      )}
      <Text variant="h3" style={{ textAlign: "center", marginBottom: 8 }}>{title}</Text>
      {body ? <Text variant="bodyM" tone="secondary" style={{ textAlign: "center", marginBottom: 20, maxWidth: 290 }}>{body}</Text> : null}
      {actionTitle ? <Button title={actionTitle} onPress={onAction} full={false} size="md" style={{ paddingHorizontal: 28 }} /> : null}
      {secondaryTitle ? <Button title={secondaryTitle} onPress={onSecondary} variant="ghost" full={false} size="md" style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
  sparksPos: { position: "absolute", right: -22, top: -14 },
  sparks: { width: 30, height: 26 },
  spark: { position: "absolute", width: 3, height: 10, borderRadius: 2 },
});
