"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions";
import { Button, type ButtonVariant, type ButtonSize } from "./button";
import { Dialog } from "./dialog";
import { Field, Textarea } from "./field";
import { useToast } from "./toast";

/**
 * Botón + diálogo con "Motivo" obligatorio para acciones sensibles.
 * `action` es una server action que recibe el FormData del formulario (incluye `reason`).
 * `fields` permite agregar campos extra (p. ej. referencia de pago) y `hidden` valores fijos.
 */
export function ReasonDialog({
  trigger,
  title,
  description,
  action,
  confirmLabel = "Confirmar",
  confirmVariant = "primary",
  variant = "outline",
  size = "sm",
  hidden = {},
  fields,
  reasonLabel = "Motivo",
  reasonPlaceholder = "Explica brevemente la razón (queda en el historial de cambios).",
  successMessage = "Acción registrada.",
  redirectTo,
  disabled,
  className,
}: {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  variant?: ButtonVariant;
  size?: ButtonSize;
  hidden?: Record<string, string | number | undefined | null>;
  fields?: ReactNode;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  successMessage?: string;
  redirectTo?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const reason = String(fd.get("reason") ?? "").trim();
    if (reason.length < 3) {
      setError("Indica un motivo (mínimo 3 caracteres).");
      return;
    }
    setError(null);
    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        toast.success(res.message ?? successMessage);
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)} disabled={disabled} className={className}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <form onSubmit={submit} className="space-y-4">
          {Object.entries(hidden).map(([k, v]) =>
            v === undefined || v === null ? null : <input key={k} type="hidden" name={k} value={String(v)} />,
          )}
          {fields}
          <Field label={reasonLabel} htmlFor="reason" error={error}>
            <Textarea id="reason" name="reason" required minLength={3} placeholder={reasonPlaceholder} autoFocus />
          </Field>
          <p className="text-xs text-muted">Esta acción queda registrada con tu usuario, fecha y motivo.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={confirmVariant} loading={pending}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

/** Botón que ejecuta una server action sin motivo (acciones no sensibles) y refresca. */
export function ActionButton({
  action,
  children,
  variant = "outline",
  size = "sm",
  successMessage,
  hidden = {},
  disabled,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  successMessage?: string;
  hidden?: Record<string, string | number | undefined | null>;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={pending}
      disabled={disabled}
      className={className}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          for (const [k, v] of Object.entries(hidden)) if (v !== undefined && v !== null) fd.set(k, String(v));
          const res = await action(fd);
          if (res.ok) {
            toast.success(res.message ?? successMessage ?? "Listo.");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      {children}
    </Button>
  );
}
