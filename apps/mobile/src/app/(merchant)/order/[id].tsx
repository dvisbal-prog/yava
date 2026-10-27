import React, { useState } from "react";
import { View, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatTime, ORDER_STATUS_LABEL } from "@yava/shared";
import type { OrderStatus, PaymentMethod } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Chip, StatusPill, Skeleton, Divider, Input } from "@/components/ui";
import { MoneyRow, ErrorState, SectionTitle } from "@/components/merchant/Rows";
import { useOrderDetail, useMerchantSetStatus, useCancelOrder } from "@/features/merchant/useMerchant";
import { parseAddress, addressLine, parseItemOptions } from "@/features/merchant/types";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { notify } from "@/lib/dialog";
import { errorMessage } from "@/lib/errors";

const PAYMENT_LABEL: Record<PaymentMethod, string> = { cash: "Efectivo", card: "Tarjeta", pse: "PSE", nequi: "Nequi", daviplata: "Daviplata" };
const REJECT_REASONS = ["Sin existencias", "Cerramos temporalmente", "No alcanzamos a prepararlo", "Dirección fuera de cobertura"];

/** Pantalla 52 · Detalle del pedido para el comercio. */
export default function MerchantOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useOrderDetail(id);
  useRealtimeOrder(id);
  const setStatus = useMerchantSetStatus();
  const cancel = useCancelOrder();
  const [eta, setEta] = useState<number>(25);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (q.isLoading) return <Screen><Header title="Pedido" /><Skeleton height={80} style={{ marginBottom: 12 }} /><Skeleton height={160} style={{ marginBottom: 12 }} /><Skeleton height={120} /></Screen>;
  if (q.isError || !q.data) return <Screen><Header title="Pedido" /><ErrorState message={q.isError ? errorMessage(q.error) : "Pedido no encontrado"} onRetry={() => q.refetch()} /></Screen>;

  const { order, items } = q.data;
  const status = (order.status ?? "placed") as OrderStatus;
  const addr = parseAddress(order.address_snapshot);
  const busy = setStatus.isPending || cancel.isPending;

  const act = async (s: "accepted" | "preparing" | "ready") => {
    if (!order.id) return;
    try {
      await setStatus.mutateAsync({ orderId: order.id, status: s, etaMin: s === "accepted" ? eta : undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (s === "ready") router.back();
    } catch (e) { notify("No se pudo actualizar", errorMessage(e)); }
  };

  const doReject = async () => {
    if (!order.id) return;
    const r = reason.trim();
    if (r.length < 3) { notify("Indica el motivo", "Elige o escribe un motivo para el cliente."); return; }
    try {
      await cancel.mutateAsync({ orderId: order.id, reason: r });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      router.back();
    } catch (e) { notify("No se pudo rechazar", errorMessage(e)); }
  };

  const footer = status === "placed" ? (
    rejecting ? (
      <View>
        <Text variant="bodyStrong" style={{ marginBottom: 8 }}>Motivo del rechazo</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 6 }}>
          {REJECT_REASONS.map((r) => <View key={r} style={{ marginBottom: 8 }}><Chip label={r} selected={reason === r} onPress={() => setReason(r)} /></View>)}
        </View>
        <Input placeholder="Otro motivo…" value={REJECT_REASONS.includes(reason) ? "" : reason} onChangeText={setReason} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button title="Volver" variant="outline" onPress={() => setRejecting(false)} style={{ flex: 1 }} />
          <Button title="Rechazar pedido" variant="danger" onPress={doReject} loading={cancel.isPending} style={{ flex: 1 }} />
        </View>
      </View>
    ) : (
      <View>
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Tiempo estimado de preparación</Text>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          {[15, 25, 35].map((m) => <Chip key={m} label={`${m} min`} selected={eta === m} onPress={() => setEta(m)} />)}
        </View>
        <Button title="Aceptar pedido" onPress={() => act("accepted")} loading={setStatus.isPending} />
        <Button title="Rechazar" variant="ghost" onPress={() => setRejecting(true)} disabled={busy} style={{ marginTop: 6 }} />
      </View>
    )
  ) : status === "accepted" ? (
    <View>
      <Button title="Marcar en preparación" onPress={() => act("preparing")} loading={busy} />
      <Button title="Cancelar pedido" variant="ghost" onPress={() => setRejecting(true)} disabled={busy} style={{ marginTop: 6 }} />
      {rejecting ? (
        <View style={{ marginTop: 8 }}>
          <Input placeholder="Motivo para el cliente" value={reason} onChangeText={setReason} autoFocus />
          <Button title="Confirmar cancelación" variant="danger" onPress={doReject} loading={cancel.isPending} />
        </View>
      ) : null}
    </View>
  ) : status === "preparing" ? (
    <Button title="Marcar listo para recoger" onPress={() => act("ready")} loading={busy} icon="bag-check-outline" />
  ) : null;

  return (
    <Screen footer={footer} padded={false}>
      <Header title={`Pedido #${order.number ?? ""}`} subtitle={formatTime(order.placed_at)} right={<StatusPill status={status} />} />
      <View style={{ paddingHorizontal: 16 }}>
        {status === "ready" || status === "assigned" || status === "picked_up" || status === "on_the_way" ? (
          <Card style={{ marginBottom: 12, backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="bicycle-outline" size={22} color={colors.blue} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{order.courier_name ? order.courier_name : "Buscando repartidor…"}</Text>
                <Text variant="caption" tone="muted">{order.courier_name ? ORDER_STATUS_LABEL[status] : "Te avisaremos cuando un repartidor acepte la entrega."}</Text>
              </View>
              {order.courier_phone ? <Button title="Llamar" size="sm" variant="secondary" full={false} icon="call-outline" onPress={() => Linking.openURL(`tel:${order.courier_phone}`).catch(() => {})} /> : null}
            </View>
          </Card>
        ) : null}

        <SectionTitle title="Productos" style={{ marginTop: 8 }} />
        <Card padded={false}>
          {items.map((it, idx) => {
            const opts = parseItemOptions(it.options);
            return (
              <View key={it.id} style={{ padding: 14, borderTopWidth: idx ? 1 : 0, borderTopColor: colors.gray100 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text variant="bodyStrong" style={{ width: 32 }}>{it.qty}x</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{it.name}</Text>
                    {opts.map((o, i) => <Text key={i} variant="caption" tone="muted">· {o.name}{o.price_delta ? ` (+${formatCOP(o.price_delta)})` : ""}</Text>)}
                    {it.notes ? <Text variant="caption" tone="warning" style={{ marginTop: 2 }}>Nota: {it.notes}</Text> : null}
                  </View>
                  <Text variant="bodyStrong">{formatCOP(it.total)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
        {order.notes ? (
          <Card style={{ marginTop: 12, backgroundColor: colors.yellowSoft, borderColor: colors.yellowSoft }}>
            <Text variant="caption" tone="muted">Notas del cliente</Text>
            <Text style={{ marginTop: 2 }}>{order.notes}</Text>
          </Card>
        ) : null}

        <SectionTitle title="Entrega" />
        <Card>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name="location-outline" size={20} color={colors.blue} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{addr.label ?? "Dirección"}</Text>
              <Text tone="muted">{addressLine(addr)}</Text>
              {addr.instructions ? <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>{addr.instructions}</Text> : null}
            </View>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="person-outline" size={20} color={colors.blue} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{order.customer_name ?? "Cliente"}</Text>
              <Text variant="caption" tone="muted">{order.eta_min ? `Entrega estimada en ${order.eta_min}–${order.eta_max ?? order.eta_min + 10} min` : "Sin tiempo estimado aún"}</Text>
            </View>
            {order.customer_phone ? <Button title="Llamar" size="sm" variant="outline" full={false} icon="call-outline" onPress={() => Linking.openURL(`tel:${order.customer_phone}`).catch(() => {})} /> : null}
          </View>
          <Divider />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={order.payment_method === "cash" ? "cash-outline" : "card-outline"} size={20} color={colors.blue} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{PAYMENT_LABEL[(order.payment_method ?? "cash") as PaymentMethod]}</Text>
              <Text variant="caption" tone="muted">{order.payment_method === "cash" ? "El repartidor cobra al entregar" : order.payment_status === "paid" ? "Pagado en línea" : "Pago en proceso"}</Text>
            </View>
          </View>
        </Card>

        <SectionTitle title="Desglose" />
        <Card>
          <MoneyRow label="Productos" value={formatCOP(order.items_subtotal)} />
          <MoneyRow label="Envío" hint="Va íntegro al repartidor" value={formatCOP(order.delivery_fee)} tone="muted" />
          <MoneyRow label="Tarifa de servicio YAVA" value={formatCOP(order.service_fee)} tone="muted" />
          {order.discount ? <MoneyRow label="Descuento" value={formatCOP(order.discount)} negative tone="muted" /> : null}
          <MoneyRow label="Total que paga el cliente" value={formatCOP(order.total)} strong />
          <Divider />
          <MoneyRow label={`Comisión YAVA (${Math.round((order.commission_rate ?? 0.1) * 100)} %)`} value={formatCOP(order.commission_amount)} negative tone="muted" />
          <MoneyRow label="Recibes" hint="Se incluye en tu próxima liquidación" value={formatCOP(order.merchant_payout)} strong tone="success" />
        </Card>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
