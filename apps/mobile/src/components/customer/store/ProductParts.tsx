import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, PixelRatio } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";

/* ───────────────────────── C14a/C14b · Stepper de la barra inferior (13, 27, 30) ───────────────────────── */

/** Proporciones medidas en 13/27/30: centros de "−", número y "+" y posición de los divisores (fracción del ancho). */
const STEP = { minus: 0.187, value: 0.497, plus: 0.822, div1: 0.32, div2: 0.66 };

/** "−" / "+" dibujados con barras de 2 pt (el trazo de Ionicons es más fino que el del diseño). Posiciones redondeadas al píxel. */
function Glyph({ plus, size, color }: { plus?: boolean; size: number; color: string }) {
  const t = 2;
  const px = PixelRatio.roundToNearestPixel;
  const s = px(size);
  const w = plus ? s : px(size * 0.92);
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ position: "absolute", left: px((s - w) / 2), top: px((s - t) / 2), width: w, height: t, borderRadius: t / 2, backgroundColor: color }} />
      {plus ? <View style={{ position: "absolute", left: px((s - t) / 2), top: 0, width: t, height: s, borderRadius: t / 2, backgroundColor: color }} /> : null}
    </View>
  );
}

/**
 * "−" | n | "+" con divisores verticales, a las proporciones del diseño.
 * - `outline` (13: 140 × 41; 30: 121 × 40): píldora blanca con borde `border`.
 * - `filled` (27: 145,6 × 52,7): fondo `#F1F2F5` sin borde.
 * En el mínimo el "−" se ve igual (tinta, como en el PNG) pero no hace nada.
 */
export function BarStepper({ value, onChange, min = 1, max = 99, width, height, variant = "outline", glyph, style }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; width: number; height: number;
  variant?: "outline" | "filled"; /** Lado del "+" en pt (13/30: 12,5; 27: 14,8). */ glyph?: number; style?: StyleProp<ViewStyle>;
}) {
  const filled = variant === "filled";
  const g = glyph ?? Math.round(height * 0.3 * 10) / 10;
  const divH = Math.round(height * 0.53);
  const segL = width * STEP.div1;
  const segR = width * (1 - STEP.div2);
  return (
    <View style={[styles.stepper, { width, height, borderRadius: height / 2 }, filled ? styles.stepperFilled : styles.stepperOutline, style]}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} hitSlop={6} accessibilityRole="button" accessibilityLabel="Disminuir"
        accessibilityState={{ disabled: value <= min }} style={[styles.stepperBtn, { left: 0, width: segL }]}>
        <View style={{ position: "absolute", left: PixelRatio.roundToNearestPixel(width * STEP.minus - g / 2), top: PixelRatio.roundToNearestPixel((height - g) / 2 - (filled ? 0 : 1)) }}>
          <Glyph size={g} color={colors.ink} />
        </View>
      </Pressable>
      <View style={[styles.stepperDiv, { left: segL, top: (height - divH) / 2 - (filled ? 0 : 1), height: divH }]} />
      <Text style={[styles.stepperValue, { left: segL, width: width * (STEP.div2 - STEP.div1), lineHeight: height - (filled ? 0 : 2) }]}>{value}</Text>
      <View style={[styles.stepperDiv, { left: width * STEP.div2, top: (height - divH) / 2 - (filled ? 0 : 1), height: divH }]} />
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} hitSlop={6} accessibilityRole="button" accessibilityLabel="Aumentar"
        accessibilityState={{ disabled: value >= max }} style={[styles.stepperBtn, { right: 0, width: segR }]}>
        <View style={{ position: "absolute", left: PixelRatio.roundToNearestPixel(width * (STEP.plus - STEP.div2) - g / 2), top: PixelRatio.roundToNearestPixel((height - g) / 2 - (filled ? 0 : 1)) }}>
          <Glyph plus size={g} color={value >= max ? colors.textPlaceholder : colors.ink} />
        </View>
      </Pressable>
    </View>
  );
}

/* ───────────────────────── C18 · Radio y opción seleccionable ───────────────────────── */

/** Radio 21–24 pt: marcado = aro 2 pt azul + punto; sin marcar = aro gris. `checkbox` lo vuelve cuadrado (multi-selección). */
export function RadioDot({ selected, size = 21.2, checkbox, disabled, ring }: {
  selected: boolean; size?: number; checkbox?: boolean; disabled?: boolean;
  /** Aro sin marcar: color y grosor (27 lo dibuja más oscuro y grueso que 13). */ ring?: { color: string; width: number };
}) {
  if (checkbox) {
    return (
      <View style={[styles.check, { width: size - 1, height: size - 1 }, selected ? styles.checkOn : null, disabled ? { opacity: 0.4 } : null]}>
        {selected ? <Ionicons name="checkmark" size={size * 0.72} color={colors.white} /> : null}
      </View>
    );
  }
  return (
    <View style={[styles.radio, { width: size, height: size, borderRadius: size / 2 }, !selected && ring ? { borderColor: ring.color, borderWidth: ring.width } : null, selected ? styles.radioOn : null, disabled ? { opacity: 0.4 } : null]}>
      {selected ? <View style={{ width: size * 0.52, height: size * 0.52, borderRadius: size * 0.26, backgroundColor: colors.blue }} /> : null}
    </View>
  );
}

