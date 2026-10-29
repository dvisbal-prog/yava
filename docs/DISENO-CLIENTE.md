# YAVA · Guía de diseño del app de cliente (pantallas 01–48)

Fuente de verdad: los PNG de `/Users/mac/Desktop/Claude Code/YAVA/reinicio-v2/tanda-01 … tanda-06`.
Esta guía traduce esos PNG a medidas (pt), colores (hex) y componentes para que el app se vea **igual** que el diseño.
Todo lo de aquí se midió con Pillow sobre los PNG (muestreo de píxeles); cuando un valor dice "≈" es una lectura visual con error de ±1–2 pt.

> Regla de oro: **la fidelidad es visual, no de datos.** Los textos, precios y nombres vienen de la BD (no se cambian). Lo que se copia del PNG es la estructura, el tamaño, el color, el radio, la sombra, la foto y el ritmo vertical.

---

## 0. Cómo leer y medir

| Concepto | Valor |
|---|---|
| Tamaño PNG | 851 × 1848 px (algunos 849–874 px; `18-agregar-tarjeta.png` es 874 × 1799 → 2,224 px/pt) |
| Escala | **1 pt = 2,165 px** (851 px ÷ 393 pt). Convertir: `pt = px ÷ 2,17` |
| Barra de estado "9:41" | los primeros **83 px (38 pt)** del PNG. No se implementa: ese espacio es `insets.top` |
| Indicador de inicio | últimos ≈ 70 px (32 pt). No se implementa: es `insets.bottom` |
| Coordenadas en esta guía | `x` en pt desde el borde izquierdo. `y` en pt **desde el tope del contenido** (= píxel 83 del PNG): `y = (px − 83) ÷ 2,165` |
| Viewport de comparación | 393 × 852 pt (iPhone). Web: `http://localhost:8095` |

Herramienta de comparación (diseño | app):

```bash
node /private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/shots/yshot.mjs \
  --route /merchant/c0000000-0000-0000-0000-000000000001 \
  --design "/Users/mac/Desktop/Claude Code/YAVA/reinicio-v2/tanda-02/12-bocamar-menu.png" --out 12 \
  [--login cliente|ninguno] [--click "Texto"] [--scroll 600] [--storage 'clave=json'] [--wait ms]
```

En web las rutas **no llevan el grupo**: `(customer)/merchant/[id].tsx` → `/merchant/<id>`; `(customer)/(tabs)/index.tsx` → `/`; `(auth)/phone.tsx` → `/phone`; `modal/filters.tsx` → `/modal/filters`.

### 0.1 Semillas de estado (`--storage`) reutilizables

- **S-LOC** (dirección activa de María, para que el encabezado diga "Casa · Calle 2 # 3-45"):
  `--storage 'yava-location={"state":{"address":{"id":"b0000000-0000-0000-0000-000000000001","user_id":"a0000000-0000-0000-0000-000000000001","label":"Casa","line1":"Calle 2 # 3-45","line2":"Apto. 302","city_id":"11111111-1111-1111-1111-111111111111","instructions":"Tocar el timbre al llegar.","lat":10.9871,"lng":-74.9541,"is_default":true},"coords":{"lat":10.9871,"lng":-74.9541},"cityId":"11111111-1111-1111-1111-111111111111","cityName":"Puerto Colombia"},"version":0}'`
