import React, { useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@yava/shared";
import { EmptyState, Skeleton } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { AddressHeader, SectionHeader, ErrorState, useTabBarSpace, type MerchantCardData } from "@/components/customer";
import { UnderlineTabs, FavoriteMerchantCard, FavoriteProductCard } from "@/components/customer/account/parts";
import { ACC_GUTTER } from "@/components/customer/account/kit";
import { useFavoriteIds, useMerchantsByIds, useToggleFavorite, useProductsOfMerchants, loginHref } from "@/features/customer";

type Tab = "merchants" | "products";
const TABS: { value: Tab; label: string }[] = [{ value: "merchants", label: "Restaurantes" }, { value: "products", label: "Productos" }];

/** Cuántos restaurantes y productos se ven en la pestaña "Restaurantes" antes de "Ver todos". */
const MERCHANTS_PREVIEW = 3;
const PRODUCTS_PREVIEW = 1;
/** "Tus productos favoritos": productos de los primeros comercios guardados (se piden de sobra y se ordenan aquí). */
const PRODUCT_MERCHANTS = 5;
const PRODUCTS_FETCH = 60;
const PRODUCTS_SHOWN = 10;

/**
 * Pantalla 34 · Favoritos (tanda-05/34-favoritos.png): encabezado con dirección + bolsa, buscador, pestañas
 * subrayadas "Restaurantes / Productos", "Mis restaurantes favoritos" (tarjetas anchas con marcador azul) y
 * "Tus productos favoritos" (productos de los comercios guardados). La barra flotante la pone `(tabs)/_layout.tsx`.
 */
export default function Favorites() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const session = useAuth((s) => s.session);
  const favIds = useFavoriteIds();
  const merchants = useMerchantsByIds(favIds.data ?? []);
  const productMerchantIds = useMemo(() => (favIds.data ?? []).slice(0, PRODUCT_MERCHANTS), [favIds.data]);
  const products = useProductsOfMerchants(productMerchantIds, PRODUCTS_FETCH);
  const toggle = useToggleFavorite();
  const [tab, setTab] = useState<Tab>("merchants");
  const [allMerchants, setAllMerchants] = useState(false);

  /** Posición de cada comercio en favoritos (orden en que se guardaron): ordena restaurantes y productos. */
  const rank = useMemo(() => {
    const pos = new Map((favIds.data ?? []).map((id, i) => [id, i]));
    return (id: string | null | undefined) => pos.get(id ?? "") ?? Number.MAX_SAFE_INTEGER;
  }, [favIds.data]);
  const rows = useMemo<MerchantCardData[]>(() => (merchants.data ?? []).map((m) => ({
    id: m.id ?? "", name: m.name ?? "", slug: m.slug, tagline: m.tagline, logo_url: m.logo_url, cover_url: m.cover_url, delivery_fee: m.delivery_fee ?? 0,
    prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0, rating_avg: Number(m.rating_avg ?? 0), rating_count: m.rating_count ?? 0, is_open: Boolean(m.is_open),
  })).sort((a, b) => rank(a.id) - rank(b.id)), [merchants.data, rank]);
  const merchantName = (id: string | null) => rows.find((m) => m.id === id)?.name;
  // Productos: primero los del comercio guardado primero; dentro de cada comercio, orden del menú y nombre
  // (con los datos demo, "Ceviche clásico" de Bocamar encabeza "Tus productos favoritos"). Se ordena y se corta aquí:
  // el servidor corta por `sort` mezclando comercios y podría dejar fuera los del primero.
  const productList = useMemo(() => [...(products.data?.products ?? [])].sort((a, b) =>
    rank(a.merchant_id) - rank(b.merchant_id) || a.sort - b.sort || a.name.localeCompare(b.name, "es")).slice(0, PRODUCTS_SHOWN), [products.data, rank]);

  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);
  const openProduct = (id: string) => router.push(`/(customer)/product/${id}` as never);
  const refetch = () => { void favIds.refetch(); void merchants.refetch(); void products.refetch(); };

  if (!session) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}>
          <AddressHeader onSearch={() => router.push("/(customer)/search" as never)} />
          <EmptyState icon="bookmark-outline" title="Guarda tus favoritos" body="Inicia sesión para guardar restaurantes y volver a pedir en segundos."
            actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/favorites") as never)} />
        </ScrollView>
      </View>
    );
  }

  const loading = favIds.isLoading || (Boolean(favIds.data?.length) && merchants.isLoading);
  const error = favIds.error ?? merchants.error;
  const shownMerchants = allMerchants ? rows : rows.slice(0, MERCHANTS_PREVIEW);

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View style={[styles.gutter, { marginTop: 22, gap: 6 }]}>
        <Skeleton width={190} height={18} style={{ marginBottom: 6 }} />
        {[0, 1, 2].map((i) => <Skeleton key={i} height={108} style={{ borderRadius: radius.r16 }} />)}
      </View>
    );
  } else if (error) {
    body = <ErrorState error={error} onRetry={refetch} />;
  } else if (!rows.length) {
    body = (
      <EmptyState icon="bookmark-outline" title="Aún no tienes favoritos" body="Toca el marcador en un restaurante para guardarlo aquí."
        actionTitle="Explorar restaurantes" onAction={() => router.push("/(customer)/restaurants?category=food" as never)} />
    );
  } else if (tab === "products") {
    body = (
      <View style={[styles.gutter, { marginTop: 20 }]}>
        <SectionHeader title="Tus productos favoritos" style={styles.sectionHeader} />
        {products.isLoading ? <Skeleton height={88} style={{ borderRadius: radius.r16 }} /> : products.error ? (
          <ErrorState error={products.error} onRetry={() => { void products.refetch(); }} compact />
        ) : productList.length ? (
          <View style={{ gap: 8 }}>
            {productList.map((p) => <FavoriteProductCard key={p.id} p={p} merchantName={merchantName(p.merchant_id)} onPress={() => openProduct(p.id)} />)}
          </View>
        ) : (
          <EmptyState compact icon="bag-handle-outline" title="Sin productos por ahora" body="Tus restaurantes guardados aún no tienen productos publicados." />
        )}
      </View>
    );
  } else {
    body = (
      <>
        <View style={[styles.gutter, { marginTop: 18.5 }]}>
          <SectionHeader title="Mis restaurantes favoritos" actionTitle={allMerchants ? "Ver menos" : "Ver todos"} style={styles.sectionHeader}
            onAction={rows.length > MERCHANTS_PREVIEW ? () => setAllMerchants((v) => !v) : () => router.push("/(customer)/restaurants?category=food" as never)} />
          <View style={{ gap: 5.6 }}>
            {shownMerchants.map((m) => (
              <FavoriteMerchantCard key={m.id} m={m} onPress={() => openMerchant(m.id)} onToggle={() => toggle.mutate({ merchantId: m.id, isFavorite: true })} />
            ))}
          </View>
        </View>
        {productList.length ? (
          <View style={styles.gutter}>
            <View style={styles.separator} />
            <SectionHeader title="Tus productos favoritos" onAction={() => setTab("products")} style={[styles.sectionHeader, { marginTop: 17.5, marginBottom: 11 }]} />
            {productList.slice(0, PRODUCTS_PREVIEW).map((p) => (
              <FavoriteProductCard key={p.id} p={p} merchantName={merchantName(p.merchant_id)} onPress={() => openProduct(p.id)} />
            ))}
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={merchants.isRefetching} onRefresh={refetch} tintColor={colors.blue} />}>
        <AddressHeader onSearch={() => router.push("/(customer)/search" as never)} />
        <UnderlineTabs options={TABS} value={tab} onChange={setTab} style={styles.tabs} />
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingHorizontal: ACC_GUTTER },
  tabs: { marginTop: 17, marginHorizontal: 18 },
  sectionHeader: { marginBottom: 7.7 },
  separator: { height: 1.2, backgroundColor: "#E7E9EF", marginTop: 14.5 },
});
