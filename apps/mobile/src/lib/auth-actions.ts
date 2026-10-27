import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/** Normaliza celular colombiano a E.164 (+57). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+57${digits}`;
  return `+${digits}`;
}

export async function sendPhoneOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone: normalizePhone(phone), token, type: "sms" });
  if (error) throw error;
  return data.session;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUpWithEmailPassword(email: string, password: string, fullName: string, role: "customer" | "merchant" | "courier" = "customer") {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
  if (error) throw error;
  return data.session;
}

export async function signInWithApple() {
  if (Platform.OS !== "ios") throw new Error("Apple solo está disponible en iOS");
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (e) {
    // El usuario cerró la hoja de Apple: no es un error que haya que mostrar.
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return null;
    throw e;
  }
  if (!credential.identityToken) throw new Error("No se recibió el token de Apple");
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken, nonce: rawNonce });
  if (error) throw error;
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
  if (name && data.user) await supabase.from("profiles").update({ full_name: name }).eq("id", data.user.id);
  return data.session;
}

/** Google vía OAuth de Supabase con navegador del sistema y deep link de regreso. */
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== "success") return null;
  const url = new URL(res.url);
  const params = new URLSearchParams(url.hash ? url.hash.substring(1) : url.search);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const code = params.get("code");
  if (code) {
    const { data: s, error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
    return s.session;
  }
  if (access_token && refresh_token) {
    const { data: s, error: e } = await supabase.auth.setSession({ access_token, refresh_token });
    if (e) throw e;
    return s.session;
  }
  return null;
}
