/**
 * Fotos e ilustraciones recortadas de los PNG de diseño (`assets/images/diseno/`, ver docs/FOTOS-DISENO.md).
 *
 * - `designImages.<clave>`: `require()` estático de cada archivo (úsalo con `expo-image`: `<Image source={designImages.bannerSaborCosta} />`).
 * - `merchantImage(m, kind)`: foto de diseño de un comercio por nombre/slug, con respaldo a `cover_url`/`logo_url` de la BD.
 * - `productImage(p, variant)`: foto de diseño de un producto por nombre, con respaldo a `image_urls[0]`/`image_url` de la BD.
 * - `promoImage(p)`: foto de diseño de una promoción por título, con respaldo a `image_url`.
 *
 * Cuando la BD apunte a estas mismas fotos en Storage, los helpers seguirán funcionando (preferirán el recorte local,
 * que carga sin red). Para desactivar el mapa local basta con vaciar `MERCHANTS`/`PRODUCTS`/`PROMOS`.
 */

/** Fuente estática de Metro (número de asset). Compatible con `expo-image` y `Image` de RN. */
export type DesignImage = number;
/** Lo que aceptan `<Image source>` de expo-image: asset local o URL remota. */
export type DesignImageSource = DesignImage | { uri: string };

export const designImages = {
  // Acceso y auth
  logoGoogle: require("../../assets/images/diseno/logo-google.png") as DesignImage,
  banderaColombia: require("../../assets/images/diseno/bandera-colombia.png") as DesignImage,

  // Inicio (08)
  categoriaComida: require("../../assets/images/diseno/categoria-comida.jpg") as DesignImage,
  categoriaMercado: require("../../assets/images/diseno/categoria-mercado.jpg") as DesignImage,
  categoriaFarmacia: require("../../assets/images/diseno/categoria-farmacia.jpg") as DesignImage,
  categoriaEnvios: require("../../assets/images/diseno/categoria-envios.jpg") as DesignImage,
  bannerSaborCosta: require("../../assets/images/diseno/banner-sabor-costa.jpg") as DesignImage,

  // Restaurantes (09) · tiles de categoría
  /** 09 tiles a sangre (recorte completo de la baldosa, radio 13 pt): 87 × 87 pt; Bebidas 77 × 87 pt. */
  tileCeviches: require("../../assets/images/diseno/restaurantes-tile-ceviches.jpg") as DesignImage,
  tileHamburguesas: require("../../assets/images/diseno/restaurantes-tile-hamburguesas.jpg") as DesignImage,
  tileShawarmas: require("../../assets/images/diseno/restaurantes-tile-shawarmas.jpg") as DesignImage,
  tileBebidas: require("../../assets/images/diseno/restaurantes-tile-bebidas.jpg") as DesignImage,

  // Comercios
  bocamarPortada: require("../../assets/images/diseno/comercio-bocamar-portada.jpg") as DesignImage,
  /** 12 portada del menú (foto distinta a la de 43; 851×443 px desde el tope del PNG, botones y barra de estado retocados). */
  bocamarMenuPortada: require("../../assets/images/diseno/comercio-bocamar-menu-portada.jpg") as DesignImage,
  bocamarBanda: require("../../assets/images/diseno/comercio-bocamar.jpg") as DesignImage,
  bocamarTarjeta: require("../../assets/images/diseno/comercio-bocamar-tarjeta.jpg") as DesignImage,
  bocamarLogo: require("../../assets/images/diseno/logo-bocamar.png") as DesignImage,
  bocamarSello: require("../../assets/images/diseno/logo-bocamar-sello.png") as DesignImage,
  naranmicheBanda: require("../../assets/images/diseno/comercio-naranmiche.jpg") as DesignImage,
  naranmicheTarjeta: require("../../assets/images/diseno/comercio-naranmiche-tarjeta.jpg") as DesignImage,
  amarasBanda: require("../../assets/images/diseno/comercio-amaras.jpg") as DesignImage,
  amarasTarjeta: require("../../assets/images/diseno/comercio-amaras-tarjeta.jpg") as DesignImage,
  /** 08 carrusel "Restaurantes cerca": hamburguesa con papas, encuadre abierto (08 · 351,1092,638,1240). */
  naranmicheCarrusel: require("../../assets/images/diseno/comercio-naranmiche-carrusel.jpg") as DesignImage,
  /** 08 "Para tu próximo antojo": shawarma con papas al fondo (08 · 40,1485,231,1639). */
  amarasAntojo: require("../../assets/images/diseno/comercio-amaras-antojo.jpg") as DesignImage,
  /** 08 "Para tu próximo antojo": ceviche en primer plano (08 · 484,1485,670,1639). */
  bocamarAntojo: require("../../assets/images/diseno/comercio-bocamar-antojo.jpg") as DesignImage,
  /** 09 "Cerca de ti": banda completa 360 × 99 pt (09 · 37,780,815,994 y equivalentes). */
  bocamarCerca: require("../../assets/images/diseno/comercio-bocamar-cerca.jpg") as DesignImage,
  naranmicheCerca: require("../../assets/images/diseno/comercio-naranmiche-cerca.jpg") as DesignImage,
  amarasCerca: require("../../assets/images/diseno/comercio-amaras-cerca.jpg") as DesignImage,
  /** 10 tarjeta grande "Restaurantes" (358 × 137,6 pt; la zona del sello está rellenada, va tapada por el sello). */
  bocamarBusqueda: require("../../assets/images/diseno/comercio-bocamar-busqueda.jpg") as DesignImage,
  /** 10 filas de platos (118 × 99,8 pt). */
  productoCevicheClasicoLista: require("../../assets/images/diseno/producto-ceviche-clasico-lista.jpg") as DesignImage,
  productoCevicheMixtoLista: require("../../assets/images/diseno/producto-ceviche-mixto-lista.jpg") as DesignImage,
  /** 12 grid del menú (foto completa 178 × 116 pt; la zona del "+" va tapada por el botón). */
  productoCevicheClasicoMenu: require("../../assets/images/diseno/producto-ceviche-clasico-menu.jpg") as DesignImage,
  productoCevicheCamaronMenu: require("../../assets/images/diseno/producto-ceviche-camaron-menu.jpg") as DesignImage,
  productoCevicheMixtoMenu: require("../../assets/images/diseno/producto-ceviche-mixto-menu.jpg") as DesignImage,
  productoLimonadaNaturalMenu: require("../../assets/images/diseno/producto-limonada-natural-menu.jpg") as DesignImage,
  /** 14 complementos: foto completa de la baldosa (bebidas 117 × 112 pt, acompañantes 173 × 97 pt; la zona del "+" va tapada). */
  productoAguaComplemento: require("../../assets/images/diseno/producto-agua-complemento.jpg") as DesignImage,
  productoLimonadaCocoComplemento: require("../../assets/images/diseno/producto-limonada-coco-complemento.jpg") as DesignImage,
  productoPataconesComplemento: require("../../assets/images/diseno/producto-patacones-complemento.jpg") as DesignImage,
  productoChipsPlatanoComplemento: require("../../assets/images/diseno/producto-chips-platano-complemento.jpg") as DesignImage,
  productoCevicheCamaronLista: require("../../assets/images/diseno/producto-ceviche-camaron-lista.jpg") as DesignImage,
  mercadoPortadaTienda: require("../../assets/images/diseno/comercio-mercado-del-puerto-portada.jpg") as DesignImage,
  mercadoLogo: require("../../assets/images/diseno/logo-mercado-del-puerto.jpg") as DesignImage,
  fachadaMercadoDelPuerto: require("../../assets/images/diseno/fachada-mercado-del-puerto.jpg") as DesignImage,
  fachadaTiendaDeLaCosta: require("../../assets/images/diseno/fachada-tienda-de-la-costa.jpg") as DesignImage,
  fachadaFarmaciaDelPuerto: require("../../assets/images/diseno/fachada-farmacia-del-puerto.jpg") as DesignImage,
  fachadaBienestarCaribe: require("../../assets/images/diseno/fachada-bienestar-caribe.jpg") as DesignImage,

  // Mercado (25)
  /** 25 banner: mitad derecha completa (destellos + bolsa) hasta los bordes, 207 × 130 pt, fondo #FEF6E0. */
  bannerMercadoCompleto: require("../../assets/images/diseno/banner-mercado-completo.jpg") as DesignImage,
  /** 25 tiles a sangre (baldosa completa con su fondo pastel, radio 14). */
  tileFrutas: require("../../assets/images/diseno/mercado-tile-frutas.jpg") as DesignImage,
  tileVerduras: require("../../assets/images/diseno/mercado-tile-verduras.jpg") as DesignImage,
  tileLacteos: require("../../assets/images/diseno/mercado-tile-lacteos.jpg") as DesignImage,
  tileDespensa: require("../../assets/images/diseno/mercado-tile-despensa.jpg") as DesignImage,

  // Farmacia (29)
  /** 29 tarjetas completas (175 × 106 pt) sin texto: el texto lo pone el app encima. */
  farmaciaCatCuidadoPersonal: require("../../assets/images/diseno/farmacia-cat-cuidado-personal.jpg") as DesignImage,
  farmaciaCatProteccionSolar: require("../../assets/images/diseno/farmacia-cat-proteccion-solar.jpg") as DesignImage,
  farmaciaCatBebes: require("../../assets/images/diseno/farmacia-cat-bebes.jpg") as DesignImage,
  farmaciaCatPrimerosAuxilios: require("../../assets/images/diseno/farmacia-cat-primeros-auxilios.jpg") as DesignImage,
  /** 29 "Farmacias cercanas": fachada completa 177 × 122 pt (la zona de la insignia de tiempo va tapada por la insignia). */
  fachadaFarmaciaDelPuertoTarjeta: require("../../assets/images/diseno/fachada-farmacia-del-puerto-tarjeta.jpg") as DesignImage,
  fachadaBienestarCaribeTarjeta: require("../../assets/images/diseno/fachada-bienestar-caribe-tarjeta.jpg") as DesignImage,
  /** 25 "Lo esencial": foto de la caja blanca (114 × 99 pt; la zona del "+" va tapada por el botón). */
  productoBananoTarjeta: require("../../assets/images/diseno/producto-banano-tarjeta.jpg") as DesignImage,
  productoTomateTarjeta: require("../../assets/images/diseno/producto-tomate-tarjeta.jpg") as DesignImage,
  productoArrozTarjeta: require("../../assets/images/diseno/producto-arroz-tarjeta.jpg") as DesignImage,

  // Productos
  productoCevicheClasico: require("../../assets/images/diseno/producto-ceviche-clasico.jpg") as DesignImage,
  productoCevicheClasicoDetalle: require("../../assets/images/diseno/producto-ceviche-clasico-detalle.jpg") as DesignImage,
  productoCevicheCamaron: require("../../assets/images/diseno/producto-ceviche-camaron.jpg") as DesignImage,
  productoCevicheMixto: require("../../assets/images/diseno/producto-ceviche-mixto.jpg") as DesignImage,
  productoLimonadaNatural: require("../../assets/images/diseno/producto-limonada-natural.jpg") as DesignImage,
  productoLimonadaCoco: require("../../assets/images/diseno/producto-limonada-coco.jpg") as DesignImage,
  productoPatacones: require("../../assets/images/diseno/producto-patacones.jpg") as DesignImage,
  productoChipsPlatano: require("../../assets/images/diseno/producto-chips-platano.jpg") as DesignImage,
  productoAgua: require("../../assets/images/diseno/producto-agua.jpg") as DesignImage,
  productoBanano: require("../../assets/images/diseno/producto-banano.jpg") as DesignImage,
  productoBananoBlanco: require("../../assets/images/diseno/producto-banano-blanco.jpg") as DesignImage,
  productoTomate: require("../../assets/images/diseno/producto-tomate.jpg") as DesignImage,
  productoArroz: require("../../assets/images/diseno/producto-arroz.jpg") as DesignImage,
  productoLeche: require("../../assets/images/diseno/producto-leche.jpg") as DesignImage,
  productoProtectorSolar: require("../../assets/images/diseno/producto-protector-solar.jpg") as DesignImage,
  productoProtectorSolarBlanco: require("../../assets/images/diseno/producto-protector-solar-blanco.jpg") as DesignImage,
  productoCepilloDental: require("../../assets/images/diseno/producto-cepillo-dental.jpg") as DesignImage,
  productoApositos: require("../../assets/images/diseno/producto-apositos.jpg") as DesignImage,

  // Ofertas (33)
  /** 33 fotos hasta el borde derecho y alto completo de cada tarjeta (el fundido a la izquierda lo completa el app). */
  ofertaCevicheTarjeta: require("../../assets/images/diseno/oferta-ceviche-tarjeta.jpg") as DesignImage,
  ofertaHamburguesaTarjeta: require("../../assets/images/diseno/oferta-hamburguesa-tarjeta.jpg") as DesignImage,
  ofertaAmarasTarjeta: require("../../assets/images/diseno/oferta-amaras-tarjeta.jpg") as DesignImage,

  // Pedido, envíos y pagos
  avatarRepartidor: require("../../assets/images/diseno/avatar-repartidor.jpg") as DesignImage,
  avatarRepartidorAlt: require("../../assets/images/diseno/avatar-repartidor-alt.jpg") as DesignImage,
  envioCaja: require("../../assets/images/diseno/envio-caja.png") as DesignImage,
  pagoVisa: require("../../assets/images/diseno/pago-visa.png") as DesignImage,
  pagoVisaClaro: require("../../assets/images/diseno/pago-visa-claro.png") as DesignImage,

  // Pedido en curso y después (20–24, 45, 47): fotos propias de esas pantallas (las elige `components/customer/order/photos.ts`)
  /** 20 tarjeta del comercio, 101 × 70 pt (20 · 57,417,270,562). */
  pedidoConfirmadoBocamar: require("../../assets/images/diseno/pedido-confirmado-bocamar.jpg") as DesignImage,
  /** 20 filas de "Tu pedido", 58 × 55 pt (20 · 66,694,188,808 y 66,844,188,962). */
  pedidoConfirmadoCevicheClasico: require("../../assets/images/diseno/pedido-confirmado-ceviche-clasico.jpg") as DesignImage,
  pedidoConfirmadoLimonadaNatural: require("../../assets/images/diseno/pedido-confirmado-limonada-natural.jpg") as DesignImage,
  /** 22 tarjeta del pedido en el chat, 104 × 58 pt (22 · 62,243,281,362). */
  chatRepartidorBocamar: require("../../assets/images/diseno/chat-repartidor-bocamar.jpg") as DesignImage,
  /** 23 tarjeta del comercio, 126 × 60 pt (23 · 55,319,322,443). */
  pedidoEntregadoBocamar: require("../../assets/images/diseno/pedido-entregado-bocamar.jpg") as DesignImage,
  /** 23 filas de "Tu pedido", 57 × 54 pt (23 · 40,568,157,679 y 40,721,157,832); también fondo de 47. */
  pedidoEntregadoCevicheClasico: require("../../assets/images/diseno/pedido-entregado-ceviche-clasico.jpg") as DesignImage,
  pedidoEntregadoLimonadaNatural: require("../../assets/images/diseno/pedido-entregado-limonada-natural.jpg") as DesignImage,
  /** 24 tarjeta gris de la calificación, 157 × 101 pt (24 · 68,212,401,426); también foto del comercio en el fondo de 47. */
  calificarBocamar: require("../../assets/images/diseno/calificar-bocamar.jpg") as DesignImage,
  /** 45 tarjeta del pedido, 104 × 82 pt (45 · 71,754,290,925). */
  pagoFallidoBocamar: require("../../assets/images/diseno/pago-fallido-bocamar.jpg") as DesignImage,
  /** 23 baldosa VISA azul de la fila de pago, 34,6 × 24,5 pt (23 · 36,1206,111,1259). */
  pedidoEntregadoVisa: require("../../assets/images/diseno/pedido-entregado-visa.png") as DesignImage,
  /** 21 moto del repartidor en el mapa (fondo transparente), 30 × 36 pt. */
  pedidoSeguimientoMoto: require("../../assets/images/diseno/pedido-seguimiento-moto.png") as DesignImage,
  /** 22 foto del repartidor (gorra oscura) del encabezado y de las burbujas, 40,6 pt (22 · 117,112,205,200). */
  chatRepartidorAvatar: require("../../assets/images/diseno/chat-repartidor-avatar.jpg") as DesignImage,

  // Canasta (15, 44): miniaturas propias de esas pantallas (las elige `components/customer/cart/photos.ts`)
  /** 15 miniatura del comercio, 59 × 59 pt (15 · 42,208,166,332). */
  bocamarCanastaMiniatura: require("../../assets/images/diseno/comercio-bocamar-canasta-miniatura.jpg") as DesignImage,
  /** 44 foto del comercio en la cabecera, 140 × 75 pt (44 · 39,161,341,324). */
  bocamarCanastaPortada: require("../../assets/images/diseno/comercio-bocamar-canasta-portada.jpg") as DesignImage,
  /** 15 líneas de la canasta, 77 × 68 pt (15 · 42,388,205,532 y 42,583,205,725). */
  productoCevicheClasicoCanasta: require("../../assets/images/diseno/producto-ceviche-clasico-canasta.jpg") as DesignImage,
  productoLimonadaNaturalCanasta: require("../../assets/images/diseno/producto-limonada-natural-canasta.jpg") as DesignImage,
  /** 15 "Te puede gustar", 173 × 93 pt (la zona del "+" está rellenada: va tapada por el botón). */
  productoPataconesCanasta: require("../../assets/images/diseno/producto-patacones-canasta.jpg") as DesignImage,
  productoChipsPlatanoCanasta: require("../../assets/images/diseno/producto-chips-platano-canasta.jpg") as DesignImage,
  /** 28 líneas de la canasta de mercado, 103 × 87 pt (28 · 47,226,268,413 y 47,455,268,642). */
  productoBananoCanasta: require("../../assets/images/diseno/producto-banano-canasta.jpg") as DesignImage,
  productoTomateCanasta: require("../../assets/images/diseno/producto-tomate-canasta.jpg") as DesignImage,

  // Notificaciones (38)
  notifEntregado: require("../../assets/images/diseno/notif-entregado.png") as DesignImage,
  notifEnCamino: require("../../assets/images/diseno/notif-en-camino.png") as DesignImage,
  notifConfirmado: require("../../assets/images/diseno/notif-confirmado.png") as DesignImage,

  // Estados vacíos y errores (19, 41, 42, 45, 46, 48)
  vacioCupones: require("../../assets/images/diseno/vacio-cupones.png") as DesignImage,
  vacioBusqueda: require("../../assets/images/diseno/vacio-busqueda.png") as DesignImage,
  vacioCanasta: require("../../assets/images/diseno/vacio-canasta.png") as DesignImage,
  /** 45 ilustración opaca sobre blanco con el círculo rosado liso (45 · 329,274,532,497); 93,8 × 103 pt. */
  pagoFallidoLimpio: require("../../assets/images/diseno/pago-fallido-limpio.png") as DesignImage,
  sinCobertura: require("../../assets/images/diseno/sin-cobertura.png") as DesignImage,
  sinConexion: require("../../assets/images/diseno/sin-conexion.png") as DesignImage,

  // Cuenta, favoritos y envíos (31–40, 48): recortes propios de esas pantallas
  /** 34 tarjeta "Tus productos favoritos": ceviche con patacones, 104 × 75 pt (34 · 59,1379,285,1541). */
  favoritoCevicheClasico: require("../../assets/images/diseno/favorito-ceviche-clasico.jpg") as DesignImage,
  /** 36 miniaturas de "Mis pedidos", 81 × 77 pt (36 · 57,316,232,484 y las dos tarjetas siguientes). */
  pedidosBocamar: require("../../assets/images/diseno/pedidos-bocamar.jpg") as DesignImage,
  pedidosNaranmiche: require("../../assets/images/diseno/pedidos-naranmiche.jpg") as DesignImage,
  pedidosAmaras: require("../../assets/images/diseno/pedidos-amaras.jpg") as DesignImage,
  /** 39 "Tu pedido reciente", 118 × 82 pt (39 · 58,536,306,704). */
  ayudaBocamar: require("../../assets/images/diseno/ayuda-bocamar.jpg") as DesignImage,
  /** 40 tarjeta del pedido en el chat de soporte, 98 × 71 pt (40 · 54,265,260,413). */
  soporteBocamar: require("../../assets/images/diseno/soporte-bocamar.jpg") as DesignImage,
  /** 32 caja de cartón de la tarjeta "Paquete pequeño", 48,5 × 45 pt sobre blanco (32 · 65,1013,170,1110). */
  envioCajaRevision: require("../../assets/images/diseno/envio-caja-revision.jpg") as DesignImage,

  // Portadas extendidas (12/13/26/43): el recorte sigue unas filas por debajo del borde de la hoja blanca
  // (reflejo de la foto) para que sus esquinas redondeadas muestren foto y no un color plano.
  /** 13 portada del detalle hasta 532 px (la hoja empieza en 510 px, radio 6 pt). */
  productoCevicheClasicoDetalleExt: require("../../assets/images/diseno/producto-ceviche-clasico-detalle-ext.jpg") as DesignImage,
  /** 26 portada de la tienda de mercado hasta 384 px (hoja en 351 px, radio 13 pt). */
  mercadoPortadaTiendaExt: require("../../assets/images/diseno/comercio-mercado-del-puerto-portada-ext.jpg") as DesignImage,
  /** 43 portada de Bocamar cerrado hasta 598 px (hoja en 548 px, radio 20 pt). */
  bocamarPortadaExt: require("../../assets/images/diseno/comercio-bocamar-portada-ext.jpg") as DesignImage,

} as const;

