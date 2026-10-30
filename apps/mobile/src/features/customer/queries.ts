import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useLocation } from "@/store/location";
import type { MerchantCategory, OrderStatus } from "@yava/shared";
import { DEFAULT_COORDS } from "./helpers";
import { ACTIVE_STATUSES, TRACKING_STATUSES } from "./types";
import { isAlcoholCategory } from "./ageGate";
import type {
  NearbyMerchant, MerchantPublic, ProductRow, ProductCategoryRow, OptionGroupRow, OptionRow, ProductDetail, AddressRow,
  PromotionRow, CouponRow, PaymentMethodRow, OrderSummaryRow, OrderItemRow, OrderEventRow, OrderMessageRow, NotificationRow,
  CourierRow, SupportCaseRow, SupportMessageRow, MerchantHourRow, SearchResult, Coverage,
} from "./types";

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Coordenadas efectivas: dirección activa → coords del GPS → centro de Puerto Colombia. */
export function useEffectiveCoords(): { lat: number; lng: number } {
  const address = useLocation((s) => s.address);
  const coords = useLocation((s) => s.coords);
  if (address?.lat != null && address.lng != null) return { lat: address.lat, lng: address.lng };
  if (coords) return coords;
  return DEFAULT_COORDS;
}

/* ---------------- Comercios ---------------- */
export function useNearbyMerchants(category: MerchantCategory | null, radiusKm = 15) {
  const { lat, lng } = useEffectiveCoords();
  return useQuery({
    queryKey: ["nearby-merchants", category, lat, lng, radiusKm],
    queryFn: async (): Promise<NearbyMerchant[]> => {
      const { data, error } = await supabase.rpc("nearby_merchants", { p_lat: lat, p_lng: lng, p_category: category ?? undefined, p_radius_km: radiusKm });
      throwIf(error);
      return (data ?? []) as NearbyMerchant[];
    },
  });
}

export function useMerchant(id: string | undefined) {
  return useQuery({
    queryKey: ["merchant", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<MerchantPublic | null> => {
      const { data, error } = await supabase.from("merchant_public").select("*").eq("id", id as string).maybeSingle();
      throwIf(error);
      return (data as MerchantPublic | null) ?? null;
    },
  });
}

export function useMerchantsByIds(ids: string[]) {
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["merchants-by-ids", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<MerchantPublic[]> => {
      const { data, error } = await supabase.from("merchant_public").select("*").in("id", ids);
      throwIf(error);
      return (data ?? []) as MerchantPublic[];
    },
  });
}

export function useMerchantHours(id: string | undefined) {
  return useQuery({
    queryKey: ["merchant-hours", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<MerchantHourRow[]> => {
      const { data, error } = await supabase.from("merchant_hours").select("*").eq("merchant_id", id as string);
      throwIf(error);
      return (data ?? []) as MerchantHourRow[];
    },
  });
}

export interface MerchantMenu {
  categories: ProductCategoryRow[];
  products: ProductRow[];
  /** ids de productos que tienen grupos de opciones (requieren pantalla de detalle). */
  withOptions: Set<string>;
}
export function useMerchantMenu(id: string | undefined) {
  return useQuery({
    queryKey: ["merchant-menu", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<MerchantMenu> => {
      const [cats, prods] = await Promise.all([
        supabase.from("product_categories").select("*").eq("merchant_id", id as string).order("sort"),
        supabase.from("products").select("*").eq("merchant_id", id as string).eq("status", "published").order("sort"),
      ]);
      throwIf(cats.error); throwIf(prods.error);
      const products = (prods.data ?? []) as ProductRow[];
      const ids = products.map((p) => p.id);
      let withOptions = new Set<string>();
      if (ids.length) {
        const { data } = await supabase.from("product_option_groups").select("product_id").in("product_id", ids);
        withOptions = new Set(((data ?? []) as { product_id: string }[]).map((g) => g.product_id));
      }
      return { categories: (cats.data ?? []) as ProductCategoryRow[], products, withOptions };
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ProductDetail | null> => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id as string).maybeSingle();
      throwIf(error);
      if (!data) return null;
      const product = data as ProductRow;
      const { data: groups, error: ge } = await supabase.from("product_option_groups").select("*").eq("product_id", product.id).order("sort");
      throwIf(ge);
      const groupRows = (groups ?? []) as OptionGroupRow[];
      let options: OptionRow[] = [];
      if (groupRows.length) {
        const { data: opts, error: oe } = await supabase.from("product_options").select("*").in("group_id", groupRows.map((g) => g.id)).order("sort");
        throwIf(oe);
        options = (opts ?? []) as OptionRow[];
      }
      return { ...product, groups: groupRows.map((g) => ({ ...g, options: options.filter((o) => o.group_id === g.id) })) };
    },
  });
}

/** Productos publicados por ids (para validar disponibilidad de la canasta). */
export function useProductsByIds(ids: string[]) {
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["products-by-ids", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<ProductRow[]> => {
      const { data, error } = await supabase.from("products").select("*").in("id", ids);
      throwIf(error);
      return (data ?? []) as ProductRow[];
    },
  });
}

