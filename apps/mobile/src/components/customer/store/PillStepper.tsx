import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Stepper en píldora blanca con "−" en círculo `blueSoft` y "+" en círculo azul (guía C14e, 14 "Bebidas").
 * `height` = alto de la píldora (14: 25,5; 26: 34); los círculos miden `height − 4,5`.
 * `width` fija el ancho (14: 82 pt, con los círculos en los extremos); sin él, la píldora abraza su contenido.
 * `valueColor`: color del número (14 lo pinta azul; por defecto tinta).
 * Con `min = 0` el "−" en 1 quita el producto.
 */
export function PillStepper({ value, onChange, min = 0, max = 99, height = 34, width, valueColor = colors.ink, style }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; height?: number; width?: number; valueColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pad = width ? 2.25 : 3;
  const c = height - pad * 2;
  return (
    <View style={[styles.pill, { height, borderRadius: height / 2, paddingHorizontal: pad }, width ? { width, justifyContent: "space-between" } : null, shadows.soft, style]}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} hitSlop={6} accessibilityLabel={value <= 1 && min === 0 ? "Quitar" : "Disminuir"}
        style={[styles.circle, { width: c, height: c, borderRadius: c / 2, backgroundColor: colors.blueSoft }]}>
        <Ionicons name="remove" size={Math.round(c * 0.62)} color={colors.blue} />
      </Pressable>
      <Text style={[styles.value, { fontSize: Math.round(height * 0.44), color: valueColor }]}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} hitSlop={6} accessibilityLabel="Aumentar" disabled={value >= max}
        style={[styles.circle, { width: c, height: c, borderRadius: c / 2, backgroundColor: colors.blue, opacity: value >= max ? 0.5 : 1 }]}>
        <Ionicons name="add" size={Math.round(c * 0.66)} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.pill },
  circle: { alignItems: "center", justifyContent: "center" },
  value: { minWidth: 26, textAlign: "center", fontWeight: "500", color: colors.ink },
});
