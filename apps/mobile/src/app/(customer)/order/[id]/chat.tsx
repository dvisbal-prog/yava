import React, { useEffect, useRef, useState } from "react";
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatTime } from "@yava/shared";
import { Header, Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useOrder, useOrderMessages, type OrderMessageRow } from "@/features/customer";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

/** Pantalla 22 · Chat con el repartidor (order_messages en tiempo real). */
export default function OrderChat() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.session?.user.id);
  const order = useOrder(id);
  const messages = useOrderMessages(id);
  useRealtimeOrder(id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      void qc.invalidateQueries({ queryKey: ["order-messages", id] });
    } catch (e) {
      setError(errorMessage(e));
    } finally { setSending(false); }
  }

  const courierName = order.data?.courier_name ?? "Repartidor";
  const disabled = !order.data?.courier_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <Header title={courierName} subtitle={order.data ? `Pedido #${order.data.number}` : undefined} onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        {messages.isLoading ? <View style={{ padding: 16 }}><ListSkeleton rows={3} height={40} /></View> : messages.error ? <ErrorState error={messages.error} onRetry={() => { void messages.refetch(); }} /> : (
          <FlatList ref={listRef} data={messages.data ?? []} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
            ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title={disabled ? "Aún no hay repartidor asignado" : `Escríbele a ${courierName}`} body={disabled ? "Podrás chatear cuando un repartidor tome tu pedido." : "Indicaciones para llegar, portería, timbre…"} />}
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
          <TextInput value={text} onChangeText={setText} placeholder={disabled ? "Esperando repartidor…" : "Escribe un mensaje"} placeholderTextColor={colors.gray400} style={styles.input} editable={!disabled} multiline onSubmitEditing={send} />
          <Pressable onPress={send} disabled={disabled || sending || !text.trim()} style={[styles.send, (disabled || !text.trim()) && { opacity: 0.4 }]}><Ionicons name="send" size={18} color={colors.white} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  bubble: { maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg },
  mine: { alignSelf: "flex-end", backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.gray100, borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, borderTopWidth: 1, borderTopColor: colors.gray200, gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.carbon },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
});
