"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Send, UserPlus, CheckCircle2, RotateCcw } from "lucide-react";
import type { SupportStatus } from "@yava/shared";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/field";
import { ReasonDialog, ActionButton } from "@/components/ui/reason-dialog";
import { useToast } from "@/components/ui/toast";
import { PRIORITY_LABEL } from "@/components/ui/badge";
import { assignToMeAction, reopenCaseAction, resolveCaseAction, sendSupportMessageAction, setPriorityAction } from "../actions";

export function Composer({ caseId, disabled }: { caseId: string; disabled: boolean }) {
  const [internal, setInternal] = useState(false);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const toast = useToast();

  return (
    <form
      ref={formRef}
      className={`rounded-lg border p-3 space-y-2 ${internal ? "border-yellow bg-yellow-soft/50" : "border-border bg-card"}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("id", caseId);
        fd.set("internal", internal ? "1" : "0");
        start(async () => {
          const res = await sendSupportMessageAction(fd);
          if (res.ok) {
            formRef.current?.reset();
            toast.success(res.message ?? "Enviado.");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <label htmlFor="body" className="sr-only">
        {internal ? "Nota interna" : "Mensaje"}
      </label>
      <Textarea id="body" name="body" required placeholder={internal ? "Nota interna (solo la ve el equipo)…" : "Escribe un mensaje al usuario…"} disabled={disabled} className="min-h-[72px] bg-card" />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 text-[13px]" role="tablist" aria-label="Tipo de mensaje">
          <button type="button" role="tab" aria-selected={!internal} onClick={() => setInternal(false)} className={`px-2.5 h-8 rounded-md ${!internal ? "bg-carbon text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            Responder
          </button>
          <button type="button" role="tab" aria-selected={internal} onClick={() => setInternal(true)} className={`px-2.5 h-8 rounded-md inline-flex items-center gap-1 ${internal ? "bg-carbon text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <Lock className="h-3.5 w-3.5" aria-hidden /> Nota interna
          </button>
        </div>
        <Button type="submit" size="sm" loading={pending} disabled={disabled}>
          <Send className="h-4 w-4" aria-hidden /> {internal ? "Guardar nota" : "Enviar"}
        </Button>
      </div>
    </form>
  );
}

export function CaseActions({ caseId, status, assignedToMe, priority }: { caseId: string; status: SupportStatus; assignedToMe: boolean; priority: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const open = status === "open" || status === "in_progress";
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="priority" className="block text-xs text-muted mb-1">
          Prioridad
        </label>
        <Select
          id="priority"
          defaultValue={priority}
          disabled={pending || !open}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("id", caseId);
            fd.set("priority", e.target.value);
            start(async () => {
              const res = await setPriorityAction(fd);
              if (res.ok) router.refresh();
              else toast.error(res.error);
            });
          }}
        >
          {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        {open && !assignedToMe ? (
          <ActionButton action={assignToMeAction} hidden={{ id: caseId }} variant="secondary" size="md">
            <UserPlus className="h-4 w-4" aria-hidden /> Asignarme el caso
          </ActionButton>
        ) : null}
        {open ? (
          <>
            <ReasonDialog
              variant="primary"
              size="md"
              trigger={<><CheckCircle2 className="h-4 w-4" aria-hidden /> Resolver caso</>}
              title="Resolver caso"
              description="La resolución se envía como último mensaje al usuario y queda en el historial."
              action={resolveCaseAction}
              hidden={{ id: caseId, status: "resolved" }}
              reasonLabel="Resolución"
              reasonPlaceholder="Ej.: Se reembolsó la limonada faltante al método de pago original."
              confirmLabel="Resolver"
            />
            <ReasonDialog variant="outline" size="md" trigger="Cerrar sin resolver" title="Cerrar caso" description="Para casos duplicados o sin respuesta del usuario." action={resolveCaseAction} hidden={{ id: caseId, status: "closed" }} reasonLabel="Motivo de cierre" confirmLabel="Cerrar caso" />
          </>
        ) : (
          <ReasonDialog variant="outline" size="md" trigger={<><RotateCcw className="h-4 w-4" aria-hidden /> Reabrir caso</>} title="Reabrir caso" action={reopenCaseAction} hidden={{ id: caseId }} confirmLabel="Reabrir" />
        )}
      </div>
    </div>
  );
}
