import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { designImages } from "@/lib/design-images";
import { ErrorState } from "@/components/customer";
import { NavBar, ft } from "@/components/customer/account/kit";
import { useNotifications, relativeDateTime, loginHref, type NotificationRow } from "@/features/customer";

/** Punto de no leído (38 mide #0456FA). */
const UNREAD_BLUE = "#0456FA";

function dataOf(n: NotificationRow): { type?: unknown; order_id?: unknown } {
  return typeof n.data === "object" && n.data && !Array.isArray(n.data) ? (n.data as { type?: unknown; order_id?: unknown }) : {};
}

/**
 * Baldosa de la notificación (38): bolsa con check verde (entregado), moto azul (en camino) o recibo amarillo
 * (confirmado / en preparación). Los demás tipos usan una baldosa del mismo tamaño con ícono.
 */
function Tile({ n }: { n: NotificationRow }) {
  const type = String(dataOf(n).type ?? "");
  const title = (n.title ?? "").toLowerCase();
  let img: number | undefined;
  if (type === "order_delivered" || title.includes("entregado")) img = designImages.notifEntregado;
  else if (title.includes("camino") || title.includes("recogido") || title.includes("repartidor")) img = designImages.notifEnCamino;
  else if (type === "order_status" || title.includes("confirmado") || title.includes("preparando") || title.includes("listo")) img = designImages.notifConfirmado;
  if (img !== undefined) return <Image source={img} style={styles.tile} contentFit="cover" />;
  const danger = type === "order_cancelled" || type === "payment_failed";
  return (
    <View style={[styles.tile, styles.tileIcon, { backgroundColor: danger ? colors.redSoft : colors.blueSoft }]}>
      <Ionicons name={danger ? "close-circle" : type === "promo" ? "pricetag" : "notifications"} size={24} color={danger ? colors.red : colors.blue} />
    </View>
  );
}

/** "Hoy · 12:40" → { day: "Hoy", time: "12:40" }. */
function splitWhen(iso: string | null | undefined): { day: string; time: string } {
  const [day = "", time = ""] = relativeDateTime(iso).split(" · ");
  return { day, time };
}

/**
 * Pantalla 38 · Notificaciones (tanda-05/38-notificaciones.png): chevron, título centrado y "Marcar como leídas";
 * grupos por día ("Hoy", "Ayer", "18 oct") con filas de baldosa 52 pt, título, texto, hora y punto azul si no se ha leído.
 * Se marcan como leídas con el botón o al abrir cada una.
 */
export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const list = useNotifications();
  const [marking, setMarking] = useState(false);
  const unreadIds = useMemo(() => (list.data ?? []).filter((n) => !n.read_at).map((n) => n.id), [list.data]);

  const groups = useMemo(() => {
    const out: { day: string; items: NotificationRow[] }[] = [];
    for (const n of list.data ?? []) {
      const { day } = splitWhen(n.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(n);
      else out.push({ day, items: [n] });
    }
    return out;
  }, [list.data]);

  async function markRead(ids: NotificationRow["id"][]) {
    if (!ids.length) return;
    const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
    if (error) throw error;
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markAll() {
    if (!unreadIds.length || marking) return;
    setMarking(true);
    try { await markRead(unreadIds); } catch (e) { notify("No se pudieron marcar", errorMessage(e)); } finally { setMarking(false); }
  }

  function open(n: NotificationRow) {
    if (!n.read_at) void markRead([n.id]).catch(() => undefined);
    const d = dataOf(n);
    if (typeof d.order_id === "string") router.push(`/(customer)/order/${d.order_id}` as never);
  }

  const markButton = session && list.data?.length ? (
    <Pressable onPress={() => { void markAll(); }} disabled={!unreadIds.length || marking} hitSlop={10} accessibilityRole="button"
      accessibilityState={{ disabled: !unreadIds.length || marking }} accessibilityLabel="Marcar todas como leídas" style={{ marginTop: -2.7 }}>
      <Text style={ft(10.9, "500", unreadIds.length ? colors.blueLink : colors.textPlaceholder, 15)}>Marcar como leídas</Text>
    </Pressable>
  ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar title="Notificaciones" center titleStyle={styles.title} height={54} backLeft={19.4} chevronHeight={17.6} chevronStroke={2.1}
        right={markButton} rightInset={15.3} />
      {!session ? (
        <EmptyState icon="notifications-outline" title="Inicia sesión" body="Recibe avisos de tus pedidos y ofertas." actionTitle="Iniciar sesión"
          onAction={() => router.push(loginHref("/(customer)/notifications") as never)} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => { void list.refetch(); }} tintColor={colors.blue} />}>
          {list.isLoading ? (
            <View style={styles.pad}>
              <Skeleton width={46} height={20} style={{ marginTop: 20, marginBottom: 16 }} />
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.row, { paddingLeft: 21 }]}>
                  <Skeleton width={52} height={52} style={{ borderRadius: 14 }} />
                  <View style={{ flex: 1, marginLeft: 16, gap: 8 }}><Skeleton width="60%" height={14} /><Skeleton width="80%" height={11} /></View>
                </View>
              ))}
            </View>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={() => { void list.refetch(); }} />
          ) : !list.data?.length ? (
            <EmptyState icon="notifications-off-outline" title="Sin notificaciones" body="Aquí verás el estado de tus pedidos y las novedades de YAVA." />
          ) : groups.map((g, gi) => (
            <View key={`${g.day}-${gi}`} style={styles.pad}>
              <Text style={[styles.day, gi > 0 && { marginTop: 22 }]} accessibilityRole="header">{g.day}</Text>
              {g.items.map((n, i) => {
                const { time } = splitWhen(n.created_at);
                const unread = !n.read_at;
                return (
                  <Pressable key={n.id} onPress={() => open(n)} accessibilityRole="button"
                    accessibilityLabel={`${unread ? "Sin leer. " : ""}${n.title}. ${n.body ?? ""}`}
                    style={({ pressed }) => [styles.row, i < g.items.length - 1 && styles.rowDivider, pressed && { opacity: 0.7 }]}>
                    <View style={styles.dotBox}>{unread ? <View style={styles.dot} /> : null}</View>
                    <Tile n={n} />
                    <View style={styles.texts}>
                      <Text style={ft(14.3, "700", colors.ink, 20)} numberOfLines={1}>{n.title}</Text>
                      {n.body ? <Text style={[ft(12.2, "400", "#6E7689", 17), { marginTop: 0.8 }]} numberOfLines={2}>{n.body}</Text> : null}
                    </View>
                    <Text style={[ft(11.4, "400", "#6E7689", 15), styles.time]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  title: { ...ft(16.7, "700", colors.ink, 22), marginHorizontal: 100 },
  pad: { paddingHorizontal: 18.1 },
  day: { ...ft(19.5, "700", colors.ink, 25), letterSpacing: -0.3, marginTop: 13.2, marginBottom: 2.2 },
  row: { flexDirection: "row", alignItems: "flex-start", paddingTop: 14.7, paddingBottom: 13.6 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#E3E6ED" },
  dotBox: { width: 20.3, height: 52, justifyContent: "center" },
  dot: { width: 12.5, height: 12.5, borderRadius: 6.25, backgroundColor: UNREAD_BLUE },
  tile: { width: 52.3, height: 52, borderRadius: 14 },
  tileIcon: { alignItems: "center", justifyContent: "center" },
  texts: { flex: 1, marginLeft: 16.2, paddingTop: 8.3, paddingRight: 8 },
  time: { marginTop: 10.1 },
});
