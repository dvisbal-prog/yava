import React, { useEffect, useState } from "react";
import { View, Platform, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Screen, Text, Button, Logo } from "@/components/ui";
import { signInWithGoogle, signInWithApple } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { useAccess } from "@/store/access";

const HERO = require("../../../assets/images/auth-hero.jpg");
const TERMS_URL = "https://yava-panel.vercel.app/legal/terminos";
const PRIVACY_URL = "https://yava-panel.vercel.app/legal/privacidad";

type Provider = "google" | "apple";

/**
 * Pantalla 02 · Acceso. Google, Apple (solo iOS) y celular; "Omitir" deja explorar como invitado.
 * El acceso con correo y contraseña (cuentas demo y de revisión) queda detrás de "Entrar con correo".
 */
export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  const markSeen = useAccess((s) => s.markSeen);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (params.next) setPendingNext(params.next); }, [params.next, setPendingNext]);

  const nextQuery = params.next ? `?next=${encodeURIComponent(params.next)}` : "";

  function skip() {
    markSeen();
    setPendingNext(null);
    // Si llegó desde una acción protegida, vuelve a donde estaba; si no, a explorar el inicio.
    if (params.next && router.canGoBack()) router.back();
    else router.replace("/(customer)" as never);
  }

  async function run(key: Provider, fn: () => Promise<unknown>) {
    setBusy(key); setError(null);
    try {
      const session = await fn();
      if (!session) return; // el usuario cerró el navegador o canceló
      markSeen();
      // El AuthGate del layout raíz también nos saca de (auth); el layout de cliente consume `next`.
      router.replace("/(customer)" as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  function openLegal(url: string) {
    WebBrowser.openBrowserAsync(url).catch(() => {});
  }

  return (
    <Screen edges={["top", "bottom"]} contentStyle={styles.content}>
      <View style={styles.top}>
        <Logo size={26} />
        <Pressable onPress={skip} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Omitir</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Entra a YAVA</Text>
      <Text tone="muted" style={styles.subtitle}>Tus favoritos, a un paso.</Text>

      <Image source={HERO} style={styles.hero} contentFit="cover" accessibilityIgnoresInvertColors />

      <View style={styles.actions}>
        <SocialButton title="Continuar con Google" icon={<GoogleG size={18} />} loading={busy === "google"} disabled={busy !== null} onPress={() => run("google", signInWithGoogle)} />
        {Platform.OS === "ios" ? (
          <SocialButton dark title="Continuar con Apple" icon={<Ionicons name="logo-apple" size={18} color={colors.white} />} loading={busy === "apple"} disabled={busy !== null} onPress={() => run("apple", signInWithApple)} />
        ) : null}
      </View>

      <View style={styles.or}>
        <View style={styles.orLine} />
        <Text variant="caption" tone="muted" style={{ marginHorizontal: 14 }}>o</Text>
        <View style={styles.orLine} />
      </View>

      <Button title="Continuar con celular" disabled={busy !== null} onPress={() => router.push(`/(auth)/phone${nextQuery}` as never)} />
      {error ? <Text variant="caption" tone="danger" style={{ marginTop: 10, textAlign: "center" }}>{error}</Text> : null}

      <Text tone="muted" style={styles.helper}>Si ya tienes cuenta, iniciaremos sesión.{"\n"}Si eres nuevo, crearemos una para ti.</Text>
      <Text variant="caption" tone="muted" style={styles.legal}>
        Al continuar, aceptas los{" "}
        <Text variant="caption" tone="primary" onPress={() => openLegal(TERMS_URL)} accessibilityRole="link">Términos</Text>
        {" "}y la{" "}
        <Text variant="caption" tone="primary" onPress={() => openLegal(PRIVACY_URL)} accessibilityRole="link">Política de privacidad</Text>.
      </Text>

      <Pressable onPress={() => router.push(`/(auth)/email${nextQuery}` as never)} hitSlop={8} style={styles.emailLink} accessibilityRole="button">
        <Text variant="caption" tone="subtle">Entrar con correo</Text>
      </Pressable>
    </Screen>
  );
}

function SocialButton({ title, icon, onPress, loading, disabled, dark }: {
  title: string; icon: React.ReactNode; onPress: () => void; loading?: boolean; disabled?: boolean; dark?: boolean;
}) {
  const fg = dark ? colors.white : colors.carbon;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.social, dark ? styles.socialDark : styles.socialLight, { opacity: disabled && !loading ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.socialRow}>
          {icon}
          <Text style={[styles.socialText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** "G" de Google a cuatro colores. */
function GoogleG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FBBC05" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <Path fill="#EA4335" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <Path fill="#34A853" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <Path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  skip: { fontSize: 15, lineHeight: 20, fontWeight: "500", color: colors.blue },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "600", color: colors.carbon, marginTop: 48 },
  subtitle: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  hero: { width: "100%", aspectRatio: 768 / 327, borderRadius: radius.lg, marginTop: 28, backgroundColor: colors.gray100 },
  actions: { gap: 12, marginTop: 32 },
  social: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  socialLight: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray300 },
  socialDark: { backgroundColor: colors.black },
  socialRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  socialText: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  or: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.gray200 },
  helper: { fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 32 },
  legal: { textAlign: "center", marginTop: 20 },
  emailLink: { alignSelf: "center", marginTop: 16, paddingVertical: 4 },
});