export type DesignImageKey = keyof typeof designImages;

/** "Mercado del Puerto" → "mercado del puerto"; "Banano (1 kg)" → "banano 1 kg"; "Ceviche clásico" → "ceviche clasico". */
export function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Tipos de foto de un comercio:
 * - `cover`: portada grande (12/43 Bocamar, 26 tienda de mercado; en los demás, la mejor foto disponible).
 * - `card`: encuadre ≈ 1,7:1 para tarjetas pequeñas (08 carrusel y "Para tu próximo antojo", 34, 36, 41).
 * - `wide`: banda ancha ≈ 3,8:1 (09 "Cerca de ti", 10 tarjeta con sello).
 * - `storefront`: fachada (25/29 "Tiendas cercanas").
 * - `logo`: logo/baldosa (12 tile, 26).
 * - `seal`: sello circular (10).
 * - `carousel`: foto del carrusel C7 de 08 (si el comercio no tiene una propia, cae a `card`).
 * - `compact`: foto de la tarjeta compacta C9 de 08 "Para tu próximo antojo" (cae a `card`).
 * - `nearby`: banda completa de 09 "Cerca de ti" (cae a `wide`).
 * - `hero`: foto de la tarjeta grande con sello de 10 (cae a `cover`).
 * - `storefrontCard`: fachada completa de la tarjeta de 29 "Farmacias cercanas" (cae a `storefront`).
 * - `offer`: foto de la tarjeta de oferta de 33 (sin respaldo: si no hay, usar la foto de la promoción).
 * - `menu`: portada de la pantalla de menú 12 (cae a `cover`).
 */
