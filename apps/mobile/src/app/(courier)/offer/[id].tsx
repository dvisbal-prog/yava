import React from "react";
import { View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatTime } from "@yava/shared";
import { Screen, Header, Text, Button, Card, Badge, Skeleton, Divider } from "@/components/ui";
import { MapCard } from "@/components/courier/MapCard";
import { ErrorState } from "@/components/merchant/Rows";
import { useAvailableOrder, useAcceptOrder, useCourierOrder } from "@/features/courier/useCourier";
import { formatKm } from "@/features/courier/types";
import { parseAddress, addressLine } from "@/features/merchant/types";
import { errorMessage } from "@/lib/errors";

/** Pantalla 61 · Nueva entrega (oferta). */
export default function CourierOffer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const offerQ = useAvailableOrder(id);
  const orderQ = useCourierOrder(id);
  const accept = useAcceptOrder();
  const o = offerQ.data;
  const full = orderQ.data;

  const onAccept = async () => {
    if (!id) return;
    try {
      await accept.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(`/(courier)/deliveries/${id}/pickup`);
    } catch (e) {
      Alert.alert("No se pudo aceptar", errorMessage(e), [{ text: "Volver", onPress: () => router.back() }]);
    }
  };

  if (offerQ.isLoading) return <Screen><Header title="Nueva entrega" /><Skeleton height={180} style={{ marginBottom: 12 }} /><Skeleton height={160} /></Screen>;
  if (offerQ.isError) return <Screen><Header title="Nueva entrega" /><ErrorState message={errorMessage(offerQ.error)} onRetry={() => offerQ.refetch()} /></Screen>;
  if (!o) return <Screen><Header title="Nueva entrega" /><ErrorState message="Esta entrega ya no está disponible." onRetry={() => router.back()} /></Screen>;

  const addr = parseAddress(o.delivery_address);
  const isCash = full?.payment_method === "cash";

  return (
    <Screen padded={false} footer={<View>
      <Button title="Aceptar entrega" onPress={onAccept} loading={accept.isPending} icon="checkmark" />
      <Button title="Rechazar" variant="ghost" onPress={() => router.back()} disabled={accept.isPending} style={{ marginTop: 6 }} />
    </View>}>
      <Header title="Nueva entrega" subtitle={`Pedido #${o.number} · ${formatTime(o.placed_at)}`} />
      <View style={{ paddingHorizontal: 16 }}>
        <MapCard height={180} pins={[
          ...(o.merchant_lat != null && o.merchant_lng != null ? [{ lat: o.merchant_lat, lng: o.merchant_lng, kind: "merchant" as const, title: o.merchant_name ?? "Recogida" }] : []),
          ...(o.delivery_lat != null && o.delivery_lng != null ? [{ lat: o.delivery_lat, lng: o.delivery_lng, kind: "customer" as const, title: "Entrega" }] : []),
        ]} />
        <Card style={{ marginTop: 14, alignItems: "center", backgroundColor: colors.blueSoft, borderColor: colors.blueSoft }}>
          <Text variant="caption" tone="muted">Pago al repartidor</Text>
          <Text variant="display" tone="primary">{formatCOP(o.courier_payout)}</Text>
          {o.distance_km != null ? <Badge label={`A ${formatKm(o.distance_km)} de ti`} tone="blue" /> : null}
        </Card>
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name="storefront-outline" size={20} color={colors.blue} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone="muted">Recoger en</Text>
              <Text variant="bodyStrong">{o.merchant_name ?? "Punto de recogida"}</Text>
              <Text tone="muted">{o.merchant_address ?? ""}</Text>
            </View>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Ionicons name="home-outline" size={20} color={colors.red} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone="muted">Entregar en</Text>
              <Text variant="bodyStrong">{addr.label ?? "Dirección"}</Text>
              <Text tone="muted">{addressLine(addr)}</Text>
              {addr.instructions ? <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>{addr.instructions}</Text> : null}
            </View>
          </View>
        </Card>
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={isCash ? "cash-outline" : "card-outline"} size={20} color={isCash ? colors.red : colors.green} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{isCash ? `Cobrar ${formatCOP(o.total)} en efectivo` : "Pagado en línea"}</Text>
              <Text variant="caption" tone="muted">{isCash ? "Debes recibir el pago del cliente al entregar." : `Total del pedido ${formatCOP(o.total)} · no cobras nada.`}</Text>
            </View>
          </View>
        </Card>
        <Text variant="caption" tone="subtle" style={{ marginTop: 12 }}>Solo puedes tener una entrega en curso a la vez.</Text>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
