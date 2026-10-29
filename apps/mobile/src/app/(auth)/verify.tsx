import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { AuthScreen } from "@/components/customer/auth/AuthScreen";
import { AuthBack } from "@/components/customer/auth/AuthBack";
import { AuthButton, FOCUS_BORDER } from "@/components/customer/auth/Field";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { maskPhone } from "@/features/customer/helpers";
import { useAccess } from "@/store/access";

const RESEND_SECONDS = 30;

/** Pantalla 04 · Revisa tus mensajes (código de 6 dígitos, reenviar con cuenta regresiva). Medidas de tanda-01/04-verificacion.png. */
export default function Verify() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; next?: string }>();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  const markSeen = useAccess((s) => s.markSeen);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [focused, setFocused] = useState(false);
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
      markSeen();
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
    <AuthScreen
      footerStyle={styles.footer}
      footer={<AuthButton title="Verificar" onPress={() => verify(code)} loading={busy} disabled={code.length !== 6} height={54.5} radius={13} color="#003D9D" textStyle={styles.ctaText} />}
    >
      <AuthBack size={40} color="#F4F4F5" iconSize={25} stroke={38} style={styles.back} />
      <Text variant="h1" style={styles.title}>Revisa tus mensajes</Text>
      <Text style={styles.subtitle}>
        Ingresa el código que enviamos al{"\n"}
        <Text style={styles.phone}>+57 {maskPhone((params.phone ?? "").slice(-10))}.</Text>
      </Text>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.change} accessibilityRole="button">
        <Text style={styles.changeText}>Cambiar número</Text>
      </Pressable>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes} accessibilityLabel="Código de verificación">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = focused && i === Math.min(code.length, 5) && !busy;
          return (
            <View key={i} style={[styles.box, active && styles.boxActive, error ? styles.boxError : null]}>
              <Text style={styles.digit}>{code[i] ?? ""}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" autoFocus maxLength={6} style={styles.hidden}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {error ? <Text tone="danger" style={styles.error}>{error}</Text> : null}

      <View style={styles.resend}>
        {seconds > 0 ? <Text style={styles.resendText}>Reenviar código en {mm}:{ss}</Text> : (
          <Pressable onPress={resend} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.resendText, styles.resendLink]}>Reenviar código</Text>
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: 9.2, marginLeft: 16.6 },
  title: { fontSize: 28.3, lineHeight: 34, marginTop: 30.8, marginHorizontal: 20.5 },
  subtitle: { fontSize: 17.6, lineHeight: 23.5, letterSpacing: -0.3, color: colors.textSecondary, marginTop: 7, marginHorizontal: 20.5 },
  phone: { color: "#384356", letterSpacing: -0.75 },
  change: { alignSelf: "flex-start", marginTop: 7.1, marginLeft: 20.5 },
  changeText: { fontSize: 16, lineHeight: 21, fontWeight: "500", letterSpacing: -0.2, color: colors.blueText },
  boxes: { flexDirection: "row", justifyContent: "space-between", marginTop: 28.7, marginHorizontal: 16.6 },
  box: { width: 53.2, height: 60.5, borderRadius: 8, borderWidth: 1, borderColor: "#D8DBE1", alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  boxActive: { borderColor: FOCUS_BORDER, borderWidth: 2 },
  boxError: { borderColor: colors.red },
  digit: { fontSize: 26.4, lineHeight: 32, fontWeight: "500", color: colors.ink },
  hidden: { position: "absolute", opacity: 0, height: 1, width: 1 },
  error: { marginTop: 12, marginHorizontal: 18.9 },
  resend: { alignItems: "flex-start", marginTop: 27, marginHorizontal: 18.9 },
  resendText: { fontSize: 14.5, lineHeight: 20, letterSpacing: -0.25, color: colors.textTertiary },
  resendLink: { color: colors.blueLink, fontWeight: "600" },
  footer: { paddingHorizontal: 16.6 },
  ctaText: { fontSize: 16.5, lineHeight: 21, fontWeight: "500" },
});
