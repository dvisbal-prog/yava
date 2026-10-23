import React, { useMemo } from "react";
import { View } from "react-native";
import { colors, formatCOP, formatDate, formatTime, ORDER_STATUS_LABEL } from "@yava/shared";
import type { OrderStatus } from "@yava/shared";
import { Screen, Text, Card, Badge, EmptyState } from "@/components/ui";
import { ErrorState, ListSkeleton } from "@/components/merchant/Rows";
import { useCourierHistory } from "@/features/courier/useCourier";
import { parseAddress, addressLine } from "@/features/merchant/types";
import type { OrderSummaryRow } from "@/features/merchant/types";
import { errorMessage } from "@/lib/errors";

function dayLabel(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === y.toDateString()) return "Ayer";
  return formatDate(iso);
}

/** Pantalla 70 · Historial de entregas por fecha. */
export default function CourierHistory() {
  const q = useCourierHistory(200);
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: OrderSummaryRow[]; total: number }>();
    for (const o of q.data ?? []) {
      const key = (o.delivered_at ?? o.cancelled_at ?? o.placed_at ?? "").slice(0, 10);
      const g = map.get(key) ?? { label: dayLabel(o.delivered_at ?? o.cancelled_at ?? o.placed_at), rows: [], total: 0 };
      g.rows.push(o);
      if (o.status === "delivered") g.total += o.courier_payout ?? 0;
      map.set(key, g);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([, g]) => g);
  }, [q.data]);

  return (
    <Screen refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <Text variant="title" style={{ paddingTop: 12, marginBottom: 12 }}>Entregas</Text>
      {q.isLoading ? <ListSkeleton rows={4} height={80} /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : groups.length === 0 ? (
        <EmptyState icon="bicycle-outline" title="Todavía no tienes entregas" body="Tus entregas completadas aparecerán aquí organizadas por fecha." />
      ) : groups.map((g) => (
        <View key={g.label + g.rows.length} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text variant="heading" style={{ flex: 1 }}>{g.label}</Text>
            <Text variant="caption" tone="muted">{g.rows.filter((r) => r.status === "delivered").length} entregas · </Text>
            <Text variant="bodyStrong" tone="success">{formatCOP(g.total)}</Text>
          </View>
          {g.rows.map((o) => {
            const addr = parseAddress(o.address_snapshot);
            return (
              <Card key={o.id ?? ""} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">#{o.number} · {o.merchant_name ?? "Envío"}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>{addressLine(addr)}</Text>
                    <Text variant="small" tone="subtle" style={{ marginTop: 2 }}>{formatTime(o.delivered_at ?? o.cancelled_at)} · {o.payment_method === "cash" ? "Efectivo" : "Pago en línea"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="bodyStrong" tone={o.status === "delivered" ? "success" : "muted"}>{o.status === "delivered" ? `+${formatCOP(o.courier_payout)}` : "—"}</Text>
                    <Badge label={ORDER_STATUS_LABEL[(o.status ?? "delivered") as OrderStatus]} tone={o.status === "delivered" ? "green" : "red"} />
                  </View>
                </View>
                {o.status === "cancelled" && o.cancel_reason ? <Text variant="caption" tone="muted" style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 6 }}>{o.cancel_reason}</Text> : null}
              </Card>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}
