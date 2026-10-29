import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Share, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatRating } from "@yava/shared";
import { Text, Badge, Skeleton, EmptyState, IconButton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { isProductAvailable } from "@/components/customer/ProductRow";
import { ErrorState } from "@/components/customer/QueryState";
import { CartBar } from "@/components/customer/CartBar";
import { etaText } from "@/components/customer/MerchantCard";
import { StoreHero, HeroButton, extendedHero } from "@/components/customer/store/StoreHero";
import { RiderIcon } from "@/components/customer/store/StoreIcons";
import {
  InfoStrip, UnderlineTabs, MenuGridCard, SegmentBar, MarketProductCard, ClosedMenuCard, ClosedNotice, StatCell,
} from "@/components/customer/store/MenuParts";
import { buildSections, featuredProducts, topPerCategory, merchantSubtitle, splitUnit } from "@/components/customer/store/featured";
import {
  useMerchant, useMerchantMenu, useMerchantHours, useFavoriteIds, useToggleFavorite, useRequireAuth, nextOpeningLabel,
  type ProductRow as ProductRowData, type MerchantPublic,
} from "@/features/customer";
import { merchantImage, merchantDesignImage, productImage } from "@/lib/design-images";
import { confirm } from "@/lib/dialog";

const FEATURED = "__destacados__";
/** Proporción alto/ancho de los recortes de portada (12/43 Bocamar 851×543; 26 mercado 851×348). */
const ASPECT_FOOD = 543 / 851;
const ASPECT_STORE = 348 / 851;
/** Portada propia de la pantalla 12 (851×443 px desde el tope del PNG). */
const ASPECT_MENU = 443 / 851;
/** Borde superior de la hoja blanca (pt bajo la barra de estado) y su radio, medidos en los PNG. */
const SHEET_43 = { top: 215, radius: 19 };
const SHEET_26 = { top: 124.2, radius: 13 };

/**
 * Pantalla del comercio:
 * - 12 Menú del restaurante (tanda-02/12-bocamar-menu.png): portada, logo + nombre, franja de 3 datos, pestañas
 *   subrayadas ("Más pedidos" + categorías) y grid de 2 columnas.
 * - 26 Tienda de mercado / farmacia (tanda-04/26-mercado-tienda.png): portada con hoja blanca, logo grande,
 *   barra segmentada ("Destacados" + categorías) y tarjetas con "+".
 * - 43 Restaurante cerrado (tanda-06/43-restaurante-cerrado.png): portada alta, "Cerrado", datos, aviso de
 *   apertura, "Menú destacado" y "Ver otros restaurantes".
 */
export default function MerchantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const merchant = useMerchant(id);
  const menu = useMerchantMenu(id);
  const hours = useMerchantHours(merchant.data && !merchant.data.is_open ? id : undefined);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const requireAuth = useRequireAuth();
  const cart = useCart();
  const [tab, setTab] = useState<string>(FEATURED);
  const [scrollY, setScrollY] = useState(0);
  const [tabsY, setTabsY] = useState<number | null>(null);

  const m = merchant.data;
  const isFav = Boolean(id && favIds.data?.includes(id));
  const isOpen = Boolean(m?.is_open);
  const isStore = m?.category === "market" || m?.category === "pharmacy";
  const inlineQty = isStore;

  const sections = useMemo(() => buildSections(menu.data?.products ?? [], menu.data?.categories ?? []), [menu.data]);
  const featured = useMemo(() => featuredProducts(sections, isStore ? "store" : "food"), [sections, isStore]);
  const tabs = useMemo(() => [
    { key: FEATURED, label: isStore ? "Destacados" : "Más pedidos" },
    ...sections.map((s) => ({ key: s.id, label: s.name })),
  ], [sections, isStore]);
  const visible = tab === FEATURED ? featured : sections.find((s) => s.id === tab)?.items ?? featured;
  useEffect(() => { if (tab !== FEATURED && !sections.some((s) => s.id === tab)) setTab(FEATURED); }, [sections, tab]);

  const cartMerchant = m ? { id: m.id ?? "", name: m.name ?? "", delivery_fee: m.delivery_fee ?? 0, category: m.category ?? "food", prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0 } : null;

  function qtyOf(productId: string): number {
    if (cart.merchant?.id !== id) return 0;
    return cart.lines.filter((l) => l.product_id === productId).reduce((a, l) => a + l.qty, 0);
  }

  function addDirect(p: ProductRowData) {
    if (!cartMerchant) return;
    const line = { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] };
    const res = cart.addLine(cartMerchant, line);
    if (res === "different_merchant") {
      void confirm("Ya tienes una canasta", `Tu canasta tiene productos de ${cart.merchant?.name ?? "otro comercio"}. ¿Quieres vaciarla y agregar ${p.name}?`, { okText: "Vaciar canasta y agregar", destructive: true }).then((ok) => {
        if (!ok) return;
        cart.replaceWith(cartMerchant, line);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function setQty(p: ProductRowData, q: number) {
    const idx = cart.lines.findIndex((l) => l.product_id === p.id && l.options.length === 0);
    if (idx < 0) { if (q > 0) addDirect(p); return; }
    cart.setQty(idx, q);
    void Haptics.selectionAsync();
  }

  function onProduct(p: ProductRowData) {
    router.push(`/(customer)/product/${p.id}` as never);
  }

  function onAdd(p: ProductRowData) {
    if (!isOpen) return;
    if (menu.data?.withOptions.has(p.id) || !inlineQty) { onProduct(p); return; }
    addDirect(p);
  }

  function toggleFavorite() {
    if (!requireAuth(`/(customer)/merchant/${id}`)) return;
    toggleFav.mutate({ merchantId: id, isFavorite: isFav });
  }

  function goBack() {
    if (router.canGoBack()) router.back(); else router.replace("/(customer)" as never);
  }

  function share() {
    if (!m?.name) return;
    Share.share({ message: `Pide en ${m.name} con YAVA.` }).catch(() => undefined);
  }

  const closedLabel = !isOpen ? (nextOpeningLabel(hours.data ?? []) ?? "Cerrado por ahora") : null;
  const soldOut = (p: ProductRowData) => (isProductAvailable(p) ? undefined : p.status === "paused" ? "Pausado" : "Agotado");

  if (merchant.isLoading) return <MerchantSkeleton />;
  if (merchant.error || !m) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
        <IconButton icon="chevron-back" variant="gray" size={34} iconSize={19} onPress={goBack} accessibilityLabel="Volver" style={{ marginLeft: 17, marginTop: 8 }} />
        {merchant.error ? <ErrorState error={merchant.error} onRetry={() => { void merchant.refetch(); }} /> : (
          <EmptyState icon="storefront-outline" title="Comercio no disponible" body="Este comercio no está activo en este momento." actionTitle="Ver otros comercios" onAction={() => router.replace("/(customer)/restaurants" as never)} />
        )}
      </View>
    );
  }

  const menuState = menu.isLoading ? "loading" : menu.error ? "error" : !sections.length ? "empty" : "ok";
  const menuFallback = menuState === "loading" ? (
    <View style={styles.gridSkeleton}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: (width - 25.9 - 11.5) / 2, gap: 7 }}>
          <Skeleton width="100%" height={115.5} style={{ borderRadius: radius.r12 }} />
          <Skeleton width="70%" height={13} /><Skeleton width="90%" height={10} /><Skeleton width="40%" height={14} />
        </View>
      ))}
    </View>
  ) : menuState === "error" ? (
    <ErrorState error={menu.error} onRetry={() => { void menu.refetch(); }} />
  ) : menuState === "empty" ? (
    <EmptyState icon="fast-food-outline" title="Menú en construcción" body="Este comercio aún no ha publicado productos." />
  ) : null;

  /* ───────────── 43 · Restaurante cerrado ───────────── */
  if (!isOpen && !isStore) {
    // "Menú destacado": dos platos (como en el diseño), uno por categoría y, si faltan, los siguientes del menú.
    const highlights = [...topPerCategory(sections), ...featured].filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i).slice(0, 2);
    const hero = extendedHero(merchantImage(m, "cover"), ASPECT_FOOD);
    const cardW = (width - 18.9 - 18.5 - 10.6) / 2;
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) + 82 }} showsVerticalScrollIndicator={false}>
          <StoreHero source={hero.source} height={SHEET_43.top + SHEET_43.radius} aspect={hero.aspect} buttonsLeft={15} buttonsTop={9}
            left={<HeroButton icon="chevron-back" label="Volver" onPress={goBack} size={37} iconSize={21} />} />
          <View style={[styles.sheet, { marginTop: -SHEET_43.radius, borderTopLeftRadius: SHEET_43.radius, borderTopRightRadius: SHEET_43.radius, paddingTop: 21.3 }]}>
            <View style={styles.closedTitleRow}>
              <Text style={styles.closedName} numberOfLines={1}>{m.name}</Text>
              <View style={styles.closedBadge}><Text style={styles.closedBadgeText}>Cerrado</Text></View>
            </View>
            <Text style={styles.closedSub} numberOfLines={1}>{merchantSubtitle(m)}</Text>
            <View style={styles.statsRow}>
              <StatCell icon={<Ionicons name="star" size={17} color={colors.star} />} value={formatRating(Number(m.rating_avg ?? 0))} strong extra={`(${m.rating_count ?? 0}+)`} label="Calificación" />
              <Text style={styles.statDot}>•</Text>
              <StatCell value={etaText(m.prep_min, m.prep_max) || "—"} label="Tiempo" />
              <Text style={styles.statDot}>•</Text>
              <StatCell value={m.delivery_fee ? formatCOP(m.delivery_fee) : "Gratis"} label="Envío" />
            </View>
            <View style={[styles.hr, { marginTop: 17.2 }]} />
            <ClosedNotice title={closedLabel ?? "Cerrado por ahora"} body="Puedes ver el menú y volver cuando esté abierto." style={{ marginTop: 16.5 }} />
            <View style={[styles.hr, { marginTop: 15.1 }]} />
            <Text style={styles.closedSection}>Menú destacado</Text>
          </View>
          {menuFallback ?? (
            <View style={styles.closedCards}>
              {highlights.map((p) => (
                <ClosedMenuCard key={p.id} width={cardW} name={p.name} price={p.price} image={productImage(p)} onPress={() => onProduct(p)} />
              ))}
            </View>
          )}
        </ScrollView>
        <View style={[styles.closedCta, { bottom: Math.max(insets.bottom + 15, 16) }]}>
          {/* CTA de 43: azul propio del PNG (#0052C0), texto 13,5 pt medio y chevron fino. */}
          <Pressable accessibilityRole="button" accessibilityLabel="Ver otros restaurantes"
            onPress={() => router.replace(`/(customer)/restaurants?category=${m.category ?? "food"}` as never)}
            style={({ pressed }) => [styles.closedCtaBtn, pressed ? { backgroundColor: colors.blueDark } : null]}>
            <Text style={styles.closedCtaText}>Ver otros restaurantes</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.white} style={{ marginLeft: 6, marginTop: 1 }} />
          </Pressable>
        </View>
      </View>
    );
  }

  /* ───────────── 26 · Tienda de mercado / farmacia ───────────── */
  if (isStore) {
    const cardW = (width - 17.1 - 17 - 11.5) / 2;
    const hero = extendedHero(merchantImage(m, "cover"), ASPECT_STORE);
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <StoreHero source={hero.source} height={SHEET_26.top + SHEET_26.radius} aspect={hero.aspect}
            left={<HeroButton icon="chevron-back" label="Volver" onPress={goBack} size={38.8} iconSize={21} />}
            right={<>
              <HeroButton icon="search" label="Buscar" onPress={() => router.push("/(customer)/search" as never)} size={38.8} iconSize={22} />
              <HeroButton icon={isFav ? "heart" : "heart-outline"} color={isFav ? colors.red : colors.ink} label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"} onPress={toggleFavorite} size={38.8} iconSize={22} />
            </>}
            buttonsLeft={13.4} buttonsTop={9.7} buttonsGap={19} />
          <View style={[styles.sheet, { marginTop: -SHEET_26.radius, borderTopLeftRadius: SHEET_26.radius, borderTopRightRadius: SHEET_26.radius, paddingTop: 14.4, paddingHorizontal: 0 }]}>
            <View style={styles.storeHead}>
              <StoreLogo m={m} size={88.7} />
              <View style={{ flex: 1, marginLeft: 12.9, marginTop: 7.4 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.storeName} numberOfLines={1}>{m.name}</Text>
                  {!isOpen ? <Badge label="Cerrado" tone="closed" style={{ marginLeft: 8 }} /> : null}
                </View>
                <Text style={styles.storeSub} numberOfLines={1}>{merchantSubtitle(m, 2, 32)}</Text>
                <View style={styles.storeMeta}>
                  <Ionicons name="time-outline" size={16.5} color="#2C3445" />
                  <Text style={[styles.storeMetaText, { marginLeft: 6.4 }]}>{etaText(m.prep_min, m.prep_max)}</Text>
                  <Text style={styles.storeMetaDot}>·</Text>
                  <MaterialCommunityIcons name="moped" size={20.5} color="#2C3445" style={{ marginTop: -1 }} />
                  <Text style={[styles.storeMetaText, { marginLeft: 7.4 }]} numberOfLines={1}>{m.delivery_fee ? `Envío ${formatCOP(m.delivery_fee)}` : "Envío gratis"}</Text>
                </View>
              </View>
            </View>
            {!isOpen ? (
              <ClosedNotice title={closedLabel ?? "Cerrado por ahora"} body="Puedes ver los productos y volver cuando esté abierto." style={{ marginTop: 16, marginHorizontal: 17.5 }} />
            ) : null}
            {menuState === "ok" ? (
              <SegmentBar tabs={tabs} value={tab} onChange={setTab} style={{ marginTop: 16.1, marginLeft: 15.7, marginRight: 13.8 }} />
            ) : null}
          </View>
          {menuFallback ?? (
            <View style={styles.mkGrid}>
              {visible.map((p) => {
                const { name, unit } = splitUnit(p.name);
                const withOpts = Boolean(menu.data?.withOptions.has(p.id));
                return (
                  <MarketProductCard key={p.id} width={cardW} name={name} unit={unit} price={p.price} image={productImage(p)}
                    onPress={() => onProduct(p)} onAdd={() => onAdd(p)} disabled={!isOpen} soldOutLabel={soldOut(p)}
                    qty={isOpen && !withOpts ? qtyOf(p.id) : undefined} onQty={(q) => setQty(p, q)} />
                );
              })}
            </View>
          )}
          {m.category === "pharmacy" && menuState === "ok" ? (
            <View style={styles.pharmaNote}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textPlaceholder} />
              <Text style={styles.pharmaNoteText}>Medicamentos de venta libre. Para fórmula médica, contacta a la farmacia.</Text>
            </View>
          ) : null}
        </ScrollView>
        {isOpen ? <CartBar merchantId={id} /> : null}
      </View>
    );
  }

  /* ───────────── 12 · Menú del restaurante ───────────── */
  const colW = (width - 13.9 - 12 - 11.5) / 2;
  const stuck = tabsY !== null && scrollY > tabsY - insets.top;
  const tabsNode = <UnderlineTabs tabs={tabs} value={tab} onChange={setTab} />;
  return (
    <View style={styles.root}>
      <ScrollView onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <StoreHero source={merchantImage(m, "menu")} height={166.7} aspect={ASPECT_MENU} bottomRadius={24}
          left={<HeroButton icon="close" label="Cerrar" onPress={goBack} iconSize={23} />}
          right={<>
            <HeroButton icon="share-outline" label="Compartir" onPress={share} iconSize={21} />
            <HeroButton icon="search" label="Buscar" onPress={() => router.push("/(customer)/search" as never)} iconSize={21} />
            <HeroButton icon={isFav ? "bookmark" : "bookmark-outline"} color={isFav ? colors.blue : colors.ink} label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"} onPress={toggleFavorite} iconSize={20} />
          </>} />
        <View style={styles.menuHead}>
          <MenuLogo m={m} />
          <View style={{ flex: 1, marginLeft: 14.2, marginTop: -1.3 }}>
            <Text style={styles.menuName} numberOfLines={1}>{m.name}</Text>
            <Text style={styles.menuSub} numberOfLines={1}>{merchantSubtitle(m)}</Text>
          </View>
        </View>
        <InfoStrip style={styles.strip} items={[
          { label: "Entrega en", flex: 123, icon: <Ionicons name="time-outline" size={17} color={colors.textTertiary} />, value: etaText(m.prep_min, m.prep_max) || "—" },
          { label: "Envío", flex: 111, icon: <RiderIcon size={13} />, value: m.delivery_fee ? formatCOP(m.delivery_fee) : "Gratis" },
          {
            label: "Calificación", flex: 121, icon: <Ionicons name="star" size={16} color={colors.star} />,
            value: <>{formatRating(Number(m.rating_avg ?? 0))}<Text style={{ fontWeight: "400", color: colors.textTertiary }}>{` (${m.rating_count ?? 0})`}</Text></>,
          },
        ]} />
        <View style={styles.tabsSlot} onLayout={(e) => setTabsY(e.nativeEvent.layout.y)}>
          {menuState === "ok" ? tabsNode : null}
        </View>
        {menuFallback ?? (
          <View style={styles.grid}>
            {visible.map((p) => (
              <MenuGridCard key={p.id} width={colW} name={p.name} description={p.description} price={p.price} image={productImage(p, "menu")}
                onPress={() => onProduct(p)} onAdd={() => onAdd(p)} soldOutLabel={soldOut(p)} />
            ))}
          </View>
        )}
      </ScrollView>
      {stuck && menuState === "ok" ? (
        <View style={[styles.stickyTabs, { paddingTop: insets.top }]}>{tabsNode}</View>
      ) : null}
      <CartBar merchantId={id} />
    </View>
  );
}

