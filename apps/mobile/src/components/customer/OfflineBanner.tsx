import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { useOnline } from "@/features/customer/useOnline";

/** Pantalla 48 · Banner superior "Sin conexión" con reintento. */
export function OfflineBanner() {
  const { online, retry } = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.white} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text variant="bodyStrong" tone="inverse">Sin conexión</Text>
        <Text variant="small" tone="inverse" style={{ opacity: 0.9 }}>Revisa tu internet. Reintentamos cada 15 segundos.</Text>
      </View>
      <Pressable onPress={() => { void retry(); }} hitSlop={8} style={styles.btn}>
        <Text variant="caption" style={{ color: colors.carbon, fontWeight: "700" }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.carbon, paddingHorizontal: 16, paddingBottom: 10 },
  btn: { backgroundColor: colors.yellow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});
