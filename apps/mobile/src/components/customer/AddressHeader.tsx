import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors, spacing } from "@yava/shared";
import { Text, SearchBar, IconButton, CountBadge } from "@/components/ui";
import { useLocation } from "@/store/location";
import { useCart } from "@/store/cart";

/**
 * Encabezado con dirección (guía C1) + buscador opcional (C3).
 * - Pin gris relleno, "Puerto Colombia" pequeño gris y "**Casa** · Calle 2 # 3-45" con chevron en círculo gris.
 * - `bag` (por defecto `true` salvo con `back`): bolsa del carrito a la derecha con contador si hay productos.
 * - `back`: botón atrás circular gris antes del pin (09, 25, 29), sin bolsa.
 * - `onSearch`: muestra el buscador blanco debajo (12 pt) y lo vuelve botón.
 * Toda la zona de la dirección abre el selector de dirección.
 */
export function AddressHeader({ searchPlaceholder = "Busca en YAVA", onSearch, back, right, bag, onBag }: {
  searchPlaceholder?: string; onSearch?: () => void; back?: boolean; right?: React.ReactNode;
  bag?: boolean; onBag?: () => void;
}) {
  const router = useRouter();
  const address = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const showBag = bag ?? !back;
  const city = cityName ?? "Puerto Colombia";

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back ? (
          <IconButton icon="chevron-back" size={33} iconSize={18} variant="gray" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            accessibilityLabel="Atrás" style={{ marginLeft: -1, marginRight: 12 }} />
        ) : null}
        <Pressable onPress={() => router.push("/modal/address-picker" as never)} hitSlop={6} style={[styles.addr, !back && { alignSelf: "flex-start" }]} accessibilityRole="button" accessibilityLabel="Cambiar dirección de entrega">
          <PinIcon style={styles.pin} />
          <View style={{ flexShrink: 1 }}>
            <Text variant="meta" tone="tertiary" numberOfLines={1} style={styles.city}>{city}</Text>
            <View style={styles.line}>
              {address ? (
                <>
                  <Text variant="address" style={{ fontWeight: "700" }} numberOfLines={1}>{address.label}</Text>
                  <Text variant="address" style={styles.dot}>·</Text>
                  <Text variant="address" numberOfLines={1} style={{ flexShrink: 1 }}>{address.line1}</Text>
                </>
              ) : (
                <Text variant="address" style={{ fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>Elige tu dirección de entrega</Text>
              )}
              <View style={styles.chev}><Ionicons name="chevron-down" size={12} color={colors.ink} /></View>
            </View>
          </View>
        </Pressable>
        <View style={{ flex: 1 }} />
        {right}
        {showBag ? (
          <Pressable onPress={onBag ?? (() => router.push("/(customer)/cart" as never))} hitSlop={10} style={styles.bag} accessibilityRole="button" accessibilityLabel={count ? `Canasta, ${count} productos` : "Canasta"}>
            <BagIcon size={1.04} />
            <CountBadge count={count} style={{ top: -3, right: -5 }} />
          </Pressable>
        ) : null}
      </View>
      {onSearch ? <SearchBar placeholder={searchPlaceholder} onPress={onSearch} style={styles.search} /> : null}
    </View>
  );
}

/** Pin del encabezado como en el PNG: gota `iconGray` de 11 × 14,3 pt con ojal blanco grande (Ø 4,6 pt), recortado. */
export function PinIcon({ color = colors.iconGray, style }: { color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Svg width={12} height={15.3} viewBox="0 0 12 15.3">
        <Path fillRule="evenodd" fill={color}
          d="M5.5 14.45L1.6 9.29A5.55 5.55 0 1 1 10.4 9.29L6.5 14.45Q6 15.05 5.5 14.45ZM6.1 3.05A2.3 2.3 0 1 0 6.1 7.65A2.3 2.3 0 1 0 6.1 3.05Z" />
      </Svg>
    </View>
  );
}

/** Bolsa de compras del diseño (trapecio alto con asa corta de medio círculo), dibujada a 21 × 22 pt. */
export function BagIcon({ color = colors.ink, size = 1 }: { color?: string; size?: number }) {
  return (
    <Svg width={21 * size} height={22 * size} viewBox="0 0 21 22" fill="none">
      <Path d="M5.9 6.22H15.1Q16.5 6.22 16.65 7.6L18.15 18.4Q18.35 20.19 16.55 20.19H4.45Q2.65 20.19 2.85 18.4L4.35 7.6Q4.5 6.22 5.9 6.22Z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M6.83 9.1V5.47A3.67 3.67 0 0 1 14.17 5.47V9.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.gutter, paddingTop: 2, paddingBottom: 6, backgroundColor: colors.white },
  row: { flexDirection: "row", alignItems: "center", minHeight: 33 },
  addr: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  pin: { marginLeft: 0.4, marginRight: 6.6, transform: [{ translateY: 3.5 }] },
  city: { fontSize: 10.4, marginTop: 1, marginBottom: 0 },
  line: { flexDirection: "row", alignItems: "center" },
  dot: { marginHorizontal: 4, color: colors.ink },
  chev: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.chevronCircle, alignItems: "center", justifyContent: "center", marginLeft: 6, marginVertical: -3, transform: [{ translateY: 1.6 }] },
  bag: { width: 21.8, height: 22.9, marginRight: 6, transform: [{ translateY: 3.1 }] },
  search: { marginTop: 13.5 },
});