/** Baldosa del logo (12): recorte del diseño sobre crema; si el comercio no tiene logo de diseño, la foto a sangre. */
function MenuLogo({ m }: { m: MerchantPublic }) {
  const local = merchantDesignImage(m, "logo");
  if (local !== undefined) {
    return (
      <View style={styles.logoTile}>
        <Image source={local} style={{ position: "absolute", left: 2.3, top: 2.3, width: 52.2, height: 45.3 }} contentFit="contain" />
      </View>
    );
  }
  return <Image source={merchantImage(m, "logo")} style={[styles.logoTile, { backgroundColor: colors.surfaceGray }]} contentFit="cover" />;
}

/** Baldosa grande del logo (26): 88,7 pt radio 16 sobre menta; la foto va con 4 pt de aire como en el PNG. */
function StoreLogo({ m, size }: { m: MerchantPublic; size: number }) {
  const local = merchantDesignImage(m, "logo");
  return (
    <View style={[styles.storeLogo, { width: size, height: size }]}>
      <Image source={local ?? merchantImage(m, "logo")} style={local !== undefined ? { position: "absolute", left: 4.2, top: 4.2, width: size - 8.4, height: size - 8.4 } : { width: size, height: size }} contentFit="cover" />
    </View>
  );
}

function MerchantSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Skeleton width="100%" height={insets.top + 166.7} style={{ borderRadius: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
      <View style={{ flexDirection: "row", paddingLeft: 21.7, marginTop: 19, gap: 16 }}>
        <Skeleton width={56.4} height={50.3} style={{ borderRadius: 12 }} />
        <View style={{ flex: 1, gap: 9, paddingTop: 4 }}><Skeleton width="45%" height={22} /><Skeleton width="70%" height={13} /></View>
      </View>
      <Skeleton width={352} height={62.8} style={{ borderRadius: 16, marginTop: 16.2, marginLeft: 21.2 }} />
      <View style={styles.gridSkeleton}>
        {[0, 1].map((i) => <Skeleton key={i} width={170} height={115.5} style={{ borderRadius: 12 }} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  sheet: { marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.white, paddingHorizontal: 19.5 },
  hr: { height: 1, backgroundColor: "#E5E8EE" },

  // 12
  menuHead: { flexDirection: "row", alignItems: "flex-start", marginTop: 18.5, paddingLeft: 21.2, paddingRight: 17.5 },
  logoTile: { width: 57.6, height: 51.2, borderRadius: radius.r12, backgroundColor: "#FDF7EC", overflow: "hidden" },
  menuName: { fontSize: 27.4, lineHeight: 30.5, fontWeight: "700", letterSpacing: -0.3, color: colors.ink },
  menuSub: { fontSize: 14, lineHeight: 20, color: colors.textTertiary, marginTop: -1.8 },
  strip: { marginTop: 14.9, marginLeft: 19.1, marginRight: 18, height: 64.5 },
  tabsSlot: { marginTop: 12.6, minHeight: 36.6 },
  stickyTabs: { position: "absolute", left: 0, right: 0, top: 0, backgroundColor: colors.white },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingLeft: 13.9, paddingRight: 12, columnGap: 11.5, rowGap: 12.1, paddingTop: 15.2 },
  gridSkeleton: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 13.9, gap: 11.5, paddingTop: 15.2 },

  // 26
  storeHead: { flexDirection: "row", alignItems: "flex-start", paddingLeft: 15.7, paddingRight: 14 },
  storeLogo: { borderRadius: radius.r16, backgroundColor: "#D9F3E8", overflow: "hidden" },
  storeName: { fontSize: 20.4, lineHeight: 26, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, flexShrink: 1 },
  storeSub: { fontSize: 13, lineHeight: 19, color: colors.textTertiary, marginTop: 1.1 },
  storeMeta: { flexDirection: "row", alignItems: "center", marginTop: 8.6, height: 19 },
  storeMetaText: { fontSize: 13.2, lineHeight: 19, color: colors.ink, flexShrink: 1 },
  storeMetaDot: { fontSize: 14, lineHeight: 19, color: colors.textTertiary, marginHorizontal: 10 },
  mkGrid: { flexDirection: "row", flexWrap: "wrap", paddingLeft: 17.1, paddingRight: 17, columnGap: 11.5, rowGap: 12.9, paddingTop: 15.2 },
  pharmaNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 17.5 },
  pharmaNoteText: { flex: 1, fontSize: 12, lineHeight: 16, color: colors.textPlaceholder },

  // 43
  closedTitleRow: { flexDirection: "row", alignItems: "center" },
  closedName: { fontSize: 30, lineHeight: 36, fontWeight: "700", letterSpacing: -0.6, color: colors.ink, flexShrink: 1, marginLeft: -0.5 },
  closedBadge: { marginLeft: 10.4, marginTop: 4.6, height: 26.6, borderRadius: 13.3, paddingHorizontal: 9.3, justifyContent: "center", backgroundColor: colors.closedGray },
  closedBadgeText: { fontSize: 11.4, lineHeight: 15, fontWeight: "500", color: colors.white },
  closedSub: { fontSize: 12.8, lineHeight: 17, color: colors.textTertiary, marginTop: 4 },
  statsRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10.2, marginLeft: 1.3 },
  statDot: { fontSize: 10, lineHeight: 20, color: "#5B6377", marginLeft: 15.5, marginRight: 13.4 },
  closedSection: { fontSize: 17.8, lineHeight: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.ink, marginTop: 24.2 },
  closedCards: { flexDirection: "row", flexWrap: "wrap", paddingLeft: 18.9, paddingRight: 18.5, columnGap: 10.6, rowGap: 12, paddingTop: 8.3 },
  closedCta: { position: "absolute", left: 19.4, right: 18.9 },
  closedCtaBtn: { height: 47.5, borderRadius: 16, backgroundColor: "#0052C0", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  closedCtaText: { fontSize: 13.5, lineHeight: 18, fontWeight: "500", color: colors.white },
});
