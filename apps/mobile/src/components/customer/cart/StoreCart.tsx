import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors, formatCOP, lineTotal } from "@yava/shared";
import { Text } from "@/components/ui";
import { PriceBreakdown } from "@/components/customer/PriceBreakdown";
import { Radio } from "@/components/customer/RadioRow";
import { useLocation } from "@/store/location";
import { NavBar, Thumb, QtyStepper, Rule, PillButton } from "./parts";
import { ChatLinesIcon, HouseIcon } from "./LineIcons";
import { cartProductPhoto } from "./photos";
import { splitUnit, etaSpaced, useSubstitution, SUBSTITUTION_OPTIONS } from "./helpers";
import type { CartViewProps } from "./types";

const SOFT = "#F6F9FB";

/**
 * Pantalla 28 · Canasta de mercado (tanda-04/28-mercado-canasta.png), también para farmacia:
 * tarjetas de línea con stepper −|n|+ y papelera, "Si falta un producto", dirección de entrega,
 * resumen de pago en tarjeta gris y CTA a lo ancho "Continuar · $total ›".
 */
export function StoreCart(p: CartViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const address = useLocation((s) => s.address);
  const cityName = useLocation((s) => s.cityName);
  const substitution = useSubstitution();
  const [showSubs, setShowSubs] = useState(false);
  const m = p.merchant;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="chevron" title="Tu canasta" subtitle={m.name} titleX={50.6} titleTop={7}
        titleStyle={styles.navTitle} subtitleStyle={styles.navSub} height={55} backTop={7.5} backLeft={15.6} backIcon={23} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Líneas */}
        <View style={{ marginTop: 3.2, gap: 4.2 }}>
          {p.lines.map((l, i) => {
            const prod = p.products.get(l.product_id);
            const { name, unit } = splitUnit(l.name);
            const opts = l.options.map((o) => o.name).join(", ");
            return (
              <View key={`${l.product_id}-${i}`} style={styles.lineCard}>
                <Pressable onPress={() => p.onOpenProduct(l.product_id)} accessibilityRole="button" accessibilityLabel={l.name}>
                  <Thumb source={cartProductPhoto({ name: l.name, image_urls: prod?.image_urls })} width={103.5} height={87.3} radius={12} />
                </Pressable>
                <View style={styles.lineText}>
                  <Text style={styles.lName} numberOfLines={2}>{name}</Text>
                  {unit || opts ? <Text style={styles.lUnit} numberOfLines={1}>{[unit, opts].filter(Boolean).join(" · ")}</Text> : null}
                  <Text style={styles.lPrice}>{formatCOP(lineTotal(l))}</Text>
                </View>
                <QtyStepper value={l.qty} onChange={(q) => p.onQty(i, q)} variant="market" />
                <Pressable onPress={() => p.onQty(i, 0)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Quitar ${l.name}`} style={styles.trash}>
                  <Feather name="trash-2" size={16} color="#242D43" />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Si falta un producto */}
        <View style={styles.softBox}>
          <Pressable onPress={() => setShowSubs((v) => !v)} style={styles.softRow} accessibilityRole="button" accessibilityLabel="Si falta un producto" accessibilityState={{ expanded: showSubs }}>
            <View style={{ marginLeft: 6.7, marginTop: 2 }}><ChatLinesIcon /></View>
            <View style={{ flex: 1, marginLeft: 17.6 }}>
              <Text style={styles.subsTitle}>Si falta un producto</Text>
              <Text style={styles.subsText} numberOfLines={1}>{substitution.choice}</Text>
            </View>
            <Ionicons name={showSubs ? "chevron-down" : "chevron-forward"} size={19} color={colors.iconGray} style={{ marginRight: 0.3 }} />
          </Pressable>
          {showSubs ? (
            <View style={{ marginTop: 10, gap: 2 }}>
              {SUBSTITUTION_OPTIONS.map((o) => {
                const on = substitution.choice === o;
                return (
                  <Pressable key={o} onPress={() => { substitution.setChoice(o); setShowSubs(false); }} style={styles.subsOpt} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                    <Radio selected={on} size={20} />
                    <Text style={styles.subsOptText}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Rule style={[styles.rule, { marginTop: 13.9 }]} />

        {/* Dirección de entrega */}
        <View style={styles.addrHead}>
          <Ionicons name="location" size={19} color="#2F3C53" />
          <Text style={styles.addrTitle}>Dirección de entrega</Text>
          <Pressable onPress={() => router.push("/modal/address-picker" as never)} hitSlop={10} accessibilityRole="button">
            <Text style={styles.link}>Cambiar</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push((address ? "/modal/address-picker" : "/(customer)/location?next=%2F(customer)%2Fcart") as never)} style={styles.addrCard} accessibilityRole="button">
          <View style={{ marginLeft: 18.3, marginTop: -10 }}><HouseIcon /></View>
          <View style={{ flex: 1, marginLeft: 18.8 }}>
            <Text style={styles.addrLabel} numberOfLines={1}>{address?.label ?? "Agrega una dirección"}</Text>
            <Text style={styles.addrLine} numberOfLines={1}>{address ? [address.line1, address.line2].filter(Boolean).join(" ") : "Necesitamos saber dónde entregarte"}</Text>
            {address && cityName ? <Text style={styles.addrLine} numberOfLines={1}>{cityName}</Text> : null}
          </View>
          <Text style={styles.addrEta}>{etaSpaced(m.prep_min, m.prep_max)}</Text>
          <Ionicons name="chevron-forward" size={16} color="#99A0AE" style={{ marginLeft: 4.4, marginRight: 9 }} />
        </Pressable>

        <Rule style={[styles.rule, { marginTop: 15.3 }]} />

        {/* Resumen */}
        <Text style={styles.section}>Resumen de pago</Text>
        <PriceBreakdown card subtotal={p.totals.subtotal} deliveryFee={p.totals.deliveryFee} serviceFee={p.totals.serviceFee} discount={p.totals.discount} total={p.totals.total}
          sizes={{ label: 12.1, value: 11.8, row: 25.6, total: 14.6, totalValue: 14.5, gap: 9 }} style={styles.summary} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 7.7, 14) }]}>
        <PillButton title={`Continuar · ${formatCOP(p.totals.total)}`} onPress={p.onContinue} height={52.2} textStyle={{ fontSize: 15, fontWeight: "700" }}
          right={<Ionicons name="chevron-forward" size={19} color={colors.white} style={{ marginRight: 21 }} />} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  navTitle: { fontSize: 16.1, lineHeight: 21, fontWeight: "700" },
  navSub: { fontSize: 13.1, lineHeight: 17, color: "#5A6580", marginTop: 1.3 },
  lineCard: { marginHorizontal: 13, height: 101.5, borderRadius: 16, borderWidth: 1, borderColor: "#E9EDF2", backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingLeft: 7.4, paddingRight: 7 },
  lineText: { flex: 1, marginLeft: 11.1, marginRight: 6, marginTop: 2 },
  lName: { fontSize: 13.2, lineHeight: 18, fontWeight: "600", color: colors.ink },
  lUnit: { fontSize: 11.5, lineHeight: 15, color: "#5D6880", marginTop: 1.5 },
  lPrice: { fontSize: 12.7, lineHeight: 17, fontWeight: "700", color: colors.ink, marginTop: 4 },
  trash: { marginLeft: 12, marginRight: 1.3, marginTop: 2, width: 20, alignItems: "center" },
  softBox: { marginHorizontal: 13.4, marginTop: 12.6, borderRadius: 16, backgroundColor: SOFT, paddingHorizontal: 12.4, paddingVertical: 14.5 },
  softRow: { flexDirection: "row", alignItems: "center", minHeight: 43 },
  subsTitle: { fontSize: 13.15, lineHeight: 18, fontWeight: "600", color: colors.ink },
  subsText: { fontSize: 11.5, lineHeight: 17, color: "#59647D", marginTop: 1.5 },
  subsOpt: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingLeft: 50 },
  subsOptText: { fontSize: 13, lineHeight: 18, color: colors.ink, marginLeft: 10 },
  rule: { marginHorizontal: 17.1, backgroundColor: "#E3E8EE" },
  addrHead: { flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 16.2, marginTop: 20 },
  addrTitle: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: "700", color: colors.ink, marginLeft: 6.2, letterSpacing: -0.2 },
  link: { fontSize: 12, lineHeight: 17, fontWeight: "500", color: colors.blueLink, marginTop: 5.2 },
  addrCard: { marginLeft: 15.7, marginRight: 13.4, marginTop: 9.2, height: 74.4, borderRadius: 16, backgroundColor: SOFT, flexDirection: "row", alignItems: "center" },
  addrLabel: { fontSize: 12.7, lineHeight: 17, fontWeight: "600", color: colors.ink },
  addrLine: { fontSize: 11.15, lineHeight: 15.5, color: "#66708A", marginTop: 0.5 },
  addrEta: { fontSize: 11.55, lineHeight: 16, color: colors.ink },
  section: { fontSize: 15.6, lineHeight: 20, fontWeight: "700", color: colors.ink, letterSpacing: -0.2, paddingHorizontal: 18, marginTop: 20.3 },
  summary: { marginLeft: 14.3, marginRight: 13.4, marginTop: 9.5, paddingHorizontal: 15.7, paddingTop: 11.3, paddingBottom: 15.4 },
  footer: { paddingHorizontal: 14.8, paddingTop: 10, backgroundColor: colors.white },
});
