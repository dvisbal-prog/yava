import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { ErrorState, type MerchantCardData } from "@/components/customer";
import { PinIcon } from "@/components/customer/AddressHeader";
import { SearchPill } from "@/components/customer/browse/SearchPill";
import { DishRow, RestaurantHeroCard, MerchantResultRow, SuggestChip } from "@/components/customer/browse/SearchResults";
import { ShopIcon } from "@/components/customer/browse/icons";
import { designImages, productImage } from "@/lib/design-images";
import { useLocation } from "@/store/location";
import { useSearch, useProductsByIds, useMerchantsByIds, useNearbyMerchants, type SearchResult, type MerchantPublic } from "@/features/customer";

const SUGGESTIONS = ["Ceviches", "Hamburguesas", "Shawarmas", "Limonada", "Frutas", "Dolex"];
/** Sugerencias del estado sin resultados (41). */
const EMPTY_SUGGESTIONS = ["Ceviches", "Hamburguesas", "Shawarmas"];

type Tab = "merchants" | "products";

function toCard(m: MerchantPublic): MerchantCardData {
  return {
    id: m.id ?? "", name: m.name ?? "", slug: m.slug, tagline: m.tagline, logo_url: m.logo_url, cover_url: m.cover_url, delivery_fee: m.delivery_fee ?? 0,
    prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0, rating_avg: Number(m.rating_avg ?? 0), rating_count: m.rating_count ?? 0, is_open: Boolean(m.is_open),
  };
}

/**
 * Pantalla 10 · Búsqueda (tanda-02/10-busqueda.png) y 41 · Búsqueda sin resultados (tanda-06/41-…png).
 * - Con resultados: atrás circular + buscador en línea, segmentos "Restaurantes" / "Platos", "Resultados cerca de
 *   Casa · …", filas de platos con "+" y debajo "Restaurantes" con la tarjeta grande del comercio.
 * - Sin resultados: chevron suelto y el buscador a lo ancho debajo, ilustración, sugerencias, "Limpiar búsqueda" y
 *   "Restaurantes cerca". El campo de texto es el mismo elemento en los dos diseños (no pierde el foco al cambiar).
 */
