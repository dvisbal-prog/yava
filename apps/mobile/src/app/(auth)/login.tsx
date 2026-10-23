import React, { useEffect, useState } from "react";
import { View, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen, Header, Text, Button, Input, Divider, Logo } from "@/components/ui";
import { signInWithGoogle, signInWithApple, signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";

/** Pantalla 02 · Acceso y registro (celular, Google, Apple y correo+contraseña para pruebas). */
export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string; provider?: string }>();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (params.next) setPendingNext(params.next); }, [params.next, setPendingNext]);

  /** Tras iniciar sesión el AuthGate del layout raíz nos saca de (auth); el layout de cliente consume `next`. */
  function finish() {
    router.replace("/(customer)" as never);
  }

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key); setError(null);
    try {
      const session = await fn();
      if (session === null && key !== "email") return; // el usuario canceló el navegador
      finish();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (params.provider === "google") void run("google", signInWithGoogle);
    if (params.provider === "apple" && Platform.OS === "ios") void run("apple", signInWithApple);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.provider]);

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Escribe un correo válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (mode === "signup" && !name.trim()) { setError("Escribe tu nombre."); return; }
    await run("email", async () => {
      if (mode === "login") return signInWithEmailPassword(email.trim(), password);
      const s = await signUpWithEmailPassword(email.trim(), password, name.trim(), "customer");
      if (!s) Alert.alert("Revisa tu correo", "Te enviamos un enlace para confirmar tu cuenta.");
      return s;
    });
  }

  return (
    <Screen>
      <Header back={router.canGoBack()} onBack={() => (router.canGoBack() ? router.back() : router.replace("/(auth)" as never))} />
      <View style={{ alignItems: "center", marginTop: 8, marginBottom: 20 }}><Logo size={44} /></View>
      <Text variant="display" style={{ textAlign: "center" }}>{mode === "login" ? "Entra a YAVA" : "Crea tu cuenta"}</Text>
      <Text tone="muted" style={{ textAlign: "center", marginTop: 6, marginBottom: 24 }}>{params.next ? "Necesitas una cuenta para continuar." : "Pide comida, mercado y farmacia en minutos."}</Text>

      <Button title="Continuar con celular" icon="phone-portrait-outline" onPress={() => router.push(`/(auth)/phone${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}` as never)} />
      <View style={{ height: 10 }} />
      <Button title="Continuar con Google" icon="logo-google" variant="outline" loading={busy === "google"} onPress={() => run("google", signInWithGoogle)} />
      {Platform.OS === "ios" ? (<><View style={{ height: 10 }} /><Button title="Continuar con Apple" icon="logo-apple" variant="outline" loading={busy === "apple"} onPress={() => run("apple", signInWithApple)} /></>) : null}

      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
        <View style={{ flex: 1 }}><Divider space={0} /></View>
        <Text variant="caption" tone="muted" style={{ marginHorizontal: 12 }}>o con tu correo</Text>
        <View style={{ flex: 1 }}><Divider space={0} /></View>
      </View>

      {mode === "signup" ? <Input label="Nombre" value={name} onChangeText={setName} placeholder="María Pérez" autoCapitalize="words" /> : null}
      <Input label="Correo" value={email} onChangeText={setEmail} placeholder="cliente@yava.app" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} icon="mail-outline" />
      <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry icon="lock-closed-outline" error={error} />
      <Button title={mode === "login" ? "Entrar" : "Crear cuenta"} variant="secondary" loading={busy === "email"} onPress={submitEmail} />
      <Button title={mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"} variant="ghost" onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} style={{ marginTop: 6 }} />
      <Button title="Explorar sin cuenta" variant="ghost" size="sm" onPress={() => router.replace("/(customer)" as never)} />
    </Screen>
  );
}
