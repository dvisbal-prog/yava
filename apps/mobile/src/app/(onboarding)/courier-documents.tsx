import React, { useState } from "react";
import { View, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Button, Badge, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { useMyCourier, useCourierDocuments } from "@/features/courier/useCourier";
import { COURIER_DOC_TYPES, DOC_STATUS_LABEL } from "@/features/courier/types";
import { uploadLocalFile } from "@/features/merchant/upload";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 58 · Verifica tus documentos. */
export default function CourierDocuments() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const uid = session?.user.id;
  const courierQ = useMyCourier();
  const docsQ = useCourierDocuments();
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const vehicle = courierQ.data?.vehicle ?? "moto";
  const needsVehicleDocs = vehicle === "moto" || vehicle === "carro";
  const types = COURIER_DOC_TYPES.filter((t) => !t.vehicleOnly || needsVehicleDocs);
  const docs = docsQ.data ?? [];
  const latest = (type: string) => [...docs].reverse().find((d) => d.doc_type === type) ?? null;
  const requiredDone = types.filter((t) => t.required).every((t) => { const d = latest(t.type); return d && d.status !== "rejected"; });

  const upload = async (type: string, source: "camera" | "gallery") => {
    if (!uid) return;
    setUploading(type);
    try {
      const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Sin permiso", `Permite el acceso a la ${source === "camera" ? "cámara" : "galería"} en Ajustes o usa el otro método.`, [
          { text: "Abrir ajustes", onPress: () => Linking.openSettings().catch(() => {}) },
          { text: source === "camera" ? "Usar galería" : "Usar cámara", onPress: () => upload(type, source === "camera" ? "gallery" : "camera") },
          { text: "Cancelar", style: "cancel" },
        ]);
        return;
      }
      const res = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
      if (res.canceled || !res.assets.length) return;
      const path = `${uid}/${type}-${Date.now().toString(36)}.jpg`;
      await uploadLocalFile("documents", path, res.assets[0].uri, "image/jpeg");
      const { error } = await supabase.from("courier_documents").insert({ courier_id: uid, doc_type: type, file_path: path });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["courier", "documents"] });
    } catch (e) {
      Alert.alert("No se pudo subir", errorMessage(e));
    } finally { setUploading(null); }
  };

  const choose = (type: string) => Alert.alert("Subir documento", "¿Cómo quieres subirlo?", [
    { text: "Tomar foto", onPress: () => upload(type, "camera") },
    { text: "Elegir de la galería", onPress: () => upload(type, "gallery") },
    { text: "Cancelar", style: "cancel" },
  ]);

  const submit = async () => {
    if (!requiredDone) { Alert.alert("Faltan documentos", "Sube todos los documentos obligatorios para enviar a revisión."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("courier_submit_for_review");
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["courier"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(onboarding)/courier-review");
    } catch (e) {
      Alert.alert("No se pudo enviar", errorMessage(e));
    } finally { setSubmitting(false); }
  };

  if (courierQ.isLoading || docsQ.isLoading) {
    return <Screen><Header title="Verifica tus documentos" /><Skeleton height={60} style={{ marginBottom: 12 }} /><Skeleton height={72} style={{ marginBottom: 12 }} /><Skeleton height={72} style={{ marginBottom: 12 }} /><Skeleton height={72} /></Screen>;
  }
  if (courierQ.isError) return <Screen><Header title="Verifica tus documentos" /><ErrorState message={errorMessage(courierQ.error)} onRetry={() => courierQ.refetch()} /></Screen>;
  if (!courierQ.data) {
    return <Screen><Header title="Verifica tus documentos" /><Text tone="muted" style={{ marginTop: 24, textAlign: "center" }}>Primero completa tu registro.</Text><Button title="Ir al registro" onPress={() => router.replace("/(onboarding)/courier-register")} style={{ marginTop: 16 }} /></Screen>;
  }
  const alreadySubmitted = courierQ.data.status !== "pending";

  return (
    <Screen footer={<Button title={alreadySubmitted ? "Ver estado de mi cuenta" : "Enviar a revisión"} onPress={alreadySubmitted ? () => router.replace("/(onboarding)/courier-review") : submit} loading={submitting} disabled={!alreadySubmitted && !requiredDone} />}
      refreshing={docsQ.isFetching} onRefresh={() => docsQ.refetch()}>
      <Header title="Verifica tus documentos" onBack={() => router.replace("/(onboarding)/courier-register")} />
      <Text variant="caption" tone="primary" style={{ fontWeight: "600", marginTop: 8 }}>Paso 2 de 3</Text>
      <Text tone="muted" style={{ marginTop: 4, marginBottom: 16 }}>Sube los siguientes documentos para habilitar tu cuenta como repartidor en YAVA.</Text>
      {types.map((t) => {
        const doc = latest(t.type);
        const tone = !doc ? "gray" : doc.status === "approved" ? "green" : doc.status === "rejected" ? "red" : "yellow";
        return (
          <View key={t.type} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name={t.type === "foto" ? "person-outline" : "document-text-outline"} size={20} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t.label}{!t.required ? " (opcional)" : ""}</Text>
              <Text variant="caption" tone="muted">{doc?.notes ?? t.hint}</Text>
              <View style={{ marginTop: 4 }}><Badge label={doc ? DOC_STATUS_LABEL[doc.status] : "Pendiente"} tone={tone} /></View>
            </View>
            {!doc || doc.status === "rejected" || doc.status === "pending" ? (
              <Button title={doc ? "Cambiar" : "Subir"} size="sm" variant={doc ? "outline" : "secondary"} full={false} onPress={() => choose(t.type)} loading={uploading === t.type} />
            ) : <Ionicons name="checkmark-circle" size={24} color={colors.green} />}
          </View>
        );
      })}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        <Ionicons name="information-circle-outline" size={18} color={colors.gray500} style={{ marginRight: 6 }} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>Revisaremos los archivos para habilitar tu cuenta. Solo los usamos para la verificación.</Text>
      </View>
    </Screen>
  );
}
