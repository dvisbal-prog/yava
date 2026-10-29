import React, { useState } from "react";
import { View, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { StarRating, ratingLabel, Avatar, ErrorState } from "@/components/customer";
import { OrderThumb, PillButton, shortCourierName, t, BLUE_BRIGHT } from "@/components/customer/order/kit";
import { orderMerchantPhoto, courierPhoto } from "@/components/customer/order/photos";
import { ThumbIcon } from "@/components/customer/order/ThumbIcon";
import { useOrder, useMerchant, relativeDateTime } from "@/features/customer";

const COMMENT_MAX = 250;
/** Etiquetas de "¿Qué tal estuvo…?" (lo que le gustó del pedido): comida y, para mercado/farmacia, el pedido. */
const FOOD_TAGS = ["Sabor", "Presentación", "Temperatura"];
const STORE_TAGS = ["Calidad", "Empaque", "Completo"];
/** "¿Cómo fue la entrega?": 👍 = 5 estrellas, 👎 = 1 estrella (la columna `courier_rating` es 1–5). */
const COURIER_GOOD = 5;
const COURIER_BAD = 1;
/** Azul de la opción elegida y gris del pulgar sin elegir (medidos en 24). */
const THUMB_ON = "#0241B9";
const THUMB_OFF = "#4A566F";

/**
 * Pantalla 24 · Califica tu pedido (tanda-03/24-calificar.png): tarjeta gris del pedido, estrellas del comercio con
 * su texto ("Excelente"), etiquetas, comentario con contador y la entrega del repartidor (Buena / Mala).
 * La propina del diseño anterior queda fuera hasta que exista el cobro y el abono al repartidor: no se guarda `tip`.
 */
export default function RateOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.session?.user.id);
  const order = useOrder(id);
  const o = order.data;
  const merchant = useMerchant(o?.merchant_id ?? undefined);
  const [merchantRating, setMerchantRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  async function submit() {
    if (!o || !uid) return;
    if (o.merchant_id && !merchantRating) { setError("Califica el comercio con estrellas."); return; }
    if (o.courier_id && !courierRating) { setError("Cuéntanos cómo fue la entrega."); return; }
    setSaving(true); setError(null);
    try {
      const { error: e } = await supabase.from("ratings").insert({
        order_id: id, customer_id: uid, merchant_id: o.merchant_id, courier_id: o.courier_id,
        merchant_rating: o.merchant_id ? merchantRating : null, courier_rating: o.courier_id ? courierRating : null,
        comment: comment.trim() || null, tags,
      });
      if (e) throw e;
      void qc.invalidateQueries({ queryKey: ["rating", id] });
      router.replace(`/(customer)/order/${id}/delivered` as never);
    } catch (err) {
      setError(errorMessage(err));
    } finally { setSaving(false); }
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(`/(customer)/order/${id}/delivered` as never));
  const header = (
    <View style={styles.header}>
      <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Atrás" style={styles.back}>
        <Ionicons name="chevron-back" size={25.5} color={colors.ink} />
      </Pressable>
      <Text style={[t(16.2, "600", colors.ink, 21), styles.headerTitle]} accessibilityRole="header" numberOfLines={1}>Califica tu pedido</Text>
    </View>
  );

  if (order.isLoading && !o) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {header}
        <View style={{ paddingHorizontal: 18, gap: 16 }}>
          <Skeleton height={126} style={{ borderRadius: 16, marginTop: 6 }} />
          <Skeleton width={200} height={18} style={{ alignSelf: "center" }} />
          <Skeleton width={240} height={36} style={{ alignSelf: "center" }} />
          <Skeleton height={40} style={{ borderRadius: 20 }} />
          <Skeleton height={92} style={{ borderRadius: 12 }} />
        </View>
      </View>
    );
  }
  if (order.error || !o) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {header}
        <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
      </View>
    );
  }

  const m = merchant.data;
  const food = (o.merchant_category ?? m?.category ?? "food") === "food";
  const chips = food ? FOOD_TAGS : STORE_TAGS;
  const courierImg = courierPhoto(o.courier_name);

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Tarjeta gris del pedido */}
        {o.merchant_id ? (
          <View style={styles.orderCard}>
            <OrderThumb source={orderMerchantPhoto({ name: o.merchant_name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo }, "rate")} width={157} height={101.6} radius={12} />
            <View style={styles.orderText}>
              <Text style={t(15.8, "600", colors.ink, 20)} numberOfLines={1}>{o.merchant_name}</Text>
              {m?.tagline ? <Text style={[t(12.27, "400", "#5A647E", 16), { marginTop: 2.4 }]} numberOfLines={1}>{m.tagline}</Text> : null}
              <Text style={[t(12.5, "400", "#64708B", 16), { marginTop: 12.5 }]}>Pedido #{o.number}</Text>
              <Text style={[t(12.1, "400", "#66718E", 16), { marginTop: 1.6 }]}>{relativeDateTime(o.delivered_at ?? o.placed_at)}</Text>
            </View>
          </View>
        ) : null}

        {o.merchant_id ? (
          <>
            <Text style={[t(16.5, "600", colors.ink, 21), styles.center, { marginTop: 21.4 }]}>{food ? "¿Qué tal estuvo la comida?" : "¿Qué tal estuvo tu pedido?"}</Text>
            <View style={{ alignItems: "center", marginTop: 12.4 }}>
              <StarRating value={merchantRating} onChange={(v) => { setMerchantRating(v); setError(null); }} />
            </View>
            <Text style={[merchantRating ? t(13.64, "600", colors.ink, 18) : t(13.2, "400", colors.textTertiary, 18), styles.center, { marginTop: 6.7 }]}>{ratingLabel(merchantRating) || "Toca una estrella para calificar"}</Text>

            <View style={styles.chips}>
              {chips.map((c) => {
                const sel = tags.includes(c);
                return (
                  <Pressable key={c} onPress={() => toggleTag(c)} accessibilityRole="button" accessibilityState={{ selected: sel }}
                    style={({ pressed }) => [styles.chip, sel && styles.chipOn, pressed && { opacity: 0.8 }]}>
                    <Text style={sel ? t(12.3, "600", colors.blueText, 16) : t(12.2, "400", "#495B79", 16)} numberOfLines={1}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Comentario */}
        <Text style={[t(12.85, "600", colors.ink, 17), { marginTop: 22.2 }]}>
          {food ? "¿Qué te gustó?" : "Comentario"} <Text style={t(12.1, "400", "#525B79", 17)}>(opcional)</Text>
        </Text>
        <View style={[styles.area, focused && styles.areaFocus]}>
          <TextInput value={comment} onChangeText={setComment} placeholder="Cuéntanos más sobre tu experiencia..." placeholderTextColor="#7A84A0"
            multiline maxLength={COMMENT_MAX} textAlignVertical="top" style={styles.areaInput} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            accessibilityLabel="Comentario (opcional)" />
          <Text style={styles.counter}>{comment.length}/{COMMENT_MAX}</Text>
        </View>

        {/* Repartidor */}
        {o.courier_id ? (
          <>
            <View style={styles.rule} />
            <View style={styles.courier}>
              {courierImg ? <Image source={courierImg} style={styles.avatar} contentFit="cover" /> : <Avatar name={o.courier_name} size={57.7} />}
              <View style={{ marginLeft: 13, marginTop: 6.5 }}>
                <Text style={t(15.4, "600", colors.ink, 20)}>{shortCourierName(o.courier_name)}</Text>
                <Text style={[t(12.5, "400", "#68728E", 16), { marginTop: 2.2 }]}>Tu domiciliario</Text>
              </View>
            </View>
            <Text style={[t(13.5, "600", colors.ink, 18), { marginTop: 13.4, marginLeft: 2.4 }]}>¿Cómo fue la entrega?</Text>
            <View style={styles.thumbs}>
              {([[COURIER_GOOD, "Buena", false], [COURIER_BAD, "Mala", true]] as const).map(([v, label, down]) => {
                const sel = courierRating === v;
                return (
                  <Pressable key={label} onPress={() => { setCourierRating(v); setError(null); }} accessibilityRole="button" accessibilityState={{ selected: sel }} accessibilityLabel={`Entrega ${label.toLowerCase()}`}
                    style={({ pressed }) => [styles.thumbCard, sel && styles.thumbOn, pressed && { opacity: 0.85 }]}>
                    <View style={{ marginTop: down ? 16.1 : 11.9 }}>
                      <ThumbIcon down={down} filled={sel} color={sel ? THUMB_ON : THUMB_OFF} />
                    </View>
                    <Text style={[sel ? t(12, "600", THUMB_ON, 16) : t(12.5, "500", "#4A5674", 16), { position: "absolute", top: 48.8 }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
        {error ? <Text style={[t(12.5, "500", colors.red, 17), { marginTop: 12 }]}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom ? insets.bottom + 6 : 12 }]}>
        <PillButton title="Enviar calificación" bg={BLUE_BRIGHT} height={46.5} radius={17} fontSize={14.53} onPress={() => { void submit(); }} loading={saving} disabled={!o} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 40 },
  back: { position: "absolute", left: 14.2, top: 7.5, width: 26, height: 26 },
  headerTitle: { position: "absolute", left: 53.6, right: 20, top: 8.5 },
  content: { paddingHorizontal: 18, paddingTop: 7.2, paddingBottom: 20 },
  center: { textAlign: "center" },
  orderCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#F8F9FA", borderRadius: 16, height: 126.1, paddingLeft: 11.6, paddingTop: 12 },
  orderText: { flex: 1, marginLeft: 13.9, marginTop: 9.8, paddingRight: 10 },
  chips: { flexDirection: "row", gap: 5.3, marginTop: 15.6 },
  chip: { flex: 1, height: 39.7, borderRadius: 19.85, borderWidth: 1, borderColor: "#DADEE7", backgroundColor: colors.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  chipOn: { backgroundColor: "#ECF4FD", borderWidth: 1.4, borderColor: colors.blueText },
  area: { marginTop: 8.7, height: 92.8, borderRadius: 12, borderWidth: 1, borderColor: "#E3E6EC", backgroundColor: colors.white },
  areaFocus: { borderWidth: 2, borderColor: colors.blueText },
  areaInput: { flex: 1, paddingHorizontal: 12.4, paddingTop: 10.8, paddingBottom: 22, fontSize: 12.4, lineHeight: 17, color: colors.ink },
  counter: { position: "absolute", right: 9.7, bottom: 8.6, fontSize: 9.35, lineHeight: 12, color: "#6A7690" },
  rule: { height: 0.9, backgroundColor: "#E9ECF2", marginTop: 23.6, marginHorizontal: 1 },
  courier: { flexDirection: "row", alignItems: "flex-start", marginTop: 13.4, marginLeft: 7.4 },
  avatar: { width: 57.7, height: 57.7, borderRadius: 28.85, backgroundColor: colors.surfaceGray },
  thumbs: { flexDirection: "row", gap: 8.3, marginTop: 10.8 },
  thumbCard: { flex: 1, height: 79, borderRadius: 14, borderWidth: 1, borderColor: "#E1E4EA", backgroundColor: colors.white, alignItems: "center" },
  thumbOn: { backgroundColor: "#EEF4FD", borderWidth: 1.5, borderColor: colors.blueText },
  footer: { paddingHorizontal: 17.6, paddingTop: 8, backgroundColor: colors.white },
});
