import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, TextInput, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows, formatCOP, lineTotal } from "@yava/shared";
import { Text } from "@/components/ui";
import { cartMerchantPhoto, cartProductPhoto, cartSuggestionPhoto } from "./photos";
import { etaText, DOT } from "@/components/customer/MerchantCard";
import { NavBar, Thumb, QtyStepper, AddRing, Rule, PillButton, IconDisc } from "./parts";
import { NO_OUTLINE } from "./FormField";
import { withoutMerchant } from "./helpers";
import type { CartViewProps } from "./types";

const G = 18;

/**
 * Pantalla 15 · Tu canasta (comida). tanda-02/15-canasta.png: comercio con miniatura, líneas con foto y
 * stepper papelera|n|+, "Agregar más productos", instrucciones, "Productos" + nota, "Te puede gustar" y
 * barra inferior blanca con Subtotal + "Continuar".
 */
export function FoodCart(p: CartViewProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editingNotes, setEditingNotes] = useState(false);
  const cardW = (Math.min(width, 600) - G * 2 - 12) / 2;
  const m = p.merchant;
  // "Te puede gustar": dos productos de las categorías que aún no están en la canasta, en el orden del menú
  // (`p.suggestions` ya viene así); si no alcanzan, se completa con los más económicos del resto. Con S-CART
  // (ceviche + limonada) da Patacones y Chips de plátano, como en el diseño.
  const complements = useMemo(() => {
    const inCart = new Set(p.lines.map((l) => p.products.get(l.product_id)?.category_id).filter((c): c is string => Boolean(c)));
    const fresh = p.suggestions.filter((s) => s.category_id && !inCart.has(s.category_id));
    const rest = p.suggestions.filter((s) => !fresh.includes(s)).sort((a, b) => a.price - b.price);
    return [...fresh, ...rest].slice(0, 2);
  }, [p.lines, p.products, p.suggestions]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="circle" title="Tu canasta" titleX={64.2} titleTop={14.4} height={50} />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {/* Comercio */}
        <Pressable onPress={p.onAddMore} style={styles.merchant} accessibilityRole="button" accessibilityLabel={`Ver menú de ${m.name}`}>
          <Thumb source={cartMerchantPhoto(m, "thumb")} width={59} height={59} radius={10} />
          <View style={{ marginLeft: 11.5, paddingTop: 8.5, flex: 1 }}>
            <Text style={styles.mName} numberOfLines={1}>{m.name}</Text>
            <Text style={styles.mMeta} numberOfLines={1}>{[m.tagline, etaText(m.prep_min, m.prep_max)].filter(Boolean).join(DOT)}</Text>
          </View>
        </Pressable>
        <Rule style={[styles.rule, { marginTop: 14 }]} />

        {/* Líneas */}
        {p.lines.map((l, i) => {
          const prod = p.products.get(l.product_id);
          const opts = l.options.map((o) => o.name).join(", ");
          return (
            <View key={`${l.product_id}-${i}`}>
              <View style={styles.line}>
                <Pressable onPress={() => p.onOpenProduct(l.product_id)} accessibilityRole="button" accessibilityLabel={l.name}>
                  <Thumb source={cartProductPhoto({ name: l.name, image_urls: prod?.image_urls })} width={77} height={68.4} radius={10} />
                </Pressable>
                <View style={[styles.lineText, !opts && !l.notes ? { marginTop: -5.5 } : null]}>
                  <Text style={styles.lName} numberOfLines={2}>{l.name}</Text>
                  <Text style={styles.lPrice}>{formatCOP(lineTotal(l))}</Text>
                  {opts ? <Text style={styles.lOpt} numberOfLines={1}>{opts}</Text> : null}
                  {l.notes ? <Text style={styles.lOpt} numberOfLines={1}>“{l.notes}”</Text> : null}
                </View>
                <QtyStepper value={l.qty} onChange={(q) => p.onQty(i, q)} variant="cart" />
              </View>
              <Rule style={styles.rule} />
            </View>
          );
        })}

        {/* Agregar más */}
        <Pressable onPress={p.onAddMore} style={styles.addMore} accessibilityRole="button" hitSlop={6}>
          <View style={styles.addMoreDot}><Ionicons name="add" size={20} color={colors.white} /></View>
          <Text style={styles.addMoreText}>Agregar más productos</Text>
        </Pressable>

        {/* Instrucciones */}
        <View style={styles.notesBox}>
          <Pressable onPress={() => setEditingNotes((v) => !v)} style={styles.notesRow} accessibilityRole="button" accessibilityLabel="Instrucciones del pedido (opcional)" accessibilityState={{ expanded: editingNotes }}>
            <IconDisc icon="document-text-outline" size={33.5} iconSize={19} bg="#ECEFF3" />
            <Text style={styles.notesText} numberOfLines={editingNotes ? 1 : 2}>
              {p.notes && !editingNotes ? p.notes : "Instrucciones del pedido (opcional)"}
            </Text>
            <Ionicons name={editingNotes ? "chevron-down" : "chevron-forward"} size={16} color={colors.textTertiary} />
          </Pressable>
          {editingNotes ? (
            <TextInput value={p.notes} onChangeText={p.onNotes} placeholder="Sin cubiertos, entregar en portería…" placeholderTextColor={colors.textPlaceholder}
              multiline autoFocus maxLength={250} selectionColor={colors.blueText} style={[styles.notesInput, NO_OUTLINE]} accessibilityLabel="Instrucciones del pedido" />
          ) : null}
        </View>

        {/* Productos */}
        <View style={styles.prodRow}>
          <Text style={styles.prodLabel}>Productos</Text>
          <Text style={styles.prodValue}>{formatCOP(p.totals.subtotal)}</Text>
        </View>
        <Text style={styles.prodNote}>El envío y el servicio se calculan al continuar.</Text>
        <Rule style={[styles.rule, { marginTop: 20.5 }]} />

        {/* Te puede gustar */}
        {p.suggestions.length ? (
          <View>
            <Text style={styles.section}>Te puede gustar</Text>
            <View style={{ flexDirection: "row", paddingHorizontal: G, gap: 12, marginTop: 7.3 }}>
              {complements.map((s) => (
                <View key={s.id} style={{ width: cardW }}>
                  <Pressable onPress={() => p.onOpenProduct(s.id)} accessibilityRole="button" accessibilityLabel={s.name}>
                    <Thumb source={cartSuggestionPhoto(s)} width={cardW} height={93} radius={11} />
                    <Text style={styles.sName} numberOfLines={1}>{withoutMerchant(s.name, m.name)}</Text>
                    <Text style={styles.sMerchant} numberOfLines={1}>{m.name}</Text>
                    <Text style={styles.sPrice}>{formatCOP(s.price)}</Text>
                  </Pressable>
                  <AddRing onPress={() => p.onAddSuggestion(s)} style={{ position: "absolute", top: 4, right: 4 }} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Barra inferior C16a */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>Subtotal</Text>
          <Text style={styles.barTotal}>{formatCOP(p.totals.subtotal)}</Text>
        </View>
        <PillButton title="Continuar" onPress={p.onContinue} height={43.4} glow style={{ width: 159, marginRight: -1.4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  merchant: { flexDirection: "row", paddingHorizontal: G, marginTop: 6.8 },
  mName: { fontSize: 14.45, lineHeight: 19, fontWeight: "700", color: colors.ink },
  mMeta: { fontSize: 12.4, lineHeight: 18, color: "#5F6981", marginTop: 1.7 },
  rule: { marginHorizontal: G },
  line: { flexDirection: "row", alignItems: "center", paddingLeft: G, paddingRight: 18.5, paddingTop: 9.6, paddingBottom: 11.4 },
  lineText: { flex: 1, marginLeft: 12.5, marginRight: 8, marginTop: -2 },
  lName: { fontSize: 12.35, lineHeight: 18, fontWeight: "600", color: colors.ink },
  lPrice: { fontSize: 12.75, lineHeight: 18, fontWeight: "700", color: colors.ink, marginTop: 2.2 },
  lOpt: { fontSize: 10.2, lineHeight: 15, color: "#6B7590", marginTop: 1.6 },
  addMore: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginLeft: G, marginTop: 10.6 },
  addMoreDot: { width: 27.2, height: 27.2, borderRadius: 13.6, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  addMoreText: { fontSize: 11.95, lineHeight: 17, fontWeight: "600", color: colors.blueLink, marginLeft: 9.3 },
  notesBox: { marginLeft: 13.4, marginRight: 12.9, marginTop: 16.5, borderRadius: 14, backgroundColor: "#F5F6F8", paddingHorizontal: 8.4, paddingVertical: 9.1 },
  notesRow: { flexDirection: "row", alignItems: "center" },
  notesText: { flex: 1, marginLeft: 11, fontSize: 11.85, lineHeight: 17, color: colors.ink },
  notesInput: { marginTop: 8, minHeight: 56, backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5, color: colors.ink, textAlignVertical: "top" },
  prodRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: G, marginTop: 22.4 },
  prodLabel: { fontSize: 12.3, lineHeight: 18, color: colors.ink },
  prodValue: { fontSize: 12.2, lineHeight: 18, fontWeight: "600", color: colors.ink },
  prodNote: { fontSize: 10.1, lineHeight: 15, color: colors.textTertiary, paddingHorizontal: G, marginTop: 11.2 },
  section: { fontSize: 15.7, lineHeight: 20, fontWeight: "700", color: colors.ink, letterSpacing: -0.2, paddingHorizontal: G, marginTop: 14.3 },
  sName: { fontSize: 11.8, lineHeight: 16, fontWeight: "600", color: colors.ink, marginTop: 1.7 },
  sMerchant: { fontSize: 10.45, lineHeight: 15, color: colors.textTertiary, marginTop: 0.7 },
  sPrice: { fontSize: 12.7, lineHeight: 16, fontWeight: "700", color: colors.ink, marginTop: 3.2 },
  bar: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: G, paddingTop: 13.8, backgroundColor: colors.white, ...shadows.bar },
  barLabel: { fontSize: 12.4, lineHeight: 16, color: colors.textTertiary, marginTop: -2 },
  barTotal: { fontSize: 20.7, lineHeight: 26, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
});