export type MerchantImageKind = "cover" | "card" | "wide" | "storefront" | "logo" | "seal" | "carousel" | "compact" | "nearby" | "hero" | "storefrontCard" | "offer" | "menu";

const MERCHANTS: Record<string, Partial<Record<MerchantImageKind, DesignImage>>> = {
  bocamar: {
    cover: designImages.bocamarPortada, card: designImages.bocamarTarjeta, wide: designImages.bocamarBanda,
    logo: designImages.bocamarLogo, seal: designImages.bocamarSello, compact: designImages.bocamarAntojo,
    nearby: designImages.bocamarCerca, hero: designImages.bocamarBusqueda, offer: designImages.ofertaCevicheTarjeta,
    menu: designImages.bocamarMenuPortada,
  },
  naranmiche: { cover: designImages.naranmicheBanda, card: designImages.naranmicheTarjeta, wide: designImages.naranmicheBanda, carousel: designImages.naranmicheCarrusel, nearby: designImages.naranmicheCerca, offer: designImages.ofertaHamburguesaTarjeta },
  amaras: { cover: designImages.amarasBanda, card: designImages.amarasTarjeta, wide: designImages.amarasBanda, compact: designImages.amarasAntojo, nearby: designImages.amarasCerca, offer: designImages.ofertaAmarasTarjeta },
  // Mercado (25/26): "Mercado del Puerto" es la tienda principal (portada, logo y oferta de 33);
  // "Tienda de la Costa" es la segunda tienda de "Tiendas cercanas" (solo fachada).
  "mercado del puerto": {
    cover: designImages.mercadoPortadaTienda, card: designImages.fachadaMercadoDelPuerto, wide: designImages.fachadaMercadoDelPuerto,
    storefront: designImages.fachadaMercadoDelPuerto, logo: designImages.mercadoLogo, offer: designImages.bannerMercadoCompleto,
  },
  "tienda de la costa": {
    cover: designImages.fachadaTiendaDeLaCosta, card: designImages.fachadaTiendaDeLaCosta, wide: designImages.fachadaTiendaDeLaCosta,
    storefront: designImages.fachadaTiendaDeLaCosta,
  },
  // Farmacia (29/30): "Farmacia del Puerto" y "Bienestar Caribe".
  "farmacia del puerto": {
    cover: designImages.fachadaFarmaciaDelPuerto, card: designImages.fachadaFarmaciaDelPuerto, wide: designImages.fachadaFarmaciaDelPuerto,
    storefront: designImages.fachadaFarmaciaDelPuerto, storefrontCard: designImages.fachadaFarmaciaDelPuertoTarjeta,
  },
  "bienestar caribe": {
    cover: designImages.fachadaBienestarCaribe, card: designImages.fachadaBienestarCaribe, wide: designImages.fachadaBienestarCaribe,
    storefront: designImages.fachadaBienestarCaribe, storefrontCard: designImages.fachadaBienestarCaribeTarjeta,
  },
};

