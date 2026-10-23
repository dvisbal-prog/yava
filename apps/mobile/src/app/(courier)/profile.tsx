import React, { useState } from "react";
import { View, Alert, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatRating, COURIER_STATUS_LABEL } from "@yava/shared";
import { Screen, Text, Card, ListRow, Badge, Skeleton, Input, Button } from "@/components/ui";
import { ErrorState, StatusDot } from "@/components/merchant/Rows";
import { useMyCourier, useCourierDocuments, useUpdateCourier } from "@/features/courier/useCourier";
import { VEHICLE_LABEL, COURIER_DOC_TYPES, DOC_STATUS_LABEL } from "@/features/courier/types";
import { usePlatformSetting } from "@/features/merchant/useMerchant";
import { uploadLocalFile } from "@/features/merchant/upload";
import { parseBankAccount } from "@/features/merchant/types";
import { publicUrl } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 69 · Perfil del repartidor. */
export default function CourierProfile() {
  const router = useRouter();
  const { profile, session, updateProfile } = useAuth();
  const uid = session?.user.id;
  const cq = useMyCourier();
  const dq = useCourierDocuments();
  const updateCourier = useUpdateCourier();
  const { data: supportPhone } = usePlatformSetting<string>("support_phone", "+57 300 000 0000");
  const c = cq.data;
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<"data" | "vehicle" | null>(null);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [plate, setPlate] = useState(c?.plate ?? "");
  const bank = parseBankAccount(c?.bank_account);
  const initials = (profile?.full_name ?? "YA").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const changeAvatar = async () => {
    if (!uid) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Sin acceso a la galería", "Permite el acceso en Ajustes para cambiar tu foto."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (res.canceled || !res.assets.length) return;
      setUploading(true);
      const path = `${uid}/avatar-${Date.now().toString(36)}.jpg`;
      await uploadLocalFile("avatars", path, res.assets[0].uri, "image/jpeg");
      await updateProfile({ avatar_url: publicUrl("avatars", path) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert("No se pudo actualizar la foto", errorMessage(e)); }
    finally { setUploading(false); }
  };

  const saveData = async () => {
    try {
      await updateProfile({ full_name: name.trim(), phone: phone.trim() });
      setEditing(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
  };
  const saveVehicle = async () => {
    try { await updateCourier.mutateAsync({ plate: plate.trim().toUpperCase() || null }); setEditing(null); }
    catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
  };

  const docs = dq.data ?? [];
  const docsApproved = COURIER_DOC_TYPES.filter((t) => t.required).every((t) => docs.some((d) => d.doc_type === t.type && d.status === "approved"));

  return (
    <Screen refreshing={cq.isFetching && !cq.isLoading} onRefresh={() => { cq.refetch(); dq.refetch(); }}>
      <Text variant="title" style={{ paddingTop: 12, marginBottom: 12 }}>Perfil</Text>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Pressable onPress={changeAvatar} disabled={uploading}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: 88, height: 88 }} contentFit="cover" /> : <Text variant="display" tone="primary">{initials}</Text>}
          </View>
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white }}>
            <Ionicons name={uploading ? "hourglass-outline" : "camera"} size={14} color={colors.white} />
          </View>
        </Pressable>
        <Text variant="title" style={{ marginTop: 10 }}>{profile?.full_name ?? "Repartidor"}</Text>
        {c ? <StatusDot label={c.status === "active" ? "Cuenta activa" : COURIER_STATUS_LABEL[c.status]} active={c.status === "active"} /> : null}
        {c ? (
          <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
            <Badge label={`★ ${formatRating(c.rating_avg)}`} tone="yellow" />
            <Badge label={`${c.deliveries_count} entregas`} tone="blue" />
          </View>
        ) : null}
      </View>

      {cq.isLoading ? <Skeleton height={200} /> : cq.isError ? <ErrorState message={errorMessage(cq.error)} onRetry={() => cq.refetch()} /> : (
        <>
          <ListRow icon="person-outline" title="Mis datos" subtitle={editing === "data" ? "Edita y guarda" : `${profile?.phone ?? "Sin celular"} · ${profile?.email ?? "Sin correo"}`} onPress={() => setEditing(editing === "data" ? null : "data")} />
          {editing === "data" ? (
            <Card style={{ marginVertical: 8 }}>
              <Input label="Nombre completo" value={name} onChangeText={setName} />
              <Input label="Celular" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <Button title="Guardar" size="md" onPress={saveData} />
            </Card>
          ) : null}
          <ListRow icon="bicycle-outline" title="Mi vehículo" subtitle={c ? `${VEHICLE_LABEL[c.vehicle]}${c.plate ? ` · ${c.plate}` : ""}` : ""} onPress={() => setEditing(editing === "vehicle" ? null : "vehicle")} />
          {editing === "vehicle" ? (
            <Card style={{ marginVertical: 8 }}>
              <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Para cambiar el tipo de vehículo contacta a soporte (requiere nueva verificación).</Text>
              <Input label="Placa" autoCapitalize="characters" value={plate} onChangeText={setPlate} />
              <Button title="Guardar" size="md" onPress={saveVehicle} loading={updateCourier.isPending} />
            </Card>
          ) : null}
          <ListRow icon="document-text-outline" title="Documentos" subtitle={docsApproved ? "Verificados" : `${docs.length} enviados`} right={<Badge label={docsApproved ? "Verificados" : "En revisión"} tone={docsApproved ? "green" : "yellow"} />} onPress={() => router.push("/(onboarding)/courier-documents")} />
          {docs.length ? (
            <View style={{ paddingLeft: 48, paddingBottom: 6 }}>
              {COURIER_DOC_TYPES.filter((t) => docs.some((d) => d.doc_type === t.type)).map((t) => {
                const doc = [...docs].reverse().find((d) => d.doc_type === t.type);
                return doc ? <Text key={t.type} variant="caption" tone="muted">{t.label}: {DOC_STATUS_LABEL[doc.status]}</Text> : null;
              })}
            </View>
          ) : null}
          <ListRow icon="wallet-outline" title="Cuenta de retiro" subtitle={bank ? `${bank.bank} · ${bank.number}` : "Agrega tu cuenta"} onPress={() => router.push("/(courier)/withdraw")} />
          <ListRow icon="notifications-outline" title="Notificaciones y ajustes" subtitle="Pedidos, promociones y novedades" onPress={() => router.push("/(courier)/settings")} />
          <ListRow icon="help-circle-outline" title="Ayuda" subtitle="Centro de ayuda y soporte" onPress={() => Linking.openURL(`tel:${(supportPhone ?? "").replace(/\s/g, "")}`).catch(() => {})} />
        </>
      )}
    </Screen>
  );
}
