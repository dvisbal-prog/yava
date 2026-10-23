"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; kind: "success" | "error"; message: string };
type ToastApi = { success: (m: string) => void; error: (m: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const api = useMemo<ToastApi>(() => ({ success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-32px))]" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "yv-fade-in flex items-start gap-2 rounded-md border bg-card px-3 py-2.5 text-sm shadow-lg",
              t.kind === "success" ? "border-green/30" : "border-red/30",
            )}
          >
            {t.kind === "success" ? <CheckCircle2 className="h-4 w-4 text-green mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red mt-0.5 shrink-0" />}
            <span className="flex-1 text-carbon">{t.message}</span>
            <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-gray-400 hover:text-carbon" aria-label="Cerrar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) return { success: () => undefined, error: () => undefined };
  return ctx;
}
