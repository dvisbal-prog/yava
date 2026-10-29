import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Badge } from "@/components/ui";

/**
 * Tarjeta de dirección seleccionable (C18, mismo lenguaje que 37 · Mis direcciones): radio de 22 pt,
 * etiqueta + "Principal", línea de dirección y ciudad; elegida = fondo `blueTint` con borde azul claro.
 */
export function AddressOption({ label, line, city, selected, principal, onPress, onEdit }: {
  label: string; line: string; city?: string | null; selected: boolean; principal?: boolean; onPress: () => void; onEdit?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${line}`}
      style={({ pressed }) => [styles.card, selected && styles.cardOn, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          {principal ? <Badge label="Principal" tone="principal" style={{ marginLeft: 9 }} /> : null}
        </View>
        <Text style={styles.line} numberOfLines={2}>{line}</Text>
        {city ? <Text style={styles.city} numberOfLines={1}>{city}</Text> : null}
      </View>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Editar ${label}`} style={styles.edit}>
          <Ionicons name="pencil-outline" size={21} color={colors.iconGray} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/** Tarjeta "+ Agregar dirección" (37). */
export function AddAddressCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.add, { opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name="add" size={26} color={colors.blueText} />
      <Text style={styles.addText}>Agregar dirección</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "flex-start", borderRadius: 18, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.white, paddingVertical: 18, paddingLeft: 17, paddingRight: 14, marginBottom: 12,
  },
  cardOn: { backgroundColor: colors.blueTint, borderColor: "#D6E4FA" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#99A1AF", alignItems: "center", justifyContent: "center", marginTop: 1 },
  radioOn: { borderWidth: 2, borderColor: colors.blue },
  dot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.blue },
  text: { flex: 1, marginLeft: 18 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 16.5, lineHeight: 22, fontWeight: "500", letterSpacing: -0.2, color: colors.ink, flexShrink: 1 },
  line: { marginTop: 5, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.2, color: colors.ink },
  city: { marginTop: 1, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.2, color: colors.textTertiary },
  edit: { marginLeft: 8, paddingTop: 1 },
  add: {
    flexDirection: "row", alignItems: "center", height: 67, borderRadius: 18, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.white, paddingHorizontal: 17,
  },
  addText: { marginLeft: 14, fontSize: 15.5, lineHeight: 21, fontWeight: "600", letterSpacing: -0.2, color: colors.blueLink },
});
