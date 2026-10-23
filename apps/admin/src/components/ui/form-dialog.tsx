"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions";
import { Button, type ButtonVariant, type ButtonSize } from "./button";
import { Dialog } from "./dialog";
import { useToast } from "./toast";

/** Diálogo genérico con formulario → server action (para CRUD simple). */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  children,
  confirmLabel = "Guardar",
  variant = "primary",
  size = "sm",
  dialogSize = "md",
  onSuccess,
}: {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  dialogSize?: "sm" | "md" | "lg";
  onSuccess?: (res: Extract<ActionResult, { ok: true }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description} size={dialogSize}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            start(async () => {
              const res = await action(fd);
              if (res.ok) {
                toast.success(res.message ?? "Guardado.");
                setOpen(false);
                onSuccess?.(res);
                router.refresh();
              } else setError(res.error);
            });
          }}
          className="space-y-4"
        >
          {children}
          {error ? (
            <p className="text-sm text-red" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
