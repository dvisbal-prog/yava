import { designImages, merchantImage, productImage, normalizeName, type DesignImage, type DesignImageSource } from "@/lib/design-images";

/**
 * Fotos de las pantallas del pedido (20, 21, 22, 23, 24, 45 y el fondo de 47): recortes propios
 * de cada PNG por nombre normalizado. Si el comercio o el producto no tiene recorte, se usa la foto general
 * del diseño o la de la BD.
 */
export type OrderPhotoScreen = "confirmed" | "delivered" | "rate" | "chat" | "failed" | "live";

const MERCHANT: Record<OrderPhotoScreen, Record<string, DesignImage>> = {
  confirmed: { bocamar: designImages.pedidoConfirmadoBocamar },
  delivered: { bocamar: designImages.pedidoEntregadoBocamar },
  rate: { bocamar: designImages.calificarBocamar },
  chat: { bocamar: designImages.chatRepartidorBocamar },
  failed: { bocamar: designImages.pagoFallidoBocamar },
  live: { bocamar: designImages.calificarBocamar },
};

const PRODUCT: Partial<Record<OrderPhotoScreen, Record<string, DesignImage>>> = {
  confirmed: { "ceviche clasico": designImages.pedidoConfirmadoCevicheClasico, "limonada natural": designImages.pedidoConfirmadoLimonadaNatural },
  delivered: { "ceviche clasico": designImages.pedidoEntregadoCevicheClasico, "limonada natural": designImages.pedidoEntregadoLimonadaNatural },
  live: { "ceviche clasico": designImages.pedidoEntregadoCevicheClasico, "limonada natural": designImages.pedidoEntregadoLimonadaNatural },
};

/** Foto del comercio de un pedido (tarjeta C20a). */
export function orderMerchantPhoto(
  m: { name?: string | null; slug?: string | null; cover_url?: string | null; logo_url?: string | null },
  screen: OrderPhotoScreen,
): DesignImageSource | undefined {
  return MERCHANT[screen][normalizeName(m.name)] ?? merchantImage(m, "card");
}

/** Foto de una línea del pedido (miniatura de "Tu pedido"). */
export function orderItemPhoto(
  p: { name?: string | null; image_urls?: string[] | null; image_url?: string | null },
  screen: OrderPhotoScreen,
): DesignImageSource | undefined {
  return PRODUCT[screen]?.[normalizeName(p.name)] ?? productImage(p);
}

/**
 * Foto del repartidor del diseño por nombre (Carlos): `main` = gorra azul de 21, `chat` = gorra oscura de 22,
 * `alt` = chaqueta amarilla de 24. Si no es el repartidor del diseño, `undefined` (se muestran sus iniciales).
 */
export function courierPhoto(name: string | null | undefined, variant: "main" | "chat" | "alt" = "alt"): DesignImage | undefined {
  if (normalizeName(name).split(" ")[0] !== "carlos") return undefined;
  return variant === "main" ? designImages.avatarRepartidor
    : variant === "chat" ? designImages.chatRepartidorAvatar
    : designImages.avatarRepartidorAlt;
}