export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const address = useLocation((s) => s.address);
  const [text, setText] = useState(params.q ?? "");
  const [debounced, setDebounced] = useState(text);
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => { const id = setTimeout(() => setDebounced(text), 300); return () => clearTimeout(id); }, [text]);
  const q = useSearch(debounced);
  const nearby = useNearbyMerchants("food");

  const results = q.data ?? [];
  const productResults = results.filter((r) => r.kind === "product");
  const merchantResults = results.filter((r) => r.kind === "merchant");
  // Comercios a mostrar: los encontrados o, si solo hubo platos, los que venden esos platos.
  const merchantIds = useMemo(() => {
    const ids = merchantResults.map((r) => r.id);
    return ids.length ? ids : Array.from(new Set(productResults.map((r) => r.merchant_id)));
  }, [merchantResults, productResults]);
  const merchants = useMerchantsByIds(merchantIds);
  const productIds = useMemo(() => productResults.map((r) => r.id), [productResults]);
  const productRows = useProductsByIds(productIds);

  const searching = debounced.trim().length >= 2;
  const empty = searching && !q.isLoading && !q.error && results.length === 0;
  const activeTab: Tab = tab ?? (productResults.length ? "products" : "merchants");

  const merchantCards = useMemo(() => {
    const byId = new Map((merchants.data ?? []).map((m) => [m.id, toCard(m)]));
    return merchantIds.map((id) => byId.get(id)).filter((m): m is MerchantCardData => Boolean(m));
  }, [merchants.data, merchantIds]);

  function open(r: SearchResult) {
    if (r.kind === "merchant") router.push(`/(customer)/merchant/${r.id}` as never);
    else router.push(`/(customer)/product/${r.id}` as never);
  }
  const openMerchant = (id: string) => router.push(`/(customer)/merchant/${id}` as never);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Encabezado: 10 = atrás circular + buscador en línea; 41 = chevron suelto y buscador a lo ancho debajo. */}
      <View style={{ height: empty ? 83 : 62 }}>
        <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Atrás"
          style={({ pressed }) => [empty ? styles.backPlain : styles.backCircle, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="chevron-back" size={empty ? 22.5 : 17.5} color={colors.ink} style={empty ? null : { marginLeft: -0.8 }} />
        </Pressable>
        <View style={empty ? styles.search41 : styles.search10}>
          <SearchPill placeholder="Busca platos, productos o comercios" value={text} onChangeText={setText} onClear={() => setText("")}
            autoFocus={!params.q} height={empty ? 43 : 44.6} fontSize={13} valueFontSize={empty ? 15.9 : 14.5}
            iconSize={empty ? 18.6 : 18.2} iconLeft={empty ? 13.9 : 14.8} textLeft={empty ? 12.5 : 10.6} clearStyle={empty ? "circle" : "plain"} clearRight={empty ? 12.6 : 10.6} />
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {!searching ? (
          <View style={styles.gutter}>
            <Text style={styles.hint}>Sugerencias</Text>
            <View style={styles.suggestWrap}>
              {SUGGESTIONS.map((s) => <SuggestChip key={s} label={s} onPress={() => setText(s)} />)}
            </View>
          </View>
        ) : q.isLoading ? (
          <View style={[styles.gutter, { marginTop: 18, gap: 16 }]}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flexDirection: "row", gap: 15 }}>
                <Skeleton width={118} height={99.8} style={{ borderRadius: 6.5 }} />
                <View style={{ flex: 1, gap: 9, paddingTop: 8 }}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="35%" height={12} />
                  <Skeleton width="90%" height={10} />
                </View>
              </View>
            ))}
          </View>
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => { void q.refetch(); }} />
        ) : empty ? (
          <View>
            <View style={styles.emptyArt}>
              <Image source={designImages.vacioBusqueda} style={{ width: 90.6, height: 91.5 }} contentFit="contain" />
            </View>
            <Text style={styles.emptyTitle}>No encontramos resultados</Text>
            <Text style={styles.emptyBody}>Prueba con otro plato o restaurante.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.emptyChips}>
              {EMPTY_SUGGESTIONS.map((s) => <SuggestChip key={s} label={s} onPress={() => setText(s)} />)}
            </ScrollView>
            <Pressable onPress={() => setText("")} hitSlop={10} accessibilityRole="button" style={{ alignSelf: "center", marginTop: 25.3 }}>
              <Text style={styles.clearLink}>Limpiar búsqueda</Text>
            </Pressable>
            <View style={[styles.sep, { marginTop: 24.5 }]} />
            {nearby.data?.length ? (
              <View style={styles.gutter41}>
                <Text style={styles.nearTitle}>Restaurantes cerca</Text>
                <View style={{ marginTop: 10.75, gap: 10.7 }}>
                  {nearby.data.slice(0, 2).map((m) => <MerchantResultRow key={m.id} m={m} onPress={() => openMerchant(m.id)} />)}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View>
            <View style={styles.segments}>
              <Segment icon={<ShopIcon size={17.6} color={activeTab === "merchants" ? colors.blueText : colors.ink} />} label="Restaurantes" active={activeTab === "merchants"} onPress={() => setTab("merchants")} />
              <Segment icon={<MaterialCommunityIcons name="silverware-fork-knife" size={18.5} color={activeTab === "products" ? colors.blueText : colors.ink} />} label="Platos" active={activeTab === "products"} onPress={() => setTab("products")} />
            </View>

            <Pressable onPress={() => router.push("/modal/address-picker" as never)} accessibilityRole="button" accessibilityLabel="Cambiar dirección de entrega" style={styles.locRow}>
              <View style={{ transform: [{ scale: 1.06 }], marginRight: 9.4 }}><PinIcon /></View>
              <Text numberOfLines={1} style={styles.locText}>
                Resultados cerca de{" "}
                {address ? (
                  <Text style={styles.locStrong}>
                    <Text style={{ fontWeight: "700" }}>{address.label}</Text>{" · "}{address.line1}
                  </Text>
                ) : <Text style={styles.locStrong}>tu ubicación</Text>}
              </Text>
              <View style={styles.locChev}><Ionicons name="chevron-down" size={12.5} color={colors.ink} /></View>
            </Pressable>

            {activeTab === "products" ? (
              <>
                {productResults.length ? (
                  <View style={[styles.gutter, { marginTop: 21.2 }]}>
                    {productResults.map((r, i) => {
                      const row = productRows.data?.find((p) => p.id === r.id);
                      return (
                        <DishRow key={r.id} name={r.name} price={r.price} description={row?.description ?? r.subtitle}
                          image={productImage({ name: r.name, image_urls: row?.image_urls ?? null, image_url: r.image_url }, "list")}
                          onPress={() => open(r)} last={i === productResults.length - 1} style={i > 0 ? { marginTop: 7.5 } : null} />
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[styles.hint, styles.gutter, { marginTop: 18 }]}>No encontramos platos con "{debounced.trim()}".</Text>
                )}
                {merchantCards.length ? (
                  <View style={styles.gutter}>
                    <Text style={[styles.section, { marginTop: 19.3 }]}>Restaurantes</Text>
                    <View style={{ marginTop: 9, gap: 12 }}>
                      {merchantCards.map((m) => <RestaurantHeroCard key={m.id} m={m} onPress={() => openMerchant(m.id)} />)}
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={[styles.gutter, { marginTop: 18.4, gap: 12 }]}>
                {merchants.isLoading ? (
                  <Skeleton height={215} style={{ borderRadius: radius.r16 }} />
                ) : merchantCards.length ? (
                  merchantCards.map((m) => <RestaurantHeroCard key={m.id} m={m} onPress={() => openMerchant(m.id)} />)
                ) : (
                  <Text style={styles.hint}>No encontramos restaurantes con "{debounced.trim()}".</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** C10b · Segmento de 10: píldora 177 × 38,4 pt; activa `blueSoft` con ícono y texto 600 `blueText`, inactiva `#F6F7F9`. */
function Segment({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label}
      style={({ pressed }) => [styles.segment, { backgroundColor: active ? colors.blueSoft : "#F6F7F9", paddingLeft: active ? 7.6 : 3.7, opacity: pressed ? 0.85 : 1 }]}>
      {icon}
      <Text style={[styles.segmentText, active ? { color: colors.blueText, fontWeight: "600", marginLeft: 12.4 } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  gutter: { paddingLeft: 17.1, paddingRight: 16.2 },
  gutter41: { paddingLeft: 18, paddingRight: 17.5 },
  backCircle: { position: "absolute", left: 16.6, top: 16, width: 32.4, height: 32.4, borderRadius: 16.2, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
  backPlain: { position: "absolute", left: 11.5, top: 5.8, width: 23, height: 23, alignItems: "center", justifyContent: "center" },
  search10: { position: "absolute", left: 56.5, right: 15.7, top: 9.8 },
  search41: { position: "absolute", left: 17.5, right: 17.5, top: 41.6 },
  hint: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, marginTop: 14, marginBottom: 10 },
  suggestWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segments: { flexDirection: "row", gap: 6.5, marginTop: 5.3, marginLeft: 16.9, marginRight: 16 },
  segment: { flex: 1, height: 38.4, borderRadius: 19.2, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  segmentText: { fontSize: 12, lineHeight: 16, color: "#626C83", marginLeft: 11.6 },
  locRow: { flexDirection: "row", alignItems: "center", height: 21.3, marginTop: 9.4, marginLeft: 18.5, marginRight: 16 },
  locText: { flexShrink: 1, fontSize: 12.1, lineHeight: 16, color: "#626C83", marginLeft: 0 },
  locStrong: { color: colors.ink, fontWeight: "500" },
  locChev: { width: 21.2, height: 21.2, borderRadius: 10.6, backgroundColor: colors.chevronCircle, alignItems: "center", justifyContent: "center", marginLeft: 3 },
  section: { fontSize: 18.8, lineHeight: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.ink },
  emptyArt: { alignItems: "center", marginTop: 37.3 },
  emptyTitle: { fontSize: 18.5, lineHeight: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.ink, textAlign: "center", marginTop: 14.6 },
  emptyBody: { fontSize: 13.5, lineHeight: 18, color: colors.textTertiary, textAlign: "center", marginTop: 7.9 },
  emptyChips: { paddingLeft: 18, paddingRight: 10, gap: 7.9, marginTop: 28 },
  clearLink: { fontSize: 10.5, lineHeight: 14, fontWeight: "500", color: colors.blueLink },
  sep: { height: 1, backgroundColor: "#E1E5EB", marginLeft: 17.5, marginRight: 17.5 },
  nearTitle: { fontSize: 14.7, lineHeight: 18, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, marginTop: 16.35 },
});
