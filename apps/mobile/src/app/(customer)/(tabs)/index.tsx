import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { colors, spacing } from "@yava/shared";
import { EmptyState, Skeleton } from "@/components/ui";
import {
  AddressHeader, CategoryGrid, PromoBanner, PromoBannerCard, SectionHeader, MerchantCarouselCard, MerchantCompactCard,
  ErrorState, CardsSkeleton, useTabBarSpace, type HomeCategory, type MerchantCardData,
} from "@/components/customer";
import { SponsoredCarousel, NearbyStoresGrid, RoundChevronHeader, DrinksHeader, DrinksRow } from "@/components/customer/home";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import { useCart } from "@/store/cart";
import {
  useNearbyMerchants, usePromotions, useFavoriteIds, useMerchantsByIds, useAddresses, activateAddress, type PromotionRow,
  useSponsoredPromotions, useNearbyDrinks, requireAdultFor, type NearbyDrink,
} from "@/features/customer";
import { FLYER_ASPECT } from "@/lib/promo-flyers";
import { confirm, notify } from "@/lib/dialog";

/** Aire del separador al título de la sección que sigue (13,8 pt medidos en 08: y 602 → y 617). */
const TITLE_TOP = 13.8;

/**
 * Aire de "Para tu próximo antojo" al separador del bloque nuevo: los 16,5 pt del separador de y 602 + 32 pt.
 * Con 16,5 pt justos, en 393 × 852 el título "Promociones" queda montado en el borde de la barra flotante y la
 * etiqueta "Patrocinado" del primer flyer asoma cortada entre la barra y la lupa. Ninguna corrección de pocos
 * puntos lo evita (esa ranura está abierta a todo lo alto de la barra); con +32 el título queda detrás de la
 * cápsula, la etiqueta entera bajo la barra y el separador justo en su borde superior.
 */
const MORE_TOP = 16.5 + 32;

/** Banner fijo del diseño cuando la BD no tiene promociones activas. */
const DEFAULT_BANNER = { title: "El sabor de la costa", subtitle: "Descubre tus favoritos", image_url: null, coupon_code: null };

