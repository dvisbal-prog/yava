import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Chip } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { useAddress, useCities, useRequireAuth, activateAddress, type AddressRow } from "@/features/customer";
import { ListSkeleton } from "@/components/customer/QueryState";
import { AuthScreen } from "@/components/customer/auth/AuthScreen";
import { AuthBack } from "@/components/customer/auth/AuthBack";
import { Field, Checkbox, AuthButton, LOOK_ADDRESS, NO_WEB_OUTLINE } from "@/components/customer/auth/Field";

const LABELS = ["Casa", "Trabajo", "Otro"];
/** Ícono de cada etiqueta (C18, como en el PNG: casa con puerta, bolso con asa, tres puntos). */
function LabelIcon({ label, on }: { label: string; on: boolean }) {
  const color = on ? colors.blue : colors.iconGray;
  if (label === "Trabajo") return <Ionicons name={on ? "bag" : "bag-outline"} size={22} color={color} />;
  if (label === "Otro") return <MaterialCommunityIcons name="dots-horizontal" size={24} color={color} />;
  return <MaterialCommunityIcons name={on ? "home" : "home-outline"} size={23} color={color} />;
}
/** Anchos relativos de las tres tarjetas medidos en el PNG (115,5 / 112,2 / 110,8 pt). */
const LABEL_FLEX: Record<string, number> = { Casa: 1.03, Trabajo: 1, Otro: 0.988 };

/** true si `href` apunta al formulario de dirección (07), en cualquier grupo. */
export function isAddressRoute(href: string): boolean {
  return /\/address$/.test(href.split("?")[0]);
}

/** true si `href` apunta a la pantalla de ubicación (06), en cualquier grupo. */
export function isLocationRoute(href: string): boolean {
  return /\/location$/.test(href.split("?")[0]);
}

/**
 * Pantalla 07 · Detalles de la dirección (medidas de tanda-01/07-direccion.png). `?id=` edita; `?lat&lng` precargan coordenadas.
 * La dirección (línea 1) se edita sobre el mismo título de la fila; "Cambiar" vuelve al mapa (o enfoca el texto al editar).
 * La ciudad se toca para elegir otra cuando hay varias.
 */
