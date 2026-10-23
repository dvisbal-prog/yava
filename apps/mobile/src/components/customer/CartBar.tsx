import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";
import { useCart } from "@/store/cart";

/** Botón flotante "Ver canasta · N · $X" (visible cuando hay productos). */
export function CartBar({ merchantId }: { merchantId?: string }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const merchant = useCart((s) => s.merchant);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = useCart((s) => s.subtotal());
  if (!count || (merchantId && merchant && merchant.id !== merchantId)) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable onPress={() => router.push("/(customer)/cart" as never)} style={({ pressed }) => [styles.bar, { opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.count}><Text variant="caption" style={{ color: colors.blue, fontWeight: "700" }}>{count}</Text></View>
        <Text variant="bodyStrong" tone="inverse" style={{ flex: 1, textAlign: "center" }}>Ver canasta</Text>
        <Text variant="bodyStrong" tone="inverse">{formatCOP(subtotal)}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.white} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: Platform.OS === "ios" ? 28 : 16 },
  bar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.blue, borderRadius: radius.lg, paddingHorizontal: 14, height: 56, shadowColor: colors.black, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  count: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
});
