import { designImages, normalizeName, productImage, merchantImage, type DesignImage, type DesignImageSource } from "@/lib/design-images";

/**
 * Fotos propias de las pantallas de Cuenta (34–40): el PNG usa encuadres distintos a los de la cuadrícula del menú.
 * Si el producto no está en el mapa, cae a `productImage()` (recorte genérico o foto de la BD).
 */
const FAVORITE_PRODUCTS: Record<string, DesignImage> = {
  "ceviche clasico": designImages.favoritoCevicheClasico,
};

/** Foto de la tarjeta "Tus productos favoritos" (34). */
export function favoriteProductPhoto(p: { name?: string | null; image_urls?: string[] | null; image_url?: string | null }): DesignImageSource | undefined {
  return FAVORITE_PRODUCTS[normalizeName(p.name)] ?? productImage(p);
}

const ORDER_THUMBS: Record<string, DesignImage> = {
  bocamar: designImages.pedidosBocamar,
  naranmiche: designImages.pedidosNaranmiche,
  amaras: designImages.pedidosAmaras,
};

/** Miniatura del comercio en las tarjetas de "Mis pedidos" (36) y en Ayuda/Soporte (39/40); cae a la foto `card` o a la de la BD. */
export function orderMerchantPhoto(name: string | null | undefined, logoUrl?: string | null): DesignImageSource | undefined {
  return ORDER_THUMBS[normalizeName(name)] ?? merchantImage({ name, logo_url: logoUrl, cover_url: null }, "card");
}

/** Foto del pedido reciente en Ayuda (39). */
export function helpOrderPhoto(name: string | null | undefined, logoUrl?: string | null): DesignImageSource | undefined {
  return normalizeName(name) === "bocamar" ? designImages.ayudaBocamar : orderMerchantPhoto(name, logoUrl);
}

/** Foto del pedido en el chat de soporte (40). */
export function supportOrderPhoto(name: string | null | undefined, logoUrl?: string | null): DesignImageSource | undefined {
  return normalizeName(name) === "bocamar" ? designImages.soporteBocamar : orderMerchantPhoto(name, logoUrl);
}
