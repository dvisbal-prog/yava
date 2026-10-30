import { normalizeName, type DesignImage, type DesignImageSource } from "@/lib/design-images";

/**
 * Flyers de las pautas pagadas del Inicio (carrusel "Promociones"): 1200 × 1080 px (10:9) empaquetados en
 * `assets/images/promos/` (fuentes en YAVA/flyers). Las mismas imágenes están en Storage
 * (`merchant-media/<merchant_id>/flyer.jpg`, el `image_url` de cada promoción), pero se prefiere la copia local,
 * que carga sin red. Una promoción usa el flyer local solo si coinciden su título y su comercio: si el
 * restaurante pauta otra promoción, se ve su `image_url` y no un flyer viejo.
 */
const FLYERS: { merchantId: string; title: string; image: DesignImage }[] = [
  {
    merchantId: "c0000000-0000-0000-0000-000000000001", // Bocamar
    title: "combo ceviche limonada",
    image: require("../../assets/images/promos/bocamar-flyer.jpg") as DesignImage,
  },
  {
    merchantId: "c0000000-0000-0000-0000-000000000002", // Naranmiche
    title: "combo hamburguesa papas",
    image: require("../../assets/images/promos/naranmiche-flyer.jpg") as DesignImage,
  },
  {
    merchantId: "c0000000-0000-0000-0000-000000000003", // Amaras
    title: "2 shawarmas de pollo",
    image: require("../../assets/images/promos/amaras-flyer.jpg") as DesignImage,
  },
];

/** Proporción ancho/alto de los flyers (1200 × 1080). */
export const FLYER_ASPECT = 10 / 9;

/** Flyer de una pauta: el local si título y comercio coinciden; si no, `image_url`; `undefined` si no hay ninguno. */
export function sponsoredFlyer(p: { title?: string | null; merchant_id?: string | null; image_url?: string | null }): DesignImageSource | undefined {
  const title = normalizeName(p.title);
  const local = FLYERS.find((f) => f.title === title && (!p.merchant_id || p.merchant_id === f.merchantId));
  if (local) return local.image;
  return p.image_url ? { uri: p.image_url } : undefined;
}
