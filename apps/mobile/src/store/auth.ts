import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppRole, AdminRole } from "@yava/shared";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  city_id: string | null;
  notifications_enabled: boolean;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  adminRole: AdminRole | null;
  merchantId: string | null;
  isCourier: boolean;
  /** true mientras se carga la sesión inicial */
  loading: boolean;
  init: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  adminRole: null,
  merchantId: null,
  isCourier: false,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session) await get().refreshProfile();
    set({ loading: false });
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) await get().refreshProfile();
      else set({ profile: null, adminRole: null, merchantId: null, isCourier: false });
    });
  },

  refreshProfile: async () => {
    const uid = get().session?.user.id ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!uid) return;
    const [{ data: profile }, { data: admin }, { data: members }, { data: courier }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("admin_users").select("role,status").eq("user_id", uid).maybeSingle(),
      supabase.from("merchant_members").select("merchant_id").eq("user_id", uid).limit(1),
      supabase.from("couriers").select("user_id").eq("user_id", uid).maybeSingle(),
    ]);
    set({
      profile: (profile as Profile | null) ?? null,
      adminRole: admin && admin.status === "active" ? (admin.role as AdminRole) : null,
      merchantId: members?.[0]?.merchant_id ?? null,
      isCourier: Boolean(courier),
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, adminRole: null, merchantId: null, isCourier: false });
  },

  updateProfile: async (patch) => {
    const uid = get().session?.user.id;
    if (!uid) throw new Error("Sin sesión");
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", uid).select().single();
    if (error) throw error;
    set({ profile: data as Profile });
  },
}));

/** Rol efectivo para enrutar: owner/admin → owners app; comercio; repartidor; cliente. */
export function useEffectiveRole(): "loading" | "guest" | "customer" | "merchant" | "courier" | "owner" {
  const { loading, session, profile, adminRole, merchantId, isCourier } = useAuth();
  if (loading) return "loading";
  if (!session) return "guest";
  if (adminRole) return "owner";
  if (profile?.role === "merchant" || merchantId) return "merchant";
  if (profile?.role === "courier" || isCourier) return "courier";
  return "customer";
}
