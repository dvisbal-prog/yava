import React, { useEffect, useRef, useState } from "react";
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatTime, formatCOP, ORDER_STATUS_LABEL } from "@yava/shared";
import { Header, Text, EmptyState, Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useMyOpenSupportCase, useSupportMessages, useOrder, loginHref, type SupportCaseRow, type SupportMessageRow } from "@/features/customer";

/** Pantalla 40 · Chat con soporte (support_cases + support_messages en tiempo real). */
export default function Support() {
  const router = useRouter();
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

  useEffect(() => {
    if (!caseId) return;
    const ch = supabase.channel(`support:${caseId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `case_id=eq.${caseId}` }, () => { void qc.invalidateQueries({ queryKey: ["support-messages", caseId] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [caseId, qc]);

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

  if (!session) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}><Header title="Soporte YAVA" /><EmptyState icon="chatbubble-ellipses-outline" title="Inicia sesión" body="Así podemos ayudarte con tus pedidos." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref(`/(customer)/support${orderId ? `?order=${orderId}` : ""}`) as never)} /></SafeAreaView>;
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const greeting = `Hola${firstName ? `, ${firstName}` : ""}. ¿En qué podemos ayudarte${order.data ? " con tu pedido" : ""}?`;
  const o = order.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <Header title="Soporte YAVA" subtitle={o ? `Pedido #${o.number}` : openCase.data ? `Caso #${openCase.data.number}` : undefined} />
      {o ? (
        <View style={styles.orderBar}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{o.type === "shipment" ? "Envío" : o.merchant_name}</Text>
          <Text variant="caption" tone="muted">{formatCOP(o.total)} · {o.status ? ORDER_STATUS_LABEL[o.status] : ""}</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        {openCase.isLoading || (caseId && messages.isLoading) ? <View style={{ padding: 16 }}><ListSkeleton rows={2} height={40} /></View> : openCase.error || messages.error ? (
          <ErrorState error={openCase.error ?? messages.error} onRetry={() => { void openCase.refetch(); void messages.refetch(); }} />
        ) : (
          <FlatList ref={listRef} data={messages.data ?? []} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
            ListHeaderComponent={<View style={[styles.bubble, styles.theirs]}><Text>{greeting}</Text></View>}
            ListEmptyComponent={
              <View style={{ paddingTop: 12, gap: 8 }}>
                {["Necesito revisar un cobro.", "Mi pedido llegó incompleto.", "Mi pedido está demorado."].map((s) => <Button key={s} title={s} variant="outline" size="md" onPress={() => setText(s)} />)}
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === uid;
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text tone={mine ? "inverse" : "default"}>{item.body}</Text>
                  <Text variant="small" style={{ color: mine ? "rgba(255,255,255,0.8)" : colors.gray400, marginTop: 2, alignSelf: "flex-end" }}>{formatTime(item.created_at)}</Text>
                </View>
              );
            }} />
        )}
        {error ? <Text tone="danger" variant="caption" style={{ paddingHorizontal: 16 }}>{error}</Text> : null}
        <View style={styles.inputRow}>
          <TextInput value={text} onChangeText={setText} placeholder="Escribe un mensaje" placeholderTextColor={colors.gray400} style={styles.input} multiline />
          <Pressable onPress={send} disabled={sending || !text.trim()} style={[styles.send, !text.trim() && { opacity: 0.4 }]}><Ionicons name="send" size={18} color={colors.white} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  orderBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.gray50, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  bubble: { maxWidth: "82%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg },
  mine: { alignSelf: "flex-end", backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.gray100, borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, borderTopWidth: 1, borderTopColor: colors.gray200, gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.carbon },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
});
