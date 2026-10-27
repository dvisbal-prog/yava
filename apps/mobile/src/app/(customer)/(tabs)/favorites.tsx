import React, { useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Text, EmptyState } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { AddressHeader, SectionHeader, MerchantRow, ProductTile, ErrorState, ListSkeleton } from "@/components/customer";
import { useFavoriteIds, useMerchantsByIds, useToggleFavorite, useProductsOfMerchants, loginHref } from "@/features/customer";

/** Pantalla 34 · Favoritos. */
export default function Favorites() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const favIds = useFavoriteIds();
  const merchants = useMerchantsByIds(favIds.data ?? []);
  const products = useProductsOfMerchants(favIds.data ?? [], 10);
  const toggle = useToggleFavorite();

  const rows = useMemo(() => (merchants.data ?? []).map((m) => ({
    id: m.id ?? "", name: m.name ?? "", tagline: m.tagline, logo_url: m.logo_url, cover_url: m.cover_url, delivery_fee: m.delivery_fee ?? 0,
    prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0, rating_avg: Number(m.rating_avg ?? 0), rating_count: m.rating_count ?? 0, is_open: Boolean(m.is_open),
  })), [merchants.data]);

  if (!session) {
    return (
      <Screen padded={false}>
        <AddressHeader />
        <EmptyState icon="heart-outline" title="Guarda tus favoritos" body="Inicia sesión para guardar restaurantes y volver a pedir en segundos." actionTitle="Iniciar sesión" onAction={() => router.push(loginHref("/(customer)/favorites") as never)} />
      </Screen>
    );
  }

  const loading = favIds.isLoading || (Boolean(favIds.data?.length) && merchants.isLoading);
  const error = favIds.error ?? merchants.error;

  return (
    <Screen padded={false} refreshing={merchants.isRefetching} onRefresh={() => { void favIds.refetch(); void merchants.refetch(); }}>
      <AddressHeader onSearch={() => router.push("/(customer)/search" as never)} />
      <View style={{ paddingHorizontal: 16 }}>
        <Text variant="display" style={{ marginBottom: 12 }}>Favoritos</Text>
        {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState error={error} onRetry={() => { void favIds.refetch(); void merchants.refetch(); }} /> : !rows.length ? (
          <EmptyState icon="heart-outline" title="Aún no tienes favoritos" body="Toca el corazón en un restaurante para guardarlo aquí." actionTitle="Explorar restaurantes" onAction={() => router.push("/(customer)/restaurants?category=food" as never)} />
        ) : (
          <>
            <SectionHeader title="Mis restaurantes favoritos" />
            {rows.map((m) => (
              <MerchantRow key={m.id} m={m} onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)} right={
                <Pressable hitSlop={8} onPress={() => toggle.mutate({ merchantId: m.id, isFavorite: true })} style={{ marginLeft: 8 }}>
                  <Ionicons name="heart" size={20} color={colors.red} />
                </Pressable>
              } />
            ))}
            {products.data?.products.length ? (
              <>
                <SectionHeader title="De tus favoritos" style={{ marginTop: 24 }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {products.data.products.map((p) => <ProductTile key={p.id} p={p} merchantName={rows.find((m) => m.id === p.merchant_id)?.name} onPress={() => router.push(`/(customer)/product/${p.id}` as never)} />)}
                </ScrollView>
              </>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
