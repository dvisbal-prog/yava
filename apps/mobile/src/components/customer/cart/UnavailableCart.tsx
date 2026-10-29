import React, { useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors, formatCOP, lineTotal } from "@yava/shared";
import { Text } from "@/components/ui";
import { productImage, normalizeName } from "@/lib/design-images";
import type { ProductRow } from "@/features/customer";
import { etaText, DOT } from "@/components/customer/MerchantCard";
import { PriceBreakdown } from "@/components/customer/PriceBreakdown";
import { NavBar, Thumb, QtyStepper, Rule, PillButton } from "./parts";
import { cartMerchantPhoto, cartProductPhoto } from "./photos";
import { splitUnit, withoutMerchant } from "./helpers";
import type { CartViewProps } from "./types";

const G = 18;
const MUTED = "#858D9F";
/** Espacio duro: una línea vacía conserva su alto en iOS, Android y web (" " se colapsa en web). */
const NBSP = "\u00A0";

/** Presentación corta de un producto ("500 ml.", "1 libra") a partir del nombre o la descripción. */
function shortUnit(name: string, description: string | null | undefined): string | null {
  const { unit } = splitUnit(name);
  if (unit) return unit;
  const d = (description ?? "").trim();
  return d && d.length <= 18 && /\d/.test(d) ? d : null;
}

/**
 * Pantalla 44 · Producto no disponible en la canasta (tanda-06/44-producto-no-disponible.png):
 * cabecera grande del comercio, "Tu pedido" con la línea agotada en caja gris + insignia ámbar,
 * aviso ámbar, "Te puede gustar en su lugar" (tarjetas con "Elegir"), resumen y "Continuar" deshabilitado.
 */
