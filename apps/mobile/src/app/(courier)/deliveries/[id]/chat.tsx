import React, { useEffect, useRef, useState } from "react";
import { View, FlatList, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatTime, radius } from "@yava/shared";
import { Screen, Header, Text, EmptyState, Chip } from "@/components/ui";
import { ErrorState, ListSkeleton } from "@/components/merchant/Rows";
import { useOrderMessages, useSendMessage, useCourierOrder } from "@/features/courier/useCourier";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

const QUICK = ["Ya recogí tu pedido, voy en camino.", "Estoy llegando.", "Estoy en la puerta.", "¿Me confirmas la dirección?"];

/** Chat repartidor ↔ cliente sobre un pedido (order_messages, realtime). */
export default function CourierChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.session?.user.id);
  const orderQ = useCourierOrder(id);
  const msgsQ = useOrderMessages(id);
  const send = useSendMessage(id);
  useRealtimeOrder(id);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);
  useEffect(() => { if (msgsQ.data?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50); }, [msgsQ.data?.length]);

  const submit = async (body: string) => {
    const t = body.trim();
    if (!t) return;
    setText("");
    try { await send.mutateAsync(t); } catch (e) { Alert.alert("No se pudo enviar", errorMessage(e)); setText(t); }
  };

  return (
    <Screen scroll={false} padded={false} footer={
      <View>
        <FlatList horizontal data={QUICK} keyExtractor={(q) => q} showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} renderItem={({ item }) => <Chip label={item} onPress={() => submit(item)} />} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput value={text} onChangeText={setText} placeholder="Escribe un mensaje" placeholderTextColor={colors.gray400} multiline
            style={{ flex: 1, minHeight: 44, maxHeight: 100, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.carbon }} />
          <Pressable onPress={() => submit(text)} disabled={!text.trim() || send.isPending} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.blue : colors.gray200, alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>}>
      <Header title={orderQ.data?.customer_name ?? "Cliente"} subtitle={orderQ.data ? `Pedido #${orderQ.data.number}` : undefined} />
      {msgsQ.isLoading ? <View style={{ padding: 16 }}><ListSkeleton rows={4} height={48} /></View> : msgsQ.isError ? <ErrorState message={errorMessage(msgsQ.error)} onRetry={() => msgsQ.refetch()} /> : (
        <FlatList ref={listRef} data={msgsQ.data ?? []} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="Sin mensajes" body="Avísale al cliente cuando vayas en camino o estés llegando." />}
          renderItem={({ item }) => {
            const mine = item.sender_id === uid;
            return (
              <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%", marginBottom: 8 }}>
                <View style={{ backgroundColor: mine ? colors.blue : colors.gray100, borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: mine ? colors.white : colors.carbon }}>{item.body}</Text>
                </View>
                <Text variant="small" tone="subtle" style={{ marginTop: 2, textAlign: mine ? "right" : "left" }}>{formatTime(item.created_at)}</Text>
              </View>
            );
          }} />
      )}
    </Screen>
  );
}
