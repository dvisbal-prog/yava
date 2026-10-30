import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatDate } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { useCart } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { designImages } from "@/lib/design-images";
import { ErrorState } from "@/components/customer";
import { NavBar, PillButton } from "@/components/customer/cart/parts";
import { NO_OUTLINE } from "@/components/customer/cart/FormField";
import { useActiveCoupons, useMerchantsByIds, type CouponRow } from "@/features/customer";

function title(c: CouponRow): string {
  if (c.type === "percent") return `${c.value} % de descuento`;
  if (c.type === "fixed") return `${formatCOP(c.value)} de descuento`;
  return "Envío gratis";
}

/**
 * Pantalla 19 · Agregar cupón (tanda-03/19-cupon.png): flecha ←, "Agregar cupón", campo con "Aplicar" adentro,
 * "Tus cupones" (lista o estado vacío con la ilustración del diseño) y "Volver al pedido".
 */
export default function Coupon() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const coupons = useActiveCoupons();
  // Cupones que paga un comercio (BOCAMAR5…): se marca "Solo en Bocamar" para que no parezcan de cualquier pedido.
  const couponMerchantIds = useMemo(() => Array.from(new Set((coupons.data ?? []).map((c) => c.merchant_id).filter((x): x is string => Boolean(x)))), [coupons.data]);
  const couponMerchants = useMerchantsByIds(couponMerchantIds);
  const merchantName = (id: string | null) => (id ? couponMerchants.data?.find((m) => m.id === id)?.name ?? null : null);
  const [code, setCode] = useState(cart.couponCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const inCart = cart.lines.length > 0;
  const canApply = code.trim().length > 0 && !busy;

  function usable(c: CouponRow): boolean {
    if (c.merchant_id && cart.merchant && c.merchant_id !== cart.merchant.id) return false;
    return true;
  }

  async function apply(raw: string) {
    const upper = raw.trim().toUpperCase();
    if (!upper) { setError("Escribe un código."); return; }
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.from("coupons").select("*").ilike("code", upper).eq("active", true).maybeSingle();
      if (e) throw e;
      const c = data as CouponRow | null;
      const now = Date.now();
      if (!c || (c.valid_to && new Date(c.valid_to).getTime() < now) || (c.valid_from && new Date(c.valid_from).getTime() > now) || (c.max_uses != null && c.uses >= c.max_uses)) {
        setError("Cupón no válido o vencido."); return;
      }
      if (!usable(c)) { setError(merchantName(c.merchant_id) ? `Este cupón es solo para pedidos en ${merchantName(c.merchant_id)}.` : "Este cupón es de otro comercio."); return; }
      if (inCart && cart.subtotal() < c.min_order) { setError(`Este cupón aplica para pedidos desde ${formatCOP(c.min_order)}.`); return; }
      cart.setCoupon(c.code);
      if (inCart) router.back();
      else notify("Cupón guardado", `${c.code} se aplicará en tu próximo pedido.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="arrow" height={43} backLeft={20.3} backTop={3.9} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.h1} accessibilityRole="header">Agregar cupón</Text>
        <Text style={styles.label}>Código del cupón</Text>
        <View style={[styles.field, focused && styles.fieldFocus, error ? styles.fieldError : null]}>
          <TextInput value={code} onChangeText={(t) => { setCode(t.toUpperCase()); if (error) setError(null); }} placeholder="Escribe tu código" placeholderTextColor="#959EB2"
            autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => { if (canApply) void apply(code); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} selectionColor={colors.blueText}
            style={[styles.input, NO_OUTLINE]} accessibilityLabel="Código del cupón" />
          <Pressable onPress={() => apply(code)} disabled={!canApply} accessibilityRole="button" accessibilityState={{ disabled: !canApply }}
            style={({ pressed }) => [styles.apply, canApply ? { backgroundColor: pressed ? colors.blueDark : colors.blue } : null]}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.applyText, canApply && { color: colors.white }]}>Aplicar</Text>}
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {cart.couponCode ? (
          <View style={styles.applied}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.appliedText}>Cupón <Text style={{ fontWeight: "700" }}>{cart.couponCode}</Text> aplicado</Text>
            <Pressable onPress={() => { cart.setCoupon(null); setCode(""); }} hitSlop={8} accessibilityRole="button">
              <Text style={styles.remove}>Quitar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.rule} />
        <Text style={styles.section}>Tus cupones</Text>

        {coupons.isLoading ? (
          <View style={{ marginHorizontal: 19, marginTop: 14, gap: 10 }}>
            <Skeleton height={72} style={{ borderRadius: 16 }} />
            <Skeleton height={72} style={{ borderRadius: 16 }} />
          </View>
        ) : coupons.error ? (
          <ErrorState error={coupons.error} onRetry={() => { void coupons.refetch(); }} />
        ) : !coupons.data?.length ? (
          <View style={styles.empty}>
            <Image source={designImages.vacioCupones} style={styles.emptyArt} contentFit="contain" />
            <Text style={styles.emptyTitle}>No tienes cupones disponibles</Text>
            <Text style={styles.emptyBody}>Revisa las ofertas para descubrir{"\n"}promociones.</Text>
            <Pressable onPress={() => router.push("/(customer)/offers" as never)} hitSlop={10} accessibilityRole="button" style={styles.emptyLink}>
              <Text style={styles.link}>Ver ofertas</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.blueLink} style={{ marginLeft: 3, marginTop: 1 }} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginHorizontal: 19, marginTop: 14, gap: 10 }}>
            {coupons.data.map((c) => {
              const ok = usable(c);
              const applied = cart.couponCode === c.code;
              return (
                <View key={c.id} style={[styles.card, applied && styles.cardOn, !ok && { opacity: 0.5 }]}>
                  <View style={styles.cardIcon}><Ionicons name="ticket-outline" size={20} color={colors.blue} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{c.code}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>{c.description || title(c)}</Text>
                    {/* Mínimo y vigencia en líneas separadas: en una sola se cortaba la fecha ("Hasta 21 de en…"). */}
                    {c.min_order ? <Text style={styles.cardSub} numberOfLines={1}>{`Mínimo ${formatCOP(c.min_order)}`}</Text> : null}
                    {merchantName(c.merchant_id) ? <Text style={styles.cardSub} numberOfLines={1}>{`Solo en ${merchantName(c.merchant_id)}`}</Text> : null}
                    {c.valid_to ? <Text style={styles.cardSub} numberOfLines={1}>{`Hasta ${formatDate(c.valid_to)}`}</Text> : null}
                  </View>
                  <Pressable onPress={() => apply(c.code)} disabled={!ok || applied || busy} accessibilityRole="button" style={[styles.use, applied && styles.useOn]}>
                    <Text style={[styles.useText, applied && { color: colors.green }]}>{applied ? "Aplicado" : "Usar"}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {inCart ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 8.6, 14) }]}>
          <PillButton title="Volver al pedido" onPress={() => router.back()} tone="soft" height={55.1} textStyle={{ fontSize: 15.8, color: colors.blueLink }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  h1: { fontSize: 24.5, lineHeight: 30, fontWeight: "700", color: colors.ink, letterSpacing: -0.4, marginLeft: 19, marginTop: 0.6 },
  label: { fontSize: 13.6, lineHeight: 18, fontWeight: "400", color: "#6A7489", marginLeft: 19.5, marginTop: 21.4 },
  field: { flexDirection: "row", alignItems: "center", marginHorizontal: 19, marginTop: 7, height: 58.8, borderRadius: 13, borderWidth: 1, borderColor: "#D9DDE5", backgroundColor: colors.white, paddingLeft: 19.5, paddingRight: 6 },
  fieldFocus: { borderWidth: 2, borderColor: colors.blueText, paddingLeft: 18.5, paddingRight: 5 },
  fieldError: { borderColor: colors.red },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 16.4, color: colors.ink },
  apply: { width: 88, height: 43, borderRadius: 12, backgroundColor: "#E9ECEF", alignItems: "center", justifyContent: "center" },
  applyText: { fontSize: 14.1, lineHeight: 19, fontWeight: "600", color: "#9AA1B0" },
  error: { fontSize: 12.5, lineHeight: 17, color: colors.red, marginHorizontal: 19.5, marginTop: 6 },
  applied: { flexDirection: "row", alignItems: "center", marginHorizontal: 19, marginTop: 14, borderRadius: 14, backgroundColor: colors.greenSoft, paddingHorizontal: 14, paddingVertical: 11 },
  appliedText: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink, marginLeft: 10 },
  remove: { fontSize: 14, lineHeight: 19, fontWeight: "600", color: colors.blueLink },
  rule: { height: 1, backgroundColor: colors.divider, marginHorizontal: 19, marginTop: 25.8 },
  section: { fontSize: 20.8, lineHeight: 26, fontWeight: "700", color: colors.ink, letterSpacing: -0.3, marginLeft: 19.5, marginTop: 23.1 },
  empty: { alignItems: "center" },
  emptyArt: { width: 125.9, height: 121.3, marginTop: 29, transform: [{ translateX: 7.6 }] },
  emptyTitle: { fontSize: 14.2, lineHeight: 19, fontWeight: "600", color: colors.ink, textAlign: "center", marginTop: 9.1 },
  emptyBody: { fontSize: 13, lineHeight: 16, color: "#727C91", textAlign: "center", marginTop: 7.5 },
  emptyLink: { flexDirection: "row", alignItems: "center", marginTop: 19 },
  link: { fontSize: 13.4, lineHeight: 18, fontWeight: "600", color: colors.blueLink },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, paddingHorizontal: 13, paddingVertical: 12 },
  cardOn: { borderColor: colors.green, backgroundColor: "#F4FBF7" },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, lineHeight: 19, fontWeight: "600", color: colors.ink },
  cardDesc: { fontSize: 13, lineHeight: 17, color: colors.ink, marginTop: 1 },
  cardSub: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, marginTop: 1 },
  use: { height: 30, minWidth: 66, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: colors.blueText, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  useOn: { borderColor: "transparent" },
  useText: { fontSize: 13, lineHeight: 17, fontWeight: "600", color: colors.blueText },
  footer: { paddingHorizontal: 15.3, paddingTop: 10, backgroundColor: colors.white },
});
