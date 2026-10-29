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

  const freshById = useMemo(() => new Map<string, ProductRow>((fresh.data ?? []).map((p) => [p.id, p])), [fresh.data]);
  // Para las vistas: lo fresco y, mientras llega, la fila del menú (ya en caché si se viene de la tienda). Así
  // "Te puede gustar" conoce la categoría de cada línea desde el primer render y no cambia de tarjetas al cargar.
  const products = useMemo(() => {
    const map = new Map<string, ProductRow>();
    for (const p of menu.data?.products ?? []) if (ids.includes(p.id)) map.set(p.id, p);
    for (const [id, p] of freshById) map.set(id, p);
    return map;
  }, [menu.data, ids, freshById]);

  const unavailable = useMemo(() => {
    if (!fresh.data) return new Set<string>();
    const set = new Set<string>();
    for (const pid of ids) {
      const p = freshById.get(pid);
      if (!p || !isProductAvailable(p)) set.add(pid);
    }
    return set;
  }, [fresh.data, ids, freshById]);

  // Sugerencias en el orden del menú: categoría (su `sort`), luego producto (`sort` y nombre). La consulta solo
  // ordena por el `sort` del producto, que se repite entre categorías. Sin recortar aquí: cada vista elige por
  // categoría y se queda con dos (si se cortara antes, un menú con muchos platos dejaría fuera bebidas y acompañantes).
  const suggestions = useMemo(() => {
    const catSort = new Map((menu.data?.categories ?? []).map((c) => [c.id, c.sort]));
    const cs = (p: ProductRow) => catSort.get(p.category_id ?? "") ?? Number.MAX_SAFE_INTEGER;
    return (menu.data?.products ?? [])
      .filter((p) => isProductAvailable(p) && !ids.includes(p.id))
      .sort((a, b) => cs(a) - cs(b) || a.sort - b.sort || a.name.localeCompare(b.name, "es"));
  }, [menu.data, ids]);
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
