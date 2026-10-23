import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Card, Text, Badge, Button } from "@/components/ui";
import type { OwnerAlertRow } from "@/features/owner/types";

const SEVERITY: Record<string, { tone: "blue" | "yellow" | "red"; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { tone: "blue", label: "Info", icon: "information-circle-outline" },
  warning: { tone: "yellow", label: "Atención", icon: "warning-outline" },
  critical: { tone: "red", label: "Crítica", icon: "alert-circle-outline" },
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.round(h / 24)} d`;
}

export function AlertCard({ alert, onAcknowledge, acknowledging }: { alert: OwnerAlertRow; onAcknowledge?: () => void; acknowledging?: boolean }) {
  const sev = SEVERITY[alert.severity] ?? SEVERITY.info;
  const done = !!alert.acknowledged_at;
  return (
    <Card style={{ marginBottom: 12, opacity: done ? 0.7 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <Ionicons name={sev.icon} size={22} color={sev.tone === "red" ? colors.red : sev.tone === "yellow" ? "#8A6400" : colors.blue} style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>{alert.title}</Text>
            <Text variant="small" tone="subtle">{timeAgo(alert.created_at)}</Text>
          </View>
          {alert.body ? <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{alert.body}</Text> : null}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <Badge label={done ? "Reconocida" : sev.label} tone={done ? "gray" : sev.tone} />
            <View style={{ flex: 1 }} />
            {!done && onAcknowledge ? <Button title="Reconocer" size="sm" variant="secondary" full={false} onPress={onAcknowledge} loading={acknowledging} /> : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
