import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import type { OrderRow, OrderSummaryRow, BankAccount } from "@/features/merchant/types";
import type { CourierRow, CourierDocumentRow, CourierWithdrawalRow, OrderMessageRow, CourierDashboard, AvailableOrder } from "./types";
import { EMPTY_COURIER_DASHBOARD } from "./types";

export function useMyCourier() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["courier", "me", uid],
    enabled: !!uid,
    queryFn: async (): Promise<CourierRow | null> => {
      const { data, error } = await supabase.from("couriers").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return (data as CourierRow | null) ?? null;
    },
  });
}

/** Suscripción realtime a la fila del repartidor (estado de revisión, saldo). */
export function useRealtimeCourier(uid: string | undefined) {
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`courier:${uid}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couriers", filter: `user_id=eq.${uid}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["courier"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);
}

export function useCourierDashboard() {
  return useQuery({
    queryKey: ["courier", "dashboard"],
    refetchInterval: 20_000,
    queryFn: async (): Promise<CourierDashboard> => {
      const { data, error } = await supabase.rpc("courier_dashboard");
      if (error) throw error;
      return { ...EMPTY_COURIER_DASHBOARD, ...((data ?? {}) as Partial<CourierDashboard>) };
    },
  });
}

export function useAvailableOrders(lat: number | null, lng: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["courier", "available", lat?.toFixed(3) ?? null, lng?.toFixed(3) ?? null],
    enabled,
    refetchInterval: 10_000,
    queryFn: async (): Promise<AvailableOrder[]> => {
      const { data, error } = await supabase.rpc("courier_available_orders", { p_lat: lat, p_lng: lng, p_radius_km: 12 });
      if (error) throw error;
      return (data ?? []) as AvailableOrder[];
    },
  });
}

export function useCourierOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderSummaryRow> => {
      const { data, error } = await supabase.from("order_summary").select("*").eq("id", orderId).single();
      if (error) throw error;
      return data as OrderSummaryRow;
    },
  });
}

export function useAvailableOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["courier", "offer", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<AvailableOrder | null> => {
      const { data, error } = await supabase.rpc("courier_available_orders", { p_lat: null, p_lng: null, p_radius_km: 1000 });
      if (error) throw error;
      const rows = (data ?? []) as AvailableOrder[];
      return rows.find((r) => r.id === orderId) ?? null;
    },
  });
}

export function useOrderItems(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-items", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      if (error) throw error;
      return (data ?? []) as import("@/features/merchant/types").OrderItemRow[];
    },
  });
}

function invalidateCourier(orderId?: string) {
  queryClient.invalidateQueries({ queryKey: ["courier"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  if (orderId) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
}

export function useAcceptOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("courier_accept_order", { p_order_id: orderId });
      if (error) throw error;
      return data as OrderRow;
    },
    onSuccess: (_d, id) => invalidateCourier(id),
  });
}

export function useCourierSetStatus() {
  return useMutation({
    mutationFn: async ({ orderId, status, code }: { orderId: string; status: "picked_up" | "on_the_way" | "delivered"; code?: string }) => {
      const { data, error } = await supabase.rpc("courier_set_order_status", { p_order_id: orderId, p_status: status, p_delivery_code: code ?? null });
      if (error) throw error;
      return data as OrderRow;
    },
    onSuccess: (_d, v) => invalidateCourier(v.orderId),
  });
}

/**
 * Conectar / desconectar al repartidor. Usa el RPC `courier_set_online` (la RLS ya no permite
 * UPDATE directo sobre `couriers`). El servidor rechaza `true` si la cuenta no está activa.
 */
