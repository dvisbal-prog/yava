import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import type { OrderStatus } from "@yava/shared";
import type {
  MerchantRow, OrderRow, OrderItemRow, OrderSummaryRow, ProductRow, ProductCategoryRow, OptionGroupRow, OptionRow,
  MerchantHoursRow, MerchantDocumentRow, SettlementRow, SettlementOrderRow, CityRow, MerchantDashboard,
} from "./types";
import { EMPTY_DASHBOARD, startOfToday } from "./types";

/** Comercio del usuario actual (miembro o dueño). */
export function useMyMerchant() {
  const uid = useAuth((s) => s.session?.user.id);
  const merchantId = useAuth((s) => s.merchantId);
  return useQuery({
    queryKey: ["merchant", "mine", merchantId ?? uid],
    enabled: !!uid,
    queryFn: async (): Promise<MerchantRow | null> => {
      let q = supabase.from("merchants").select("*");
      q = merchantId ? q.eq("id", merchantId) : q.eq("owner_id", uid ?? "");
      const { data, error } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data as MerchantRow | null) ?? null;
    },
  });
}

export function useMerchantDashboard(merchantId: string | undefined, from: string = startOfToday()) {
  return useQuery({
    queryKey: ["dashboard", "merchant", merchantId, from],
    enabled: !!merchantId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<MerchantDashboard> => {
      const { data, error } = await supabase.rpc("merchant_dashboard", { p_merchant: merchantId, p_from: from });
      if (error) throw error;
      const d = (data ?? {}) as Partial<MerchantDashboard>;
      return { ...EMPTY_DASHBOARD, ...d, week: Array.isArray(d.week) ? d.week : [] };
    },
  });
}

/** Pedidos del comercio (order_summary) por estados. */
export function useMerchantOrders(merchantId: string | undefined, statuses: OrderStatus[]) {
  return useQuery({
    queryKey: ["merchant-orders", merchantId, statuses.join(",")],
    enabled: !!merchantId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<OrderSummaryRow[]> => {
      const { data, error } = await supabase.from("order_summary").select("*").eq("merchant_id", merchantId).in("status", statuses).order("placed_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OrderSummaryRow[];
    },
  });
}

export function useOrderDetail(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<{ order: OrderSummaryRow; items: OrderItemRow[] }> => {
      const [{ data: order, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from("order_summary").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { order: order as OrderSummaryRow, items: (items ?? []) as OrderItemRow[] };
    },
  });
}

function invalidateOrders(orderId?: string) {
  queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  if (orderId) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
}

export function useMerchantSetStatus() {
  return useMutation({
    mutationFn: async ({ orderId, status, etaMin }: { orderId: string; status: "accepted" | "preparing" | "ready"; etaMin?: number }) => {
      const { data, error } = await supabase.rpc("merchant_set_order_status", { p_order_id: orderId, p_status: status, p_eta_min: etaMin ?? null });
      if (error) throw error;
      return data as OrderRow;
    },
    onSuccess: (_d, v) => invalidateOrders(v.orderId),
  });
}

export function useCancelOrder() {
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data, error } = await supabase.rpc("cancel_order", { p_order_id: orderId, p_reason: reason });
      if (error) throw error;
      return data as OrderRow;
    },
    onSuccess: (_d, v) => invalidateOrders(v.orderId),
  });
}

