import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Screen, Header, Text, Input, Button, Chip } from "@/components/ui";
import { useLocation } from "@/store/location";
import { useRequireAuth, useShipmentDraft, maskPhone, type PackageSize } from "@/features/customer";

const TYPES = ["Documentos", "Ropa", "Comida", "Tecnología", "Regalo", "Otro"];
const SIZES: { key: PackageSize; label: string; hint: string }[] = [
  { key: "small", label: "Pequeño", hint: "Hasta 2 kg · cabe en una mochila" },
  { key: "medium", label: "Mediano", hint: "Hasta 8 kg · caja mediana" },
  { key: "large", label: "Grande", hint: "Hasta 15 kg · requiere moto con baúl" },
];

/** Pantalla 31 · Envía un paquete (datos del envío). */
export default function NewShipment() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const active = useLocation((s) => s.address);
  const { draft, update } = useShipmentDraft();
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

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
    <Screen footer={<Button title="Cotizar envío" onPress={next} loading={geocoding} />}>
      <Header title="Envía un paquete" />
      <Text variant="heading" style={{ marginTop: 8, marginBottom: 8 }}>Recogida</Text>
      <Input value={draft.pickupLine1} onChangeText={(t) => update({ pickupLine1: t, pickupLat: active?.line1 === t ? active.lat : null, pickupLng: active?.line1 === t ? active.lng : null })} placeholder="Calle 2 # 3-45" icon="location-outline" />
      <Input value={draft.pickupLine2} onChangeText={(t) => update({ pickupLine2: t })} placeholder="Apto, oficina o referencia (opcional)" />

      <Text variant="heading" style={{ marginBottom: 8 }}>Destino</Text>
      <Input value={draft.dropoffLine1} onChangeText={(t) => update({ dropoffLine1: t, dropoffLat: null, dropoffLng: null })} placeholder="Carrera 4 # 5-20, Puerto Colombia" icon="navigate-outline" />

      <Text variant="heading" style={{ marginBottom: 8 }}>Datos del destinatario</Text>
      <Input label="Nombre" value={draft.recipientName} onChangeText={(t) => update({ recipientName: t })} placeholder="Ana López" autoCapitalize="words" />
      <Input label="Celular" value={maskPhone(draft.recipientPhone)} onChangeText={(t) => update({ recipientPhone: t })} placeholder="300 765 4321" keyboardType="phone-pad" />

      <Text variant="heading" style={{ marginBottom: 8 }}>¿Qué envías?</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Tipo de paquete</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {TYPES.map((t) => <Chip key={t} label={t} selected={draft.packageType === t} onPress={() => update({ packageType: t })} />)}
      </ScrollView>
      <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Tamaño del paquete</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
        {SIZES.map((s) => <Chip key={s.key} label={s.label} selected={draft.size === s.key} onPress={() => update({ size: s.key })} />)}
      </View>
      <Text variant="caption" tone="subtle" style={{ marginBottom: 14 }}>{SIZES.find((s) => s.key === draft.size)?.hint}</Text>
      <Input value={draft.description} onChangeText={(t) => update({ description: t })} placeholder="Describe el contenido (opcional)" error={error} />
      <Text variant="small" tone="subtle">No enviamos dinero en efectivo, sustancias ilegales ni artículos frágiles sin empaque.</Text>
    </Screen>
  );
}
