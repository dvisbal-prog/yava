import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Screen, Header, Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useNotifications, relativeDateTime, loginHref, type NotificationRow } from "@/features/customer";

function iconFor(n: NotificationRow): keyof typeof Ionicons.glyphMap {
  const type = typeof n.data === "object" && n.data && !Array.isArray(n.data) ? String((n.data as { type?: unknown }).type ?? "") : "";
  if (type === "order_cancelled") return "close-circle-outline";
  if (type.startsWith("order")) return "bicycle-outline";
  if (type === "promo") return "pricetag-outline";
  return "notifications-outline";
}

/** Pantalla 38 · Notificaciones (se marcan como leídas al abrir). */
export default function Notifications() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const list = useNotifications();

  useEffect(() => {
    const unread = (list.data ?? []).filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    const t = setTimeout(async () => {
      await supabase.rpc("mark_notifications_read", { p_ids: unread });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    }, 1200);
    return () => clearTimeout(t);
  }, [list.data, qc]);

  function open(n: NotificationRow) {
    const d = typeof n.data === "object" && n.data && !Array.isArray(n.data) ? (n.data as { order_id?: unknown }) : {};
    if (typeof d.order_id === "string") router.push(`/(customer)/order/${d.order_id}` as never);
  }

  if (!session) {
    return <Screen><Header title="Notificaciones" /><EmptyState icon="notifications-outline" title="Inicia sesión" body="Recibe avisos de tus pedidos y ofertas." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/notifications") as never)} /></Screen>;
  }

  return (
    <Screen refreshing={list.isRefetching} onRefresh={() => { void list.refetch(); }}>
      <Header title="Notificaciones" />
      <View style={{ marginTop: 8 }}>
        {list.isLoading ? <ListSkeleton rows={4} height={48} /> : list.error ? <ErrorState error={list.error} onRetry={() => { void list.refetch(); }} /> : !list.data?.length ? (
          <EmptyState icon="notifications-off-outline" title="Sin notificaciones" body="Aquí verás el estado de tus pedidos y las novedades de YAVA." />
        ) : list.data.map((n) => (
          <Pressable key={n.id} onPress={() => open(n)} style={[styles.row, !n.read_at && { backgroundColor: colors.blueSoft }]}>
            <View style={styles.icon}><Ionicons name={iconFor(n)} size={20} color={colors.blue} /></View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{n.title}</Text>
              {n.body ? <Text variant="caption" tone="muted">{n.body}</Text> : null}
              <Text variant="small" tone="subtle" style={{ marginTop: 2 }}>{relativeDateTime(n.created_at)}</Text>
            </View>
            {!n.read_at ? <View style={styles.dot} /> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: radius.md, marginBottom: 6 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, alignItems: "center", justifyContent: "center", marginRight: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 6 },
});
