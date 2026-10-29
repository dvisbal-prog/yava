import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows, spacing, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";
import { useCart } from "@/store/cart";

/**
 * Botón flotante "Ver canasta" (visible cuando hay productos), con el lenguaje de los CTA del diseño (C15b):
 * píldora azul de 52 pt con el conteo en círculo blanco, texto centrado y el subtotal con chevron a la derecha.
 * Con `merchantId` solo aparece si la canasta es de ese comercio.
 */
export function CartBar({ merchantId }: { merchantId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lines = useCart((s) => s.lines);
  const merchant = useCart((s) => s.merchant);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = useCart((s) => s.subtotal());
  if (!count || (merchantId && merchant && merchant.id !== merchantId)) return null;
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom + 6, 16) }]} pointerEvents="box-none">
      <Pressable onPress={() => router.push("/(customer)/cart" as never)} accessibilityRole="button"
        accessibilityLabel={`Ver canasta, ${count} ${count === 1 ? "producto" : "productos"}, ${formatCOP(subtotal)}`}
        style={({ pressed }) => [styles.bar, shadows.float, pressed ? { backgroundColor: colors.blueDark } : null]}>
        <View style={styles.count}><Text style={styles.countText}>{count}</Text></View>
        <Text style={styles.label}>Ver canasta</Text>
        <View style={styles.right}>
          <Text style={styles.total}>{formatCOP(subtotal)}</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.white} style={{ marginLeft: 4 }} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.gutter, right: spacing.gutter },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, borderRadius: 26, backgroundColor: colors.blue, paddingHorizontal: 12 },
  count: { position: "absolute", left: 12, minWidth: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  countText: { fontSize: 13.5, lineHeight: 17, fontWeight: "700", color: colors.blue },
  label: { fontSize: 15.5, lineHeight: 20, fontWeight: "600", color: colors.white },
  right: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center" },
  total: { fontSize: 14.5, lineHeight: 19, fontWeight: "600", color: colors.white },
});
