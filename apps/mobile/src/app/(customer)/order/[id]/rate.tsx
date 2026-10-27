import React, { useState } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Screen, Header, Text, Button, Input, Chip, Card } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { StarRating, Avatar } from "@/components/customer";
import { useOrder } from "@/features/customer";

const MERCHANT_TAGS = ["Buen sabor", "Bien empacado", "Porciones generosas", "Llegó frío", "Faltó algo", "Demorado"];
const COURIER_TAGS = ["Amable", "Rápido", "Cuidadoso", "Buena comunicación", "Demorado"];

/**
 * Pantalla 24 · Calificar pedido (comercio, repartidor, etiquetas y comentario).
 * La propina del diseño queda fuera hasta que exista el cobro y el abono al repartidor: no se muestra ni se guarda `tip`.
 */
export default function RateOrder() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.session?.user.id);
  const order = useOrder(id);
  const o = order.data;
  const [merchantRating, setMerchantRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  async function submit() {
    if (!o || !uid) return;
    if (o.merchant_id && !merchantRating) { setError("Califica el comercio con estrellas."); return; }
    if (o.courier_id && !courierRating) { setError("Califica a tu repartidor con estrellas."); return; }
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

  return (
    <Screen footer={<Button title="Enviar calificación" onPress={submit} loading={saving} disabled={!o} />}>
      <Header title="Calificar pedido" />
      {o?.merchant_id ? (
        <Card style={{ marginTop: 8, alignItems: "center" }}>
          <Text variant="heading">¿Cómo estuvo {o.merchant_name ?? "el comercio"}?</Text>
          <View style={{ marginTop: 12 }}><StarRating value={merchantRating} onChange={setMerchantRating} /></View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" }}>
            {MERCHANT_TAGS.map((t) => <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => toggleTag(t)} />)}
          </View>
        </Card>
      ) : null}
      {o?.courier_id ? (
        <Card style={{ marginTop: 12, alignItems: "center" }}>
          <Avatar name={o.courier_name} size={56} />
          <Text variant="heading" style={{ marginTop: 10 }}>¿Y {o.courier_name?.split(" ")[0] ?? "tu repartidor"}?</Text>
          <View style={{ marginTop: 12 }}><StarRating value={courierRating} onChange={setCourierRating} /></View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" }}>
            {COURIER_TAGS.map((t) => <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => toggleTag(t)} />)}
          </View>
        </Card>
      ) : null}
      <View style={{ marginTop: 16 }}>
        <Input label="Comentario (opcional)" value={comment} onChangeText={setComment} placeholder="Cuéntanos cómo te fue" multiline style={{ minHeight: 80 }} error={error} />
      </View>
    </Screen>
  );
}
