import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Modal, Platform } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, lineTotal } from "@yava/shared";
import type { CartLine } from "@yava/shared";
import { Text } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import { isProductAvailable } from "@/components/customer/ProductRow";
import { productImage, productDesignImage, type DesignImageSource } from "@/lib/design-images";
import type { ProductRow, ProductCategoryRow, OptionGroupWithOptions } from "@/features/customer/types";
import { PillStepper } from "./PillStepper";


/** En web un `<button>` no puede contener otro: las tarjetas con "+" solo se anuncian como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);
const isDrinks = (name: string) => /bebida|jugo|gaseosa|drink/i.test(name);
/** Azul del CTA "Continuar" medido en el PNG de 14. */
const CTA_BLUE = "#0048BB";

/**
 * Foto de la baldosa (14): el recorte propio de la hoja si existe; si no, el del grid del menú de 12 (mismo encuadre
 * de vaso/plato que en 14) y, por último, la foto normal del producto.
 */
function tileImage(p: ProductRow): DesignImageSource | undefined {
  const def = productDesignImage(p.name, "default");
  const comp = productDesignImage(p.name, "complement");
  if (comp !== undefined && comp !== def) return comp;
  const menu = productDesignImage(p.name, "menu");
  if (menu !== undefined && menu !== def) return menu;
  return productImage(p, "complement");
}

interface Section { id: string; name: string; drinks: boolean; items: ProductRow[] }

/**
 * Pantalla 14 · Complementos (tanda-02/14-complementos.png): hoja modal casi a pantalla completa que se abre al tocar
 * "Agregar" en el detalle de un plato (13). Ofrece las otras categorías del comercio (bebidas en carrusel, el resto en
 * tarjetas), los grupos opcionales del producto (fila compacta de chips: el PNG no los tiene, así no empujan
 * "Tu pedido actual" y el CTA fuera de la vista), "Tu pedido actual" con el subtotal y dos salidas:
 * "Continuar" (agrega todo y va a la canasta) y "Seguir sin complementos" (agrega solo el plato).
 */