/**
 * Pantalla 08 · Inicio (tanda-01/08-inicio.png): dirección + bolsa, buscador, 4 categorías pastel,
 * banner amarillo, "Restaurantes cerca" (carrusel C7) y "Para tu próximo antojo" (tarjetas C9).
 * Debajo (fuera del Drive, ver docs/DISENO-CLIENTE.md "Inicio · secciones nuevas"): "Promociones" (flyers de
 * pautas pagadas que pasan solos), "Tiendas cerca de ti" (cuadrícula 3 × 2 de tiendas de mercado) y
 * "Cervezas y licores" (con verificación de edad y leyenda legal). Una sección sin datos o con error no se muestra.
 * El bloque usa el mismo separador y el mismo aire separador → título que "Para tu próximo antojo" (ver `MORE_TOP`);
 * al abrir, su borde puede asomar alrededor de la barra flotante: es la señal normal de que hay más abajo.
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
  const sponsored = useSponsoredPromotions();
  const stores = useNearbyMerchants("market");
  const drinks = useNearbyDrinks();
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

  /**
   * Toque en una pauta: abre el restaurante y deja listo su cupón, como "Usar" en Ofertas (33). Se aplica si la
   * canasta está vacía o es de ese restaurante; si es de otro comercio solo se copia el código.
   */
  function onSponsored(p: PromotionRow) {
    onPromo(p);
    const code = p.coupon_code;
    if (!code || !p.merchant_id) return;
    void Clipboard.setStringAsync(code).catch(() => undefined);
    const name = nearby.data?.find((m) => m.id === p.merchant_id)?.name ?? "este restaurante";
    const cart = useCart.getState();
    if (!cart.lines.length || cart.merchant?.id === p.merchant_id) {
      cart.setCoupon(code);
      notify("Cupón listo", `${code} se aplicará al pagar tu pedido en ${name}.`);
    } else {
      notify("Código copiado", `Usa ${code} en tu pedido de ${name}.`);
    }
  }

  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);
  const bannerWidth = width - spacing.gutter * 2;

  /** "+" de "Cervezas y licores": verificación de edad (una vez por sesión) y luego a la canasta de esa tienda. */
  function addDrink(d: NearbyDrink) {
    const { product: p, store: m } = d;
    if (d.hasOptions) { router.push(`/(customer)/product/${p.id}` as never); return; }
    requireAdultFor([p.id], new Set([p.id]), () => {
      const merchant = { id: m.id, name: m.name, delivery_fee: m.delivery_fee, category: m.category, prep_min: m.prep_min, prep_max: m.prep_max };
      const line = { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] };
      const cart = useCart.getState();
      if (cart.addLine(merchant, line) === "different_merchant") {
        void confirm("Ya tienes una canasta", `Tu canasta tiene productos de ${cart.merchant?.name ?? "otro comercio"}. ¿Quieres vaciarla y agregar ${p.name}?`, { okText: "Vaciar canasta y agregar", destructive: true }).then((ok) => {
          if (!ok) return;
          useCart.getState().replaceWith(merchant, line);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }

  const showPromos = Boolean(sponsored.isLoading || sponsored.data?.length);
  const showStores = Boolean(stores.isLoading || stores.data?.length);
  const showDrinks = Boolean(drinks.isLoading || drinks.data?.length);
  const showMore = showPromos || showStores || showDrinks;
  /** La primera sección visible del bloque va pegada al separador (13,8 pt); las demás, a 24 pt de la anterior. */
  const first = showPromos ? "promos" : showStores ? "stores" : "drinks";
  const sectionTop = (key: typeof first) => (key === first ? styles.sectionFirst : styles.section);

  function refreshAll() {
    void nearby.refetch(); void promos.refetch(); void favIds.refetch();
    void sponsored.refetch(); void stores.refetch(); void drinks.refetch();
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={nearby.isRefetching} onRefresh={refreshAll} tintColor={colors.blue} />}
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
            <View style={[styles.gutter, styles.sectionFirst]}>
              <SectionHeader title="Para tu próximo antojo"
                onAction={() => router.push(session ? "/(customer)/favorites" as never : "/(customer)/restaurants?category=food" as never)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.carousel, { gap: 7 }]}>
              {cravings.map((m) => <MerchantCompactCard key={m.id} m={m} photoKind="compact" onPress={() => openMerchant(m.id)} />)}
            </ScrollView>
          </>
        ) : null}

        {/* ── Secciones nuevas (fuera del Drive): pautas, tiendas cercanas y licores ── */}
        {showMore ? (
          <View>
            <View style={[styles.gutter, styles.moreTop]}><View style={styles.separator} /></View>
            {sponsored.isLoading ? (
              <View style={[styles.gutter, sectionTop("promos")]}>
                <Skeleton width={110} height={16} style={{ marginBottom: 11 }} />
                <Skeleton height={Math.round(bannerWidth / FLYER_ASPECT)} style={{ borderRadius: 16 }} />
              </View>
            ) : sponsored.data?.length ? (
              <View style={sectionTop("promos")}>
                <View style={styles.gutter}><SectionHeader title="Promociones" /></View>
                <SponsoredCarousel items={sponsored.data} onPress={onSponsored} />
              </View>
            ) : null}

            {stores.isLoading ? (
              <View style={[styles.gutter, sectionTop("stores")]}>
                <Skeleton width={150} height={16} style={{ marginBottom: 11 }} />
                <View style={{ flexDirection: "row", gap: 10.5 }}>
                  {[0, 1, 2].map((i) => <Skeleton key={i} width={(bannerWidth - 21) / 3} height={70} style={{ borderRadius: 14 }} />)}
                </View>
              </View>
            ) : stores.data?.length ? (
              <View style={sectionTop("stores")}>
                <View style={styles.gutter}>
                  <RoundChevronHeader title="Tiendas cerca de ti" accessibilityLabel="Ver todas las tiendas" onPress={() => router.push("/(customer)/market" as never)} />
                </View>
                <NearbyStoresGrid stores={stores.data} onStore={(m) => openMerchant(m.id)} />
              </View>
            ) : null}

            {drinks.isLoading ? (
              <View style={[sectionTop("drinks"), { paddingLeft: spacing.gutter }]}>
                <Skeleton width={160} height={16} style={{ marginBottom: 11 }} />
                <CardsSkeleton count={3} width={128} photoHeight={118} gap={10} />
              </View>
            ) : drinks.data?.length ? (
              <View style={sectionTop("drinks")}>
                <View style={styles.gutter}><DrinksHeader /></View>
                <DrinksRow items={drinks.data}
                  onOpen={(d) => router.push(`/(customer)/product/${d.product.id}` as never)}
                  onAdd={addDrink}
                  onStore={(d) => openMerchant(d.store.id)} />
              </View>
            ) : null}
          </View>
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
  /** Separador del bloque de secciones nuevas (el mismo de y 602). */
  moreTop: { marginTop: MORE_TOP },
  /** Título justo después de un separador ("Para tu próximo antojo" y la primera sección nueva). */
  sectionFirst: { marginTop: TITLE_TOP },
  /** Aire entre las secciones nuevas. */
  section: { marginTop: 24 },
});
