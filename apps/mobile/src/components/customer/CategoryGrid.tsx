import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";

export type HomeCategory = "food" | "market" | "pharmacy" | "shipment";
const items: { key: HomeCategory; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }[] = [
  { key: "food", title: "Comida", subtitle: "Restaurantes y más", icon: "restaurant-outline", bg: colors.blueSoft, fg: colors.blue },
  { key: "market", title: "Mercado", subtitle: "Todo para tu casa", icon: "basket-outline", bg: colors.greenSoft, fg: colors.green },
  { key: "pharmacy", title: "Farmacia", subtitle: "Salud y bienestar", icon: "medkit-outline", bg: colors.redSoft, fg: colors.red },
  { key: "shipment", title: "Envíos", subtitle: "Paquetes y más", icon: "cube-outline", bg: colors.yellowSoft, fg: "#8A6400" },
];

export function CategoryGrid({ onSelect }: { onSelect: (c: HomeCategory) => void }) {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <Pressable key={it.key} onPress={() => onSelect(it.key)} style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.icon, { backgroundColor: it.bg }]}><Ionicons name={it.icon} size={22} color={it.fg} /></View>
          <Text variant="bodyStrong" style={{ marginTop: 8 }}>{it.title}</Text>
          <Text variant="small" tone="muted" numberOfLines={1}>{it.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: "48%", flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, padding: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