export function UnavailableCart(p: CartViewProps) {
  const insets = useSafeAreaInsets();
  const m = p.merchant;
  // "En su lugar": primero lo que comparte palabra con lo agotado (otra limonada), luego lo de precio más parecido.
  const alternatives = useMemo(() => {
    const gone = p.lines.filter((l) => p.unavailable.has(l.product_id));
    const words = new Set(gone.flatMap((l) => normalizeName(l.name).split(" ").filter((w) => w.length > 3)));
    const ref = gone[0]?.unit_price ?? 0;
    const score = (s: ProductRow) => (normalizeName(s.name).split(" ").some((w) => words.has(w)) ? 0 : 1e9) + Math.abs(s.price - ref);
    return [...p.suggestions].sort((a, b) => score(a) - score(b)).slice(0, 2);
  }, [p.lines, p.unavailable, p.suggestions]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="chevron" height={30} backTop={-2.6} backLeft={13.8} backIcon={21.8} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Comercio */}
        <Pressable onPress={p.onAddMore} style={styles.merchant} accessibilityRole="button" accessibilityLabel={`Ver menú de ${m.name}`}>
          <Thumb source={cartMerchantPhoto(m, "banner")} width={141.3} height={77.1} radius={12} />
          <View style={{ flex: 1, marginLeft: 12.5 }}>
            <Text style={styles.mName} numberOfLines={1}>{m.name}</Text>
            <Text style={styles.mMeta} numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
          </View>
        </Pressable>
        <Rule style={[styles.rule, { marginTop: 15.3 }]} />

        <Text style={styles.section}>Tu pedido</Text>

        {p.lines.map((l, i) => {
          const prod = p.products.get(l.product_id);
          const bad = p.unavailable.has(l.product_id);
          const opts = l.options.map((o) => o.name).join(", ");
          const desc = [opts, prod?.description].filter(Boolean).join(" · ") || null;
          if (!bad) {
            return (
              <View key={`${l.product_id}-${i}`} style={styles.line}>
                <Thumb source={cartProductPhoto({ name: l.name, image_urls: prod?.image_urls })} width={72.5} height={71.6} radius={12} />
                <View style={styles.lineText}>
                  <Text style={styles.lName} numberOfLines={1}>{l.name}</Text>
                  {desc ? <Text style={styles.lDesc} numberOfLines={2}>{desc}</Text> : null}
                  <Text style={styles.lPrice}>{formatCOP(lineTotal(l))}</Text>
                </View>
                <View style={{ transform: [{ translateY: -2.3 }] }}><QtyStepper value={l.qty} onChange={(q) => p.onQty(i, q)} variant="filled" /></View>
              </View>
            );
          }
          const unit = shortUnit(l.name, prod?.description);
          return (
            <View key={`${l.product_id}-${i}`} style={styles.badLine}>
              <Thumb source={cartProductPhoto({ name: l.name, image_urls: prod?.image_urls })} width={72} height={70.6} radius={12} />
              <View style={[styles.lineText, { marginLeft: 13.9, marginTop: -5.5 }]}>
                <Text style={[styles.lName, { color: MUTED }]} numberOfLines={1}>{splitUnit(l.name).name}</Text>
                <Text style={[styles.lDesc, { color: MUTED, marginTop: 1.1, fontSize: 10.8 }]} numberOfLines={1}>{unit ?? NBSP}</Text>
                <View style={styles.badRow}>
                  <Text style={[styles.lPrice, { color: MUTED, marginTop: 0 }]}>{formatCOP(lineTotal(l))}</Text>
                  <View style={styles.badge} accessibilityLabel="No disponible">
                    <Ionicons name="alert-circle" size={12.9} color={colors.amberPillText} />
                    <Text style={styles.badgeText}>No disponible</Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={() => p.onQty(i, 0)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar ${l.name}`} style={{ paddingHorizontal: 6, marginRight: 12 }}>
                <Feather name="trash-2" size={18} color="#4E586B" />
              </Pressable>
            </View>
          );
        })}

        {/* Aviso */}
        <View style={styles.notice}>
          <Ionicons name="alert-circle" size={19} color={colors.amber} />
          <Text style={styles.noticeText}>Elimina o reemplaza este producto para continuar.</Text>
        </View>

        {/* Alternativas */}
        {alternatives.length ? (
          <>
            <Text style={[styles.section, { marginTop: 16, fontSize: 15.0, lineHeight: 20 }]}>Te puede gustar en su lugar</Text>
            <View style={styles.altRow}>
              {alternatives.map((s) => {
                const unit = shortUnit(s.name, s.description);
                return (
                  <View key={s.id} style={styles.altCard}>
                    <Pressable onPress={() => p.onOpenProduct(s.id)} accessibilityRole="button" accessibilityLabel={s.name}>
                      <Thumb source={productImage(s)} width={55.9} height={87.3} radius={12} />
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: 8.3 }}>
                      <Pressable onPress={() => p.onOpenProduct(s.id)} accessibilityRole="button" accessibilityLabel={`Ver ${s.name}`}>
                        <Text style={styles.altName} numberOfLines={1}>{withoutMerchant(splitUnit(s.name).name, m.name)}</Text>
                        <Text style={styles.altUnit} numberOfLines={1}>{unit ?? NBSP}</Text>
                        <Text style={styles.altPrice}>{formatCOP(s.price)}</Text>
                      </Pressable>
                      <Pressable onPress={() => p.onAddSuggestion(s)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Elegir ${s.name}`}
                        style={({ pressed }) => [styles.choose, pressed && { backgroundColor: colors.blueTint }]}>
                        <Text style={styles.chooseText}>Elegir</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <Rule style={[styles.rule, { marginTop: 15.7 }]} />

        <Text style={[styles.section, { marginTop: 14.7, fontSize: 15.6, lineHeight: 20 }]}>Resumen del pedido</Text>
        <PriceBreakdown subtotal={p.totals.subtotal} deliveryFee={p.totals.deliveryFee} serviceFee={p.totals.serviceFee} discount={p.totals.discount} total={p.totals.total}
          sizes={{ label: 11.85, value: 12.75, row: 24, total: 14.4, totalValue: 13.75, gap: 5.5, gapBelow: 9.4 }} style={{ marginHorizontal: G, marginTop: 6.5 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 7.7, 14) }]}>
        <PillButton title="Continuar" onPress={p.onContinue} disabled tone="disabledStrong" height={44.3} textStyle={{ fontWeight: "500" }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  merchant: { flexDirection: "row", alignItems: "center", paddingLeft: 17.1, paddingRight: G, marginTop: 5.1 },
  mName: { fontSize: 18.8, lineHeight: 24, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  mMeta: { fontSize: 12.4, lineHeight: 18, color: "#5B6680", marginTop: 2.5 },
  rule: { marginHorizontal: 17.1 },
  section: { fontSize: 16.85, lineHeight: 21, fontWeight: "700", color: colors.ink, letterSpacing: -0.25, paddingHorizontal: G, marginTop: 11.2 },
  line: { flexDirection: "row", alignItems: "center", paddingLeft: G, paddingRight: 17.1, marginTop: 12.9, marginBottom: 10.6 },
  lineText: { flex: 1, marginLeft: 12.9, marginRight: 8 },
  lName: { fontSize: 13.6, lineHeight: 18, fontWeight: "600", color: colors.ink },
  lDesc: { fontSize: 10.6, lineHeight: 14.8, color: "#6B7489", marginTop: 1.8, maxWidth: 150 },
  lPrice: { fontSize: 12.5, lineHeight: 17, fontWeight: "500", color: colors.ink, marginTop: 3.3 },
  badLine: { flexDirection: "row", alignItems: "center", marginHorizontal: 10.6, height: 89.2, borderRadius: 14, backgroundColor: "#F6F7F9", paddingLeft: 8.1 },
  badRow: { flexDirection: "row", alignItems: "center", marginTop: 9.75 },
  badge: { flexDirection: "row", alignItems: "center", height: 20.6, borderRadius: 10.3, backgroundColor: colors.amberPill, paddingLeft: 8, paddingRight: 6, marginLeft: 15.8, transform: [{ translateY: 1.3 }] },
  badgeText: { fontSize: 9.3, lineHeight: 12, fontWeight: "500", color: colors.amberPillText, marginLeft: 5.6 },
  notice: { flexDirection: "row", alignItems: "center", marginHorizontal: 17.1, marginTop: 7.8, height: 36, borderRadius: 11, backgroundColor: colors.amberSoft, paddingLeft: 9.8 },
  noticeText: { flex: 1, fontSize: 11.0, lineHeight: 16, color: "#5F6568", marginLeft: 9.6 },
  altRow: { flexDirection: "row", gap: 6, paddingHorizontal: G, marginTop: 11 },
  altCard: { flex: 1, height: 110, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingLeft: 8.4, paddingRight: 6 },
  altName: { fontSize: 10.9, lineHeight: 15, fontWeight: "600", color: colors.ink },
  altUnit: { fontSize: 10.2, lineHeight: 13, color: "#7F889C", marginTop: 2.6, marginLeft: 2.5 },
  altPrice: { fontSize: 11.9, lineHeight: 16, fontWeight: "500", color: colors.ink, marginTop: 4.8, marginLeft: 1.5 },
  choose: { height: 26.8, borderRadius: 13.4, borderWidth: 1.5, borderColor: colors.blueText, alignItems: "center", justifyContent: "center", marginTop: 7.7, marginLeft: 1.6 },
  chooseText: { fontSize: 10.9, lineHeight: 14, fontWeight: "600", color: colors.blueText },
  footer: { paddingHorizontal: 17.1, paddingTop: 10, backgroundColor: colors.white },
});
