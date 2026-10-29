import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, ORDER_STATUS_LABEL, type OrderStatus } from "@yava/shared";
import { Text } from "@/components/ui";
import type { OrderSummaryRow } from "@/features/customer/types";
import { relativeDateTime, etaLabel } from "@/features/customer/helpers";
import { ft } from "@/components/customer/account/kit";
import { LineIcon } from "@/components/customer/account/icons";
import { orderMerchantPhoto } from "@/components/customer/account/photos";

/** En web un `<button>` no puede contener otro: la tarjeta solo se anuncia como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);

/** Colores de la insignia de estado (36: "✓ Entregado" verde; los demás estados con el mismo formato). */
const STATUS_STYLE: Record<OrderStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  delivered: { bg: "#E5FAEF", fg: "#0B7A2E", icon: "checkmark-circle", iconColor: "#08913A" },
  cancelled: { bg: colors.redSoft, fg: colors.red, icon: "close-circle", iconColor: colors.red },
  pending_payment: { bg: colors.amberSoft, fg: "#8A5A00", icon: "alert-circle", iconColor: colors.amber },
  placed: { bg: colors.blueSoft, fg: colors.blueText, icon: "time", iconColor: colors.blue },
  accepted: { bg: colors.blueSoft, fg: colors.blueText, icon: "checkmark-circle", iconColor: colors.blue },
  preparing: { bg: colors.blueSoft, fg: colors.blueText, icon: "restaurant", iconColor: colors.blue },
  ready: { bg: colors.blueSoft, fg: colors.blueText, icon: "bag-check", iconColor: colors.blue },
  assigned: { bg: colors.blueSoft, fg: colors.blueText, icon: "bicycle", iconColor: colors.blue },
  picked_up: { bg: colors.blueSoft, fg: colors.blueText, icon: "bicycle", iconColor: colors.blue },
  on_the_way: { bg: colors.blueSoft, fg: colors.blueText, icon: "bicycle", iconColor: colors.blue },
};

/** Insignia de estado del pedido (C24 "✓ Entregado": píldora 25 pt, ícono 15 pt + texto 10 pt medium). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={15.5} color={s.iconColor} style={{ marginRight: 4.5 }} />
      <Text style={ft(9.7, "500", s.fg, 14)} numberOfLines={1}>{ORDER_STATUS_LABEL[status]}</Text>
    </View>
  );
}

/** Botón de la tarjeta (C15d outline azul / C15a primario), 168 × 35 pt radio 10. */
function CardButton({ title, onPress, primary }: { title: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => [styles.btn, primary ? styles.btnPrimary : styles.btnOutline, pressed && { opacity: 0.85 }]}>
      <Text style={ft(11.9, "600", primary ? colors.white : colors.blueText, 16)} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

/**
 * C20b · Tarjeta de pedido de "Mis pedidos" (36): 367 × 155 pt, radio 18, borde `#ECF0F8`; miniatura 84 × 81 radio 14;
 * nombre 16,5 pt semibold y "2 productos"; a la derecha la insignia de estado, la fecha ("Hoy · 12:40") y el total;
 * abajo "Ver detalle" (outline azul) + "Volver a pedir" (azul). Un pedido en curso muestra "Seguir pedido".
 * `onRate` se conserva por compatibilidad: la calificación se hace desde el detalle del pedido entregado (23).
 */
export function OrderCard({ o, onPress, onReorder, onRate }: { o: OrderSummaryRow; onPress: () => void; onReorder?: () => void; onRate?: () => void }) {
  const shipment = o.type === "shipment";
  const title = shipment ? "Envío" : (o.merchant_name ?? "Pedido");
  const count = Number(o.items_count ?? 0);
  const active = Boolean(o.status && !["delivered", "cancelled"].includes(o.status));
  const when = active && o.eta_min ? `Llega en ${etaLabel(o.eta_min, o.eta_max).replace("-", "–")}` : relativeDateTime(o.delivered_at ?? o.cancelled_at ?? o.placed_at);
  const photo = shipment ? undefined : orderMerchantPhoto(o.merchant_name, o.merchant_logo);
  const canReorder = Boolean(onReorder) && !shipment && !active;
  const rateLater = !active && o.status === "delivered" && onRate && !canReorder;

  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={`${title}, pedido #${o.number}`}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]}>
      <View style={styles.top}>
        {photo ? (
          <Image source={photo} style={styles.photo} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.photo, styles.photoShipment]}><LineIcon name="box" size={40} color="#8A6400" /></View>
        )}
        <View style={styles.info}>
          <Text style={ft(16.3, "600", colors.ink, 21)} numberOfLines={1}>{title}</Text>
          <Text style={[ft(11.1, "400", "#6E7891", 16), { marginTop: 1 }]} numberOfLines={1}>
            {shipment ? `Paquete · #${o.number}` : `${count} ${count === 1 ? "producto" : "productos"}`}
          </Text>
        </View>
        <View style={styles.side}>
          {o.status ? <OrderStatusBadge status={o.status} /> : null}
          {when ? <Text style={[ft(11, "400", "#6E7891", 15), { marginTop: 4.7 }]} numberOfLines={1}>{when}</Text> : null}
          <Text style={[ft(14, "700", colors.ink, 19), styles.total]}>{formatCOP(o.total)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <CardButton title={active ? "Seguir pedido" : "Ver detalle"} onPress={onPress} primary={active && !canReorder} />
        {canReorder ? <CardButton title="Volver a pedir" onPress={onReorder!} primary /> : null}
        {rateLater ? <CardButton title="Calificar" onPress={onRate!} primary /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: "#ECF0F8", paddingHorizontal: 10.6, paddingTop: 10.6, paddingBottom: 10.7 },
  top: { flexDirection: "row", height: 82 },
  photo: { width: 84.5, height: 81.5, borderRadius: 14, backgroundColor: colors.surfaceGray },
  photoShipment: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFF4D1" },
  info: { flex: 1, marginLeft: 13.6, paddingTop: 12.6 },
  side: { alignItems: "flex-end", paddingTop: 0 },
  total: { position: "absolute", right: 0, top: 63 },
  badge: { flexDirection: "row", alignItems: "center", height: 25.4, borderRadius: 13, paddingLeft: 7, paddingRight: 8.6 },
  actions: { flexDirection: "row", gap: 7.4, marginTop: 14.6 },
  btn: { flex: 1, height: 35.1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnOutline: { backgroundColor: colors.white, borderWidth: 1.3, borderColor: "#1F5BD6" },
  btnPrimary: { backgroundColor: "#0046BA" },
});
