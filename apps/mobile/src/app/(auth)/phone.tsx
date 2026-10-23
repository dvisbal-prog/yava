import React, { useState } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen, Header, Text, Input, Button } from "@/components/ui";
import { sendPhoneOtp, normalizePhone } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { maskPhone } from "@/features/customer/helpers";

/** Pantalla 03 · Tu número de celular. */
export default function Phone() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digits = phone.replace(/\D/g, "");

  async function submit() {
    if (digits.length !== 10 || !digits.startsWith("3")) { setError("Escribe un celular colombiano de 10 dígitos."); return; }
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
      <Input label="País" value="Colombia (+57)" editable={false} icon="flag-outline" />
      <Input label="Celular" value={maskPhone(phone)} onChangeText={(t) => setPhone(t)} placeholder="300 123 4567" keyboardType="phone-pad" textContentType="telephoneNumber" autoFocus error={error} hint="Usaremos este número para tu entrega." />
      <View style={{ height: 8 }} />
    </Screen>
  );
}