/**
 * Opción de un grupo (13 "Elige el picante"): tarjeta 43,5 pt radio 10. Seleccionada = fondo `blueTint` sin borde;
 * sin seleccionar = blanca con borde `border`. Precio adicional ("Sin costo" / "+$4.000") a la derecha.
 */
export function OptionCard({ label, priceDelta, selected, onPress, checkbox, disabled, note }: {
  label: string; priceDelta: number; selected: boolean; onPress: () => void; checkbox?: boolean; disabled?: boolean; note?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole={checkbox ? "checkbox" : "radio"} accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [styles.option, selected ? styles.optionOn : null, pressed ? { opacity: 0.85 } : null, disabled ? { opacity: 0.5 } : null]}>
      <RadioDot selected={selected} checkbox={checkbox} />
      <Text style={styles.optionLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.optionPrice}>{note ?? (priceDelta ? `+${formatCOP(priceDelta)}` : "Sin costo")}</Text>
    </Pressable>
  );
}

/** Fila de radio sin tarjeta (27 "Si no está disponible"): radio 23,6 pt + texto 15 pt, alto 39. */
export function RadioLine({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={styles.radioLine}>
      <RadioDot selected={selected} size={23.6} ring={{ color: "#78809A", width: 1.9 }} />
      <Text style={styles.radioLineText}>{label}</Text>
    </Pressable>
  );
}

/* ───────────────────────── C17d · Filas de información de farmacia (30) ───────────────────────── */

/** Fila 45 pt con ícono outline, texto 13,4 pt y chevron; al tocarla despliega `body`. */
export function InfoRow({ icon, title, body, open, onToggle }: {
  icon: React.ReactNode; title: string; body: string; open: boolean; onToggle: () => void;
}) {
  return (
    <View style={styles.infoWrap}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={({ pressed }) => [styles.infoRow, pressed ? { opacity: 0.7 } : null]}>
        <View style={styles.infoIcon}>{icon}</View>
        <Text style={styles.infoTitle}>{title}</Text>
        <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color={colors.ink} />
      </Pressable>
      {open ? <Text style={styles.infoBody}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { overflow: "hidden" },
  stepperOutline: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#E3E6EC" },
  stepperFilled: { backgroundColor: "#F1F2F5" },
  stepperBtn: { position: "absolute", top: 0, bottom: 0 },
  stepperDiv: { position: "absolute", width: 1, backgroundColor: "#E1E4EA" },
  stepperValue: { position: "absolute", top: 0, textAlign: "center", fontSize: 16.3, fontWeight: "500", color: colors.ink },

  radio: { borderWidth: 1.6, borderColor: "#8E96A8", alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  radioOn: { borderWidth: 2, borderColor: colors.blue },
  check: { borderRadius: 5, borderWidth: 1.5, borderColor: "#B6BAC3", alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  checkOn: { backgroundColor: colors.blue, borderColor: colors.blue },

  option: { flexDirection: "row", alignItems: "center", height: 44.6, borderRadius: radius.r10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingLeft: 13, paddingRight: 13 },
  optionOn: { backgroundColor: "#EAF1FC", borderColor: "#EAF1FC" },
  optionLabel: { flex: 1, marginLeft: 16.4, fontSize: 13.6, lineHeight: 18, fontWeight: "600", color: colors.ink },
  optionPrice: { fontSize: 11.3, lineHeight: 15, color: colors.textTertiary, marginLeft: 8 },

  radioLine: { flexDirection: "row", alignItems: "center", height: 39 },
  radioLineText: { marginLeft: 15, fontSize: 15, lineHeight: 20, color: colors.ink },

  infoWrap: { borderBottomWidth: 1, borderBottomColor: "#E5E8EE" },
  infoRow: { flexDirection: "row", alignItems: "center", height: 44 },
  infoIcon: { width: 24, alignItems: "center", marginLeft: 0.5 },
  infoTitle: { flex: 1, marginLeft: 9, fontSize: 13.4, lineHeight: 18, color: colors.ink },
  infoBody: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, paddingLeft: 33.5, paddingRight: 8, paddingBottom: 12 },
});
