import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import type { MerchantCategory } from "@yava/shared";
import { Screen, Text, Chip, Card, EmptyState } from "@/components/ui";
import { useCart } from "@/store/cart";
import { AddressHeader } from "@/components/customer/AddressHeader";
import { SectionHeader } from "@/components/customer/SectionHeader";
import { MerchantRow } from "@/components/customer/MerchantCard";
import { ProductTile } from "@/components/customer/ProductRow";
import { ErrorState, ListSkeleton, CardsSkeleton } from "@/components/customer/QueryState";
import { CartBar } from "@/components/customer/CartBar";
import { useNearbyMerchants, useProductsOfMerchants } from "@/features/customer";
import type { ProductRow as ProductRowData, ProductCategoryRow, NearbyMerchant } from "@/features/customer";
import { confirm } from "@/lib/dialog";

/** Minúsculas y sin tildes, para comparar nombres de categoría. */
function norm(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n");
}

/** Palabras con las que cada chip reconoce las categorías (product_categories.name) de cada tienda. */
const CHIP_KEYWORDS: Record<string, string[]> = {
  frutas: ["fruta"], verduras: ["verdura", "hortaliza"], lacteos: ["lacteo", "leche", "queso", "yogur"], despensa: ["despensa", "abarrote", "grano"], aseo: ["aseo", "limpieza"],
  "dolor y fiebre": ["dolor", "fiebre", "analgesico"], gripa: ["gripa", "gripe", "resfriado", "antigripal"], vitaminas: ["vitamina", "suplemento"],
  "cuidado personal": ["cuidado personal", "higiene"], bebes: ["bebe", "infantil", "panal"],
};

/** ids de las categorías (de cualquier tienda) que corresponden a un chip. */
function categoryIdsForChip(chip: string, categories: ProductCategoryRow[]): Set<string> {
  const c = norm(chip);
  const keys = CHIP_KEYWORDS[c] ?? [c];
  return new Set(categories.filter((cat) => { const n = norm(cat.name); return n === c || keys.some((k) => n.includes(k)); }).map((cat) => cat.id));
}

/** Productos que se muestran en "Lo esencial". Se piden más para que el filtro por categoría encuentre resultados. */
const ESSENTIALS_SHOWN = 12;
const ESSENTIALS_FETCH = 60;

/** Plantilla de Mercado (25) y Farmacia (29): tiendas cercanas + "Lo esencial" con compra directa. */
export function StoreCategoryScreen({ category, title, subtitle, notice, searchPlaceholder, chips }: {
  category: Extract<MerchantCategory, "market" | "pharmacy">; title: string; subtitle: string; notice?: string; searchPlaceholder: string; chips: string[];
}) {
  const router = useRouter();
  const merchants = useNearbyMerchants(category);
  const ids = useMemo(() => (merchants.data ?? []).map((m) => m.id), [merchants.data]);
  const products = useProductsOfMerchants(ids, ESSENTIALS_FETCH);
  const addLine = useCart((s) => s.addLine);
  const replaceWith = useCart((s) => s.replaceWith);
  const [chip, setChip] = React.useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const list = products.data?.products ?? [];
    if (!chip) return list.slice(0, ESSENTIALS_SHOWN);
    const catIds = categoryIdsForChip(chip, products.data?.categories ?? []);
    return list.filter((p) => p.category_id != null && catIds.has(p.category_id)).slice(0, ESSENTIALS_SHOWN);
  }, [products.data, chip]);

  function addDirect(p: ProductRowData, m: NearbyMerchant) {
    const merchant = { id: m.id, name: m.name, delivery_fee: m.delivery_fee, category: m.category, prep_min: m.prep_min, prep_max: m.prep_max };
    const line = { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] };
    const res = addLine(merchant, line);
    if (res === "different_merchant") {
      void confirm("Ya tienes una canasta", `Tu canasta tiene productos de otro comercio. ¿Quieres vaciarla y agregar ${p.name}?`, { okText: "Vaciar canasta y agregar", destructive: true }).then((ok) => {
        if (!ok) return;
        replaceWith(merchant, line);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Screen padded={false} refreshing={merchants.isRefetching} onRefresh={() => { void merchants.refetch(); void products.refetch(); }}>
        <AddressHeader back searchPlaceholder={searchPlaceholder} onSearch={() => router.push(`/(customer)/search?category=${category}` as never)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Chip label="Todo" selected={chip === null} onPress={() => setChip(null)} />
          {chips.map((c) => <Chip key={c} label={c} selected={chip === c} onPress={() => setChip(chip === c ? null : c)} />)}
        </ScrollView>
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: category === "market" ? colors.greenSoft : colors.redSoft, borderRadius: radius.lg, padding: 16, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text variant="title">{title}</Text>
              <Text tone="muted" style={{ marginTop: 4 }}>{subtitle}</Text>
            </View>
            <Ionicons name={category === "market" ? "basket-outline" : "medkit-outline"} size={44} color={category === "market" ? colors.green : colors.red} />
          </View>
          {notice ? (
            <Card style={{ marginTop: 12, flexDirection: "row", alignItems: "center", backgroundColor: colors.gray50 }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
              <Text variant="caption" tone="muted" style={{ marginLeft: 10, flex: 1 }}>{notice}</Text>
            </Card>
          ) : null}

          <SectionHeader title="Tiendas cercanas" style={{ marginTop: 24 }} onAction={() => router.push(`/(customer)/restaurants?category=${category}` as never)} actionTitle="Ver todas" />
          {merchants.isLoading ? <ListSkeleton rows={2} /> : merchants.error ? <ErrorState error={merchants.error} onRetry={() => { void merchants.refetch(); }} compact /> : !merchants.data?.length ? (
            <EmptyState icon="storefront-outline" title="Aún no hay tiendas cerca" body="Pronto llegaremos a tu zona con más opciones." />
          ) : merchants.data.map((m) => <MerchantRow key={m.id} m={m} onPress={() => openMerchant(m.id)} />)}

          {ids.length ? (
            <>
              <SectionHeader title="Lo esencial" style={{ marginTop: 24 }} onAction={ids[0] ? () => openMerchant(ids[0]) : undefined} />
              {products.isLoading ? <CardsSkeleton count={2} width={140} /> : products.error ? <ErrorState error={products.error} onRetry={() => { void products.refetch(); }} compact /> : !filteredProducts.length ? (
                <Text tone="muted">No encontramos productos para "{chip}".</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {filteredProducts.map((p) => {
                    const m = merchants.data?.find((x) => x.id === p.merchant_id);
                    return <ProductTile key={p.id} p={p} merchantName={m?.name} onPress={() => router.push(`/(customer)/product/${p.id}` as never)} onAdd={m && m.is_open ? () => addDirect(p, m) : undefined} />;
                  })}
                </ScrollView>
              )}
            </>
          ) : null}
          <View style={{ height: 80 }} />
        </View>
      </Screen>
      <CartBar />
    </View>
  );
}
