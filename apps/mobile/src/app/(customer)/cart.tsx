import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { computeTotals } from "@yava/shared";
import { useCart } from "@/store/cart";
import { isProductAvailable } from "@/components/customer";
import { useMerchant, useMerchantMenu, useProductsByIds, useRequireAuth, type ProductRow } from "@/features/customer";
import { notify } from "@/lib/dialog";
import { FoodCart } from "@/components/customer/cart/FoodCart";
import { StoreCart } from "@/components/customer/cart/StoreCart";
import { UnavailableCart } from "@/components/customer/cart/UnavailableCart";
import { EmptyCart } from "@/components/customer/cart/EmptyCart";
import { isStoreCart } from "@/components/customer/cart/helpers";
import type { CartMerchantView } from "@/components/customer/cart/types";

/**
 * Pantallas 15 (Tu canasta, comida), 28 (canasta de mercado/farmacia), 42 (canasta vacía) y
 * 44 (producto no disponible). La lógica vive aquí; cada variante visual está en `components/customer/cart/`.
 */
export default function Cart() {
  const router = useRouter();
  const cart = useCart();
  const requireAuth = useRequireAuth();
  const merchantId = cart.merchant?.id;
  const menu = useMerchantMenu(merchantId);
  const merchantInfo = useMerchant(merchantId);
  const ids = useMemo(() => Array.from(new Set(cart.lines.map((l) => l.product_id))), [cart.lines]);
  const fresh = useProductsByIds(ids);

  const products = useMemo(() => new Map<string, ProductRow>((fresh.data ?? []).map((p) => [p.id, p])), [fresh.data]);

  const unavailable = useMemo(() => {
    if (!fresh.data) return new Set<string>();
    const set = new Set<string>();
    for (const pid of ids) {
      const p = products.get(pid);
      if (!p || !isProductAvailable(p)) set.add(pid);
    }
    return set;
  }, [fresh.data, ids, products]);

  const suggestions = useMemo(() => (menu.data?.products ?? []).filter((p) => isProductAvailable(p) && !ids.includes(p.id)).slice(0, 8), [menu.data, ids]);
  // Envío + servicio estimados (pantallas 28/44). El cupón se aplica en "Finalizar pedido"; el servidor confirma el total.
  const totals = useMemo(() => computeTotals({ lines: cart.lines, deliveryFee: cart.merchant?.delivery_fee ?? 0 }), [cart.lines, cart.merchant?.delivery_fee]);

  function addSuggestion(p: ProductRow) {
    if (!cart.merchant) return;
    if (menu.data?.withOptions.has(p.id)) { router.push(`/(customer)/product/${p.id}` as never); return; }
    cart.addLine(cart.merchant, { product_id: p.id, name: p.name, unit_price: p.price, qty: 1, options: [] });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function setQty(index: number, qty: number) {
    cart.setQty(index, qty);
    void Haptics.selectionAsync();
  }

  function continueToCheckout() {
    if (unavailable.size) { notify("Revisa tu canasta", "Elimina o reemplaza los productos no disponibles para continuar."); return; }
    if (!requireAuth("/(customer)/checkout")) return;
    router.push("/(customer)/checkout" as never);
  }

  if (!cart.lines.length || !cart.merchant) {
    return (
      <EmptyCart
        onExplore={() => router.replace("/(customer)/restaurants?category=food" as never)}
        onHome={() => router.replace("/(customer)" as never)}
      />
    );
  }

  const info = merchantInfo.data;
  const merchant: CartMerchantView = {
    ...cart.merchant,
    tagline: info?.tagline ?? null,
    slug: info?.slug ?? null,
    cover_url: info?.cover_url ?? null,
    logo_url: info?.logo_url ?? null,
  };
  const view = {
    merchant, lines: cart.lines, products, unavailable, suggestions, totals,
    notes: cart.notes, onNotes: cart.setNotes, onQty: setQty, onAddSuggestion: addSuggestion,
    onOpenProduct: (id: string) => router.push(`/(customer)/product/${id}` as never),
    onAddMore: () => router.push(`/(customer)/merchant/${merchant.id}` as never),
    onContinue: continueToCheckout,
  };

  if (unavailable.size) return <UnavailableCart {...view} />;
  if (isStoreCart(merchant.category)) return <StoreCart {...view} />;
  return <FoodCart {...view} />;
}
