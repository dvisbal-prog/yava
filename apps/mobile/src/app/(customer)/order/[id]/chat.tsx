import React, { useEffect, useRef, useState } from "react";
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, formatTime } from "@yava/shared";
import { Text, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { designImages } from "@/lib/design-images";
import { ErrorState, Avatar } from "@/components/customer";
import { OrderThumb, shortCourierName, t } from "@/components/customer/order/kit";
import { orderMerchantPhoto, courierPhoto } from "@/components/customer/order/photos";
import { useOrder, useMerchant, useOrderMessages, type OrderMessageRow } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

/** Colores medidos en tanda-03/22-chat-repartidor.png. */
const SUB = "#4C5870";
const TIME = "#5A6780";
const BUBBLE_IN = "#EEEFF3";
const BUBBLE_OUT = "#DCE9FD";

/** Respuestas rápidas del botón "+" (se copian al campo, no se envían solas). */
const QUICK = ["Ya bajo", "Estoy en la portería", "Llámame al llegar", "Gracias"];

/**
 * Pantalla 22 · Chat con el repartidor (tanda-03/22-chat-repartidor.png): encabezado con avatar, nombre,
 * "Tu repartidor" y botón de llamar; tarjeta del pedido; burbujas (entrante gris con avatar, propia azul claro
 * con ✓✓) y compositor con "+", campo píldora y enviar. Mensajes de `order_messages` en tiempo real.
 */
export default function OrderChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.session?.user.id);
  const order = useOrder(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const messages = useOrderMessages(id);
  useRealtimeOrder(id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quick, setQuick] = useState(false);
  const listRef = useRef<FlatList<OrderMessageRow>>(null);

  useEffect(() => { if (messages.data?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50); }, [messages.data?.length]);

  async function send() {
    const body = text.trim();
    if (!body || !uid) return;
    setSending(true); setError(null);
    try {
      const { error: e } = await supabase.from("order_messages").insert({ order_id: id, sender_id: uid, body });
      if (e) throw e;
      setText("");
      setQuick(false);
      void qc.invalidateQueries({ queryKey: ["order-messages", id] });
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSending(false); }
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(`/(customer)/order/${id}` as never));
  const disabled = !o?.courier_id;
  const courierName = o?.courier_id ? shortCourierName(o.courier_name, "Tu repartidor") : "Tu repartidor";
  const courierImg = courierPhoto(o?.courier_name, "chat");
  const m = merchant.data;
  const shipment = o?.type === "shipment";
  const cardPhoto = shipment ? designImages.envioCaja
    : o ? orderMerchantPhoto({ name: o.merchant_name ?? m?.name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo ?? m?.logo_url }, "chat") : undefined;
  const canSend = !disabled && !sending && Boolean(text.trim());

  const avatar = (size: number) => (courierImg
    ? <Image source={courierImg} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceGray }} contentFit="cover" />
    : <Avatar name={o?.courier_name ?? "Repartidor"} size={size} />);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Encabezado C28: ‹, avatar, nombre / "Tu repartidor", llamar */}
      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Atrás" hitSlop={6} style={styles.back}>
          <Ionicons name="chevron-back" size={25} color={colors.ink} />
        </Pressable>
        <View style={styles.headAvatar}>{order.isLoading && !o ? <Skeleton width={43} height={43} style={{ borderRadius: 22 }} /> : avatar(43)}</View>
        <View style={styles.headText}>
          <Text style={t(14.3, "700", colors.ink, 18)} numberOfLines={1} accessibilityRole="header">{courierName}</Text>
          <Text style={[t(11.45, "400", SUB, 15), { marginTop: 2.9 }]} numberOfLines={1}>{disabled ? "Aún sin asignar" : "Tu repartidor"}</Text>
        </View>
        {o?.courier_phone ? (
          <Pressable onPress={() => { void Linking.openURL(`tel:${o.courier_phone}`); }} accessibilityRole="button" accessibilityLabel="Llamar al repartidor"
            style={({ pressed }) => [styles.call, pressed && { opacity: 0.75 }]}>
            <Ionicons name="call-outline" size={20.5} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>

      {/* Tarjeta del pedido (C20a) */}
      {o ? (
        <Pressable onPress={() => router.push(`/(customer)/order/${id}` as never)} accessibilityRole="button" accessibilityLabel={`Ver pedido #${o.number}`}
          style={({ pressed }) => [styles.orderCard, pressed && { opacity: 0.85 }]}>
          <OrderThumb source={cardPhoto} width={103.4} height={57.3} radius={10} />
          <View style={styles.orderText}>
            <Text style={t(14.3, "600", colors.ink, 18)} numberOfLines={1}>{shipment ? "Envío" : o.merchant_name}</Text>
            <Text style={[t(11.1, "400", "#58657E", 15), { marginTop: 3.2 }]} numberOfLines={1}>Pedido #{o.number}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#5D687E" style={{ marginRight: 11.6 }} />
        </Pressable>
      ) : order.isLoading ? <Skeleton height={76} style={[styles.orderCard, { borderWidth: 0 }]} /> : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top}>
        {order.error ? <ErrorState error={order.error} onRetry={() => { void order.refetch(); }} />
          : messages.isLoading ? (
            <View style={{ paddingHorizontal: 15.2, paddingTop: 21, gap: 18 }}>
              <Skeleton width={230} height={40} style={{ borderRadius: 18, marginLeft: 50 }} />
              <Skeleton width={200} height={44} style={{ borderRadius: 18, alignSelf: "flex-end" }} />
            </View>
          )
          : messages.error ? <ErrorState error={messages.error} onRetry={() => { void messages.refetch(); }} />
          : (
            <FlatList ref={listRef} data={messages.data ?? []} keyExtractor={(msg) => String(msg.id)} style={{ flex: 1 }}
              contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <EmptyState compact icon="chatbubbles-outline" title={disabled ? "Aún no hay repartidor asignado" : `Escríbele a ${courierName}`}
                  body={disabled ? "Podrás chatear cuando un repartidor tome tu pedido." : "Indicaciones para llegar, portería, timbre…"} />
              }
              renderItem={({ item }) => {
                const mine = item.sender_id === uid;
                if (mine) {
                  return (
                    <View style={styles.mineBlock}>
                      <View style={[styles.bubble, styles.bubbleOut]}><Text style={t(13.6, "400", colors.ink, 18)}>{item.body}</Text></View>
                      <View style={styles.mineMeta}>
                        <Text style={t(9.6, "400", TIME, 13)}>{formatTime(item.created_at)}</Text>
                        <Ionicons name="checkmark-done" size={15} color="#0A3DC0" style={{ marginLeft: 5 }} />
                      </View>
                    </View>
                  );
                }
                return (
                  <View style={styles.inBlock}>
                    <View style={styles.inAvatar}>{avatar(38.4)}</View>
                    <View style={styles.inCol}>
                      <View style={[styles.bubble, styles.bubbleIn]}><Text style={t(13.6, "400", colors.ink, 18)}>{item.body}</Text></View>
                      <Text style={[t(9.6, "400", TIME, 13), styles.inTime]}>{formatTime(item.created_at)}</Text>
                    </View>
                  </View>
                );
              }} />
          )}

        {error ? <Text style={[t(12, "500", colors.red, 16), { paddingHorizontal: 17.5, paddingBottom: 6 }]}>{error}</Text> : null}

        {quick && !disabled ? (
          <View style={styles.quickRow}>
            {QUICK.map((q) => (
              <Pressable key={q} onPress={() => { setText(q); setQuick(false); }} accessibilityRole="button" style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.75 }]}>
                <Text style={t(12, "500", colors.blueText, 16)}>{q}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Compositor: + · campo píldora · enviar */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 15.6 }]}>
          <Pressable onPress={() => setQuick((v) => !v)} disabled={disabled} accessibilityRole="button" accessibilityLabel="Respuestas rápidas"
            accessibilityState={{ expanded: quick, disabled }} style={({ pressed }) => [styles.plus, (pressed || disabled) && { opacity: 0.6 }]}>
            <Ionicons name={quick ? "close" : "add"} size={25} color={colors.ink} />
          </Pressable>
          <TextInput value={text} onChangeText={setText} placeholder={disabled ? "Esperando repartidor…" : "Escribe un mensaje"} placeholderTextColor="#747D92"
            style={styles.input} editable={!disabled} multiline numberOfLines={Platform.OS === "web" ? 1 : undefined} onSubmitEditing={send} accessibilityLabel="Mensaje" />
          <Pressable onPress={send} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Enviar mensaje" accessibilityState={{ disabled: !canSend, busy: sending }}
            style={({ pressed }) => [styles.send, pressed && { backgroundColor: colors.blueDark }, !canSend && !text.trim() && { opacity: disabled ? 0.4 : 1 }]}>
            <Ionicons name="send" size={19} color={colors.white} style={{ marginLeft: 3 }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 64.2, flexDirection: "row", alignItems: "flex-start" },
  back: { position: "absolute", left: 8, top: 13, width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  headAvatar: { marginLeft: 53.1, marginTop: 11.8 },
  headText: { flex: 1, marginLeft: 10.2, marginTop: 14.8, paddingRight: 8 },
  call: { width: 37.4, height: 37.4, borderRadius: 18.7, backgroundColor: "#F1F2F6", alignItems: "center", justifyContent: "center", marginTop: 14.6, marginRight: 16.6 },
  orderCard: {
    flexDirection: "row", alignItems: "center", height: 76.2, marginLeft: 15.7, marginRight: 15.3, paddingLeft: 11.6,
    borderRadius: 16, borderWidth: 0.75, borderColor: "#E3E7ED", backgroundColor: colors.white,
  },
  orderText: { flex: 1, marginLeft: 14.3, paddingBottom: 1.8 },
  list: { paddingTop: 21.3, paddingBottom: 12, flexGrow: 1 },
  bubble: { paddingLeft: 14.3, paddingRight: 16.4, paddingTop: 9.6, paddingBottom: 12.5, borderRadius: 16 },
  // Entrante: arriba-izquierda menos redondeada y abajo-izquierda casi recta; propia: abajo-derecha recta (22).
  bubbleIn: { backgroundColor: BUBBLE_IN, borderTopLeftRadius: 11, borderBottomLeftRadius: 2 },
  bubbleOut: { backgroundColor: BUBBLE_OUT, borderBottomRightRadius: 0, paddingTop: 12.4, paddingBottom: 15.3, paddingLeft: 14.8, paddingRight: 16.1 },
  inBlock: { flexDirection: "row", alignItems: "flex-start", paddingLeft: 15.2, paddingRight: 60, marginBottom: 13.8 },
  inAvatar: { marginTop: 7.8 },
  inCol: { flexShrink: 1, marginLeft: 11.1, alignItems: "flex-start" },
  inTime: { marginTop: 5.7, marginLeft: 2.3 },
  mineBlock: { alignItems: "flex-end", paddingLeft: 60, paddingRight: 16.6, marginBottom: 18 },
  mineMeta: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12.5, paddingBottom: 10 },
  quickChip: { height: 32, borderRadius: 16, paddingHorizontal: 13, justifyContent: "center", backgroundColor: colors.blueTint, borderWidth: 1, borderColor: colors.blueChip },
  composer: { flexDirection: "row", alignItems: "flex-end", paddingLeft: 12.5, paddingRight: 13.3, paddingTop: 8, backgroundColor: colors.white },
  plus: { width: 39.7, height: 39.7, borderRadius: 19.85, backgroundColor: "#ECEDEF", alignItems: "center", justifyContent: "center", marginBottom: 2.15 },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, marginLeft: 7.8, marginRight: 6.5, borderWidth: 1, borderColor: "#E4E8EF", borderRadius: 22,
    paddingLeft: 21.8, paddingRight: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14.2, lineHeight: 18, color: colors.ink, backgroundColor: colors.white,
  },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", marginBottom: 1 },
});
