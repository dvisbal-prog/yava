"use client";

import { Check, Pause, Percent, Play, ShieldOff, X } from "lucide-react";
import type { MerchantStatus } from "@yava/shared";
import { ReasonDialog, ActionButton } from "@/components/ui/reason-dialog";
import { Field, Input } from "@/components/ui/field";
import { reviewMerchantDocumentAction, setMerchantStatusAction, toggleProductAction, updateCommissionAction } from "../actions";

export function MerchantStatusActions({ id, status }: { id: string; status: MerchantStatus }) {
  const reviewing = status === "pending" || status === "under_review";
  return (
    <div className="flex flex-wrap gap-2">
      {reviewing || status === "paused" || status === "suspended" || status === "rejected" ? (
        <ReasonDialog
          variant="primary"
          trigger={<><Check className="h-4 w-4" aria-hidden /> {reviewing ? "Aprobar" : "Activar"}</>}
          title={reviewing ? "Aprobar comercio" : "Reactivar comercio"}
          description="El comercio podrá recibir pedidos. Se le notifica el cambio."
          action={setMerchantStatusAction}
          hidden={{ id, status: "active" }}
          confirmLabel={reviewing ? "Aprobar" : "Activar"}
        />
      ) : null}
      {reviewing ? (
        <ReasonDialog
          variant="danger"
          confirmVariant="danger"
          trigger={<><X className="h-4 w-4" aria-hidden /> Rechazar</>}
          title="Rechazar solicitud"
          description="El comercio verá el motivo del rechazo y podrá corregir su solicitud."
          action={setMerchantStatusAction}
          hidden={{ id, status: "rejected" }}
          confirmLabel="Rechazar"
        />
      ) : null}
      {status === "active" ? (
        <>
          <ReasonDialog
            trigger={<><Pause className="h-4 w-4" aria-hidden /> Pausar</>}
            title="Pausar comercio"
            description="Deja de aparecer para clientes temporalmente. Sus pedidos activos continúan."
            action={setMerchantStatusAction}
            hidden={{ id, status: "paused" }}
            confirmLabel="Pausar"
          />
          <ReasonDialog
            variant="danger"
            confirmVariant="danger"
            trigger={<><ShieldOff className="h-4 w-4" aria-hidden /> Suspender</>}
            title="Suspender comercio"
            description="Suspensión por incumplimiento. Requiere revisión del equipo para reactivar."
            action={setMerchantStatusAction}
            hidden={{ id, status: "suspended" }}
            confirmLabel="Suspender"
          />
        </>
      ) : null}
    </div>
  );
}

export function CommissionDialog({ id, currentRate }: { id: string; currentRate: number }) {
  return (
    <ReasonDialog
      trigger={<><Percent className="h-4 w-4" aria-hidden /> Editar comisión</>}
      title="Editar comisión del comercio"
      description="Aplica a los nuevos pedidos. Los pedidos existentes conservan su comisión."
      action={updateCommissionAction}
      hidden={{ id }}
      confirmLabel="Guardar comisión"
      fields={
        <Field label="Comisión (%)" htmlFor="commission_pct">
          <Input id="commission_pct" name="commission_pct" type="number" step="0.1" min={0} max={50} defaultValue={(currentRate * 100).toFixed(1)} required />
        </Field>
      }
    />
  );
}

export function DocumentReview({ docId, merchantId }: { docId: string; merchantId: string }) {
  return (
    <div className="flex gap-1.5">
      <ReasonDialog
        size="sm"
        variant="secondary"
        trigger="Aprobar"
        title="Aprobar documento"
        action={reviewMerchantDocumentAction}
        hidden={{ doc_id: docId, merchant_id: merchantId, status: "approved" }}
        reasonLabel="Nota de revisión"
        reasonPlaceholder="Ej.: Documento legible y vigente."
        confirmLabel="Aprobar"
      />
      <ReasonDialog
        size="sm"
        variant="outline"
        confirmVariant="danger"
        trigger="Rechazar"
        title="Rechazar documento"
        action={reviewMerchantDocumentAction}
        hidden={{ doc_id: docId, merchant_id: merchantId, status: "rejected" }}
        reasonLabel="Motivo del rechazo"
        reasonPlaceholder="Ej.: Imagen borrosa; sube una foto nítida del documento completo."
        confirmLabel="Rechazar"
      />
    </div>
  );
}

export function ProductToggle({ productId, merchantId, status }: { productId: string; merchantId: string; status: string }) {
  if (status === "draft") return null;
  const toPause = status === "published";
  return (
    <ActionButton action={toggleProductAction} hidden={{ product_id: productId, merchant_id: merchantId, status: toPause ? "paused" : "published" }} variant="ghost" size="sm">
      {toPause ? <><Pause className="h-3.5 w-3.5" aria-hidden /> Pausar</> : <><Play className="h-3.5 w-3.5" aria-hidden /> Activar</>}
    </ActionButton>
  );
}
