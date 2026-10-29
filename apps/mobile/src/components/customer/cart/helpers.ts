import { create } from "zustand";
import { normalizeName } from "@/lib/design-images";

/** Nombre y presentación de un producto de tienda (misma función que 25, 26 y 27). */
export { splitUnit } from "@/components/customer/store/featured";

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
