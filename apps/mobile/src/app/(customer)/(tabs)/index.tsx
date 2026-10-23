import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@yava/shared";
import { Screen, Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { AddressHeader, CategoryGrid, PromoBanner, SectionHeader, MerchantCardWide, ErrorState, CardsSkeleton, CartBar, type HomeCategory } from "@/components/customer";
import { useNearbyMerchants, usePromotions, useFavoriteIds, useMerchantsByIds, type PromotionRow } from "@/features/customer";

/** Pantalla 08 · Inicio. */
export default function Home() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const nearby = useNearbyMerchants("food");
  const promos = usePromotions();
  const favIds = useFavoriteIds();
  const favMerchants = useMerchantsByIds(favIds.data ?? []);

  const cravings = useMemo(() => {
    const favs = (favMerchants.data ?? []).map((m) => ({
      id: m.id ?? "", name: m.name ?? "", tagline: m.tagline, logo_url: m.logo_url, cover_url: m.cover_url, delivery_fee: m.delivery_fee ?? 0,
      prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0, rating_avg: Number(m.rating_avg ?? 0), rating_count: m.rating_count ?? 0, is_open: Boolean(m.is_open),
    }));
    if (favs.length) return favs;
    return (nearby.data ?? []).filter((m) => m.featured).slice(0, 6);
  }, [favMerchants.data, nearby.data]);

  function onCategory(c: HomeCategory) {
    if (c === "food") router.push("/(customer)/restaurants?category=food" as never);
    else if (c === "market") router.push("/(customer)/market" as never);
    else if (c === "pharmacy") router.push("/(customer)/pharmacy" as never);
    else router.push("/(customer)/shipments/new" as never);
  }

  function onPromo(p: PromotionRow) {
    if (p.merchant_id) router.push(`/(customer)/merchant/${p.merchant_id}` as never);
    else router.push("/(customer)/offers" as never);
  }

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Screen padded={false} refreshing={nearby.isRefetching} onRefresh={() => { void nearby.refetch(); void promos.refetch(); }}>
        <AddressHeader onSearch={() => router.push("/(customer)/search" as never)} />
        <View style={{ paddingHorizontal: 16 }}>
          {session && firstName ? <Text variant="title" style={{ marginBottom: 12 }}>Hola, {firstName}. ¿Qué se te antoja hoy?</Text> : null}
          <CategoryGrid onSelect={onCategory} />

          <View style={{ marginTop: 20 }}>
            {promos.isLoading ? <CardsSkeleton count={1} width={320} /> : promos.data?.length ? <PromoBanner items={promos.data} onPress={onPromo} /> : null}
          </View>

          <SectionHeader title="Restaurantes cerca" style={{ marginTop: 24 }} onAction={() => router.push("/(customer)/restaurants?category=food" as never)} />
        </View>
        {nearby.isLoading ? (
          <View style={{ paddingLeft: 16 }}><CardsSkeleton count={2} /></View>
        ) : nearby.error ? (
          <ErrorState error={nearby.error} onRetry={() => { void nearby.refetch(); }} compact />
        ) : !nearby.data?.length ? (
          <EmptyState icon="restaurant-outline" title="Aún no hay restaurantes cerca" body="Prueba con otra dirección o vuelve más tarde." actionTitle="Cambiar dirección" onAction={() => router.push("/modal/address-picker" as never)} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}>
            {nearby.data.map((m) => <MerchantCardWide key={m.id} m={m} onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)} />)}
          </ScrollView>
        )}

        {cravings.length ? (
          <>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionHeader title="Para tu próximo antojo" style={{ marginTop: 24 }} onAction={() => router.push(session ? "/(customer)/favorites" as never : "/(customer)/restaurants?category=food" as never)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}>
              {cravings.map((m) => <MerchantCardWide key={m.id} m={m} onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)} />)}
            </ScrollView>
          </>
        ) : null}
        <View style={{ height: 80 }} />
      </Screen>
      <CartBar />
    </View>
  );
}
