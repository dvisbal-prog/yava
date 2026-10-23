"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function translate(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(msg)) return "Confirma tu correo antes de ingresar.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Espera un momento.";
  if (/Signups not allowed/i.test(msg)) return "Este correo no tiene acceso. Pide una invitación.";
  return msg;
}

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState<"password" | "otp" | null>(null);

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("password");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(null);
    if (error) return setError(translate(error.message));
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function withMagicLink() {
    if (!email.trim()) return setError("Escribe tu correo para enviarte el enlace.");
    setError(null);
    setLoading("otp");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(null);
    if (error) return setError(translate(error.message));
    router.push(`/verificar?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(next)}`);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-carbon">Acceso administrativo</h1>
      <p className="text-sm text-muted mt-1">Ingresa con tu cuenta de equipo.</p>

      <form onSubmit={withPassword} className="mt-6 space-y-4" noValidate>
        <Field label="Correo electrónico" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="laura@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? (
          <p className="text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={loading === "password"}>
          Continuar <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <p className="relative text-center text-xs text-gray-400 bg-card inline-block left-1/2 -translate-x-1/2 px-2">o</p>
      </div>

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={withMagicLink} loading={loading === "otp"}>
        <Mail className="h-4 w-4" aria-hidden /> Enviar enlace mágico
      </Button>

      <div className="mt-6 flex items-center justify-between text-[13px]">
        <span className="text-muted">Acceso por invitación</span>
        <Link href={`/verificar?email=${encodeURIComponent(email)}&recover=1`} className="text-blue hover:underline">
          Recuperar acceso
        </Link>
      </div>
    </div>
  );
}