export interface MerchantsProducts {
  products: ProductRow[];
  /** Categorías de esos comercios (para filtrar por `category_id` con los chips de Mercado / Farmacia). */
  categories: ProductCategoryRow[];
}
/** Productos destacados de varios comercios (Mercado / Farmacia "Lo esencial", Favoritos) + sus categorías. */
export function useProductsOfMerchants(merchantIds: string[], limit = 12) {
  const key = [...merchantIds].sort().join(",");
  return useQuery({
    queryKey: ["products-of-merchants", key, limit],
    enabled: merchantIds.length > 0,
    queryFn: async (): Promise<MerchantsProducts> => {
      const [prods, cats] = await Promise.all([
        // Desempate por nombre: varios comercios repiten `sort` y sin él el orden (y el corte del limit) sería al azar.
        supabase.from("products").select("*").in("merchant_id", merchantIds).eq("status", "published").order("sort").order("name").limit(limit),
        supabase.from("product_categories").select("*").in("merchant_id", merchantIds).order("sort"),
      ]);
      throwIf(prods.error); throwIf(cats.error);
      return { products: (prods.data ?? []) as ProductRow[], categories: (cats.data ?? []) as ProductCategoryRow[] };
    },
  });
}

export function useSearch(q: string) {
  const cityId = useLocation((s) => s.cityId);
  const term = q.trim();
  return useQuery({
    queryKey: ["search", term, cityId],
    enabled: term.length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc("search_catalog", { p_q: term, p_city: cityId ?? undefined });
      throwIf(error);
      return (data ?? []) as SearchResult[];
    },
  });
}

/* ---------------- Promociones y cupones ---------------- */
function inWindow(p: PromotionRow, now: number): boolean {
  return (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() >= now);
}

/** Promociones propias de YAVA (banner de 08, Ofertas 33). Las pautas pagadas (`sponsored`) van aparte. */
export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async (): Promise<PromotionRow[]> => {
      const { data, error } = await supabase.from("promotions").select("*").eq("active", true).eq("sponsored", false).order("sort");
      throwIf(error);
      const now = Date.now();
      return ((data ?? []) as PromotionRow[]).filter((p) => inWindow(p, now));
    },
  });
}

/** Pautas pagadas por los restaurantes (carrusel "Promociones" del Inicio), vigentes y en orden de `sort`. */
export function useSponsoredPromotions() {
  return useQuery({
    queryKey: ["promotions", "sponsored"],
    queryFn: async (): Promise<PromotionRow[]> => {
      const { data, error } = await supabase.from("promotions").select("*").eq("active", true).eq("sponsored", true).order("sort");
      throwIf(error);
      const now = Date.now();
      return ((data ?? []) as PromotionRow[]).filter((p) => inWindow(p, now));
    },
  });
}

/** Producto de licor de una tienda cercana, con la tienda (para la ficha "logo · nombre · tiempo"). */
export interface NearbyDrink {
  product: ProductRow;
  store: NearbyMerchant;
  /** Tiene grupos de opciones: "+" abre el detalle en vez de agregar directo. */
  hasOptions: boolean;
}

