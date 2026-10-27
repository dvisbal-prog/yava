import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, radius } from "@yava/shared";
import { Screen, Header, Text, Input, Button } from "@/components/ui";
import { sendPhoneOtp, normalizePhone } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { maskPhone } from "@/features/customer/helpers";

/** Deja solo los 10 dígitos del celular (quita un +57 pegado y cualquier exceso). */
function phoneDigits(text: string): string {
  const d = text.replace(/\D/g, "");
  return (d.length > 10 && d.startsWith("57") ? d.slice(2) : d).slice(0, 10);
}

/** Pantalla 03 · Tu número de celular. */
export default function Phone() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (digits.length !== 10 || !digits.startsWith("3")) { setError("Escribe un celular colombiano de 10 dígitos que empiece por 3."); return; }
    setBusy(true); setError(null);
    try {
      await sendPhoneOtp(digits);
      const q = new URLSearchParams({ phone: normalizePhone(digits) });
      if (params.next) q.set("next", params.next);
      router.push(`/(auth)/verify?${q.toString()}` as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="Continuar" onPress={submit} loading={busy} disabled={digits.length !== 10} />}>
      <Header back />
      <Text variant="display" style={{ marginTop: 8 }}>Tu número de celular</Text>
      <Text tone="muted" style={{ marginTop: 6, marginBottom: 24 }}>Te enviaremos un código para entrar o crear tu cuenta.</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>País</Text>
      <View style={styles.country} accessibilityLabel="País: Colombia, +57">
        <ColombiaFlag />
        <Text style={{ marginLeft: 12 }}>Colombia (+57)</Text>
      </View>
      <Input
        label="Celular"
        value={maskPhone(digits)}
        onChangeText={(t) => { setDigits(phoneDigits(t)); if (error) setError(null); }}
        maxLength={12}
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        error={error}
        hint="Usaremos este número para tu entrega."
        onSubmitEditing={submit}
      />
      <View style={{ height: 8 }} />
    </Screen>
  );
}

/** Bandera de Colombia (amarillo 1/2, azul 1/4, rojo 1/4). */
function ColombiaFlag() {
  return (
    <View style={styles.flag}>
      <View style={{ flex: 2, backgroundColor: "#FCD116" }} />
      <View style={{ flex: 1, backgroundColor: "#003893" }} />
      <View style={{ flex: 1, backgroundColor: "#CE1126" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  country: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, minHeight: 48, marginBottom: 14, backgroundColor: colors.white },
  flag: { width: 28, height: 20, borderRadius: 3, overflow: "hidden" },
});
