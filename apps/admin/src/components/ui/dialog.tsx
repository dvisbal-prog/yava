"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <dialog
      ref={ref}
      className={cn(
        "m-auto w-[calc(100%-32px)] rounded-lg border border-border bg-card p-0 text-carbon shadow-xl backdrop:bg-black/40",
        width,
      )}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description ? <p className="text-[13px] text-muted mt-1">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 -mr-2 -mt-1 rounded-md text-gray-500 hover:bg-gray-100 flex items-center justify-center" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="px-5 pb-5 flex justify-end gap-2">{footer}</div> : null}
    </dialog>
  );
}
