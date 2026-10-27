import React from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Screen, Header, Text, Button, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify, confirm } from "@/lib/dialog";
import { RadioRow, ErrorState, ListSkeleton } from "@/components/customer";
import { usePaymentMethods, useCheckout, loginHref, WOMPI_PUBLIC_KEY } from "@/features/customer";

/** Pantalla 17 · Métodos de pago (selección desde el checkout o gestión desde Cuenta). */
export default function PaymentMethods() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ select?: string }>();
  const selecting = params.select === "1";
  const session = useAuth((s) => s.session);
  const methods = usePaymentMethods();
  const checkout = useCheckout();

  function choose(method: "cash" | "nequi" | "card", id?: string) {
    checkout.setMethod(method, id ?? null);
    if (selecting) router.back();
  }

  async function remove(id: string) {
    if (!(await confirm("Eliminar tarjeta", "¿Quieres quitar esta tarjeta?", { okText: "Eliminar", destructive: true }))) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) notify("No se pudo eliminar", errorMessage(error));
    else { if (checkout.paymentMethodId === id) checkout.setMethod("cash"); void qc.invalidateQueries({ queryKey: ["payment-methods"] }); }
  }

  if (!session) {
    return <Screen><Header title="Métodos de pago" /><EmptyState icon="card-outline" title="Inicia sesión" body="Guarda tus métodos de pago para pedir más rápido." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/payment-methods") as never)} /></Screen>;
  }

  const cards = (methods.data ?? []).filter((m) => m.method === "card");

  return (
    <Screen footer={WOMPI_PUBLIC_KEY ? <Button title="Agregar tarjeta" icon="add" variant="secondary" onPress={() => router.push(`/(customer)/add-card${selecting ? "?select=1" : ""}` as never)} /> : undefined}>
      <Header title="Métodos de pago" />
      <Text variant="caption" tone="muted" style={{ marginTop: 8, marginBottom: 4 }}>Pago al recibir</Text>
      <RadioRow icon="cash-outline" title="Efectivo" subtitle="Ten el valor exacto si puedes" selected={checkout.method === "cash"} onPress={() => choose("cash")} />
      <RadioRow icon="phone-portrait-outline" title="Nequi / Daviplata" subtitle="Transfieres al repartidor al recibir" selected={checkout.method === "nequi"} onPress={() => choose("nequi")} />

      {WOMPI_PUBLIC_KEY ? (
        <>
          <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Tarjetas</Text>
          {methods.isLoading ? <ListSkeleton rows={1} height={48} /> : methods.error ? <ErrorState error={methods.error} onRetry={() => { void methods.refetch(); }} compact /> : !cards.length ? (
            <RadioRow icon="card-outline" title="Tarjeta de crédito o débito" subtitle="Pagas en línea con Wompi" selected={checkout.method === "card" && !checkout.paymentMethodId} onPress={() => choose("card")} />
          ) : cards.map((c) => (
            <RadioRow key={c.id} icon="card-outline" title={`${c.brand ?? "Tarjeta"} •••• ${c.last4 ?? ""}`} subtitle={c.exp_month && c.exp_year ? `Vence ${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}${c.is_default ? " · Principal" : ""}` : undefined}
              selected={checkout.method === "card" && (checkout.paymentMethodId === c.id || (!checkout.paymentMethodId && c.is_default))} onPress={() => choose("card", c.id)}
              right={<Button title="Quitar" variant="ghost" size="sm" full={false} onPress={() => { void remove(c.id); }} />} />
          ))}
        </>
      ) : (
        <View style={{ marginTop: 20 }}><Text variant="caption" tone="subtle">El pago con tarjeta estará disponible pronto.</Text></View>
      )}
    </Screen>
  );
}
