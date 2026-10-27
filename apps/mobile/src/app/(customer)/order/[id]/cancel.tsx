import React, { useState } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Screen, Header, Text, Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { RadioRow } from "@/components/customer";
import { useOrder } from "@/features/customer";

const REASONS = ["Me equivoqué al pedir", "Tardó mucho en confirmarse", "Cambié de opinión", "Quiero cambiar la dirección", "Otro motivo"];

/** Pantalla 47 · Cancelar pedido. */
export default function CancelOrder() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const o = order.data;
  const canCancel = o?.status && ["pending_payment", "placed", "accepted"].includes(o.status);

  // Esta pantalla ya es la confirmación: "Confirmar cancelación" llama cancel_order directamente.
  async function cancelOrder() {
    const text = reason === "Otro motivo" ? other.trim() : reason;
    if (!text) { setError("Elige un motivo."); return; }
    setBusy(true); setError(null);
    try {
      const { error: e } = await supabase.rpc("cancel_order", { p_order_id: id, p_reason: text });
      if (e) throw e;
      void qc.invalidateQueries({ queryKey: ["order", id] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      router.dismissTo("/(customer)/orders" as never);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        <Button title="Confirmar cancelación" variant="danger" onPress={cancelOrder} loading={busy} disabled={!canCancel} />
        <Button title="Mantener mi pedido" variant="ghost" onPress={() => router.back()} />
      </View>
    }>
      <Header title="Cancelar pedido" />
      <Text variant="title" style={{ marginTop: 8 }}>¿Por qué quieres cancelar?</Text>
      <Text tone="muted" style={{ marginTop: 4, marginBottom: 12 }}>{canCancel ? "Puedes cancelar sin costo mientras el comercio no haya empezado a preparar tu pedido." : "El pedido ya está en preparación. Si necesitas ayuda, contacta a soporte."}</Text>
      {REASONS.map((r) => <RadioRow key={r} title={r} selected={reason === r} onPress={() => setReason(r)} />)}
      {reason === "Otro motivo" ? <Input value={other} onChangeText={setOther} placeholder="Cuéntanos qué pasó" multiline style={{ minHeight: 60 }} containerStyle={{ marginTop: 12 }} /> : null}
      {error ? <Text tone="danger" style={{ marginTop: 8 }}>{error}</Text> : null}
      {!canCancel ? <Button title="Hablar con soporte" variant="secondary" onPress={() => router.push(`/(customer)/support?order=${id}` as never)} style={{ marginTop: 16 }} /> : null}
    </Screen>
  );
}
