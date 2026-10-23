"use client";

import { useState } from "react";
import { BadgeCheck, Banknote, XCircle } from "lucide-react";
import type { SettlementStatus } from "@yava/shared";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { settlementTransitionAction } from "../../actions";

export function SettlementActions({ id, status, net, payee }: { id: string; status: SettlementStatus; net: string; payee: string }) {
  const [checked, setChecked] = useState(false);
  if (status === "paid" || status === "rejected") return null;
  return (
    <div className="space-y-3">
      <Checkbox label={<span>Revisé el destinatario, la cuenta bancaria y el monto <strong>{net}</strong> para <strong>{payee}</strong>.</span>} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <ReasonDialog
            variant="primary"
            trigger={<><BadgeCheck className="h-4 w-4" aria-hidden /> Aprobar y programar</>}
            title="Aprobar liquidación"
            description="Autoriza el pago para programarlo. La transferencia se hace por fuera del sistema y luego se registra aquí."
            action={settlementTransitionAction}
            hidden={{ id, status: "approved" }}
            confirmLabel="Aprobar"
            disabled={!checked}
          />
        ) : null}
        {status === "approved" ? (
          <ReasonDialog
            variant="primary"
            trigger={<><Banknote className="h-4 w-4" aria-hidden /> Marcar como pagada</>}
            title="Registrar pago de la liquidación"
            description="Ninguna transferencia se ejecuta automáticamente; aquí se registra la decisión con su referencia."
            action={settlementTransitionAction}
            hidden={{ id, status: "paid" }}
            confirmLabel="Marcar pagada"
            disabled={!checked}
            fields={
              <Field label="Referencia de la transferencia" htmlFor="reference" hint="Número de comprobante del banco o billetera.">
                <Input id="reference" name="reference" required minLength={3} placeholder="Ej.: BCOL-20261022-0931" />
              </Field>
            }
          />
        ) : null}
        <ReasonDialog
          variant="outline"
          confirmVariant="danger"
          trigger={<><XCircle className="h-4 w-4" aria-hidden /> Rechazar</>}
          title="Rechazar liquidación"
          description="Los pedidos quedan asociados a esta liquidación rechazada; genera una nueva si corresponde."
          action={settlementTransitionAction}
          hidden={{ id, status: "rejected" }}
          confirmLabel="Rechazar"
        />
      </div>
      {!checked ? <p className="text-xs text-muted">Confirma la revisión para habilitar la aprobación o el pago.</p> : null}
    </div>
  );
}
