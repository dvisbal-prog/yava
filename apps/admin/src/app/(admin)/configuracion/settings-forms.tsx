"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Json } from "@yava/shared";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { useToast } from "@/components/ui/toast";
import { deleteZoneAction, saveCityAction, saveZoneAction, updateSettingsAction } from "./actions";

type SettingsMap = Record<string, Json | undefined>;
const asNum = (v: Json | undefined, d = 0) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || d : d);
const asStr = (v: Json | undefined) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));

export function SettingsForm({ settings }: { settings: SettingsMap }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await updateSettingsAction(fd);
          if (res.ok) {
            toast.success(res.message ?? "Guardado.");
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarifa de servicio por pedido (COP)" htmlFor="service_fee">
          <Input id="service_fee" name="service_fee" type="number" min={0} step={100} defaultValue={asNum(settings.service_fee, 1000)} />
        </Field>
        <Field label="Tarifa base de envíos punto a punto (COP)" htmlFor="shipment_base_fee">
          <Input id="shipment_base_fee" name="shipment_base_fee" type="number" min={0} step={100} defaultValue={asNum(settings.shipment_base_fee, 8000)} />
        </Field>
        <Field label="Comisión por defecto a comercios (%)" htmlFor="default_commission_rate" hint="Se aplica a comercios nuevos; cada comercio puede tener su propia tasa.">
          <Input id="default_commission_rate" name="default_commission_rate" type="number" min={0} max={50} step={0.1} defaultValue={(asNum(settings.default_commission_rate, 0.1) * 100).toFixed(1)} />
        </Field>
        <Field label="Retiro mínimo de repartidores (COP)" htmlFor="min_withdrawal">
          <Input id="min_withdrawal" name="min_withdrawal" type="number" min={0} step={1000} defaultValue={asNum(settings.min_withdrawal, 50000)} />
        </Field>
        <Field label="Fotos máximas por producto" htmlFor="max_product_photos">
          <Input id="max_product_photos" name="max_product_photos" type="number" min={1} max={10} defaultValue={asNum(settings.max_product_photos, 5)} />
        </Field>
        <Field label="Teléfono de soporte" htmlFor="support_phone" hint="Se muestra a comercios y repartidores.">
          <Input id="support_phone" name="support_phone" type="tel" defaultValue={asStr(settings.support_phone)} />
        </Field>
      </div>
      <Checkbox name="cash_enabled" label="Permitir pago en efectivo" defaultChecked={settings.cash_enabled === true || settings.cash_enabled === "true"} />
      <Field label="Motivo del cambio" htmlFor="settings_reason" hint="Obligatorio. Queda en el historial de cambios con tu usuario y fecha.">
        <Textarea id="settings_reason" name="reason" required minLength={3} placeholder="Ej.: Ajuste de tarifa de servicio por inflación." className="min-h-[64px]" />
      </Field>
      {error ? (
        <p className="text-sm text-red" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted">Los cambios aplican a nuevos pedidos.</p>
        <div className="flex gap-2">
          <Button type="reset" variant="ghost">
            Descartar
          </Button>
          <Button type="submit" loading={pending}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
}

export interface CityRow {
  id: string;
  name: string;
  department: string | null;
  center_lat: number | null;
  center_lng: number | null;
  active: boolean;
}
export interface ZoneRow {
  id: string;
  city_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  base_delivery_fee: number;
  active: boolean;
}

export function CityDialog({ city }: { city?: CityRow }) {
  return (
    <FormDialog
      trigger={city ? <><Pencil className="h-3.5 w-3.5" aria-hidden /> Editar</> : <><Plus className="h-4 w-4" aria-hidden /> Agregar ciudad</>}
      variant={city ? "ghost" : "outline"}
      title={city ? `Editar ${city.name}` : "Agregar ciudad"}
      action={saveCityAction}
    >
      {city ? <input type="hidden" name="id" value={city.id} /> : null}
      <Field label="Nombre" htmlFor="city_name">
        <Input id="city_name" name="name" required defaultValue={city?.name ?? ""} />
      </Field>
      <Field label="Departamento" htmlFor="department">
        <Input id="department" name="department" defaultValue={city?.department ?? "Atlántico"} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitud del centro" htmlFor="city_lat">
          <Input id="city_lat" name="center_lat" type="number" step="any" defaultValue={city?.center_lat ?? ""} />
        </Field>
        <Field label="Longitud del centro" htmlFor="city_lng">
          <Input id="city_lng" name="center_lng" type="number" step="any" defaultValue={city?.center_lng ?? ""} />
        </Field>
      </div>
      <Checkbox name="active" label="Ciudad activa (recibe pedidos)" defaultChecked={city?.active ?? true} />
    </FormDialog>
  );
}

export function ZoneDialog({ zone, cities }: { zone?: ZoneRow; cities: { id: string; name: string }[] }) {
  return (
    <FormDialog
      trigger={zone ? <><Pencil className="h-3.5 w-3.5" aria-hidden /> Editar</> : <><Plus className="h-4 w-4" aria-hidden /> Agregar zona</>}
      variant={zone ? "ghost" : "outline"}
      title={zone ? `Editar zona ${zone.name}` : "Agregar zona de cobertura"}
      description="Radio alrededor de un centro. La tarifa base se usa como referencia de envío."
      action={saveZoneAction}
    >
      {zone ? <input type="hidden" name="id" value={zone.id} /> : null}
      <Field label="Ciudad" htmlFor="zone_city">
        <Select id="zone_city" name="city_id" defaultValue={zone?.city_id ?? cities[0]?.id ?? ""} required>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nombre de la zona" htmlFor="zone_name">
        <Input id="zone_name" name="name" required defaultValue={zone?.name ?? ""} placeholder="Ej.: Puerto Colombia centro" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitud" htmlFor="zone_lat">
          <Input id="zone_lat" name="center_lat" type="number" step="any" required defaultValue={zone?.center_lat ?? ""} />
        </Field>
        <Field label="Longitud" htmlFor="zone_lng">
          <Input id="zone_lng" name="center_lng" type="number" step="any" required defaultValue={zone?.center_lng ?? ""} />
        </Field>
        <Field label="Radio (km)" htmlFor="zone_radius">
          <Input id="zone_radius" name="radius_km" type="number" step="0.5" min={0.5} required defaultValue={zone?.radius_km ?? 6} />
        </Field>
        <Field label="Tarifa base de envío (COP)" htmlFor="zone_fee">
          <Input id="zone_fee" name="base_delivery_fee" type="number" step={100} min={0} required defaultValue={zone?.base_delivery_fee ?? 3000} />
        </Field>
      </div>
      <Checkbox name="active" label="Zona activa" defaultChecked={zone?.active ?? true} />
    </FormDialog>
  );
}

export function DeleteZoneButton({ id }: { id: string }) {
  return <ReasonDialog size="sm" variant="ghost" confirmVariant="danger" trigger={<Trash2 className="h-4 w-4 text-gray-500" aria-label="Eliminar zona" />} title="Eliminar zona" action={deleteZoneAction} hidden={{ id }} confirmLabel="Eliminar" />;
}