/** Orden de respaldo cuando el comercio no tiene el tipo pedido. */
const KIND_FALLBACK: Record<MerchantImageKind, MerchantImageKind[]> = {
  cover: ["cover", "wide", "card", "storefront"],
  card: ["card", "wide", "cover", "storefront"],
  wide: ["wide", "card", "cover", "storefront"],
  storefront: ["storefront", "card", "wide", "cover"],
  logo: ["logo", "seal"],
  seal: ["seal", "logo"],
  carousel: ["carousel", "card", "wide", "cover", "storefront"],
  compact: ["compact", "card", "wide", "cover", "storefront"],
  nearby: ["nearby", "wide", "card", "cover", "storefront"],
  hero: ["hero", "cover", "wide", "card", "storefront"],
  storefrontCard: ["storefrontCard", "storefront", "card", "wide", "cover"],
  offer: ["offer"],
  menu: ["menu", "cover", "wide", "card", "storefront"],
};

function uri(u: string | null | undefined): { uri: string } | undefined {
  return u ? { uri: u } : undefined;
}

/** Recorte local de diseño para un comercio (sin respaldo a la BD). */
export function merchantDesignImage(m: { name?: string | null; slug?: string | null }, kind: MerchantImageKind = "cover"): DesignImage | undefined {
  const entry = MERCHANTS[normalizeName(m.name)] ?? MERCHANTS[normalizeName(m.slug?.replace(/-/g, " "))];
  if (!entry) return undefined;
  for (const k of KIND_FALLBACK[kind]) {
    const img = entry[k];
    if (img !== undefined) return img;
  }
  return undefined;
}

