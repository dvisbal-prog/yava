"use client";

import { Plus, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { createExpenseAction, deleteExpenseAction } from "../actions";

const CATEGORIES = ["marketing", "soporte", "operacion", "tecnologia", "administrativo", "otro"];
export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  marketing: "Marketing",
  soporte: "Soporte",
  operacion: "Operación",
  tecnologia: "Tecnología",
  administrativo: "Administrativo",
  otro: "Otro",
};

export function NewExpenseDialog({ cities, defaultDate }: { cities: { id: string; name: string }[]; defaultDate: string }) {
  return (
    <FormDialog trigger={<><Plus className="h-4 w-4" aria-hidden /> Registrar gasto</>} title="Registrar gasto operativo" description="Los gastos restan al resultado operativo estimado del período." action={createExpenseAction} confirmLabel="Registrar">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="Ciudad" htmlFor="city_id">
          <Select id="city_id" name="city_id" defaultValue="">
            <option value="">General (todas)</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Categoría" htmlFor="category">
        <Select id="category" name="category" defaultValue="operacion" required>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Descripción" htmlFor="description">
        <Input id="description" name="description" placeholder="Ej.: Pauta en redes" />
      </Field>
      <Field label="Monto (COP)" htmlFor="amount">
        <Input id="amount" name="amount" type="number" min={1} step={1} required placeholder="150000" />
      </Field>
    </FormDialog>
  );
}

export function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <ReasonDialog size="sm" variant="ghost" confirmVariant="danger" trigger={<Trash2 className="h-4 w-4 text-gray-500" aria-label="Eliminar gasto" />} title="Eliminar gasto" action={deleteExpenseAction} hidden={{ id }} confirmLabel="Eliminar" />
  );
}
