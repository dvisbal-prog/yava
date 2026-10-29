import { create } from "zustand";
import { normalizeName } from "@/lib/design-images";

/**
 * Nombre y presentación de un producto de tienda: "Banano (libra)" → { name: "Banano", unit: "1 libra" };
 * "Arroz Diana 1 kg" → { name: "Arroz Diana", unit: "1 kg" }. Si el nombre no trae presentación, `unit` es `null`.
 */
export function splitUnit(full: string): { name: string; unit: string | null } {
  const paren = full.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const u = paren[2].trim();
    return { name: paren[1], unit: /^\d/.test(u) ? u : `1 ${u}` };
  }
  const qty = full.match(/^(.*?)\s+(\d+(?:[.,]\d+)?\s?(?:kg|g|gr|mg|l|lt|ml|cc|oz|lb|und|unidades?)\b.*)$/i);
  if (qty && qty[1].length >= 3) return { name: qty[1], unit: qty[2] };
  return { name: full, unit: null };
}

/** "Patacones Bocamar" en una tarjeta que ya dice "Bocamar" debajo → "Patacones". */
export function withoutMerchant(name: string, merchantName: string | null | undefined): string {
  const m = normalizeName(merchantName);
  if (!m) return name;
  const words = name.trim().split(/\s+/);
  const tail = normalizeName(words.slice(-m.split(" ").length).join(" "));
  return tail === m && words.length > m.split(" ").length ? words.slice(0, -m.split(" ").length).join(" ") : name;
}

/** "25 – 35 min" (raya con espacios, como en 16/28). */
export function etaSpaced(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "";
  if (min && max && min !== max) return `${min} – ${max} min`;
  return `${min ?? max} min`;
}

/** Preferencia "Si falta un producto" de la canasta de mercado/farmacia (28). Se envía en las notas del pedido. */
export const SUBSTITUTION_OPTIONS = [
  "Contactarme antes de reemplazar",
  "Reemplazar por uno similar",
  "Quitar del pedido",
] as const;
export type SubstitutionChoice = (typeof SUBSTITUTION_OPTIONS)[number];

interface SubstitutionState { choice: SubstitutionChoice; setChoice: (c: SubstitutionChoice) => void }
export const useSubstitution = create<SubstitutionState>()((set) => ({
  choice: SUBSTITUTION_OPTIONS[0],
  setChoice: (choice) => set({ choice }),
}));

/** Canastas de tienda (mercado, farmacia): usan el diseño 28 y la preferencia de reemplazo. */
export function isStoreCart(category: string | null | undefined): boolean {
  return category === "market" || category === "pharmacy";
}
