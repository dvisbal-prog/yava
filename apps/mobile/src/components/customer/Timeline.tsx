import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatTime } from "@yava/shared";
import { Text } from "@/components/ui";

export interface TimelineStep { label: string; at: string | null; done: boolean; current?: boolean }

/** Línea de tiempo Confirmado → Preparado → En camino → Entregado con horas. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((s, i) => (
        <View key={s.label} style={{ flexDirection: "row" }}>
          <View style={{ alignItems: "center", width: 24 }}>
            <View style={[styles.dot, s.done && styles.dotDone, s.current && styles.dotCurrent]}>
              {s.done ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
            </View>
            {i < steps.length - 1 ? <View style={[styles.line, steps[i + 1].done && { backgroundColor: colors.blue }]} /> : null}
          </View>
          <View style={{ flex: 1, paddingLeft: 10, paddingBottom: i < steps.length - 1 ? 18 : 0 }}>
            <Text variant={s.current ? "bodyStrong" : "body"} tone={s.done || s.current ? "default" : "muted"}>{s.label}</Text>
            {s.at ? <Text variant="caption" tone="muted">{formatTime(s.at)}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.gray300, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.blue, borderColor: colors.blue },
  dotCurrent: { borderColor: colors.blue, borderWidth: 3 },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.gray200, marginVertical: 2 },
});
