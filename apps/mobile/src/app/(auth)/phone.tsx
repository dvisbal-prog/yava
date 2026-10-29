import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { AuthScreen } from "@/components/customer/auth/AuthScreen";
import { AuthBack } from "@/components/customer/auth/AuthBack";
import { Field, AuthButton, LOOK_PHONE } from "@/components/customer/auth/Field";
import { designImages } from "@/lib/design-images";
import { sendPhoneOtp, normalizePhone } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { maskPhone } from "@/features/customer/helpers";

/** Deja solo los 10 dígitos del celular (quita un +57 pegado y cualquier exceso). */
function phoneDigits(text: string): string {
  const d = text.replace(/\D/g, "");
  return (d.length > 10 && d.startsWith("57") ? d.slice(2) : d).slice(0, 10);
}

/** Pantalla 03 · Tu número de celular (medidas de tanda-01/03-celular.png). */
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
    <AuthScreen
      footerStyle={styles.footer}
      footer={<AuthButton title="Continuar" onPress={submit} loading={busy} disabled={digits.length !== 10} height={53.6} radius={14} color="#0043A9" textStyle={styles.ctaText} />}
    >
      <AuthBack size={37.2} color="#EEEEF3" iconSize={27} stroke={36} iconShift={{ x: -1.6, y: 0.5 }} style={styles.back} />
      <Text variant="h1" style={styles.title}>Tu número de celular</Text>
      <Text tone="secondary" style={styles.subtitle}>Te enviaremos un código para entrar o crear tu cuenta.</Text>

      <Text style={[LOOK_PHONE.label, styles.countryLabel]}>País</Text>
      <View style={styles.country} accessible accessibilityLabel="País: Colombia, +57">
        <Image source={designImages.banderaColombia} style={styles.flag} contentFit="contain" />
        <Text style={styles.countryText}>Colombia (+57)</Text>
        <Ionicons name="chevron-down" size={18.3} color={colors.ink} />
      </View>

      <Field
        look={LOOK_PHONE}
        label="Celular"
        containerStyle={styles.phoneField}
        style={styles.phoneInput}
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
        boxHeight={51.3}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: 10.6, marginLeft: 19.4 },
  title: { fontSize: 28.5, lineHeight: 34, marginTop: 62.9, marginHorizontal: 19.4 },
  subtitle: { fontSize: 15, lineHeight: 20, letterSpacing: -0.38, marginTop: 6.8, marginLeft: 19.4, marginRight: 17 },
  countryLabel: { marginTop: 39.9, marginHorizontal: 20.8, marginBottom: 6.8 },
  country: {
    flexDirection: "row", alignItems: "center", height: 48.5, marginHorizontal: 19.4, borderRadius: 12, borderWidth: 1, borderColor: LOOK_PHONE.borderColor,
    paddingLeft: 14.2, paddingRight: 9.3, backgroundColor: colors.white,
  },
  flag: { width: 27.3, height: 20.8 },
  countryText: { flex: 1, fontSize: 17, lineHeight: 22, letterSpacing: -0.42, color: colors.ink, marginLeft: 12.9 },
  phoneField: { marginTop: 28, marginHorizontal: 18.9 },
  phoneInput: { fontSize: 18.2, letterSpacing: 0.7, marginLeft: -0.4 },
  footer: { paddingHorizontal: 18.9 },
  ctaText: { fontSize: 18.5, lineHeight: 24, fontWeight: "500", letterSpacing: -0.3 },
});
