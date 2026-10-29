import React, { useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@yava/shared";
import type { MerchantCategory } from "@yava/shared";
import { EmptyState, Text, Skeleton } from "@/components/ui";
import { ErrorState, CartBar } from "@/components/customer";
import { BackAddressBar } from "@/components/customer/browse/BrowseHeader";
import { SearchPill } from "@/components/customer/browse/SearchPill";
import { QuickChip, SortChip } from "@/components/customer/browse/QuickChips";
import { CategoryTiles, type TileItem } from "@/components/customer/browse/CategoryTiles";
import { NearbyCard } from "@/components/customer/browse/NearbyCard";
import { FiltersSheetModal } from "@/components/customer/browse/FiltersSheet";
import { designImages, normalizeName } from "@/lib/design-images";
import { useNearbyMerchants, useMerchantFilters, applyMerchantFilters } from "@/features/customer";

const TITLES: Record<MerchantCategory, { search: string; empty: string }> = {
  food: { search: "Busca platos o restaurantes", empty: "No hay restaurantes con estos filtros" },
  market: { search: "Busca productos o tiendas", empty: "No hay tiendas con estos filtros" },
  pharmacy: { search: "Busca productos de farmacia", empty: "No hay farmacias con estos filtros" },
};

/** Tiles de 09 con su foto del diseño y las palabras con las que se reconocen las etiquetas (`tags`) de cada comercio. */
const FOOD_TILES: (TileItem & { keys: string[] })[] = [
  { key: "ceviches", label: "Ceviches", image: designImages.tileCeviches, flex: 87.3, keys: ["ceviche", "mariscos"] },
  { key: "hamburguesas", label: "Hamburguesas", image: designImages.tileHamburguesas, flex: 86.4, keys: ["hamburguesa"] },
  { key: "shawarmas", label: "Shawarmas", image: designImages.tileShawarmas, flex: 86.3, keys: ["shawarma", "arabe"] },
  { key: "bebidas", label: "Bebidas", image: designImages.tileBebidas, flex: 77.1, keys: ["bebida", "jugo", "limonada"] },
];

/**
 * Pantalla 09 · Restaurantes (tanda-02/09-restaurantes.png): encabezado con atrás y dirección, buscador,
 * chips rápidos ([filtros | Ordenar ⌄], Mejor valorados, Hasta 35 min), tiles con foto por tipo de comida y
 * "Cerca de ti" con tarjetas anchas. También sirve "Ver todas" de Mercado y Farmacia (sin tiles).
 * Los filtros (11) se abren como hoja sobre esta pantalla.
 */
export default function Restaurants() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const category: MerchantCategory = params.category === "market" || params.category === "pharmacy" ? params.category : "food";
  const q = useNearbyMerchants(category);
  const filters = useMerchantFilters();
  const activeCount = filters.activeCount();
  const [sheet, setSheet] = useState(false);

  const list = useMemo(() => applyMerchantFilters(q.data ?? [], filters), [q.data, filters]);
  const t = TITLES[category];

  /** Etiqueta real (de la BD) que corresponde a un tile; `null` si ningún comercio cercano la tiene. */
  function tagForTile(tile: (typeof FOOD_TILES)[number]): string | null {
    for (const m of q.data ?? []) {
      for (const tag of m.tags) {
        const n = normalizeName(tag);
        if (tile.keys.some((k) => n.startsWith(k))) return tag;
      }
    }
    return null;
  }

  const selectedTile = FOOD_TILES.find((tile) => {
    const tag = filters.tag ? normalizeName(filters.tag) : null;
    return tag ? tile.keys.some((k) => tag.startsWith(k)) : false;
  })?.key ?? null;

  function onTile(key: string) {
    const tile = FOOD_TILES.find((x) => x.key === key);
    if (!tile) return;
    if (selectedTile === key) { filters.set({ tag: null }); return; }
    const tag = tagForTile(tile);
    if (tag) filters.set({ tag });
    else router.push(`/(customer)/search?q=${encodeURIComponent(tile.label)}` as never);
  }

  // Los chips rápidos ya muestran su propio estado; el chip de filtros se marca con el resto de filtros activos.
  const sheetActive = activeCount - (filters.sort === "rating" ? 1 : 0) - (filters.maxTime === 35 ? 1 : 0) - (filters.tag ? 1 : 0) > 0;
  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { void q.refetch(); }} tintColor={colors.blue} />}
      >
        <BackAddressBar />
        <SearchPill placeholder={t.search} onPress={() => router.push(`/(customer)/search?category=${category}` as never)} style={styles.search} iconLeft={13.3} textLeft={14.7} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          <SortChip onPress={() => setSheet(true)} active={sheetActive} />
          <QuickChip icon="trophy-outline" label="Mejor valorados" active={filters.sort === "rating"}
            onPress={() => filters.set({ sort: filters.sort === "rating" ? "recommended" : "rating" })} />
          <QuickChip icon="flash-outline" label="Hasta 35 min" active={filters.maxTime === 35}
            onPress={() => filters.set({ maxTime: filters.maxTime === 35 ? null : 35 })} />
        </ScrollView>

        {category === "food" ? (
          <CategoryTiles items={FOOD_TILES} selected={selectedTile} onSelect={onTile} style={styles.tiles} />
        ) : null}

        <View style={styles.gutter}>
          <Text style={[styles.section, { marginTop: category === "food" ? 28.5 : 14 }]}>Cerca de ti</Text>
          {q.isLoading ? (
            <View style={{ gap: 14, marginTop: 6.9 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ gap: 7 }}>
                  <Skeleton height={99.8} style={{ borderRadius: radius.r10 }} />
                  <Skeleton width="35%" height={12} />
                  <Skeleton width="55%" height={10} />
                </View>
              ))}
            </View>
          ) : q.error ? (
            <ErrorState error={q.error} onRetry={() => { void q.refetch(); }} />
          ) : !list.length ? (
            <EmptyState icon="search-outline" title={t.empty} body="Prueba quitando algún filtro o cambia tu dirección."
              actionTitle={activeCount ? "Limpiar filtros" : undefined} onAction={() => filters.reset()} />
          ) : (
            <View style={{ marginTop: 5.2, gap: 8.1 }}>
              {list.map((m) => <NearbyCard key={m.id} m={m} photoKind={category === "food" ? "nearby" : "storefront"} onPress={() => openMerchant(m.id)} />)}
            </View>
          )}
        </View>
      </ScrollView>
      <CartBar />
      <FiltersSheetModal visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingLeft: 16.6, paddingRight: 16.2 },
  search: { marginTop: 5.8, marginLeft: 16.6, marginRight: 16.2 },
  chipsScroll: { marginTop: 7.6 },
  chips: { paddingHorizontal: 17, paddingVertical: 8, gap: 9.4 },
  tiles: { marginTop: 11.6, marginLeft: 16.6, marginRight: 16.2 },
  section: { fontSize: 17.4, lineHeight: 21, fontWeight: "700", letterSpacing: -0.25, color: colors.ink },
});
