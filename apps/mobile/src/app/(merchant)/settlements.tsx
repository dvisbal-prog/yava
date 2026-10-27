import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { colors, formatCOP, formatDate } from "@yava/shared";
import { Screen, Header, Text, Card, Badge, EmptyState, Skeleton } from "@/components/ui";
import { ErrorState, MoneyRow } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantSettlements } from "@/features/merchant/useMerchant";
import { parseBankAccount, formatBankAccount, SETTLEMENT_LABEL, SETTLEMENT_TONE } from "@/features/merchant/types";
import { errorMessage } from "@/lib/errors";


/** Pantalla 66 · Liquidaciones del comercio. */
export default function MerchantSettlements() {
  const router = useRouter();
  const { data: m } = useMyMerchant();
  const q = useMerchantSettlements(m?.id);
  const list = q.data ?? [];
  const pending = list.filter((s) => s.status === "pending" || s.status === "approved");
  const toReceive = pending.reduce((a, s) => a + s.net, 0);
  const sales = pending.reduce((a, s) => a + s.gross, 0);
  const commissions = pending.reduce((a, s) => a + s.commissions, 0);
  const bank = parseBankAccount(m?.bank_account);

  return (
    <Screen padded={false} refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <Header title="Liquidaciones" />
      <View style={{ paddingHorizontal: 16 }}>
        {q.isLoading ? <Skeleton height={140} style={{ marginBottom: 16 }} /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : (
          <Card style={{ marginBottom: 16, backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
            <Text variant="caption" tone="muted">Saldo por recibir</Text>
            <Text variant="display" tone="primary">{formatCOP(toReceive)}</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>Corresponde a tus ventas menos la comisión de las liquidaciones en proceso.</Text>
            <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(30,94,255,0.15)" }}>
              <MoneyRow label="Ventas" value={formatCOP(sales)} />
              <MoneyRow label={`Comisión (${m ? Math.round(m.commission_rate * 100) : 10} %)`} value={formatCOP(commissions)} negative tone="muted" />
              <MoneyRow label="Neto a liquidar" value={formatCOP(toReceive)} strong />
            </View>
          </Card>
        )}
        <Text variant="heading" style={{ marginBottom: 8 }}>Historial</Text>
        {q.isLoading ? null : list.length === 0 ? (
          <EmptyState icon="wallet-outline" title="Aún no hay liquidaciones" body="Generamos una liquidación por periodo con tus pedidos entregados." />
        ) : list.map((s) => (
          <Card key={s.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/(merchant)/settlement/${s.id}`)}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Liquidación L-{s.id.slice(0, 4).toUpperCase()}</Text>
                <Text variant="caption" tone="muted">Periodo {formatDate(s.period_start)} – {formatDate(s.period_end)} · {s.orders_count} pedidos</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text variant="heading">{formatCOP(s.net)}</Text>
                <Badge label={SETTLEMENT_LABEL[s.status]} tone={SETTLEMENT_TONE[s.status]} />
              </View>
            </View>
          </Card>
        ))}
        <Text variant="heading" style={{ marginTop: 12, marginBottom: 8 }}>Cuenta bancaria</Text>
        <Card onPress={() => router.push("/(merchant)/bank")}>
          <Text variant="caption" tone="muted">Cuenta de abonos</Text>
          <Text variant="bodyStrong">{bank ? formatBankAccount(bank) : "Agrega tu cuenta bancaria"}</Text>
          {bank ? <Text variant="caption" tone="muted">{bank.holder}</Text> : null}
        </Card>
        <Text variant="caption" tone="subtle" style={{ marginTop: 12 }}>La fecha de abono se mostrará cuando se confirme el pago.</Text>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
