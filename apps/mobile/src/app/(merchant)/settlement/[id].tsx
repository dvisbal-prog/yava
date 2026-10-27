import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, formatCOP, formatDate, formatTime } from "@yava/shared";
import { Screen, Header, Text, Card, Badge, Skeleton, ListRow } from "@/components/ui";
import { ErrorState, MoneyRow } from "@/components/merchant/Rows";
import { useSettlementDetail } from "@/features/merchant/useMerchant";
import { parseBankAccount, formatBankAccount, SETTLEMENT_LABEL, SETTLEMENT_TONE } from "@/features/merchant/types";
import { errorMessage } from "@/lib/errors";

/** Pantalla 67 · Detalle de liquidación. */
export default function SettlementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useSettlementDetail(id);

  if (q.isLoading) return <Screen><Header title="Liquidación" /><Skeleton height={160} style={{ marginBottom: 12 }} /><Skeleton height={200} /></Screen>;
  if (q.isError || !q.data) return <Screen><Header title="Liquidación" /><ErrorState message={q.isError ? errorMessage(q.error) : "No encontrada"} onRetry={() => q.refetch()} /></Screen>;
  const { settlement: s, orders } = q.data;
  const bank = parseBankAccount(s.bank_snapshot);

  return (
    <Screen padded={false}>
      <Header title={`Liquidación L-${s.id.slice(0, 4).toUpperCase()}`} subtitle={`${formatDate(s.period_start)} – ${formatDate(s.period_end)}`} right={<Badge label={SETTLEMENT_LABEL[s.status]} tone={SETTLEMENT_TONE[s.status]} />} />
      <View style={{ paddingHorizontal: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          <MoneyRow label="Ventas (bruto)" value={formatCOP(s.gross)} />
          <MoneyRow label="Comisiones YAVA" value={formatCOP(s.commissions)} negative tone="muted" />
          {s.adjustments ? <MoneyRow label="Ajustes" value={formatCOP(Math.abs(s.adjustments))} negative={s.adjustments < 0} tone="muted" /> : null}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 4 }}>
            <MoneyRow label="Neto a recibir" value={formatCOP(s.net)} strong tone="success" />
          </View>
        </Card>
        <Text variant="heading" style={{ marginBottom: 6 }}>Estado</Text>
        <Card style={{ marginBottom: 16 }}>
          <Text variant="bodyStrong">{SETTLEMENT_LABEL[s.status]}</Text>
          <Text variant="caption" tone="muted">
            {s.status === "paid" ? `Pagada el ${formatDate(s.paid_at)}${s.payment_reference ? ` · Ref. ${s.payment_reference}` : ""}` : s.status === "approved" ? `Aprobada el ${formatDate(s.approved_at)}. El abono se realizará en los próximos días.` : s.status === "rejected" ? s.notes?.trim() ?? "Contacta a soporte." : "En revisión por el equipo de YAVA."}
          </Text>
        </Card>
        <Text variant="heading" style={{ marginBottom: 6 }}>Cuenta de abono</Text>
        <Card style={{ marginBottom: 16 }}>
          <Text variant="bodyStrong">{bank ? formatBankAccount(bank) : "Sin cuenta registrada al generar la liquidación"}</Text>
          {bank ? <Text variant="caption" tone="muted">{bank.holder}</Text> : null}
        </Card>
        <Text variant="heading" style={{ marginBottom: 6 }}>Pedidos incluidos ({orders.length})</Text>
        <Card padded={false}>
          {orders.length === 0 ? <Text tone="muted" style={{ padding: 14 }}>Sin pedidos asociados.</Text> : orders.map((r) => (
            <View key={r.order_id} style={{ paddingHorizontal: 12 }}>
              <ListRow title={`#${r.order?.number ?? "—"} · ${r.order?.customer_name ?? "Cliente"}`} subtitle={r.order ? `${formatDate(r.order.delivered_at)} ${formatTime(r.order.delivered_at)} · venta ${formatCOP(r.order.items_subtotal)}` : ""}
                right={<Text variant="bodyStrong">{formatCOP(r.amount)}</Text>} onPress={r.order?.id ? () => router.push(`/(merchant)/order/${r.order?.id}`) : undefined} />
            </View>
          ))}
        </Card>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
