import React, { useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, lineTotal } from "@yava/shared";
import { Screen, Header, Text, Button, Input, Stepper, Divider, EmptyState, Badge, Card } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ProductTile, isProductAvailable, PriceRow } from "@/components/customer";
import { useMerchantMenu, useProductsByIds, useRequireAuth, etaLabel } from "@/features/customer";

/** Pantallas 15 (Tu canasta), 42 (canasta vacía) y 44 (producto no disponible en la canasta). */
export default function Cart() {
  const router = useRouter();
  const cart = useCart();
  const requireAuth = useRequireAuth();
  const merchantId = cart.merchant?.id;
  const menu = useMerchantMenu(merchantId);
  const ids = useMemo(() => Array.from(new Set(cart.lines.map((l) => l.product_id))), [cart.lines]);
  const fresh = useProductsByIds(ids);

  const unavailable = useMemo(() => {
    if (!fresh.data) return new Set<string>();
    const set = new Set<string>();
    for (const pid of ids) {
      const p = fresh.data.find((x) => x.id === pid);
      if (!p || !isProductAvailable(p)) set.add(pid);
    }
    return set;
  }, [fresh.data, ids]);

  const suggestions = useMemo(() => (menu.data?.products ?? []).filter((p) => isProductAvailable(p) && !ids.includes(p.id)).slice(0, 8), [menu.data, ids]);
  const subtotal = cart.subtotal();

  function addSuggestion(p: { id: string; name: string; price: number }) {
    if (!cart.merchant) return;
    if (menu.data?.withOptions.has(p.id)) { router.push(`/(customer)/product/${p.id}` as never); return; }
    cart.addLine(cart.merchant, { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function clear() {
    Alert.alert("Vaciar canasta", "¿Quieres quitar todos los productos?", [{ text: "Cancelar", style: "cancel" }, { text: "Vaciar", style: "destructive", onPress: () => cart.clear() }]);
  }

  function continueToCheckout() {
    if (unavailable.size) { Alert.alert("Revisa tu canasta", "Elimina o reemplaza los productos no disponibles para continuar."); return; }
    if (!requireAuth("/(customer)/checkout")) return;
    router.push("/(customer)/checkout" as never);
  }

  if (!cart.lines.length || !cart.merchant) {
    return (
      <Screen>
        <Header title="Tu canasta" />
        <EmptyState icon="basket-outline" title="Tu canasta está vacía" body="Explora restaurantes y agrega lo que se te antoje." actionTitle="Ver restaurantes" onAction={() => router.replace("/(customer)/restaurants?category=food" as never)} secondaryTitle="Ir al inicio" onSecondary={() => router.replace("/(customer)" as never)} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} footer={
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text variant="bodyStrong">Subtotal</Text>
          <Text variant="heading">{formatCOP(subtotal)}</Text>
        </View>
        <Button title="Continuar" onPress={continueToCheckout} disabled={unavailable.size > 0} right={<Text variant="bodyStrong" tone="inverse" style={{ marginLeft: 8 }}>· {formatCOP(subtotal)}</Text>} />
      </View>
    }>
      <Header title="Tu canasta" right={<Pressable onPress={clear} hitSlop={10}><Ionicons name="trash-outline" size={20} color={colors.gray500} /></Pressable>} />
      <View style={{ paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.push(`/(customer)/merchant/${cart.merchant?.id}` as never)} style={styles.merchant}>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{cart.merchant.name}</Text>
            <Text variant="caption" tone="muted">{etaLabel(cart.merchant.prep_min, cart.merchant.prep_max)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Pressable>

        {cart.lines.map((l, i) => {
          const bad = unavailable.has(l.product_id);
          return (
            <View key={`${l.product_id}-${i}`} style={styles.line}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text variant="bodyStrong" style={[{ flexShrink: 1 }, bad && { color: colors.gray400 }]}>{l.name}</Text>
                  {bad ? <Badge label="No disponible" tone="red" /> : null}
                </View>
                {l.options.length ? <Text variant="caption" tone="muted">{l.options.map((o) => o.name).join(", ")}</Text> : null}
                {l.notes ? <Text variant="caption" tone="subtle">“{l.notes}”</Text> : null}
                <Text variant="bodyStrong" style={{ marginTop: 4 }}>{formatCOP(lineTotal(l))}</Text>
              </View>
              <Stepper value={l.qty} onChange={(q) => { cart.setQty(i, q); void Haptics.selectionAsync(); }} size="sm" />
            </View>
          );
        })}
        {unavailable.size ? (
          <Card style={{ marginTop: 12, backgroundColor: colors.redSoft, borderColor: colors.redSoft, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.red} />
            <Text variant="caption" style={{ marginLeft: 10, flex: 1, color: colors.red }}>Elimina o reemplaza este producto para continuar.</Text>
          </Card>
        ) : null}

        <Button title="Agregar más productos" icon="add" variant="ghost" onPress={() => router.push(`/(customer)/merchant/${cart.merchant?.id}` as never)} style={{ marginTop: 8 }} />

        <Input label="Instrucciones del pedido (opcional)" value={cart.notes} onChangeText={cart.setNotes} placeholder="Sin cubiertos, entregar en portería…" multiline style={{ minHeight: 56 }} containerStyle={{ marginTop: 8 }} />

        {suggestions.length ? (
          <View style={{ marginTop: 8 }}>
            <Text variant="heading" style={{ marginBottom: 10 }}>{unavailable.size ? "Te puede gustar en su lugar" : "Te puede gustar"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map((p) => <ProductTile key={p.id} p={p} onPress={() => router.push(`/(customer)/product/${p.id}` as never)} onAdd={() => addSuggestion(p)} />)}
            </ScrollView>
          </View>
        ) : null}

        <Divider space={20} />
        <PriceRow label="Productos" value={formatCOP(subtotal)} />
        <Text variant="caption" tone="subtle">El envío y el servicio se calculan al continuar.</Text>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  merchant: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  line: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100, borderRadius: radius.sm },
});
