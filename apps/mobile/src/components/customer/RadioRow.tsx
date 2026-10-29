import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Radio o checkbox del diseño (guía C18): radio 22 pt (marcado = aro 2 pt `blue` + punto; sin marcar = aro 1,5 pt `#99A1AF`);
 * checkbox 21 pt radio 5 (marcado = fondo `blue` + check blanco; vacío = borde `#B6BAC3`).
 */
export function Radio({ selected, checkbox, size, disabled, ringColor }: { selected: boolean; checkbox?: boolean; size?: number; disabled?: boolean; ringColor?: string }) {
  if (checkbox) {
    const s = size ?? 21;
    return (
      <View style={[{ width: s, height: s, borderRadius: 5, alignItems: "center", justifyContent: "center" },
        selected ? { backgroundColor: colors.blue } : { borderWidth: 1.5, borderColor: ringColor ?? "#B6BAC3", backgroundColor: colors.white }, disabled && { opacity: 0.5 }]}>
        {selected ? <Ionicons name="checkmark" size={s * 0.75} color={colors.white} /> : null}
      </View>
    );
  }
  const s = size ?? 22;
  return (
    <View style={[{ width: s, height: s, borderRadius: s / 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
      selected ? { borderWidth: 2, borderColor: colors.blue } : { borderWidth: 1.5, borderColor: ringColor ?? "#99A1AF" }, disabled && { opacity: 0.5 }]}>
      {selected ? <View style={{ width: s * 0.55, height: s * 0.55, borderRadius: s, backgroundColor: colors.blue }} /> : null}
    </View>
  );
}

/**
 * Fila seleccionable (C18).
 * - `variant="row"` (por defecto): fila con divisor; radio/checkbox a la derecha (o a la izquierda con `radioPosition="left"`).
 * - `variant="card"`: tarjeta 366 pt radio 14 (17 métodos de pago): radio a la izquierda, título/subtítulo y `chevron`;
 *   seleccionada = fondo `blueTint` + borde 1,2 pt `blueText`; sin seleccionar = blanca con borde `border` y aro del radio `#6B7385`.
 * `leading` reemplaza el radio (p. ej. "+" en círculo de "Agregar tarjeta").
 */
export function RadioRow({ title, subtitle, selected, onPress, icon, checkbox, right, disabled, variant = "row", radioPosition, chevron, leading, onLongPress, style, titleStyle }: {
  title: string; subtitle?: string; selected: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; checkbox?: boolean; right?: React.ReactNode; disabled?: boolean;
  variant?: "row" | "card"; radioPosition?: "left" | "right"; chevron?: boolean; leading?: React.ReactNode; onLongPress?: () => void; style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}) {
  const card = variant === "card";
  const left = radioPosition ? radioPosition === "left" : card;
  const control = leading ?? <Radio selected={selected} checkbox={checkbox} disabled={disabled} size={card ? 23 : undefined} ringColor={card ? "#6B7385" : undefined} />;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled} accessibilityRole={checkbox ? "checkbox" : "radio"} accessibilityState={{ checked: selected, disabled: !!disabled }}
      style={({ pressed }) => [
        card ? [styles.card, selected && !leading ? styles.cardOn : null] : styles.row,
        pressed && (card ? { opacity: 0.85 } : { backgroundColor: colors.gray50 }),
        disabled && { opacity: 0.5 },
        style,
      ]}>
      {left ? <View style={card ? { marginRight: 17.7 } : { marginRight: 12 }}>{control}</View> : null}
      {icon ? <View style={styles.iconBox}><Ionicons name={icon} size={20} color={colors.blue} /></View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[card ? styles.cardTitle : undefined, titleStyle]} variant={card ? undefined : "bodyStrong"}>{title}</Text>
        {subtitle ? <Text style={card ? styles.cardSub : undefined} variant={card ? undefined : "caption"} tone={card ? "secondary" : "muted"}>{subtitle}</Text> : null}
      </View>
      {right}
      {!left ? <View style={{ marginLeft: 10 }}>{control}</View> : null}
      {(chevron ?? card) ? <Ionicons name="chevron-forward" size={18} color="#5B6274" style={{ marginLeft: 8 }} /> : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  card: { flexDirection: "row", alignItems: "center", minHeight: 73, borderRadius: 14, borderWidth: 1, borderColor: "#E6E9EF", backgroundColor: colors.white, paddingLeft: 14.4, paddingRight: 14 },
  cardOn: { backgroundColor: "#E8F1FD", borderColor: "#1E4FB8", borderWidth: 1.3 },
  cardTitle: { fontSize: 14.8, lineHeight: 19, fontWeight: "500", color: colors.ink },
  cardSub: { fontSize: 11.9, lineHeight: 16, color: colors.textSecondary, marginTop: 2.6 },
});