/**
 * Foto de un comercio para `<Image source>`: prefiere el recorte del diseño y cae a la URL de la BD
 * (`logo_url` para `logo`/`seal`, `cover_url` para lo demás). Devuelve `undefined` si no hay nada.
 */
export function merchantImage(
  m: { name?: string | null; slug?: string | null; cover_url?: string | null; logo_url?: string | null },
  kind: MerchantImageKind = "cover",
): DesignImageSource | undefined {
  const local = merchantDesignImage(m, kind);
  if (local !== undefined) return local;
  if (kind === "logo" || kind === "seal") return uri(m.logo_url) ?? uri(m.cover_url);
  return uri(m.cover_url) ?? uri(m.logo_url);
}

/**
 * Variante de foto de producto: `default` (cuadrícula/lista), `detail` (portada de 13), `white` (sobre fondo blanco: 25/27/29),
 * `list` (filas de platos de 10), `card` (caja blanca de 25 "Lo esencial"), `menu` (grid del menú de 12) y
 * `complement` (baldosas de la hoja de complementos de 14).
 * Las nuevas caen a `default` si no hay recorte.
 */
export type ProductImageVariant = "default" | "detail" | "white" | "list" | "card" | "menu" | "complement";

const PRODUCTS: Record<string, Partial<Record<ProductImageVariant, DesignImage>>> = {
  "ceviche clasico": { default: designImages.productoCevicheClasico, detail: designImages.productoCevicheClasicoDetalle, list: designImages.productoCevicheClasicoLista, menu: designImages.productoCevicheClasicoMenu },
  "ceviche de camaron": { default: designImages.productoCevicheCamaron, list: designImages.productoCevicheCamaronLista, menu: designImages.productoCevicheCamaronMenu },
  "ceviche mixto": { default: designImages.productoCevicheMixto, list: designImages.productoCevicheMixtoLista, menu: designImages.productoCevicheMixtoMenu },
  "patacones bocamar": { default: designImages.productoPatacones, complement: designImages.productoPataconesComplemento },
  "patacones": { default: designImages.productoPatacones, complement: designImages.productoPataconesComplemento },
  "chips de platano bocamar": { default: designImages.productoChipsPlatano, complement: designImages.productoChipsPlatanoComplemento },
  "chips de platano": { default: designImages.productoChipsPlatano, complement: designImages.productoChipsPlatanoComplemento },
  "limonada natural": { default: designImages.productoLimonadaNatural, menu: designImages.productoLimonadaNaturalMenu },
  "limonada de coco": { default: designImages.productoLimonadaCoco, complement: designImages.productoLimonadaCocoComplemento },
  // La foto de 14 (casi cuadrada) sirve también para las tarjetas anchas del grid de 12; la vertical se ve como un acercamiento.
  "agua": { default: designImages.productoAgua, complement: designImages.productoAguaComplemento, menu: designImages.productoAguaComplemento },
  "agua natural": { default: designImages.productoAgua, complement: designImages.productoAguaComplemento, menu: designImages.productoAguaComplemento },
  // Mercado (25–28): nombres de la BD ("Banano (1 kg)", "Arroz (1 kg)", "Leche (1 L)") y claves cortas de respaldo.
  "banano 1 kg": { default: designImages.productoBanano, white: designImages.productoBananoBlanco, card: designImages.productoBananoTarjeta },
  "banano": { default: designImages.productoBanano, white: designImages.productoBananoBlanco, card: designImages.productoBananoTarjeta },
  "tomate 1 kg": { default: designImages.productoTomate, card: designImages.productoTomateTarjeta },
  "tomate": { default: designImages.productoTomate, card: designImages.productoTomateTarjeta },
  "arroz 1 kg": { default: designImages.productoArroz, card: designImages.productoArrozTarjeta },
  "arroz": { default: designImages.productoArroz, card: designImages.productoArrozTarjeta },
  "leche 1 l": { default: designImages.productoLeche },
  "leche": { default: designImages.productoLeche },
  // Farmacia (29/30): "Protector solar SPF 50", "Cepillo dental", "Apósitos adhesivos".
  "protector solar spf 50": { default: designImages.productoProtectorSolar, white: designImages.productoProtectorSolarBlanco },
  "protector solar": { default: designImages.productoProtectorSolar, white: designImages.productoProtectorSolarBlanco },
  "cepillo dental": { default: designImages.productoCepilloDental },
  "apositos adhesivos": { default: designImages.productoApositos },
  "apositos": { default: designImages.productoApositos },
};

