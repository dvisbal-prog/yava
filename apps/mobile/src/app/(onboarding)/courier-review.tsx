import React, { useEffect } from "react";
import { View, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, COURIER_STATUS_LABEL } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Badge, Skeleton, ListRow } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { useMyCourier, useCourierDocuments, useRealtimeCourier } from "@/features/courier/useCourier";
import { COURIER_DOC_TYPES, DOC_STATUS_LABEL } from "@/features/courier/types";
import { usePlatformSetting } from "@/features/merchant/useMerchant";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 59 · Recibimos tus documentos / estado de la cuenta. */
export default function CourierReview() {
  const router = useRouter();
  const { session, signOut, refreshProfile } = useAuth();
  const uid = session?.user.id;
  const courierQ = useMyCourier();
  const docsQ = useCourierDocuments();
  const { data: supportPhone } = usePlatformSetting<string>("support_phone", "+57 300 000 0000");
  useRealtimeCourier(uid);

  const refetchCourier = courierQ.refetch;
  useEffect(() => {
    const t = setInterval(() => { refetchCourier(); }, 20_000);
    return () => clearInterval(t);
  }, [refetchCourier]);

  useEffect(() => {
    if (courierQ.data?.status === "active") { refreshProfile().finally(() => router.replace("/(courier)")); }
  }, [courierQ.data?.status, refreshProfile, router]);

  if (courierQ.isLoading) return <Screen><Header back={false} title="Revisión" /><Skeleton height={140} style={{ marginBottom: 12 }} /><Skeleton height={200} /></Screen>;
  if (courierQ.isError) return <Screen><Header back={false} title="Revisión" /><ErrorState message={errorMessage(courierQ.error)} onRetry={() => courierQ.refetch()} /></Screen>;
  const c = courierQ.data;
  if (!c) return <Screen><Header back={false} title="Revisión" /><Text tone="muted" style={{ marginTop: 24, textAlign: "center" }}>Aún no te has registrado como repartidor.</Text><Button title="Empezar registro" onPress={() => router.replace("/(onboarding)/courier-register")} style={{ marginTop: 16 }} /></Screen>;

  const pending = c.status === "pending";
  const suspended = c.status === "suspended";
  const docs = docsQ.data ?? [];
  const received = COURIER_DOC_TYPES.filter((t) => docs.some((d) => d.doc_type === t.type));

  return (
    <Screen refreshing={courierQ.isFetching} onRefresh={() => { courierQ.refetch(); docsQ.refetch(); }}
      footer={<View>
        <Button title={pending ? "Subir documentos" : "Ver estado de mi cuenta"} onPress={pending ? () => router.replace("/(onboarding)/courier-documents") : () => courierQ.refetch()} loading={courierQ.isFetching && !pending} />
        <Button title="Contactar soporte" variant="ghost" onPress={() => Linking.openURL(`tel:${(supportPhone ?? "").replace(/\s/g, "")}`).catch(() => {})} style={{ marginTop: 6 }} />
      </View>}>
      <Header back={false} title="Tu cuenta" right={<Button title="Salir" size="sm" variant="ghost" full={false} onPress={() => signOut()} />} />
      <Text variant="caption" tone="primary" style={{ fontWeight: "600", marginTop: 8 }}>Paso 3 de 3</Text>
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: suspended ? colors.redSoft : colors.yellowSoft, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={suspended ? "ban-outline" : pending ? "cloud-upload-outline" : "time-outline"} size={36} color={suspended ? colors.red : "#8A6400"} />
        </View>
        <Text variant="title" style={{ marginTop: 14, textAlign: "center" }}>
          {suspended ? "Tu cuenta está suspendida" : pending ? "Faltan tus documentos" : "Recibimos tus documentos"}
        </Text>
        <Text tone="muted" style={{ marginTop: 6, textAlign: "center" }}>
          {suspended ? c.review_notes ?? "Contacta a soporte para más información." : pending ? "Súbelos para que podamos revisar tu cuenta." : "Tu cuenta está en revisión. Te avisaremos cuando haya una actualización."}
        </Text>
      </View>
      <Card style={{ marginBottom: 16 }}>
        <Text variant="small" tone="muted" style={{ letterSpacing: 1 }}>ESTADO DE TU CUENTA</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
          <Text variant="heading" style={{ flex: 1 }}>{COURIER_STATUS_LABEL[c.status]}</Text>
          <Badge label={COURIER_STATUS_LABEL[c.status]} tone={suspended ? "red" : c.status === "under_review" ? "yellow" : "gray"} />
        </View>
      </Card>
      <Text variant="heading" style={{ marginBottom: 4 }}>Documentos</Text>
      {docsQ.isLoading ? <Skeleton height={56} /> : received.length === 0 ? <Text tone="muted" variant="caption">Todavía no has subido documentos.</Text> : received.map((t) => {
        const doc = [...docs].reverse().find((d) => d.doc_type === t.type);
        if (!doc) return null;
        return <ListRow key={t.type} icon="checkmark-circle-outline" title={`${t.label} recibido`} subtitle={doc.notes ?? DOC_STATUS_LABEL[doc.status]} right={<Badge label={DOC_STATUS_LABEL[doc.status]} tone={doc.status === "approved" ? "green" : doc.status === "rejected" ? "red" : "yellow"} />} chevron={false} />;
      })}
    </Screen>
  );
}
