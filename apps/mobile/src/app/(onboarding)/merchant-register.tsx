import React, { useState } from "react";
import { View, Alert, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Chip, Logo } from "@/components/ui";
import { OptionGrid } from "@/components/merchant/Rows";
import { MapCard } from "@/components/courier/MapCard";
import { useCities } from "@/features/merchant/useMerchant";
import { uploadLocalFile } from "@/features/merchant/upload";
import { getCurrentCoords } from "@/features/courier/useCourier";
import type { MerchantRow } from "@/features/merchant/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

type Category = "food" | "market" | "pharmacy";
const DOCS: { type: string; label: string; hint: string }[] = [
  { type: "rut", label: "RUT", hint: "PDF o foto legible" },
  { type: "camara_comercio", label: "Cámara de comercio", hint: "Certificado reciente" },
  { type: "cedula", label: "Cédula del representante", hint: "Ambas caras" },
];

/** Pantalla 49 · Registra tu comercio. */
export default function MerchantRegister() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { data: cities } = useCities();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>("food");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState<string | null>(profile?.city_id ?? null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [docs, setDocs] = useState<Record<string, { uri: string; name: string } | undefined>>({});
  const [terms, setTerms] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = {
    name: !name.trim() ? "Escribe el nombre comercial" : null,
    city: !cityId ? "Elige la ciudad" : null,
    phone: phone.replace(/\D/g, "").length < 10 ? "Celular de 10 dígitos" : null,
    address: !address.trim() ? "Escribe la dirección" : null,
  };
  const valid = !errors.name && !errors.city && !errors.phone && !errors.address && category && terms;

  const locate = async () => {
    setLocating(true);
    const c = await getCurrentCoords();
    setLocating(false);
    if (!c) { Alert.alert("Sin ubicación", "No pudimos obtener tu ubicación. Puedes continuar solo con la dirección."); return; }
    setCoords(c);
  };

  const pickDoc = async (type: string) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Sin acceso a la galería", "Permite el acceso en Ajustes para subir documentos."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
      if (res.canceled || !res.assets.length) return;
      const a = res.assets[0];
      setDocs((d) => ({ ...d, [type]: { uri: a.uri, name: a.fileName ?? `${type}.jpg` } }));
    } catch (e) { Alert.alert("No se pudo seleccionar", errorMessage(e)); }
  };

  const submit = async () => {
    setTouched(true);
    if (!valid) { Alert.alert("Completa los datos", "Revisa los campos marcados y acepta los términos."); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("register_merchant", {
        p: { name: name.trim(), category, description: description.trim() || null, city_id: cityId, address: address.trim(), lat: coords?.lat ?? null, lng: coords?.lng ?? null, phone: phone.trim(), legal_name: legalName.trim() || null, tax_id: taxId.trim() || null },
      });
      if (error) throw error;
      const merchant = data as MerchantRow;
      const failed: string[] = [];
      for (const doc of DOCS) {
        const f = docs[doc.type];
        if (!f) continue;
        try {
          const ext = f.uri.toLowerCase().endsWith(".png") ? "png" : "jpg";
          const path = `${merchant.id}/${doc.type}-${Date.now().toString(36)}.${ext}`;
          await uploadLocalFile("documents", path, f.uri);
          const { error: e2 } = await supabase.from("merchant_documents").insert({ merchant_id: merchant.id, doc_type: doc.type, file_path: path });
          if (e2) throw e2;
        } catch { failed.push(doc.label); }
      }
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (failed.length) Alert.alert("Comercio creado", `No se pudieron subir: ${failed.join(", ")}. Podrás reintentarlo desde la pantalla de revisión.`);
      router.replace("/(onboarding)/merchant-review");
    } catch (e) {
      Alert.alert("No se pudo registrar", errorMessage(e));
    } finally { setSubmitting(false); }
  };

  return (
    <Screen padded={false} footer={<Button title="Enviar a revisión" onPress={submit} loading={submitting} disabled={!terms} />}>
      <Header title="Comercios" />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ alignItems: "center", marginVertical: 12 }}><Logo size={40} /></View>
        <Text variant="title">Registra tu comercio</Text>
        <Text tone="muted" style={{ marginBottom: 20 }}>Cuéntanos sobre tu negocio para empezar a vender en YAVA.</Text>

        <Input label="Nombre comercial" placeholder="Bocamar" value={name} onChangeText={setName} error={touched ? errors.name : null} />
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Tipo de negocio</Text>
        <OptionGrid value={category} onChange={setCategory} options={[
          { key: "food", label: "Restaurante", icon: "restaurant-outline" },
          { key: "market", label: "Mercado", icon: "basket-outline" },
          { key: "pharmacy", label: "Farmacia", icon: "medkit-outline" },
        ]} />
        <Input label="Descripción" placeholder="Ceviches frescos de la costa, preparados al momento." value={description} onChangeText={setDescription} multiline style={{ minHeight: 64, textAlignVertical: "top" }} />

        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Ciudad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {(cities ?? []).map((c) => <Chip key={c.id} label={c.name} selected={cityId === c.id} onPress={() => setCityId(c.id)} />)}
        </ScrollView>
        {touched && errors.city ? <Text variant="caption" tone="danger" style={{ marginBottom: 8 }}>{errors.city}</Text> : <View style={{ height: 10 }} />}

        <Input label="Dirección" placeholder="Calle 3 # 4-10, Puerto Colombia" value={address} onChangeText={setAddress} error={touched ? errors.address : null}
          right={<Pressable onPress={locate} hitSlop={8}><Ionicons name={locating ? "ellipsis-horizontal" : "locate-outline"} size={20} color={colors.blue} /></Pressable>} hint="Toca el ícono para fijar la ubicación en el mapa (opcional)." />
        {coords ? <MapCard pins={[{ lat: coords.lat, lng: coords.lng, kind: "merchant", title: name || "Tu comercio" }]} height={140} style={{ marginBottom: 14 }} /> : null}

        <Input label="Celular de contacto" placeholder="3001234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={touched ? errors.phone : null} />
        <Input label="Razón social" placeholder="Bocamar SAS" value={legalName} onChangeText={setLegalName} />
        <Input label="NIT" placeholder="900.123.456-7" value={taxId} onChangeText={setTaxId} />

        <Text variant="heading" style={{ marginTop: 8, marginBottom: 4 }}>Documentos</Text>
        <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Puedes subirlos ahora o después desde la pantalla de revisión.</Text>
        {DOCS.map((d) => {
          const f = docs[d.type];
          return (
            <Pressable key={d.type} onPress={() => pickDoc(d.type)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
              <Ionicons name={f ? "checkmark-circle" : "document-attach-outline"} size={22} color={f ? colors.green : colors.blue} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{d.label}</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>{f ? f.name : d.hint}</Text>
              </View>
              <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{f ? "Cambiar" : "Subir"}</Text>
            </Pressable>
          );
        })}

        <Pressable onPress={() => setTerms((t) => !t)} style={{ flexDirection: "row", alignItems: "center", marginTop: 18 }}>
          <Ionicons name={terms ? "checkbox" : "square-outline"} size={22} color={terms ? colors.blue : colors.gray400} style={{ marginRight: 10 }} />
          <Text variant="caption" style={{ flex: 1 }}>Acepto los términos para comercios y autorizo la verificación de mis documentos.</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