export function useSetOnline() {
  return useMutation({
    mutationFn: async (online: boolean) => {
      const { error } = await supabase.rpc("courier_set_online", { p_online: online });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier"] }),
  });
}

/** Campos que el repartidor puede cambiar de su propia fila (vía `courier_update_settings`). */
export interface CourierSettingsPatch {
  vehicle?: CourierRow["vehicle"];
  plate?: string;
  bank_account?: BankAccount;
}

/**
 * Actualiza vehículo, placa o cuenta de retiro con el RPC `courier_update_settings`.
 * Solo se aplican los campos presentes; el resto queda igual en el servidor.
 */
export function useUpdateCourier() {
  return useMutation({
    mutationFn: async (patch: CourierSettingsPatch) => {
      const { error } = await supabase.rpc("courier_update_settings", {
        p_vehicle: patch.vehicle ?? null,
        p_plate: patch.plate ?? null,
        p_bank_account: patch.bank_account ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier"] }),
  });
}

export function useCourierDocuments() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["courier", "documents", uid],
    enabled: !!uid,
    queryFn: async (): Promise<CourierDocumentRow[]> => {
      const { data, error } = await supabase.from("courier_documents").select("*").eq("courier_id", uid).order("created_at");
      if (error) throw error;
      return (data ?? []) as CourierDocumentRow[];
    },
  });
}

/** Historial de entregas del repartidor (order_summary). */
export function useCourierHistory(limit = 100) {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["courier", "history", uid, limit],
    enabled: !!uid,
    queryFn: async (): Promise<OrderSummaryRow[]> => {
      const { data, error } = await supabase.from("order_summary").select("*").eq("courier_id", uid).in("status", ["delivered", "cancelled"]).order("delivered_at", { ascending: false, nullsFirst: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as OrderSummaryRow[];
    },
  });
}

export function useWithdrawals() {
  const uid = useAuth((s) => s.session?.user.id);
  return useQuery({
    queryKey: ["courier", "withdrawals", uid],
    enabled: !!uid,
    queryFn: async (): Promise<CourierWithdrawalRow[]> => {
      const { data, error } = await supabase.from("courier_withdrawals").select("*").eq("courier_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CourierWithdrawalRow[];
    },
  });
}

export function useRequestWithdrawal() {
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.rpc("request_withdrawal", { p_amount: amount });
      if (error) throw error;
      return data as CourierWithdrawalRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier"] }),
  });
}

// ---------- Chat ----------
export function useOrderMessages(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-messages", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<OrderMessageRow[]> => {
      const { data, error } = await supabase.from("order_messages").select("*").eq("order_id", orderId).order("created_at");
      if (error) throw error;
      return (data ?? []) as OrderMessageRow[];
    },
  });
}

export function useSendMessage(orderId: string | undefined) {
  const uid = useAuth((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("order_messages").insert({ order_id: orderId, sender_id: uid, body });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-messages", orderId] }),
  });
}

// ---------- Ubicación ----------
export interface Coords { lat: number; lng: number }

/**
 * Mientras `enabled`, pide permiso foreground y envía la posición con `courier_update_location`
 * cada 10 s o 50 m. Devuelve la última posición conocida.
 */
export function useLocationTracking(enabled: boolean, activeOrderId: string | null, onCoords: (c: Coords) => void, onDenied?: () => void) {
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const orderRef = useRef<string | null>(activeOrderId);
  orderRef.current = activeOrderId;
  const onCoordsRef = useRef(onCoords);
  onCoordsRef.current = onCoords;
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!enabled) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { onDeniedRef.current?.(); return; }
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) onCoordsRef.current({ lat: last.coords.latitude, lng: last.coords.longitude });
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 50 },
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            onCoordsRef.current(c);
            supabase.rpc("courier_update_location", { p_lat: c.lat, p_lng: c.lng, p_order_id: orderRef.current }).then(() => undefined, () => undefined);
          },
        );
        if (cancelled) sub.remove(); else subRef.current = sub;
      } catch {
        onDeniedRef.current?.();
      }
    })();
    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [enabled]);
}

/** Posición puntual (sin seguimiento). */
export async function getCurrentCoords(): Promise<Coords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === "granted" || (await Location.requestForegroundPermissionsAsync()).status === "granted";
    if (!granted) return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
