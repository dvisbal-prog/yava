import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, Header, Text, Input, Button, Chip, Logo } from "@/components/ui";
import { OptionGrid } from "@/components/merchant/Rows";
import { useCities } from "@/features/merchant/useMerchant";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";

type Vehicle = "moto" | "bicicleta" | "carro" | "a_pie";

/** Pantalla 57 · Empieza a repartir. */
export default function CourierRegister() {
  const router = useRouter();
  const { profile, refreshProfile, updateProfile } = useAuth();
  const { data: cities } = useCities();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [cityId, setCityId] = useState<string | null>(profile?.city_id ?? null);
  const [vehicle, setVehicle] = useState<Vehicle | null>("moto");
  const [plate, setPlate] = useState("");
  const [document, setDocument] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const needsPlate = vehicle === "moto" || vehicle === "carro";
  const errors = {
    name: !fullName.trim() ? "Escribe tu nombre completo" : null,
    phone: phone.replace(/\D/g, "").length < 10 ? "Celular de 10 dígitos" : null,
    city: !cityId ? "Elige tu ciudad" : null,
    plate: needsPlate && plate.trim().length < 5 ? "Placa del vehículo" : null,
    document: document.replace(/\D/g, "").length < 6 ? "Número de cédula" : null,
  };
  const valid = Object.values(errors).every((e) => !e) && vehicle;

  const submit = async () => {
    setTouched(true);
    if (!valid) { notify("Completa los datos", "Revisa los campos marcados."); return; }
    setSubmitting(true);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim(), city_id: cityId });
      const { error } = await supabase.rpc("register_courier", { p: { city_id: cityId, vehicle, plate: needsPlate ? plate.trim().toUpperCase() : null, document_number: document.trim() } });
      if (error) throw error;
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(onboarding)/courier-documents");
    } catch (e) {
      notify("No se pudo registrar", errorMessage(e));
    } finally { setSubmitting(false); }
  };

  return (
    <Screen padded={false} footer={<Button title="Continuar" onPress={submit} loading={submitting} />}>
      <Header title="Repartidores" />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ alignItems: "center", marginVertical: 12 }}><Logo size={40} /></View>
        <Text variant="title">Empieza a repartir</Text>
        <Text tone="muted" style={{ marginBottom: 20 }}>Paso 1 de 3 · Cuéntanos quién eres y cómo repartes.</Text>
        <Input label="Nombre completo" placeholder="Carlos Ramírez" value={fullName} onChangeText={setFullName} error={touched ? errors.name : null} />
        <Input label="Celular" placeholder="3001234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={touched ? errors.phone : null} />
        <Input label="Cédula" placeholder="1045678901" keyboardType="number-pad" value={document} onChangeText={setDocument} error={touched ? errors.document : null} />
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Ciudad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(cities ?? []).map((c) => <Chip key={c.id} label={c.name} selected={cityId === c.id} onPress={() => setCityId(c.id)} />)}
        </ScrollView>
        {touched && errors.city ? <Text variant="caption" tone="danger" style={{ marginTop: 4 }}>{errors.city}</Text> : null}
        <Text variant="caption" tone="muted" style={{ marginTop: 16, marginBottom: 6 }}>Vehículo de reparto</Text>
        <OptionGrid value={vehicle} onChange={setVehicle} options={[
          { key: "moto", label: "Moto", icon: "bicycle-outline" },
          { key: "bicicleta", label: "Bicicleta", icon: "bicycle" },
          { key: "carro", label: "Carro", icon: "car-outline" },
          { key: "a_pie", label: "A pie", icon: "walk-outline" },
        ]} />
        {needsPlate ? <Input label="Placa" placeholder="ABC12D" autoCapitalize="characters" value={plate} onChangeText={setPlate} error={touched ? errors.plate : null} /> : null}
        <Text variant="caption" tone="subtle">Necesitarás verificar tus datos y documentos antes de conectarte.</Text>
      </View>
    </Screen>
  );
}
