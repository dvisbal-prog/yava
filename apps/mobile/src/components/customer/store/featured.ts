import type { ProductRow, ProductCategoryRow } from "@/features/customer/types";
import { normalizeName } from "@/lib/design-images";

export interface MenuSection { id: string; name: string; items: ProductRow[] }

/** Agrupa los productos por categoría (orden de la BD); los sueltos van a "Otros" (o "Menú" si no hay categorías). */
export function buildSections(products: ProductRow[], categories: ProductCategoryRow[]): MenuSection[] {
  const out: MenuSection[] = categories
    .map((c) => ({ id: c.id, name: c.name, items: products.filter((p) => p.category_id === c.id) }))
    .filter((s) => s.items.length);
  const loose = products.filter((p) => !p.category_id || !categories.some((c) => c.id === p.category_id));
  if (loose.length) out.push({ id: "otros", name: out.length ? "Otros" : "Menú", items: loose });
  return out;
}

/**
 * Pestaña sintética "Más pedidos" (12) / "Destacados" (26). No hay datos de popularidad visibles para el cliente,
 * así que se arma con el menú completo reordenado:
 * - restaurantes: la primera categoría (platos fuertes) y luego, por turnos, el resto empezando por la última
 *   (bebidas, acompañantes…) → "Ceviche clásico, camarón, mixto, Limonada natural…" como en el diseño;
 * - tiendas (mercado/farmacia): un producto de cada categoría por turnos → "Banano, Tomate, Arroz…".
 */
export function featuredProducts(sections: MenuSection[], kind: "food" | "store"): ProductRow[] {
  if (!sections.length) return [];
  if (kind === "store") return roundRobin(sections.map((s) => s.items));
  const [first, ...rest] = sections;
  return [...first.items, ...roundRobin([...rest].reverse().map((s) => s.items))];
}

/** "Menú destacado" del restaurante cerrado (43): el primer producto de cada categoría, con el mismo orden que `featuredProducts`. */
export function topPerCategory(sections: MenuSection[]): ProductRow[] {
  if (!sections.length) return [];
  const [first, ...rest] = sections;
  return [first, ...[...rest].reverse()].map((s) => s.items[0]).filter(Boolean);
}

function roundRobin<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i] !== undefined) out.push(l[i]);
  return out;
}

/**
 * Subtítulo del comercio: lema + etiquetas que no repiten el lema ("Ceviches · Mariscos · Costeño").
 * `max` limita el número de segmentos y `maxChars` el largo total (se quitan etiquetas del final).
 */
export function merchantSubtitle(m: { tagline?: string | null; tags?: string[] | null }, max = 3, maxChars = 40): string {
  const tagline = (m.tagline ?? "").trim();
  const base = normalizeName(tagline);
  const parts: string[] = tagline ? [tagline] : [];
  for (const t of m.tags ?? []) {
    const n = normalizeName(t);
    if (!n) continue;
    const stem = n.replace(/e?s$/, "");
    if (base.includes(stem) || parts.some((p) => normalizeName(p).replace(/e?s$/, "") === stem)) continue;
    parts.push(t.charAt(0).toUpperCase() + t.slice(1));
  }
  let out = parts.slice(0, max);
  // Sin cortar con "…": se quitan segmentos del final hasta que quepa (queda al menos el lema).
  while (out.length > 1 && out.join(" · ").length > maxChars) out = out.slice(0, -1);
  return out.join(" · ");
}

/**
 * Nombre y presentación de un producto de tienda: "Banano (libra)" → { name: "Banano", unit: "1 libra" };
 * "Arroz Diana 1 kg" → { name: "Arroz Diana", unit: "1 kg" }; "Acetaminofén 500 mg x 10" → { "Acetaminofén", "500 mg x 10" }.
 * Si el nombre no trae la presentación, `unit` es `null`.
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

/** Descripción corta que parece una presentación ("120 ml.", "Bolsa de 1 kg") → sin punto final; si no, `null`. */
export function unitFromDescription(desc: string | null | undefined): string | null {
  const d = (desc ?? "").trim().replace(/\.$/, "");
  if (!d || d.length > 24) return null;
  return /\d/.test(d) ? d : null;
}