/** Descuento en fracción (0,15 = 15 %) según `compare_at_price`; 0 si no tiene precio anterior. */
export function discountOf(p: Pick<ProductRow, "price" | "compare_at_price">): number {
  const before = p.compare_at_price;
  return before && before > p.price ? (before - p.price) / before : 0;
}

/**
 * "Cervezas y licores" del Inicio: productos publicados de las categorías de licor de las tiendas de mercado
 * cercanas, primero los de mayor descuento y luego los más baratos. Las tiendas cerradas quedan al final.
 */
export function useNearbyDrinks(limit = 10) {
  const stores = useNearbyMerchants("market");
  const ids = useMemo(() => (stores.data ?? []).map((m) => m.id), [stores.data]);
  const key = [...ids].sort().join(",");
  const products = useQuery({
    queryKey: ["nearby-drinks", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<{ products: ProductRow[]; withOptions: Set<string> }> => {
      const { data: cats, error: ce } = await supabase.from("product_categories").select("id,name,is_alcohol").in("merchant_id", ids);
      throwIf(ce);
      const catIds = ((cats ?? []) as { id: string; name: string; is_alcohol: boolean | null }[]).filter(isAlcoholCategory).map((c) => c.id);
      if (!catIds.length) return { products: [], withOptions: new Set() };
      const { data, error } = await supabase.from("products").select("*").in("category_id", catIds).eq("status", "published");
      throwIf(error);
      const rows = (data ?? []) as ProductRow[];
      let withOptions = new Set<string>();
      if (rows.length) {
        const { data: groups } = await supabase.from("product_option_groups").select("product_id").in("product_id", rows.map((p) => p.id));
        withOptions = new Set(((groups ?? []) as { product_id: string }[]).map((g) => g.product_id));
      }
      return { products: rows, withOptions };
    },
  });
  // La tienda se junta aquí (no en la consulta) para que "abierta/cerrada" y el tiempo sigan a `nearby_merchants`.
  const data = useMemo<NearbyDrink[] | undefined>(() => {
    if (!products.data) return undefined;
    const byId = new Map((stores.data ?? []).map((m) => [m.id, m]));
    const opts = products.data.withOptions;
    return products.data.products
      .flatMap((product) => { const store = byId.get(product.merchant_id); return store ? [{ product, store, hasOptions: opts.has(product.id) }] : []; })
      .sort((a, b) => Number(b.store.is_open) - Number(a.store.is_open)
        || discountOf(b.product) - discountOf(a.product)
        || a.product.price - b.product.price
        || a.product.name.localeCompare(b.product.name, "es"))
      .slice(0, limit);
  }, [products.data, stores.data, limit]);
  return {
    data,
    isLoading: stores.isLoading || (ids.length > 0 && products.isLoading),
    error: stores.error ?? products.error,
    refetch: async () => { await stores.refetch(); await products.refetch(); },
  };
}

export function useActiveCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async (): Promise<CouponRow[]> => {
      const { data, error } = await supabase.from("coupons").select("*").eq("active", true).order("created_at");
      throwIf(error);
      const now = Date.now();
      return ((data ?? []) as CouponRow[]).filter((c) => (!c.valid_from || new Date(c.valid_from).getTime() <= now) && (!c.valid_to || new Date(c.valid_to).getTime() >= now) && (c.max_uses == null || c.uses < c.max_uses));
    },
  });
}

export function useCoupon(code: string | null) {
  const upper = code?.trim().toUpperCase() ?? null;
  return useQuery({
    queryKey: ["coupon", upper],
    enabled: Boolean(upper),
    queryFn: async (): Promise<CouponRow | null> => {
      const { data, error } = await supabase.from("coupons").select("*").ilike("code", upper as string).eq("active", true).maybeSingle();
      throwIf(error);
      return (data as CouponRow | null) ?? null;
    },
  });
}