export function ComplementsSheet({
  visible, merchantName, mainLine, mainImage, optionalGroups, products, categories, existingLines,
  onClose, onEdit, onContinue, onSkip,
}: {
  visible: boolean; merchantName: string; mainLine: CartLine | null; mainImage?: DesignImageSource;
  optionalGroups: OptionGroupWithOptions[]; products: ProductRow[]; categories: ProductCategoryRow[]; existingLines: CartLine[];
  onClose: () => void; onEdit: () => void; onContinue: (lines: CartLine[]) => void; onSkip: (main: CartLine) => void;
}) {
  const insets = useSafeAreaInsets();
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [optSel, setOptSel] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Cada vez que se abre, empieza limpio.
  useEffect(() => { if (visible) { setExtras({}); setOptSel({}); setExpanded({}); } }, [visible]);

  const sections = useMemo<Section[]>(() => {
    const mainCat = products.find((p) => p.id === mainLine?.product_id)?.category_id ?? null;
    const avail = products.filter((p) => p.id !== mainLine?.product_id && isProductAvailable(p));
    const out = categories
      .filter((c) => c.id !== mainCat)
      .map((c) => ({ id: c.id, name: c.name, drinks: isDrinks(c.name), items: avail.filter((p) => p.category_id === c.id) }))
      .filter((s) => s.items.length);
    return [...out.filter((s) => s.drinks), ...out.filter((s) => !s.drinks)];
  }, [products, categories, mainLine?.product_id]);

  if (!mainLine) return null;

  const mainWithOpts: CartLine = {
    ...mainLine,
    options: [
      ...mainLine.options,
      ...optionalGroups.flatMap((g) => g.options.filter((o) => (optSel[g.id] ?? []).includes(o.id)).map((o) => ({ group_id: g.id, option_id: o.id, name: o.name, price_delta: o.price_delta }))),
    ],
  };
  const extraLines: CartLine[] = Object.entries(extras).filter(([, q]) => q > 0).flatMap(([pid, qty]) => {
    const p = products.find((x) => x.id === pid);
    return p ? [{ product_id: p.id, name: p.name, unit_price: p.price, qty, options: [] }] : [];
  });
  const current = [...existingLines, mainWithOpts, ...extraLines];
  const subtotal = current.reduce((a, l) => a + lineTotal(l), 0);

  const setQty = (pid: string, q: number) => setExtras((prev) => ({ ...prev, [pid]: Math.max(0, q) }));
  function toggleOpt(g: OptionGroupWithOptions, optionId: string) {
    setOptSel((prev) => {
      const cur = prev[g.id] ?? [];
      if (cur.includes(optionId)) return { ...prev, [g.id]: cur.filter((x) => x !== optionId) };
      if (g.max_select <= 1) return { ...prev, [g.id]: [optionId] };
      if (cur.length >= g.max_select) return prev;
      return { ...prev, [g.id]: [...cur, optionId] };
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { paddingTop: insets.top + 0.9 }]}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} showsVerticalScrollIndicator={false}>
            {/* Encabezado */}
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Completa tu pedido</Text>
                <Text style={styles.subtitle} numberOfLines={1}>De {merchantName}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close}>
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            {/* Secciones del menú (bebidas en carrusel; el resto en tarjetas) */}
            {sections.map((s, i) => {
              const all = Boolean(expanded[s.id]);
              const limit = s.drinks ? 6 : 2;
              const list = all ? s.items : s.items.slice(0, limit);
              return (
                <View key={s.id} style={{ marginTop: i === 0 ? 16.9 : 18.9 }}>
                  <View style={styles.secHead}>
                    <Text style={styles.secTitle} numberOfLines={1}>{s.name}</Text>
                    {s.items.length > limit ? (
                      <Pressable onPress={() => setExpanded((e) => ({ ...e, [s.id]: !all }))} hitSlop={8} style={styles.seeAll} accessibilityRole="button">
                        <Text style={styles.seeAllText}>{all ? "Ver menos" : s.drinks ? "Ver todas" : "Ver todos"}</Text>
                        <Ionicons name="chevron-forward" size={12} color={colors.blueLink} style={{ marginLeft: 3, marginTop: 1 }} />
                      </Pressable>
                    ) : null}
                  </View>
                  {s.drinks ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drinkRow}>
                      {list.map((p) => (
                        <DrinkTile key={p.id} p={p} qty={extras[p.id] ?? 0} onQty={(q) => setQty(p.id, q)} />
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.sideGrid}>
                      {list.map((p) => (
                        <SideCard key={p.id} p={p} qty={extras[p.id] ?? 0} onQty={(q) => setQty(p.id, q)} />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Grupos opcionales del producto (p. ej. "Complementos": patacones extra, aguacate…): chips en una fila */}
            {optionalGroups.map((g) => (
              <View key={g.id} style={{ marginTop: 18.9 }}>
                <View style={styles.secHead}>
                  <Text style={styles.secTitle} numberOfLines={1}>{g.name}</Text>
                  <Text style={styles.optHint}>{g.max_select > 1 ? `Opcional · hasta ${g.max_select}` : "Opcional"}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {g.options.map((o) => {
                    const on = (optSel[g.id] ?? []).includes(o.id);
                    return (
                      <Pressable key={o.id} onPress={() => toggleOpt(g, o.id)} disabled={!o.available}
                        accessibilityRole={g.max_select > 1 ? "checkbox" : "radio"} accessibilityState={{ checked: on, disabled: !o.available }}
                        style={({ pressed }) => [styles.chip, on ? styles.chipOn : null, !o.available ? { opacity: 0.45 } : pressed ? { opacity: 0.8 } : null]}>
                        {on ? <Ionicons name="checkmark" size={14} color={colors.blueText} style={{ marginRight: 4 }} /> : null}
                        <Text style={[styles.chipText, on ? { color: colors.blueText } : null]} numberOfLines={1}>{o.name}</Text>
                        <Text style={[styles.chipPrice, on ? { color: colors.blueText } : null]}>
                          {!o.available ? " · No disponible" : o.price_delta ? `  +${formatCOP(o.price_delta)}` : "  Sin costo"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            {/* Tu pedido actual */}
            <View style={styles.sep} />
            <View style={[styles.secHead, { marginTop: 8 }]}>
              <Text style={[styles.secTitle, styles.orderTitle]}>Tu pedido actual</Text>
              <Pressable onPress={onEdit} hitSlop={8} style={styles.seeAll} accessibilityRole="button" accessibilityLabel="Editar el producto">
                <Text style={styles.seeAllText}>Editar</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.blueLink} style={{ marginLeft: 3, marginTop: 1 }} />
              </Pressable>
            </View>
            <View style={{ gap: 8.8, marginTop: 5.1 }}>
              {current.map((l, i) => (
                <View key={`${l.product_id}-${i}`} style={styles.lineRow}>
                  <Image source={l === mainWithOpts ? mainImage ?? productImage({ name: l.name }) : productImage({ name: l.name })} style={styles.lineThumb} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 11.6 }}>
                    <Text style={styles.lineName} numberOfLines={1}>{l.name}</Text>
                    {l.options.length ? <Text style={styles.lineOpts} numberOfLines={1}>{l.options.map((o) => o.name).join(", ")}</Text> : null}
                  </View>
                  <View style={{ alignItems: "flex-end", alignSelf: "flex-start", marginTop: 7.4 }}>
                    <Text style={styles.linePrice}>{formatCOP(lineTotal(l))}</Text>
                    <Text style={styles.lineQty}>{`x${l.qty}`}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={[styles.sep, { marginTop: 8.3 }]} />
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>Subtotal</Text>
              <Text style={styles.subValue}>{formatCOP(subtotal)}</Text>
            </View>

            <Pressable onPress={() => onContinue([mainWithOpts, ...extraLines])} accessibilityRole="button" accessibilityLabel={`Continuar, ${formatCOP(subtotal)}`}
              style={({ pressed }) => [styles.cta, { backgroundColor: pressed ? colors.blueDark : CTA_BLUE }]}>
              <Text style={styles.ctaText}>Continuar</Text>
              <View style={styles.ctaRight}>
                <Text style={styles.ctaPrice}>{formatCOP(subtotal)}</Text>
                <Ionicons name="chevron-forward" size={17} color={colors.white} style={{ marginLeft: 5 }} />
              </View>
            </Pressable>
            <Pressable onPress={() => onSkip(mainLine)} hitSlop={8} accessibilityRole="button" style={styles.skip}>
              <Text style={styles.skipText}>Seguir sin complementos</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Tarjeta de bebida 117,3 × 111,5 pt (C12d): seleccionada con un aro azul de 1,6 pt por fuera de la foto y el
 * stepper C14e (82 × 25,5) centrado abajo; si no, "+" azul de 24 pt con aro blanco.
 */
function DrinkTile({ p, qty, onQty }: { p: ProductRow; qty: number; onQty: (q: number) => void }) {
  const on = qty > 0;
  return (
    <View style={{ width: 117.3 }}>
      <View>
        {on ? <View style={styles.drinkRing} pointerEvents="none" /> : null}
        <Pressable onPress={() => onQty(on ? qty : 1)} accessibilityRole={CARD_ROLE} accessibilityLabel={p.name} style={styles.drinkPhotoBox}>
          <Image source={tileImage(p)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          {on ? (
            <PillStepper value={qty} onChange={onQty} height={25.5} width={82} valueColor={colors.blueText} style={styles.drinkStepper} />
          ) : (
            <AddButton size={26.6} onPhoto onPress={() => onQty(1)} accessibilityLabel={`Agregar ${p.name}`} style={styles.drinkAdd} />
          )}
        </Pressable>
      </View>
      <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
      <Text style={styles.itemPrice}>{formatCOP(p.price)}</Text>
    </View>
  );
}

/** Tarjeta de acompañante 172,4 × 97 pt con "+" blanco abajo-derecha; seleccionada = aro azul + stepper. */
function SideCard({ p, qty, onQty }: { p: ProductRow; qty: number; onQty: (q: number) => void }) {
  const on = qty > 0;
  return (
    <View style={{ flex: 1, maxWidth: 172.4 }}>
      {on ? <View style={[styles.drinkRing, { height: 97 + 3.2 }]} pointerEvents="none" /> : null}
      <Pressable onPress={() => onQty(on ? qty : 1)} accessibilityRole={CARD_ROLE} accessibilityLabel={p.name} style={styles.sidePhotoBox}>
        <Image source={tileImage(p)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        {on ? (
          <PillStepper value={qty} onChange={onQty} height={25.5} width={82} valueColor={colors.blueText} style={styles.sideStepper} />
        ) : (
          <AddButton size={26} variant="white" onPress={() => onQty(1)} accessibilityLabel={`Agregar ${p.name}`} style={styles.sideAdd} />
        )}
      </Pressable>
      <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
      <Text style={styles.itemPrice}>{formatCOP(p.price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000000" },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: radius.r24, borderTopRightRadius: radius.r24, overflow: "hidden" },
  handle: { alignSelf: "center", width: 37.4, height: 3.7, borderRadius: 2, backgroundColor: "#C7C9CE", marginTop: 7.4 },

  head: { flexDirection: "row", alignItems: "flex-start", paddingLeft: 20.3, paddingRight: 16.6, marginTop: 17.2 },
  title: { fontSize: 22.4, lineHeight: 27, fontWeight: "700", letterSpacing: -0.3, color: colors.ink },
  subtitle: { fontSize: 13.9, lineHeight: 18, color: colors.textTertiary, marginTop: -2.7 },
  close: { width: 31.4, height: 31.4, borderRadius: 15.7, backgroundColor: "#EFEFF1", alignItems: "center", justifyContent: "center", marginTop: -0.8 },

  secHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 19.9, paddingRight: 17 },
  secTitle: { fontSize: 17.8, lineHeight: 22, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, flexShrink: 1 },
  seeAll: { flexDirection: "row", alignItems: "center" },
  seeAllText: { fontSize: 10.3, lineHeight: 14, fontWeight: "500", color: colors.blueLink },
  /** "Tu pedido actual" va más pequeño que los títulos de sección (medido en el PNG). */
  orderTitle: { fontSize: 15.3, lineHeight: 20 },

  drinkRow: { paddingLeft: 20.7, paddingRight: 17, gap: 8, paddingTop: 8 },
  drinkPhotoBox: { width: 117.3, height: 111.5, borderRadius: radius.r12, overflow: "hidden", backgroundColor: colors.surfaceGray },
  /** Aro de la tarjeta seleccionada: 1,6 pt por fuera de la foto (en el PNG la foto no se encoge). */
  drinkRing: { position: "absolute", left: -1.6, top: -1.6, right: -1.6, height: 111.5 + 3.2, borderRadius: 13.6, borderWidth: 1.6, borderColor: "#0A47F0" },
  drinkStepper: { position: "absolute", left: (117.3 - 82) / 2, bottom: 6 },
  drinkAdd: { position: "absolute", right: 5.9, bottom: 7.3, borderWidth: 1.3 },
  itemName: { fontSize: 11.2, lineHeight: 15, fontWeight: "500", color: colors.ink, marginTop: 2.4, marginLeft: 1.2 },
  itemPrice: { fontSize: 12.1, lineHeight: 16, color: colors.ink, marginTop: 0.6, marginLeft: 1.2 },

  sideGrid: { flexDirection: "row", paddingLeft: 19.7, paddingRight: 19.6, gap: 9, paddingTop: 7.4 },
  sidePhotoBox: { height: 97, borderRadius: radius.r12, overflow: "hidden", backgroundColor: colors.surfaceGray },
  sideStepper: { position: "absolute", right: 5, bottom: 5 },
  sideAdd: { position: "absolute", right: 5.8, bottom: 5.5 },

  optHint: { fontSize: 12.1, lineHeight: 16, color: colors.textTertiary, marginLeft: 8 },
  chipRow: { paddingLeft: 19.7, paddingRight: 17, gap: 7, paddingTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.blueTint, borderColor: colors.blueText, borderWidth: 1.5, paddingHorizontal: 11.5 },
  chipText: { fontSize: 12.4, lineHeight: 16, fontWeight: "500", color: colors.ink },
  chipPrice: { fontSize: 12.1, lineHeight: 16, color: colors.textTertiary },

  sep: { height: 1, backgroundColor: "#E5E8EE", marginHorizontal: 19.4, marginTop: 16.9 },
  lineRow: { flexDirection: "row", alignItems: "center", paddingLeft: 19.4, paddingRight: 19.8, minHeight: 43.8 },
  lineThumb: { width: 50.8, height: 43.8, borderRadius: 8, backgroundColor: colors.surfaceGray },
  lineName: { fontSize: 11.8, lineHeight: 16, color: colors.ink },
  lineOpts: { fontSize: 10.5, lineHeight: 14, color: colors.textTertiary, marginTop: 1 },
  linePrice: { fontSize: 11.3, lineHeight: 15, color: colors.ink },
  lineQty: { fontSize: 10.8, lineHeight: 15, color: colors.textTertiary, marginTop: 1.6 },

  subRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 20.3, paddingRight: 19.6, marginTop: 6.8 },
  subLabel: { fontSize: 13.7, lineHeight: 20, fontWeight: "700", color: colors.ink },
  subValue: { fontSize: 13.7, lineHeight: 20, fontWeight: "700", color: colors.ink },

  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 21, marginLeft: 16.2, marginRight: 16.2, marginTop: 10.1 },
  ctaText: { fontSize: 15.1, lineHeight: 20, fontWeight: "600", color: colors.white },
  ctaRight: { position: "absolute", right: 17, flexDirection: "row", alignItems: "center" },
  ctaPrice: { fontSize: 12.8, lineHeight: 17, fontWeight: "500", color: colors.white },
  skip: { alignSelf: "center", marginTop: 8.2, paddingVertical: 4 },
  skipText: { fontSize: 11.2, lineHeight: 15, fontWeight: "500", color: colors.blueLink },
});
