import React, { useEffect, useState } from "react";
import { View, Platform, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";
import { signInWithGoogle, signInWithApple } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { useAccess } from "@/store/access";

// Franja de fotos de 02 recortada del PNG (ceviche, hamburguesa, shawarma).
const HERO = require("../../../assets/images/auth-hero.jpg");
const LOGO_HORIZONTAL = require("../../../assets/images/logo-horizontal.png");
const TERMS_URL = "https://yava-panel.vercel.app/legal/terminos";
const PRIVACY_URL = "https://yava-panel.vercel.app/legal/privacidad";

/** Medidas de tanda-01/02-acceso.png (pt). */
const SIDE = 20.3;

type Provider = "google" | "apple";

/**
 * Pantalla 02 · Acceso. Google, Apple (solo iOS) y celular; "Omitir" deja explorar como invitado.
 * El acceso con correo y contraseña (cuentas demo y de revisión) queda detrás de "Entrar con correo", discreto bajo el pie.
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
    <Screen edges={["top", "bottom"]} padded={false} contentStyle={styles.content}>
      <View style={styles.top}>
        <Image source={LOGO_HORIZONTAL} style={styles.logo} contentFit="fill" accessibilityLabel="YAVA" />
        <Pressable onPress={skip} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Omitir</Text>
        </Pressable>
      </View>

      <Text variant="h1" style={styles.title}>Entra a YAVA</Text>
      <Text tone="secondary" style={styles.subtitle}>Tus favoritos, a un paso.</Text>

      <Image source={HERO} style={styles.hero} contentFit="cover" accessibilityIgnoresInvertColors />

      <View style={styles.actions}>
        <SocialButton
          title="Continuar con Google"
          icon={<Image source={designImages.logoGoogle} style={styles.googleLogo} contentFit="contain" />}
          loading={busy === "google"} disabled={busy !== null} onPress={() => run("google", signInWithGoogle)}
        />
        {Platform.OS === "ios" ? (
          <SocialButton
            dark title="Continuar con Apple"
            icon={<Ionicons name="logo-apple" size={25} color={colors.white} style={styles.appleLogo} />}
            loading={busy === "apple"} disabled={busy !== null} onPress={() => run("apple", signInWithApple)}
          />
        ) : null}
      </View>

      <View style={styles.or}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>o</Text>
        <View style={styles.orLine} />
      </View>

      <Pressable
        onPress={() => router.push(`/(auth)/phone${nextQuery}` as never)}
        disabled={busy !== null}
        accessibilityRole="button"
        style={({ pressed }) => [styles.phoneBtn, { backgroundColor: pressed ? colors.blueDark : colors.blue, opacity: busy !== null ? 0.6 : 1 }]}
      >
        <Text style={styles.phoneText}>Continuar con celular</Text>
      </Pressable>
      {error ? <Text variant="bodyS" tone="danger" style={styles.error}>{error}</Text> : null}

      <Text tone="tertiary" style={styles.helper}>Si ya tienes cuenta, iniciaremos sesión.{"\n"}Si eres nuevo, crearemos una para ti.</Text>
      <Text tone="tertiary" style={styles.legal}>
        Al continuar, aceptas los{" "}
        <Text tone="link" onPress={() => openLegal(TERMS_URL)} accessibilityRole="link">Términos</Text>
        {" "}y la{" "}
        <Text tone="link" onPress={() => openLegal(PRIVACY_URL)} accessibilityRole="link">Política de privacidad</Text>.
      </Text>

      <Pressable onPress={() => router.push(`/(auth)/email${nextQuery}` as never)} hitSlop={8} style={styles.emailLink} accessibilityRole="button">
        <Text tone="placeholder" style={styles.emailText}>Entrar con correo</Text>
      </Pressable>
    </Screen>
  );
}

/** Botón social (C15i): ícono en caja de 24 pt + texto, centrados como grupo. */
function SocialButton({ title, icon, onPress, loading, disabled, dark }: {
  title: string; icon: React.ReactNode; onPress: () => void; loading?: boolean; disabled?: boolean; dark?: boolean;
}) {
  const fg = dark ? colors.white : colors.ink;
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
          <View style={styles.socialIcon}>{icon}</View>
          <Text style={[styles.socialText, { color: fg }, dark && styles.socialTextDark]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 16 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 34.6, paddingLeft: 22.2, paddingRight: SIDE },
  logo: { width: 100.2, height: 26.8 },
  skip: { fontSize: 12.6, lineHeight: 18, fontWeight: "400", letterSpacing: -0.2, color: "#003CBB" },
  title: { marginTop: 56.7, marginHorizontal: 22 },
  subtitle: { fontSize: 17, lineHeight: 22, letterSpacing: -0.08, marginTop: 3.7, marginHorizontal: 22 },
  hero: { height: 152, marginTop: 32.3, marginLeft: 18.9, marginRight: 18.9, borderRadius: 15, backgroundColor: colors.surfaceGray },
  actions: { gap: 11.1, marginTop: 39.4, marginHorizontal: SIDE },
  social: { height: 52.6, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  socialLight: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#C9CEDA" },
  socialDark: { backgroundColor: "#121212" },
  socialRow: { flexDirection: "row", alignItems: "center" },
  socialIcon: { width: 26.8, height: 27.7, justifyContent: "center", marginRight: 30.5 },
  googleLogo: { width: 26.8, height: 27.7 },
  appleLogo: { marginTop: -3, marginLeft: -3 },
  socialText: { fontSize: 14.7, lineHeight: 20, fontWeight: "600", letterSpacing: -0.6 },
  socialTextDark: { fontWeight: "500", letterSpacing: -0.4 },
  or: { flexDirection: "row", alignItems: "center", marginTop: 17.5, marginHorizontal: SIDE },
  orLine: { flex: 1, height: 1, backgroundColor: "#D0D4E0" },
  orText: { fontSize: 13, lineHeight: 17, color: colors.textTertiary, marginHorizontal: 15 },
  phoneBtn: { height: 52, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 13.5, marginHorizontal: SIDE },
  phoneText: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: -0.2, color: colors.white },
  error: { marginTop: 10, textAlign: "center", marginHorizontal: SIDE },
  helper: { fontSize: 11.6, lineHeight: 18, letterSpacing: -0.3, textAlign: "center", marginTop: 41.1, marginHorizontal: SIDE },
  legal: { fontSize: 10.2, lineHeight: 15, letterSpacing: -0.37, textAlign: "center", marginTop: 36.2, marginHorizontal: SIDE },
  emailLink: { alignSelf: "center", marginTop: 14, paddingVertical: 4 },
  emailText: { fontSize: 12, lineHeight: 16 },
});
