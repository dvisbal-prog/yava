import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify, confirm } from "@/lib/dialog";
import { RadioRow, ErrorState } from "@/components/customer";
import { NavBar, PillButton } from "@/components/customer/cart/parts";
import { LoginRequired } from "@/components/customer/cart/CheckoutStates";
import { usePaymentMethods, useCheckout, loginHref, WOMPI_PUBLIC_KEY, type CustomerPaymentChoice, type PaymentMethodRow } from "@/features/customer";

type Choice = { method: CustomerPaymentChoice; id: string | null };

/** Pago con tarjeta disponible (llave pública de Wompi configurada). */
const CARDS_ON = Boolean(WOMPI_PUBLIC_KEY);

/** "Vence 12/28 · Principal" (o "Tarjeta guardada" si no hay fecha). */
function cardSubtitle(c: PaymentMethodRow): string {
  const exp = c.exp_month && c.exp_year ? `Vence ${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}` : "Tarjeta guardada";
  return `${exp}${c.is_default ? " · Principal" : ""}`;
}

/**
 * Pantalla 17 · Método de pago (tanda-03/17-metodos-pago.png): tarjetas seleccionables (tarjetas guardadas, Efectivo,
 * Nequi), "Agregar tarjeta" y "Confirmar método". Sirve para elegir desde el checkout (`?select=1`) o desde Cuenta.
 * Mantener presionada una tarjeta guardada permite quitarla.
 */
export default function PaymentMethods() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ select?: string }>();
  const selecting = params.select === "1";
  const session = useAuth((s) => s.session);
  const methods = usePaymentMethods();
  const checkout = useCheckout();
  const cards = (methods.data ?? []).filter((m) => m.method === "card");
  const [choice, setChoice] = useState<Choice>({ method: checkout.method, id: checkout.paymentMethodId });

  // Si el checkout tiene "tarjeta" sin id, se marca la principal cuando llegan las tarjetas.
  useEffect(() => {
    if (choice.method === "card" && !choice.id && cards.length) setChoice({ method: "card", id: (cards.find((c) => c.is_default) ?? cards[0]).id });
  }, [cards, choice]);

  function confirmChoice() {
    checkout.setMethod(choice.method, choice.method === "card" ? choice.id : null);
    if (router.canGoBack()) router.back(); else router.replace("/(customer)/checkout" as never);
  }

  async function remove(id: string) {
    if (!(await confirm("Eliminar tarjeta", "¿Quieres quitar esta tarjeta?", { okText: "Eliminar", destructive: true }))) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) notify("No se pudo eliminar", errorMessage(error));
    else {
      if (checkout.paymentMethodId === id) checkout.setMethod("cash");
      if (choice.id === id) setChoice({ method: "cash", id: null });
      void qc.invalidateQueries({ queryKey: ["payment-methods"] });
    }
  }

  if (!session) return <LoginRequired onLogin={() => router.push(loginHref("/(customer)/payment-methods") as never)} />;

  const isSel = (method: CustomerPaymentChoice, id: string | null = null) => choice.method === method && (method !== "card" || choice.id === id);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="chevron" title="Método de pago" titleX={53.2} titleTop={22} titleStyle={styles.navTitle} height={57} backLeft={8.8} backTop={14.1} backIcon={29.5} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>{selecting ? "Elige cómo pagar este pedido." : "Elige cómo quieres pagar tus pedidos."}</Text>

        <View style={styles.list}>
          {CARDS_ON ? (
            methods.isLoading ? <Skeleton height={73} style={{ borderRadius: 14 }} />
              : methods.error ? <ErrorState error={methods.error} onRetry={() => { void methods.refetch(); }} compact />
              : !cards.length ? (
                <RadioRow variant="card" title="Tarjeta de crédito o débito" subtitle="Pagas en línea con Wompi" selected={isSel("card", null)} onPress={() => setChoice({ method: "card", id: null })} />
              ) : cards.map((c) => (
                <RadioRow key={c.id} variant="card" title={`${c.brand ?? "Tarjeta"} ••••${c.last4 ?? ""}`} subtitle={cardSubtitle(c)}
                  selected={isSel("card", c.id)} onPress={() => setChoice({ method: "card", id: c.id })} onLongPress={() => { void remove(c.id); }}
                  right={!selecting ? (
                    <Ionicons name="trash-outline" size={19} color={colors.iconGray} onPress={() => { void remove(c.id); }} accessibilityLabel="Quitar tarjeta" style={{ padding: 4 }} />
                  ) : undefined} />
              ))
          ) : null}
          <RadioRow variant="card" title="Efectivo" subtitle="Paga en la entrega" selected={isSel("cash")} onPress={() => setChoice({ method: "cash", id: null })} />
          <RadioRow variant="card" title="Nequi / Daviplata" subtitle="Transfieres al repartidor al recibir" selected={isSel("nequi")} onPress={() => setChoice({ method: "nequi", id: null })} />
          {CARDS_ON ? (
            <RadioRow variant="card" title="Agregar tarjeta" subtitle="Guarda una nueva tarjeta" selected={false} titleStyle={{ fontWeight: "700", fontSize: 14.2 }}
              leading={<View style={styles.plus}><Ionicons name="add" size={22} color={colors.blueText} /></View>}
              onPress={() => router.push(`/(customer)/add-card${selecting ? "?select=1" : ""}` as never)} />
          ) : null}
        </View>
        {!CARDS_ON ? <Text style={styles.note}>El pago con tarjeta estará disponible pronto.</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 7.5, 14) }]}>
        <PillButton title="Confirmar método" onPress={confirmChoice} height={54.2} radius={15} textStyle={{ fontSize: 16.3, fontWeight: "600" }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  navTitle: { fontSize: 17.2, lineHeight: 22, fontWeight: "700" },
  lead: { fontSize: 13.2, lineHeight: 19, color: colors.textSecondary, marginLeft: 17.3, marginTop: 13.9 },
  list: { marginHorizontal: 12.3, marginTop: 12.3, gap: 6 },
  plus: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginLeft: -2.4, marginRight: -6.1 },
  note: { fontSize: 13, lineHeight: 18, color: colors.textPlaceholder, marginHorizontal: 17.5, marginTop: 14 },
  footer: { paddingHorizontal: 15.7, paddingTop: 10, backgroundColor: colors.white },
});
