import React, { useMemo, useState } from "react";
import { View, Linking } from "react-native";
import { colors, formatCOP, formatDate } from "@yava/shared";
import { Screen, Header, Text, Card, Badge, Button, Skeleton, EmptyState, ListRow } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { ErrorState } from "@/components/merchant/Rows";
import { usePendingSettlements, useMerchantNames, useProfileNames } from "@/features/owner/useOwner";
import { ADMIN_URL } from "@/features/owner/types";
import { SETTLEMENT_LABEL, SETTLEMENT_TONE } from "@/features/merchant/types";
import { errorMessage } from "@/lib/errors";

type Seg = "all" | "merchant" | "courier";

/** Pantalla 101 · Pagos pendientes (solo lectura; aprobación en el panel web). */
export default function OwnerPayouts() {
  const q = usePendingSettlements();
  const [seg, setSeg] = useState<Seg>("all");
  const list = q.data ?? [];
  const merchantIds = useMemo(() => [...new Set(list.filter((s) => s.payee_type === "merchant").map((s) => s.payee_id))], [list]);
  const courierIds = useMemo(() => [...new Set(list.filter((s) => s.payee_type === "courier").map((s) => s.payee_id))], [list]);
  const mNames = useMerchantNames(merchantIds);
  const cNames = useProfileNames(courierIds);
  const merchantsTotal = list.filter((s) => s.payee_type === "merchant").reduce((a, s) => a + s.net, 0);
  const couriersTotal = list.filter((s) => s.payee_type === "courier").reduce((a, s) => a + s.net, 0);
  const visible = list.filter((s) => seg === "all" || s.payee_type === seg);

  return (
    <Screen padded={false} refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}
      footer={<View>
        <Text variant="caption" tone="muted" style={{ textAlign: "center", marginBottom: 8 }}>Consulta el detalle y aprueba los pagos desde el panel web.</Text>
        <Button title="Aprobar en el panel web" icon="open-outline" onPress={() => Linking.openURL(`${ADMIN_URL}/settlements`).catch(() => Linking.openURL(ADMIN_URL).catch(() => {}))} />
      </View>}>
      <Header title="Pagos pendientes" subtitle="Fondos por entregar a terceros" />
      <View style={{ paddingHorizontal: 16 }}>
        {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.isLoading ? <><Skeleton height={110} style={{ marginBottom: 12 }} /><Skeleton height={60} style={{ marginBottom: 12 }} /><Skeleton height={200} /></> : (
          <>
            <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueSoft, marginBottom: 12 }}>
              <Text variant="caption" tone="muted">Total pendiente</Text>
              <Text variant="display" tone="primary">{formatCOP(merchantsTotal + couriersTotal)}</Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <View style={{ flex: 1 }}><Text variant="caption" tone="muted">Comercios</Text><Text variant="bodyStrong">{formatCOP(merchantsTotal)}</Text></View>
                <View style={{ flex: 1 }}><Text variant="caption" tone="muted">Repartidores</Text><Text variant="bodyStrong">{formatCOP(couriersTotal)}</Text></View>
              </View>
            </Card>
            <Segmented value={seg} onChange={setSeg} items={[{ key: "all", label: "Todos", count: list.length }, { key: "merchant", label: "Comercios", count: merchantIds.length ? list.filter((s) => s.payee_type === "merchant").length : 0 }, { key: "courier", label: "Repartidores", count: list.filter((s) => s.payee_type === "courier").length }]} />
            <Text variant="caption" tone="muted" style={{ marginTop: 12, marginBottom: 6 }}>Por revisar · Mostrando {visible.length} de {list.length}</Text>
            {visible.length === 0 ? <EmptyState icon="checkmark-done-outline" title="Sin pagos pendientes" body="Todas las liquidaciones están pagadas." /> : (
              <Card padded={false}>
                <View style={{ paddingHorizontal: 12 }}>
                  {visible.map((s) => (
                    <ListRow key={s.id} icon={s.payee_type === "merchant" ? "storefront-outline" : "bicycle-outline"}
                      title={s.payee_type === "merchant" ? mNames.data?.[s.payee_id] ?? "Comercio" : cNames.data?.[s.payee_id] ?? "Repartidor"}
                      subtitle={`${s.payee_type === "merchant" ? "Comercio" : "Repartidor"} · ${formatDate(s.period_start)} – ${formatDate(s.period_end)} · ${s.orders_count} pedidos`}
                      right={<View style={{ alignItems: "flex-end" }}><Text variant="bodyStrong">{formatCOP(s.net)}</Text><Badge label={s.status === "approved" ? "Programado" : SETTLEMENT_LABEL[s.status]} tone={SETTLEMENT_TONE[s.status]} /></View>} chevron={false} />
                  ))}
                </View>
              </Card>
            )}
          </>
        )}
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
