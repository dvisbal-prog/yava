import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import type { OrderSummaryRow, SettlementRow } from "@/features/merchant/types";
import type { AdminOverview, OwnerAlertRow, RangeKey } from "./types";
import { EMPTY_OVERVIEW, rangeFrom } from "./types";

export function useAdminOverview(range: RangeKey, cityId: string | null) {
  return useQuery({
    queryKey: ["admin-overview", range, cityId],
    refetchInterval: 60_000,
    queryFn: async (): Promise<AdminOverview> => {
      const { data, error } = await supabase.rpc("admin_overview", { p_from: rangeFrom(range), p_to: new Date().toISOString(), p_city: cityId });
      if (error) throw error;
      const d = (data ?? {}) as Partial<AdminOverview>;
      return { ...EMPTY_OVERVIEW, ...d, hourly: d.hourly ?? [], by_type: d.by_type ?? [], by_city: d.by_city ?? [] };
    },
  });
}

export function useOwnerAlerts(onlyPending = false) {
  return useQuery({
    queryKey: ["owner-alerts", onlyPending],
    refetchInterval: 60_000,
    queryFn: async (): Promise<OwnerAlertRow[]> => {
      let q = supabase.from("owner_alerts").select("*").order("created_at", { ascending: false }).limit(100);
      if (onlyPending) q = q.is("acknowledged_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OwnerAlertRow[];
    },
  });
}

export function useAcknowledgeAlert() {
  const uid = useAuth((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("owner_alerts").update({ acknowledged_by: uid, acknowledged_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-alerts"] }),
  });
}

/** Liquidaciones pendientes/aprobadas (solo lectura en móvil). */
export function usePendingSettlements() {
  return useQuery({
    queryKey: ["settlements", "pending"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<SettlementRow[]> => {
      const { data, error } = await supabase.from("settlements").select("*").in("status", ["pending", "approved"]).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as SettlementRow[];
    },
  });
}

/** Nombres de comercios para mostrar junto a liquidaciones. */
export function useMerchantNames(ids: string[]) {
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["merchant-names", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from("merchants").select("id,name").in("id", ids);
      if (error) throw error;
      const out: Record<string, string> = {};
      for (const r of (data ?? []) as { id: string; name: string }[]) out[r.id] = r.name;
      return out;
    },
  });
}

export function useProfileNames(ids: string[]) {
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["profile-names", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      if (error) throw error;
      const out: Record<string, string> = {};
      for (const r of (data ?? []) as { id: string; full_name: string | null }[]) out[r.id] = r.full_name ?? "Repartidor";
      return out;
    },
  });
}

export function useActiveOrders(cityId: string | null) {
  return useQuery({
    queryKey: ["orders", "active", cityId],
    refetchInterval: 15_000,
    queryFn: async (): Promise<OrderSummaryRow[]> => {
      let q = supabase.from("order_summary").select("*").in("status", ["placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way"]).order("placed_at", { ascending: false }).limit(100);
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OrderSummaryRow[];
    },
  });
}

export function useRecentOrders(cityId: string | null, limit = 30) {
  return useQuery({
    queryKey: ["orders", "recent", cityId, limit],
    refetchInterval: 30_000,
    queryFn: async (): Promise<OrderSummaryRow[]> => {
      let q = supabase.from("order_summary").select("*").order("placed_at", { ascending: false }).limit(limit);
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OrderSummaryRow[];
    },
  });
}

export interface OnlineCourier { user_id: string; current_lat: number | null; current_lng: number | null; last_seen_at: string | null; vehicle: string; name: string | null }

export function useOnlineCouriers(cityId: string | null) {
  return useQuery({
    queryKey: ["couriers", "online", cityId],
    refetchInterval: 20_000,
    queryFn: async (): Promise<OnlineCourier[]> => {
      let q = supabase.from("couriers").select("user_id,current_lat,current_lng,last_seen_at,vehicle").eq("is_online", true).limit(200);
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as Omit<OnlineCourier, "name">[];
      if (!rows.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", rows.map((r) => r.user_id));
      const names = new Map(((profiles ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));
      return rows.map((r) => ({ ...r, name: names.get(r.user_id) ?? null }));
    },
  });
}

export interface OpenMerchant { id: string; name: string; category: string; city_id: string | null; is_open: boolean; manual_closed: boolean }

export function useOpenMerchants(cityId: string | null) {
  return useQuery({
    queryKey: ["merchants", "open", cityId],
    refetchInterval: 60_000,
    queryFn: async (): Promise<OpenMerchant[]> => {
      let q = supabase.from("merchant_public").select("id,name,category,city_id,is_open,manual_closed").eq("status", "active").order("name").limit(300);
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OpenMerchant[];
    },
  });
}
