import React, { useEffect, useId, useRef, useState } from "react";
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatTime, formatCOP, ORDER_STATUS_LABEL } from "@yava/shared";
import { Text, EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { ErrorState } from "@/components/customer";
import { NavBar, RowChevron, ft } from "@/components/customer/account/kit";
import { LineIcon } from "@/components/customer/account/icons";
import { supportOrderPhoto } from "@/components/customer/account/photos";
import { useMyOpenSupportCase, useSupportMessages, useOrder, loginHref, type SupportCaseRow, type SupportMessageRow } from "@/features/customer";

/** Colores del chat de soporte (40): burbuja entrante gris, propia azul, campo relleno. */
const BUBBLE_IN = "#EBEEF2";
const BUBBLE_MINE = "#0041AC";
const FIELD_BG = "#F2F4F6";

/** Avatar circular de soporte (`blueSoft` + audífonos azules): 42 pt en el encabezado, 36 pt junto a las burbujas. */
function SupportAvatar({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#E5EDFD", alignItems: "center", justifyContent: "center" }}>
      <LineIcon name="headset" size={size * 0.64} color="#0A2E8A" stroke={2.1} />
    </View>
  );
}

/** Burbuja entrante con avatar y hora debajo, o propia (azul, texto blanco) con hora y doble check. */
function Bubble({ body, time, mine }: { body: string; time?: string; mine: boolean }) {
  if (mine) {
    return (
      <View style={styles.mineWrap}>
        <View style={[styles.bubble, styles.bubbleMine]}><Text style={ft(15.1, "400", colors.white, 21)}>{body}</Text></View>
        {time ? (
          <View style={styles.mineMeta}>
            <Text style={ft(10.4, "400", "#6E7689", 14)}>{time}</Text>
            <Ionicons name="checkmark-done" size={16} color={colors.blueText} style={{ marginLeft: 5 }} />
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.theirsWrap}>
      <View style={styles.theirsAvatar}><SupportAvatar size={36} /></View>
      <View style={styles.theirsCol}>
        <View style={[styles.bubble, styles.bubbleTheirs, { paddingHorizontal: 13.8 }]}><Text style={ft(15.1, "400", colors.ink, 21.2)}>{body}</Text></View>
        {time ? <Text style={[ft(10.4, "400", "#6E7689", 14), { marginTop: 4.5, marginLeft: 0.5 }]}>{time}</Text> : null}
      </View>
    </View>
  );
}

/**
 * Pantalla 40 · Chat con soporte (tanda-05/40-chat-soporte.png): chevron + avatar de soporte + "Soporte YAVA" /
 * "Pedido #1042", tarjeta del pedido, burbujas (entrante gris con avatar; propia azul) y compositor con clip,
 * campo relleno y botón de enviar. Mensajes en `support_cases` + `support_messages` en tiempo real.
 */
export default function Support() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ order?: string }>();
  const orderId = params.order ?? null;
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const uid = session?.user.id;
  const order = useOrder(orderId ?? undefined);
  const openCase = useMyOpenSupportCase(orderId);
  const caseId = openCase.data?.id;
  const messages = useSupportMessages(caseId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<SupportMessageRow>>(null);
  // Topic único por instancia: dos pantallas de soporte apiladas no deben compartir canal (mismo fallo que B3).
  const channelSuffix = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    if (!caseId) return;
    const ch = supabase.channel(`support:${caseId}:${channelSuffix}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `case_id=eq.${caseId}` }, () => { void qc.invalidateQueries({ queryKey: ["support-messages", caseId] }); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [caseId, qc, channelSuffix]);

  useEffect(() => { if (messages.data?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50); }, [messages.data?.length]);

  async function ensureCase(): Promise<string> {
    if (caseId) return caseId;
    const o = order.data;
    const { data, error: e } = await supabase.from("support_cases").insert({
      opened_by: uid as string, opener_role: "customer", order_id: orderId, category: o ? "order" : "general",
      subject: o ? `Pedido #${o.number}` : "Consulta general", description: null, status: "open", priority: "normal",
    }).select().single();
    if (e) throw e;
    const row = data as SupportCaseRow;
    await qc.invalidateQueries({ queryKey: ["support-case"] });
    return row.id;
  }

  async function send() {
    const body = text.trim();
    if (!body || !uid) return;
    setSending(true); setError(null);
    try {
      const cid = await ensureCase();
      const { error: e } = await supabase.from("support_messages").insert({ case_id: cid, sender_id: uid, body });
      if (e) throw e;
      setText("");
      void qc.invalidateQueries({ queryKey: ["support-messages", cid] });
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSending(false); }
  }

  const o = order.data;
  const subtitle = o ? `Pedido #${o.number}` : openCase.data ? `Caso #${openCase.data.number}` : "Te respondemos en minutos";
  const header = (
    <NavBar height={61.4} backLeft={16.6} chevronHeight={18.1} chevronStroke={2.2}>
      <View style={styles.headRow}>
        <SupportAvatar size={42} />
        <View style={{ marginLeft: 10.6 }}>
          <Text style={ft(14.9, "700", colors.ink, 19)} accessibilityRole="header">Soporte YAVA</Text>
          <Text style={[ft(12.5, "400", "#6E7689", 17), { marginTop: 2.6 }]}>{subtitle}</Text>
        </View>
      </View>
    </NavBar>
  );

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {header}
        <EmptyState icon="chatbubble-ellipses-outline" title="Inicia sesión" body="Así podemos ayudarte con tus pedidos." actionTitle="Iniciar sesión"
          onAction={() => router.push(loginHref(`/(customer)/support${orderId ? `?order=${orderId}` : ""}`) as never)} />
      </View>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const greeting = `Hola${firstName ? `, ${firstName}` : ""}. ¿En qué podemos ayudarte${o ? " con tu pedido" : ""}?`;
  // El saludo local solo hace falta mientras soporte no haya escrito: si la conversación ya empieza con un
  // mensaje de soporte (su propio saludo), no se repite.
  const firstMsg = messages.data?.[0];
  const supportOpened = Boolean(firstMsg && firstMsg.sender_id !== uid);
  const openOrder = () => { if (o) router.push(o.status === "delivered" ? `/(customer)/order/${o.id}/delivered` as never : `/(customer)/order/${o.id}` as never); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {header}
      {o ? (
        <Pressable onPress={openOrder} accessibilityRole="button" accessibilityLabel={`Ver pedido #${o.number}`}
          style={({ pressed }) => [styles.orderCard, pressed && { opacity: 0.9 }]}>
          {o.type === "shipment" ? (
            <View style={[styles.orderPhoto, styles.orderShipment]}><LineIcon name="box" size={40} color="#8A6400" /></View>
          ) : (
            <Image source={supportOrderPhoto(o.merchant_name, o.merchant_logo)} style={styles.orderPhoto} contentFit="cover" transition={120} />
          )}
          <View style={{ flex: 1, marginLeft: 13.8 }}>
            <Text style={ft(14.8, "700", colors.ink, 19)} numberOfLines={1}>{o.type === "shipment" ? "Envío" : o.merchant_name}</Text>
            <Text style={[ft(13.1, "400", "#4C566E", 18), { marginTop: 4.4 }]} numberOfLines={1}>
              {formatCOP(o.total)}{o.status ? `  ·  ${ORDER_STATUS_LABEL[o.status]}` : ""}
            </Text>
          </View>
          <RowChevron color="#414C67" size={18} style={{ marginRight: 4.4 }} />
        </Pressable>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        {openCase.isLoading || (caseId && messages.isLoading) ? (
          <View style={styles.listPad}>
            <View style={{ flexDirection: "row", gap: 9 }}><Skeleton width={36} height={36} style={{ borderRadius: 18 }} /><Skeleton width={240} height={64} style={{ borderRadius: 20 }} /></View>
            <Skeleton width={190} height={50} style={{ borderRadius: 22, alignSelf: "flex-end", marginTop: 22 }} />
          </View>
        ) : openCase.error || messages.error ? (
          <ErrorState error={openCase.error ?? messages.error} onRetry={() => { void openCase.refetch(); void messages.refetch(); }} />
        ) : (
          <FlatList ref={listRef} data={messages.data ?? []} keyExtractor={(m) => String(m.id)} contentContainerStyle={styles.listPad}
            ListHeaderComponent={supportOpened ? undefined : <Bubble body={greeting} time={openCase.data?.created_at ? formatTime(openCase.data.created_at) : undefined} mine={false} />}
            ListEmptyComponent={
              <View style={styles.suggestions}>
                {["Necesito revisar un cobro.", "Mi pedido llegó incompleto.", "Mi pedido está demorado."].map((s) => (
                  <Pressable key={s} onPress={() => setText(s)} accessibilityRole="button" style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.8 }]}>
                    <Text style={ft(13.5, "500", colors.blueText, 18)}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            }
            renderItem={({ item }) => <Bubble body={item.body} time={formatTime(item.created_at)} mine={item.sender_id === uid} />} />
        )}
        {error ? <Text style={[ft(12.5, "400", colors.red, 17), { paddingHorizontal: 18 }]}>{error}</Text> : null}
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
          <View style={styles.attach} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name="attach" size={32} color="#3D465F" style={{ transform: [{ rotate: "45deg" }] }} />
          </View>
          <TextInput value={text} onChangeText={setText} placeholder="Escribe un mensaje" placeholderTextColor="#8A92A4" style={styles.input} multiline numberOfLines={Platform.OS === "web" ? 1 : undefined}
            accessibilityLabel="Mensaje para soporte" selectionColor={colors.blueText} />
          <Pressable onPress={send} disabled={sending || !text.trim()} accessibilityRole="button" accessibilityLabel="Enviar mensaje"
            style={[styles.send, sending && { opacity: 0.6 }]}>
            <Ionicons name="send" size={19} color={colors.white} style={{ marginLeft: 3 }} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headRow: { position: "absolute", left: 61, top: 0, bottom: 0, flexDirection: "row", alignItems: "center" },
  orderCard: { flexDirection: "row", alignItems: "center", height: 90.5, marginHorizontal: 13.9, marginTop: 11.1, borderRadius: 16, borderWidth: 1, borderColor: "#E3E8EF", backgroundColor: colors.white, paddingLeft: 8.2 },
  orderPhoto: { width: 98.4, height: 71.6, borderRadius: 12, backgroundColor: colors.surfaceGray },
  orderShipment: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFF4D1" },
  listPad: { paddingHorizontal: 14.3, paddingTop: 19, paddingBottom: 16, flexGrow: 1 },
  theirsWrap: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8.8 },
  theirsAvatar: { marginTop: 3.6 },
  theirsCol: { flexShrink: 1, marginLeft: 8.8, maxWidth: 271 },
  bubble: { paddingHorizontal: 14.8, paddingTop: 12.8, paddingBottom: 12.8 },
  bubbleTheirs: { backgroundColor: BUBBLE_IN, borderRadius: 20 },
  mineWrap: { alignItems: "flex-end", marginBottom: 14.6, marginRight: -1.2 },
  bubbleMine: { backgroundColor: BUBBLE_MINE, borderRadius: 22, paddingHorizontal: 17, maxWidth: 290 },
  mineMeta: { flexDirection: "row", alignItems: "center", marginTop: 3.4 },
  suggestions: { alignItems: "flex-end", gap: 8, paddingTop: 6 },
  suggestion: { borderWidth: 1.3, borderColor: "#1F5BD6", borderRadius: 18, paddingHorizontal: 14, height: 36, justifyContent: "center", backgroundColor: colors.white },
  composer: { flexDirection: "row", alignItems: "flex-end", paddingLeft: 14, paddingRight: 11, paddingTop: 8, backgroundColor: colors.white },
  attach: { width: 34, height: 48, alignItems: "center", justifyContent: "center", marginRight: 8 },
  input: { flex: 1, minHeight: 48.5, maxHeight: 120, borderRadius: 24.3, backgroundColor: FIELD_BG, paddingHorizontal: 19.4, paddingTop: 13.5, paddingBottom: 13.5, fontSize: 15.5, lineHeight: 21, color: colors.ink },
  send: { width: 43, height: 43, borderRadius: 21.5, backgroundColor: "#0047BD", alignItems: "center", justifyContent: "center", marginLeft: 6, marginBottom: 2.7 },
});
