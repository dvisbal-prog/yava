import React, { useMemo, useRef, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert, type LayoutChangeEvent } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatRating } from "@yava/shared";
import { Text, Chip, Badge, Button, Skeleton, EmptyState, Card } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ProductRow, isProductAvailable, ErrorState, CartBar } from "@/components/customer";
import { useMerchant, useMerchantMenu, useMerchantHours, useFavoriteIds, useToggleFavorite, useRequireAuth, etaLabel, nextOpeningLabel, type ProductRow as ProductRowData } from "@/features/customer";

/** Pantallas 12 (restaurante), 26 (tienda mercado), 30 (farmacia) y 43 (cerrado). */
export default function MerchantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const merchant = useMerchant(id);
  const menu = useMerchantMenu(id);
  const hours = useMerchantHours(merchant.data && !merchant.data.is_open ? id : undefined);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const requireAuth = useRequireAuth();
  const cart = useCart();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const sectionY = useRef<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [headerH, setHeaderH] = useState(0);

  const m = merchant.data;
  const isFav = Boolean(id && favIds.data?.includes(id));
  const isOpen = Boolean(m?.is_open);
  const inlineQty = m?.category === "market" || m?.category === "pharmacy";

  const sections = useMemo(() => {
    const prods = menu.data?.products ?? [];
    const cats = menu.data?.categories ?? [];
    const out = cats.map((c) => ({ id: c.id, name: c.name, items: prods.filter((p) => p.category_id === c.id) })).filter((s) => s.items.length);
    const loose = prods.filter((p) => !p.category_id || !cats.some((c) => c.id === p.category_id));
    if (loose.length) out.push({ id: "otros", name: out.length ? "Otros" : "Menú", items: loose });
    return out;
  }, [menu.data]);

  const cartMerchant = m ? { id: m.id ?? "", name: m.name ?? "", delivery_fee: m.delivery_fee ?? 0, category: m.category ?? "food", prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0 } : null;

  function qtyOf(productId: string): number {
    if (cart.merchant?.id !== id) return 0;
    return cart.lines.filter((l) => l.product_id === productId).reduce((a, l) => a + l.qty, 0);
  }

  function addDirect(p: ProductRowData) {
    if (!cartMerchant) return;
    const line = { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] };
    const res = cart.addLine(cartMerchant, line);
    if (res === "different_merchant") {
      Alert.alert("Ya tienes una canasta", `Tu canasta tiene productos de ${cart.merchant?.name ?? "otro comercio"}. ¿Quieres vaciarla y agregar ${p.name}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Vaciar canasta y agregar", style: "destructive", onPress: () => { cart.replaceWith(cartMerchant, line); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
      ]);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function setQty(p: ProductRowData, q: number) {
    const idx = cart.lines.findIndex((l) => l.product_id === p.id && l.options.length === 0);
    if (idx < 0) { if (q > 0) addDirect(p); return; }
    cart.setQty(idx, q);
    void Haptics.selectionAsync();
  }

  function onProduct(p: ProductRowData) {
    router.push(`/(customer)/product/${p.id}` as never);
  }

  function onAdd(p: ProductRowData) {
    if (!isOpen) return;
    if (menu.data?.withOptions.has(p.id) || !inlineQty) { onProduct(p); return; }
    addDirect(p);
  }

  function scrollTo(catId: string) {
    setActiveCat(catId);
    const y = sectionY.current[catId];
    if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
  }

  function onScroll(y: number) {
    const entries = Object.entries(sectionY.current).sort((a, b) => a[1] - b[1]);
    let current: string | null = entries[0]?.[0] ?? null;
    for (const [cid, sy] of entries) if (y + 80 >= sy) current = cid;
    if (current !== activeCat) setActiveCat(current);
  }

  function toggleFavorite() {
    if (!requireAuth(`/(customer)/merchant/${id}`)) return;
    toggleFav.mutate({ merchantId: id, isFavorite: isFav });
  }

  const closedLabel = !isOpen ? (nextOpeningLabel(hours.data ?? []) ?? "Cerrado por ahora") : null;

  if (merchant.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <Skeleton width="100%" height={200} style={{ borderRadius: 0 }} />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton width="60%" height={24} /><Skeleton width="40%" height={14} /><Skeleton width="80%" height={14} />
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={88} /><Skeleton width="100%" height={88} />
        </View>
      </View>
    );
  }
  if (merchant.error || !m) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} style={styles.circleBtnPlain}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable>
        {merchant.error ? <ErrorState error={merchant.error} onRetry={() => { void merchant.refetch(); }} /> : <EmptyState icon="storefront-outline" title="Comercio no disponible" body="Este comercio no está activo en este momento." actionTitle="Ver otros comercios" onAction={() => router.replace("/(customer)/restaurants" as never)} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView ref={scrollRef} stickyHeaderIndices={[1]} onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)} scrollEventThrottle={32} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Portada + info */}
        <View onLayout={(e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height)}>
          <View>
            <Image source={{ uri: m.cover_url ?? m.logo_url ?? undefined }} style={[styles.cover, !isOpen && { opacity: 0.7 }]} contentFit="cover" transition={200} />
            <View style={[styles.topBar, { top: insets.top + 6 }]}>
              <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(customer)" as never))} style={styles.circleBtn}><Ionicons name="chevron-back" size={22} color={colors.carbon} /></Pressable>
              <Pressable onPress={toggleFavorite} style={styles.circleBtn}><Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? colors.red : colors.carbon} /></Pressable>
            </View>
            <View style={styles.logoWrap}><Image source={{ uri: m.logo_url ?? undefined }} style={styles.logo} contentFit="cover" /></View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 36 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text variant="display" style={{ flexShrink: 1 }}>{m.name}</Text>
              {!isOpen ? <Badge label="Cerrado" tone="gray" /> : null}
            </View>
            <Text tone="muted" style={{ marginTop: 2 }}>{[m.tagline, ...(m.tags ?? []).slice(0, 2).map((t) => t.charAt(0).toUpperCase() + t.slice(1))].filter(Boolean).join(" · ")}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}><View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="star" size={14} color={colors.yellow} /><Text variant="bodyStrong" style={{ marginLeft: 4 }}>{formatRating(Number(m.rating_avg ?? 0))}</Text><Text variant="caption" tone="muted"> ({m.rating_count ?? 0}+)</Text></View><Text variant="small" tone="muted">Calificación</Text></View>
              <View style={styles.stat}><Text variant="bodyStrong">{etaLabel(m.prep_min, m.prep_max)}</Text><Text variant="small" tone="muted">Tiempo</Text></View>
              <View style={styles.stat}><Text variant="bodyStrong">{m.delivery_fee ? formatCOP(m.delivery_fee) : "Gratis"}</Text><Text variant="small" tone="muted">Envío</Text></View>
            </View>
            {m.description ? <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>{m.description}</Text> : null}
            {!isOpen ? (
              <Card style={{ marginTop: 14, backgroundColor: colors.gray50, flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time-outline" size={22} color={colors.gray700} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text variant="bodyStrong">{closedLabel}</Text>
                  <Text variant="caption" tone="muted">Puedes ver el menú y volver cuando esté abierto.</Text>
                </View>
              </Card>
            ) : null}
            {m.category === "pharmacy" ? (
              <Card style={{ marginTop: 14, backgroundColor: colors.gray50, flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
                <Text variant="caption" tone="muted" style={{ marginLeft: 10, flex: 1 }}>Medicamentos de venta libre. Para fórmula médica, contacta a la farmacia.</Text>
              </Card>
            ) : null}
          </View>
        </View>

        {/* Chips de categorías (pegajosos) */}
        <View style={{ backgroundColor: colors.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {sections.map((s) => <Chip key={s.id} label={s.name} selected={activeCat === s.id || (!activeCat && s.id === sections[0]?.id)} onPress={() => scrollTo(s.id)} />)}
          </ScrollView>
        </View>

        {/* Productos */}
        <View style={{ paddingHorizontal: 16 }}>
          {menu.isLoading ? (
            <View style={{ gap: 12, paddingTop: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={88} />)}</View>
          ) : menu.error ? (
            <ErrorState error={menu.error} onRetry={() => { void menu.refetch(); }} />
          ) : !sections.length ? (
            <EmptyState icon="fast-food-outline" title="Menú en construcción" body="Este comercio aún no ha publicado productos." />
          ) : sections.map((s) => (
            <View key={s.id} onLayout={(e: LayoutChangeEvent) => { sectionY.current[s.id] = e.nativeEvent.layout.y + headerH; }}>
              <Text variant="heading" style={{ marginTop: 20, marginBottom: 4 }}>{s.name}</Text>
              {s.items.map((p) => (
                <ProductRow key={p.id} p={p} disabled={!isOpen} onPress={() => onProduct(p)} onAdd={() => onAdd(p)}
                  qty={inlineQty && isOpen && isProductAvailable(p) && !menu.data?.withOptions.has(p.id) ? qtyOf(p.id) : undefined}
                  onQty={inlineQty ? (q) => setQty(p, q) : undefined} />
              ))}
            </View>
          ))}
          {!isOpen ? <Button title="Ver otros comercios" variant="ghost" onPress={() => router.replace(`/(customer)/restaurants?category=${m.category ?? "food"}` as never)} style={{ marginTop: 16 }} /> : null}
        </View>
      </ScrollView>
      {isOpen ? <CartBar merchantId={id} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  cover: { width: "100%", height: 210, backgroundColor: colors.gray100 },
  topBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", shadowColor: colors.black, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  circleBtnPlain: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  logoWrap: { position: "absolute", bottom: -28, left: 16, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, padding: 3, borderWidth: 1, borderColor: colors.gray200 },
  logo: { width: "100%", height: "100%", borderRadius: 30, backgroundColor: colors.gray100 },
  stats: { flexDirection: "row", marginTop: 14, backgroundColor: colors.gray50, borderRadius: radius.md, padding: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
});