- **S-CART** (pedido de ejemplo #1042: ceviche + limonada en Bocamar):
  `--storage 'yava-cart={"state":{"merchant":{"id":"c0000000-0000-0000-0000-000000000001","name":"Bocamar","delivery_fee":3000,"category":"food","prep_min":25,"prep_max":35},"lines":[{"product_id":"e0000000-0000-0000-0000-000000000001","name":"Ceviche clásico","unit_price":28000,"qty":1,"options":[{"group_id":"f0000000-0000-0000-0000-000000000001","option_id":"demo-sin-picante","name":"Sin picante","price_delta":0}]},{"product_id":"e0000000-0000-0000-0000-000000000006","name":"Limonada natural","unit_price":6000,"qty":1,"options":[]}],"notes":"","couponCode":null},"version":0}'`
  (el `option_id` es ilustrativo: sirve para capturas, no para pagar).
- **S-CART-NODISP** (pantalla 44, actualizado el 29 oct 2026): desde que "Limonada de coco" está publicada (la pide el PNG 14), en la BD no queda ningún producto de Bocamar en pausa. Se usa S-CART y se simula, solo en la respuesta, que Limonada natural está en pausa (no escribe en la BD):
  `--storage "$SCART" --patch '000000000006%29=limonada-natural.jpg"],"status":"published"=>limonada-natural.jpg"],"status":"paused"'` (con `yshotG.mjs`).
- **S-LOC-FUERA** (pantalla 46): S-LOC cambiando `lat/lng` a `4.711/-74.072` (Bogotá, fuera de cobertura).

### 0.2 IDs reales de los datos demo (Supabase `dgebycmouxjfuwtnhxmu`, iguales a `supabase/seed/seed.sql`)

| Qué | ID / dato |
|---|---|
| Bocamar (food, ceviches) | `c0000000-0000-0000-0000-000000000001` |
| Naranmiche (food, hamburguesas) | `c0000000-0000-0000-0000-000000000002` |
| Amaras (food, shawarmas) | `c0000000-0000-0000-0000-000000000003` |
| Mercado del Puerto (market) | `c0000000-0000-0000-0000-000000000004` (antes "Mercado La Costa") |
| Tienda de la Costa (market) | `c0000000-0000-0000-0000-000000000007` (segunda tienda de 25) |
| Farmacia del Puerto (pharmacy) | `c0000000-0000-0000-0000-000000000005` (antes "Farmacia Vida") |
| Bienestar Caribe (pharmacy) | `c0000000-0000-0000-0000-000000000008` (segunda farmacia de 29) |
| Ceviche clásico (con grupo "Elige el picante" obligatorio + "Complementos") | `e0000000-0000-0000-0000-000000000001` |
| Ceviche de camarón / mixto | `…000000000002` / `…000000000003` |
| Patacones / Chips de plátano | `…000000000004` / `…000000000005` |
| Limonada natural / Agua / Limonada de coco (las tres publicadas) | `…000000000006` / `…000000000008` / `…000000000007` |
| Productos de mercado y farmacia | IDs aleatorios: llegar con `--click "Banano (1 kg)"` o `--click "Protector solar SPF 50"` desde la tienda; el JSON de yshot devuelve la URL `/product/<id>` |
| Pedido #1042 (entregado, pagado con Visa 4242) | `90000000-0000-0000-0000-000000001042` |
| Dirección Casa de María | `b0000000-0000-0000-0000-000000000001` |
| Cliente demo | `cliente@yava.app` / `yava2026` (perfil "María Pérez") |

Datos demo alineados con los diseños (29 oct 2026):
- **Mercado**: "Mercado del Puerto" y "Tienda de la Costa". Productos "Banano (1 kg)", "Tomate (1 kg)", "Cebolla cabezona (1 kg)", "Arroz (1 kg)" y "Leche (1 L)" (en las dos tiendas). Las unidades ya no dicen "libra".
- **Farmacia**: "Farmacia del Puerto" y "Bienestar Caribe". Productos nuevos o renombrados: "Protector solar SPF 50", "Cepillo dental" y "Apósitos adhesivos".
- **Restaurantes**: Bocamar suma "Agua" y las etiquetas {ceviche, mariscos, comida de mar} (subtítulo "Ceviches · Mariscos · Comida de mar"); su categoría de acompañantes se llama "Acompañantes", como en 12 y 14. Naranmiche suma "Combo hamburguesa + papas"; Amaras suma "Limonada de hierbabuena". El grupo de picante del ceviche se llama "Elige el picante".
- **María**: Bocamar, Naranmiche y Amaras en favoritos; 3 notificaciones de #1042; un caso de soporte de #1042 ("pago · Revisar un cobro") abierto 1 min después de la entrega, con 3 mensajes a +2, +3 y +4 min. Todos los pedidos tienen líneas.
- **Orden fijo**: `search_catalog` ordena sus resultados (migración `0014_search_catalog_orden.sql`) y las listas que mezclan comercios desempatan por nombre, así que lo que se ve ya no depende del orden físico de las filas.
- **Fotos**: `design-images.ts` y `cart/photos.ts` buscan por el nombre nuevo normalizado ("banano 1 kg", "leche 1 l", "tienda de la costa"…). Los nombres viejos ya no tienen recorte (ver FOTOS-DISENO.md).

Pantallas que **no se pueden alcanzar** con los datos demo sin tocar la BD: 21 (no hay pedido en camino), 45 (el #1042 está pagado), 47 en su estado "cancelable" (el #1042 ya se entregó), 43 (solo si Bocamar está fuera de horario), 48 (requiere estar sin red). Para compararlas, usar un fixture local solo en `__DEV__` (p. ej. un parámetro `?preview=1` que inyecte un pedido de ejemplo) — decisión del orquestador; **nunca** escribir en la BD.

---

## 1. Sistema visual global

### 1.1 Paleta (medida en los PNG)

> El azul actual del código (`#1E5EFF`) **es incorrecto**. El azul de los diseños es `#0045AB` (confirmado: botones de 02/03 miden `#0045AA`–`#0046AC`; 28 `#0245A6`; 42 `#0044A4`; 46 `#0042A6`). Los PNG tienen el blanco comprimido a `#FDFDFD`: en código usar `#FFFFFF`.

**Azules**

| Token sugerido | Hex | Uso | Evidencia (px medidos) |
|---|---|---|---|
| `blue` | `#0045AB` | Botón primario, botones "+" circulares, radio/checkbox marcado, chip "Todas" (33), burbuja propia en soporte (40), íconos de Cuenta (35), pin del mapa, nodo activo del seguimiento | 02 `#0045AB`, 03 `#0046AC`, 12 "+" `#0044B2`, 35 íconos `#043FA3`, 40 burbuja `#003EAC` |
| `blueDark` | `#003A8F` | Estado presionado; botones de 05/06/07 se ven algo más oscuros (`#003D94`–`#003B97`) | 05 `#013E95` |
| `blueNavy` | `#00367F` | Titulares sobre fondos amarillos/crema (banner "El sabor de la costa", "Tu mercado, a domicilio"), eyebrow y precios de Ofertas | 08 `#00337C`, 25 `#02387F`, 33 eyebrow `#01389E`, precio `#05409A` |
| `blueLink` | `#0A47F0` | Enlaces de texto: "Ver todos ›", "Cambiar", "Editar", "Limpiar", "Marcar como leídas", "Ver ofertas", "Cambiar número", "Agregar cupón", "Seguir sin complementos"; punto de no leído (38 `#0456FA`) | 08 `#0145F4`, 25 `#0141FB`, 35 `#0043F3`, 12 tab activa `#0245F7` |
| `blueText` | `#0645C8` | Texto e ícono de **opciones seleccionadas** y botones suaves/outline: chips 11/24, "Casa" (07), "Buena" (24), "Pequeño" (31), "Ver detalle"/"Volver a pedir" (36), "Reintentar" (45), "Elegir" (44), etiqueta de pestaña activa (08 `#053DD4`); borde de lo seleccionado (1,5 pt) | 36 `#0244D3`, 45 `#024BC7`, 24 `#0247C8`, 17 borde `#0630A2` |
| `blueSoft` | `#E6EEFD` | Píldora de la pestaña activa, segmento activo (10 "Platos", 26 "Destacados"), botón suave (19 "Volver al pedido", 23 "Volver a pedir"), chips de sugerencia (41), círculos de ícono (20 check, 21 pasos/llamar/candado, 35 avatar "MP", 40 avatar soporte) | 08 `#E6EDFD`, 33 `#E6ECFC`, 19 `#E5EDFD` |
| `blueTint` | `#EEF4FD` | Fondo de tarjeta/opción **seleccionada** (13 opción, 17 método, 24 "Buena", 30 tarjeta de farmacia, 31 tamaño, 37 dirección), VISA claro (20, 45), círculos de 31/39 | 13 `#EAF1FC`, 17 `#E8F1FD`, 37 `#EEF5FD`, 30 `#F0F6FD` |
| `blueChip` | `#DCEAFD` | Chip seleccionado con borde (11 "Todos"), burbuja propia en chat con repartidor (22), badge "Principal" (37) | 11 `#DAEAFD`, 22 `#DDEAFD`, 37 `#D9E8FD` |

**Amarillos, cremas y pasteles de categoría**

| Token sugerido | Hex | Uso |
|---|---|---|
| `yellow` | `#FEC516` | Amarillo del logo (`#FEC816`) |
| `star` | `#FDBF1F` | Estrellas de calificación (08 `#FEC525`, 24 `#FEBE1C`) |
| `spark` | `#FCBE04` | Trazos "destello" de banners e ilustraciones (08, 19, 41, 42) |
| `bannerYellow` | `#FDF1C2` | Fondo del banner "El sabor de la costa" (08); manchas internas `#FDE27F` y `#FDE9AA` |
| `cream` | `#FDF6E4` | Tarjeta "Comida" (08 `#FDF7E6`), banner de mercado y tile "Frutas" (25 `#FDF6E0`), tarjetas de Ofertas (33 `#FDF6EC` → foto), tile logo Bocamar (12 `#FDF6EC`) |
| `pastelMint` | `#E9F5F0` | Tarjeta "Mercado" (08), "Primeros auxilios" (29) |
| `pastelSky` | `#E5F1FD` | Tarjeta "Farmacia" (08), "Cuidado personal" (29 `#E8F2FD`), tile "Lácteos" (25 `#E6F2FC`) |
| `pastelLavender` | `#ECEFFD` | Tarjeta "Envíos" (08) |
| `pastelButter` | `#FDF5DB` | "Protección solar" (29) |
| `pastelPink` | `#FCEFF5` | "Bebés" (29) |
| `pastelLeaf` | `#EEF6E4` | tile "Verduras" (25) |
| `pastelPeach` | `#FDEFDF` | tile "Despensa" (25) |
| `offerGray` | `#F5F5F5` | Tarjeta "Descubre más" (33) |

**Neutros (texto, bordes, superficies)**

| Token sugerido | Hex | Uso | Evidencia |
|---|---|---|---|
| `ink` | `#0B0F1C` | Títulos y texto principal (negro azulado, no gris) | medianas `#060918`–`#0B0E1A` |
| `textSecondary` | `#565F73` | Subtítulos bajo H1, labels de formulario, texto de 2ª línea fuerte | 02 `#545B74`, 03 `#586172`, 16 `#4C566B` |
| `textTertiary` | `#6E7689` | Metadatos: "Ceviches · 25–35 min", "Envío $3.000", "Puerto Colombia" | 08 `#6E7688`, `#727B8F` |
| `textPlaceholder` | `#8E96A8` | Placeholders ("Busca en YAVA" `#929AAD`), ayudas (`#838BA0`), horas de chat (`#778399`) |
| `iconGray` | `#434E64` | Pin relleno del encabezado, ícono de dirección, íconos grises de filas |
| `border` | `#E3E6EC` | Inputs, stepper, opciones no seleccionadas, chips outline | 03 `#E3E5ED`, 13 `#E3E6EC`, 07 `#E0E4EA` |
| `cardBorder` | `#ECEEF3` | Borde de tarjetas blancas (1 px físico ≈ 0,5–1 pt) | 20 `#EFF2F6`, 35 `#E9EBEF`, 08 `#E9ECF2` |
| `divider` | `#E9EBF0` | Separadores de sección y de filas | 08 `#E9EBF0`, 16 `#DFE4EB` |
| `surfaceGray` | `#F1F3F6` | Botón atrás circular gris, chips inactivos (33 `#F1F2F8`, 10 `#F6F7F8`), píldora "Cambiar" (16 `#EAEDF1`), stepper relleno (27/44 `#F1F2F5`), caja "Instrucciones" (15 `#F5F6F8`) |
| `surfaceSoft` | `#F5F7FA` | Tarjetas grises: "Si falta un producto"/dirección/resumen (28 `#F7F9FB`), cabecera de 24, tarjeta del repartidor (21 `#F3F6FB`), aviso de 47 |
| `chevronCircle` | `#F3F5F9` | Círculo del chevron ⌄ junto a la dirección (08/09/10) |

**Estados**

| Token sugerido | Hex | Uso |
|---|---|---|
| `green` | `#0E8A3E` | Texto "Entregado" (`#00771D`), ícono check (`#08913A`), ícono notificación (`#0D824A`) |
| `greenSoft` | `#E6F8EE` | Badge "Entregado" (36 `#E6FAF0`), tile notificación (38 `#E4F1E9`) |
| `red` | `#DC1F2E` | Botón/borde peligro "Confirmar cancelación" (47 `#D50C1B`/`#D60218`), badge "!" (45 `#E93444`), pin de entrega (32 `#E4393A`) |
| `redSoft` | `#FDEEF0` | Círculo de la ilustración de pago fallido |
| `amber` | `#FDB405` | Ícono de aviso (44), pin destino (31 `#FCB005`) |
| `amberSoft` | `#FEF6E9` | Caja "Elimina o reemplaza…" (44); tile notif. amarilla `#FDF5E0`; círculo destino 31 `#FDF4DD` |
| `amberPill` | `#FDE196` (texto `#2A1500`) | Píldora "No disponible" (44) |
| `orange` | `#FC7324` | Pin del restaurante en el mapa (21) |
| `closedGray` | `#8D96A6` | Píldora "Cerrado" (43, texto blanco) |
| `disabledBg` / `disabledText` | `#E8E9ED` / `#8F96A6` | Botón deshabilitado claro (18 "Guardar tarjeta", 19 "Aplicar") |
| `disabledStrong` | `#B9BFCB` (texto blanco) | Botón deshabilitado de 44 "Continuar"; "+" deshabilitado de 43 `#C8CDD9` |
| `overlay` | `rgba(0,0,0,0.5)` | Velo detrás de hojas modales (11 mide 0,6; 47 mide 0,45) |

**Mapa** (06, 16, 21, 32, 46): agua `#A4D8FD`, tierra `#F2F2F3`, manzanas `#EDEDED`, parques `#DCF0C6`, vías blancas, ruta `#0558F2` de 4 pt, polígono fuera de cobertura (46) gris `#D2D2D2` al ~25 %.

### 1.2 Tipografía (SF Pro = fuente del sistema; en RN no fijar `fontFamily`)

Tamaños obtenidos de la altura de mayúsculas (cap-height SF Pro = 0,705 em).

| Estilo | pt / interlineado | Peso | Color | Dónde |
|---|---|---|---|---|
| `display` | 34 / 40, tracking −0,6 | 700 | ink | Nombre grande: 27 "Banano", 43 "Bocamar" |
| `h1` | 28 / 34, tracking −0,5 | 700 | ink | Título de página: 02 "Entra a YAVA", 03, 04, 05, 18, 19, 33 "Ofertas", 35 "Cuenta", 37, 39, 48, y 12 "Bocamar" (medidos 28–30) |
| `h2` | 25 / 30, −0,4 | 700 | ink | 13 nombre producto (26), 14 (26), 20 (24), 21 (25), 26 "Mercado del Puerto" (24), 42 (26), 45 (25,5) |
| `h3` | 22 / 27, −0,3 | 700 | ink | Título de hoja 11 "Filtros" (21), 06 "Ajusta el punto…" (22), 46 (21), 47 (23); secciones de 13 "Elige el picante"/"Instrucciones" (22); 31 título nav (23); 44 "Bocamar" (22); 41 (21) |
| `navTitle` | 18 / 22 | 600–700 | ink | Título junto al botón atrás: 06 (19), 07, 15, 16, 17, 22, 23, 24, 28, 32, 36 (20), 38, 42, 46, 48 |
| `section` | 19 / 23 | 700 | ink | "Cerca de ti", "Tiendas cercanas", "Restaurantes", "Te puede gustar", "Tu pedido", "Resumen de pago"… (en 08 mide 18) |
| `cardTitle` | 17 / 21 | 700 | ink | Tarjetas pastel ("Comida", "Cuidado personal") |
| `bodyL` | 16,5 / 22 | 600 | ink | Títulos de fila/lista (16 "Casa", 10 "Ceviche clásico", 13 "Bocamar"), texto de botones (16,5 semibold), valor de inputs (16,5 regular) |
| `body` | 15,5 / 21 | 400 | ink o `textSecondary` | Opciones, subtítulos bajo H1, descripciones |
| `bodyS` | 14 / 19 | 400 | `textTertiary` | 2ª línea de filas y tarjetas, buscador (placeholder 14,5) |
| `caption` | 13 / 17 | 400–500 | `textTertiary` | Metadatos de tarjeta, "Sin costo", notas al pie; enlaces "Ver todos ›" 13 medium `blueLink` |
| `meta` | 12 / 15 | 400 | `textTertiary` | "Puerto Colombia" del encabezado, meta del carrusel ("Ceviches · 25–35 min"), "Total a pagar" |
| `tab` | 10,5 / 13 | 500 | ink (activa `blueText`) | Barra de pestañas |
| `price` | 15 / 20 | 700 | ink | Precios en listas (10, 12 = 14,5, 15 = 16) |
| `priceL` | 25 / 30 | 700 | ink | Total en barra inferior (15 "$34.000" 24, 16 "$38.000" 26) |

Reglas: títulos en **bold 700**, nunca 800/900; precios bold; metadatos regular gris; el gris de texto es azulado (`#6E7689`), no neutro.

### 1.3 Radios

| Token | pt | Dónde |
|---|---|---|
| `r6` | 6 | Tile "VISA" (16, 23, 32), badges cuadrados |
| `r10` | 10 | Fotos dentro de filas/tarjetas (10, 15, 20, 22, 36 = 14), cajas OTP (04), inputs de 05/31 |
| `r12` | 12 | Inputs (03, 07, 13, 18), fotos del grid (12), opciones (13), tile de logo (12), botones de auth 11–12 |
| `r14` | 14 | **Tarjetas de categoría** (08 mide 14), tarjetas de lista (17), botones primarios estándar (17/37/45/48), barra de chips segmentada interior |
| `r16` | 16 | Tarjetas blancas (20, 22, 28, 34, 39, 44), franja de info (12), tarjeta grande de restaurante (10), cajas de aviso |
| `r18` | 18 | Tarjetas grandes (33 ofertas, 36 pedidos, 37 direcciones, 35 grupos), tarjeta repartidor (21) |
| `r24` | 24 | Hojas modales (06, 11, 21, 46, 47), esquinas inferiores de la portada (12) y superior de la hoja blanca (13, 26, 43), tarjeta-imagen de 30 |
| `pill` | 999 | Buscador, chips, barra de pestañas, stepper, CTAs en barras inferiores, botones circulares |

### 1.4 Sombras y bordes

| Token | RN (iOS) | Android | Dónde |
|---|---|---|---|
| `shadowSoft` | `shadowColor:'#0F172A', shadowOpacity:0.08, shadowRadius:10, shadowOffset:{width:0,height:3}` | `elevation:3` | Buscador blanco (+ borde 1 px `#EAEDF2`), chips blancos de 09, botones circulares blancos sobre fotos (12/13/26/30/43), píldora "Ajustar ubicación" (16), cuadro "Pedido #1042" y etiqueta "Tu casa" del mapa (21) |
| `shadowFloat` | `opacity:0.10, radius:18, offset:{0,6}` | `elevation:8` | **Barra de pestañas flotante y botón de búsqueda circular** (sombra visible 16 pt por debajo, se oscurece hasta `#E9EAEC`), botón localizar del mapa (06) |
| `shadowBar` | `opacity:0.06, radius:12, offset:{0,-4}` | `elevation:6` | Barras fijas inferiores sin borde (13, 15, 16, 27, 30): el fondo se oscurece ≈ 9 pt por encima |
| `shadowCard` | `opacity:0.05, radius:8, offset:{0,2}` + borde `cardBorder` | `elevation:2` | Tarjetas de tiendas (25), productos (25/29), tarjeta grande de restaurante (10) |

Las tarjetas de lista "normales" (20, 22, 34, 35, 36, 39, 44…) **no tienen sombra**, solo borde `cardBorder` de 1 px físico (`StyleSheet.hairlineWidth`–1). Las hojas modales no tienen sombra: tienen el velo `overlay`.

### 1.5 Espaciado y retícula

- **Margen lateral: 18 pt** (los bordes izquierdos miden 37–40 px = 17–18,5 pt; los botones primarios 19–21 pt). El código usa 16: cambiar a 18. Excepciones: grid de 12 (13 pt), filas de 15/16 (14 pt), imagen de 30 (7 pt).
- Columnas: tarjetas de categoría 2 × 175 pt con **10 pt** de separación (fila y columna); grid de menú (12) 179 pt con 11 pt; grid de mercado (26) 173 pt con 12 pt; tiles de mercado 4 × 83–87 pt con 8 pt; carrusel 136 pt con 6–7 pt.
- Ritmo vertical típico del inicio: encabezado → buscador 12 pt; buscador → tarjetas 13 pt; bloque → título de sección 22–26 pt; título → contenido 12 pt; separador entre secciones 1 px `divider` con 18–20 pt arriba y abajo.
- Alturas táctiles: botones circulares 32–42 pt, filas de lista 51–73 pt, CTA 42–54 pt (estándar 50).

### 1.6 Iconografía

Línea fina (trazo ≈ 1,8 pt), redondeada, color `ink`; activos en `blue`/`blueText` y rellenos. Equivalencias con `@expo/vector-icons`:

| Diseño | Ionicons |
|---|---|
| Pin del encabezado (relleno gris) | `location` (`iconGray`, 20) |
| Chevron ⌄ en círculo | `chevron-down` 14 dentro de círculo 20–24 pt `chevronCircle` |
| Bolsa del carrito | `bag-handle-outline` 26 ink |
| Buscar | `search` 22 ink (grosor visual alto) |
| Pestañas | `home`/`home-outline`, `pricetag`/`pricetag-outline`, `heart`/`heart-outline`, `person`/`person-outline` (22) |
| Chips de 09 | `options-outline` (filtros), `chevron-down`, `trophy-outline`, `flash-outline` |
| Segmentos de 10 | `storefront-outline`, `restaurant-outline` |
| Hero (12/13/26/30) | `close`, `share-outline`, `search`, `bookmark-outline`, `heart-outline`, `chevron-back` |
| Info de comercio | `time-outline`, envío = moto (`MaterialCommunityIcons` `moped-outline`, también en `@expo/vector-icons`), `star` amarilla |
| Filas | `document-text-outline`, `time-outline`, `pricetag-outline`, `cart-outline`, `location-outline`, `card-outline`, `chevron-forward` (gris `#6E7689`, 18) |
| Cuenta | `clipboard-outline`/`list`, `location-outline`, `card-outline`, `ticket-outline` (amarillo `#FDBD06`), `notifications-outline`, `help-circle-outline`, `settings-outline`, `storefront-outline`, moto |
| Otros | `trash-outline`, `add`, `remove`, `chatbubble-ellipses-outline`, `call-outline`, `lock-closed`, `headset-outline`, `attach`, `send`, `thumbs-up`, `thumbs-down-outline`, `create-outline` (lápiz), `home` (Casa), `briefcase-outline` (Trabajo), `ellipsis-horizontal` (Otro), `locate` (mira del mapa), `information-circle-outline`, `alert-circle`, `checkmark-circle`, `water-outline`, `leaf-outline`, `cube-outline`, `person-outline` |

### 1.7 Fotos, recortes e ilustraciones

Ya existen recortes de los PNG en **`apps/mobile/assets/images/diseno/`** (≈ 2,17× de densidad: usar con `expo-image`, ancho/alto en pt = px ÷ 2,17). Mapa recorte → pantalla:

| Recorte | Pantallas |
|---|---|
| `acceso-comida.jpg` | 02 franja de fotos |
| `logo-google.png`, `bandera-colombia.png` | 02, 03 |
| `categoria-comida/mercado/farmacia/envios.jpg` | 08 tarjetas pastel (lado derecho de cada tarjeta) |
| `banner-sabor-costa.jpg` | 08 banner amarillo |
| `chip-ceviches/hamburguesas/shawarmas/bebidas.jpg` | 09 tiles de categoría |
| `comercio-bocamar/naranmiche/amaras-tarjeta.jpg` (171×99 pt) | 08 carrusel "Restaurantes cerca" y 11 (fondo) |
| `comercio-bocamar/naranmiche/amaras.jpg` (354×93 pt) | 09 tarjetas anchas "Cerca de ti", 34/41 filas |
| `comercio-bocamar-portada.jpg`, `logo-bocamar.png`, `logo-bocamar-sello.png` | 12/43 portada, 12 tile de logo, 10 sello circular |
| `comercio-mercado-del-puerto-portada.jpg`, `logo-mercado-del-puerto.jpg` | 26 |
| `fachada-mercado-del-puerto.jpg`, `fachada-tienda-de-la-costa.jpg`, `banner-mercado.jpg`, `categoria-frutas/verduras/lacteos/despensa.jpg` | 25 |
| `fachada-farmacia-del-puerto.jpg`, `fachada-bienestar-caribe.jpg`, `categoria-cuidado-personal/proteccion-solar/bebes/primeros-auxilios.jpg` | 29 |
| `producto-*.jpg` (ceviche clásico/camarón/mixto, limonada natural/coco, agua, patacones, chips, banano, tomate, arroz, leche, protector solar, cepillo, apósitos; `-detalle` y `-blanco` para las portadas de 13/27/30) | 10, 12, 13, 14, 15, 20, 23, 25, 26, 27, 29, 30, 44 |
| `avatar-repartidor.jpg` / `avatar-repartidor-alt.jpg` | 21, 22 / 24 |
| `envio-caja.png` | 31 (tres tamaños), 32 |
| `oferta-combo-ceviche.jpg`, `oferta-combo-hamburguesa.jpg`, `oferta-amaras.jpg` | 33 |
| `pago-visa.png` (azul) / `pago-visa-claro.png` | 16, 23, 32 / 20, 45 |
| `notif-entregado/en-camino/confirmado.png` | 38 |
| `vacio-cupones.png`, `vacio-busqueda.png`, `vacio-canasta.png`, `pago-fallido.png`, `sin-cobertura.png`, `sin-conexion.png` | 19, 41, 42, 45, 46, 48 |

Las fotos de comercios y productos vienen de la BD (Unsplash) y no se pueden cambiar. Para que el demo se parezca al diseño, la opción recomendada es un mapa local `DESIGN_PHOTOS` (por `slug` de comercio / nombre de producto) que prefiere el recorte local y cae a `cover_url`/`image_urls` si no existe — decisión del orquestador. Las fotos siempre `contentFit="cover"` y con el radio de su contenedor.

Ilustraciones de estados vacíos: círculo pastel 80–102 pt + ícono/ilustración centrada + 2–3 trazos amarillos `spark` arriba a la derecha (19, 41, 42) o rojos (45). Si no se usa el PNG, se reproducen con `View` circular + Ionicons + 3 `View` rotados de 3 × 12 pt.

### 1.8 Componentes recurrentes (anatomía y medidas)

**C1 · Encabezado con dirección** (08, 25, 29, 33, 34; variante con atrás en 09; sin bolsa en 33)
- Alto ≈ 36 pt (y 0–36). Pin `location` relleno `iconGray` 20 pt en x 18.
- Texto en x 37 (con atrás: x 84): línea 1 "Puerto Colombia" `meta` 12 pt `textTertiary`; línea 2 "**Casa** · Calle 2 # 3-45": "Casa" 14 pt 700 ink, "·" y dirección 14 pt 500 ink.
- A la derecha del texto (8 pt), círculo 20 pt (24 pt en 09/10) `chevronCircle` con `chevron-down` 13 pt ink. Todo el bloque abre el selector de dirección.
- Bolsa `bag-handle-outline` 26 pt ink a 24 pt del borde derecho (08, 25, 29, 34), con badge del conteo si hay canasta (no aparece en el diseño con canasta vacía).
- Variante atrás (09): círculo gris 32 pt `surfaceGray` con `chevron-back` 18 pt ink en x 17; sin bolsa.
- **No** hay logo ni saludo ("Hola, María…") en el inicio: quitar el saludo actual.

**C2 · Encabezado de navegación** (cuatro variantes; todas con fondo blanco y sin borde inferior)
- C2a "círculo + título en línea" (07, 09, 10, 15, 16): botón 32–36 pt `surfaceGray` con `chevron-back` 18 ink, x 17–19; título `navTitle` 18 pt en x 54–65.
- C2b "chevron suelto + título en línea" (06 chevron `blue`; 17, 22, 24, 28, 32 centrado, 36, 38 centrado + acción derecha, 42, 46, 48): `chevron-back` 24 pt ink sin fondo en x 18; título 18–20 pt bold a 53 pt.
- C2c "chevron suelto + H1 debajo" (05, 18, 37): chevron en y ≈ 8, H1 28 pt en y ≈ 70, subtítulo `body` `textSecondary` 6 pt debajo.
- C2d "flecha ← + H1" (19, 39, 23 con título en línea, 21 dentro de círculo blanco): `arrow-back` 24 pt ink.
- Botón circular derecho opcional (22 teléfono, 14 cerrar): 36–38 pt `surfaceGray`.

**C3 · Buscador blanco** (06, 08, 09, 25, 29, 33, 34, 39, 46)
- Píldora blanca x 18 → 375 (357 pt), **alto 43 pt** (09: 42), radio pill, borde 1 px `#EAEDF2`, `shadowSoft`.
- Lupa `search` 22 ink en x 34; placeholder 14,5 pt `textPlaceholder` en x 62 ("Busca en YAVA", "Busca platos o restaurantes", "Busca productos o tiendas", "Busca productos de farmacia", "Busca una oferta", "Busca un tema", "Busca una dirección").
- Variante con texto (10, 41): mismo estilo, valor 16 pt ink, X a la derecha (10: `close` ink 20; 41: X dentro de círculo 24 pt `surfaceGray`). En 10 el buscador empieza en x 58 porque a su izquierda va el botón atrás C2a.

**C4 · Tarjeta de categoría pastel** (08 2×2; 29 2×2 más alta)
- 08: 175 × 97 pt, radio 14, fondo pastel plano (Comida `cream`, Mercado `pastelMint`, Farmacia `pastelSky`, Envíos `pastelLavender`), **sin borde ni sombra**.
- Texto arriba-izquierda, padding 14 pt lateral y ≈ 20 pt superior: título `cardTitle` 17 pt 700 ink; debajo, subtítulo 12,5 pt `#576778` en **dos líneas** ("Restaurantes / y más", "Todo para / tu casa", "Salud y / bienestar", "Paquetes / y más"), interlineado 14,5.
- Foto (recorte `categoria-*`) ocupando la mitad derecha, pegada al borde derecho e inferior (≈ 88 × 87 pt), recortada por el radio.
- 29: 174 × 106 pt, radio 16, título en 2 líneas ("Cuidado / personal") 17 pt, subtítulo 13 pt 2 líneas.

**C5 · Banner amarillo** (08; variante crema en 25)
- 08: 357 × 95 pt, radio 14, fondo `bannerYellow` con 2 manchas redondeadas `#FDE27F`/`#FDE9AA` (abajo-centro y arriba-derecha), foto del plato a la derecha (`banner-sabor-costa.jpg`, ≈ 163 × 85 pt) y 2 trazos `spark` sobre el plato.
- Texto en x 35: "El sabor de la costa" 21,5 pt 700 `blueNavy`; "Descubre tus favoritos" 14,5 pt 400 `blueNavy`.
- 25: 357 × 130 pt, radio 16, fondo `cream` `#FDF6E0`, título 25 pt 700 `blueNavy` en dos líneas ("Tu mercado, / a domicilio"), subtítulo 16 pt `#566A81` en dos líneas, foto `banner-mercado.jpg` a la derecha.

**C6 · Tile de categoría con foto** (09, 25)
- 09: 4 tiles 88 × 89 pt (el 4.º se corta: carrusel horizontal), separación 7 pt, radio 12, foto a sangre con fondo pastel propio; etiqueta debajo centrada 13 pt ink regular (6 pt de separación).
- 25: 4 tiles 83–87 × 83 pt, radio 14, separación 8 pt, etiqueta 15 pt ink centrada debajo ("Frutas", "Verduras", "Lácteos", "Despensa").

**C7 · Tarjeta de restaurante del carrusel** (08 "Restaurantes cerca"; fondo de 11)
- Sin contenedor: foto 136 × 70 pt, radio 10; separación entre tarjetas 6–7 pt; la tercera asoma cortada en el borde derecho.
- 6 pt bajo la foto: nombre 14 pt 700 ink; meta 12 pt `textTertiary` "Ceviches · 25–35 min"; fila 3: `star` 14 pt `star` + "4,8" 13 pt 600 `#4B556A` + " · Envío $3.000" 13 pt `textTertiary`. Interlineado 16–17 pt.

**C8 · Tarjeta ancha de restaurante**
- C8a (09 "Cerca de ti"): foto a lo ancho 359 × 101 pt, radio 12, sin contenedor; debajo nombre 15 pt 700, meta 13 pt `textTertiary`, fila de calificación igual a C7 (14 pt). Separación entre tarjetas ≈ 8 pt.
- C8b (10 "Restaurantes"): tarjeta 358 × 215 pt, radio 16, borde `cardBorder` + `shadowCard`; foto superior 137 pt de alto (radio solo arriba); **sello circular blanco** 82 pt (`logo-bocamar-sello.png`) superpuesto arriba-izquierda a 8 pt; cuerpo con padding 12: nombre 19 pt 700, "Ceviches · Cocina de mar" 14,5 pt `textTertiary`, "★ 4,8 · 25–35 min · Envío $3.000" 15 pt; `chevron-forward` gris a la derecha.

**C9 · Fila compacta con foto a la izquierda** (08 "Para tu próximo antojo", 34, 41)
- 08: tarjeta 198 × 72 pt (carrusel), borde `cardBorder`, radio 12; foto izquierda 89 pt a sangre (radio solo izquierdo); texto en x+100: nombre 13,5 pt 700, meta 12 pt, fila de calificación 12 pt.
- 34/41: a lo ancho (357 × 104 pt), radio 16, foto izquierda 177–185 × 104 pt; nombre 17 pt 600, categoría 15 pt `textTertiary`, "★ 4,8 · 25–35 min" 15 pt, píldora "Envío $3.000" (34: fondo `#F0F2F8`, 13,5 pt `#5D6982`, alto 24, radio pill; 41: texto simple 14,5 pt). Derecha: 34 `bookmark` relleno `#0148C9` 22 pt arriba; 41 `chevron-forward`.

**C10 · Chips**
- C10a filtro blanco (09): alto 32 pt, radio pill, fondo blanco, borde 1 px `#EDEFF3`, `shadowSoft` leve; ícono 18 ink + texto 14 pt 500 ink; padding 14. El primero es doble: segmento de 37 pt con `options-outline` + divisor vertical 1 px + "Ordenar ⌄". Separación 10 pt. Texto: "Ordenar", "Mejor valorados" (`trophy-outline`), "Hasta 35 min" (`flash-outline`).
- C10b segmento grande (10): dos píldoras de 177 × 38 pt a lo ancho (separación 8): inactiva fondo `#F6F7F8`, ícono ink, texto 15 pt `#626C83`; activa fondo `blueSoft`, ícono y texto 15 pt 600 `blueText`.
- C10c selección con borde (11, 24): 3 iguales de ≈ 114 × 30 pt (24: 38 pt), radio pill; seleccionado `blueChip` (11) o `blueTint` (24) + borde 1,5 pt `blueText` + texto 15 pt 600 `blueText`; no seleccionado blanco + borde `border` + texto 15 pt 400 `#4B5563`.
- C10d categoría rellena (33): alto 35 pt, radio pill; activa "Todas" fondo `blue` + texto blanco 16 pt 600; inactivas fondo `#F1F2F8` sin borde, ícono ink 20 + texto 15 pt ink.
- C10e sugerencia (41): fondo `blueSoft`, alto 35, `search` 18 `blueText` + texto 15,5 pt 600 `blueText`.
- C10f barra segmentada de categorías (26): contenedor 357 × 41 pt fondo `#F3F5F8` radio pill; segmento activo `blueSoft` con texto 16 pt 600 `blueText`; inactivos texto 15,5 pt `textTertiary`.

**C11 · Botón "+" circular** — fondo `blue`, `add` blanco; borde blanco 2 pt cuando va sobre foto.
- Tamaños: 26 pt (12 grid, esquina sup.-der. a 6 pt), 28 pt (25/29, abajo-der.), 32 pt (10 filas), 34 pt (26 abajo-der.).
- Variante blanca (14 "Acompañantes"): círculo blanco 28 pt con `add` ink. Variante outline (15 "Te puede gustar"): blanco con borde 2 pt `blue` y `add` `blue`. Deshabilitado (43): `#C8CDD9` con `add` blanco.

**C12 · Tarjetas de producto**
- C12a grid de menú (12): sin contenedor; foto 179 × 118 pt radio 12 con "+" 26 pt arriba-derecha; nombre 15 pt 600 (6 pt bajo la foto), descripción 12,5 pt `textTertiary` 2 líneas, precio 14,5 pt 700.
- C12b grid de mercado (26): tarjeta 173 × 217 pt, radio 14, borde `cardBorder`; foto superior 135 pt (radio arriba); cuerpo padding 10: nombre 16 pt 600, unidad "1 kg" 14 pt `textTertiary`, precio 19 pt 700; "+" 34 pt abajo-derecha.
- C12c tarjeta pequeña (25 "Lo esencial", 29 "Productos destacados"): 114–119 pt de ancho, radio 14–16, borde `cardBorder` + `shadowCard`; foto sobre blanco 101 pt; nombre 15 pt (25: 600; 29: 400 en 2 líneas), unidad 13,5 pt gris, precio 16–17 pt 700; "+" 28 pt.
- C12d horizontal (14 "Bebidas"): foto 120 × 112 pt radio 12; seleccionada con borde 2 pt `blue` y stepper interno; nombre 14 pt 500, precio 14 pt 400.
- C12e sugerencia en canasta (15): foto 173 × 90 pt radio 12, "+" outline arriba-derecha; nombre 15,5 pt 600, comercio 13 pt gris, precio 15,5 pt 700.

**C13 · Fila de producto con foto** (10)
- Foto 118 × 99 pt radio 10 en x 17; texto en x 151: nombre 16,5 pt 600, precio 15 pt 700 (4 pt debajo), descripción 13 pt `textTertiary` 2 líneas; "+" 32 pt a la derecha centrado. Separador `divider` entre filas; paso de fila 115 pt.

**C14 · Stepper**
- C14a outline (13, 30): píldora blanca 122–140 × 40 pt, borde `border`, "−" | "1" | "+" (ink 20 pt, número 17 pt 500) con divisores verticales 1 px `#E3E6EC` de 22 pt.
- C14b relleno (27, 44): fondo `#F1F2F5`, sin borde; 27: 145 × 52 pt; 44: 88 × 33 pt.
- C14c canasta (15): píldora 100 × 32 pt borde `#EBEEF3`: `trash-outline` | "1" | `add` (ink).
- C14d mercado (28): píldora 86 × 37 pt borde `border`: "−" gris claro, "1" ink, "+" `blueLink`; `trash-outline` gris suelto a la derecha.
- C14e en foto (14): píldora blanca 82 × 26 pt sobre la foto con "−" en círculo `blueSoft` y "+" en círculo `blue`.

**C15 · Botones**
- C15a primario: fondo `blue`, texto blanco 16,5 pt 600; **alto 50 pt** (rango medido 46–54), radio 14 (auth 02–07: 11–12). Ancho completo = 357 pt (márgenes 18). Variante "con precio" (14, 28, 32): texto centrado + precio y `chevron-forward` a la derecha.
- C15b píldora de barra inferior (13, 15, 16, 27, 30): alto 42–52 pt, radio pill, ancho 155–236 pt, texto 16–17 pt 600 ("Agregar · $28.000", "Continuar", "Hacer pedido").
- C15c suave: fondo `blueSoft`/`#E9F1FD`, texto `blueText` 17 pt 600, sin borde (19 "Volver al pedido" 55 pt pill; 23 "Volver a pedir" 38 pt).
- C15d outline azul: blanco, borde 1,5 pt `blueText`/`#184EFC`, texto `blueText` 16 pt 600, radio 10 (36), pill (44 "Elegir").
- C15e outline gris: blanco, borde 1 pt `#D5D9E1`, texto `blueText` 16–17 pt 600 (20 "Ver detalle", 45 "Reintentar", 46 "Volver al inicio").
- C15f peligro (47): blanco, borde 1,5 pt `red`, texto `red` 17 pt 600, radio 14.
- C15g deshabilitado: `disabledBg` + `disabledText` (18) o `disabledStrong` + blanco (44).
- C15h enlace: texto 15–16 pt 600 `blueLink`, centrado, sin fondo ("Seguir sin complementos", "Volver al inicio", "Tuve un problema", "Limpiar búsqueda", "Volver a la canasta").
- C15i social (02): blanco + borde 1 px `#D5D9E2` + logo Google 22 pt; negro `#111111` + `logo-apple` blanco; texto 16,5 pt 600; alto 51, radio 12.

**C16 · Barra inferior fija**
- C16a total + CTA (15, 16): fondo blanco, `shadowBar`, padding 18 lateral, 14 superior, `insets.bottom` inferior. Izquierda: etiqueta 13–14 pt `textTertiary` ("Subtotal", "Total a pagar") y total `priceL` 24–26 pt 700; derecha: C15b.
- C16b stepper + CTA (13, 27, 30): C14 a la izquierda + C15b ocupando el resto (separación 12–20 pt).
- C16c CTA a lo ancho (11, 17, 19, 24, 28, 31, 32, 37, 39, 42, 43, 44): sin fondo propio, el botón queda a 18 pt de los lados y justo sobre `insets.bottom`.

**C17 · Fila de lista con ícono**
- C17a checkout (16): ícono 24 ink en x 22; texto en x 63: título 16,5 pt 600, 1–2 líneas 14 pt `textTertiary`; a la derecha `chevron-forward` ink 18 o acción ("Cambiar" en píldora `surfaceGray` 82 × 33 pt, texto 15 pt 500 ink); separador `divider` de 14 a 379 pt; alto 58–73 pt.
- C17b grupo de Cuenta (35): tarjeta blanca radio 18, borde `cardBorder`; filas de 51 pt con ícono 24 `blue` en x 33, texto 17 pt 400 ink en x 82, chevron gris 18; divisores internos a todo el ancho.
- C17c tema de ayuda (39): tarjeta independiente 357 × 67 pt, radio 16, borde; círculo 42 pt `#F1F6FE` con ícono `blue` 22; título 16,5 pt 600, subtítulo 14,5 pt gris; chevron.
- C17d info de producto (30): filas de 45 pt, ícono outline 24 ink, texto 17 pt ink, chevron ink; separadores `#E5E8EE`.

**C18 · Tarjeta/opción seleccionable**
- Seleccionada: fondo `blueTint`, borde 1,5 pt `blueText` (13 no tiene borde), radio 12–18. No seleccionada: blanca, borde 1 pt `border`.
- Radio: 22 pt; marcado = aro 2 pt `blue` + punto 11 pt `blue`; sin marcar = aro 1,5 pt `#99A1AF`. Checkbox 21 pt radio 5: vacío borde `#B6BAC3`; marcado fondo `blue` + check blanco.
- Usos: 13 opciones (342 × 43 pt, radio 10), 17 métodos (366 × 68–72 pt, radio 14), 37 direcciones (362 × 106 pt, radio 18), 31 tamaños (115 × 117 pt, radio 14, radio en esquina sup.-der.), 24 "Buena/Mala" (173 × 77 pt, radio 16), 07 "Casa/Trabajo/Otro" (115 × 48 pt, radio 12).

**C19 · Inputs**
- Label arriba 14,5–15,5 pt (03/18 `textSecondary` 500; 05/07 ink 400; "(opcional)" en `textPlaceholder`), 8 pt de separación.
- Campo: alto 48 pt (03/18 52; 05 44; 31 37), radio 12, borde 1 px `border`, fondo blanco, padding 14, valor 16,5 pt ink, placeholder `textPlaceholder`.
- Foco (03): borde 2 pt `blueText` (`#0038BF`) + cursor azul. Ayuda debajo 14,5 pt `#838BA0`.
- Textarea (07, 13, 24): alto 57–92 pt, mismo estilo; contador "0/250" 12 pt gris abajo-derecha (24).
- OTP (04): 6 cajas 52 × 60 pt, radio 10, borde `#DADDE4`, dígito 26 pt 600 centrado, separación 9 pt.
- Selector (03 país, 31 tipo): igual al campo con `chevron-down` ink 20 a la derecha y bandera 27 × 20 pt (03).

**C20 · Tarjetas de pedido/comercio**
- C20a mini-comercio (20, 22, 23, 40, 45, 39): tarjeta 357–364 × 75–106 pt, radio 16–18, borde; foto 100–126 × 57–81 pt radio 10–12; nombre 17–18 pt 600; 2ª línea 15 pt `textTertiary`; chevron o datos a la derecha.
- C20b pedido (36): 366 × 153 pt, radio 18, borde `#ECF0F8`; foto 85 × 81 pt radio 14; nombre 19 pt 600, "2 productos" 15,5 gris; badge "✓ Entregado" arriba-derecha; fecha "Hoy · 12:40" 15 pt gris; total 18 pt 700; fila de 2 botones de 168 × 35 pt (C15d + C15a radio 10).
- C20c resumen de precios (16, 20, 23, 28, 32, 44): filas 14–15 pt (etiqueta `textTertiary`, valor ink), paso 22–25 pt; separador; "Total"/"Total pagado" 16–18 pt 700 + valor 18–19 pt 700. En 28 y 32 va dentro de tarjeta (`#F7F9FB` radio 16 / blanca con borde).

**C21 · Barra de pestañas FLOTANTE + botón de búsqueda** (08, 33, 34, 35 — solo en las 4 raíces)
- Cápsula blanca x 17 → 316 pt (**299 × 54 pt**), radio pill, `shadowFloat`, sin borde. Abajo a `insets.bottom − 2` (en el PNG su borde inferior queda 32 pt sobre el fondo de pantalla).
- 4 ítems de 75 pt: ícono 22 pt (contorno ink; activo relleno `blue`) a 12 pt del tope; etiqueta 10,5 pt 500 (ink; activa `blueText`) 4 pt debajo.
- Ítem activo: **píldora `blueSoft` 76 × 38 pt** detrás de ícono+etiqueta, a 5 pt del borde izquierdo de su celda y 8 pt del tope.
- Botón de búsqueda separado: círculo blanco **53 pt** a 6 pt a la derecha de la cápsula (x 322 → 375), misma sombra, `search` 24 ink. Navega a `/search`.
- El contenido de la pantalla pasa por detrás (scroll con `paddingBottom` ≈ 100 pt). Implementar con `tabBar={(props) => <FloatingTabBar …/>}` en `(tabs)/_layout.tsx` (fondo transparente, `position:'absolute'`).

**C22 · Hojas modales**
- Radio superior 24 pt, fondo blanco, asa 29 × 4 pt `#D0D2D6` centrada a 8 pt del tope, padding lateral 18–20, velo `overlay`.
- 11 "Filtros" y 47 "¿Cancelar tu pedido?": título `h3` + acción derecha ("Limpiar" `blueLink` 16 pt 600 y `close` ink 22; o solo `close`).
- 14 "Completa tu pedido": hoja casi completa (iOS `presentation: "modal"` tipo tarjeta; en el PNG la barra de estado queda negra detrás).
- 06/21/46: hoja fija sobre el mapa (no modal), mismo radio y asa.

**C23 · Estado vacío/ilustrado** (19, 41, 42, 45, 46, 48)
- Ilustración centrada (80–114 pt), 24 pt de separación al título; título `h2`/`h3` centrado; cuerpo 16–17 pt `textSecondary` centrado (máx. 2 líneas, ancho ≈ 280 pt); CTA C15a o enlace C15h 20–24 pt debajo.

**C24 · Badges**
- "Entregado" (36/39): píldora `greenSoft`, `checkmark-circle` `#08913A` 16 + texto 14 pt 500 `#00771D`, alto 24, padding 10.
- "Principal" (37): píldora `blueChip`, 14 pt 500 `blueText`, alto 22.
- "Cerrado" (43): píldora `closedGray`, 15 pt 500 blanco, alto 24.
- "No disponible" (44): píldora `amberPill`, `alert-circle` ink 16 + 14 pt 500 `#2A1500`, alto 27.
- Etiqueta de tiempo sobre foto (29): píldora blanca 22 pt con `time-outline` 15 + "30–40 min" 13 pt ink, abajo-derecha a 8 pt.

**C25 · Portada con botones flotantes** (12, 13, 26, 30, 43)
- Foto a sangre desde el tope de la pantalla (bajo la barra de estado): 12 → 205 pt de alto total, esquinas inferiores radio 24; 13 → 240 pt y la hoja blanca la monta con radio 24; 26 → 163 pt + hoja radio 24; 43 → 253 pt + hoja radio 24; 30 → tarjeta-imagen 379 × 388 pt radio 24 a 7 pt de los bordes.
- Botones: círculos blancos 38 pt (`shadowSoft`), íconos 20 ink, a 13 pt del borde y `insets.top + 10`; a la derecha grupo con separación 7 pt (12: compartir, buscar, guardar; 13: compartir, guardar; 26: buscar, corazón; 30: compartir, corazón).

**C26 · Franja de info en 3 columnas** (12): 357 × 64 pt, radio 16, borde `#E8EAF1`; columnas separadas por líneas verticales 1 px `#E6E9EF`; arriba etiqueta 12,5 pt `textTertiary` + ícono 16 ("Entrega en ⏱", "Envío 🛵", "Calificación ★"), abajo valor 14 pt 600 ink ("25–35 min", "$3.000", "4,8 (120)" con "(120)" gris).

**C27 · Pestañas subrayadas** (12, 34, 36): texto 15–17 pt; activa 600 `blueLink`, subrayado 2,5–3 pt `blue` del ancho del texto (12) o de media pantalla (34/36); inactivas 400 `textTertiary`; línea base 1 px `#E8ECF2` a todo el ancho.

**C28 · Chat** (22, 40)
- Encabezado C2b con avatar 42 pt + nombre 18 pt 700 + subtítulo 15 pt gris; tarjeta del pedido C20a debajo.
- Burbuja entrante: fondo `#EDEEF2`, radio 18, padding 14 × 12, texto 16,5–17 pt ink; avatar 37 pt a la izquierda; hora 13 pt `#778399` debajo alineada a la burbuja.
- Burbuja propia: 22 → fondo `blueChip` + texto ink; 40 → fondo `blue` + texto blanco. Hora + `checkmark-done` `blueText` debajo a la derecha.
- Compositor: botón izquierdo (22 círculo `#EAEBEC` 38 pt con `add`; 40 `attach` gris suelto), campo píldora 42–47 pt (22 blanco con borde `#E8EAF0`; 40 relleno `#F2F4F6`), placeholder 17 pt "Escribe un mensaje", botón enviar círculo `blue` 42 pt con `send` blanco.

**C29 · Línea de tiempo** — 21 horizontal: 3 nodos 38 pt (hecho: `blueSoft` + `checkmark` `blue`; actual: `#0049DD` sólido + moto blanca), conectores 3 pt (hecho `#A9C5F5`, actual `blue`), etiqueta 15,5 pt ink + hora 14 pt gris centradas. 47 (fondo): nodos 12 pt, etiqueta activa `blueText` 15 pt.

**C30 · Tarjeta de mapa** (16, 32): mapa estático 368 × 119 pt (16) / 362 × 152 pt (32), radio 14–18; pin `blue` con halo; 16 lleva píldora blanca "Ajustar ubicación ⌖" 140 × 26 pt centrada abajo.

---

## 2. Pantallas

Formato: **PNG** · **Archivo actual** · **Web** (ruta + estado) · **Elementos** de arriba abajo (y en pt desde el tope del contenido) · **Fotos** · **Ojo** (diferencias principales con lo que hay hoy).

### 01 · Apertura
- **PNG**: `tanda-01/01-apertura.png`
- **Archivo**: splash nativo (`app.json` → `expo-splash-screen`) y luego `src/components/customer/auth/Apertura.tsx` mientras carga la sesión. No hay ruta.
  - **iOS**: `assets/images/splash-logo-ios.png` con `imageWidth: 229` sobre blanco. Es el logo horizontal a 229 × 64 pt (como lo dibuja la Apertura) con 13,6 pt transparentes debajo, así que queda centrado 6,8 pt por encima de la mitad, igual que la Apertura.
  - **Android**: sigue con `assets/images/splash-icon.png` e `imageWidth: 200` (en Android 12+ el ícono del splash va dentro de una máscara que recorta las imágenes anchas).
- **Web**: no aplica (comparar solo el logo).
- **Elementos**: fondo blanco; logo horizontal aprobado centrado (x 82–311 pt, **229 pt de ancho**, 63 pt de alto, centro vertical ≈ 50 % de la pantalla). Nada más.
- **Ojo**: hecho en iOS el 29 oct 2026; se verá en el próximo build nativo (el splash no viaja por OTA). El splash y la Apertura dibujan el logo con el mismo tamaño (229 × 64 pt) y en la misma posición, así que no hay salto visible al pasar de uno a otro. `splash-logo-ios.png` debe ir en el mismo commit que `app.json`: sin él falla el prebuild de iOS.

### 02 · Acceso y registro
- **PNG**: `tanda-01/02-acceso.png` · **Archivo**: `app/(auth)/login.tsx` · **Web**: `/login --login ninguno`
- **Elementos**:
  1. y 35: logo horizontal 100 × 27 pt en x 22; "Omitir" 13 pt 400 `blueLink` (`#003CBB`) alineado a la derecha (margen 21), centrado verticalmente con el logo.
  2. y 123: "Entra a YAVA" `h1` 28 pt; y 158 "Tus favoritos, a un paso." 18 pt `textSecondary`.
  3. y 209: franja de fotos `acceso-comida.jpg` 355 × 151 pt, radio 20 (ceviche, hamburguesa, shawarma).
  4. y 401: botón Google (C15i blanco) 51 pt; y 465 botón Apple (negro) 51 pt; separación 12.
  5. y 544: divisor "— o —" (líneas `divider`, "o" 15 pt gris).
  6. y 567: "Continuar con celular" C15a 51 pt, radio 11.
  7. y 662: "Si ya tienes cuenta, iniciaremos sesión. / Si eres nuevo, crearemos una para ti." 15 pt `textTertiary` centrado.
  8. y 735: "Al continuar, aceptas los **Términos** y la **Política de privacidad**." 12 pt gris con enlaces `blueLink`.
- **Ojo**: el diseño no tiene enlace "Entrar con correo"; si se conserva, hacerlo discreto bajo el pie.

### 03 · Número de celular
- **PNG**: `tanda-01/03-celular.png` · **Archivo**: `app/(auth)/phone.tsx` · **Web**: `/phone --login ninguno`
- **Elementos**:
  1. y 10: botón atrás C2a 36 pt (`#ECECF1`) en x 19.
  2. y 115: "Tu número de celular" `h1`; y 152 "Te enviaremos un código para entrar o crear tu cuenta." 15,5 pt `textSecondary`.
  3. y 212: label "País" 14,5 pt 500 `textSecondary`; y 235 selector 48 pt (C19) con bandera `bandera-colombia.png` + "Colombia (+57)" 17,5 pt + `chevron-down`.
  4. y 309: label "Celular"; y 336 campo activo 50 pt con borde 2 pt `#0038BF`, "300 123 4567" 19 pt.
  5. y 396: ayuda "Usaremos este número para tu entrega." 14,5 pt `#838BA0`.
  6. CTA "Continuar" C15a 52 pt radio 14 **pegado sobre el teclado numérico** (KeyboardAvoidingView), margen 19.
- **Ojo**: el selector de país es un campo con borde, no texto suelto.

### 04 · Verificación
- **PNG**: `tanda-01/04-verificacion.png` · **Archivo**: `app/(auth)/verify.tsx` · **Web**: `/verify?phone=3001234567 --login ninguno`
- **Elementos**: atrás C2a 36 pt; y 88 "Revisa tus mensajes" `h1`; y 126 "Ingresa el código que enviamos al / +57 300 123 4567." 17,5 pt `textSecondary` (2 líneas); y 178 "Cambiar número" 17 pt 500 `blueLink`; y 225 seis cajas OTP 52 × 60 pt (C19); y 316 "Reenviar código en 00:28" 15,5 pt `textTertiary`; CTA "Verificar" 53 pt radio 11 sobre el teclado.

### 05 · Datos personales
- **PNG**: `tanda-01/05-datos-personales.png` · **Archivo**: `components/customer/screens/PersonalDataForm.tsx` (rutas `(auth)/personal-data.tsx` y `(customer)/personal-data.tsx`) · **Web**: `/personal-data`
- **Elementos**: chevron suelto C2c (x 19, y 15); y 70 "Completa tus datos" `h1`; y 105 "Así sabremos quién recibe el pedido." 17 pt `textSecondary`; labels 15,5 pt ink regular ("Nombre", "Apellidos", "Correo electrónico") con campos de 44 pt radio 10 borde `#D7D9E0` (y 175, 264, 356); y 430 checkbox 21 pt + "Quiero recibir novedades y ofertas" 16 pt; abajo CTA "Guardar y continuar" 46 pt radio 11 (`#003D94`) y debajo "Puedes editar tus datos desde tu cuenta." 13,5 pt gris centrado.

### 06 · Ubicación
- **PNG**: `tanda-01/06-ubicacion.png` · **Archivo**: `components/customer/screens/LocationPicker.tsx` (`(auth)/location.tsx`, `(customer)/location.tsx`) · **Web**: `/location` (+ S-LOC)
- **Elementos**:
  1. y 12: `chevron-back` **azul** `blue` 24 + "Ubicación de entrega" 19 pt 700 en x 55.
  2. y 50: buscador C3 "Busca una dirección" (42 pt).
  3. y 109 → 557: mapa a todo el ancho (paleta de mapa), pin `blue` 26 × 36 pt con punto blanco y debajo punto azul 10 pt con halo `blueSoft` 34 pt; botón localizar círculo blanco 50 pt con `locate` `blue` a 14 pt del borde derecho, `shadowFloat`.
  4. Hoja fija (C22) desde y 553: asa; "Ajusta el punto de entrega" 22 pt 700; "Mueve el mapa hasta tu ubicación." 15,5 pt `textSecondary`; tarjeta de dirección 357 × 64 pt radio 14 borde `border` con pin `iconGray` 22 + "Calle 2 # 3-45" 16 pt 600 + "Puerto Colombia, Atlántico" 14 pt gris; CTA "Confirmar ubicación" 48 pt radio 12.
- **Ojo**: el diseño no tiene "Ingresar dirección manualmente" visible (puede ir como enlace pequeño si es necesario).

### 07 · Dirección de entrega (detalles)
- **PNG**: `tanda-01/07-direccion.png` · **Archivo**: `components/customer/screens/AddressForm.tsx` (`(auth)/address.tsx`, `(customer)/address.tsx`) · **Web**: `/address?lat=10.9871&lng=-74.9541`
- **Elementos**:
  1. y 16: atrás C2a 36 pt `#F5F6F8` + "Detalles de la dirección" 18,5 pt 700.
  2. y 81: fila de dirección: pin `iconGray` 22 en x 25; "Calle 2 # 3-45" 16 pt 700; "Puerto Colombia, Atlántico" 14 pt `textTertiary`; "Cambiar" 15 pt 600 `blueText` a la derecha. Separador en y 138.
  3. y 165: "Apartamento, casa u oficina **(opcional)**" 15 pt ink + gris; campo 46 pt "Apto. 302".
  4. y 260: "Instrucciones de entrega (opcional)"; textarea 92 pt "Tocar el timbre al llegar.".
  5. y 405: "Guardar como" 15 pt; 3 tarjetas C18 115 × 48 pt: "Casa" seleccionada (`blueSoft`, borde 1,5 `#1348F6`, `home` relleno `blue`, texto 16 pt 600 `blueText`), "Trabajo" (`briefcase-outline`), "Otro" (`ellipsis-horizontal`) blancas con borde `#E0E4EA`.
  6. y 502: checkbox marcado `blue` 22 pt radio 6 + "Establecer como dirección principal" 15,5 pt.
  7. Abajo: CTA "Guardar dirección" 48 pt radio 12.

### 08 · Inicio
- **PNG**: `tanda-01/08-inicio.png` · **Archivo**: `app/(customer)/(tabs)/index.tsx` + `(tabs)/_layout.tsx` + `components/customer/{AddressHeader,CategoryGrid,PromoBanner,MerchantCard,SectionHeader}.tsx` · **Web**: `/` (+ S-LOC)
- **Elementos**:
  1. y 0–36: encabezado C1 con bolsa.
  2. y 48,5: buscador C3 "Busca en YAVA" (43 pt).
  3. y 105 / 211,5: 2 × 2 tarjetas C4 (175 × 97, separación 10): Comida, Mercado, Farmacia, Envíos.
  4. y 319: banner C5 "El sabor de la costa / Descubre tus favoritos" (357 × 95).
  5. y 435: "Restaurantes cerca" `section` 18 pt + "Ver todos ›" 13 pt 500 `blueLink` a la derecha.
  6. y 465: carrusel C7 (fotos 136 × 70) Bocamar, Naranmiche, Amaras (la 3.ª cortada).
  7. y 602: separador `divider` de 18 a 375 pt.
  8. y 617: "Para tu próximo antojo" + "Ver todos ›".
  9. y 647: carrusel de filas compactas C9 (198 × 72 pt): Amaras, Bocamar…
  10. y 729: barra de pestañas flotante C21 (Inicio activo) + botón de búsqueda.
- **Fotos**: `categoria-*.jpg`, `banner-sabor-costa.jpg`, `comercio-*-tarjeta.jpg`.
- **Ojo**: hoy `CategoryGrid` usa tarjetas blancas con íconos y `PromoBanner` usa fotos de Unsplash; la barra de pestañas es la estándar con borde; hay saludo "Hola, María…" y `CartBar` encima: todo eso no está en el diseño. El carrusel de "Restaurantes cerca" usa `MerchantCardWide` de 240 pt → debe ser C7 de 136 pt.

### 09 · Restaurantes
- **PNG**: `tanda-02/09-restaurantes.png` · **Archivo**: `app/(customer)/restaurants.tsx` · **Web**: `/restaurants?category=food` (+ S-LOC)
- **Elementos**:
  1. y 7: encabezado C1 variante atrás (círculo 32 pt), sin bolsa.
  2. y 52: buscador "Busca platos o restaurantes" (42 pt).
  3. y 110: chips C10a (alto 32): [≡ | Ordenar ⌄], [🏆 Mejor valorados], [⚡ Hasta 35 min] (scroll horizontal).
  4. y 161: tiles C6 (88 × 89): Ceviches, Hamburguesas, Shawarmas, Bebidas + etiquetas en y 256.
  5. y 294: "Cerca de ti" `section` 19 pt (sin "Ver todos").
  6. y 320 / 481 / 639: tarjetas anchas C8a (foto 101 pt) Bocamar, Naranmiche, Amaras con nombre/meta/calificación.
- **Fotos**: `chip-*.jpg`, `comercio-*.jpg` (354 × 93).
- **Ojo**: sin barra de pestañas ni `CartBar`. Hoy hay chips extra ("Abierto ahora", etiquetas), título "Restaurantes cerca" y filas `MerchantRow`; el diseño usa tiles con foto y tarjetas anchas.

### 10 · Búsqueda (con resultados)
- **PNG**: `tanda-02/10-busqueda.png` · **Archivo**: `app/(customer)/search.tsx` · **Web**: `/search?q=ceviche` (+ S-LOC)
- **Elementos**:
  1. y 15: atrás C2a 32 pt en x 17 + buscador C3 con valor "ceviche" y `close` (x 58 → 375, 44 pt, y 9).
  2. y 66: segmentos C10b "Restaurantes" / "Platos" (activo).
  3. y 119: fila "📍 Resultados cerca de **Casa · Calle 2 # 3-45** ⌄" 15 pt `#626C83` + ink, chevron en círculo 24 pt.
  4. y 158: filas C13 (×3): Ceviche clásico $28.000, Ceviche mixto $34.000, Ceviche de camarón $32.000, con separadores; separador final en y 502.
  5. y 522: "Restaurantes" `section` 19 pt.
  6. y 554: tarjeta C8b de Bocamar con sello circular.
- **Fotos**: `producto-ceviche-*.jpg`, `comercio-bocamar-portada.jpg` (recortada) + `logo-bocamar-sello.png`.
- **Ojo**: hoy hay encabezado "Buscar", buscador gris y listas de 52 pt sin botón "+". Falta el segmento Restaurantes/Platos (filtra los resultados por `kind`).

### 11 · Filtros
- **PNG**: `tanda-02/11-filtros.png` · **Archivo**: `app/modal/filters.tsx` · **Web**: `/modal/filters` (en web se ve sin el fondo; en iOS como hoja sobre 08/09)
- **Elementos**:
  1. Fondo: pantalla de restaurantes con velo `overlay`.
  2. Hoja C22 desde y 302 (ocupa el resto, radio 24); asa en y 309.
  3. y 330: "Filtros" 21 pt 700; a la derecha "Limpiar" 16 pt 600 `blueLink` y `close` 22 ink.
  4. y 365: "Ordenar por" 17 pt 600; 3 radios C18 (22 pt) con texto 16 pt: Recomendados (marcado), Menor tiempo de entrega, Mejor calificación — paso 27,5 pt; separador.
  5. "Tiempo de entrega" + 3 chips C10c (Todos ✓, Hasta 30 min, Hasta 45 min); separador.
  6. "Costo de envío" + (Todos ✓, Gratis, Hasta $3.000); separador.
  7. "Calificación" + (Todas ✓, 4,5 o más).
  8. y 748: "Aplicar filtros" C15a **pill** 36 pt (texto 15,5 pt).
- **Ojo**: hoy es una pantalla completa con encabezado, chip "Hasta 35 min" y fila "Abierto ahora": el diseño no los tiene. Chips de 3 columnas iguales, no scroll horizontal.

### 12 · Menú del restaurante (Bocamar)
- **PNG**: `tanda-02/12-bocamar-menu.png` · **Archivo**: `app/(customer)/merchant/[id].tsx` (sirve 12, 26, 43) · **Web**: `/merchant/c0000000-0000-0000-0000-000000000001`
- **Elementos**:
  1. Portada C25 de 205 pt (desde el tope de la pantalla), esquinas inferiores radio 24; botones: `close` a la izquierda; compartir, buscar y guardar a la derecha.
  2. y 186: tile de logo 57 pt `cream` radio 12 (`logo-bocamar.png`) en x 22; a su derecha "Bocamar" 29 pt 700 (x 93) y "Ceviches y sabores del Caribe" 15 pt `textTertiary`.
  3. y 251: franja C26 (Entrega en 25–35 min · Envío $3.000 · Calificación 4,8 (120)).
  4. y 337: pestañas C27 "Más pedidos" (activa), "Ceviches", "Acompañantes", "Bebidas" (scroll horizontal, pegajosas); línea base en y 364.
  5. y 377: grid C12a 2 columnas (Ceviche clásico, Ceviche de camarón, Ceviche mixto, Limonada natural…), filas cada ≈ 205 pt.
- **Fotos**: `comercio-bocamar-portada.jpg`, `producto-*.jpg`.
- **Ojo**: hoy hay logo circular sobre la portada, franja gris sin bordes, chips en vez de pestañas y lista en vez de grid. "Más pedidos" es una pestaña sintética (productos destacados) antes de las categorías de la BD.

### 13 · Detalle del producto (Ceviche clásico)
- **PNG**: `tanda-02/13-ceviche-detalle.png` · **Archivo**: `app/(customer)/product/[id].tsx` (sirve 13, 27, 30) · **Web**: `/product/e0000000-0000-0000-0000-000000000001`
- **Elementos**:
  1. Foto de 240 pt desde el tope de la pantalla; `close` blanco 36 pt a la izquierda; compartir y guardar a la derecha (C25).
  2. Hoja blanca con radio superior 24 que monta la foto desde y 197; padding lateral **25 pt**.
  3. y 218: precio "$28.000" 18 pt 700; y 240 "Ceviche clásico" `h2` 26 pt; descripción 15,5 pt `textSecondary`.
  4. y 308: fila de comercio: foto circular 47 pt + "Bocamar" 16 pt 600 + "Ceviches · 25–35 min" 15 pt gris + `chevron-forward`; separador de 12 a 381 pt.
  5. y 385: "Elige el picante" 22 pt 700; "Obligatorio · 1 opción" 14,5 pt gris; 3 opciones C18 de 43 pt (Sin picante seleccionada con fondo `blueTint` sin borde; Suave y Picante con borde) y "Sin costo" 13 pt gris a la derecha.
  6. Separador; "Instrucciones (opcional)" 22 pt 700 + "(opcional)" 17 pt gris; textarea 57 pt "Alguna indicación para la cocina…".
  7. Barra inferior C16b: stepper C14a 140 × 41 pt + CTA pill "Agregar · $28.000" 206 × 43 pt.
- **Fotos**: `producto-ceviche-clasico-detalle.jpg`.
- **Ojo**: hoy la foto es de 280 pt con un solo botón atrás, el nombre del comercio va arriba en azul y los grupos muestran badge "Obligatorio"; el diseño los pone como subtítulo gris. El grupo opcional "Complementos" del seed no aparece aquí: va en la 14.

### 14 · Complementos
- **PNG**: `tanda-02/14-complementos.png` · **Archivo**: **no existe** (hoy los extras son un grupo dentro de 13). Proponer `app/(customer)/product/[id]/complements.tsx` o `app/modal/complements.tsx`, abierto tras "Agregar" en 13.
- **Web**: (cuando exista) `/modal/complements?product=e0000000-0000-0000-0000-000000000001` + S-CART.
- **Elementos**:
  1. Hoja modal tipo tarjeta (iOS `presentation:"modal"`), radio 24, asa 37 × 4 pt.
  2. "Completa tu pedido" `h2` 26 pt + "De Bocamar" 16 pt gris; botón `close` en círculo `surfaceGray` 36 pt a la derecha.
  3. "Bebidas" 18 pt 700 + "Ver todas ›"; carrusel C12d (Limonada natural seleccionada con stepper C14e; Agua; Limonada de coco con "+" C11).
  4. "Acompañantes" + "Ver todos ›"; 2 tarjetas 172 pt (Patacones $7.000, Chips de plátano $5.000) con "+" blanco.
  5. Separador; "Tu pedido actual" 18 pt 700 + "Editar ›"; filas con miniatura 51 pt radio 10, nombre 15 pt, precio 14 pt + "x1" 13 pt gris a la derecha.
  6. Separador; "Subtotal" 16 pt 700 / "$34.000" 17 pt 700.
  7. CTA pill a lo ancho 42 pt "Continuar" (centro) + "$34.000 ›" (derecha); debajo enlace "Seguir sin complementos".
- **Fotos**: `producto-limonada-natural.jpg`, `producto-agua.jpg`, `producto-limonada-coco.jpg`, `producto-patacones.jpg`, `producto-chips-platano.jpg`.

### 15 · Tu canasta
- **PNG**: `tanda-02/15-canasta.png` · **Archivo**: `app/(customer)/cart.tsx` (sirve 15, 28, 42, 44) · **Web**: `/cart` + S-CART
- **Elementos**:
  1. y 9: C2a "Tu canasta".
  2. y 57: fila del comercio: miniatura 59 pt radio 10 + "Bocamar" 18 pt 700 + "Ceviches · 25–35 min" 16 pt gris; separador en y 130.
  3. y 141 / 230: líneas de producto: foto 77 × 67 pt radio 10; nombre 16 pt 500, precio 16 pt 700, opción "Sin picante" 13 pt gris; stepper C14c a la derecha; separadores.
  4. y 323: "⊕ Agregar más productos" (círculo `blue` 26 pt + texto 16 pt 600 `blueLink`).
  5. y 367: fila "Instrucciones del pedido (opcional)" en caja `#F5F6F8` 366 × 51 pt radio 14, ícono `document-text-outline` en círculo 34 pt + chevron.
  6. y 449: "Productos" 15 pt / "$34.000" 15,5 pt 600; y 474 "El envío y el servicio se calculan al continuar." 13 pt gris; separador en y 503.
  7. y 524: "Te puede gustar" 19 pt; 2 tarjetas C12e (Patacones $7.000, Chips de plátano $5.000).
  8. Barra C16a: "Subtotal" / "$34.000" + "Continuar" pill 155 × 43 pt.
- **Ojo**: hoy hay papelera en el encabezado, un `Input` visible para notas, "Resumen de pago" con envío/servicio y el botón con total: el diseño solo muestra "Productos" + nota.

### 16 · Revisar y pagar (Finalizar pedido)
- **PNG**: `tanda-02/16-pago.png` · **Archivo**: `app/(customer)/checkout.tsx` · **Web**: `/checkout` + S-CART + S-LOC
- **Elementos**:
  1. y 10: C2a "Finalizar pedido".
  2. y 52: tarjeta de mapa C30 (368 × 119, x 12) con pin y píldora "Ajustar ubicación".
  3. y 179: filas C17a: 📍 "Casa" / "Calle 2 # 3-45, Apto. 302" / "Puerto Colombia" ›; 📄 "Entrega en la puerta" / "Tocar el timbre al llegar" ›; ⏱ "Entrega estimada" / "25 – 35 min" ›; VISA "Pago" / "Visa •••• 4242" + píldora "Cambiar"; 🏷 "Cupón" / "Agregar cupón" (`blueLink`) ›; 🛒 "Resumen de Bocamar" / "2 productos" ⌄.
  4. y 557: C20c sin tarjeta: Productos $34.000 · Envío $3.000 · Servicio $1.000; separador; "Total" $38.000.
  5. Barra C16a: "Total a pagar" / "$38.000" + "Hacer pedido" (pill 176 × 47 pt).
- **Fotos**: `pago-visa.png`; mapa estático.
- **Ojo**: hoy no hay mapa, el título es "Revisar y pagar" y el botón dice "Pagar $…". Título del diseño: "Finalizar pedido". El estado fuera de cobertura (46) hoy está aquí como `EmptyState`.

### 17 · Métodos de pago
- **PNG**: `tanda-03/17-metodos-pago.png` · **Archivo**: `app/(customer)/payment-methods.tsx` · **Web**: `/payment-methods?select=1`
- **Elementos**: C2b "Método de pago" (título en x 53); y 75 "Elige cómo pagar este pedido." 15 pt `textSecondary`; tarjetas C18 de 366 pt (x 13): Visa ••••4242 / Tarjeta de crédito (seleccionada, 68 pt), Efectivo / Paga en la entrega (72 pt), "+" en círculo `blueSoft` 40 pt "Agregar tarjeta / Guarda una nueva tarjeta" (71 pt); todas con `chevron-forward`; separación 9 pt. Abajo CTA "Confirmar método" 54 pt radio 14 (x 15 → 377).
- **Ojo**: hoy hay "Nequi / Daviplata" y "Tarjeta de crédito o débito" como filas `RadioRow`, y "Agregar tarjeta" como botón inferior. El diseño muestra solo las tarjetas guardadas + Efectivo + Agregar (Nequi puede quedar como tarjeta adicional con el mismo estilo).

### 18 · Agregar tarjeta
- **PNG**: `tanda-03/18-agregar-tarjeta.png` (¡escala 2,224 px/pt!) · **Archivo**: `app/(customer)/add-card.tsx` · **Web**: `/add-card`
- **Elementos**: C2c; "Agregar tarjeta" `h1`; subtítulo 2 líneas 16 pt `textSecondary`; labels 14,5 pt 600 `#4A5265`; "Número de tarjeta" campo 52 pt con `card-outline` gris a la derecha (placeholder "0000 0000 0000 0000"); "Nombre del titular" ("Como aparece en la tarjeta"); fila de 2 columnas (separación 16): "Vencimiento" (MM/AA) y "CVV" (••• con `help-circle-outline`); checkbox "Guardar para próximos pedidos" 15,5 pt; `lock-closed` gris + "Tus datos se procesarán de forma segura." 13,5 pt gris; botón **dentro del flujo** (no fijo abajo) "Guardar tarjeta" 52 pt radio 14 deshabilitado (`disabledBg`/`disabledText`) hasta que el formulario sea válido.

### 19 · Cupón
- **PNG**: `tanda-03/19-cupon.png` · **Archivo**: `app/(customer)/coupon.tsx` · **Web**: `/coupon` + S-CART
- **Elementos**: `arrow-back` (C2d) en y 9; y 47 "Agregar cupón" `h1`; y 101 "Código del cupón" 14,5 pt `textSecondary`; campo 353 × 59 pt radio 14 con placeholder "Escribe tu código" 17 pt y botón interno "Aplicar" (88 × 43 pt, radio 12, `disabledBg` + `#9AA1B0`; activo = `blue`); separador en y 205; "Tus cupones" 19 pt 700; estado vacío C23 (`vacio-cupones.png` 102 pt) "No tienes cupones disponibles" 17 pt 600 / "Revisa las ofertas para descubrir promociones." 15 pt / "Ver ofertas ›" 16 pt 600 `blueLink`; abajo "Volver al pedido" C15c pill 55 pt.

### 20 · Pedido confirmado
- **PNG**: `tanda-03/20-pedido-confirmado.png` · **Archivo**: `app/(customer)/order/[id]/confirmed.tsx` · **Web**: `/order/90000000-0000-0000-0000-000000001042/confirmed`
- **Elementos**:
  1. y 8: círculo 53 pt `#E0EAFD` con `checkmark` `blue` 26 pt, centrado.
  2. y 70: "Pedido confirmado" 24 pt 700; "Bocamar ya recibió tu pedido." 16 pt `textSecondary`; "#1042" 14 pt `textPlaceholder` (todo centrado).
  3. y 145: tarjeta C20a 357 × 85 pt: foto 100 × 69 pt; "Bocamar" 18 pt 600 / "Ceviches" 15 pt; divisor vertical; "Llegará en" 13 pt gris / "25–35 min" 22 pt 700.
  4. y 240: tarjeta "Tu pedido" (17 pt 700): filas con foto 57 pt, nombre 15,5 pt 500, precio unitario 15 pt gris, "1 x" gris, total a la derecha; C20c dentro ("Total pagado" 16 pt 700 / "$38.000" 18 pt 700).
  5. y 540: tarjeta "Dirección de entrega" (pin en círculo `#ECF4FD` 38 pt): "Casa · Calle 2 # 3–45, Apto. 302" / "Puerto Colombia".
  6. y 618: tarjeta "Método de pago" (`pago-visa-claro.png`): "Visa •••• 4242".
  7. y 688: "Seguir pedido ›" C15a pill 42 pt; y 740 "Ver detalle" C15e 37 pt.
- **Ojo**: hoy el secundario es "Volver al inicio" (ghost); el diseño pide "Ver detalle" outline.

### 21 · Seguimiento
- **PNG**: `tanda-03/21-seguimiento.png` · **Archivo**: `app/(customer)/order/[id]/index.tsx` (+ `components/customer/Timeline.tsx`) · **Web**: `/order/<id>` — **no alcanzable con datos demo** (el #1042 redirige a entregado); usar fixture.
- **Elementos**:
  1. Mapa a pantalla completa bajo la barra de estado (agua/tierra de la paleta), ruta `#0558F2` 4 pt; pin del restaurante naranja `#FC7324` con `restaurant` blanco + etiqueta "Bocamar / Calle 3 # 4-10" (14 pt 700 / 13 pt); moto ilustrada con halo `blueSoft`; pin casa `blue` con `home` blanco + tarjeta blanca "Tu casa / Calle 2 # 3-45 / Apto. 302" (radio 10, `shadowSoft`).
  2. y 6: botón `arrow-back` en círculo blanco 38 pt + tarjeta blanca 106 × 40 pt "Pedido #1042" 17 pt 700 / "Bocamar" 13 pt gris (radio 14).
  3. Hoja fija desde y 380 (radio 28): "Tu pedido está en camino" `h2` 25 pt; "Llega en 7–12 min" 17 pt gris; línea de tiempo C29 (Confirmado 12:05 p. m. ✓, Preparado 12:20 p. m. ✓, En camino 12:25 p. m. activo).
  4. y 563: tarjeta del repartidor `#F3F6FB` radio 18 (357 × 79 pt): avatar 59 pt, "Carlos R." 17 pt 600, "Tu domiciliario" 15 pt gris, "★ 4,8 · 320 entregas"; 2 botones circulares 42 pt `blueSoft` (`chatbubble-ellipses-outline`, `call-outline` en `blue`).
  5. y 653: tarjeta "Código de entrega" (blanca, borde, radio 16): candado en círculo 44 pt `blueSoft`, "Código de entrega" 15 pt gris, "6832" 26 pt 700, "Compártelo al recibir tu pedido." 14,5 pt gris.
  6. y 765: enlaces "Ver detalle · $38.000 ›" (izquierda) y "Ayuda ›" (derecha) 17 pt 600 `blueLink`.
- **Fotos**: `avatar-repartidor.jpg`.

### 22 · Chat con repartidor
- **PNG**: `tanda-03/22-chat-repartidor.png` · **Archivo**: `app/(customer)/order/[id]/chat.tsx` · **Web**: `/order/90000000-0000-0000-0000-000000001042/chat`
- **Elementos**: C28 con encabezado (chevron, avatar 42 pt, "Carlos R." / "Tu repartidor", teléfono en círculo 38 pt a la derecha); y 64 tarjeta del pedido 360 × 76 pt (foto 103 × 57, "Bocamar" / "Pedido #1042", chevron); mensajes desde y 162 con avatar y burbujas (entrante `#EDEEF2`, propia `blueChip`); compositor abajo.
- **Fotos**: `avatar-repartidor.jpg`, `producto-ceviche-clasico.jpg`.

### 23 · Pedido entregado
- **PNG**: `tanda-03/23-pedido-entregado.png` · **Archivo**: `app/(customer)/order/[id]/delivered.tsx` · **Web**: `/order/90000000-0000-0000-0000-000000001042/delivered`
- **Elementos**: C2d "← Pedido #1042" 18 pt 600; y 47 check en círculo 39 pt `blueSoft` + "Pedido entregado" 22 pt 700 / "Hoy, 12:40" 15 pt gris; y 101 tarjeta C20a (foto 126 × 59, "Bocamar"/"Ceviches", chevron); y 192 "Tu pedido" 19 pt + filas (foto 56 pt, nombre 16 pt 600, "1 unidad" 15 pt gris, precio a la derecha) con separador sangrado; separador; "Resumen de pago" 19 pt + C20c ("Total pagado" 18 pt 700); fila VISA (`pago-visa.png` 34 × 23 pt) "Visa •••• 4242" ›; separador; "Entregado en" 19 pt + pin en círculo gris 34 pt + "Casa / Calle 2 # 3-45, Apto. 302 / Puerto Colombia"; CTA "Calificar pedido" (pill 38 pt), "Volver a pedir" C15c, enlace "Tuve un problema".

### 24 · Calificación
- **PNG**: `tanda-03/24-calificar.png` · **Archivo**: `app/(customer)/order/[id]/rate.tsx` (+ `StarRating.tsx`) · **Web**: `/order/90000000-0000-0000-0000-000000001042/rate`
- **Elementos**: C2b "Califica tu pedido"; y 46 tarjeta gris `surfaceSoft` radio 16 (foto 157 × 101 radio 12; "Bocamar" 18 pt 600, "Ceviches" 15 pt, "Pedido #1042", "Hoy · 12:40" 14,5 pt gris); y 205 "¿Qué tal estuvo la comida?" 17 pt 600 centrado; 5 estrellas 36 pt `#FEBE1C` separadas 14 pt; "Excelente" 15,5 pt 600; chips C10c "Sabor" ✓, "Presentación", "Temperatura" (38 pt); "¿Qué te gustó? (opcional)" 15 pt 600; textarea 92 pt con "0/250"; separador; avatar 57 pt (`avatar-repartidor-alt.jpg`) "Carlos R." / "Tu domiciliario"; "¿Cómo fue la entrega?" 16 pt 600; tarjetas C18 "👍 Buena" (seleccionada, `thumbs-up` `blue` 30) / "👎 Mala" (`thumbs-down-outline` gris); CTA "Enviar calificación" pill 46 pt.
- **Ojo**: la calificación del repartidor es binaria (Buena/Mala), no estrellas.

### 25 · Mercado
- **PNG**: `tanda-04/25-mercado.png` · **Archivo**: `app/(customer)/market.tsx` → `components/customer/screens/StoreCategoryScreen.tsx` (sirve 25 y 29) · **Web**: `/market` (+ S-LOC)
- **Elementos**:
  1. C1 con bolsa (sin atrás en el diseño); y 48,5 buscador "Busca productos o tiendas".
  2. y 105: tiles C6 (Frutas, Verduras, Lácteos, Despensa) + etiquetas 15 pt.
  3. y 218: banner C5 crema "Tu mercado, / a domicilio" + "Productos frescos y todo / lo que necesitas." + foto.
  4. y 370: "Tiendas cercanas" 19 pt + "Ver todas ›"; carrusel de tarjetas 182 pt (radio 16, `shadowCard`): fachada 110 pt de alto con `heart-outline` blanco 24 arriba-derecha; "Mercado del Puerto" 16 pt 600; "Frutas, verduras y más" 14 pt gris; "⏱ 30–45 min · 🚚 Envío $3.000" 14 pt gris con íconos 18.
  5. y 597: "Lo esencial" + "Ver todos ›"; 3 tarjetas C12c (Banano 1 kg $4.000, Tomate, Arroz).
- **Fotos**: `categoria-frutas/verduras/lacteos/despensa.jpg`, `banner-mercado.jpg`, `fachada-mercado-del-puerto.jpg`, `fachada-tienda-de-la-costa.jpg`, `producto-banano/tomate/arroz.jpg` (sobre blanco).
- **Ojo**: sin barra de pestañas. Hoy hay chips de texto ("Aseo"…) en vez de tiles con foto.

### 26 · Tienda de mercado
- **PNG**: `tanda-04/26-mercado-tienda.png` · **Archivo**: `app/(customer)/merchant/[id].tsx` (rama `category === "market"`) · **Web**: `/merchant/c0000000-0000-0000-0000-000000000004`
- **Elementos**:
  1. Portada C25 163 pt (bolsa de mercado); atrás a la izquierda; buscar y corazón a la derecha.
  2. Hoja blanca radio 24 desde y 124: tile de logo 88 pt radio 16 (`logo-mercado-del-puerto.jpg`) en x 16; "Mercado del Puerto" 24 pt 700; "Supermercado · Abarrotes y más" 15,5 pt gris; "⏱ 30–45 min · 🛵 Envío $3.000" 15,5 pt ink.
  3. y 244: barra segmentada C10f (Destacados, Frutas, Verduras, Lácteos).
  4. y 301: grid C12b 2 columnas (Banano, Tomate, Arroz, Leche), filas cada 231 pt.
- **Ojo**: hoy es lista con fotos a la derecha y chips sueltos (ver captura `guia26`); el diseño es grid de tarjetas.

### 27 · Producto de mercado
- **PNG**: `tanda-04/27-mercado-producto.png` · **Archivo**: `app/(customer)/product/[id].tsx` · **Web**: `/merchant/c0000000-0000-0000-0000-000000000004 --click "Banano (1 kg)"`
- **Elementos**: `close` en círculo blanco 40 pt (`shadowSoft`) arriba-izquierda; foto del producto **sobre fondo blanco, sin marco** (`producto-banano-blanco.jpg`, ≈ 376 × 315 pt, y 18 → 333); y 362 "Banano" `display` 34 pt; píldora "Bolsa de 1 kg" `#F1F2F5` 104 × 28 pt radio 12 (15,5 pt gris); "$4.000" 29 pt 700; "Producto fresco de Mercado del Puerto." 15,5 pt gris; separador; "Si no está disponible" 20 pt 700; radios "Reemplazar por similar" ✓ / "Quitar del pedido" (16 pt); nota "Te contactaremos si cambia el precio." 14 pt `textPlaceholder`; barra C16b con stepper relleno C14b (145 × 52) + "Agregar · $4.000" (211 × 52).

### 28 · Canasta de mercado
- **PNG**: `tanda-04/28-mercado-canasta.png` · **Archivo**: `app/(customer)/cart.tsx` (rama mercado) · **Web**: `/cart` + canasta sembrada con IDs reales de Banano y Tomate (obtenerlos con `--click`)
- **Elementos**:
  1. C2b con título de 2 líneas: "Tu canasta" 18 pt 700 / "Mercado del Puerto" 15,5 pt gris.
  2. y 59: tarjetas de línea 366 × 100 pt radio 16 borde (foto 103 × 87 radio 12; "Banano" 15,5 pt 600, "1 kg" 14 pt gris, "$4.000" 16 pt 700; stepper C14d + papelera).
  3. y 279: tarjeta `surfaceSoft` 366 × 70 pt "Si falta un producto / Contactarme antes de reemplazar" con `chatbox-ellipses-outline` + chevron.
  4. Separador; "📍 Dirección de entrega" 19 pt 700 + "Cambiar" `blueLink`; tarjeta `surfaceSoft` con `home-outline` 26, "Casa" 16 pt 600, dirección 2 líneas 15 pt gris, "30 – 45 min" + chevron.
  5. Separador; "Resumen de pago" 19 pt 700; tarjeta `#F7F9FB` con C20c (Productos $9.000, Envío, Servicio, Total $13.000).
  6. CTA a lo ancho pill 52 pt "Continuar · $13.000 ›".

### 29 · Farmacia
- **PNG**: `tanda-04/29-farmacia.png` · **Archivo**: `app/(customer)/pharmacy.tsx` → `StoreCategoryScreen.tsx` · **Web**: `/pharmacy` (+ S-LOC)
- **Elementos**: C1 con bolsa; buscador "Busca productos de farmacia"; y 109 tarjetas C4 versión 29 (Cuidado personal, Protección solar, Bebés, Primeros auxilios; 174 × 106, separación 7); y 357 "Farmacias cercanas" + "Ver todas ›"; carrusel de tarjetas sin contenedor: fachada 177 × 123 pt radio 14 con badge de tiempo C24, "Farmacia del Puerto" 16 pt 600, "Salud y bienestar" 14,5 pt gris, "★ 4,8 · Envío $3.000"; separador; "Productos destacados" + "Ver todos ›"; 3 tarjetas C12c (Protector solar SPF 50 $35.000, Cepillo dental $6.000, Apósitos adhesivos $5.000).
- **Fotos**: `categoria-cuidado-personal/proteccion-solar/bebes/primeros-auxilios.jpg`, `fachada-*.jpg`, `producto-protector-solar-blanco.jpg`, `producto-cepillo-dental.jpg`, `producto-apositos.jpg`.
- **Ojo**: el diseño no muestra el aviso de "Medicamentos de venta libre" ni chips de texto; si el aviso es obligatorio, va como nota pequeña al final.

### 30 · Producto de farmacia
- **PNG**: `tanda-04/30-farmacia-producto.png` · **Archivo**: `app/(customer)/product/[id].tsx` · **Web**: `/merchant/c0000000-0000-0000-0000-000000000005 --click "Protector solar SPF 50"`
- **Elementos**: tarjeta-imagen 379 × 388 pt radio 24 en x 7 (y 3), con atrás (42 pt), compartir y corazón dentro; puntos del carrusel (activo `blue` 6 pt, inactivos `#E1E4EA`) en y 405; "Protector solar SPF50" 24 pt 700; "80 ml" 15 pt gris; "$35.000" 22 pt 700; tarjeta de farmacia `blueTint` 362 × 55 pt radio 16 (`storefront` relleno `blue` 24, "Farmacia del Puerto" 16 pt 600, "Salud y bienestar" 14,5 pt gris, chevron); filas C17d "Descripción", "Modo de uso", "Ingredientes"; nota "Consulta las indicaciones del empaque." 13 pt gris; barra C16b (stepper C14a 122 × 39 + "Agregar · $35.000" 236 pt).
- **Fotos**: `producto-protector-solar.jpg`.

### 31 · Datos del envío
- **PNG**: `tanda-04/31-envio-datos.png` · **Archivo**: `app/(customer)/shipments/new.tsx` · **Web**: `/shipments/new` (+ S-LOC)
- **Elementos**: C2b con título grande "Envía un paquete" 23 pt 700; y 60 tarjetas 362 × 80 pt `#F9FAFC` borde `#E7EAF0` radio 16: "Recogida" (pin `blue` en círculo `blueTint` 42 pt) / "Calle 2 # 3-45" 17 pt 500 / "Puerto Colombia"; y 154 "Destino" (pin `amber` en círculo `#FDF4DD`) "Carrera 4 # 5-20"; y 253 "Datos del destinatario" 20 pt 700; tarjeta con borde (radio 16) que contiene "Nombre" y "Celular" (labels 14,5 pt gris, campos 37 pt radio 10); y 466 "¿Qué envías?" 20 pt 700; "Tipo de paquete" + selector "Documentos ⌄" 38 pt radio 12; "Tamaño del paquete" + 3 tarjetas C18 115 × 117 pt con `envio-caja.png` a 3 escalas: "Pequeño / Hasta 2 kg" (seleccionada, texto `blueText`), "Mediano", "Grande"; CTA pill 47 pt "Cotizar envío".

### 32 · Revisar envío
- **PNG**: `tanda-04/32-envio-cotizacion.png` · **Archivo**: `app/(customer)/shipments/review.tsx` · **Web**: `/shipments/review` (necesita el borrador en memoria de `useShipmentDraft`: llegar desde 31 con `--click "Cotizar envío"`)
- **Elementos**: C2b con título **centrado** "Revisa tu envío"; y 47 mapa C30 362 × 152 pt con ruta, pin `blue` "Calle 2 # 3-45 / Recogida" y pin rojo `#E4393A` "Carrera 4 # 5-20 / Entrega"; tarjeta de ruta (punto azul en círculo `blueTint`, línea punteada vertical, punto rojo; "Recogida"/"Entrega" 16 pt 700 + direcciones 15,5 pt gris); tarjeta destinatario (`person-outline` en círculo 40 pt `#E9F0FB`, "Ana López" 17 pt 600, "300 765 4321", `call` `blue` a la derecha); tarjeta paquete (`envio-caja.png` 46 pt, "Paquete pequeño" / "Documentos · Hasta 2 kg"); tarjeta tiempo (`time-outline` en círculo, "Tiempo estimado de entrega" 15 pt gris / "35 – 50 min" 17 pt 700); tarjeta precios (Envío $8.000, Servicio $1.000, Total $9.000 21 pt 700); tarjeta pago (VISA azul, "Visa •••• 4242", "Cambiar ›" `blueLink`); CTA pill "Confirmar envío · $9.000 ›" 44 pt; nota "El seguimiento estará disponible al confirmar." 13,5 pt gris centrada. Tarjetas: 362 pt, radio 16, borde `cardBorder`, separación 9 pt.

### 33 · Ofertas
- **PNG**: `tanda-05/33-ofertas.png` · **Archivo**: `app/(customer)/(tabs)/offers.tsx` · **Web**: `/offers` (+ S-LOC)
- **Elementos**: C1 **sin bolsa**; y 52 "Ofertas" `h1` 29 pt; y 93 buscador "Busca una oferta"; y 147 chips C10d (Todas ✓, 🍴 Comida, 🛒 Mercado, ✚ Farmacia); y 195 tarjeta de oferta 357 × 176 pt radio 18: fondo `cream` a la izquierda que se funde (degradado horizontal) con la foto a la derecha; "BOCAMAR" 13 pt 700 `blueNavy` (tracking +0,5); "Combo ceviche / + limonada" 22 pt 700; "Ceviche clásico / más limonada natural" 14,5 pt `textSecondary`; "$34.000" 25 pt 700 `blueNavy`; botón "Pedir ahora ›" pill `blue` 109 × 31 pt (15 pt 600). y 384 segunda tarjeta (194 pt: "NARANMICHE / Combo hamburguesa + papas / $30.000"). y 607 "Descubre más" 19 pt; tarjeta `offerGray` 357 × 93 pt: "Amaras" 21 pt 700 / "Shawarmas" 15 pt / "Desde **$22.000**" (precio 20 pt 700 `blueNavy`) con foto a la derecha. Barra C21 con "Ofertas" activo.
- **Fotos**: `oferta-combo-ceviche.jpg`, `oferta-combo-hamburguesa.jpg`, `oferta-amaras.jpg`.
- **Ojo**: hoy hay sección "Tus cupones" y tarjetas de promo con foto completa.

### 34 · Favoritos
- **PNG**: `tanda-05/34-favoritos.png` · **Archivo**: `app/(customer)/(tabs)/favorites.tsx` · **Web**: `/favorites` (+ S-LOC; María tiene Bocamar como favorito)
- **Elementos**: C1 con bolsa; buscador "Busca en YAVA"; y 116 pestañas C27 "Restaurantes" (activa, subrayado 3 pt de media pantalla) / "Productos"; y 172 "Mis restaurantes favoritos" 19 pt + "Ver todos ›"; filas C9 (34) con `bookmark` relleno; separador; "Tus productos favoritos" + "Ver todos ›"; tarjeta de producto 357 × 87 pt (foto 106 × 77, "Ceviche clásico" 16,5 pt 600, "Bocamar" 15 pt gris, "$28.000" 16 pt 600, `bookmark` `#0148C9`); barra C21 con "Favoritos" activo.
- **Ojo**: el ícono de favorito en las filas es `bookmark` azul (no corazón rojo).

### 35 · Cuenta
- **PNG**: `tanda-05/35-cuenta.png` · **Archivo**: `app/(customer)/(tabs)/account.tsx` · **Web**: `/account`
- **Elementos**: y 20 "Cuenta" `h1` 29 pt (sin encabezado de dirección); y 68 avatar 62 pt `blueSoft` con iniciales "MP" 25 pt 700 `blue`; "María Pérez" 18 pt 500; "maria@example.com" 15 pt gris; "Editar ›" 16 pt `blueLink` a la derecha; grupos C17b (separación 19 pt): [Mis pedidos, Direcciones, Métodos de pago, Cupones (ícono amarillo)] y 144; [Notificaciones, Ayuda, Ajustes] y 371; [Registra tu comercio, Quiero repartir] y 546; barra C21 con "Cuenta" activa.

### 36 · Mis pedidos
- **PNG**: `tanda-05/36-mis-pedidos.png` · **Archivo**: `app/(customer)/orders.tsx` + `components/customer/OrderCard.tsx` · **Web**: `/orders --click "Historial"`
- **Elementos**: C2b "Mis pedidos" 20 pt 700; y 59 pestañas C27 "En curso" / "Historial" (activa); y 95 tarjetas C20b (Bocamar $38.000 Hoy · 12:40; Naranmiche; Amaras) separadas 12 pt.

### 37 · Mis direcciones
- **PNG**: `tanda-05/37-direcciones.png` · **Archivo**: `app/(customer)/addresses.tsx` · **Web**: `/addresses` (+ S-LOC)
- **Elementos**: C2c; y 59 "Mis direcciones" `h1` 29 pt; "Selecciona la dirección de entrega" 16 pt gris; y 131 tarjeta C18 seleccionada (radio, "Casa" 19 pt 500 + badge "Principal", "Calle 2 # 3-45, Apto. 302" 16 pt ink, "Puerto Colombia" 16 pt gris, `create-outline` gris 22 arriba-derecha); y 250 "Trabajo" sin seleccionar; y 370 tarjeta "+ Agregar dirección" (67 pt, `add` y texto 17 pt 600 `blueLink`); abajo CTA "Usar esta dirección" 50 pt radio 13.
- **Ojo**: hoy "Agregar dirección" es el botón inferior secundario; en el diseño es una tarjeta más de la lista y el CTA fijo es "Usar esta dirección".

### 38 · Notificaciones
- **PNG**: `tanda-05/38-notificaciones.png` · **Archivo**: `app/(customer)/notifications.tsx` · **Web**: `/notifications`
- **Elementos**: chevron a la izquierda; "Notificaciones" 18,5 pt 700 **centrado**; "Marcar como leídas" 14,5 pt 500 `blueLink` a la derecha; y 72 "Hoy" 20 pt 700; filas (paso 83 pt, separadores de x 18 a 374): punto no leído 12 pt `#0456FA` en x 18; tile 52 pt radio 14 (`notif-entregado.png` verde, `notif-en-camino.png` azul, `notif-confirmado.png` amarillo); título 17 pt 600; cuerpo 15 pt gris; hora 14,5 pt gris a la derecha.
- **Ojo**: hoy se marcan como leídas al abrir; el diseño tiene el botón explícito.

### 39 · Ayuda
- **PNG**: `tanda-05/39-ayuda.png` · **Archivo**: `app/(customer)/help.tsx` · **Web**: `/help`
- **Elementos**: `arrow-back` (C2d); y 52 "¿Cómo te ayudamos?" `h1` 30 pt; y 99 buscador "Busca un tema"; y 165 "Tu pedido reciente" 18 pt 700; tarjeta C20a 362 × 102 pt (foto 118 × 81, "Bocamar", "Pedido #1042", badge "✓ Entregado · 12:40", "Ver ayuda ›" `blueLink`); y 321 "Temas de ayuda" 18 pt 700; 4 tarjetas C17c (Problemas con mi pedido / Pagos y reembolsos / Mi cuenta / Direcciones y cobertura, separación 8); CTA "🎧 Hablar con soporte" 47 pt; pie "Consulta también las **preguntas frecuentes**" 15 pt gris + enlace.
- **Ojo**: hoy las FAQ son un acordeón; el diseño muestra temas como tarjetas.

### 40 · Chat con soporte
- **PNG**: `tanda-05/40-chat-soporte.png` · **Archivo**: `app/(customer)/support.tsx` · **Web**: `/support?order=90000000-0000-0000-0000-000000001042`
- **Elementos**: C28: avatar círculo 42 pt `blueSoft` con `headset-outline` `blue`; "Soporte YAVA" 18 pt 700 / "Pedido #1042"; y 73 tarjeta del pedido 364 × 89 pt ("Bocamar", "$38.000 · Entregado"); burbujas: entrante `#EAEDF1`, **propia `blue` con texto blanco**; compositor con `attach` y campo relleno `#F2F4F6`.

### 41 · Búsqueda sin resultados
- **PNG**: `tanda-06/41-busqueda-sin-resultados.png` · **Archivo**: `app/(customer)/search.tsx` (rama sin resultados) · **Web**: `/search?q=sushi`
- **Elementos**: chevron suelto (y 9) y **debajo** el buscador a lo ancho (y 41, 357 × 42 pt) con "sushi" y X en círculo gris; y 127 ilustración `vacio-busqueda.png` (81 pt); y 230 "No encontramos resultados" 21 pt 700; "Prueba con otro plato o restaurante." 16 pt gris; y 301 chips C10e (Ceviches, Hamburguesas, Shawarmas); y 365 "Limpiar búsqueda" 15 pt `blueLink`; separador en y 400; "Restaurantes cerca" 18 pt 700; filas C9 (41) Bocamar, Amaras con chevron.
- **Ojo**: hoy el vacío dice "Sin resultados para …" con botón "Ver restaurantes cerca".

### 42 · Canasta vacía
- **PNG**: `tanda-06/42-canasta-vacia.png` · **Archivo**: `app/(customer)/cart.tsx` (rama vacía) · **Web**: `/cart` (sin semilla de canasta)
- **Elementos**: C2b "Tu canasta"; ilustración `vacio-canasta.png` centrada entre y 220 y 317 (≈ 90 pt de cesta en trazo `#3B4759` + destellos amarillos, **sin círculo**); y 350 "Tu canasta está vacía" 26 pt 700; "Explora los comercios y agrega / tus favoritos." 17 pt gris; y 460 CTA "Explorar restaurantes" 349 × 54 pt radio 18 (x 22); "Volver al inicio" 16 pt 600 `blueLink`.

### 43 · Restaurante cerrado
- **PNG**: `tanda-06/43-restaurante-cerrado.png` · **Archivo**: `app/(customer)/merchant/[id].tsx` (rama `!is_open`) · **Web**: `/merchant/c0000000-0000-0000-0000-000000000001` solo cuando Bocamar esté fuera de horario; si no, fixture.
- **Elementos**: portada 253 pt (desde el tope de pantalla) con atrás blanco 37 pt; hoja radio 24 desde y 215; "Bocamar" `display` 34 pt + badge "Cerrado"; "Ceviches · Mariscos · Comida de mar" 15 pt gris; fila de 3 datos con "•": "★ 4,8 (320+)" / "Calificación", "25–35 min" / "Tiempo", "$3.000" / "Envío" (valor 17 pt, etiqueta 13 pt gris); separador; aviso: círculo 45 pt `#EEF1F6` con `time-outline` + "Abre hoy a las 12:00" 17 pt 700 + "Puedes ver el menú y volver cuando esté abierto." 15 pt gris; separador; "Menú destacado" 19 pt; 2 tarjetas 171 pt (foto 136 pt; "Ceviche clásico" 15 pt 600, "$28.000" 15 pt, "+" deshabilitado 30 pt); CTA "Ver otros restaurantes ›" 47 pt.

### 44 · Producto no disponible (en la canasta)
- **PNG**: `tanda-06/44-producto-no-disponible.png` · **Archivo**: `app/(customer)/cart.tsx` (rama `unavailable`) — la pantalla es la canasta, no el detalle del producto · **Web**: `/cart` + S-CART-NODISP
- **Elementos**: chevron suelto; y 35 cabecera del comercio (foto 140 × 75 pt radio 12 + "Bocamar" 22 pt 700 + "Ceviches · 25–35 min" 15,5 pt gris); separador; "Tu pedido" 19 pt 700; línea normal (foto 72 × 70, nombre 17 pt 600, descripción 14,5 pt gris 2 líneas, precio 16 pt 600, stepper C14b 88 × 33); línea no disponible en caja `#F5F6F8` radio 14 (texto en `#858D9F`, badge C24 "No disponible", `trash-outline` gris); caja de aviso `amberSoft` radio 14 con `alert-circle` `amber` + "Elimina o reemplaza este producto para continuar." 15 pt `#666C6F`; "Te puede gustar en su lugar" 19 pt; 2 tarjetas 170 × 108 pt (foto 56 × 88, nombre, "600 ml." gris, precio, botón "Elegir" C15d); separador; "Resumen del pedido" + C20c; CTA "Continuar" deshabilitado (`disabledStrong`, pill 44 pt).
- **Ojo**: hoy el aviso es rojo (`redSoft`) y el badge rojo; el diseño usa ámbar.

### 45 · Pago fallido
- **PNG**: `tanda-06/45-pago-fallido.png` · **Archivo**: `app/(customer)/order/[id]/payment-failed.tsx` · **Web**: `/order/<id>/payment-failed` — no alcanzable con el #1042 (pagado, redirige); fixture.
- **Elementos**: sin encabezado; y 93 ilustración `pago-fallido.png` (≈ 94 pt); y 210 "No pudimos procesar el pago" 25,5 pt 700 centrado; "Tu pedido aún no se ha confirmado." 18 pt gris; y 295 tarjeta C20a 356 × 106 pt (foto 104 × 81, "Bocamar", "2 productos", "Total **$38.000**"); y 419 tarjeta de pago 66 pt (`pago-visa-claro.png`, "Visa •••• 4242", chevron); "Revisa tu método de pago o intenta de nuevo." 14,5 pt gris centrado; CTA "Cambiar método de pago" 48,5 pt radio 14; "Reintentar" C15e; enlace "Volver a la canasta".
- **Ojo**: hoy el primario es "Reintentar pago" y hay "Volver al inicio"; el diseño invierte el orden.

### 46 · Fuera de cobertura
- **PNG**: `tanda-06/46-fuera-de-cobertura.png` · **Archivo**: hoy `checkout.tsx` (EmptyState) y `LocationPicker.tsx` (texto en el botón). Propuesta: estado de `LocationPicker` (misma pantalla que 06). · **Web**: `/checkout` + S-CART + S-LOC-FUERA (estado actual) o `/location` con GPS fuera de zona.
- **Elementos**: C2b "Dirección de entrega" 18,5 pt 700; buscador "Buscar otra dirección"; mapa a lo ancho con polígono gris de la zona y pin gris oscuro `#384254`; hoja fija desde y 529: asa, ícono `sin-cobertura.png` en círculo 54 pt `#F1F2F5`, "Aún no llegamos a esta zona" 21 pt 700, "Prueba con otra dirección en Puerto Colombia." 15,5 pt gris, CTA "Cambiar dirección" 41,5 pt radio 12, "Volver al inicio" C15e.

### 47 · Cancelar pedido
- **PNG**: `tanda-06/47-cancelar-pedido.png` · **Archivo**: `app/(customer)/order/[id]/cancel.tsx` · **Web**: `/order/90000000-0000-0000-0000-000000001042/cancel` (renderiza, pero en estado "no cancelable"); el estado del diseño requiere un pedido `placed`.
- **Elementos**:
  1. Fondo (detalle del pedido en curso, con velo 0,45): chevron + menú `ellipsis-vertical` en cuadro `surfaceGray` 32 pt; foto 128 × 75 + "Bocamar" 22 pt + "Ceviches · 25–35 min" + "★ 4,8 (1.2k+)"; progreso de 3 pasos C29 pequeño (Pedido recibido 9:40 a. m. activo, En preparación, En camino); aviso `surfaceSoft` "El comercio aún no ha aceptado tu pedido / Te avisaremos en cuanto empiece a prepararlo." con `time-outline` `blue`; "Detalle del pedido" + filas.
  2. Hoja C22 desde y 400: "¿Cancelar tu pedido?" 23 pt 700 + `close`; "El comercio aún no lo ha aceptado." 16 pt gris; radios 22 pt con texto 17 pt: "Me equivoqué en el pedido" ✓, "Quiero cambiar la dirección", "Otro motivo"; separador; `information-circle-outline` gris + "Veremos si hubo un cobro y te mostraremos el estado del reembolso." 14,5 pt gris; "Confirmar cancelación" C15f 41 pt; "Seguir con mi pedido" C15a 43 pt.
- **Ojo**: hoy es una pantalla completa; en el diseño es hoja sobre el detalle del pedido (21/detalle).

### 48 · Sin conexión
- **PNG**: `tanda-06/48-sin-conexion.png` · **Archivo**: hoy `components/customer/OfflineBanner.tsx` (banner oscuro arriba). El diseño es **pantalla completa**. · **Web**: requiere modo sin red (yshot no lo soporta); fixture.
- **Elementos**: C2b con título "YAVA" 19 pt 700; y 248 ilustración `sin-conexion.png` (nube tachada `#8B92A3`, ≈ 100 pt, sin círculo); y 355 "Sin conexión" 28 pt 700; "Revisa tu conexión a internet / e intenta de nuevo." 17 pt gris; y 463 CTA "Reintentar" 53 pt radio 14; "Tus datos guardados seguirán aquí." 15,5 pt gris.

---

## 3. Componentes compartidos sugeridos

Construirlos en `apps/mobile/src/components/ui` (genéricos) o `components/customer` (de dominio), con los tokens de §1.

| Componente | Archivo sugerido | Usado en |
|---|---|---|
| Tokens nuevos (`blue #0045AB`, `blueLink`, `blueText`, `blueSoft`, `blueTint`, `blueChip`, `blueNavy`, pasteles, `ink`, grises azulados, `amber*`, sombras `shadowSoft/Float/Bar/Card`, radios r10–r24, margen 18) | `packages/shared/src/tokens.ts` | todas |
| `Text` con escala de §1.2 (`display`, `h1`, `h2`, `h3`, `navTitle`, `section`, `cardTitle`, `bodyL`, `body`, `bodyS`, `caption`, `meta`, `tab`, `price`, `priceL`) | `ui/Text.tsx` | todas |
| `FloatingTabBar` + `SearchFab` (C21) | `components/customer/FloatingTabBar.tsx` + `(tabs)/_layout.tsx` | 08, 33, 34, 35 |
| `AddressHeader` (C1: variantes `bag`, `back`, sin bolsa) | `components/customer/AddressHeader.tsx` | 08, 09, 25, 29, 33, 34 |
| `NavHeader` (C2a círculo, C2b chevron, C2c chevron+H1, C2d flecha; título centrado; acción derecha) | `ui/Header.tsx` | 03–07, 10, 15–19, 22–24, 28, 31, 32, 36–39, 41, 42, 46, 48 |
| `CircleIconButton` (gris 32–36 / blanco con sombra 38–42) | `ui/CircleIconButton.tsx` | 03, 04, 07, 09, 10, 12, 13, 14, 15, 16, 21, 22, 26, 27, 30, 43 |
| `SearchPill` (C3, modo botón y modo campo con X) | `ui/SearchBar.tsx` | 06, 08, 09, 10, 25, 29, 33, 34, 39, 41, 46 |
| `CategoryCard` pastel (C4) | `components/customer/CategoryGrid.tsx` | 08, 29 |
| `PromoBanner` amarillo/crema (C5) | `components/customer/PromoBanner.tsx` | 08, 25 |
| `PhotoTile` (C6) | `components/customer/PhotoTile.tsx` | 09, 25 |
| `RestaurantCard` (C7) / `RestaurantCardWide` (C8a/C8b) / `RestaurantRowCard` (C9) | `components/customer/MerchantCard.tsx` | 08, 09, 10, 11, 34, 41 |
| `StoreCard` (fachada + datos; badge de tiempo) | `components/customer/StoreCard.tsx` | 25, 29 |
| `SectionHeader` ("Título" + "Ver todos ›") | `components/customer/SectionHeader.tsx` | 08, 14, 25, 29, 33, 34, 41 |
| `Chip` (C10a filtro con ícono y segmento doble, C10c selección, C10d relleno, C10e sugerencia) | `ui/Chip.tsx` | 09, 11, 24, 33, 41 |
| `SegmentedControl` (C10b grande, C10f barra) | `ui/Segmented.tsx` | 10, 26 |
| `UnderlineTabs` (C27) | `ui/UnderlineTabs.tsx` | 12, 34, 36 |
| `AddButton` (C11: tamaños 26/28/32/34; variantes azul, blanco, outline, deshabilitado) | `components/customer/AddButton.tsx` | 10, 12, 14, 15, 25, 26, 29, 43 |
| `ProductGridCard` (C12a/b/c), `ProductRow` (C13), `ProductMiniCard` (C12d/e) | `components/customer/ProductRow.tsx` | 10, 12, 14, 15, 25, 26, 29, 43, 44 |
| `Stepper` (C14a–e) | `ui/Stepper.tsx` | 13, 14, 15, 27, 28, 30, 44 |
| `Button` (primario, pill, suave, outline azul, outline gris, peligro, deshabilitado, enlace, social, con precio a la derecha) | `ui/Button.tsx` | todas |
| `BottomBar` (C16a total + CTA, C16b stepper + CTA, C16c CTA) | `ui/BottomBar.tsx` (o `Screen.footer`) | 11, 13, 15, 16, 17, 19, 24, 27, 28, 30, 31, 32, 37, 39, 42, 43, 44 |
| `ListRow` (C17a checkout, C17b grupo, C17c tema, C17d info) + `ListGroup` | `ui/ListRow.tsx` | 16, 23, 30, 35, 39 |
| `SelectCard` / `RadioRow` / `Checkbox` (C18) | `components/customer/RadioRow.tsx` | 05, 07, 11, 13, 17, 24, 27, 31, 37, 47 |
| `Input` / `TextArea` / `OtpInput` / `SelectField` (C19) | `ui/Input.tsx` | 03, 04, 05, 07, 13, 18, 19, 24, 31 |
| `MerchantMiniCard` (C20a) y `OrderCard` (C20b) | `components/customer/OrderCard.tsx` | 20, 22, 23, 36, 39, 40, 45 |
| `PriceSummary` (C20c, con o sin tarjeta) | `components/customer/PriceBreakdown.tsx` | 16, 20, 23, 28, 32, 44 |
| `Sheet` (C22: asa, radio 24, velo; versión fija sobre mapa) | `ui/Sheet.tsx` | 06, 11, 14, 21, 46, 47 |
| `EmptyState` ilustrado (C23) | `ui/EmptyState.tsx` | 19, 41, 42, 45, 46, 48 |
| `Badge` (C24: entregado, principal, cerrado, no disponible, tiempo) | `ui/Badge.tsx` | 29, 36, 37, 39, 43, 44 |
| `HeroHeader` (C25: portada + botones flotantes + hoja con radio) | `components/customer/HeroHeader.tsx` | 12, 13, 26, 30, 43 |
| `InfoStrip` (C26) | `components/customer/InfoStrip.tsx` | 12 |
| `ChatBubble` + `ChatComposer` + `ChatHeader` (C28) | `components/customer/Chat.tsx` | 22, 40 |
| `HorizontalTimeline` (C29) | `components/customer/Timeline.tsx` | 21, 47 |
| `MapCard` / mapa con pines (C30) | `components/customer/MapCard.tsx` | 06, 16, 21, 32, 46 |
| `OfferCard` (degradado crema → foto) | `components/customer/OfferCard.tsx` | 33 |
| `NotificationRow` (punto + tile + textos + hora) | `components/customer/NotificationRow.tsx` | 38 |
| `CourierCard` + `DeliveryCodeCard` | `components/customer/CourierCard.tsx` | 21, 24 |
| `DESIGN_PHOTOS` (mapa de recortes locales por slug/nombre) | `features/customer/designPhotos.ts` | 08–15, 20–30, 33, 34, 41–45 |

---

## 4. Componentes implementados (base visual global)

Estado al 27-oct-2026. Pantalla de referencia terminada: **08 Inicio** (`app/(customer)/(tabs)/index.tsx`), comparada con `tanda-01/08-inicio.png` en 7 iteraciones (posiciones verticales dentro de ±1 pt). Úsala como ejemplo de cómo se arma una pantalla fiel.

### 4.1 Correcciones a §1 (medidas con más cuidado)

- **Tipografía**: los tamaños de §1.2 salieron de la altura de mayúsculas con el antialiasing incluido y quedaron **15–25 % grandes** en textos pequeños. Se recalibraron midiendo el **ancho de tinta** de cada texto del PNG contra SF Pro (canvas de Chrome). Ejemplo: "Restaurantes cerca" mide 147 pt de ancho → 16,5 pt (no 18); la meta "Ceviches · 25–35 min" → 9,7 pt (no 12); las etiquetas de la barra → 8,2 pt (no 10,5). Los H1 sí coinciden (27 pt). **Usa las variantes de `Text`, no los números de §1.2.**
- **Margen lateral**: el contenido de 08 va de x 17,1 a 375,5 → `spacing.gutter = 17.5` (no 18).
- **Sombras**: se implementan con `boxShadow` (RN 0.88 nueva arquitectura + react-native-web), así se ven igual en iOS, Android y web. Tokens en `shadows`.
- **Nuevo azul**: `colors.blue = #0045AB` (también en `app.json` → expo-notifications y en el canal de Android de `usePushNotifications`).

### 4.2 Tokens (`@yava/shared` → `packages/shared/src/tokens.ts`)

```ts
import { colors, radius, spacing, shadows, typography } from "@yava/shared";
```

- `colors`: todos los de §1.1 (`blue`, `blueDark`, `blueNavy`, `blueLink`, `blueText`, `blueSoft`, `blueTint`, `blueChip`, `yellow`, `star`, `spark`, `bannerYellow`, `bannerBlob`, `bannerBlobSoft`, `cream`, `pastelMint/Sky/Lavender/Butter/Pink/Leaf/Peach`, `offerGray`, `ink`, `textSecondary`, `textTertiary`, `textPlaceholder`, `textCategory`, `iconGray`, `border`, `cardBorder`, `searchBorder`, `divider`, `surfaceGray`, `surfaceSoft`, `chevronCircle`, `red/redSoft`, `green/greenText/greenSoft`, `amber/amberSoft/amberPill/amberPillText`, `orange/orangeSoft`, `closedGray`, `disabledBg/disabledText/disabledStrong`, `overlay`). Las claves legadas (`carbon`, `gray900…gray50`, `yellowSoft`) siguen y ahora son grises azulados.
- `radius`: legadas `sm 8, md 12, lg 16, xl 24, pill` + medidas `r6, r10, r12, r14, r16, r18, r24`.
- `spacing`: `xs 4 … xxl 32` + `gutter 17.5`.
- `shadows`: `soft` (buscador, chips blancos, botones sobre fotos), `float` (barra de pestañas y botón de búsqueda), `bar` (barras inferiores, hacia arriba), `card` (tarjetas con borde), `none`. Uso: `style={[styles.x, shadows.soft]}` (el View necesita `backgroundColor`).

### 4.3 Escala tipográfica (`<Text variant=…>`)

| Variante | pt / interlineado | Peso | Uso medido |
|---|---|---|---|
| `hero` | 31 / 37 | 700 | "Banano" (27), "Bocamar" (43) |
| `h1` | 27 / 33 | 700 | "Entra a YAVA", "Ofertas", "Cuenta" |
| `h2` | 22,5 / 28 | 700 | nombre en detalle de producto, "Pedido confirmado" |
| `h3` | 20 / 25 | 700 | título de hoja ("Filtros"), estados vacíos |
| `navTitle` | 16,5 / 21 | 600 | "Finalizar pedido" junto al botón atrás |
| `section` | 16,5 / 21 | 700 | "Restaurantes cerca" |
| `banner` | 20 / 24 | 700 | "El sabor de la costa" |
| `cardTitle` | 15 / 19 | 700 | "Comida", "Mercado" |
| `bodyL` | 15 / 20 | 600 | título de fila ("Entrega en la puerta"), nombre en listas |
| `button` | 15,5 / 20 | 600 | texto de botones |
| `bodyM` | 14 / 19 | 400 | texto corrido, subtítulos bajo H1 |
| `bodyS` | 13,5 / 18 | 400 | 2.ª línea de filas, subtítulo del banner |
| `price` / `priceL` | 13,5 / 18 · 23 / 28 | 700 | precio en listas / total de barra inferior |
| `caption2` | 12 / 16 | 400 | "Productos", "Total a pagar" |
| `address` | 11 / 15 | 500 | "Casa · Calle 2 # 3-45" |
| `cardName` | 11,5 / 15 | 700 | nombre en tarjeta de carrusel |
| `link` | 10,5 / 14 | 500 | "Ver todos ›" |
| `meta` | 9,7 / 14 | 400 | "Ceviches · 25–35 min" |
| `metaS` / `tab` | 8,1 / 12 · 8,2 / 11 | 400 / 500 | meta de tarjeta compacta / barra de pestañas |

Legadas (comercio, repartidor, owner): `display` (27), `title` (21), `heading` (17), `body` (15), `bodyStrong` (15/600), `caption` (13), `small` (11).

Tonos (`tone`): `default` (ink), `secondary`, `tertiary` (= `muted`), `placeholder` (= `subtle`), `link` (blueLink), `selected` (blueText), `navy` (blueNavy), `category`, `primary` (blue), `danger`, `success`, `warning`, `inverse`.
**Texto anidado**: un `<Text>` dentro de otro sin `variant` hereda tamaño e interlineado del padre (antes tomaba `body` 15/21 y agrandaba la línea).

### 4.4 `@/components/ui`

```tsx
import { Screen, Header, Text, Button, IconButton, CountBadge, Input, SearchBar, Card, Chip, SplitChip, Badge,
  ListRow, ListGroup, Stepper, Divider, Skeleton, EmptyState, Sparks, BottomBar, Sheet, SheetHandle, SheetBackdrop,
  Segmented, ScreenBottomInset, GUTTER } from "@/components/ui";
```

| Componente | Variantes / props nuevas | Ejemplo |
|---|---|---|
| `Screen` | margen 17,5; `footer` = barra C16 (blanca + `shadows.bar`); `footerStyle="plain"` (C16c); `bottomSpace`; dentro de las pestañas suma solo el alto de la barra flotante (`ScreenBottomInset`) | `<Screen footer={<Button title="Continuar" />}>…</Screen>` |
| `Header` (C2) | `variant="circle"` (defecto, C2a) · `"chevron"` (C2b) · `"large"` (C2c, H1 + subtítulo) · `"arrow"` (C2d); `align="center"`; `backColor` | `<Header title="Finalizar pedido" />` · `<Header variant="large" title="Completa tus datos" subtitle="Así sabremos…" />` · `<Header variant="chevron" align="center" title="Notificaciones" right={…} />` |
| `IconButton` | `variant`: `gray` (atrás 32–36), `white` (sobre fotos, sombra), `plain`, `blue`, `soft`; `size`, `iconSize`, `badge`, `shadow` | `<IconButton icon="share-outline" variant="white" size={38} onPress={…} />` |
| `CountBadge` | contador rojo para íconos | `<View><Icon/><CountBadge count={2} /></View>` |
| `Button` (C15) | `primary` · `secondary` (suave) · `outline` (gris, texto azul) · `outlineBlue` · `ghost` (enlace) · `danger` (borde rojo) · `dangerFill` · `accent` · `dark`; `shape="pill"` (C15b); `iconRight`; `leading` (logo Google); alto 36/44/50; deshabilitado = `disabledBg` | `<Button title="Hacer pedido" shape="pill" full={false} />` · `<Button title="Continuar con Google" variant="outline" leading={<Image source={designImages.logoGoogle} …/>} />` |
| `Input` (C19) | label `bodyM` gris 500, caja 48 radio 12, foco 2 pt `blueText`, `optional`, `multiline` | `<Input label="Apartamento, casa u oficina" optional value={…} />` |
| `SearchBar` (C3) | píldora blanca 43 + sombra; con `onPress` es botón; `variant="filled"`; `clearStyle="circle"` (41); `height` | `<SearchBar placeholder="Busca platos o restaurantes" onPress={…} />` |
| `Card` | `variant`: `outline` (defecto) · `elevated` · `soft` · `selected`; `radius` | `<Card variant="soft" radius={16}>…</Card>` |
| `Chip` (C10) | `variant`: `select` (defecto, C10c) · `filter` (C10a) · `fill` (C10d) · `suggest` (C10e); `trailingIcon`; `height` | `<Chip variant="filter" icon="trophy-outline" label="Mejor valorados" />` · `<Chip variant="fill" selected label="Todas" />` |
| `SplitChip` | chip doble [≡ \| Ordenar ⌄] de 09 | `<SplitChip label="Ordenar" onPressIcon={abrirFiltros} onPress={abrirOrden} />` |
| `Badge` (C24) | tonos `delivered`, `principal`, `closed`, `unavailable`, `time` + legados | `<Badge tone="delivered" label="Entregado" />` |
| `ListRow` (C17) | `iconStyle="plain"` (defecto, ícono suelto) · `"boxed"` (círculo azul claro, 39); `iconColor`; `divider`; `subtitleTone="link"` ("Agregar cupón") | `<ListGroup><ListRow icon="location-outline" iconColor={colors.blue} title="Direcciones" onPress={…} /><ListRow … divider={false} /></ListGroup>` |
| `Stepper` (C14) | `variant`: `outline` · `filled` · `cart`; `size` sm/md/lg | `<Stepper value={1} onChange={…} variant="filled" size="lg" />` |
| `EmptyState` (C23) | `image` (ilustración del diseño), `imageSize`, `tone` blue/red/gray, `compact`; sin imagen dibuja círculo + `Sparks` | `<EmptyState image={designImages.vacioCanasta} title="Tu canasta está vacía" body="…" actionTitle="Explorar" onAction={…} />` |
| `BottomBar` (C16) | `label` + `total` a la izquierda, CTA en `children`; `plain` | `<BottomBar label="Total a pagar" total={formatCOP(38000)}><Button title="Hacer pedido" shape="pill" style={{ flex: 1 }} /></BottomBar>` |
| `Sheet` (C22) | asa, radio 24, `title`, `onClose`, `action`; `SheetBackdrop` = velo que cierra | `<SheetBackdrop onClose={back}><Sheet title="Filtros" action={{ label: "Limpiar", onPress }} onClose={back}>…</Sheet></SheetBackdrop>` |
| `Segmented` (C10b/f) | `variant="pills"` (10) · `"bar"` (26) | `<Segmented options={[{ value: "r", label: "Restaurantes", icon: "storefront-outline" }, …]} value={tab} onChange={setTab} />` |

### 4.5 `@/components/customer`

| Componente | Qué es | Ejemplo |
|---|---|---|
| `AddressHeader` (C1) | pin + ciudad + "**Casa** · Calle…" + chevron en círculo; `bag` (por defecto sin `back`) con contador del carrito; `back` (círculo gris, 09/25/29); `onSearch` agrega el buscador; `onBag`; `right` | `<AddressHeader onSearch={irABuscar} />` · `<AddressHeader back searchPlaceholder="Busca productos o tiendas" onSearch={…} />` · Ofertas (33): `<AddressHeader bag={false} … />` |
| `BagIcon` | bolsa del diseño en SVG | `<BagIcon size={1} />` |
| `CategoryGrid` / `CategoryCard` / `HOME_CATEGORIES` (C4) | tarjetas pastel con foto anclada abajo-derecha; `CategoryCard` acepta `item: { key, title, subtitle: "Línea 1\nLínea 2", bg, image, frame }` y `height` (106 en 29) | `<CategoryGrid onSelect={onCategory} />` |
| `PromoBanner` / `PromoBannerCard` (C5) | banner amarillo con manchas y foto; varias promociones = páginas deslizables (`dots` opcional) | `<PromoBanner items={promos} onPress={onPromo} />` · `<PromoBannerCard promo={{ title, subtitle, image_url: null, coupon_code: null }} width={w} />` |
| `SectionHeader` | título `section` + "Ver todos ›" (deja 9 pt hasta el contenido) | `<SectionHeader title="Tiendas cercanas" onAction={…} />` |
| `MerchantCarouselCard` (C7) | foto 135 × 70 + nombre/meta/calificación (08) | `<ScrollView horizontal contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: 8 }}>{list.map((m) => <MerchantCarouselCard key={m.id} m={m} onPress={…} />)}</ScrollView>` |
| `MerchantCompactCard` (C9) | 198 × 72 con foto a la izquierda (08 "Para tu próximo antojo") | gap 7 |
| `MerchantWideCard` (C8a) | foto ancha 101 pt + textos (09 "Cerca de ti") | `<MerchantWideCard m={m} onPress={…} />` |
| `MerchantHeroCard` (C8b) | tarjeta grande con sello y chevron (10) | `<MerchantHeroCard m={m} onPress={…} />` |
| `MerchantRow` / `MerchantCardWide` | fila de lista / tarjeta antigua (compatibilidad) | — |
| `RatingLine`, `etaText`, `feeText`, `DOT`, `DOT_TIGHT`, `merchantPhoto` | "★ 4,8 · Envío $3.000" (tamaño, `extra`, `dot`), "25–35 min" con raya, "Envío $3.000", separadores, foto de diseño del comercio | `<RatingLine rating={4.8} fee={3000} size={12} extra={[etaText(25, 35)]} />` |
| `FloatingTabBar` (C21) | barra flotante + botón de búsqueda; ya montada en `(tabs)/_layout.tsx` | — |
| `useTabBarSpace()` / `useTabBarBottom()` / `TAB_BAR_HEIGHT` | espacio a dejar al final de un ScrollView propio dentro de las pestañas / distancia de la barra al borde | `contentContainerStyle={{ paddingTop: insets.top, paddingBottom: useTabBarSpace() }}` |
| `AddButton` (C11) | "+" circular 26/28/32/34; `variant` blue/white/outline; `onPhoto`; `disabled` | `<AddButton size={26} onPhoto onPress={…} />` |
| `PhotoTile` (C6) | tile con foto + etiqueta (09, 25) | `<PhotoTile image={designImages.tileCeviches} label="Ceviches" onPress={…} />` |
| `ErrorState`, `ListSkeleton`, `CardsSkeleton` | estados de carga/error (el esqueleto de carrusel imita C7 por defecto) | `<CardsSkeleton count={3} width={135} photoHeight={70} />` |

### 4.6 Fotos del diseño (`@/lib/design-images`)

```ts
import { designImages, merchantImage, productImage, promoImage, merchantDesignImage, productDesignImage } from "@/lib/design-images";

<Image source={designImages.bannerSaborCosta} contentFit="cover" />              // recorte fijo por clave
<Image source={merchantImage(m, "card")} contentFit="cover" />                   // comercio: cover | card | wide | storefront | logo | seal
<Image source={productImage(p)} contentFit="cover" />                            // producto: default | detail | white
<Image source={promoImage(promo)} />                                             // promoción por título
```

- `designImages` tiene una clave camelCase por archivo de `assets/images/diseno/` (ver docs/FOTOS-DISENO.md): `categoriaComida`, `tileCeviches`, `bocamarTarjeta`, `productoCevicheClasicoDetalle`, `vacioCanasta`, `pagoVisa`, `avatarRepartidor`…
- `merchantImage(m, kind)` busca por nombre o slug normalizado (sin tildes): Bocamar, Naranmiche, Amaras, Mercado del Puerto, Tienda de la Costa, Farmacia del Puerto y Bienestar Caribe; si el tipo no existe cae al más parecido y, si el comercio no está en el mapa, a `cover_url`/`logo_url` de la BD.
- `productImage(p, variant)` busca por nombre normalizado (`"Ceviche clásico"`, `"Banano (1 kg)"` → `"banano 1 kg"`, `"Protector solar SPF 50"`…; también claves cortas como `"banano"` o `"leche"`) y cae a `image_urls[0]`/`image_url`.
- Cuando la BD apunte a estas fotos en Storage, los helpers siguen sirviendo (prefieren el recorte local, que no usa red).

### 4.7 Cómo comparar

- `yshot.mjs` recorta el app a la altura del diseño sin barra de estado: **lo anclado abajo** (barra de pestañas, barras con CTA) aparece ≈ 37 pt más abajo y puede quedar cortado en `<out>-compare.jpg`. Para revisarlo alineado por abajo: `/private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/venv/bin/python -I /private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/shots/zb.py <diseño.png> /private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/shots/out/<out>-app.png 140 <salida.png>`.
- Zoom de una franja (pt, coordenadas del contenido): `/private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/venv/bin/python -I /private/tmp/claude-501/-Users-mac-Desktop-Claude-Code/1b7dc848-fbce-401a-8001-d099303fbdd1/scratchpad/shots/zc.py <diseño.png> <app.png> x0 y0 x1 y1 <salida.png> [escala]` (arriba diseño, abajo app).
- Pantallas en pestañas con ScrollView propio: `paddingTop: insets.top` y `paddingBottom: useTabBarSpace()` (ver 08). Con `Screen` no hace falta nada.

## 5. Estado de fidelidad (28 oct 2026; actualizado el 29 oct 2026)

Integración final de los seis grupos (A–F). Cada pantalla se capturó de nuevo en web (Expo, 393 × 852 pt) contra su PNG.
El 29 oct 2026 se alinearon los datos demo con los diseños (segunda tienda y farmacia, Agua, favoritos, notificaciones,
soporte y líneas de pedidos) y se volvieron a capturar 01, 08, 10, 12, 14, 15, 25, 26, 27, 29, 30, 34, 40 y 44;
las filas de 09, 13, 36, 38, 41 y 43 se actualizaron con la revisión visual de ese día. Tras la revisión de código
del mismo día se capturaron otra vez 15, 20, 25, 28, 29, 33, 34 y 44.
La galería completa quedó en `scratchpad/galeria/NN-compare.jpg` (diseño | app), que es un enlace a
`/Users/mac/Desktop/Claude Code/YAVA/herramientas-comparacion/galeria/`.

Cómo leer la tabla:
- **igual**: no hay diferencias visuales fuera de los datos.
- **muy cercana**: estructura, medidas, fotos y colores coinciden (±1–2 pt). Lo que cambia son datos, la plataforma (web frente a iOS) o un detalle menor.
- Diferencias que vienen de los **datos** (nombres, números de pedido, horas, precios, cantidad de tiendas) no son errores: el app siempre muestra datos reales.
- En web, lo anclado abajo (barra de pestañas, barras con CTA, hojas) sale unos 35–70 pt más abajo y puede quedar cortado. Esto es porque la web no tiene barra de estado ni indicador de inicio. Se revisó alineado por abajo con `zb.py`.

| # | Pantalla | Estado | Diferencia principal | Captura (ruta y estado) |
|---|---|---|---|---|
| 01 | Apertura | igual | Logo de 229 × 64 pt, centrado. El splash de iOS usa `splash-logo-ios.png` (el logo a 229 × 64 pt con 13,6 pt transparentes debajo): mismo tamaño y misma posición que la Apertura, así que ya no salta. Solo se ve en un build nativo nuevo (TestFlight). Android sigue con `splash-icon.png` a 200 pt. | `/` con la consulta de perfil colgada (`--hang /rest/v1/profiles`) |
| 02 | Acceso | muy cercana | El botón de Apple solo sale en iOS; en web, todo lo de abajo sube un botón. "Entrar con correo" queda discreto bajo el pie. | `/login --login ninguno` |
| 03 | Celular | muy cercana | Capturado vacío (placeholder). En iOS el CTA va sobre el teclado; no se probó en el dispositivo. | `/phone --login ninguno` |
| 04 | Verificación | muy cercana | Capturado vacío; la caja con foco lleva borde azul. | `/verify?phone=3001234567 --login ninguno` |
| 05 | Datos personales | muy cercana | El correo es el real. La nota "Puedes editar tus datos…" queda bajo el CTA anclado. | `/(customer)/personal-data` |
| 06 | Ubicación | muy cercana | En web el mapa es el iframe OSM (en iOS, mapa de Apple) y asoma el marcador de OSM. La tarjeta muestra el texto de respaldo porque en web no hay geocodificación inversa. | `/(customer)/location` + S-LOC |
| 07 | Dirección | muy cercana | Los íconos Casa/Trabajo son aproximados (MaterialCommunityIcons/Ionicons). | `/(customer)/address?id=b000…0001` + S-LOC |
| 08 | Inicio | igual | "Para tu próximo antojo" ya no depende de los favoritos: con los tres restaurantes guardados sigue Amaras, Bocamar. | `/` + S-LOC |
| 09 | Restaurantes | muy cercana | Chip "Hasta 35 min" unos 2 pt más ancho; trofeo de Ionicons algo más fino. Revisado el 29 oct: sin cambios. | `/restaurants?category=food` + S-LOC |
| 10 | Búsqueda | muy cercana | Ceviche clásico sale primero (`search_catalog` ordenado por la migración 0014). Datos: el PNG pone el mixto antes que el de camarón (el menú los ordena al revés), descripciones y precios de la BD; "Ceviches" sin "Cocina de mar". | `/search?q=ceviche` + S-LOC |
| 11 | Filtros | muy cercana | La hoja se abre sobre 09 (el PNG la muestra sobre una variante de Inicio). | 09 + `--aria Filtros` |
| 12 | Menú Bocamar | muy cercana | Pestañas "Acompañantes" y "Bebidas" como en el PNG. Datos: subtítulo "Ceviches · Mariscos · Comida de mar" (el PNG de 12 dice "Ceviches y sabores del Caribe"; el de 43 coincide con el app), descripciones nuevas, "(321)"; el marcador sale lleno porque María tiene Bocamar en favoritos. El 6.º plato es Agua (foto de 14). | `/merchant/c000…0001` |
| 13 | Detalle producto | muy cercana | Descripción "Camarones, limón, cebolla morada y cilantro." y "Elige el picante" (Obligatorio · 1 opción) ya coinciden. El marcador sale lleno porque Bocamar es favorito de María (el PNG 13 lo muestra vacío; el 34 lo contradice). El recorte del avatar de Bocamar es algo distinto. | `/product/e000…0001` |
| 14 | Complementos | muy cercana | Bebidas (Limonada natural seleccionada, Agua, Limonada de coco), "Acompañantes" con "Patacones" y "Chips de plátano" (sin el sufijo "Bocamar") y subtotal $34.000 coinciden. Faltan los enlaces "Ver todas" / "Ver todos" (solo salen si hay más productos que tarjetas) y sigue la fila extra "Complementos · Opcional · hasta 3" del seed. | 13 + `--aria 'Agregar · $28.000' --aria 'Agregar Limonada natural'` |
| 15 | Canasta | igual | "Te puede gustar" toma las categorías que aún no están en la canasta (Patacones y Chips de plátano), no los dos más baratos. Elige entre todo el menú disponible (no entre los 8 primeros) y conoce la categoría de cada línea desde el primer render, así que las tarjetas no cambian al cargar. | `/cart` + S-CART |
| 16 | Revisar y pagar | muy cercana | Pago en "Efectivo" porque la tarjeta está apagada sin la llave de Wompi; mapa web. | `/checkout` + S-CART + S-LOC |
| 17 | Métodos de pago | muy cercana | No salen la fila Visa ni "Agregar tarjeta": `CARDS_ON` depende de `WOMPI_PUBLIC_KEY`. Se ve la nota "disponible pronto". | `/payment-methods?select=1` |
| 18 | Agregar tarjeta | muy cercana | La casilla dice "Usar como tarjeta principal" (el PNG: "Guardar para próximos pedidos"), porque la tarjeta siempre se guarda. | `/add-card` |
| 19 | Cupón | igual | Estado vacío capturado con la lista de cupones simulada vacía; con datos se ve la lista. | `/coupon` + `--mock coupons=[]` |
| 20 | Pedido confirmado | igual | "Llegará en 25–35 min": el #1042 tiene `eta_min`/`eta_max` 25/35 en la BD y en el seed (antes 7–12). | `/order/9000…1042/confirmed` |
| 21 | Seguimiento | muy cercana | Mapa web (OSM) en vez del mapa con estilo. Datos: #1172 y horas. | `/order/9000…1060 --login cliente2` |
| 22 | Chat repartidor | igual | Mensajes simulados. | `…1060/chat --login cliente2` + `--mock order_messages` |
| 23 | Pedido entregado | igual | Estado sin calificar simulado. Con el #1042 ya calificado, "Calificar" desaparece y "Volver a pedir" pasa a primario. | `…1042/delivered` + `--mock ratings=[]` |
| 24 | Calificación | igual | Capturado tras tocar 5 estrellas, "Sabor" y "Buena". | `…1042/rate` + `--mock ratings=[]` |
| 25 | Mercado | muy cercana | Las dos tiendas (Mercado del Puerto, Tienda de la Costa), los mosaicos y "Lo esencial" (Banano, Tomate, Arroz) coinciden; "Lo esencial" ya no repite los productos de la segunda tienda y de las copias muestra la que se puede comprar ("Aceite Premier 1 L", agotado en Mercado del Puerto, sale con "+" de Tienda de la Costa). Las unidades salen igual que en 26–28 ("Mango Tommy" · "1 unidad"). Asoma una 4.ª tarjeta (Leche) a la derecha. | `/market` + S-LOC |
| 26 | Tienda mercado | igual | Subtítulo "Supermercado · Abarrotes y más" (descripción del comercio) y "Destacados" en el orden del PNG (Banano, Tomate, Arroz, Leche). | `/merchant/c000…0004` |
| 27 | Producto mercado | igual | Chip "Bolsa de 1 kg" y "Producto fresco de Mercado del Puerto." | `/product/<banano>` |
| 28 | Canasta mercado | igual | — | `/cart` + canasta de mercado |
| 29 | Farmacia | muy cercana | Las dos farmacias y los destacados (Protector solar SPF 50, Cepillo dental, Apósitos adhesivos) coinciden; el nombre se parte "Protector solar / SPF 50" como en el PNG y la lista ya no repite productos de Bienestar Caribe. No asoma una 3.ª farmacia y al final hay una nota de venta libre. | `/pharmacy` + S-LOC |
| 30 | Producto farmacia | muy cercana | El título dice "SPF 50" (el PNG 30 dice "SPF50"; el de 29, "SPF 50"). No salen los puntos del carrusel porque el producto tiene 1 sola foto. | 29 → `--click "Protector solar"` (en 29 el nombre lleva espacio duro) |
| 31 | Datos del envío | muy cercana | Campo extra "Describe el contenido (opcional)" antes del CTA (funcional, se conservó). | `/shipments/new` + S-LOC |
| 32 | Revisar envío | muy cercana | El mapa web no muestra ruta ni pines del diseño; pago en Efectivo. | 31 llenado con `--fill` + "Cotizar envío" |
| 33 | Ofertas | muy cercana | Datos: 3 promociones reales sin precio, así que donde iría el precio va el cupón. La del cupón usa su foto de Unsplash de la BD. "Descubre más" (abajo, `--scroll 760`) pone primero los restaurantes: Naranmiche Desde $24.000, Amaras Desde $20.000 y Tienda de la Costa Desde $4.200. El "Desde" es el precio más bajo de la primera categoría del menú (los platos, no una bebida). El PNG muestra solo Amaras ($22.000) porque allí Naranmiche tiene promoción. | `/offers` + S-LOC |
| 34 | Favoritos | igual | Bocamar, Naranmiche y Amaras; "Tus productos favoritos" muestra Ceviche clásico · Bocamar (productos en el orden de los favoritos, pedidos de los 5 primeros comercios guardados y ordenados y cortados en el app). | `/favorites` + S-LOC |
| 35 | Cuenta | igual | — | `/account` |
| 36 | Mis pedidos | igual | Bocamar 2 productos $38.000, Naranmiche 1 producto $30.000 y Amaras 1 producto $26.000, en el orden del PNG. Solo cambian las fechas y hay más pedidos debajo. | `/orders --click Historial` |
| 37 | Direcciones | igual | — | `/addresses` + S-LOC |
| 38 | Notificaciones | igual | Datos reales (sin simulación): las tres notificaciones de #1042 y el punto azul en "Pedido entregado". Cambian el encabezado ("23 oct" en vez de "Hoy") y las horas. | `/notifications` |
| 39 | Ayuda | igual | — | `/help` |
| 40 | Chat soporte | igual | Datos reales (sin simulación). El saludo de soporte guardado en la BD reemplaza al saludo local, que solo sale mientras soporte no ha escrito. Solo cambian las horas. | `/support?order=…1042` |
| 41 | Búsqueda sin resultados | igual | Datos: el segundo restaurante sale Naranmiche en vez de Amaras. Revisado el 29 oct: sin cambios. | `/search?q=sushi` |
| 42 | Canasta vacía | igual | — | `/cart` sin canasta |
| 43 | Restaurante cerrado | igual | Subtítulo "Ceviches · Mariscos · Comida de mar" como en el PNG. Cerrado simulado (`is_open` en false); el horario sale de `merchant_hours`. Datos: "(321+)". | `/merchant/c000…0001` + `--patch is_open` |
| 44 | Producto no disponible | muy cercana | Línea gris "Limonada natural · 500 ml. · No disponible", aviso, alternativas Agua y Limonada de coco (misma categoría, orden del menú) y resumen $34.000 / $38.000 coinciden. "Limonada de coco" se corta en su tarjeta y la descripción del ceviche es la de la BD, con "Sin picante". | `/cart` + S-CART-NODISP (`--patch`, ver §0.1) |
| 45 | Pago fallido | muy cercana | El #1173 ya pasó a cancelado: no hay "Reintentar" (esperado) y el método sale como "Tarjeta" genérica. | `…1061/payment-failed --login cliente2` |
| 46 | Fuera de cobertura | muy cercana | Mapa web; la zona gris es decorativa. | `/(customer)/location` + S-LOC en Bogotá + `--geo 4.711,-74.072` |
| 47 | Cancelar pedido | muy cercana | Ningún motivo viene preseleccionado (el PNG marca el primero). Datos: 1 producto. | `…1043/cancel --login cliente2` |
| 48 | Sin conexión | igual | Se cortó la red después de cargar. | `/` + `--abort supabase.co/rest/ --abort-late --click Naranmiche` |

Resumen (29 oct 2026): 22 igual, 26 muy cercana, ninguna parcial. Ninguna pantalla tiene diferencias de estructura, foto o color pendientes.

### 5.1 Herramienta de la galería

`scratchpad/shots/yshotG.mjs` es una copia de `yshot.mjs`; el original no se modificó. Agrega estas opciones de solo lectura:

| Opción | Qué hace |
|---|---|
| `--mock 'subcadena=archivo.json'` | Responde los GET cuya URL contiene la subcadena con el contenido del archivo. |
| `--patch 'subcadena=desde=>hasta'` | Reemplaza texto en la respuesta real. |
| `--aria "Etiqueta"` | Hace clic por `aria-label`. |
| `--fill 'placeholder=texto'` | Escribe en el campo que tiene ese placeholder. |
| `--abort subcadena` | Corta la red para esas peticiones. Con `--abort-late`, el corte empieza después de la carga. |
| `--hang subcadena` | Deja esas peticiones sin respuesta. |
| `--after ms` | Espera ese tiempo después de los clics. |

Las semillas usadas están en `scratchpad/seeds.sh` y los JSON simulados en `scratchpad/E/` y `scratchpad/G/`. Ninguna escribe en la BD.

### 5.2 Limpieza de recortes

Se quitaron 18 recortes que ningún archivo usaba y que estaban reemplazados por versiones más completas. También se quitaron sus claves de `design-images.ts`. Los archivos se movieron a `scratchpad/G/recortes-retirados/`.

| Recorte retirado | Reemplazado por |
|---|---|
| `acceso-comida.jpg` | `assets/images/auth-hero.jpg` (02) |
| `chip-{ceviches,hamburguesas,shawarmas,bebidas}.jpg` | `restaurantes-tile-*.jpg` |
| `categoria-{frutas,verduras,lacteos,despensa}.jpg` | `mercado-tile-*.jpg` |
| `banner-mercado.jpg` | `banner-mercado-completo.jpg` |
| `categoria-{cuidado-personal,proteccion-solar,bebes,primeros-auxilios}.jpg` | `farmacia-cat-*.jpg` |
| `oferta-combo-{ceviche,hamburguesa}.jpg` y `oferta-amaras.jpg` | `oferta-*-tarjeta.jpg` |
| `pago-fallido.png` | `pago-fallido-limpio.png` |

`assets/images/diseno/` queda con 124 archivos, todos registrados en `design-images.ts` y en uso.
En `components/customer/order/` no quedan juegos paralelos: solo `kit.tsx` y `photos.ts`.

### 5.3 Pendientes

1. **Probar en iPhone (TestFlight).** Revisar:
   - el interlineado de SF frente a la web (±1–2 pt);
   - el CTA sobre el teclado (03, 04);
   - los mapas nativos (06, 16, 21, 32, 46);
   - el botón de Apple (02).
2. **Splash nativo.** Hecho en iOS (29 oct 2026): `app.json` usa `splash-logo-ios.png` a 229 pt sobre blanco. Es `logo-horizontal.png` llevado a 229 × 64 pt, como lo dibuja la Apertura (01), con 13,6 pt transparentes debajo para que quede 6,8 pt sobre el centro, igual que en la Apertura. Android se quedó como estaba. Falta verlo en un build nuevo de TestFlight.
3. **Tarjetas (17, 18, 45).** Necesitan `WOMPI_PUBLIC_KEY`; sin ella solo hay Efectivo y Nequi/Daviplata.
4. **Datos demo.** Resuelto el 29 oct 2026 (segunda tienda y farmacia, Agua y Limonada de coco activas, tres favoritos, líneas en todos los pedidos, notificaciones y caso de soporte de María). Quedan detalles menores:
   - la foto de Unsplash de "Alcohol antiséptico 350 ml" (Farmacia del Puerto y Bienestar Caribe) muestra un cartel de "COVID-19"; hace falta una foto de un frasco de alcohol o un recorte de diseño;
   - Tienda de la Costa y Bienestar Caribe no tienen logo: la baldosa de 26 usa su fachada;
   - "Ver todas" / "Ver todos" de 14 solo salen cuando hay más productos que tarjetas;
   - Agua, Leche (1 L) de las dos tiendas, Cepillo dental y Apósitos adhesivos tienen en la BD una foto equivalente de Unsplash (revisada a ojo el 29 oct 2026), y Arroz (1 kg) de Tienda de la Costa reutiliza `arroz.jpg` de Mercado del Puerto. Así los paneles de comercio, dueño y admin no muestran el ícono vacío; el app de cliente sigue usando los recortes del diseño por nombre. Subir esos recortes a Storage (`product-images`) necesita la llave de servicio;
   - en 16, "Entrega estimada" suma el traslado a la preparación (35 – 50 min) y el PNG dice 25 – 35 min.
5. **Arranque sin red (visto en web).** Con sesión guardada y sin red desde el arranque, la Apertura se queda 10–25 s: `refreshProfile` espera los reintentos de las consultas. Luego se muestra el inicio con el aviso de sin conexión. Conviene revisarlo en nativo y, si pasa, ponerle un tiempo límite al perfil en `store/auth.ts`.
6. **Mapa en web.** El marcador propio del iframe OSM asoma bajo el pin (`src/lib/maps-web.tsx`). Solo afecta a la web.
