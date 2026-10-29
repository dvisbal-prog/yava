import React, { useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, radius } from "@yava/shared";
import type { MerchantCategory } from "@yava/shared";
import { Text, EmptyState, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { AddressHeader } from "@/components/customer/AddressHeader";
import { ErrorState } from "@/components/customer/QueryState";
import { CartBar } from "@/components/customer/CartBar";
import { isProductAvailable } from "@/components/customer/ProductRow";
import { CategoryTiles, type TileItem } from "@/components/customer/browse/CategoryTiles";
import {
  BrowseSection, MarketBanner, StoreCard, EssentialCard, PharmacyCategoryCard, PharmacyCard, FeaturedProductCard, splitUnit, type PharmacyCategory,
} from "@/components/customer/browse/StoreBrowse";
import { productImage, productDesignImage, normalizeName } from "@/lib/design-images";
import { useNearbyMerchants, useProductsOfMerchants, useFavoriteIds, useToggleFavorite, useRequireAuth } from "@/features/customer";
import type { ProductRow as ProductRowData, ProductCategoryRow, NearbyMerchant } from "@/features/customer";
import { confirm } from "@/lib/dialog";

/** Minúsculas y sin tildes, para comparar nombres de categoría. */
function norm(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n");
}

/** Palabras con las que cada categoría (tile o tarjeta) reconoce las categorías (product_categories.name) de cada tienda. */
const CHIP_KEYWORDS: Record<string, string[]> = {
  frutas: ["fruta"], verduras: ["verdura", "hortaliza"], lacteos: ["lacteo", "leche", "queso", "yogur"], despensa: ["despensa", "abarrote", "grano"], aseo: ["aseo", "limpieza"],
  "dolor y fiebre": ["dolor", "fiebre", "analgesico"], gripa: ["gripa", "gripe", "resfriado", "antigripal"], vitaminas: ["vitamina", "suplemento"],
  "cuidado personal": ["cuidado personal", "higiene"], bebes: ["bebe", "infantil", "panal"],
  "proteccion solar": ["solar", "protector", "bloqueador"], "primeros auxilios": ["auxilio", "botiquin", "curita", "aposito", "antiseptico", "alcohol"],
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

export type StoreCategoryConfig =
  | { category: "market"; tiles: TileItem[]; banner: { title: string; subtitle: string } }
  | { category: "pharmacy"; cards: PharmacyCategory[] };

/**
 * Plantilla de 25 · Mercado (tanda-04/25-mercado.png) y 29 · Farmacia (29-farmacia.png):
 * - 25: dirección + bolsa, buscador, tiles con foto (Frutas, Verduras, Lácteos, Despensa), banner crema, "Tiendas cercanas"
 *   (tarjetas con fachada) y "Lo esencial" (cajas blancas con "+").
 * - 29: dirección + bolsa, buscador, 4 tarjetas pastel, "Farmacias cercanas" (fachada con insignia de tiempo),
 *   separador y "Productos destacados".
 * Tocar una categoría filtra los productos por las categorías de cada tienda; "+" agrega directo a la canasta.
 */
export function StoreCategoryScreen({ config, notice, searchPlaceholder }: { config: StoreCategoryConfig; notice?: string; searchPlaceholder: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const category: Extract<MerchantCategory, "market" | "pharmacy"> = config.category;
  const merchants = useNearbyMerchants(category);
  const ids = useMemo(() => (merchants.data ?? []).map((m) => m.id), [merchants.data]);
  const products = useProductsOfMerchants(ids, ESSENTIALS_FETCH);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const requireAuth = useRequireAuth();
  const addLine = useCart((s) => s.addLine);
  const replaceWith = useCart((s) => s.replaceWith);
  const [chip, setChip] = React.useState<string | null>(null);
  const cartMerchantId = useCart((s) => (s.lines.length ? s.merchant?.id : undefined));

  /**
   * "Lo esencial" (25) / "Productos destacados" (29) juntan las tiendas cercanas: primero los productos de la tienda
   * más cercana (en el orden de `nearby_merchants`), cada tienda con su orden del menú, y sin repetir un producto
   * que ofrecen varias tiendas ("Leche (1 L)" sale una vez, en el lugar de la tienda más cercana). De las copias se
   * muestra la que se puede comprar (con stock y la tienda abierta), luego la de la tienda de la canasta y luego la
   * de la tienda más cercana: "Aceite Premier 1 L" agotado en Mercado del Puerto sale de Tienda de la Costa.
   * Con una categoría elegida se filtra antes de juntar, para no perder una copia que solo esa tienda clasifica así.
   */
  const filteredProducts = useMemo(() => {
    const storeRank = new Map(ids.map((id, i) => [id, i]));
    const rank = (p: ProductRowData) => storeRank.get(p.merchant_id) ?? Number.MAX_SAFE_INTEGER;
    const open = new Set((merchants.data ?? []).filter((m) => m.is_open).map((m) => m.id));
    const score = (p: ProductRowData) => (isProductAvailable(p) && open.has(p.merchant_id) ? 0 : 2) + (p.merchant_id === cartMerchantId ? 0 : 1);
    const catIds = chip ? categoryIdsForChip(chip, products.data?.categories ?? []) : null;
    const best = new Map<string, ProductRowData>();
    for (const p of [...(products.data?.products ?? [])].sort((a, b) => rank(a) - rank(b))) {
      if (catIds && (p.category_id == null || !catIds.has(p.category_id))) continue;
      const key = normalizeName(p.name);
      const cur = best.get(key);
      // El Map conserva el lugar de la primera copia (la de la tienda más cercana) aunque se cambie por otra.
      if (!cur || score(p) < score(cur)) best.set(key, p);
    }
    return [...best.values()].slice(0, ESSENTIALS_SHOWN);
  }, [products.data, merchants.data, cartMerchantId, chip, ids]);

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

  function toggleFavorite(id: string) {
    if (!requireAuth(category === "market" ? "/(customer)/market" : "/(customer)/pharmacy")) return;
    toggleFav.mutate({ merchantId: id, isFavorite: (favIds.data ?? []).includes(id) });
  }

  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);
  const openProduct = (id: string) => router.push(`/(customer)/product/${id}` as never);
  const pick = (key: string) => setChip(chip === key ? null : key);
  const market = config.category === "market";

  const storesBlock = merchants.isLoading ? (
    <View style={[styles.row, { paddingLeft: 17.5, gap: 6.1 }]}>
      {[0, 1].map((i) => <Skeleton key={i} width={market ? 183.8 : 177.3} height={market ? 172 : 172} style={{ borderRadius: radius.r16 }} />)}
    </View>
  ) : merchants.error ? (
    <ErrorState error={merchants.error} onRetry={() => { void merchants.refetch(); }} compact />
  ) : !merchants.data?.length ? (
    <EmptyState compact icon="storefront-outline" title={market ? "Aún no hay tiendas cerca" : "Aún no hay farmacias cerca"} body="Pronto llegaremos a tu zona con más opciones." />
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={market ? styles.storesMarket : styles.storesPharmacy}>
      {merchants.data.map((m) => market ? (
        <StoreCard key={m.id} m={m} onPress={() => openMerchant(m.id)} favorite={(favIds.data ?? []).includes(m.id)} onFavorite={() => toggleFavorite(m.id)} />
      ) : (
        <PharmacyCard key={m.id} m={m} onPress={() => openMerchant(m.id)} />
      ))}
    </ScrollView>
  );

  const productsBlock = products.isLoading ? (
    <View style={[styles.row, { paddingLeft: 17.5, gap: 7 }]}>
      {[0, 1, 2].map((i) => <Skeleton key={i} width={market ? 114.5 : 117.8} height={market ? 101 : 163.5} style={{ borderRadius: radius.r14 }} />)}
    </View>
  ) : products.error ? (
    <ErrorState error={products.error} onRetry={() => { void products.refetch(); }} compact />
  ) : !filteredProducts.length ? (
    <Text style={styles.noProducts}>{chip ? `No encontramos productos para "${chip}".` : "Aún no hay productos disponibles."}</Text>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={market ? styles.essList : styles.featList}>
      {filteredProducts.map((p) => {
        const m = merchants.data?.find((x) => x.id === p.merchant_id);
        const available = isProductAvailable(p);
        const onAdd = m && m.is_open && available ? () => addDirect(p, m) : undefined;
        if (market) {
          const { name, unit } = splitUnit(p.name);
          return <EssentialCard key={p.id} name={name} unit={unit} price={p.price} image={productImage(p, "card")} disabled={!available} onPress={() => openProduct(p.id)} onAdd={onAdd} />;
        }
        // Las fotos de diseño de 29 son recortes de la tarjeta (sobre blanco); las de la BD van centradas.
        const designWhite = productDesignImage(p.name, "white");
        return (
          <FeaturedProductCard key={p.id} name={p.name} price={p.price} image={designWhite ?? productImage(p)} disabled={!available}
            imageFrame={designWhite ? { width: 109, height: 98.8, left: 6, top: 4.2 } : { width: 103, height: 92, left: 7.4, top: 7 }}
            onPress={() => openProduct(p.id)} onAdd={onAdd} />
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={merchants.isRefetching} onRefresh={() => { void merchants.refetch(); void products.refetch(); }} tintColor={colors.blue} />}
      >
        <AddressHeader searchPlaceholder={searchPlaceholder} onSearch={() => router.push(`/(customer)/search?category=${category}` as never)} />

        {config.category === "market" ? (
          <>
            <CategoryTiles items={config.tiles} selected={chip} onSelect={pick} height={83.1} radius={14} gap={7.4} labelSize={10.8} labelGap={3.7} style={styles.tiles} />
            <View style={styles.gutter}>
              <MarketBanner title={config.banner.title} subtitle={config.banner.subtitle} style={{ marginTop: 11.9 }}
                onPress={ids[0] ? () => openMerchant(ids[0]) : undefined} />
              <BrowseSection title="Tiendas cercanas" actionTitle="Ver todas" size={17.1} style={{ marginTop: 18.4 }}
                onAction={() => router.push(`/(customer)/restaurants?category=${category}` as never)} />
            </View>
            <View style={{ marginTop: 2.7 }}>{storesBlock}</View>
            {ids.length ? (
              <>
                <View style={styles.gutter}>
                  <BrowseSection title="Lo esencial" size={17.1} style={{ marginTop: 18.1 }} onAction={ids[0] ? () => openMerchant(ids[0]) : undefined} />
                </View>
                <View style={{ marginTop: 4.2 }}>{productsBlock}</View>
              </>
            ) : null}
          </>
        ) : (
          <>
            <View style={[styles.gutter, styles.grid]}>
              {config.cards.map((c) => (
                <View key={c.key} style={styles.cell}>
                  <PharmacyCategoryCard item={c} selected={chip === c.key} onPress={() => pick(c.key)} />
                </View>
              ))}
            </View>
            <View style={styles.gutter}>
              <BrowseSection title="Farmacias cercanas" actionTitle="Ver todas" size={16.3} style={{ marginTop: 20.4 }}
                onAction={() => router.push(`/(customer)/restaurants?category=${category}` as never)} />
            </View>
            <View style={{ marginTop: 9.7 }}>{storesBlock}</View>
            {ids.length ? (
              <>
                <View style={[styles.sep, { marginTop: 14.9 }]} />
                <View style={styles.gutter}>
                  <BrowseSection title="Productos destacados" size={15.6} style={{ marginTop: 11.8 }} onAction={ids[0] ? () => openMerchant(ids[0]) : undefined} />
                </View>
                <View style={{ marginTop: 8.2 }}>{productsBlock}</View>
              </>
            ) : null}
          </>
        )}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingHorizontal: 17.5 },
  row: { flexDirection: "row" },
  tiles: { marginTop: 7.8, marginLeft: 17.1, marginRight: 17.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 6.5, marginTop: 11.8 },
  cell: { width: "48.9%" },
  storesMarket: { paddingHorizontal: 17.5, paddingVertical: 4, gap: 6.1 },
  storesPharmacy: { paddingHorizontal: 18, gap: 9.3 },
  essList: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8, gap: 7 },
  featList: { paddingHorizontal: 17.1, paddingBottom: 8, gap: 5.8 },
  sep: { height: 1, backgroundColor: "#E9ECF0", marginHorizontal: 17.5 },
  noProducts: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, paddingHorizontal: 17.5, marginTop: 6 },
  notice: { fontSize: 10.5, lineHeight: 14, color: colors.textPlaceholder, paddingHorizontal: 17.5, marginTop: 14 },
});
