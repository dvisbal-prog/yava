import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@yava/shared";
import type { MerchantCategory } from "@yava/shared";
import { Screen, Chip, EmptyState, Text } from "@/components/ui";
import { AddressHeader, MerchantRow, ErrorState, ListSkeleton, CartBar } from "@/components/customer";
import { useNearbyMerchants, useMerchantFilters, applyMerchantFilters } from "@/features/customer";

const TITLES: Record<MerchantCategory, { title: string; search: string; empty: string }> = {
  food: { title: "Restaurantes cerca", search: "Busca platos o restaurantes", empty: "No hay restaurantes con estos filtros" },
  market: { title: "Tiendas de mercado", search: "Busca productos o tiendas", empty: "No hay tiendas con estos filtros" },
  pharmacy: { title: "Farmacias", search: "Busca medicamentos o farmacias", empty: "No hay farmacias con estos filtros" },
};

/** Pantalla 09 · Lista de comercios por categoría con filtros rápidos. */
export default function Restaurants() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const category: MerchantCategory = params.category === "market" || params.category === "pharmacy" ? params.category : "food";
  const q = useNearbyMerchants(category);
  const filters = useMerchantFilters();
  const activeCount = filters.activeCount();

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    (q.data ?? []).forEach((m) => m.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t.charAt(0).toUpperCase() + t.slice(1));
  }, [q.data]);

  const list = useMemo(() => applyMerchantFilters(q.data ?? [], filters), [q.data, filters]);
  const t = TITLES[category];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Screen padded={false} refreshing={q.isRefetching} onRefresh={() => { void q.refetch(); }}>
        <AddressHeader back searchPlaceholder={t.search} onSearch={() => router.push(`/(customer)/search?category=${category}` as never)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Chip label={activeCount ? `Filtros · ${activeCount}` : "Ordenar"} icon="options-outline" selected={activeCount > 0} onPress={() => router.push("/modal/filters" as never)} />
          <Chip label="Mejor valorados" selected={filters.sort === "rating"} onPress={() => filters.set({ sort: filters.sort === "rating" ? "recommended" : "rating" })} />
          <Chip label="Hasta 35 min" selected={filters.maxTime === 35} onPress={() => filters.set({ maxTime: filters.maxTime === 35 ? null : 35 })} />
          <Chip label="Abierto ahora" selected={filters.openNow} onPress={() => filters.set({ openNow: !filters.openNow })} />
          {tags.map((tag) => <Chip key={tag} label={tag} selected={filters.tag?.toLowerCase() === tag.toLowerCase()} onPress={() => filters.set({ tag: filters.tag?.toLowerCase() === tag.toLowerCase() ? null : tag })} />)}
        </ScrollView>
        <View style={{ paddingHorizontal: 16 }}>
          <Text variant="heading" style={{ marginBottom: 4 }}>{t.title}</Text>
          {q.isLoading ? <ListSkeleton rows={4} /> : q.error ? <ErrorState error={q.error} onRetry={() => { void q.refetch(); }} /> : !list.length ? (
            <EmptyState icon="search-outline" title={t.empty} body="Prueba quitando algún filtro o cambia tu dirección." actionTitle={activeCount ? "Limpiar filtros" : undefined} onAction={() => filters.reset()} />
          ) : list.map((m) => <MerchantRow key={m.id} m={m} onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)} />)}
          <View style={{ height: 80 }} />
        </View>
      </Screen>
      <CartBar />
    </View>
  );
}
