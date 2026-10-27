import React, { useEffect } from "react";
import { View, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, MERCHANT_STATUS_LABEL } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Badge, Skeleton, ListRow } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantDocuments, usePlatformSetting } from "@/features/merchant/useMerchant";
import { uploadLocalFile } from "@/features/merchant/upload";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import { notify } from "@/lib/dialog";
import { errorMessage } from "@/lib/errors";

const DOC_LABEL: Record<string, string> = { rut: "RUT", camara_comercio: "Cámara de comercio", cedula: "Cédula del representante" };
const DOC_TONE: Record<string, "yellow" | "green" | "red"> = { pending: "yellow", approved: "green", rejected: "red" };
const DOC_STATUS: Record<string, string> = { pending: "En revisión", approved: "Aprobado", rejected: "Rechazado" };

/** Pantalla 65 · Estamos revisando tu comercio. */
export default function MerchantReview() {
  const router = useRouter();
  const signOut = useAuth((s) => s.signOut);
  const merchantQ = useMyMerchant();
  const merchant = merchantQ.data;
  const docsQ = useMerchantDocuments(merchant?.id);
  const { data: supportPhone } = usePlatformSetting<string>("support_phone", "+57 300 000 0000");

  const refetchMerchant = merchantQ.refetch;
  useEffect(() => {
    const t = setInterval(() => { refetchMerchant(); }, 20_000);
    return () => clearInterval(t);
  }, [refetchMerchant]);

  useEffect(() => {
    if (merchant && (merchant.status === "active" || merchant.status === "paused")) router.replace("/(merchant)");
  }, [merchant, router]);

  const addDoc = async (type: string) => {
    if (!merchant) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { notify("Sin acceso a la galería", "Permite el acceso en Ajustes para subir documentos."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
      if (res.canceled || !res.assets.length) return;
      const path = `${merchant.id}/${type}-${Date.now().toString(36)}.jpg`;
      await uploadLocalFile("documents", path, res.assets[0].uri);
      const { error } = await supabase.from("merchant_documents").insert({ merchant_id: merchant.id, doc_type: type, file_path: path });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["merchant-documents", merchant.id] });
    } catch (e) { notify("No se pudo subir", errorMessage(e)); }
  };

  if (merchantQ.isLoading) {
    return <Screen><Header back={false} title="Revisión" /><Skeleton height={120} style={{ marginBottom: 12 }} /><Skeleton height={200} /></Screen>;
  }
  if (merchantQ.isError || !merchant) {
    return (
      <Screen>
        <Header back={false} title="Revisión" />
        {merchantQ.isError ? <ErrorState message={errorMessage(merchantQ.error)} onRetry={() => merchantQ.refetch()} /> : (
          <View style={{ paddingTop: 24 }}>
            <Text tone="muted" style={{ textAlign: "center", marginBottom: 16 }}>Aún no tienes un comercio registrado.</Text>
            <Button title="Registrar mi comercio" onPress={() => router.replace("/(onboarding)/merchant-register")} />
          </View>
        )}
      </Screen>
    );
  }

  const rejected = merchant.status === "rejected" || merchant.status === "suspended";
  const docs = docsQ.data ?? [];
  const latestByType = Object.keys(DOC_LABEL).map((type) => ({ type, doc: [...docs].reverse().find((d) => d.doc_type === type) ?? null }));

  return (
    <Screen refreshing={merchantQ.isFetching} onRefresh={() => { merchantQ.refetch(); docsQ.refetch(); }}
      footer={<View>
        <Button title="Contactar soporte" variant="secondary" onPress={() => Linking.openURL(`tel:${(supportPhone ?? "").replace(/\s/g, "")}`).catch(() => {})} />
        <Button title="Cerrar sesión" variant="ghost" onPress={() => signOut()} style={{ marginTop: 6 }} />
      </View>}>
      <Header back={false} title="Tu comercio" />
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: rejected ? colors.redSoft : colors.yellowSoft, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={rejected ? "close-circle-outline" : "time-outline"} size={36} color={rejected ? colors.red : "#8A6400"} />
        </View>
        <Text variant="title" style={{ marginTop: 14, textAlign: "center" }}>{rejected ? "Tu solicitud necesita cambios" : "Estamos revisando tu comercio"}</Text>
        <Text tone="muted" style={{ marginTop: 6, textAlign: "center" }}>
          {rejected ? merchant.review_notes ?? "Contacta a soporte para conocer los detalles." : "Revisamos los datos y documentos en 1 a 2 días hábiles. Te avisaremos cuando esté listo."}
        </Text>
      </View>
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{merchant.name}</Text>
            <Text variant="caption" tone="muted">{merchant.address ?? ""}</Text>
          </View>
          <Badge label={MERCHANT_STATUS_LABEL[merchant.status]} tone={rejected ? "red" : merchant.status === "under_review" ? "yellow" : "gray"} />
        </View>
      </Card>
      <Text variant="heading" style={{ marginBottom: 6 }}>Documentos</Text>
      {docsQ.isLoading ? <Skeleton height={56} style={{ marginBottom: 8 }} /> : latestByType.map(({ type, doc }) => (
        <ListRow key={type} icon="document-text-outline" title={DOC_LABEL[type]} subtitle={doc ? `Enviado · ${DOC_STATUS[doc.status]}${doc.notes ? ` · ${doc.notes}` : ""}` : "Pendiente de subir"}
          right={doc ? <Badge label={DOC_STATUS[doc.status]} tone={DOC_TONE[doc.status]} /> : null}
          onPress={!doc || doc.status === "rejected" ? () => addDoc(type) : undefined} chevron={false} />
      ))}
      <Text variant="caption" tone="subtle" style={{ marginTop: 12 }}>Toca un documento pendiente o rechazado para subirlo de nuevo.</Text>
    </Screen>
  );
}
