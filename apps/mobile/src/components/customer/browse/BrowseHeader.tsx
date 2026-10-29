import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { PinIcon } from "@/components/customer/AddressHeader";
import { useLocation } from "@/store/location";

/**
 * Encabezado de 09 Restaurantes (C1 variante atrás), medido en `tanda-02/09-restaurantes.png`:
 * círculo gris de 33 pt en x 16,6 / y 6,5; pin en x 64; "Puerto Colombia" y "**Casa** · Calle…" desde x 85
 * y el chevron en círculo de 21 pt a 7 pt del texto. El círculo atrás va 4 pt más abajo que el bloque de texto
 * (en el diseño no están centrados entre sí). Alto total 46 pt (el buscador empieza en y 51,8).
 */
export function BackAddressBar({ onBack, style }: { onBack?: () => void; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const address = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));

  return (
    <View style={[styles.wrap, style]}>
      <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Atrás"
        style={({ pressed }) => [styles.back, { opacity: pressed ? 0.75 : 1 }]}>
        <Ionicons name="chevron-back" size={17.5} color={colors.ink} style={{ marginLeft: -0.6 }} />
      </Pressable>
      <Pressable onPress={() => router.push("/modal/address-picker" as never)} hitSlop={6} style={styles.addr}
        accessibilityRole="button" accessibilityLabel="Cambiar dirección de entrega">
        <PinIcon style={styles.pin} />
        <View style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} style={styles.city}>{cityName ?? "Puerto Colombia"}</Text>
          <View style={styles.line}>
            {address ? (
              <>
                <Text numberOfLines={1} style={[styles.addrText, { fontWeight: "700" }]}>{address.label}</Text>
                <Text style={[styles.addrText, styles.dot]}>·</Text>
                <Text numberOfLines={1} style={[styles.addrText, { flexShrink: 1 }]}>{address.line1}</Text>
              </>
            ) : (
              <Text numberOfLines={1} style={[styles.addrText, { fontWeight: "700", flexShrink: 1 }]}>Elige tu dirección de entrega</Text>
            )}
            <View style={styles.chev}><Ionicons name="chevron-down" size={12.5} color={colors.ink} /></View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/** Ícono de filtros del chip "Ordenar" (09): dos líneas con perilla, arriba a la izquierda y abajo a la derecha. */
export function SlidersIcon({ size = 14, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.93} viewBox="0 0 14 13">
      <Circle cx={3.1} cy={3.1} r={2.25} stroke={color} strokeWidth={1.7} fill="none" />
      <Path d="M5.4 3.1H13.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={10.9} cy={9.9} r={2.25} stroke={color} strokeWidth={1.7} fill="none" />
      <Path d="M0.9 9.9H8.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 46, backgroundColor: colors.white },
  back: { position: "absolute", left: 16.6, top: 6.5, width: 33, height: 33, borderRadius: 16.5, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
  addr: { position: "absolute", left: 63.6, top: 4.4, right: 16, flexDirection: "row", alignItems: "center" },
  pin: { marginRight: 9.3, transform: [{ translateY: 2.4 }] },
  city: { fontSize: 10.4, lineHeight: 14, color: colors.textTertiary },
  line: { flexDirection: "row", alignItems: "center", marginTop: 1.2 },
  addrText: { fontSize: 11.4, lineHeight: 15, fontWeight: "500", color: colors.ink },
  dot: { marginHorizontal: 4.2 },
  chev: { width: 21.3, height: 21.3, borderRadius: 11, backgroundColor: colors.chevronCircle, alignItems: "center", justifyContent: "center", marginLeft: 7.3, marginVertical: -4, transform: [{ translateY: 1.8 }] },
});
