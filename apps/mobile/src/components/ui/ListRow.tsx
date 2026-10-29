import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";

/**
 * Fila de lista (guía C17).
 * - `iconStyle="plain"` (por defecto, C17a/C17b): ícono 22 pt suelto (tinta; `iconColor={colors.blue}` en Cuenta).
 * - `iconStyle="boxed"` (C17c): ícono azul dentro de círculo `#F1F6FE` de 40 pt (Ayuda).
 * `divider={false}` quita la línea inferior (último elemento de un grupo).
 */
export function ListRow({ icon, title, subtitle, right, onPress, chevron = true, danger, left, iconStyle = "plain", iconColor, divider = true, subtitleTone = "tertiary" }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; chevron?: boolean; danger?: boolean; left?: React.ReactNode;
  iconStyle?: "plain" | "boxed"; iconColor?: string; divider?: boolean; subtitleTone?: "tertiary" | "link";
}) {
  const ic = danger ? colors.red : iconColor ?? (iconStyle === "boxed" ? colors.blue : colors.ink);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, divider && styles.divider, pressed && { backgroundColor: colors.surfaceSoft }]}>
      {left ?? (icon ? (
        iconStyle === "boxed"
          ? <View style={styles.iconBox}><Ionicons name={icon} size={20} color={ic} /></View>
          : <Ionicons name={icon} size={22} color={ic} style={styles.iconPlain} />
      ) : null)}
      <View style={{ flex: 1 }}>
        <Text variant="bodyL" tone={danger ? "danger" : "default"}>{title}</Text>
        {subtitle ? <Text variant="bodyS" tone={subtitleTone} style={{ marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} /> : null}
    </Pressable>
  );
}

/** Grupo de filas en tarjeta blanca con borde (Cuenta, 35). Usa `divider={false}` en la última fila. */
export function ListGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4, minHeight: 52 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconPlain: { marginRight: 16, width: 24, textAlign: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F6FE", alignItems: "center", justifyContent: "center", marginRight: 12 },
  group: { backgroundColor: colors.white, borderRadius: radius.r18, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 12, overflow: "hidden" },
});
