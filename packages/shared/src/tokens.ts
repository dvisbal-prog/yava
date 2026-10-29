/**
 * Design tokens YAVA · Rediseño V2 (fidelidad a los PNG de `YAVA/reinicio-v2`).
 *
 * Fuente: docs/DISENO-CLIENTE.md §1 (colores medidos con Pillow sobre los PNG) y la sección
 * "Componentes implementados" de esa guía (tipografía recalibrada por ancho de tinta).
 * Las claves "legadas" (carbon, gray*, typography.title/heading/…) se conservan porque las usan
 * comercio, repartidor, owner y admin; ahora apuntan a los grises azulados del diseño.
 */
export const colors = {
  // ── Azules ────────────────────────────────────────────────────────────────
  /** Botón primario, "+" circulares, radio/checkbox marcado, íconos activos. */
  blue: "#0045AB",
  /** Presionado / botones de auth algo más oscuros. */
  blueDark: "#003A8F",
  /** Titulares sobre amarillo/crema ("El sabor de la costa"), precios de Ofertas. */
  blueNavy: "#00367F",
  /** Enlaces de texto: "Ver todos ›", "Cambiar", "Editar", "Limpiar". */
  blueLink: "#0A47F0",
  /** Texto/ícono de opciones seleccionadas, botones suaves y outline, etiqueta de pestaña activa. */
  blueText: "#0645C8",
  /** Píldora de pestaña activa, segmento activo, botón suave, círculos de ícono. */
  blueSoft: "#E6EEFD",
  /** Fondo de tarjeta/opción seleccionada. */
  blueTint: "#EEF4FD",
  /** Chip seleccionado con borde, burbuja propia (22), badge "Principal". */
  blueChip: "#DCEAFD",

  // ── Amarillos, cremas y pasteles ─────────────────────────────────────────
  yellow: "#FEC516",
  yellowSoft: "#FFF4D1",
  /** Estrellas de calificación. */
  star: "#FDBF1F",
  /** Trazos "destello" de banners e ilustraciones. */
  spark: "#FCBE04",
  /** Fondo del banner "El sabor de la costa" (08). */
  bannerYellow: "#FDF1C2",
  /** Mancha redonda intensa del banner amarillo. */
  bannerBlob: "#FEE27F",
  /** Mancha redonda clara del banner amarillo (arriba-derecha). */
  bannerBlobSoft: "#FEEBAE",
  /** Tarjeta "Comida" (08), banner y tile de mercado (25), tarjetas de Ofertas (33). */
  cream: "#FEF7E6",
  pastelMint: "#EAF6F1",
  pastelSky: "#E5F1FD",
  pastelLavender: "#ECF0FD",
  pastelButter: "#FDF5DB",
  pastelPink: "#FCEFF5",
  pastelLeaf: "#EEF6E4",
  pastelPeach: "#FDEFDF",
  offerGray: "#F5F5F5",

  // ── Neutros (grises azulados, nunca gris neutro) ─────────────────────────
  /** Títulos y texto principal. */
  ink: "#0B0F1C",
  /** Subtítulos bajo H1, labels de formulario. */
  textSecondary: "#565F73",
  /** Metadatos: "Ceviches · 25–35 min", "Envío $3.000", "Puerto Colombia". */
  textTertiary: "#6E7689",
  /** Placeholders, ayudas, horas de chat. */
  textPlaceholder: "#8E96A8",
  /** Subtítulo de tarjetas de categoría ("Restaurantes y más"). */
  textCategory: "#576778",
  /** Pin del encabezado, íconos grises de filas. */
  iconGray: "#434E64",
  /** Inputs, stepper, opciones no seleccionadas, chips outline. */
  border: "#E3E6EC",
  /** Borde de tarjetas blancas. */
  cardBorder: "#ECEEF3",
  /** Borde del buscador y chips blancos. */
  searchBorder: "#EAEDF2",
  /** Separadores de sección y de filas. */
  divider: "#E9EBF0",
  /** Botón atrás circular gris, chips inactivos, stepper relleno. */
  surfaceGray: "#F1F3F6",
  /** Tarjetas grises (resumen, aviso, repartidor). */
  surfaceSoft: "#F5F7FA",
  /** Círculo del chevron ⌄ junto a la dirección. */
  chevronCircle: "#F3F5F9",

  // ── Estados ───────────────────────────────────────────────────────────────
  red: "#DC1F2E",
  redSoft: "#FDEEF0",
  green: "#0E8A3E",
  greenText: "#00771D",
  greenSoft: "#E6F8EE",
  amber: "#FDB405",
  amberSoft: "#FEF6E9",
  amberPill: "#FDE196",
  amberPillText: "#2A1500",
  orange: "#FC7324",
  orangeSoft: "#FDEFDF",
  closedGray: "#8D96A6",
  disabledBg: "#E8E9ED",
  disabledText: "#8F96A6",
  disabledStrong: "#B9BFCB",
  overlay: "rgba(0,0,0,0.5)",

  // ── Legado (compatibilidad con comercio / repartidor / owner / admin) ────
  carbon: "#0B0F1C",
  gray900: "#1F2533",
  gray700: "#4B556A",
  gray500: "#6E7689",
  gray400: "#8E96A8",
  gray300: "#D5D9E1",
  gray200: "#E3E6EC",
  gray100: "#F1F3F6",
  gray50: "#F5F7FA",
  white: "#FFFFFF",
  black: "#000000",
} as const;

