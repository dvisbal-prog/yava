import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatDate } from "@yava/shared";
import type { MerchantCategory } from "@yava/shared";
import { Screen, Text, Chip, Card, Button, EmptyState } from "@/components/ui";
import { useCart } from "@/store/cart";
import { AddressHeader, SectionHeader, ErrorState, CardsSkeleton, ListSkeleton } from "@/components/customer";
import { usePromotions, useActiveCoupons, useMerchantsByIds, type CouponRow } from "@/features/customer";
import { notify } from "@/lib/dialog";

type Filter = "all" | MerchantCategory;

function couponTitle(c: CouponRow): string {
  if (c.type === "percent") return `${c.value} % de descuento`;
  if (c.type === "fixed") return `${formatCOP(c.value)} de descuento`;
  return "Envío gratis";
}

/** Pantalla 33 · Ofertas (promociones + cupones). */
export default function Offers() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const promos = usePromotions();
  const coupons = useActiveCoupons();
  const merchantIds = useMemo(() => Array.from(new Set((promos.data ?? []).map((p) => p.merchant_id).filter((x): x is string => Boolean(x)))), [promos.data]);
  const merchants = useMerchantsByIds(merchantIds);
  const setCoupon = useCart((s) => s.setCoupon);
  const cartLines = useCart((s) => s.lines);

  const visible = useMemo(() => {
    const list = promos.data ?? [];
    if (filter === "all") return list;
    return list.filter((p) => merchants.data?.find((m) => m.id === p.merchant_id)?.category === filter);
  }, [promos.data, merchants.data, filter]);

  async function applyCoupon(c: CouponRow) {
    await Clipboard.setStringAsync(c.code);
    if (cartLines.length) {
      setCoupon(c.code);
      notify("Cupón aplicado", `${c.code} se aplicará al pagar tu canasta.`);
    } else {
      notify("Código copiado", `Usa ${c.code} al revisar tu pedido.`);
    }
  }

  return (
    <Screen padded={false} refreshing={promos.isRefetching} onRefresh={() => { void promos.refetch(); void coupons.refetch(); }}>
      <AddressHeader searchPlaceholder="Busca una oferta" onSearch={() => router.push("/(customer)/search" as never)} />
      <View style={{ paddingHorizontal: 16 }}>
        <Text variant="display">Ofertas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 16 }}>
          {([["all", "Todas"], ["food", "Comida"], ["market", "Mercado"], ["pharmacy", "Farmacia"]] as [Filter, string][]).map(([k, l]) => (
            <Chip key={k} label={l} selected={filter === k} onPress={() => setFilter(k)} />
          ))}
        </ScrollView>

        {promos.isLoading ? <CardsSkeleton count={1} width={320} /> : promos.error ? <ErrorState error={promos.error} onRetry={() => { void promos.refetch(); }} compact /> : !visible.length ? (
          <EmptyState icon="pricetag-outline" title="No hay promociones por ahora" body="Vuelve pronto: publicamos ofertas nuevas cada semana." />
        ) : visible.map((p) => {
          const m = merchants.data?.find((x) => x.id === p.merchant_id);
          return (
            <Pressable key={p.id} onPress={() => (p.merchant_id ? router.push(`/(customer)/merchant/${p.merchant_id}` as never) : undefined)} style={({ pressed }) => [styles.promo, { opacity: pressed ? 0.92 : 1 }]}>
              <Image source={{ uri: p.image_url ?? undefined }} style={styles.promoImg} contentFit="cover" transition={150} />
              <View style={{ padding: 14 }}>
                {m ? <Text variant="small" tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>{m.name}</Text> : null}
                <Text variant="heading" style={{ marginTop: 2 }}>{p.title}</Text>
                {p.subtitle ? <Text tone="muted" style={{ marginTop: 2 }}>{p.subtitle}</Text> : null}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                  {p.coupon_code ? <View style={styles.code}><Text variant="small" style={{ fontWeight: "700", color: colors.carbon }}>{p.coupon_code}</Text></View> : null}
                  <View style={{ flex: 1 }} />
                  <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{p.merchant_id ? "Pedir ahora" : "Ver cupón"}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.blue} />
                </View>
              </View>
            </Pressable>
          );
        })}

        <SectionHeader title="Tus cupones" style={{ marginTop: 24 }} />
        {coupons.isLoading ? <ListSkeleton rows={2} height={56} /> : coupons.error ? <ErrorState error={coupons.error} onRetry={() => { void coupons.refetch(); }} compact /> : !coupons.data?.length ? (
          <Text tone="muted">No tienes cupones disponibles.</Text>
        ) : coupons.data.map((c) => (
          <Card key={c.id} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
            <View style={styles.pct}><Text style={{ color: colors.blue, fontWeight: "800" }}>%</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyStrong">{couponTitle(c)} · {c.code}</Text>
              <Text variant="caption" tone="muted">{c.description ?? ""}{c.min_order ? ` · Pedido mínimo ${formatCOP(c.min_order)}` : ""}{c.valid_to ? ` · Hasta ${formatDate(c.valid_to)}` : ""}</Text>
            </View>
            <Button title="Usar" size="sm" variant="secondary" full={false} onPress={() => applyCoupon(c)} />
          </Card>
        ))}
        <View style={{ height: 24 }} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  promo: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, overflow: "hidden", marginBottom: 14 },
  promoImg: { width: "100%", height: 140, backgroundColor: colors.gray100 },
  code: { backgroundColor: colors.yellowSoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  pct: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
});
