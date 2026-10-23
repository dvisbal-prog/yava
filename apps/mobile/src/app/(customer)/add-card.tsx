import React, { useState } from "react";
import { View, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Card } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useCheckout, detectCardBrand, maskCardNumber, maskExpiry, type PaymentMethodRow } from "@/features/customer";

/**
 * Pantalla 18 · Agregar tarjeta.
 * IMPORTANTE: NO guardamos el número completo (PAN) ni el CVV. Solo marca, últimos 4, vencimiento y titular.
 * TODO(wompi): tokenizar la tarjeta con la API de Wompi (POST /v1/tokens/cards con la llave pública) y guardar
 * el token resultante en `payment_methods.provider_token`; el cobro se hace desde el servidor con ese token.
 */
export default function AddCard() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ select?: string }>();
  const session = useAuth((s) => s.session);
  const checkout = useCheckout();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const digits = number.replace(/\D/g, "");
  const brand = detectCardBrand(digits);

  async function save() {
    const [mm, yy] = expiry.split("/");
    const month = Number(mm), year = yy ? 2000 + Number(yy) : 0;
    if (digits.length < 15) { setError("Revisa el número de la tarjeta."); return; }
    if (!(month >= 1 && month <= 12) || !yy || yy.length !== 2) { setError("Revisa la fecha de vencimiento (MM/AA)."); return; }
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) { setError("La tarjeta está vencida."); return; }
    if (cvv.length < 3) { setError("Revisa el código de seguridad."); return; }
    if (!holder.trim()) { setError("Escribe el nombre del titular."); return; }
    setSaving(true); setError(null);
    try {
      // TODO(wompi): aquí iría la tokenización; `provider_token` queda null hasta integrarla.
      const { data, error: e } = await supabase.from("payment_methods").insert({
        user_id: session?.user.id as string, provider: "wompi", method: "card", brand, last4: digits.slice(-4), exp_month: month, exp_year: year, holder_name: holder.trim(), is_default: isDefault, provider_token: null,
      }).select().single();
      if (e) throw e;
      const row = data as PaymentMethodRow;
      await qc.invalidateQueries({ queryKey: ["payment-methods"] });
      checkout.setMethod("card", row.id);
      if (params.select === "1") router.dismissTo("/(customer)/checkout" as never); else router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button title="Guardar tarjeta" onPress={save} loading={saving} />}>
      <Header title="Agregar tarjeta" />
      <Card style={{ marginTop: 8, marginBottom: 20, backgroundColor: colors.carbon, borderColor: colors.carbon, minHeight: 150, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text tone="inverse" variant="bodyStrong">{brand}</Text><Text tone="inverse" variant="caption" style={{ opacity: 0.7 }}>YAVA</Text></View>
        <Text tone="inverse" style={{ fontSize: 20, letterSpacing: 2, marginTop: 16 }}>{maskCardNumber(number) || "•••• •••• •••• ••••"}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <Text tone="inverse" variant="caption" style={{ textTransform: "uppercase" }}>{holder || "Nombre del titular"}</Text>
          <Text tone="inverse" variant="caption">{expiry || "MM/AA"}</Text>
        </View>
      </Card>
      <Input label="Número de tarjeta" value={maskCardNumber(number)} onChangeText={setNumber} placeholder="4242 4242 4242 4242" keyboardType="number-pad" icon="card-outline" textContentType="creditCardNumber" />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Input label="Vencimiento" value={maskExpiry(expiry)} onChangeText={(t) => setExpiry(maskExpiry(t))} placeholder="MM/AA" keyboardType="number-pad" containerStyle={{ flex: 1 }} />
        <Input label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))} placeholder="123" keyboardType="number-pad" secureTextEntry containerStyle={{ flex: 1 }} />
      </View>
      <Input label="Nombre del titular" value={holder} onChangeText={setHolder} placeholder="Como aparece en la tarjeta" autoCapitalize="characters" error={error} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Text style={{ flex: 1 }}>Usar como método principal</Text>
        <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.blue }} />
      </View>
      <Text variant="small" tone="subtle" style={{ marginTop: 12 }}>Tus datos se procesan de forma segura con Wompi. YAVA no almacena el número completo ni el código de seguridad.</Text>
    </Screen>
  );
}
