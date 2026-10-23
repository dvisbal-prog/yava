"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@yava/shared";
import { actionContext, type AdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fail, num, requireReason, str, type ActionResult } from "@/lib/actions";

async function ownerCtx(): Promise<{ ctx: AdminContext } | { error: string }> {
  const auth = await actionContext();
  if ("error" in auth) return { error: auth.error };
  if (auth.ctx.role !== "owner") return { error: "Solo el owner edita la configuración." };
  return { ctx: auth.ctx };
}

const SETTING_KEYS = ["service_fee", "shipment_base_fee", "default_commission_rate", "min_withdrawal", "max_product_photos", "cash_enabled", "support_phone"] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

function parseSetting(key: SettingKey, raw: string): { value: NonNullable<Json> } | { error: string } {
  switch (key) {
    case "service_fee":
    case "shipment_base_fee":
    case "min_withdrawal":
    case "max_product_photos": {
      const n = Number(raw.replace(/\./g, ""));
      if (!Number.isInteger(n) || n < 0) return { error: "Debe ser un número entero mayor o igual a cero." };
      return { value: n };
    }
    case "default_commission_rate": {
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 50) return { error: "La comisión debe estar entre 0 % y 50 %." };
      return { value: Math.round(n * 100) / 10000 };
    }
    case "cash_enabled":
      return { value: raw === "true" || raw === "on" || raw === "1" };
    case "support_phone":
      return raw.trim().length >= 7 ? { value: raw.trim() } : { error: "Teléfono no válido." };
  }
}

export async function updateSettingsAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const reason = requireReason(fd.get("reason"));
  if (!reason) return { ok: false, error: "Indica un motivo." };
  const supabase = await createClient();
  const { data: current } = await supabase.from("platform_settings").select("key,value").in("key", [...SETTING_KEYS]);
  const currentMap = new Map((current ?? []).map((s) => [s.key, s.value]));

  const changes: { key: string; before: Json; after: NonNullable<Json> }[] = [];
  for (const key of SETTING_KEYS) {
    if (!fd.has(key) && key !== "cash_enabled") continue;
    const raw = key === "cash_enabled" ? (fd.get("cash_enabled") ? "true" : "false") : str(fd, key);
    const parsed = parseSetting(key, raw);
    if ("error" in parsed) return { ok: false, error: `${key}: ${parsed.error}` };
    const before = currentMap.get(key) ?? null;
    if (JSON.stringify(before) === JSON.stringify(parsed.value)) continue;
    changes.push({ key, before, after: parsed.value });
  }
  if (changes.length === 0) return { ok: false, error: "No hay cambios que guardar." };

  for (const c of changes) {
    const { error } = await supabase.from("platform_settings").upsert({ key: c.key, value: c.after, updated_by: auth.ctx.userId, updated_at: new Date().toISOString() });
    if (error) return fail(error);
    await supabase.rpc("audit", { p_action: "settings.update", p_entity: "platform_setting", p_entity_id: c.key, p_reason: reason, p_before: { value: c.before }, p_after: { value: c.after } });
  }
  revalidatePath("/configuracion");
  return { ok: true, message: `${changes.length} ajuste(s) guardado(s). Aplican a nuevos pedidos.` };
}

export async function saveCityAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const name = str(fd, "name");
  const department = str(fd, "department");
  const lat = num(fd, "center_lat");
  const lng = num(fd, "center_lng");
  const active = fd.get("active") !== null;
  if (name.length < 2) return { ok: false, error: "Indica el nombre de la ciudad." };
  const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const supabase = await createClient();
  const payload = { name, department: department || null, center_lat: lat, center_lng: lng, active };
  if (id) {
    const { data: before } = await supabase.from("cities").select("name,department,center_lat,center_lng,active").eq("id", id).single();
    const { error } = await supabase.from("cities").update(payload).eq("id", id);
    if (error) return fail(error);
    await supabase.rpc("audit", { p_action: "city.update", p_entity: "city", p_entity_id: id, p_reason: `Edición de ${name}`, p_before: before ?? null, p_after: payload });
  } else {
    const { data, error } = await supabase.from("cities").insert({ ...payload, slug }).select("id").single();
    if (error) return fail(error);
    await supabase.rpc("audit", { p_action: "city.create", p_entity: "city", p_entity_id: data.id, p_reason: `Nueva ciudad ${name}`, p_before: null, p_after: { ...payload, slug } });
  }
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Ciudad actualizada." : "Ciudad creada." };
}

export async function saveZoneAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const cityId = str(fd, "city_id");
  const name = str(fd, "name");
  const lat = num(fd, "center_lat");
  const lng = num(fd, "center_lng");
  const radius = num(fd, "radius_km");
  const fee = num(fd, "base_delivery_fee");
  const active = fd.get("active") !== null;
  if (!cityId) return { ok: false, error: "Selecciona la ciudad." };
  if (name.length < 2) return { ok: false, error: "Indica el nombre de la zona." };
  if (lat === null || lng === null) return { ok: false, error: "Indica el centro (latitud y longitud)." };
  if (radius === null || radius <= 0) return { ok: false, error: "El radio debe ser mayor que cero." };
  if (fee === null || fee < 0) return { ok: false, error: "Tarifa base no válida." };
  const supabase = await createClient();
  const payload = { city_id: cityId, name, center_lat: lat, center_lng: lng, radius_km: radius, base_delivery_fee: Math.round(fee), active };
  if (id) {
    const { data: before } = await supabase.from("delivery_zones").select("name,center_lat,center_lng,radius_km,base_delivery_fee,active").eq("id", id).single();
    const { error } = await supabase.from("delivery_zones").update(payload).eq("id", id);
    if (error) return fail(error);
    await supabase.rpc("audit", { p_action: "zone.update", p_entity: "delivery_zone", p_entity_id: id, p_reason: `Edición de zona ${name}`, p_before: before ?? null, p_after: payload });
  } else {
    const { data, error } = await supabase.from("delivery_zones").insert(payload).select("id").single();
    if (error) return fail(error);
    await supabase.rpc("audit", { p_action: "zone.create", p_entity: "delivery_zone", p_entity_id: data.id, p_reason: `Nueva zona ${name}`, p_before: null, p_after: payload });
  }
  revalidatePath("/configuracion");
  return { ok: true, message: id ? "Zona actualizada." : "Zona creada." };
}

export async function deleteZoneAction(fd: FormData): Promise<ActionResult> {
  const auth = await ownerCtx();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = str(fd, "id");
  const reason = requireReason(fd.get("reason"));
  if (!id || !reason) return { ok: false, error: "Indica un motivo." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("delivery_zones").select("name,city_id,radius_km,base_delivery_fee").eq("id", id).single();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) return fail(error);
  await supabase.rpc("audit", { p_action: "zone.delete", p_entity: "delivery_zone", p_entity_id: id, p_reason: reason, p_before: before ?? null, p_after: null });
  revalidatePath("/configuracion");
  return { ok: true, message: "Zona eliminada." };
}
