import { supabase } from "@/lib/supabase";
import { confirm } from "@/lib/dialog";
import { normalizeName } from "@/lib/design-images";

/**
 * Verificación de edad para bebidas alcohólicas (Ley 124 de 1994: prohibida la venta a menores de edad).
 *
 * La primera vez en cada sesión del app que se agrega a la canasta un licor se muestra el diálogo "Venta solo para
 * mayores de 18 años"; solo se agrega si el cliente confirma. La confirmación vive en memoria: se vuelve a pedir al
 * reabrir el app (y antes de pagar si la canasta guardada ya traía licores, ver `cart.tsx`).
 * Un producto es licor si su categoría tiene `is_alcohol` (lo marca la BD: migración 0015, por nombre de la
 * categoría o a mano desde el panel) o si el nombre de su categoría o el del producto es de licor (por ejemplo, una
 * cerveza en "Bebidas" de un restaurante). Todos los caminos que agregan productos pasan por aquí: Inicio (fila
 * "Cervezas y licores"), tienda (26), detalle de producto (27), Mercado (25), sugerencias de la canasta y
 * "Volver a pedir".
 */

/** Nombre de la categoría de licores de las tiendas (seed y migración 0015). */
export const ALCOHOL_CATEGORY = "Cervezas y licores";

/** Leyenda legal obligatoria junto a la publicidad y la venta de bebidas alcohólicas (Inicio, 26 y 27). */
export const ALCOHOL_LEGAL =
  "Prohíbese el expendio de bebidas embriagantes a menores de edad. El exceso de alcohol es perjudicial para la salud.";

// Palabras completas sobre el nombre normalizado (sin tildes): "Alcohol antiséptico" (farmacia), "Bebidas" o
// "Vinagre" no cuentan. Es la misma lista que usa la BD para marcar `product_categories.is_alcohol` (0015).
const ALCOHOL_RE =
  /\b(cervezas?|cervecerias?|licor(es|eria)?|vinos?|aguardientes?|rones|ron|whisk(e)?y|whiskies|tequilas?|vodkas?|ginebras?|cocteles|coctel|cocteleria|espumantes?|champa(n|gn)(a|e)s?|mezcal(es)?|brandy|cognac|alcoholicas?|alcoholicos?)\b/;

// Usos de cocina que no son bebidas: "Vinagre de vino", "Pollo al vino", "Salsa de vino".
const COOKING_RE = /\b(vinagre|salsa|reduccion|al) (de )?vino\b/g;

/** `true` si el nombre (de una categoría o de un producto) es de bebidas alcohólicas. */
export function isAlcoholCategoryName(name: string | null | undefined): boolean {
  return ALCOHOL_RE.test(normalizeName(name).replace(COOKING_RE, " "));
}

type CategoryLike = { id: string; name: string; is_alcohol?: boolean | null };
type ProductLike = { id: string; category_id: string | null; name?: string | null };

/** `true` si la categoría es de licores: marcada en la BD o con nombre de licor. */
export function isAlcoholCategory(c: CategoryLike): boolean {
  return c.is_alcohol === true || isAlcoholCategoryName(c.name);
}

/** ids de los productos que son licores, con las categorías ya cargadas (menú, Mercado). */
export function alcoholProductIds(products: readonly ProductLike[], categories: readonly CategoryLike[]): Set<string> {
  const cats = new Set(categories.filter(isAlcoholCategory).map((c) => c.id));
  return new Set(products.filter((p) => (p.category_id != null && cats.has(p.category_id)) || isAlcoholCategoryName(p.name)).map((p) => p.id));
}

/** Consulta cuáles de esos productos son licores (para "Volver a pedir", la canasta guardada o si el menú aún no cargó). */
export async function fetchAlcoholProductIds(productIds: string[]): Promise<Set<string>> {
  const ids = Array.from(new Set(productIds));
  if (!ids.length) return new Set();
  const { data: prods, error } = await supabase.from("products").select("id,category_id,name").in("id", ids);
  if (error) throw new Error(error.message);
  const rows = (prods ?? []) as ProductLike[];
  const catIds = Array.from(new Set(rows.map((p) => p.category_id).filter((x): x is string => Boolean(x))));
  if (!catIds.length) return alcoholProductIds(rows, []);
  const { data: cats, error: ce } = await supabase.from("product_categories").select("id,name,is_alcohol").in("id", catIds);
  if (ce) throw new Error(ce.message);
  return alcoholProductIds(rows, (cats ?? []) as CategoryLike[]);
}

let adultConfirmed = false;
let pending: Promise<boolean> | null = null;

/** `true` si el cliente ya confirmó su mayoría de edad en esta sesión del app. */
export function isAdultConfirmed(): boolean {
  return adultConfirmed;
}

/** Muestra el diálogo de mayoría de edad (una sola vez aunque se toque "+" varias veces seguidas). */
export function confirmAdult(): Promise<boolean> {
  if (adultConfirmed) return Promise.resolve(true);
  if (!pending) {
    pending = confirm("Venta solo para mayores de 18 años", "¿Confirmas que eres mayor de edad?", {
      okText: "Sí, soy mayor de edad",
      cancelText: "Cancelar",
    }).then((ok) => {
      if (ok) adultConfirmed = true;
      pending = null;
      return ok;
    });
  }
  return pending;
}

/**
 * Ejecuta `proceed` si se puede agregar: sin licores, o con la mayoría de edad confirmada (pidiéndola si falta).
 * `known`: productos de licor ya conocidos (del menú o de la lista); si es `null`/`undefined` se consulta a la BD.
 * Sin licores (o ya confirmado) `proceed` corre en el mismo tick, como antes.
 */
export function requireAdultFor(productIds: string[], known: Set<string> | null | undefined, proceed: () => void): void {
  if (adultConfirmed || !productIds.length) { proceed(); return; }
  const ask = () => { void confirmAdult().then((ok) => { if (ok) proceed(); }); };
  if (known) {
    if (productIds.some((id) => known.has(id))) ask(); else proceed();
    return;
  }
  // Sin categorías a mano: se consulta. Si la consulta falla (sin red) se pide la confirmación por precaución.
  fetchAlcoholProductIds(productIds).then((found) => (found.size ? ask() : proceed()), ask);
}
