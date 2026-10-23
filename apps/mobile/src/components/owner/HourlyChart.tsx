import React from "react";
import { View } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";
import type { OverviewHourly } from "@/features/owner/types";

/** Pedidos por hora del día (Views, sin librerías). */
export function HourlyChart({ data, height = 110 }: { data: OverviewHourly[]; height?: number }) {
  if (!data.length) return <Text variant="caption" tone="muted">Aún no hay pedidos en este periodo.</Text>;
  const byHour = new Map(data.map((d) => [d.hour, d.orders]));
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const first = Math.max(0, Math.min(...data.map((d) => d.hour)) - 1);
  const last = Math.min(23, Math.max(...data.map((d) => d.hour)) + 1);
  const visible = hours.slice(first, last + 1);
  const max = Math.max(1, ...data.map((d) => d.orders));
  const current = new Date().getHours();
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height }}>
        {visible.map((h) => {
          const v = byHour.get(h) ?? 0;
          const bh = Math.max(3, Math.round((v / max) * (height - 16)));
          return (
            <View key={h} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
              {v > 0 ? <Text variant="small" tone="muted">{v}</Text> : null}
              <View style={{ width: "55%", height: bh, borderRadius: radius.sm, backgroundColor: h === current ? colors.blue : colors.blueSoft, marginTop: 2 }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {visible.map((h) => (
          <View key={h} style={{ flex: 1, alignItems: "center" }}>
            {h % 2 === 0 ? <Text variant="small" tone="subtle">{String(h).padStart(2, "0")}h</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
