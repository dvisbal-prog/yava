import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Screen, Header, Text, Button, Input } from "@/components/ui";
import { signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/auth-actions";
import { errorMessage } from "@/lib/errors";
import { useNavIntent } from "@/features/customer/stores";
import { useAccess } from "@/store/access";

/** Acceso con correo y contraseña (cuentas demo y de revisión). Se llega desde "Entrar con correo" en 02. */
export default function EmailLogin() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const setPendingNext = useNavIntent((s) => s.setPendingNext);
  const markSeen = useAccess((s) => s.markSeen);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => { if (params.next) setPendingNext(params.next); }, [params.next, setPendingNext]);

  async function submit() {
    setError(null); setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Escribe un correo válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (mode === "signup" && !name.trim()) { setError("Escribe tu nombre."); return; }
    setBusy(true);
    try {
      const session = mode === "login"
        ? await signInWithEmailPassword(email.trim(), password)
        : await signUpWithEmailPassword(email.trim(), password, name.trim(), "customer");
      if (!session) {
        // Registro que requiere confirmar el correo: lo decimos en pantalla (Alert no existe en web).
        setInfo(`Te enviamos un enlace a ${email.trim()} para confirmar tu cuenta. Ábrelo y luego entra con tu correo y contraseña.`);
        setMode("login");
        setPassword("");
        return;
      }
      markSeen();
      // El AuthGate del layout raíz también nos saca de (auth); el layout de cliente consume `next`.
      router.replace("/(customer)" as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError(null); setInfo(null);
  }

  return (
    <Screen>
      <Header back onBack={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login" as never))} />
      <Text variant="title" style={{ marginTop: 8 }}>{mode === "login" ? "Entrar con correo" : "Crea tu cuenta"}</Text>
      <Text tone="muted" style={{ marginTop: 6, marginBottom: 24 }}>
        {mode === "login" ? "Usa el correo y la contraseña de tu cuenta YAVA." : "Te enviaremos un enlace para confirmar tu correo."}
      </Text>

      {info ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.blueSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 }}>
          <Ionicons name="mail-outline" size={18} color={colors.blue} style={{ marginRight: 10, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Revisa tu correo</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{info}</Text>
          </View>
        </View>
      ) : null}

      {mode === "signup" ? <Input label="Nombre" value={name} onChangeText={setName} placeholder="María Pérez" autoCapitalize="words" textContentType="name" /> : null}
      <Input label="Correo" value={email} onChangeText={setEmail} placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" icon="mail-outline" />
      <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry textContentType={mode === "login" ? "password" : "newPassword"} icon="lock-closed-outline" error={error} onSubmitEditing={submit} returnKeyType="go" />
      <Button title={mode === "login" ? "Entrar" : "Crear cuenta"} loading={busy} onPress={submit} />
      <Button title={mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"} variant="ghost" onPress={toggleMode} style={{ marginTop: 6 }} />
    </Screen>
  );
}