/** Radios en pt. `sm/md/lg/xl/pill` son las claves legadas; `rN` son las medidas del diseño. */
export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, pill: 999,
  r6: 6, r10: 10, r12: 12, r14: 14, r16: 16, r18: 18, r24: 24,
} as const;

/** Espaciado en pt. `gutter` = margen lateral del diseño (17,5 pt medidos en 08: contenido de x 17,1 a 375,5). */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, gutter: 17.5 } as const;

/**
 * Sombras con `boxShadow` (RN ≥ 0.76 con nueva arquitectura y react-native-web): se ven igual en
 * iOS, Android y web. Usar con spread: `style={[styles.card, shadows.soft]}` (el View necesita fondo).
 */
export const shadows = {
  /** Buscador blanco, chips blancos, botones circulares sobre fotos. */
  soft: { boxShadow: "0px 5px 12px rgba(16, 24, 48, 0.10)" },
  /** Barra de pestañas flotante y botón de búsqueda circular. */
  float: { boxShadow: "0px 6px 22px rgba(16, 24, 48, 0.10)" },
  /** Barras fijas inferiores sin borde (sombra hacia arriba). */
  bar: { boxShadow: "0px -4px 14px rgba(16, 24, 48, 0.06)" },
  /** Tarjetas de tiendas / productos con borde. */
  card: { boxShadow: "0px 2px 8px rgba(16, 24, 48, 0.05)" },
  none: { boxShadow: "none" },
} as const;

type FontWeight = "400" | "500" | "600" | "700";
interface TypeStyle { fontSize: number; lineHeight: number; fontWeight: FontWeight; letterSpacing?: number }

/**
 * Escala tipográfica (fuente del sistema = SF Pro; no fijar `fontFamily`).
 * Claves legadas: display, title, heading, body, bodyStrong, caption, small.
 * Claves del diseño de cliente (medidas por ancho de tinta en los PNG, ver guía): hero … tab.
 */
export const typography = {
  // Legado (todas las apps)
  display: { fontSize: 27, lineHeight: 33, fontWeight: "700", letterSpacing: -0.4 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "700", letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  small: { fontSize: 11, lineHeight: 14, fontWeight: "500" },

  // Diseño de cliente
  /** Nombre grande: 27 "Banano", 43 "Bocamar". */
  hero: { fontSize: 31, lineHeight: 37, fontWeight: "700", letterSpacing: -0.5 },
  /** Título de página: "Entra a YAVA", "Ofertas", "Cuenta". */
  h1: { fontSize: 27, lineHeight: 33, fontWeight: "700", letterSpacing: -0.4 },
  /** Nombre de producto en detalle, "Pedido confirmado". */
  h2: { fontSize: 22.5, lineHeight: 28, fontWeight: "700", letterSpacing: -0.3 },
  /** Título de hoja modal ("Filtros"), secciones de detalle. */
  h3: { fontSize: 20, lineHeight: 25, fontWeight: "700", letterSpacing: -0.3 },
  /** Título junto al botón atrás ("Finalizar pedido"). */
  navTitle: { fontSize: 16.5, lineHeight: 21, fontWeight: "600", letterSpacing: -0.1 },
  /** Título de sección ("Restaurantes cerca", "Para tu próximo antojo"). */
  section: { fontSize: 16.5, lineHeight: 21, fontWeight: "700", letterSpacing: -0.25 },
  /** Banner amarillo ("El sabor de la costa"). */
  banner: { fontSize: 20, lineHeight: 24, fontWeight: "700", letterSpacing: -0.45 },
  /** Tarjeta pastel ("Comida", "Mercado"). */
  cardTitle: { fontSize: 15, lineHeight: 19, fontWeight: "700", letterSpacing: -0.15 },
  /** Título de fila/lista ("Entrega en la puerta", "Ceviche clásico"), valor de input. */
  bodyL: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  /** Texto corrido, opciones, subtítulos bajo H1. */
  bodyM: { fontSize: 14, lineHeight: 19, fontWeight: "400" },
  /** Segunda línea de filas, buscador, subtítulo del banner. */
  bodyS: { fontSize: 13.5, lineHeight: 18, fontWeight: "400" },
  /** Metadatos medianos: "Productos", "Total a pagar", subtítulo de tarjeta pastel. */
  caption2: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  /** Línea 2 del encabezado de dirección ("Casa · Calle 2 # 3-45"). */
  address: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
  /** Nombre en tarjeta de carrusel ("Bocamar"). */
  cardName: { fontSize: 11.5, lineHeight: 15, fontWeight: "700" },
  /** Enlace "Ver todos ›". */
  link: { fontSize: 10.5, lineHeight: 14, fontWeight: "500" },
  /** Metadatos de tarjeta: "Ceviches · 25–35 min", "Puerto Colombia". */
  meta: { fontSize: 9.7, lineHeight: 14, fontWeight: "400" },
  /** Metadatos de tarjeta compacta ("Para tu próximo antojo"). */
  metaS: { fontSize: 8.1, lineHeight: 12, fontWeight: "400" },
  /** Barra de pestañas. */
  tab: { fontSize: 8.2, lineHeight: 11, fontWeight: "500" },
  /** Precio en listas. */
  price: { fontSize: 13.5, lineHeight: 18, fontWeight: "700" },
  /** Total en barra inferior ("$38.000"). */
  priceL: { fontSize: 23, lineHeight: 28, fontWeight: "700", letterSpacing: -0.3 },
  /** Texto de botón primario / píldora. */
  button: { fontSize: 15.5, lineHeight: 20, fontWeight: "600" },
} as const satisfies Record<string, TypeStyle>;
