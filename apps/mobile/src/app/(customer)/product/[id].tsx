import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Share, TextInput, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, formatCOP } from "@yava/shared";
import type { CartLine } from "@yava/shared";
import { Text, Skeleton, EmptyState, IconButton, Badge } from "@/components/ui";
import { useCart } from "@/store/cart";
import { ProductTile, isProductAvailable } from "@/components/customer/ProductRow";
import { ErrorState } from "@/components/customer/QueryState";
import { etaText } from "@/components/customer/MerchantCard";
import { StoreHero, HeroButton, extendedHero } from "@/components/customer/store/StoreHero";
import { StoreAwningIcon, LeafIcon } from "@/components/customer/store/StoreIcons";
import { BarStepper, OptionCard, RadioLine, InfoRow } from "@/components/customer/store/ProductParts";
import { ComplementsSheet } from "@/components/customer/store/ComplementsSheet";
import { splitUnit, unitFromDescription } from "@/components/customer/store/featured";
import { useProduct, useMerchant, useMerchantMenu, useFavoriteIds, useToggleFavorite, useRequireAuth } from "@/features/customer";
import { productImage, productDesignImage, merchantImage } from "@/lib/design-images";
import { notify, confirm } from "@/lib/dialog";

/** Proporción alto/ancho del recorte de portada del detalle (13: 851×507 px desde el tope del PNG). */
const ASPECT_DETAIL = 507 / 851;
/** 13: la hoja blanca monta la foto en y 197,5 con radio 6,5 (medido en el PNG). */
const SHEET_13 = { top: 197.5, radius: 6.5 };
/**
 * Azul del CTA "Agregar · $X" medido en cada PNG (los diseños no usan exactamente el mismo tono):
 * 13 #0043C1, 27 #0140A5, 30 #0046BD.
 */
const CTA_BLUE = { food: "#0043C1", market: "#0140A5", pharmacy: "#0046BD" } as const;

type Kind = "food" | "market" | "pharmacy";

/**
 * Detalle de producto:
 * - 13 plato (tanda-02/13-ceviche-detalle.png): portada con hoja blanca, precio, nombre, comercio, grupos obligatorios
 *   como tarjetas de opción, instrucciones y barra "− 1 + | Agregar · $X". Al agregar se abre la hoja 14 (complementos)
 *   cuando el comercio tiene otras categorías o el plato tiene grupos opcionales.
 * - 27 mercado (tanda-04/27-mercado-producto.png): foto sobre blanco, presentación en píldora y "Si no está disponible".
 * - 30 farmacia (tanda-04/30-farmacia-producto.png): foto en tarjeta, tarjeta de la farmacia y filas de información.
 */
