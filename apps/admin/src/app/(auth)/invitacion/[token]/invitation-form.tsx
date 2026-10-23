"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Note } from "@/components/ui/card";

/**
 * Acepta una invitación. La invitación solo la puede leer el owner (RLS), así que el invitado
 * escribe el correo con el que fue invitado y crea (o usa) su contraseña; luego `admin_accept_invitation`
 * valida token + correo en el servidor.
 */
export function InvitationForm({ token, sessionEmail }: { token: string; sessionEmail: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState(sessionEmail ?? "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function accept() {
    const { error } = await supabase.rpc("admin_accept_invitation", { p_token: token });
    if (error) throw new Error(error.message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!sessionEmail) {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        // 1) Intentar ingresar; 2) si no existe, crear la cuenta con ese correo.
        const signIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signIn.error) {
          const signUp = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: name.trim() || undefined, role: "admin" } },
          });
          if (signUp.error) throw new Error(signUp.error.message);
          if (!signUp.data.session) {
            setNeedsConfirm(true);
            return;
          }
        }
      }
      await accept();
      router.replace("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo aceptar la invitación.";
      setError(
        /otro correo/i.test(msg)
          ? "La invitación es para otro correo."
          : /inválida o vencida/i.test(msg)
            ? "Invitación inválida o vencida. Pide una nueva al owner."
            : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div>
        <h1 className="text-xl font-bold text-carbon">Confirma tu correo</h1>
        <p className="text-sm text-muted mt-2">
          Te enviamos un enlace a <strong>{email}</strong>. Al confirmarlo, vuelve a abrir este enlace de invitación para activar tu acceso.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-carbon">Invitación al equipo</h1>
      <p className="text-sm text-muted mt-1">
        {sessionEmail ? (
          <>
            Vas a activar el acceso administrativo para <strong>{sessionEmail}</strong>.
          </>
        ) : (
          "Crea tu contraseña con el correo al que llegó la invitación."
        )}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {!sessionEmail ? (
          <>
            <Field label="Correo electrónico" htmlFor="email" hint="Debe ser el mismo correo invitado.">
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Nombre" htmlFor="name">
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </Field>
            <Field label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres.">
              <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </>
        ) : null}
        {error ? (
          <p className="text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Aceptar invitación <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>
      <Note className="mt-5">Acceso por invitación. Si el enlace venció, pide al owner que genere uno nuevo desde Equipo.</Note>
    </div>
  );
}
