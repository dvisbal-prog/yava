"use client";

import { ORDER_STATUS_LABEL, type OrderStatus } from "@yava/shared";
import { Ban, RefreshCw, Wand2 } from "lucide-react";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { Field, Select } from "@/components/ui/field";
import { cancelOrderAction, forceStatusAction, reassignCourierAction } from "../actions";

const FORCEABLE: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way", "delivered", "cancelled"];

export function OrderActions({ id, status, hasCourier }: { id: string; status: OrderStatus; hasCourier: boolean }) {
  const finished = status === "delivered" || status === "cancelled";
  return (
    <div className="flex flex-wrap gap-2">
      <ReasonDialog
        trigger={
          <>
            <RefreshCw className="h-4 w-4" aria-hidden /> Reasignar repartidor
          </>
        }
        title="Liberar repartidor y reasignar"
        description="El pedido vuelve a quedar disponible para otros repartidores y conserva su estado de preparación. El actual deja de verlo. El motivo queda en la línea de tiempo."
        action={reassignCourierAction}
        hidden={{ id }}
        confirmLabel="Liberar y reasignar"
        disabled={finished || !hasCourier}
      />
      <ReasonDialog
        trigger={
          <>
            <Wand2 className="h-4 w-4" aria-hidden /> Forzar estado
          </>
        }
        title="Forzar estado del pedido"
        description="Úsalo solo para corregir inconsistencias. El motivo queda en la línea de tiempo y en auditoría. Elegir Cancelado aplica la cancelación completa."
        action={forceStatusAction}
        hidden={{ id }}
        confirmLabel="Cambiar estado"
        disabled={finished}
        fields={
          <Field label="Nuevo estado" htmlFor="status">
            <Select id="status" name="status" defaultValue={status} required>
              {FORCEABLE.map((s) => (
                <option key={s} value={s} disabled={s === status}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        }
      />
      <ReasonDialog
        trigger={
          <>
            <Ban className="h-4 w-4" aria-hidden /> Cancelar pedido
          </>
        }
        variant="danger"
        confirmVariant="danger"
        title="Cancelar pedido"
        description="Se notifica al cliente con el motivo. Si el pago estaba aprobado, queda marcado para reembolso."
        action={cancelOrderAction}
        hidden={{ id }}
        confirmLabel="Cancelar pedido"
        disabled={finished}
      />
    </div>
  );
}