export default function ProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const p = product.data;
  const merchant = useMerchant(p?.merchant_id);
  const menu = useMerchantMenu(p?.merchant_id);
  const favIds = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const requireAuth = useRequireAuth();
  const cart = useCart();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [replacePref, setReplacePref] = useState<"replace" | "remove">("replace");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openInfo, setOpenInfo] = useState<string | null>(null);

  const m = merchant.data;
  const available = p ? isProductAvailable(p) : false;
  const isOpen = Boolean(m?.is_open);
  const kind: Kind = m?.category === "market" ? "market" : m?.category === "pharmacy" ? "pharmacy" : "food";
  const isFav = Boolean(m?.id && favIds.data?.includes(m.id));

  const groups = p?.groups ?? [];
  const isRequired = (g: (typeof groups)[number]) => g.required || g.min_select > 0;
  /** En 13 solo van los grupos obligatorios; los opcionales se eligen en la hoja de complementos (14). */
  const pageGroups = kind === "food" ? groups.filter(isRequired) : groups;
  const sheetGroups = kind === "food" ? groups.filter((g) => !isRequired(g)) : [];

  const extras = useMemo(() => pageGroups.reduce((acc, g) => acc + g.options.filter((o) => (selected[g.id] ?? []).includes(o.id)).reduce((a, o) => a + o.price_delta, 0), 0), [pageGroups, selected]);
  const unit = (p?.price ?? 0) + extras;
  const total = unit * qty;

  const missing = useMemo(() => pageGroups.filter((g) => {
    const n = (selected[g.id] ?? []).length;
    return (g.required && n < Math.max(1, g.min_select)) || (n < g.min_select);
  }), [pageGroups, selected]);

  const alternatives = useMemo(() => {
    if (!p || available) return [];
    const list = (menu.data?.products ?? []).filter((x) => x.id !== p.id && isProductAvailable(x));
    const same = list.filter((x) => x.category_id && x.category_id === p.category_id);
    return (same.length ? same : list).slice(0, 6);
  }, [p, available, menu.data]);

  /** Hay algo que ofrecer en 14: otras categorías con productos o grupos opcionales del plato. */
  const hasComplements = useMemo(() => {
    if (kind !== "food" || !p) return false;
    if (sheetGroups.length) return true;
    return (menu.data?.products ?? []).some((x) => x.id !== p.id && x.category_id !== p.category_id && isProductAvailable(x));
  }, [kind, p, sheetGroups.length, menu.data]);

  /**
   * Como en el diseño (13 llega con "Sin picante" marcado): en los grupos obligatorios de una sola opción se
   * preselecciona la primera opción disponible, solo si no cambia el precio. El cliente puede cambiarla.
   */
  useEffect(() => {
    if (!p) return;
    setSelected((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, string[]> = {};
      for (const g of p.groups) {
        if (!(g.required || g.min_select > 0) || g.max_select > 1) continue;
        const first = g.options.find((o) => o.available);
        if (first && first.price_delta === 0) next[g.id] = [first.id];
      }
      return Object.keys(next).length ? next : prev;
    });
  }, [p]);

  function toggle(groupId: string, optionId: string, single: boolean, max: number) {
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: cur.includes(optionId) ? [] : [optionId] };
      if (cur.includes(optionId)) return { ...prev, [groupId]: cur.filter((x) => x !== optionId) };
      if (cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, optionId] };
    });
  }

  function buildLine(): CartLine | null {
    if (!p) return null;
    const pref = kind === "market" ? (replacePref === "replace" ? "Si no está disponible: reemplazar por uno similar." : "Si no está disponible: quitar del pedido.") : "";
    const note = [notes.trim(), pref].filter(Boolean).join(" ");
    return {
      product_id: p.id, name: p.name, unit_price: p.price, qty, notes: note || undefined,
      options: pageGroups.flatMap((g) => g.options.filter((o) => (selected[g.id] ?? []).includes(o.id)).map((o) => ({ group_id: g.id, option_id: o.id, name: o.name, price_delta: o.price_delta }))),
    };
  }

  /** Agrega varias líneas a la canasta; si es de otro comercio pide confirmación para vaciarla. */
  function commit(lines: CartLine[], after: () => void) {
    if (!m || !lines.length) return;
    const cm = { id: m.id ?? "", name: m.name ?? "", delivery_fee: m.delivery_fee ?? 0, category: m.category ?? "food", prep_min: m.prep_min ?? 0, prep_max: m.prep_max ?? 0 };
    const [first, ...rest] = lines;
    const res = cart.addLine(cm, first);
    if (res === "different_merchant") {
      void confirm("Ya tienes una canasta", `Tu canasta tiene productos de ${cart.merchant?.name ?? "otro comercio"}. ¿Quieres vaciarla y agregar ${first.name}?`, { okText: "Vaciar canasta y agregar", destructive: true }).then((ok) => {
        if (!ok) return;
        cart.replaceWith(cm, first);
        rest.forEach((l) => useCart.getState().addLine(cm, l));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        after();
      });
      return;
    }
    rest.forEach((l) => useCart.getState().addLine(cm, l));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    after();
  }

  function add() {
    if (!p || !m) return;
    if (missing.length) { notify("Falta elegir", `Selecciona ${missing[0].name.toLowerCase()} para continuar.`); return; }
    const line = buildLine();
    if (!line) return;
    if (hasComplements) { setSheetOpen(true); return; }
    commit([line], () => router.back());
  }

  function goBack() {
    if (router.canGoBack()) router.back(); else router.replace("/(customer)" as never);
  }
  function share() {
    if (!p) return;
    Share.share({ message: `${p.name} en ${m?.name ?? "YAVA"} · ${formatCOP(p.price)}` }).catch(() => undefined);
  }
  function toggleFavorite() {
    if (!m?.id) return;
    if (!requireAuth(`/(customer)/product/${id}`)) return;
    toggleFav.mutate({ merchantId: m.id, isFavorite: isFav });
  }
  const openMerchant = () => { if (m?.id) router.push(`/(customer)/merchant/${m.id}` as never); };

  if (product.isLoading) {
    return (
      <View style={styles.root}>
        <Skeleton width="100%" height={insets.top + 221} style={{ borderRadius: 0 }} />
        <View style={{ padding: 25, gap: 12, marginTop: -24, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Skeleton width="25%" height={16} /><Skeleton width="65%" height={24} /><Skeleton width="90%" height={14} />
          <View style={{ height: 12 }} /><Skeleton width="100%" height={44} /><Skeleton width="100%" height={44} />
        </View>
      </View>
    );
  }
  if (product.error || !p) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <IconButton icon="chevron-back" variant="gray" size={34} iconSize={19} onPress={goBack} accessibilityLabel="Volver" style={{ marginLeft: 17, marginTop: 8 }} />
        {product.error ? <ErrorState error={product.error} onRetry={() => { void product.refetch(); }} /> : (
          <EmptyState icon="fast-food-outline" title="Producto no disponible" body="Este producto ya no está publicado." actionTitle="Volver" onAction={goBack} />
        )}
      </View>
    );
  }

  const canAdd = available && isOpen && !missing.length;
  const ctaTitle = !available ? "No disponible" : !isOpen ? "Comercio cerrado" : `Agregar · ${formatCOP(total)}`;
  const { name: shortName, unit: nameUnit } = splitUnit(p.name);
  const unitLabel = nameUnit ?? unitFromDescription(p.description);

  /* Bloque común: grupos de opciones con el estilo de 13 */
  const groupsBlock = available ? pageGroups.map((g, i) => {
    const single = g.max_select <= 1;
    const chosen = selected[g.id] ?? [];
    const required = isRequired(g);
    const hint = single ? "1 opción" : `hasta ${g.max_select} opciones`;
    return (
      <View key={g.id} style={{ marginTop: i === 0 ? 0 : 22 }}>
        <Text style={styles.groupTitle}>{g.name}</Text>
        <Text style={styles.groupHint}>{`${required ? "Obligatorio" : "Opcional"} · ${hint}`}</Text>
        <View style={{ gap: 7.8, marginTop: 9.9 }}>
          {g.options.map((o) => (
            <OptionCard key={o.id} label={o.name} priceDelta={o.price_delta} checkbox={!single} disabled={!o.available}
              note={!o.available ? "No disponible" : undefined}
              selected={chosen.includes(o.id)} onPress={() => toggle(g.id, o.id, single, g.max_select)} />
          ))}
        </View>
      </View>
    );
  }) : null;

  const unavailableBlock = !available ? (
    <View style={{ marginTop: 18 }}>
      <View style={styles.notice}>
        <Ionicons name="alert-circle" size={20} color={colors.amber} />
        <Text style={styles.noticeText}>{p.status === "paused" ? "El comercio pausó este producto por hoy." : "Este producto está agotado por ahora."}</Text>
      </View>
      {alternatives.length ? (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.groupTitle}>Te puede gustar en su lugar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
            {alternatives.map((a) => <ProductTile key={a.id} p={a} onPress={() => router.replace(`/(customer)/product/${a.id}` as never)} />)}
          </ScrollView>
        </View>
      ) : null}
    </View>
  ) : null;

  const cta = (h: number, fontSize: number, flex = true) => (
    <Pressable onPress={add} disabled={!canAdd} accessibilityRole="button" accessibilityState={{ disabled: !canAdd }} accessibilityLabel={ctaTitle}
      style={({ pressed }) => [styles.cta, { height: h, borderRadius: h / 2, backgroundColor: CTA_BLUE[kind] }, flex ? { flex: 1 } : null, !canAdd ? styles.ctaOff : pressed ? { backgroundColor: colors.blueDark } : null]}>
      <Text style={[styles.ctaText, { fontSize }, !canAdd ? { color: colors.disabledText } : null]} numberOfLines={1}>{ctaTitle}</Text>
    </Pressable>
  );
  /** Aire bajo el CTA hasta el indicador de inicio (13: 3,8; 27: 5,6; 30: 1 pt en el PNG). */
  const barPad = (extra: number) => Math.max(insets.bottom + extra, 14);

  /* ───────────── 27 · Producto de mercado ───────────── */
  if (kind === "market") {
    // Lo que se vende al peso va en bolsa: "Banano (1 kg)" → "Bolsa de 1 kg" (27); "Leche (1 L)" sigue "1 L".
    const marketUnit = nameUnit && /^\d+(?:[.,]\d+)?\s?(?:kg|g|gr|lb)$/i.test(nameUnit) ? `Bolsa de ${nameUnit}` : unitLabel;
    const white = productDesignImage(p.name, "white");
    const onWhite = white !== undefined && white !== productDesignImage(p.name, "default");
    const imgW = width * (376.8 / 393);
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={{ height: 342.9 }}>
            {onWhite ? (
              <Image source={white} style={{ position: "absolute", left: width * (9.2 / 393), top: 5.5, width: imgW, height: imgW * (730 / 815), opacity: available ? 1 : 0.55 }} contentFit="contain" />
            ) : (
              <Image source={productImage(p)} style={[styles.marketPhotoCard, { opacity: available ? 1 : 0.55 }]} contentFit="cover" transition={150} />
            )}
            <IconButton icon="close" variant="white" size={40.5} iconSize={22} onPress={goBack} accessibilityLabel="Cerrar" style={{ position: "absolute", left: 19.6, top: 5.6 }} />
          </View>
          <View style={styles.marketBody}>
            <Text style={styles.marketName}>{shortName}</Text>
            {marketUnit ? <View style={styles.unitPill}><Text style={styles.unitPillText}>{marketUnit}</Text></View> : null}
            <Text style={[styles.marketPrice, !marketUnit ? { marginTop: 4 } : null]}>{formatCOP(p.price)}</Text>
            <Text style={styles.marketDesc}>{p.description || (m?.name ? `Producto fresco de ${m.name}.` : "")}</Text>
            {unavailableBlock}
            {available ? (
              <>
                <View style={[styles.hr, { marginTop: 23.9 }]} />
                {groupsBlock?.length ? <View style={{ marginTop: 18 }}>{groupsBlock}</View> : null}
                <Text style={[styles.marketSection, groupsBlock?.length ? { marginTop: 22 } : null]}>Si no está disponible</Text>
                <View style={{ marginTop: 11.7 }}>
                  <RadioLine label="Reemplazar por similar" selected={replacePref === "replace"} onPress={() => setReplacePref("replace")} />
                  <RadioLine label="Quitar del pedido" selected={replacePref === "remove"} onPress={() => setReplacePref("remove")} />
                </View>
                <Text style={styles.marketNote}>Te contactaremos si cambia el precio.</Text>
              </>
            ) : null}
          </View>
        </ScrollView>
        <View style={[styles.bar, { paddingTop: 8.8, paddingLeft: 13.4, paddingRight: 12.5, paddingBottom: barPad(5.6) }]}>
          {available && isOpen ? <BarStepper value={qty} onChange={setQty} width={145.6} height={52.7} variant="filled" glyph={14.8} style={{ marginRight: 9.3 }} /> : null}
          {cta(52.7, 14.7)}
        </View>
      </View>
    );
  }

  /* ───────────── 30 · Producto de farmacia ───────────── */
  if (kind === "pharmacy") {
    const cardW = width - 6.9 - 6.4;
    const images = p.image_urls.length > 1 ? p.image_urls : [];
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.pharmaCard, { width: cardW, height: cardW * (389.7 / 379.7) }]}>
            <Image source={productImage(p)} style={[StyleSheet.absoluteFill, { opacity: available ? 1 : 0.55 }]} contentFit="cover" transition={150} />
            <IconButton icon="chevron-back" variant="white" size={42.2} iconSize={22} onPress={goBack} accessibilityLabel="Volver" style={{ position: "absolute", left: 9.7, top: 10.8 }} />
            <View style={styles.pharmaRight}>
              <IconButton icon="share-outline" variant="white" size={40.2} iconSize={21} onPress={share} accessibilityLabel="Compartir" />
              <IconButton icon={isFav ? "heart" : "heart-outline"} color={isFav ? colors.red : colors.ink} variant="white" size={40.2} iconSize={21} onPress={toggleFavorite} accessibilityLabel={isFav ? "Quitar de favoritos" : "Guardar en favoritos"} />
            </View>
          </View>
          {/* Franja de los puntos del carrusel (solo con 2+ fotos); ocupa lo mismo aunque no haya puntos. */}
          <View style={styles.dotsSlot}>
            {images.length ? <View style={styles.dots}>{images.map((u, i) => <View key={u} style={[styles.dot, i === 0 ? styles.dotOn : null]} />)}</View> : null}
          </View>
          <View style={styles.pharmaBody}>
            <Text style={styles.pharmaName}>{shortName}</Text>
            {unitLabel ? <Text style={styles.pharmaUnit}>{unitLabel}</Text> : null}
            <Text style={styles.pharmaPrice}>{formatCOP(p.price)}</Text>
            {m ? (
              <Pressable onPress={openMerchant} accessibilityRole="button" style={({ pressed }) => [styles.storeCard, pressed ? { opacity: 0.85 } : null]}>
                <View style={{ marginLeft: 15.2, marginTop: 1.5 }}><StoreAwningIcon size={23} /></View>
                <View style={{ flex: 1, marginLeft: 16.8 }}>
                  <Text style={styles.storeCardName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.storeCardSub} numberOfLines={1}>{m.tagline ?? etaText(m.prep_min, m.prep_max)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.ink} style={{ marginRight: 13 }} />
              </Pressable>
            ) : null}
            {unavailableBlock}
            {groupsBlock?.length ? <View style={{ marginTop: 18 }}>{groupsBlock}</View> : null}
            <View style={[styles.hr, { marginTop: 12.4 }]} />
            <InfoRow icon={<Ionicons name="document-text-outline" size={19.5} color={colors.ink} style={{ marginLeft: -2.5 }} />} title="Descripción"
              body={p.description?.trim() || "Este producto aún no tiene descripción."} open={openInfo === "desc"} onToggle={() => setOpenInfo((o) => (o === "desc" ? null : "desc"))} />
            <InfoRow icon={<Ionicons name="water-outline" size={21} color={colors.ink} />} title="Modo de uso"
              body="Sigue las indicaciones del empaque. Si tienes dudas, pregunta en la farmacia antes de usarlo." open={openInfo === "uso"} onToggle={() => setOpenInfo((o) => (o === "uso" ? null : "uso"))} />
            <InfoRow icon={<View style={{ marginLeft: -2 }}><LeafIcon size={15} /></View>} title="Ingredientes"
              body="La lista completa de ingredientes está impresa en el empaque del producto." open={openInfo === "ing"} onToggle={() => setOpenInfo((o) => (o === "ing" ? null : "ing"))} />
            <Text style={styles.pharmaNote}>Consulta las indicaciones del empaque.</Text>
          </View>
        </ScrollView>
        <View style={[styles.bar, { paddingTop: 11.3, paddingLeft: 12.7, paddingRight: 12, paddingBottom: barPad(1) }]}>
          {available && isOpen ? <BarStepper value={qty} onChange={setQty} width={121} height={40.2} glyph={12.5} style={{ marginRight: 16.3 }} /> : null}
          {cta(42, 13.3)}
        </View>
      </View>
    );
  }

  /* ───────────── 13 · Detalle de plato ───────────── */
  const mainLine = sheetOpen ? buildLine() : null;
  const hero = extendedHero(productImage(p, "detail"), ASPECT_DETAIL);
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <StoreHero source={hero.source} height={SHEET_13.top + SHEET_13.radius} aspect={hero.aspect} dim={!available}
          buttonsLeft={17.1} buttonsTop={13.9} buttonsGap={12.2}
          left={<HeroButton icon="close" label="Cerrar" onPress={goBack} size={36} iconSize={22} />}
          right={<>
            <HeroButton icon="share-outline" label="Compartir" onPress={share} size={36} iconSize={20} />
            <HeroButton icon={isFav ? "bookmark" : "bookmark-outline"} color={isFav ? colors.blue : colors.ink} label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"} onPress={toggleFavorite} size={36} iconSize={19} />
          </>} />
        <View style={styles.sheet}>
          <Text style={styles.price}>{formatCOP(p.price)}</Text>
          <Text style={styles.name}>{p.name}</Text>
          {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
          {!available ? <Badge label={p.status === "paused" ? "No disponible por hoy" : "Agotado"} tone="unavailable" style={{ marginTop: 10 }} /> : null}
          {m ? (
            <Pressable onPress={openMerchant} accessibilityRole="button" accessibilityLabel={`Ver ${m.name}`} style={({ pressed }) => [styles.merchantRow, pressed ? { opacity: 0.8 } : null]}>
              <Image source={merchantImage(m, "card")} style={styles.merchantPhoto} contentFit="cover" />
              <View style={{ flex: 1, marginLeft: 12.2 }}>
                <Text style={styles.merchantName} numberOfLines={1}>{m.name}</Text>
                <Text style={styles.merchantMeta} numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(" · ")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3A4255" style={{ marginRight: 8.5 }} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.fullHr} />
        <View style={styles.section}>
          {unavailableBlock}
          {groupsBlock}
          {available ? (
            <>
              {groupsBlock?.length ? <View style={[styles.hr, { marginTop: 18.4, marginHorizontal: -13.3 }]} /> : null}
              <Text style={[styles.groupTitle, { marginTop: groupsBlock?.length ? 14.8 : 0 }]}>
                Instrucciones <Text style={styles.optional}>(opcional)</Text>
              </Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Alguna indicación para la cocina…" placeholderTextColor={colors.textPlaceholder}
                multiline maxLength={250} selectionColor={colors.blueText} style={styles.textarea} accessibilityLabel="Instrucciones para la cocina" />
            </>
          ) : null}
        </View>
      </ScrollView>
      <View style={[styles.bar, { paddingTop: 7.4, paddingLeft: 17.1, paddingRight: 16.6, paddingBottom: barPad(3.8) }]}>
        {available && isOpen ? <BarStepper value={qty} onChange={setQty} width={140.4} height={41} glyph={12.5} style={{ marginRight: 12.9 }} /> : null}
        {cta(42.9, 14.7)}
      </View>
      {m && mainLine ? (
        <ComplementsSheet visible={sheetOpen} merchantName={m.name ?? ""} mainLine={mainLine} mainImage={productImage(p)}
          optionalGroups={sheetGroups} products={menu.data?.products ?? []} categories={menu.data?.categories ?? []}
          existingLines={cart.merchant?.id === m.id ? cart.lines : []}
          onClose={() => setSheetOpen(false)} onEdit={() => setSheetOpen(false)}
          onContinue={(lines) => commit(lines, () => { setSheetOpen(false); router.replace("/(customer)/cart" as never); })}
          onSkip={(line) => commit([line], () => { setSheetOpen(false); router.back(); })} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  hr: { height: 1, backgroundColor: "#E5E8EE" },

  // 13
  sheet: { marginTop: -SHEET_13.radius, borderTopLeftRadius: SHEET_13.radius, borderTopRightRadius: SHEET_13.radius, backgroundColor: colors.white, paddingTop: 15.7, paddingLeft: 25.3, paddingRight: 24.4 },
  price: { fontSize: 16.4, lineHeight: 21, fontWeight: "700", color: colors.ink },
  name: { fontSize: 24.7, lineHeight: 30, fontWeight: "700", letterSpacing: -0.4, color: colors.ink, marginTop: 5 },
  desc: { fontSize: 14.1, lineHeight: 19, color: colors.textSecondary, marginTop: 4.1 },
  merchantRow: { flexDirection: "row", alignItems: "center", marginTop: 15.3, marginLeft: -0.4 },
  merchantPhoto: { width: 47.5, height: 47.5, borderRadius: 23.75, backgroundColor: colors.surfaceGray },
  merchantName: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: colors.ink },
  merchantMeta: { fontSize: 12.6, lineHeight: 17, color: colors.textTertiary, marginTop: -0.5 },
  fullHr: { height: 1, backgroundColor: "#E5E8EE", marginLeft: 12, marginRight: 12, marginTop: 15.6 },
  section: { paddingLeft: 25.3, paddingRight: 24.4, paddingTop: 15.1 },
  groupTitle: { fontSize: 18.2, lineHeight: 23, fontWeight: "700", letterSpacing: -0.2, color: colors.ink },
  groupHint: { fontSize: 13.5, lineHeight: 18, color: colors.textTertiary, marginTop: 2.2 },
  optional: { fontSize: 14.4, fontWeight: "400", letterSpacing: 0, color: colors.textTertiary },
  textarea: { marginTop: 12.2, minHeight: 57.2, borderRadius: radius.r12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10.6, paddingTop: 9, paddingBottom: 9, fontSize: 13.3, lineHeight: 18, color: colors.ink, textAlignVertical: "top" },
  notice: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.amberSoft, borderRadius: radius.r14, padding: 12 },
  noticeText: { flex: 1, fontSize: 13.5, lineHeight: 18, color: "#666C6F" },

  // Barra inferior (C16b)
  bar: { flexDirection: "row", alignItems: "center", paddingTop: 12, backgroundColor: colors.white, ...shadows.bar },
  cta: { alignItems: "center", justifyContent: "center", backgroundColor: colors.blue, paddingHorizontal: 12 },
  ctaOff: { backgroundColor: colors.disabledBg },
  ctaText: { fontWeight: "600", color: colors.white },

  // 27
  marketPhotoCard: { position: "absolute", left: 9.2, right: 7, top: 5.5, bottom: 4, borderRadius: radius.r24, backgroundColor: colors.surfaceGray },
  marketBody: { paddingLeft: 21.2, paddingRight: 20 },
  marketName: { fontSize: 29.7, lineHeight: 35, fontWeight: "700", letterSpacing: -0.6, color: colors.ink, marginTop: 17.7 },
  unitPill: { alignSelf: "flex-start", height: 28.6, borderRadius: 12, backgroundColor: "#F0F2F4", paddingHorizontal: 10.6, paddingTop: 5.8, marginTop: 4.9 },
  unitPillText: { fontSize: 13.7, lineHeight: 17, color: "#5D6679" },
  marketPrice: { fontSize: 25.5, lineHeight: 31, fontWeight: "700", letterSpacing: -0.3, color: colors.ink, marginTop: 10.1 },
  marketDesc: { fontSize: 14.3, lineHeight: 19, color: colors.textTertiary, marginTop: 13.5 },
  marketSection: { fontSize: 18.5, lineHeight: 23, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, marginTop: 15.2 },
  marketNote: { fontSize: 12.8, lineHeight: 17, color: colors.textPlaceholder, marginTop: 6.6 },

  // 30
  pharmaCard: { marginLeft: 6.9, marginTop: 2.4, borderRadius: radius.r24, overflow: "hidden", backgroundColor: colors.surfaceGray },
  pharmaRight: { position: "absolute", right: 11.1, top: 11.8, flexDirection: "row", gap: 12 },
  dotsSlot: { height: 28.6, alignItems: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, height: 6, alignItems: "center", marginTop: 10.7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E1E4EA" },
  dotOn: { backgroundColor: colors.blue },
  pharmaBody: { paddingLeft: 19.4, paddingRight: 18.8 },
  pharmaName: { fontSize: 22.3, lineHeight: 27, fontWeight: "700", letterSpacing: -0.3, color: colors.ink },
  pharmaUnit: { fontSize: 12.3, lineHeight: 16, color: colors.textTertiary, marginTop: 1.4 },
  pharmaPrice: { fontSize: 20, lineHeight: 25, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, marginTop: 3.9 },
  storeCard: { flexDirection: "row", alignItems: "center", height: 54.4, borderRadius: radius.r16, backgroundColor: "#F0F6FD", marginTop: 10.6, marginLeft: -3.7, marginRight: -4 },
  storeCardName: { fontSize: 13.4, lineHeight: 18, fontWeight: "600", color: colors.ink },
  storeCardSub: { fontSize: 11.8, lineHeight: 16, color: colors.textTertiary, marginTop: 0.5 },
  pharmaNote: { fontSize: 9.5, lineHeight: 13, color: colors.textTertiary, marginTop: 4.5 },
});
