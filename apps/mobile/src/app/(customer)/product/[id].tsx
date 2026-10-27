import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import type { CartLine } from "@yava/shared";
import { Text, Button, Input, Stepper, Badge, Skeleton, EmptyState, Card } from "@/components/ui";
import { useCart } from "@/store/cart";
import { RadioRow, ErrorState, ProductTile, isProductAvailable } from "@/components/customer";
import { useProduct, useMerchant, useMerchantMenu } from "@/features/customer";
import { notify, confirm } from "@/lib/dialog";

/** Pantallas 13 (detalle), 14 (complementos/opciones) y 44 (producto no disponible). */
export default function ProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const p = product.data;
  const merchant = useMerchant(p?.merchant_id);
  const menu = useMerchantMenu(p?.merchant_id);
  const cart = useCart();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const m = merchant.data;
  const available = p ? isProductAvailable(p) : false;
  const isOpen = Boolean(m?.is_open);

  const extras = useMemo(() => {
    if (!p) return 0;
    return p.groups.reduce((acc, g) => acc + g.options.filter((o) => (selected[g.id] ?? []).includes(o.id)).reduce((a, o) => a + o.price_delta, 0), 0);
  }, [p, selected]);
  const unit = (p?.price ?? 0) + extras;
  const total = unit * qty;

  const missing = useMemo(() => (p?.groups ?? []).filter((g) => {
    const n = (selected[g.id] ?? []).length;
    return (g.required && n < Math.max(1, g.min_select)) || (n < g.min_select);
  }), [p, selected]);

  const alternatives = useMemo(() => {
    if (!p || available) return [];
    const list = (menu.data?.products ?? []).filter((x) => x.id !== p.id && isProductAvailable(x));
    const same = list.filter((x) => x.category_id && x.category_id === p.category_id);
    return (same.length ? same : list).slice(0, 6);
  }, [p, available, menu.data]);

  function toggle(groupId: string, optionId: string, single: boolean, max: number) {
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: cur.includes(optionId) ? [] : [optionId] };
      if (cur.includes(optionId)) return { ...prev, [groupId]: cur.filter((x) => x !== optionId) };
      if (cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, optionId] };
    });
  }

  function add() {
    if (!p || !m) return;
    if (missing.length) { notify("Falta elegir", `Selecciona ${missing[0].name.toLowerCase()} para continuar.`); return; }
    const line: CartLine = {
      product_id: p.id, name: p.name, unit_price: p.price, qty, notes: notes.trim() || undefined,
      options: p.groups.flatMap((g) => g.options.filter((o) => (selected[g.id] ?? []).includes(o.id)).map((o) => ({ group_id: g.id, option_id: o.id, name: o.name, price_delta: o.price_delta }))),
    };
    const cm = { id: m.id ?? "", name: m.name ?? "", delivery_fee: m.delivery_fee ?? 0, category: m.category ?? "food", prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0 };
    const res = cart.addLine(cm, line);
    if (res === "different_merchant") {
      void confirm("Ya tienes una canasta", `Tu canasta tiene productos de ${cart.merchant?.name ?? "otro comercio"}. ¿Quieres vaciarla y agregar ${p.name}?`, { okText: "Vaciar canasta y agregar", destructive: true }).then((ok) => {
        if (!ok) return;
        cart.replaceWith(cm, line);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      });
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  if (product.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <Skeleton width="100%" height={260} style={{ borderRadius: 0 }} />
        <View style={{ padding: 16, gap: 10 }}><Skeleton width="70%" height={24} /><Skeleton width="90%" height={14} /><Skeleton width="30%" height={20} /></View>
      </View>
    );
  }
  if (product.error || !p) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 8 }}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable>
        {product.error ? <ErrorState error={product.error} onRetry={() => { void product.refetch(); }} /> : <EmptyState icon="fast-food-outline" title="Producto no disponible" body="Este producto ya no está publicado." actionTitle="Volver" onAction={() => router.back()} />}
      </View>
    );
  }

  const canAdd = available && isOpen && !missing.length;
  const footerTitle = !available ? "No disponible" : !isOpen ? "Comercio cerrado" : `Agregar ${formatCOP(total)}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View>
          <Image source={{ uri: p.image_urls[0] }} style={[styles.hero, !available && { opacity: 0.55 }]} contentFit="cover" transition={200} />
          <Pressable onPress={() => router.back()} style={[styles.circleBtn, { top: insets.top + 6 }]}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable>
          {!available ? <View style={styles.unavailableTag}><Badge label="No disponible" tone="red" /></View> : null}
        </View>
        <View style={{ padding: 16 }}>
          {m ? <Pressable onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{m.name} · {m.tagline ?? ""}</Text></Pressable> : null}
          <Text variant="display" style={{ marginTop: 4 }}>{p.name}</Text>
          {p.description ? <Text tone="muted" style={{ marginTop: 6 }}>{p.description}</Text> : null}
          <Text variant="title" style={{ marginTop: 10 }}>{formatCOP(p.price)}</Text>

          {!available ? (
            <Card style={{ marginTop: 16, backgroundColor: colors.redSoft, borderColor: colors.redSoft, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.red} />
              <Text variant="caption" style={{ marginLeft: 10, flex: 1, color: colors.red }}>{p.status === "paused" ? "El comercio pausó este producto por hoy." : "Este producto está agotado por ahora."}</Text>
            </Card>
          ) : null}

          {available ? p.groups.map((g) => {
            const single = g.max_select <= 1;
            const chosen = selected[g.id] ?? [];
            return (
              <View key={g.id} style={{ marginTop: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text variant="heading">{g.name}</Text>
                  <Badge label={g.required || g.min_select > 0 ? "Obligatorio" : "Opcional"} tone={g.required || g.min_select > 0 ? "yellow" : "gray"} />
                </View>
                <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>{single ? "Elige 1 opción" : `Elige ${g.min_select > 0 ? `de ${g.min_select} a ` : "hasta "}${g.max_select}`}</Text>
                {g.options.map((o) => (
                  <RadioRow key={o.id} title={o.name} subtitle={!o.available ? "No disponible" : undefined} disabled={!o.available} checkbox={!single}
                    selected={chosen.includes(o.id)} onPress={() => toggle(g.id, o.id, single, g.max_select)}
                    right={o.price_delta ? <Text variant="caption" tone="muted">+{formatCOP(o.price_delta)}</Text> : undefined} />
                ))}
              </View>
            );
          }) : null}

          {available ? (
            <View style={{ marginTop: 20 }}>
              <Input label="Notas para el comercio (opcional)" value={notes} onChangeText={setNotes} placeholder="Sin cebolla, sin picante…" multiline style={{ minHeight: 56 }} />
            </View>
          ) : null}

          {!available && alternatives.length ? (
            <View style={{ marginTop: 20 }}>
              <Text variant="heading" style={{ marginBottom: 10 }}>Te puede gustar en su lugar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {alternatives.map((a) => <ProductTile key={a.id} p={a} onPress={() => router.replace(`/(customer)/product/${a.id}` as never)} />)}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {available && isOpen ? <Stepper value={qty} onChange={(v) => setQty(Math.max(1, v))} min={1} /> : null}
        <View style={{ flex: 1 }}>
          <Button title={footerTitle} onPress={add} disabled={!canAdd} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: { width: "100%", height: 280, backgroundColor: colors.gray100 },
  circleBtn: { position: "absolute", left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", shadowColor: colors.black, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  unavailableTag: { position: "absolute", bottom: 12, left: 16 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
});
