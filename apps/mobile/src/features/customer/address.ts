import type { Address } from "@yava/shared";
import { supabase } from "@/lib/supabase";
import { useLocation } from "@/store/location";
import type { AddressRow } from "./types";

export function toAddress(row: AddressRow): Address {
  return { id: row.id, user_id: row.user_id, label: row.label, line1: row.line1, line2: row.line2, city_id: row.city_id ?? "", instructions: row.instructions, lat: row.lat, lng: row.lng, is_default: row.is_default };
}

/** Marca una dirección como activa en el store de ubicación (snapshot + ciudad). */
export async function activateAddress(row: AddressRow): Promise<void> {
  const loc = useLocation.getState();
  loc.setAddress(toAddress(row));
  if (row.lat != null && row.lng != null) loc.setCoords({ lat: row.lat, lng: row.lng });
  if (row.city_id) {
    const { data } = await supabase.from("cities").select("name").eq("id", row.city_id).maybeSingle();
    const name = (data as { name: string } | null)?.name ?? null;
    useLocation.getState().setCity(row.city_id, name);
  }
}
