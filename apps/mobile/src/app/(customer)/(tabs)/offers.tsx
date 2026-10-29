import React, { useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { colors, formatCOP, radius } from "@yava/shared";
import { Text, EmptyState, SearchBar, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { AddressHeader, SectionHeader, ErrorState, useTabBarSpace } from "@/components/customer";
import { OfferCard, DiscoverCard, OfferChips, type OfferFilter } from "@/components/customer/browse/OfferCards";
import { designImages, merchantDesignImage, merchantImage, promoImage } from "@/lib/design-images";
import { usePromotions, useMerchantsByIds, useNearbyMerchants, useProductsOfMerchants, type PromotionRow } from "@/features/customer";
import { notify } from "@/lib/dialog";

/** Proporción (ancho/alto) de las fotos de oferta del diseño (px del recorte), para anclarlas al borde derecho sin recortarlas. */
const OFFER_ASPECT = new Map<number, number>([
  [designImages.ofertaCevicheTarjeta, 468 / 382],
  [designImages.ofertaHamburguesaTarjeta, 495 / 421],
  [designImages.ofertaAmarasTarjeta, 523 / 203],
  [designImages.bannerMercadoCompleto, 448 / 281],
]);

/** Fondo crema de cada tarjeta de oferta (33): la 1.ª `#FDF6EC`, la 2.ª `#FEF6E4`; se alternan. */
const OFFER_BG = ["#FDF6EC", "#FEF6E4"];

function aspectOf(src: unknown): number | undefined {
  return typeof src === "number" ? OFFER_ASPECT.get(src) : undefined;
}

/**
 * Pantalla 33 · Ofertas (tanda-05/33-ofertas.png): dirección (sin bolsa), "Ofertas", buscador, chips de categoría,
 * tarjetas de promoción con foto fundida a la derecha y "Descubre más" (comercios sin promoción con su precio desde).
 * Las promociones con cupón lo aplican a la canasta (o copian el código) desde el botón o el código resaltado.
 */
export default function Offers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [filter, setFilter] = useState<OfferFilter>("all");
  const promos = usePromotions();
  const merchantIds = useMemo(() => Array.from(new Set((promos.data ?? []).map((p) => p.merchant_id).filter((x): x is string => Boolean(x)))), [promos.data]);
  const merchants = useMerchantsByIds(merchantIds);
  const nearby = useNearbyMerchants(null);
  const setCoupon = useCart((s) => s.setCoupon);
  const cartLines = useCart((s) => s.lines);

  const visible = useMemo(() => {
    const list = promos.data ?? [];
    if (filter === "all") return list;
    return list.filter((p) => merchants.data?.find((m) => m.id === p.merchant_id)?.category === filter);
  }, [promos.data, merchants.data, filter]);

  // "Descubre más": comercios cercanos sin promoción (de la categoría elegida) con su precio más bajo.
  const discover = useMemo(() => {
    const promoted = new Set(merchantIds);
    return (nearby.data ?? []).filter((m) => !promoted.has(m.id) && (filter === "all" || m.category === filter)).slice(0, 3);
  }, [nearby.data, merchantIds, filter]);
  const discoverIds = useMemo(() => discover.map((m) => m.id), [discover]);
  const discoverProducts = useProductsOfMerchants(discoverIds, 60);
  const minPrice = useMemo(() => {
    const out = new Map<string, number>();
    for (const p of discoverProducts.data?.products ?? []) {
      const cur = out.get(p.merchant_id);
      if (cur === undefined || p.price < cur) out.set(p.merchant_id, p.price);
    }
    return out;
  }, [discoverProducts.data]);

  async function applyCoupon(code: string) {
    await Clipboard.setStringAsync(code);
    if (cartLines.length) {
      setCoupon(code);
      notify("Cupón aplicado", `${code} se aplicará al pagar tu canasta.`);
    } else {
      notify("Código copiado", `Usa ${code} al revisar tu pedido.`);
    }
  }

  function promoPhoto(p: PromotionRow) {
    const m = merchants.data?.find((x) => x.id === p.merchant_id);
    const design = m ? merchantDesignImage({ name: m.name, slug: m.slug }, "offer") : undefined;
    return design ?? promoImage(p);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={promos.isRefetching} onRefresh={() => { void promos.refetch(); void nearby.refetch(); }} tintColor={colors.blue} />}
      >
        <AddressHeader bag={false} />
        <View style={styles.gutter}>
          <Text style={styles.h1}>Ofertas</Text>
          <SearchBar placeholder="Busca una oferta" onPress={() => router.push("/(customer)/search" as never)} style={{ marginTop: 9.4 }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12.8 }} contentContainerStyle={{ paddingHorizontal: 17.3 }}>
          <OfferChips value={filter} onChange={setFilter} />
        </ScrollView>

        <View style={[styles.gutter, { marginTop: 12.9, gap: 12.5 }]}>
          {promos.isLoading ? (
            <>
              <Skeleton height={176} style={{ borderRadius: radius.r18 }} />
              <Skeleton height={176} style={{ borderRadius: radius.r18 }} />
            </>
          ) : promos.error ? (
            <ErrorState error={promos.error} onRetry={() => { void promos.refetch(); }} compact />
          ) : !visible.length ? (
            <EmptyState compact icon="pricetag-outline" title="No hay promociones por ahora" body="Vuelve pronto: publicamos ofertas nuevas cada semana." />
          ) : visible.map((p, i) => {
            const m = merchants.data?.find((x) => x.id === p.merchant_id);
            const image = promoPhoto(p);
            const openMerchant = p.merchant_id ? () => router.push(`/(customer)/merchant/${p.merchant_id}` as never) : undefined;
            const useCoupon = p.coupon_code ? () => { void applyCoupon(p.coupon_code as string); } : undefined;
            return (
              <OfferCard key={p.id} id={`oferta-${p.id}`} eyebrow={m?.name ?? (p.coupon_code ? "Cupón" : null)} title={p.title} subtitle={p.subtitle}
                highlight={p.coupon_code} onHighlight={useCoupon} image={image} aspect={aspectOf(image)} bg={OFFER_BG[i % OFFER_BG.length]}
                cta={openMerchant ? "Pedir ahora" : "Usar cupón"} onCta={openMerchant ?? useCoupon} />
            );
          })}
        </View>

        {discover.length ? (
          <View style={[styles.gutter, { marginTop: 16.4 }]}>
            <SectionHeader title="Descubre más" />
            <View style={{ gap: 10 }}>
              {discover.map((m) => {
                const design = merchantDesignImage(m, "offer");
                const min = minPrice.get(m.id);
                return (
                  <DiscoverCard key={m.id} id={`descubre-${m.id}`} name={m.name} tagline={m.tagline} fromPrice={min !== undefined ? formatCOP(min) : null}
                    image={design ?? merchantImage(m, "card")} aspect={aspectOf(design)} onPress={() => router.push(`/(customer)/merchant/${m.id}` as never)} />
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingHorizontal: 17.5 },
  h1: { fontSize: 27.7, lineHeight: 33, fontWeight: "700", letterSpacing: -0.4, color: colors.ink, marginTop: 7.2 },
});
