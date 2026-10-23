import React, { useEffect, useState } from "react";
import { View, Switch, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Chip } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useAddress, useCities, useRequireAuth, activateAddress, type AddressRow } from "@/features/customer";
import { ListSkeleton } from "@/components/customer/QueryState";

const LABELS = ["Casa", "Trabajo", "Otro"];

/** Pantalla 07 · Detalles de la dirección. `?id=` edita; `?lat&lng` precargan coordenadas. */
export function AddressForm({ group }: { group: "auth" | "customer" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string; next?: string; line1?: string }>();
  const session = useAuth((s) => s.session);
  const requireAuth = useRequireAuth();
  const cityId = useLocation((s) => s.cityId);
  const existing = useAddress(params.id);
  const cities = useCities();

  const [line1, setLine1] = useState(params.line1 ?? "");
  const [line2, setLine2] = useState("");
  const [instructions, setInstructions] = useState("");
  const [label, setLabel] = useState("Casa");
  const [customLabel, setCustomLabel] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [city, setCity] = useState<string | null>(cityId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const a = existing.data;
    if (!a) return;
    setLine1(a.line1); setLine2(a.line2 ?? ""); setInstructions(a.instructions ?? ""); setIsDefault(a.is_default); setCity(a.city_id);
    if (LABELS.includes(a.label)) setLabel(a.label); else { setLabel("Otro"); setCustomLabel(a.label); }
  }, [existing.data]);

  useEffect(() => {
    if (!city && cities.data?.length) setCity(cities.data[0].id);
  }, [cities.data, city]);

  const lat = params.lat ? Number(params.lat) : existing.data?.lat ?? null;
  const lng = params.lng ? Number(params.lng) : existing.data?.lng ?? null;

  async function save() {
    if (!requireAuth()) return;
    if (!line1.trim()) { setError("Escribe la dirección."); return; }
    const finalLabel = label === "Otro" ? (customLabel.trim() || "Otro") : label;
    setSaving(true); setError(null);
    try {
      const payload = { user_id: session?.user.id as string, label: finalLabel, line1: line1.trim(), line2: line2.trim() || null, instructions: instructions.trim() || null, is_default: isDefault, city_id: city, lat, lng };
      const res = params.id
        ? await supabase.from("addresses").update(payload).eq("id", params.id).select().single()
        : await supabase.from("addresses").insert(payload).select().single();
      if (res.error) throw res.error;
      const row = res.data as AddressRow;
      await qc.invalidateQueries({ queryKey: ["addresses"] });
      await activateAddress(row);
      const next = params.next;
      if (next) router.replace(next as never);
      else if (router.canGoBack()) router.back();
      else router.replace("/(customer)" as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const cityName = cities.data?.find((c) => c.id === city)?.name;

  return (
    <Screen footer={<Button title="Guardar dirección" onPress={save} loading={saving} />}>
      <Header title="Detalles de la dirección" back={router.canGoBack()} />
      {params.id && existing.isLoading ? <ListSkeleton rows={2} /> : (
        <View style={{ marginTop: 8 }}>
          <Input label="Dirección" value={line1} onChangeText={setLine1} placeholder="Calle 2 # 3-45" autoCapitalize="words" />
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Ciudad</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {(cities.data ?? []).map((c) => <Chip key={c.id} label={c.name} selected={city === c.id} onPress={() => setCity(c.id)} />)}
          </ScrollView>
          {cityName ? <Text variant="caption" tone="subtle" style={{ marginTop: -8, marginBottom: 14 }}>{line1 || "Tu dirección"} · {cityName}, Atlántico</Text> : null}
          <Input label="Apartamento, casa u oficina (opcional)" value={line2} onChangeText={setLine2} placeholder="Apto. 302" />
          <Input label="Instrucciones de entrega (opcional)" value={instructions} onChangeText={setInstructions} placeholder="Tocar el timbre al llegar." multiline style={{ minHeight: 60 }} />
          <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Guardar como</Text>
          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            {LABELS.map((l) => <Chip key={l} label={l} selected={label === l} onPress={() => setLabel(l)} icon={l === "Casa" ? "home-outline" : l === "Trabajo" ? "briefcase-outline" : "location-outline"} />)}
          </View>
          {label === "Otro" ? <Input label="Nombre de la dirección" value={customLabel} onChangeText={setCustomLabel} placeholder="Casa de mamá" /> : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text style={{ flex: 1 }}>Establecer como dirección principal</Text>
            <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.blue }} />
          </View>
          {lat == null ? (
            <Button title="Ubicar en el mapa" variant="ghost" icon="map-outline" onPress={() => router.push(`/(${group})/location${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}` as never)} style={{ marginTop: 4 }} />
          ) : null}
          {error ? <Text tone="danger" style={{ marginTop: 8 }}>{error}</Text> : null}
          {!session ? <Text variant="caption" tone="muted" style={{ marginTop: 12, textAlign: "center" }}>Necesitas una cuenta para guardar direcciones.</Text> : null}
        </View>
      )}
    </Screen>
  );
}
