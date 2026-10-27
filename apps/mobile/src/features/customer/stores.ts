import { create } from "zustand";
import type { CustomerPaymentChoice } from "./types";

/* ---------- Filtros de la lista de comercios (pantalla 11) ---------- */
export type SortOption = "recommended" | "fastest" | "rating";
export interface MerchantFilters {
  sort: SortOption;
  maxTime: 30 | 35 | 45 | null;
  delivery: "free" | 3000 | null;
  minRating: 4.5 | null;
  openNow: boolean;
  tag: string | null;
}
const defaultFilters: MerchantFilters = { sort: "recommended", maxTime: null, delivery: null, minRating: null, openNow: false, tag: null };

interface FiltersState extends MerchantFilters {
  set: (patch: Partial<MerchantFilters>) => void;
  reset: () => void;
  activeCount: () => number;
}
export const useMerchantFilters = create<FiltersState>()((set, get) => ({
  ...defaultFilters,
  set: (patch) => set(patch),
  reset: () => set(defaultFilters),
  activeCount: () => {
    const s = get();
    return [s.sort !== "recommended", s.maxTime !== null, s.delivery !== null, s.minRating !== null, s.openNow, s.tag !== null].filter(Boolean).length;
  },
}));

/* ---------- Selección de pago en el checkout ---------- */
interface CheckoutState {
  method: CustomerPaymentChoice;
  paymentMethodId: string | null;
  /** Marca de tiempo de la última elección (sirve para saber si el usuario eligió algo en Métodos de pago). */
  selectedAt: number;
  setMethod: (method: CustomerPaymentChoice, paymentMethodId?: string | null) => void;
}
export const useCheckout = create<CheckoutState>()((set) => ({
  method: "cash",
  paymentMethodId: null,
  selectedAt: 0,
  setMethod: (method, paymentMethodId = null) => set({ method, paymentMethodId, selectedAt: Date.now() }),
}));

/* ---------- Borrador de envío (pantallas 31–32) ---------- */
export type PackageSize = "small" | "medium" | "large";
export interface ShipmentDraft {
  pickupLine1: string;
  pickupLine2: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLine1: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  recipientName: string;
  recipientPhone: string;
  packageType: string;
  size: PackageSize;
  description: string;
}
interface ShipmentState {
  draft: ShipmentDraft;
  update: (patch: Partial<ShipmentDraft>) => void;
  reset: () => void;
}
const emptyDraft: ShipmentDraft = {
  pickupLine1: "", pickupLine2: "", pickupLat: null, pickupLng: null,
  dropoffLine1: "", dropoffLat: null, dropoffLng: null,
  recipientName: "", recipientPhone: "", packageType: "Documentos", size: "small", description: "",
};
export const useShipmentDraft = create<ShipmentState>()((set) => ({
  draft: emptyDraft,
  update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: emptyDraft }),
}));

/* ---------- Intención de navegación tras iniciar sesión ----------
 * El AuthGate del layout raíz redirige a /(customer) apenas hay sesión, así que
 * guardamos aquí a dónde quería ir el usuario y lo consumimos en el layout de cliente. */
interface NavIntentState {
  pendingNext: string | null;
  setPendingNext: (next: string | null) => void;
}
export const useNavIntent = create<NavIntentState>()((set) => ({
  pendingNext: null,
  setPendingNext: (pendingNext) => set({ pendingNext }),
}));
