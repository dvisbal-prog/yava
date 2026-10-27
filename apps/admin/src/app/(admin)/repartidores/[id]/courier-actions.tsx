"use client";

import { Check, ShieldOff, X } from "lucide-react";
import type { CourierStatus } from "@yava/shared";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { Field, Input } from "@/components/ui/field";
import { reviewCourierDocumentAction, setCourierStatusAction, withdrawalTransitionAction } from "../actions";

/** `approveBlocker`: motivo por el que aún no se puede aprobar (documentos sin aprobar); deshabilita "Aprobar". */
export function CourierStatusActions({ id, status, approveBlocker = null }: { id: string; status: CourierStatus; approveBlocker?: string | null }) {
  const reviewing = status === "pending" || status === "under_review";
  const blocked = reviewing && !!approveBlocker;
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "active" ? (
        <span title={blocked ? (approveBlocker ?? undefined) : undefined} className="inline-flex">
          <ReasonDialog
            variant="primary"
            trigger={<><Check className="h-4 w-4" aria-hidden /> {reviewing ? "Aprobar" : "Reactivar"}</>}
            title={reviewing ? "Aprobar repartidor" : "Reactivar repartidor"}
            description="Podrá conectarse y tomar pedidos."
            action={setCourierStatusAction}
            hidden={{ id, status: "active" }}
            confirmLabel={reviewing ? "Aprobar" : "Reactivar"}
            disabled={blocked}
          />
        </span>
      ) : null}
      {reviewing ? (
        <ReasonDialog
          variant="outline"
          confirmVariant="danger"
          trigger={<><X className="h-4 w-4" aria-hidden /> Devolver a pendiente</>}
          title="Devolver solicitud a pendiente"
          description="El repartidor deberá completar o corregir su documentación."
          action={setCourierStatusAction}
          hidden={{ id, status: "pending" }}
          confirmLabel="Devolver"
        />
      ) : null}
      {status !== "suspended" ? (
        <ReasonDialog
          variant="danger"
          confirmVariant="danger"
          trigger={<><ShieldOff className="h-4 w-4" aria-hidden /> Suspender</>}
          title="Suspender repartidor"
          description="No podrá conectarse ni tomar pedidos hasta que el equipo lo reactive."
          action={setCourierStatusAction}
          hidden={{ id, status: "suspended" }}
          confirmLabel="Suspender"
        />
      ) : null}
    </div>
  );
}

export function CourierDocumentReview({ docId, courierId }: { docId: string; courierId: string }) {
  return (
    <div className="flex gap-1.5">
      <ReasonDialog size="sm" variant="secondary" trigger="Aprobar" title="Aprobar documento" action={reviewCourierDocumentAction} hidden={{ doc_id: docId, courier_id: courierId, status: "approved" }} reasonLabel="Nota de revisión" reasonPlaceholder="Ej.: Documento legible y vigente." confirmLabel="Aprobar" />
      <ReasonDialog size="sm" variant="outline" confirmVariant="danger" trigger="Rechazar" title="Rechazar documento" action={reviewCourierDocumentAction} hidden={{ doc_id: docId, courier_id: courierId, status: "rejected" }} reasonLabel="Motivo del rechazo" reasonPlaceholder="Ej.: El SOAT está vencido." confirmLabel="Rechazar" />
    </div>
  );
}

export function WithdrawalActions({ id, courierId, status }: { id: string; courierId: string; status: string }) {
  if (status === "paid" || status === "rejected") return null;
  return (
    <div className="flex gap-1.5 justify-end">
      {status === "pending" ? (
        <ReasonDialog size="sm" variant="secondary" trigger="Aprobar" title="Aprobar retiro" description="Se autoriza el pago. La transferencia se hace por fuera y se registra después." action={withdrawalTransitionAction} hidden={{ id, courier_id: courierId, status: "approved" }} confirmLabel="Aprobar" />
      ) : null}
      {status === "approved" ? (
        <ReasonDialog
          size="sm"
          variant="primary"
          trigger="Marcar pagado"
          title="Registrar pago del retiro"
          description="Ninguna transferencia se ejecuta automáticamente; aquí se registra la decisión y su referencia."
          action={withdrawalTransitionAction}
          hidden={{ id, courier_id: courierId, status: "paid" }}
          confirmLabel="Marcar pagado"
          fields={
            <Field label="Referencia de la transferencia" htmlFor="reference">
              <Input id="reference" name="reference" required minLength={3} placeholder="Ej.: Nequi 83921-A" />
            </Field>
          }
        />
      ) : null}
      <ReasonDialog size="sm" variant="outline" confirmVariant="danger" trigger="Rechazar" title="Rechazar retiro" description="El saldo vuelve al repartidor." action={withdrawalTransitionAction} hidden={{ id, courier_id: courierId, status: "rejected" }} confirmLabel="Rechazar" />
    </div>
  );
}
