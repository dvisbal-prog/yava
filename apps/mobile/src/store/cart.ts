import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartLine } from "@yava/shared";
import { cartSubtotal } from "@yava/shared";

interface CartMerchant { id: string; name: string; delivery_fee: number; category: string; prep_min: number; prep_max: number; }

interface CartState {
  merchant: CartMerchant | null;
  lines: CartLine[];
  notes: string;
  couponCode: string | null;
  addLine: (merchant: CartMerchant, line: CartLine) => "ok" | "different_merchant";
  replaceWith: (merchant: CartMerchant, line: CartLine) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  setNotes: (n: string) => void;
  setCoupon: (c: string | null) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

function sameLine(a: CartLine, b: CartLine) {
  return a.product_id === b.product_id && JSON.stringify(a.options.map((o) => o.option_id).sort()) === JSON.stringify(b.options.map((o) => o.option_id).sort()) && (a.notes ?? "") === (b.notes ?? "");
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      merchant: null,
      lines: [],
      notes: "",
      couponCode: null,
      addLine: (merchant, line) => {
        const cur = get().merchant;
        if (cur && cur.id !== merchant.id && get().lines.length > 0) return "different_merchant";
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => sameLine(l, line));
        if (idx >= 0) lines[idx] = { ...lines[idx], qty: lines[idx].qty + line.qty };
        else lines.push(line);
        set({ merchant, lines });
        return "ok";
      },
      replaceWith: (merchant, line) => set({ merchant, lines: [line], notes: "", couponCode: null }),
      setQty: (index, qty) => {
        const lines = [...get().lines];
        if (qty <= 0) lines.splice(index, 1); else lines[index] = { ...lines[index], qty };
        set({ lines, merchant: lines.length ? get().merchant : null });
      },
      remove: (index) => get().setQty(index, 0),
      setNotes: (notes) => set({ notes }),
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set({ merchant: null, lines: [], notes: "", couponCode: null }),
      count: () => get().lines.reduce((a, l) => a + l.qty, 0),
      subtotal: () => cartSubtotal(get().lines),
    }),
    { name: "yava-cart", storage: createJSONStorage(() => AsyncStorage) }
  )
);
