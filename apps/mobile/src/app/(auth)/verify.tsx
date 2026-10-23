import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, radius } from "@yava/shared";
import { Screen, Header, Text, Button } from "@/components/ui";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";

const RESEND_SECONDS = 30;

/** Pantalla 04 · Revisa tus mensajes (código de 6 dígitos, reenviar con cuenta regresiva). */
export default function Verify() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; next?: string }>();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  useEffect(() => { if (code.length === 6) void verify(code); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function verify(token: string) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      if (params.next) setPendingNext(params.next);
      await verifyPhoneOtp(params.phone, token);
      // El AuthGate del layout raíz redirige a /(customer); allí se completa el perfil si hace falta.
      router.replace("/(customer)" as never);
    } catch (e) {
      setError(errorMessage(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await sendPhoneOtp(params.phone);
      setSeconds(RESEND_SECONDS);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Screen footer={<Button title="Verificar" onPress={() => verify(code)} loading={busy} disabled={code.length !== 6} />}>
      <Header back />
      <Text variant="display" style={{ marginTop: 8 }}>Revisa tus mensajes</Text>
      <Text tone="muted" style={{ marginTop: 6 }}>Ingresa el código que enviamos al {params.phone}.</Text>
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginTop: 6, marginBottom: 28 }}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>Cambiar número</Text></Pressable>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.box, i === code.length && styles.boxActive, error && styles.boxError]}>
            <Text variant="title">{code[i] ?? ""}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput ref={inputRef} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoFocus maxLength={6} style={styles.hidden} />
      {error ? <Text tone="danger" style={{ marginTop: 12 }}>{error}</Text> : null}

      <View style={{ alignItems: "center", marginTop: 24 }}>
        {seconds > 0 ? <Text tone="muted">Reenviar código en {mm}:{ss}</Text> : <Button title="Reenviar código" variant="ghost" full={false} onPress={resend} />}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  boxes: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  box: { flex: 1, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.gray200, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray50 },
  boxActive: { borderColor: colors.blue, backgroundColor: colors.white },
  boxError: { borderColor: colors.red },
  hidden: { position: "absolute", opacity: 0, height: 1, width: 1 },
});
