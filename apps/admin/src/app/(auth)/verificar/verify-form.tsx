"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function VerifyForm({ email: initialEmail, next, recover }: { email: string; next: string; recover: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(!recover && Boolean(initialEmail));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!email.trim()) return setError("Escribe tu correo.");
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) return setError(/Signups not allowed/i.test(error.message) ? "Este correo no tiene acceso. Pide una invitación." : error.message);
    setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) return setError("El código tiene 6 dígitos.");
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setLoading(false);
    if (error) return setError(/expired|invalid/i.test(error.message) ? "Código inválido o vencido. Pide uno nuevo." : error.message);
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-carbon">Verifica tu acceso</h1>
      {sent ? (
        <>
          <div className="mt-4 flex items-start gap-3 rounded-md bg-blue-soft px-3 py-3 text-[13px] text-blue-dark">
            <MailCheck className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <p>
              Revisa tu correo <strong>{email}</strong>. Puedes abrir el enlace o escribir aquí el código de 6 dígitos.
            </p>
          </div>
          <form onSubmit={verify} className="mt-5 space-y-4" noValidate>
            <Field label="Código de verificación" htmlFor="code">
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                className="text-center text-xl tracking-[0.5em] font-semibold h-12"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
              />
            </Field>
            {error ? (
              <p className="text-sm text-red" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Verificar <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-[13px]">
            <button type="button" onClick={send} className="text-blue hover:underline" disabled={loading}>
              Reenviar código
            </button>
            <Link href="/login" className="text-muted hover:text-carbon">
              Volver
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted mt-1">Te enviaremos un enlace y un código de un solo uso a tu correo de equipo.</p>
          <div className="mt-6 space-y-4">
            <Field label="Correo electrónico" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="laura@ejemplo.com" />
            </Field>
            {error ? (
              <p className="text-sm text-red" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="button" size="lg" className="w-full" onClick={send} loading={loading}>
              Enviar código
            </Button>
          </div>
          <div className="mt-5 text-[13px]">
            <Link href="/login" className="text-muted hover:text-carbon">
              Volver
            </Link>
          </div>
        </>
      )}
      <p className="mt-6 text-xs text-gray-400 text-center">Acceso por invitación</p>
    </div>
  );
}
