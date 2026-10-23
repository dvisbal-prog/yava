import React from "react";
import { View } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";

export interface Bar { label: string; value: number; highlight?: boolean }

/** Gráfica de barras simple con Views (sin librerías). */
export function BarChart({ bars, height = 120, formatValue }: { bars: Bar[]; height?: number; formatValue?: (v: number) => string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  if (!bars.length) return <Text tone="muted" variant="caption">Sin datos para graficar.</Text>;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: height + 36 }}>
      {bars.map((b, i) => {
        const h = Math.max(4, Math.round((b.value / max) * height));
        return (
          <View key={`${b.label}-${i}`} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
            {formatValue && b.value > 0 ? <Text variant="small" tone="muted" numberOfLines={1} style={{ marginBottom: 4 }}>{formatValue(b.value)}</Text> : null}
            <View style={{ width: "60%", height: h, borderRadius: radius.sm, backgroundColor: b.highlight ? colors.blue : colors.blueSoft }} />
            <Text variant="small" tone="muted" style={{ marginTop: 6 }}>{b.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
