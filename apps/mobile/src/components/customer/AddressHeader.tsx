import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, SearchBar } from "@/components/ui";
import { useLocation } from "@/store/location";

/** Encabezado de pestaña: ciudad + dirección activa (tocable) y buscador. Sin logo, como en la maqueta. */
export function AddressHeader({ searchPlaceholder = "Busca en YAVA", onSearch, back, right }: { searchPlaceholder?: string; onSearch?: () => void; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  const address = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const city = cityName ?? "Puerto Colombia";
  const line = address ? `${address.label} · ${address.line1}` : "Elige tu dirección de entrega";
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, backgroundColor: colors.white }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginRight: 8 }}><Ionicons name="chevron-back" size={24} color={colors.carbon} /></Pressable>
        ) : null}
        <Pressable onPress={() => router.push("/modal/address-picker" as never)} style={{ flex: 1 }} hitSlop={6}>
          <Text variant="small" tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{city}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="location" size={16} color={colors.blue} style={{ marginRight: 4 }} />
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>{line}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray500} style={{ marginLeft: 4 }} />
          </View>
        </Pressable>
        {right}
      </View>
      {onSearch ? <View style={styles.search}><SearchBar placeholder={searchPlaceholder} onPress={onSearch} /></View> : null}
    </View>
  );
}
const styles = StyleSheet.create({ search: { marginTop: 12 } });