export function useToggleMerchantClosed() {
  return useMutation({
    mutationFn: async ({ merchantId, closed }: { merchantId: string; closed: boolean }) => {
      const { error } = await supabase.from("merchants").update({ manual_closed: closed }).eq("id", merchantId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant"] }),
  });
}

export function useUpdateMerchant() {
  return useMutation({
    mutationFn: async ({ merchantId, patch }: { merchantId: string; patch: Partial<MerchantRow> }) => {
      const { error } = await supabase.from("merchants").update(patch).eq("id", merchantId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant"] }),
  });
}

// ---------- Catálogo ----------
export function useProductCategories(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["product-categories", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<ProductCategoryRow[]> => {
      const { data, error } = await supabase.from("product_categories").select("*").eq("merchant_id", merchantId).order("sort");
      if (error) throw error;
      return (data ?? []) as ProductCategoryRow[];
    },
  });
}

export function useMerchantProducts(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["products", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<ProductRow[]> => {
      const { data, error } = await supabase.from("products").select("*").eq("merchant_id", merchantId).order("sort").order("name");
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });
}

export interface ProductFull {
  product: ProductRow;
  groups: (OptionGroupRow & { options: OptionRow[] })[];
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async (): Promise<ProductFull> => {
      const { data: product, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (error) throw error;
      const { data: groups, error: e2 } = await supabase.from("product_option_groups").select("*").eq("product_id", productId).order("sort");
      if (e2) throw e2;
      const gs = (groups ?? []) as OptionGroupRow[];
      const ids = gs.map((g) => g.id);
      let opts: OptionRow[] = [];
      if (ids.length) {
        const { data: o, error: e3 } = await supabase.from("product_options").select("*").in("group_id", ids).order("sort");
        if (e3) throw e3;
        opts = (o ?? []) as OptionRow[];
      }
      return { product: product as ProductRow, groups: gs.map((g) => ({ ...g, options: opts.filter((o) => o.group_id === g.id) })) };
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ productId, patch }: { productId: string; patch: Partial<ProductRow> }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", v.productId] });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ---------- Horarios ----------
export function useMerchantHours(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["merchant-hours", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantHoursRow[]> => {
      const { data, error } = await supabase.from("merchant_hours").select("*").eq("merchant_id", merchantId).order("weekday").order("opens");
      if (error) throw error;
      return (data ?? []) as MerchantHoursRow[];
    },
  });
}

// ---------- Documentos ----------
export function useMerchantDocuments(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["merchant-documents", merchantId],
    enabled: !!merchantId,
    refetchInterval: 20_000,
    queryFn: async (): Promise<MerchantDocumentRow[]> => {
      const { data, error } = await supabase.from("merchant_documents").select("*").eq("merchant_id", merchantId).order("created_at");
      if (error) throw error;
      return (data ?? []) as MerchantDocumentRow[];
    },
  });
}

// ---------- Liquidaciones ----------
export function useMerchantSettlements(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["settlements", "merchant", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<SettlementRow[]> => {
      const { data, error } = await supabase.from("settlements").select("*").eq("payee_type", "merchant").eq("payee_id", merchantId).order("period_end", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SettlementRow[];
    },
  });
}

export function useSettlementDetail(settlementId: string | undefined) {
  return useQuery({
    queryKey: ["settlement", settlementId],
    enabled: !!settlementId,
    queryFn: async (): Promise<{ settlement: SettlementRow; orders: (SettlementOrderRow & { order: OrderSummaryRow | null })[] }> => {
      const { data: s, error } = await supabase.from("settlements").select("*").eq("id", settlementId).single();
      if (error) throw error;
      const { data: so, error: e2 } = await supabase.from("settlement_orders").select("*").eq("settlement_id", settlementId);
      if (e2) throw e2;
      const rows = (so ?? []) as SettlementOrderRow[];
      let orders: OrderSummaryRow[] = [];
      if (rows.length) {
        const { data: o, error: e3 } = await supabase.from("order_summary").select("*").in("id", rows.map((r) => r.order_id));
        if (e3) throw e3;
        orders = (o ?? []) as OrderSummaryRow[];
      }
      return { settlement: s as SettlementRow, orders: rows.map((r) => ({ ...r, order: orders.find((o) => o.id === r.order_id) ?? null })) };
    },
  });
}

// ---------- Ciudades ----------
export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<CityRow[]> => {
      const { data, error } = await supabase.from("cities").select("*").eq("active", true).order("name");
      if (error) throw error;
      return (data ?? []) as CityRow[];
    },
  });
}

export function usePlatformSetting<T>(key: string, fallback: T) {
  return useQuery({
    queryKey: ["platform-setting", key],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<T> => {
      const { data, error } = await supabase.from("platform_settings").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      const row = data as { value: unknown } | null;
      return row ? (row.value as T) : fallback;
    },
  });
}