/* ---------------- Favoritos ---------------- */
export function useFavoriteIds() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["favorites", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<string[]> => {
      // En el orden en que se guardaron (el primero arriba en 34).
      const { data, error } = await supabase.from("favorites").select("merchant_id").eq("user_id", uid as string).order("created_at");
      throwIf(error);
      return ((data ?? []) as { merchant_id: string }[]).map((f) => f.merchant_id);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const uid = useAuth((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ merchantId, isFavorite }: { merchantId: string; isFavorite: boolean }) => {
      if (!uid) throw new Error("Inicia sesión para guardar favoritos");
      if (isFavorite) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", uid).eq("merchant_id", merchantId);
        throwIf(error);
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: uid, merchant_id: merchantId });
        throwIf(error);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

/* ---------------- Direcciones y cobertura ---------------- */
export function useAddresses() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["addresses", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<AddressRow[]> => {
      const { data, error } = await supabase.from("addresses").select("*").eq("user_id", uid as string).order("is_default", { ascending: false }).order("created_at");
      throwIf(error);
      return (data ?? []) as AddressRow[];
    },
  });
}

export function useAddress(id: string | undefined) {
  return useQuery({
    queryKey: ["address", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AddressRow | null> => {
      const { data, error } = await supabase.from("addresses").select("*").eq("id", id as string).maybeSingle();
      throwIf(error);
      return (data as AddressRow | null) ?? null;
    },
  });
}

export async function fetchCoverage(lat: number, lng: number): Promise<Coverage | null> {
  const { data, error } = await supabase.rpc("coverage_for", { p_lat: lat, p_lng: lng });
  throwIf(error);
  const rows = (data ?? []) as Coverage[];
  return rows[0] ?? null;
}

export function useCoverage(lat: number | null | undefined, lng: number | null | undefined) {
  return useQuery({
    queryKey: ["coverage", lat, lng],
    enabled: lat != null && lng != null,
    queryFn: () => fetchCoverage(lat as number, lng as number),
  });
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<{ id: string; name: string; center_lat: number | null; center_lng: number | null }[]> => {
      const { data, error } = await supabase.from("cities").select("id,name,center_lat,center_lng").eq("active", true).order("name");
      throwIf(error);
      return (data ?? []) as { id: string; name: string; center_lat: number | null; center_lng: number | null }[];
    },
  });
}

/* ---------------- Métodos de pago ---------------- */
export function usePaymentMethods() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["payment-methods", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<PaymentMethodRow[]> => {
      const { data, error } = await supabase.from("payment_methods").select("*").eq("user_id", uid as string).order("is_default", { ascending: false }).order("created_at");
      throwIf(error);
      return (data ?? []) as PaymentMethodRow[];
    },
  });
}

/* ---------------- Pedidos ---------------- */
export function useMyOrders() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["orders", "mine", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<OrderSummaryRow[]> => {
      const { data, error } = await supabase.from("order_summary").select("*").eq("customer_id", uid as string).order("placed_at", { ascending: false }).limit(100);
      throwIf(error);
      return (data ?? []) as OrderSummaryRow[];
    },
  });
}

export function splitOrders(list: OrderSummaryRow[]): { active: OrderSummaryRow[]; past: OrderSummaryRow[] } {
  const active = list.filter((o) => o.status && ACTIVE_STATUSES.includes(o.status));
  const past = list.filter((o) => !o.status || !ACTIVE_STATUSES.includes(o.status));
  return { active, past };
}

export function useOrder(id: string | undefined, opts?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["order", id],
    enabled: Boolean(id),
    refetchInterval: opts?.refetchInterval,
    queryFn: async (): Promise<OrderSummaryRow | null> => {
      const { data, error } = await supabase.from("order_summary").select("*").eq("id", id as string).maybeSingle();
      throwIf(error);
      return (data as OrderSummaryRow | null) ?? null;
    },
  });
}

export function useOrderItems(id: string | undefined) {
  return useQuery({
    queryKey: ["order-items", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<OrderItemRow[]> => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id as string);
      throwIf(error);
      return (data ?? []) as OrderItemRow[];
    },
  });
}

