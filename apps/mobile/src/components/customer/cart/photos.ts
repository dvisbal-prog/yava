import { designImages, merchantImage, productImage, normalizeName, type DesignImage, type DesignImageSource } from "@/lib/design-images";

/** Recortes propios de la canasta (15/44) por nombre normalizado; si no hay, se usa la foto general del diseño o de la BD. */
const CART_PRODUCTS: Record<string, DesignImage> = {
  "ceviche clasico": designImages.productoCevicheClasicoCanasta,
  "limonada natural": designImages.productoLimonadaNaturalCanasta,
  // 28 (mercado): mismo encuadre de la tarjeta de línea, 103 × 87 pt.
  "banano 1 kg": designImages.productoBananoCanasta,
  "banano": designImages.productoBananoCanasta,
  "tomate 1 kg": designImages.productoTomateCanasta,
  "tomate": designImages.productoTomateCanasta,
};
/** Fotos de las tarjetas "Te puede gustar" de 15 (encuadre 1,86:1). */
const CART_SUGGESTIONS: Record<string, DesignImage> = {
  "patacones bocamar": designImages.productoPataconesCanasta,
  "patacones": designImages.productoPataconesCanasta,
  "chips de platano bocamar": designImages.productoChipsPlatanoCanasta,
  "chips de platano": designImages.productoChipsPlatanoCanasta,
  // Sin recorte propio: la foto casi cuadrada de 14 (la vertical, en tarjeta ancha, queda como un acercamiento).
  "agua": designImages.productoAguaComplemento,
};
const CART_MERCHANT_THUMB: Record<string, DesignImage> = { bocamar: designImages.bocamarCanastaMiniatura };
const CART_MERCHANT_BANNER: Record<string, DesignImage> = { bocamar: designImages.bocamarCanastaPortada };

/** Foto de una línea de la canasta. */
export function cartProductPhoto(p: { name?: string | null; image_urls?: string[] | null }): DesignImageSource | undefined {
  return CART_PRODUCTS[normalizeName(p.name)] ?? productImage(p);
}

/** Foto de una tarjeta "Te puede gustar" (15). */
export function cartSuggestionPhoto(p: { name?: string | null; image_urls?: string[] | null }): DesignImageSource | undefined {
  return CART_SUGGESTIONS[normalizeName(p.name)] ?? productImage(p);
}

/** Miniatura cuadrada del comercio (15) o foto ancha de la cabecera (44). */
export function cartMerchantPhoto(
  m: { name?: string | null; slug?: string | null; cover_url?: string | null; logo_url?: string | null },
  kind: "thumb" | "banner",
): DesignImageSource | undefined {
  const map = kind === "thumb" ? CART_MERCHANT_THUMB : CART_MERCHANT_BANNER;
  return map[normalizeName(m.name)] ?? merchantImage(m, "card");
}
