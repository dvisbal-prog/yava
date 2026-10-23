import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/** Fila seleccionable con radio o checkbox a la derecha. */
export function RadioRow({ title, subtitle, selected, onPress, icon, checkbox, right, disabled }: {
  title: string; subtitle?: string; selected: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; checkbox?: boolean; right?: React.ReactNode; disabled?: boolean;
}) {
  const name: keyof typeof Ionicons.glyphMap = checkbox ? (selected ? "checkbox" : "square-outline") : (selected ? "radio-button-on" : "radio-button-off");
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gray50 }, disabled && { opacity: 0.5 }]}>
      {icon ? <View style={styles.iconBox}><Ionicons name={icon} size={20} color={colors.blue} /></View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted">{subtitle}</Text> : null}
      </View>
      {right}
      <Ionicons name={name} size={22} color={selected ? colors.blue : colors.gray300} style={{ marginLeft: 10 }} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
});