export function AddressForm({ group }: { group: "auth" | "customer" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string; next?: string; line1?: string }>();
  const session = useAuth((s) => s.session);
  const requireAuth = useRequireAuth();
  const cityId = useLocation((s) => s.cityId);
  const existing = useAddress(params.id);
  const cities = useCities();
  const line1Ref = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [line1, setLine1] = useState(params.line1 ?? "");
  const [line2, setLine2] = useState("");
  const [instructions, setInstructions] = useState("");
  const [label, setLabel] = useState("Casa");
  const [customLabel, setCustomLabel] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [city, setCity] = useState<string | null>(cityId);
  const [showCities, setShowCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const a = existing.data;
    if (!a) return;
    setLine1(a.line1); setLine2(a.line2 ?? ""); setInstructions(a.instructions ?? ""); setIsDefault(a.is_default); setCity(a.city_id);
    if (LABELS.includes(a.label)) setLabel(a.label); else { setLabel("Otro"); setCustomLabel(a.label); }
  }, [existing.data]);

  useEffect(() => {
    // Actualización funcional: si la dirección guardada y las ciudades llegan en el mismo render, no se pisa su ciudad.
    const first = cities.data?.[0]?.id;
    if (!city && first) setCity((c) => c ?? first);
  }, [cities.data, city]);

  const lat = params.lat ? Number(params.lat) : existing.data?.lat ?? null;
  const lng = params.lng ? Number(params.lng) : existing.data?.lng ?? null;

  /** Ruta para volver a este formulario después de iniciar sesión, sin perder lo que el invitado ya eligió. */
  function returnHref(): string {
    const q = new URLSearchParams();
    if (lat != null && lng != null) { q.set("lat", String(lat)); q.set("lng", String(lng)); }
    if (line1.trim()) q.set("line1", line1.trim());
    if (params.next && !isAddressRoute(params.next) && !isLocationRoute(params.next)) q.set("next", params.next);
    const qs = q.toString();
    return `/(customer)/address${qs ? `?${qs}` : ""}`;
  }

  async function save() {
    // El invitado inicia sesión y vuelve a (customer)/address con coordenadas y dirección (las de (auth) se pierden).
    if (!session) { requireAuth(returnHref()); return; }
    if (!line1.trim()) { setError("Escribe la dirección."); line1Ref.current?.focus(); return; }
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
      // Guard: si `next` es este mismo flujo (06/07), volver ahí lo mostraría vacío y en bucle.
      if (next && !isAddressRoute(next) && !isLocationRoute(next)) router.replace(next as never);
      else if (next) router.replace("/(customer)" as never);
      else if (router.canGoBack()) router.back();
      else router.replace("/(customer)" as never);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  /** "Cambiar": vuelve al mapa (06) para mover el punto; al editar una dirección guardada, enfoca el texto. */
  function changePoint() {
    if (params.id) { line1Ref.current?.focus(); return; }
    if (params.lat && router.canGoBack()) { router.back(); return; }
    router.push(`/(${group})/location${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}` as never);
  }

  const cityName = cities.data?.find((c) => c.id === city)?.name;
  const manyCities = (cities.data?.length ?? 0) > 1;

  return (
    <AuthScreen
      bottomGap={14.6}
      keyboardGap={12}
      footerStyle={styles.footer}
      footer={<AuthButton title="Guardar dirección" onPress={save} loading={saving} height={48} radius={11} color="#003A96" textStyle={styles.ctaText} />}
    >
      <View style={styles.header}>
        <AuthBack size={37.4} color="#F6F6F8" iconSize={21.2} stroke={44} iconShift={{ x: -1.2, y: -0.25 }} />
        <Text style={styles.title} numberOfLines={1}>Detalles de la dirección</Text>
      </View>

      {params.id && existing.isLoading ? <View style={styles.pad}><ListSkeleton rows={3} /></View> : (
        <>
          <View style={styles.place}>
            <Ionicons name="location" size={20.4} color={colors.iconGray} style={styles.placePin} />
            <View style={styles.placeText}>
              <TextInput
                ref={line1Ref}
                value={line1}
                onChangeText={(t) => { setLine1(t); if (error) setError(null); }}
                placeholder="Escribe la dirección"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.blueText}
                autoCapitalize="words"
                style={[styles.placeTitle, NO_WEB_OUTLINE]}
                accessibilityLabel="Dirección"
              />
              <Pressable onPress={manyCities ? () => setShowCities((v) => !v) : undefined} disabled={!manyCities} hitSlop={6} accessibilityRole={manyCities ? "button" : undefined} accessibilityLabel={manyCities ? "Cambiar ciudad" : undefined}>
                <Text style={styles.placeSubtitle} numberOfLines={1}>{cityName ? `${cityName}, Atlántico` : "Elige la ciudad"}</Text>
              </Pressable>
            </View>
            <Pressable onPress={changePoint} hitSlop={10} accessibilityRole="button">
              <Text style={styles.change}>Cambiar</Text>
            </Pressable>
          </View>
          {showCities ? (
            <View style={styles.cities}>
              {(cities.data ?? []).map((c) => <Chip key={c.id} label={c.name} selected={city === c.id} onPress={() => { setCity(c.id); setShowCities(false); }} style={{ marginRight: 8 }} />)}
            </View>
          ) : null}
          <View style={styles.divider} />

          <Field look={LOOK_ADDRESS} label="Apartamento, casa u oficina" optional containerStyle={styles.first} value={line2} onChangeText={setLine2} placeholder="Apto. 302" />
          <Field look={LOOK_ADDRESS} label="Instrucciones de entrega" optional containerStyle={styles.next} value={instructions} onChangeText={setInstructions} placeholder="Tocar el timbre al llegar." multiline boxHeight={92.8} style={styles.textarea} />

          <Text style={styles.saveAs}>Guardar como</Text>
          <View style={styles.labels}>
            {LABELS.map((l) => {
              const on = label === l;
              return (
                <Pressable key={l} onPress={() => setLabel(l)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={({ pressed }) => [styles.labelCard, { flex: LABEL_FLEX[l] }, on && styles.labelCardOn, { opacity: pressed ? 0.85 : 1 }]}>
                  <LabelIcon label={l} on={on} />
                  <Text style={[styles.labelText, on && styles.labelTextOn]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
          {label === "Otro" ? (
            <Field look={LOOK_ADDRESS} label="Nombre de la dirección" containerStyle={styles.next} value={customLabel} onChangeText={setCustomLabel} placeholder="Casa de mamá" />
          ) : null}

          <Checkbox checked={isDefault} onToggle={() => setIsDefault((v) => !v)} label="Establecer como dirección principal" size={23.6} radius={6} style={styles.check} labelStyle={styles.checkLabel} />

          {error ? <Text tone="danger" style={styles.error}>{error}</Text> : null}
          {!session ? <Text variant="bodyS" tone="tertiary" style={styles.guest}>Necesitas una cuenta para guardar direcciones.</Text> : null}
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 18.5, marginTop: 24 },
  header: { flexDirection: "row", alignItems: "center", marginTop: 15.7, marginLeft: 18.5 },
  title: { flex: 1, marginLeft: 11.6, marginRight: 18, fontSize: 17.6, lineHeight: 24, fontWeight: "600", letterSpacing: -0.15, color: colors.ink },
  place: { flexDirection: "row", alignItems: "flex-start", marginTop: 24.9, marginHorizontal: 18.5 },
  placePin: { width: 20.4, marginLeft: 3.6, marginTop: 3.8 },
  placeText: { flex: 1, marginLeft: 16.3 },
  placeTitle: { fontSize: 15.2, lineHeight: 20, fontWeight: "700", letterSpacing: -0.4, color: colors.ink, paddingVertical: 0, height: 20 },
  placeSubtitle: { marginTop: 1.3, fontSize: 12.6, lineHeight: 17, letterSpacing: -0.15, color: colors.textTertiary },
  change: { marginTop: 6.7, fontSize: 12.9, lineHeight: 17, fontWeight: "600", letterSpacing: -0.1, color: colors.blueText },
  cities: { flexDirection: "row", marginTop: 12, marginHorizontal: 18.5 },
  divider: { height: 1.2, backgroundColor: "#E5E8EF", marginTop: 21.3, marginHorizontal: 18 },
  first: { marginTop: 21.9, marginHorizontal: 18.5 },
  next: { marginTop: 23.2, marginHorizontal: 18.5 },
  textarea: { lineHeight: 21 },
  saveAs: { marginTop: 22.9, marginHorizontal: 19.4, fontSize: 13, lineHeight: 19, letterSpacing: 0, color: colors.ink },
  labels: { flexDirection: "row", gap: 8.8, marginTop: 6.3, marginHorizontal: 18.9 },
  labelCard: {
    height: 49, borderRadius: 11, borderWidth: 1, borderColor: "#E0E3E9", backgroundColor: colors.white,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  labelCardOn: { borderWidth: 1.5, borderColor: "#1646F4", backgroundColor: colors.blueSoft },
  labelText: { marginLeft: 11, fontSize: 13, lineHeight: 18, color: colors.ink },
  labelTextOn: { fontWeight: "600", color: colors.blueText },
  check: { marginTop: 19.8, marginHorizontal: 18 },
  checkLabel: { fontSize: 12.6, lineHeight: 18, letterSpacing: -0.45, marginLeft: 13.4 },
  error: { marginTop: 14, marginHorizontal: 18.5 },
  guest: { marginTop: 14, marginHorizontal: 18.5, textAlign: "center" },
  footer: { paddingHorizontal: 18 },
  ctaText: { fontSize: 15.5, lineHeight: 21, fontWeight: "600", letterSpacing: -0.3 },
});