export function useOrderEvents(id: string | undefined) {
  return useQuery({
    queryKey: ["order-events", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<OrderEventRow[]> => {
      const { data, error } = await supabase.from("order_events").select("*").eq("order_id", id as string).order("created_at");
      throwIf(error);
      return (data ?? []) as OrderEventRow[];
    },
  });
}

export function useOrderMessages(id: string | undefined) {
  return useQuery({
    queryKey: ["order-messages", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<OrderMessageRow[]> => {
      const { data, error } = await supabase.from("order_messages").select("*").eq("order_id", id as string).order("created_at");
      throwIf(error);
      return (data ?? []) as OrderMessageRow[];
    },
  });
}

/** Ubicación y datos del repartidor asignado (RLS lo permite mientras el pedido va en camino). */
export function useCourier(courierId: string | null | undefined, status: OrderStatus | null | undefined) {
  const tracking = Boolean(status && TRACKING_STATUSES.includes(status));
  return useQuery({
    queryKey: ["courier", courierId],
    enabled: Boolean(courierId),
    refetchInterval: tracking ? 10_000 : false,
    queryFn: async (): Promise<CourierRow | null> => {
      const { data, error } = await supabase.from("couriers").select("*").eq("user_id", courierId as string).maybeSingle();
      throwIf(error);
      return (data as CourierRow | null) ?? null;
    },
  });
}

export function useMyRating(orderId: string | undefined) {
  return useQuery({
    queryKey: ["rating", orderId],
    enabled: Boolean(orderId),
    queryFn: async (): Promise<{ id: string } | null> => {
      const { data, error } = await supabase.from("ratings").select("id").eq("order_id", orderId as string).maybeSingle();
      throwIf(error);
      return (data as { id: string } | null) ?? null;
    },
  });
}

/* ---------------- Notificaciones ---------------- */
export function useNotifications() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["notifications", uid],
    enabled: Boolean(uid),
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", uid as string).order("created_at", { ascending: false }).limit(100);
      throwIf(error);
      return (data ?? []) as NotificationRow[];
    },
  });
}

/* ---------------- Soporte ---------------- */
export function useSupportPhone() {
  return useQuery({
    queryKey: ["platform-settings", "support_phone"],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.from("platform_settings").select("value").eq("key", "support_phone").maybeSingle();
      throwIf(error);
      const v = (data as { value: unknown } | null)?.value;
      return typeof v === "string" ? v : null;
    },
  });
}

export function useShipmentFees() {
  return useQuery({
    queryKey: ["platform-settings", "fees"],
    queryFn: async (): Promise<{ shipment: number; service: number }> => {
      const { data, error } = await supabase.from("platform_settings").select("key,value").in("key", ["shipment_base_fee", "service_fee"]);
      throwIf(error);
      const rows = (data ?? []) as { key: string; value: unknown }[];
      const num = (k: string, d: number) => { const v = rows.find((r) => r.key === k)?.value; return typeof v === "number" ? v : typeof v === "string" ? Number(v) || d : d; };
      return { shipment: num("shipment_base_fee", 8000), service: num("service_fee", 1000) };
    },
  });
}

export function useMyOpenSupportCase(orderId: string | null) {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["support-case", uid, orderId],
    enabled: Boolean(uid),
    queryFn: async (): Promise<SupportCaseRow | null> => {
      let q = supabase.from("support_cases").select("*").eq("opened_by", uid as string).in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(1);
      if (orderId) q = q.eq("order_id", orderId);
      const { data, error } = await q;
      throwIf(error);
      const rows = (data ?? []) as SupportCaseRow[];
      return rows[0] ?? null;
    },
  });
}

export function useSupportMessages(caseId: string | undefined) {
  return useQuery({
    queryKey: ["support-messages", caseId],
    enabled: Boolean(caseId),
    queryFn: async (): Promise<SupportMessageRow[]> => {
      const { data, error } = await supabase.from("support_messages").select("*").eq("case_id", caseId as string).order("created_at");
      throwIf(error);
      return (data ?? []) as SupportMessageRow[];
    },
  });
}
