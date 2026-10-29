import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { ScooterIcon } from "@/components/customer/order/ScooterIcon";

export interface TimelineStep {
  label: string;
  /** Hora ya formateada ("12:05 p. m.") o vacía. */
  time?: string;
  done: boolean;
  current?: boolean;
  /** Ícono del nodo actual (por defecto la moto del diseño, `ScooterIcon`). */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const DONE_BG = "#E1EAFC";
const DONE_FG = "#0A3DB4";
const CURRENT_BG = "#0049DD";
const LINE_DONE = "#95BAF9";
const LINE_ACTIVE = "#002DB6";
const LINE_TODO = "#DCE1E9";

/**
 * Línea de tiempo horizontal (guía C29).
 * - `large` (21 Seguimiento): nodos de 37,4 pt separados 136 pt alrededor del centro de la pantalla; hecho = círculo
 *   azul claro con ✓, actual = azul sólido con la moto; conectores de 3,2 pt (hecho azul claro, hacia el actual azul).
 * - `small` (fondo de 47): nodos de 12 pt; actual = aro azul con punto, pendientes = punto gris; etiqueta actual en azul.
 */
export function Timeline({ steps, variant = "large" }: { steps: TimelineStep[]; variant?: "large" | "small" }) {
  const { width } = useWindowDimensions();
  const small = variant === "small";
  const node = small ? 15 : 37.4;
  const spacing = small ? Math.min(142.5, (width - 2 * 17.5 - 80) / 2) : Math.min(136, (width - 2 * 17.5 - 70) / 2);
  const mid = width / 2;
  const centers = steps.map((_, i) => mid + (i - (steps.length - 1) / 2) * spacing);
  const colW = Math.min(spacing, 136);
  const gap = small ? 3 : 5.1;
  return (
    <View style={{ height: small ? 64 : 72, marginHorizontal: -17.5 }} accessibilityRole="progressbar"
      accessibilityLabel={steps.map((s) => `${s.label}${s.done ? " (hecho)" : s.current ? " (en curso)" : ""}`).join(", ")}>
      {centers.slice(1).map((c, i) => {
        const next = steps[i + 1];
        const color = next.done ? LINE_DONE : next.current ? (small ? LINE_TODO : LINE_ACTIVE) : LINE_TODO;
        const left = centers[i] + node / 2 + gap;
        const w = c - node / 2 - gap - left;
        return (
          <View key={`l${i}`} style={{ position: "absolute", top: node / 2 - (small ? 1 : 1.6), left, width: w, height: small ? 2 : 3.2, borderRadius: 2, backgroundColor: color }}>
            {small && steps[i].current ? <View style={{ width: w * 0.32, height: 2, borderRadius: 1, backgroundColor: colors.blue }} /> : null}
          </View>
        );
      })}
      {steps.map((s, i) => (
        <View key={s.label} style={{ position: "absolute", left: centers[i] - colW / 2, width: colW, alignItems: "center" }}>
          {small ? <SmallNode step={s} /> : (
            <View style={[styles.node, { backgroundColor: s.current ? CURRENT_BG : s.done ? DONE_BG : colors.surfaceGray }]}>
              {s.current ? (s.icon ? <MaterialCommunityIcons name={s.icon} size={25} color={colors.white} /> : <ScooterIcon width={19} />)
                : s.done ? <Ionicons name="checkmark" size={21} color={DONE_FG} /> : null}
            </View>
          )}
          <Text style={small
            ? [styles.sLabel, s.current ? { color: colors.blueText, fontWeight: "600" } : null]
            : [styles.label, !s.done && !s.current ? { color: colors.textTertiary } : null]}
            numberOfLines={1}>{s.label}</Text>
          {s.time ? <Text style={small ? styles.sTime : styles.time} numberOfLines={1}>{s.time}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function SmallNode({ step }: { step: TimelineStep }) {
  if (step.current) {
    return <View style={styles.sRing}><View style={styles.sDot} /></View>;
  }
  return <View style={styles.sNodeWrap}><View style={[styles.sGray, step.done && { backgroundColor: colors.blue }]} /></View>;
}

const styles = StyleSheet.create({
  node: { width: 37.4, height: 37.4, borderRadius: 18.7, alignItems: "center", justifyContent: "center" },
  label: { marginTop: 3, fontSize: 11.3, lineHeight: 15, fontWeight: "500", color: colors.ink },
  time: { marginTop: 2.2, fontSize: 10.1, lineHeight: 14, color: "#48516F" },
  sRing: { width: 15, height: 15, borderRadius: 7.5, borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  sDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.blue },
  sNodeWrap: { width: 15, height: 15, alignItems: "center", justifyContent: "center" },
  sGray: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#A7AEBB" },
  sLabel: { marginTop: 9.5, fontSize: 10.6, lineHeight: 14, color: "#5B6479" },
  sTime: { marginTop: 1, fontSize: 9.4, lineHeight: 13, color: "#3F475A" },
});
