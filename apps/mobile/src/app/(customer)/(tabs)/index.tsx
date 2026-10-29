import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@yava/shared";
import { EmptyState, Skeleton } from "@/components/ui";
import {
  AddressHeader, CategoryGrid, PromoBanner, PromoBannerCard, SectionHeader, MerchantCarouselCard, MerchantCompactCard,
  ErrorState, CardsSkeleton, useTabBarSpace, type HomeCategory, type MerchantCardData,
} from "@/components/customer";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import {
  useNearbyMerchants, usePromotions, useFavoriteIds, useMerchantsByIds, useAddresses, activateAddress, type PromotionRow,
} from "@/features/customer";

/** Banner fijo del diseño cuando la BD no tiene promociones activas. */
const DEFAULT_BANNER = { title: "El sabor de la costa", subtitle: "Descubre tus favoritos", image_url: null, coupon_code: null };

/**
 * Pantalla 08 · Inicio (tanda-01/08-inicio.png): dirección + bolsa, buscador, 4 categorías pastel,
 * banner amarillo, "Restaurantes cerca" (carrusel C7) y "Para tu próximo antojo" (tarjetas C9).
 * La barra flotante la pone `(tabs)/_layout.tsx`.
 */
export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabSpace = useTabBarSpace();
  const session = useAuth((s) => s.session);
  const nearby = useNearbyMerchants("food");
  const promos = usePromotions();
  const favIds = useFavoriteIds();
  const favMerchants = useMerchantsByIds(favIds.data ?? []);
  const address = useLocation((s) => s.address);
  const addresses = useAddresses();
  const [locHydrated, setLocHydrated] = useState(() => useLocation.persist.hasHydrated());
  useEffect(() => useLocation.persist.onFinishHydration(() => setLocHydrated(true)), []);

  /**
   * El encabezado del diseño muestra la dirección principal ("Casa · Calle 2 # 3-45"). Si el cliente tiene
   * direcciones guardadas pero ninguna activa (instalación nueva, después de iniciar sesión), se activa la
   * principal; "Elige tu dirección de entrega" queda solo para quien no tiene ninguna.
   */
  useEffect(() => {
    if (!locHydrated || address || !session || !addresses.data?.length) return;
    const def = addresses.data.find((a) => a.is_default) ?? addresses.data[0];
    void activateAddress(def);
  }, [locHydrated, address, session, addresses.data]);

  /**
   * "Para tu próximo antojo": primero lo cercano que no es destacado (lo que no sale primero en "Restaurantes
   * cerca"; lo no guardado antes que los favoritos), luego los destacados (favoritos primero) y al final los
   * favoritos que no están cerca. El orden no depende de cuántos favoritos haya: con los datos demo da Amaras,
   * Bocamar, Naranmiche (el orden del diseño), tenga María uno o los tres restaurantes guardados.
   */
  const cravings = useMemo<MerchantCardData[]>(() => {
    const favs: MerchantCardData[] = (favMerchants.data ?? []).map((m) => ({
      id: m.id ?? "", name: m.name ?? "", slug: m.slug, tagline: m.tagline, logo_url: m.logo_url, cover_url: m.cover_url, delivery_fee: m.delivery_fee ?? 0,
      prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0, rating_avg: Number(m.rating_avg ?? 0), rating_count: m.rating_count ?? 0, is_open: Boolean(m.is_open),
    }));
    const favSet = new Set(favs.map((m) => m.id));
    const list = nearby.data ?? [];
    const nearSet = new Set(list.map((m) => m.id));
    const group = (featured: boolean, fav: boolean) => list.filter((m) => Boolean(m.featured) === featured && favSet.has(m.id) === fav);
    return [
      ...group(false, false), ...group(false, true),
      ...group(true, true), ...group(true, false),
      ...favs.filter((m) => !nearSet.has(m.id)),
    ].slice(0, 8);
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

  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);
  const bannerWidth = width - spacing.gutter * 2;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={nearby.isRefetching} onRefresh={() => { void nearby.refetch(); void promos.refetch(); void favIds.refetch(); }} tintColor={colors.blue} />}
      >
        <AddressHeader onSearch={() => router.push("/(customer)/search" as never)} />

        <View style={[styles.gutter, { marginTop: 7.8 }]}>
          <CategoryGrid onSelect={onCategory} />
        </View>

        <View style={styles.banner}>
          {promos.isLoading ? (
            <View style={styles.gutter}><Skeleton height={95} style={{ borderRadius: 14 }} /></View>
          ) : promos.data?.length ? (
            <PromoBanner items={promos.data} onPress={onPromo} />
          ) : (
            <View style={styles.gutter}>
              <PromoBannerCard promo={DEFAULT_BANNER} width={bannerWidth} onPress={() => router.push("/(customer)/restaurants?category=food" as never)} />
            </View>
          )}
        </View>

        <View style={[styles.gutter, { marginTop: 21.6 }]}>
          <SectionHeader title="Restaurantes cerca" onAction={() => router.push("/(customer)/restaurants?category=food" as never)} />
        </View>
        {nearby.isLoading ? (
          <View style={{ paddingLeft: spacing.gutter }}><CardsSkeleton count={3} width={135} photoHeight={70} /></View>
        ) : nearby.error ? (
          <ErrorState error={nearby.error} onRetry={() => { void nearby.refetch(); }} compact />
        ) : !nearby.data?.length ? (
          <EmptyState compact icon="restaurant-outline" title="Aún no hay restaurantes cerca" body="Prueba con otra dirección o vuelve más tarde."
            actionTitle="Cambiar dirección" onAction={() => router.push("/modal/address-picker" as never)} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {nearby.data.map((m) => <MerchantCarouselCard key={m.id} m={m} photoKind="carousel" onPress={() => openMerchant(m.id)} />)}
          </ScrollView>
        )}

        {cravings.length ? (
          <>
            <View style={[styles.gutter, styles.separatorWrap]}><View style={styles.separator} /></View>
            <View style={[styles.gutter, { marginTop: 13.8 }]}>
              <SectionHeader title="Para tu próximo antojo"
                onAction={() => router.push(session ? "/(customer)/favorites" as never : "/(customer)/restaurants?category=food" as never)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.carousel, { gap: 7 }]}>
              {cravings.map((m) => <MerchantCompactCard key={m.id} m={m} photoKind="compact" onPress={() => openMerchant(m.id)} />)}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingHorizontal: spacing.gutter },
  banner: { marginTop: 10.4 },
  carousel: { paddingHorizontal: spacing.gutter, gap: 8 },
  separatorWrap: { marginTop: 16.5 },
  separator: { height: 1, backgroundColor: colors.divider },
});
