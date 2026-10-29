import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, spacing } from "@yava/shared";
import { Text } from "./Text";

/**
 * Barra inferior fija (guía C16) para pantallas que no usan `Screen.footer`:
 * - `total` + `label` a la izquierda y `children` (CTA píldora) a la derecha (C16a: 15, 16).
 * - solo `children` (C16b stepper + CTA, C16c CTA a lo ancho).
 * Se posiciona en el flujo (no absoluta): ponla después del ScrollView dentro de un View `flex: 1`.
 * `plain` quita fondo y sombra (C16c sobre fondo blanco).
 */
export function BottomBar({ label, total, children, plain, style }: {
  label?: string; total?: string; children?: React.ReactNode; plain?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, !plain && styles.shadow, { paddingBottom: Math.max(insets.bottom, 14) }, style]}>
      {total ? (
        <View style={{ marginRight: 16 }}>
          {label ? <Text variant="caption2" tone="tertiary">{label}</Text> : null}
          <Text variant="priceL">{total}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.gutter, paddingTop: 14, backgroundColor: colors.white },
  shadow: { ...shadows.bar },
});
