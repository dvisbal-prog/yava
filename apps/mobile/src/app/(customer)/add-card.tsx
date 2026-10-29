import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { Radio } from "@/components/customer/RadioRow";
import { NavBar, PillButton } from "@/components/customer/cart/parts";
import { FormField } from "@/components/customer/cart/FormField";
import { useCheckout, usePaymentMethods, detectCardBrand, maskCardNumber, maskExpiry, type PaymentMethodRow } from "@/features/customer";
import { notify } from "@/lib/dialog";

/** Marcador del CVV vacío: tres puntos de 5,8 pt como en el PNG (el "•" de la fuente sale más pequeño y alto). */
function CvvDots() {
  return (
    <View style={{ flexDirection: "row", gap: 5, marginLeft: 2.1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => <View key={i} style={{ width: 5.8, height: 5.8, borderRadius: 2.9, backgroundColor: "#A8AFBD" }} />)}
    </View>
  );
}

/** Tarjeta gris del campo "Número de tarjeta": contorno 1,6 pt con banda magnética, 25 × 18 pt (los íconos de la librería traen chip). */
function CardGlyph() {
  return (
    <View style={styles.cardGlyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.cardStripe} />
    </View>
  );
}

/**
 * Pantalla 18 · Agregar tarjeta (tanda-03/18-agregar-tarjeta.png).
 * IMPORTANTE: NO guardamos el número completo (PAN) ni el CVV. Solo marca, últimos 4, vencimiento y titular.
 * TODO(wompi): tokenizar la tarjeta con la API de Wompi (POST /v1/tokens/cards con la llave pública) y guardar
 * el token resultante en `payment_methods.provider_token`; el cobro se hace desde el servidor con ese token.
 */
export default function AddCard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ select?: string }>();
  const session = useAuth((s) => s.session);
  const checkout = useCheckout();
  const saved = usePaymentMethods();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  // La primera tarjeta queda como principal; las siguientes, solo si el cliente lo marca.
  const [isDefault, setIsDefault] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const digits = number.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const hasCards = (saved.data ?? []).some((m) => m.method === "card");
  const principal = isDefault ?? !hasCards;
  const complete = digits.length >= 15 && expiry.length === 5 && cvv.length >= 3 && holder.trim().length > 0;

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
        user_id: session?.user.id as string, provider: "wompi", method: "card", brand, last4: digits.slice(-4), exp_month: month, exp_year: year, holder_name: holder.trim(), is_default: principal, provider_token: null,
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
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <NavBar variant="chevron" height={44} backLeft={11} backTop={13} backIcon={28} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.h1} accessibilityRole="header">Agregar tarjeta</Text>
        <Text style={styles.lead}>Guarda tu tarjeta para pagar más rápido{"\n"}tus próximos pedidos.</Text>

        <FormField label="Número de tarjeta" value={maskCardNumber(number)} onChangeText={setNumber} placeholder="0000 0000 0000 0000" keyboardType="number-pad"
          textContentType="creditCardNumber" autoComplete="cc-number" containerStyle={{ marginTop: 28.5 }} error={!!error && digits.length < 15}
          right={<CardGlyph />} />
        <FormField label="Nombre del titular" value={holder} onChangeText={setHolder} placeholder="Como aparece en la tarjeta" autoCapitalize="characters"
          autoComplete="cc-name" containerStyle={{ marginTop: 18.4 }} />
        <View style={{ flexDirection: "row", marginTop: 18.9, gap: 15.8 }}>
          <FormField label="Vencimiento" value={maskExpiry(expiry)} onChangeText={(t) => setExpiry(maskExpiry(t))} placeholder="MM/AA" keyboardType="number-pad"
            autoComplete="cc-exp" containerStyle={{ flex: 174 }} inputPadding={17} />
          <FormField label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))} placeholderNode={<CvvDots />} keyboardType="number-pad" secureTextEntry
            autoComplete="cc-csc" accessibilityLabel="CVV" containerStyle={{ flex: 166.4 }} inputPadding={14.6} style={{ fontSize: 24, letterSpacing: 1.6, paddingBottom: 6.4 }}
            right={<Ionicons name="help-circle-outline" size={25.5} color="#8E94A6" onPress={() => notify("Código de seguridad", "Son los 3 o 4 dígitos que aparecen en el reverso de tu tarjeta.")} accessibilityLabel="¿Qué es el CVV?" style={{ marginRight: -4 }} />} />
        </View>

        <Pressable onPress={() => setIsDefault(!principal)} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: principal }}>
          <Radio checkbox selected={principal} size={20.5} ringColor="#6E7689" />
          <Text style={styles.checkText}>Usar como tarjeta principal</Text>
        </Pressable>
        <View style={styles.secure}>
          <MaterialCommunityIcons name="lock" size={21} color="#666F82" />
          <Text style={styles.secureText}>Tus datos se procesarán de forma segura.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PillButton title="Guardar tarjeta" onPress={save} loading={saving} disabled={!complete} tone={complete ? "blue" : "disabled"} height={54.4} radius={14}
          style={{ marginTop: error ? 12 : 34.8 }} textStyle={{ fontSize: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 18.4 },
  h1: { fontSize: 29.6, lineHeight: 35, fontWeight: "700", color: colors.ink, letterSpacing: -0.5, marginTop: 15.8, marginLeft: 1.1 },
  lead: { fontSize: 16.8, lineHeight: 22.5, color: colors.textSecondary, marginTop: 6.4, marginLeft: 2 },
  check: { flexDirection: "row", alignItems: "center", marginTop: 33.8, alignSelf: "flex-start" },
  checkText: { fontSize: 16, lineHeight: 21, color: colors.ink, marginLeft: 10.2 },
  secure: { flexDirection: "row", alignItems: "center", marginTop: 17.7, marginLeft: 1 },
  secureText: { fontSize: 12.6, lineHeight: 18, color: "#737A8E", marginLeft: 9.4, marginTop: 2 },
  error: { fontSize: 13, lineHeight: 18, color: colors.red, marginTop: 18 },
  cardGlyph: { width: 25.3, height: 18.3, borderRadius: 3.6, borderWidth: 1.6, borderColor: "#A0A6B3", marginRight: 2.6, transform: [{ translateY: 1.1 }] },
  cardStripe: { position: "absolute", left: 0, right: 0, top: 3.2, height: 4.5, backgroundColor: "#A6ACB8" },
});