/** Recorte local de diseño para un producto (sin respaldo a la BD). `detail`/`white` caen a `default`. */
export function productDesignImage(name: string | null | undefined, variant: ProductImageVariant = "default"): DesignImage | undefined {
  const entry = PRODUCTS[normalizeName(name)];
  if (!entry) return undefined;
  return entry[variant] ?? entry.default;
}

/** Foto de un producto: recorte del diseño por nombre o, si no hay, la primera URL de la BD. */
export function productImage(
  p: { name?: string | null; image_urls?: string[] | null; image_url?: string | null },
  variant: ProductImageVariant = "default",
): DesignImageSource | undefined {
  const local = productDesignImage(p.name, variant);
  if (local !== undefined) return local;
  return uri(p.image_urls?.[0]) ?? uri(p.image_url);
}

const PROMOS: Record<string, DesignImage> = {
  "el sabor de la costa": designImages.bannerSaborCosta,
};

/** Foto de una promoción (banner de 08): recorte del diseño por título o `image_url` de la BD. */
export function promoImage(p: { title?: string | null; image_url?: string | null }): DesignImageSource | undefined {
  const local = PROMOS[normalizeName(p.title)];
  if (local !== undefined) return local;
  return uri(p.image_url);
}

/** `true` si la promoción tiene arte propio del diseño (fondo amarillo + plato recortado). */
export function hasPromoDesignArt(p: { title?: string | null }): boolean {
  return PROMOS[normalizeName(p.title)] !== undefined;
}
