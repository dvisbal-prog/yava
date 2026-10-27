import React, { useState } from "react";
import { View } from "react-native";
import { colors, formatCOP } from "@yava/shared";
import { Screen, Text, Card, Skeleton, Divider } from "@/components/ui";
import { Segmented } from "@/components/merchant/Segmented";
import { MoneyRow, SectionTitle } from "@/components/merchant/Rows";
import { OverviewError } from "@/components/owner/OverviewError";
import { useAdminOverview } from "@/features/owner/useOwner";
import { estimatedResult, rangeTitle, RANGE_LABEL } from "@/features/owner/types";
import type { RangeKey } from "@/features/owner/types";

/** Pantalla 99 · Ingresos y resultado. */
export default function OwnerFinance() {
  const [range, setRange] = useState<RangeKey>("today");
  const q = useAdminOverview(range, null);
  const o = q.data;

  return (
    <Screen refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <View style={{ paddingTop: 12, marginBottom: 12 }}>
        <Text variant="title">Ingresos YAVA</Text>
        <Text variant="caption" tone="muted">{rangeTitle(range)}</Text>
      </View>
      <Segmented value={range} onChange={setRange} items={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ key: k, label: RANGE_LABEL[k] }))} />
      {q.isError ? <OverviewError error={q.error} onRetry={() => q.refetch()} /> : q.isLoading || !o ? (
        <View style={{ marginTop: 14 }}><Skeleton height={100} style={{ marginBottom: 12 }} /><Skeleton height={140} style={{ marginBottom: 12 }} /><Skeleton height={220} /></View>
      ) : (() => {
        const result = estimatedResult(o);
        const commissionPct = o.merchant_sales > 0 ? Math.round((o.commissions / o.merchant_sales) * 100) : 10;
        const collectedCheck = o.merchant_sales + o.delivery_fees + o.service_fees - o.discounts;
        const distributed = o.merchant_payouts + o.courier_payouts + o.gateway_fees + (o.yava_revenue - o.gateway_fees - o.discounts);
        return (
          <>
            <Card style={{ marginTop: 14, backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
              <Text variant="caption" tone="muted">Ingresos YAVA</Text>
              <Text variant="display" tone="primary">{formatCOP(o.yava_revenue)}</Text>
              <Text variant="caption" tone="muted">Antes de impuestos</Text>
            </Card>
            <Card style={{ marginTop: 12 }}>
              <MoneyRow label="Comisiones" hint={`${commissionPct} % de ventas de comercios`} value={formatCOP(o.commissions)} />
              <MoneyRow label="Tarifas de servicio" hint="Cuotas y otros servicios cobrados al cliente" value={formatCOP(o.service_fees)} />
            </Card>

            <SectionTitle title="Del ingreso al resultado" />
            <Card>
              <MoneyRow label="Ingresos" value={formatCOP(o.yava_revenue)} />
              <MoneyRow label="Descuentos YAVA" hint="Cupones financiados por la plataforma" value={formatCOP(o.discounts)} negative tone="muted" />
              <MoneyRow label="Pasarela de pagos" value={formatCOP(o.gateway_fees)} negative tone="muted" />
              <MoneyRow label="Gastos operativos" hint="Registrados en el panel web" value={formatCOP(o.opex)} negative tone="muted" />
              <Divider />
              <MoneyRow label="Resultado estimado" hint="Antes de impuestos; no es saldo disponible." value={formatCOP(result)} strong tone={result >= 0 ? "success" : "danger"} />
            </Card>

            <Card style={{ marginTop: 12, backgroundColor: colors.gray50 }}>
              <Text variant="caption" tone="muted">Ventas de comercios</Text>
              <Text variant="heading">{formatCOP(o.merchant_sales)} <Text variant="caption" tone="muted">· {o.delivered} pedidos entregados</Text></Text>
              <Text variant="small" tone="subtle" style={{ marginTop: 4 }}>Las ventas de comercios no son ingresos de YAVA. Ticket promedio {formatCOP(o.avg_ticket)}.</Text>
            </Card>

            <SectionTitle title="Conciliación" />
            <Card>
              <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>Cobrado a clientes</Text>
              <MoneyRow label="Productos" value={formatCOP(o.merchant_sales)} />
              <MoneyRow label="Envío" value={formatCOP(o.delivery_fees)} />
              <MoneyRow label="Servicio" value={formatCOP(o.service_fees)} />
              <MoneyRow label="Descuentos" value={formatCOP(o.discounts)} negative tone="muted" />
              <MoneyRow label="Total cobrado" value={formatCOP(o.collected)} strong />
              {Math.abs(collectedCheck - o.collected) > 0 ? <Text variant="small" tone="warning">Diferencia de {formatCOP(collectedCheck - o.collected)} frente a la suma de componentes (redondeos o ajustes).</Text> : null}
              <Divider />
              <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>Distribución</Text>
              <MoneyRow label="Comercios" value={formatCOP(o.merchant_payouts)} />
              <MoneyRow label="Repartidores" value={formatCOP(o.courier_payouts)} />
              <MoneyRow label="Pasarela" value={formatCOP(o.gateway_fees)} />
              <MoneyRow label="YAVA (después de descuentos y pasarela)" value={formatCOP(o.yava_revenue - o.gateway_fees - o.discounts)} />
              <MoneyRow label="Total distribuido" value={formatCOP(distributed)} strong />
              <Text variant="small" tone={Math.abs(distributed - o.collected) <= Math.max(1, o.delivered) ? "success" : "warning"} style={{ marginTop: 4 }}>
                {Math.abs(distributed - o.collected) <= Math.max(1, o.delivered) ? "Cobrado y distribuido coinciden." : `Diferencia de ${formatCOP(o.collected - distributed)} entre cobrado y distribuido (descuentos financiados por comercios o ajustes).`}
              </Text>
            </Card>
            <Text variant="small" tone="subtle" style={{ marginTop: 12 }}>Las cifras son estimadas y no constituyen un estado contable. La aprobación de pagos se hace en el panel web.</Text>
          </>
        );
      })()}
    </Screen>
  );
}
