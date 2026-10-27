import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatDate } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Card, EmptyState } from "@/components/ui";
import { useCart } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/dialog";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useActiveCoupons, type CouponRow } from "@/features/customer";

function title(c: CouponRow): string {
  if (c.type === "percent") return `${c.value} % de descuento`;
  if (c.type === "fixed") return `${formatCOP(c.value)} de descuento`;
  return "Envío gratis";
}

/** Pantalla 19 · Agregar cupón. */
export default function Coupon() {
  const router = useRouter();
  const cart = useCart();
  const coupons = useActiveCoupons();
  const [code, setCode] = useState(cart.couponCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inCart = cart.lines.length > 0;

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
      if (!usable(c)) { setError("Este cupón es de otro comercio."); return; }
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
    <Screen footer={inCart ? <Button title="Volver al pedido" variant="outline" onPress={() => router.back()} /> : undefined}>
      <Header title="Agregar cupón" />
      <Input label="Código del cupón" value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="Escribe tu código" autoCapitalize="characters" autoCorrect={false} error={error} icon="pricetag-outline"
        right={<Button title="Aplicar" size="sm" full={false} loading={busy} onPress={() => apply(code)} />} containerStyle={{ marginTop: 8 }} />
      {cart.couponCode ? (
        <Card style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.greenSoft, borderColor: colors.greenSoft, marginBottom: 16 }}>
          <Ionicons name="checkmark-circle" size={20} color={colors.green} />
          <Text style={{ marginLeft: 10, flex: 1 }}>Cupón <Text variant="bodyStrong">{cart.couponCode}</Text> aplicado</Text>
          <Button title="Quitar" variant="ghost" size="sm" full={false} onPress={() => { cart.setCoupon(null); setCode(""); }} />
        </Card>
      ) : null}

      <Text variant="heading" style={{ marginTop: 8, marginBottom: 10 }}>Tus cupones</Text>
      {coupons.isLoading ? <ListSkeleton rows={2} height={56} /> : coupons.error ? <ErrorState error={coupons.error} onRetry={() => { void coupons.refetch(); }} /> : !coupons.data?.length ? (
        <EmptyState icon="pricetag-outline" title="No tienes cupones disponibles" body="Revisa las ofertas para descubrir promociones." actionTitle="Ver ofertas" onAction={() => router.push("/(customer)/offers" as never)} />
      ) : coupons.data.map((c) => {
        const ok = usable(c);
        return (
          <Card key={c.id} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", opacity: ok ? 1 : 0.5 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.blue, fontWeight: "800" }}>%</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyStrong">{title(c)} · {c.code}</Text>
              <Text variant="caption" tone="muted">{[c.description, c.min_order ? `Pedido mínimo ${formatCOP(c.min_order)}` : null, c.valid_to ? `Hasta ${formatDate(c.valid_to)}` : null].filter(Boolean).join(" · ")}</Text>
            </View>
            <Button title={cart.couponCode === c.code ? "Aplicado" : "Usar"} size="sm" variant={cart.couponCode === c.code ? "ghost" : "secondary"} full={false} disabled={!ok || cart.couponCode === c.code} onPress={() => apply(c.code)} />
          </Card>
        );
      })}
    </Screen>
  );
}
