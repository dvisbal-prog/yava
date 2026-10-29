import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { colors } from "@yava/shared";
import { Text, Input } from "@/components/ui";
import { useLocation } from "@/store/location";
import { NavBar, ft } from "@/components/customer/account/kit";
import { PrimaryCTA } from "@/components/customer/account/parts";
import { AddressCard, FormField, SelectField, SizeCard } from "@/components/customer/account/shipment";
import { useRequireAuth, useShipmentDraft, maskPhone, type PackageSize } from "@/features/customer";

const TYPES = ["Documentos", "Ropa", "Comida", "Tecnología", "Regalo", "Otro"];
/** Tamaños con [ancho, alto, tope] de `envio-caja.png` en cada tarjeta (la tinta de la caja mide 46 × 37, 52 × 43 y 66 × 57 pt en 31). */
const SIZES: { key: PackageSize; label: string; hint: string; box: [number, number, number] }[] = [
  { key: "small", label: "Pequeño", hint: "Hasta 2 kg", box: [52.9, 46.1, 29.4] },
  { key: "medium", label: "Mediano", hint: "Hasta 8 kg", box: [60.6, 52.4, 26.4] },
  { key: "large", label: "Grande", hint: "Hasta 15 kg", box: [77.5, 68.9, 14.3] },
];

/**
 * Pantalla 31 · Envía un paquete (tanda-04/31-envio-datos.png): chevron + título, tarjetas de Recogida y Destino
 * (se escriben en la misma tarjeta), tarjeta del destinatario (Nombre, Celular), tipo de paquete (selector),
 * tamaño (tres tarjetas con la caja a escala), descripción opcional y CTA "Cotizar envío".
 */
export default function NewShipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const active = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const { draft, update } = useShipmentDraft();
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const city = cityName ?? "Puerto Colombia";

  useEffect(() => {
    if (!draft.pickupLine1 && active) update({ pickupLine1: active.line1, pickupLine2: active.line2 ?? "", pickupLat: active.lat, pickupLng: active.lng });
  }, [active, draft.pickupLine1, update]);

  async function next() {
    if (!draft.pickupLine1.trim()) { setError("Escribe la dirección de recogida."); return; }
    if (!draft.dropoffLine1.trim()) { setError("Escribe la dirección de destino."); return; }
    if (!draft.recipientName.trim()) { setError("Escribe el nombre de quien recibe."); return; }
    if (draft.recipientPhone.replace(/\D/g, "").length !== 10) { setError("Escribe un celular de 10 dígitos."); return; }
    setError(null);
    if (!requireAuth("/(customer)/shipments/new")) return;
    // Geocodificación opcional del destino para el mapa del repartidor.
    setGeocoding(true);
    try {
      if (draft.dropoffLat == null) {
        const res = await Location.geocodeAsync(`${draft.dropoffLine1}, Puerto Colombia, Atlántico, Colombia`);
        if (res[0]) update({ dropoffLat: res[0].latitude, dropoffLng: res[0].longitude });
      }
    } catch { /* sin geocodificación seguimos igual */ } finally { setGeocoding(false); }
    router.push("/(customer)/shipments/review" as never);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar title="Envía un paquete" titleStyle={styles.title} titleLeft={59} backLeft={21.5} chevronHeight={18.8} chevronStroke={2.2} height={56} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AddressCard label="Recogida" tone="pickup" value={draft.pickupLine1} placeholder="Calle 2 # 3-45"
            onChangeText={(t) => update({ pickupLine1: t, pickupLat: active?.line1 === t ? active.lat : null, pickupLng: active?.line1 === t ? active.lng : null })}
            secondValue={draft.pickupLine2} onChangeSecond={(t) => update({ pickupLine2: t })} secondPlaceholder={city} />
          <AddressCard label="Destino" tone="dropoff" value={draft.dropoffLine1} placeholder="Carrera 4 # 5-20" city={city}
            onChangeText={(t) => update({ dropoffLine1: t, dropoffLat: null, dropoffLng: null })} style={{ marginTop: 12.9 }} />

          <Text style={[styles.h2, { marginTop: 23.7 }]}>Datos del destinatario</Text>
          <View style={styles.recipient}>
            <FormField label="Nombre" value={draft.recipientName} onChangeText={(t) => update({ recipientName: t })} placeholder="Nombre de quien recibe" autoCapitalize="words" />
            <View style={{ height: 17.1 }} />
            <FormField label="Celular" value={maskPhone(draft.recipientPhone)} onChangeText={(t) => update({ recipientPhone: t })} placeholder="300 765 4321" keyboardType="phone-pad" />
          </View>

          <Text style={[styles.h2, { marginTop: 19.4 }]}>¿Qué envías?</Text>
          <Text style={styles.label}>Tipo de paquete</Text>
          <SelectField value={draft.packageType} options={TYPES} onChange={(v) => update({ packageType: v })} accessibilityLabel="Tipo de paquete" />

          <Text style={[styles.label, { marginTop: 16.4, marginBottom: 3.8 }]}>Tamaño del paquete</Text>
          <View style={styles.sizes}>
            {SIZES.map((s) => <SizeCard key={s.key} label={s.label} hint={s.hint} boxWidth={s.box[0]} boxHeight={s.box[1]} boxTop={s.box[2]} selected={draft.size === s.key} onPress={() => update({ size: s.key })} />)}
          </View>

          <Input label="Describe el contenido" optional value={draft.description} onChangeText={(t) => update({ description: t })}
            placeholder="Ej.: sobre con contratos" containerStyle={{ marginTop: 18, marginBottom: 8 }} />
          <Text style={ft(11.5, "400", colors.textPlaceholder, 16)}>No enviamos dinero en efectivo, sustancias ilegales ni artículos frágiles sin empaque.</Text>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {error ? <Text style={[ft(12.5, "500", colors.red, 17), { textAlign: "center", marginBottom: 8 }]} accessibilityLiveRegion="polite">{error}</Text> : null}
          <PrimaryCTA title="Cotizar envío" onPress={() => { void next(); }} loading={geocoding} pill height={46.4} fontSize={15.6} color="#0042A1" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  title: { ...ft(23.2, "700", colors.ink, 28), letterSpacing: -0.4 },
  content: { paddingHorizontal: 15.7, paddingTop: 3.6, paddingBottom: 20 },
  h2: { ...ft(17.4, "700", colors.ink, 23), letterSpacing: -0.2, marginLeft: 0.3 },
  recipient: { marginTop: 8.6, borderRadius: 16, borderWidth: 1, borderColor: "#E4EAF1", backgroundColor: colors.white, paddingHorizontal: 14.8, paddingTop: 11.2, paddingBottom: 14.2 },
  label: { ...ft(12, "400", "#5A6476", 17), marginTop: 12.3, marginBottom: 3.6, marginLeft: 1.4 },
  sizes: { flexDirection: "row", gap: 6.4 },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.white },
});
