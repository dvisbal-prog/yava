"use client";

import { Calculator } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field, Input } from "@/components/ui/field";
import { generateSettlementsAction } from "../actions";

export function GenerateSettlementsDialog({ defaultStart, defaultEnd }: { defaultStart: string; defaultEnd: string }) {
  return (
    <FormDialog
      trigger={<><Calculator className="h-4 w-4" aria-hidden /> Generar liquidaciones</>}
      title="Generar liquidaciones del período"
      description="Agrupa los pedidos entregados sin liquidar por comercio y repartidor, en estado Pendiente. No ejecuta pagos."
      action={generateSettlementsAction}
      confirmLabel="Generar"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde" htmlFor="start">
          <Input id="start" name="start" type="date" defaultValue={defaultStart} required />
        </Field>
        <Field label="Hasta" htmlFor="end">
          <Input id="end" name="end" type="date" defaultValue={defaultEnd} required />
        </Field>
      </div>
      <p className="text-xs text-muted">Los pedidos que ya pertenecen a una liquidación no se incluyen de nuevo.</p>
    </FormDialog>
  );
}
