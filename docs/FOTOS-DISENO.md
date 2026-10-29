# Fotos e ilustraciones de los diseños (cliente 01–48)

Imágenes recortadas de los PNG de diseño (`YAVA/reinicio-v2/tanda-01 … tanda-06`) para que el app use exactamente las mismas fotos que los diseños, en lugar de las fotos de Unsplash.

- Carpeta: `apps/mobile/assets/images/diseno/` (71 archivos, unos 1,9 MB).
- Escala de los diseños: 851 px de ancho = 393 pt → **2,17 px por punto**. Para pasar un tamaño de píxeles a puntos, divide entre 2,17.
- Caja = `(x0, y0, x1, y1)` en píxeles del PNG de origen (x1 e y1 excluidos).
- Los JPG tienen calidad 92. Los PNG tienen transparencia.
- Los recortes se hicieron unos píxeles hacia dentro del contenedor para que no queden esquinas redondeadas ni bordes. Se revisaron uno por uno: ninguno conserva texto de interfaz, bordes, botones, corazones ni insignias. El texto impreso en un producto, como la etiqueta del protector solar o el letrero de una fachada, es parte de la foto.

## Retoques (zonas reconstruidas)

Algunas fotos tenían un botón o la barra de estado encima. Esa zona se reconstruyó rellenándola con los colores de alrededor. Donde el fondo es liso o desenfocado, el retoque no se nota. En los demás casos queda un difuminado, siempre en el mismo sitio donde el app pondrá su botón.

| Archivo | Zona retocada | ¿Se nota? |
|---|---|---|
| comercio-bocamar-portada.jpg | barra de estado y botón atrás (fondo desenfocado) | No |
| producto-protector-solar.jpg | botones atrás, compartir y corazón (pared lisa) | No |
| producto-banano-blanco.jpg | botón cerrar (fondo blanco) | No |
| fachada-mercado-del-puerto.jpg | corazón (techo de madera) | Apenas |
| fachada-tienda-de-la-costa.jpg | corazón y su fondo oscuro (esquina superior derecha) | Apenas |
| envio-caja.png | círculo de selección (fondo blanco) | No |
| producto-ceviche-clasico-detalle.jpg | barra de estado, cerrar, compartir y guardar | **Sí**, sobre los patacones arriba a la derecha. Úsala solo como portada del detalle, con los botones encima |
| comercio-mercado-del-puerto-portada.jpg | barra de estado, atrás, buscar y corazón | **Sí**, junto a la botella de leche. Úsala solo como portada de la tienda (26), con los botones encima |

Las fachadas de farmacia tenían encima la insignia "30–40 min". No se retocaron: el recorte termina justo encima de la insignia, así que la foto es más baja que la tarjeta (370×193 px). Muéstralas con `contentFit="cover"`.

## Comercios

| Archivo | px | Origen · caja | Qué es | Dónde se usa | Registro en BD |
|---|---|---|---|---|---|
| comercio-bocamar-portada.jpg | 851×543 | 43 · (0,0,851,543) | Ceviche en bowl azul, limón y patacones (portada completa) | 43 portada; 12 portada del menú (misma foto) | Comercio **Bocamar** (portada) |
| comercio-bocamar.jpg | 766×202 | 09 · (43,786,809,988) | Banda ancha del ceviche | 09 "Cerca de ti"; 08 y 11 "Restaurantes cerca"; 10 tarjeta con sello | Bocamar (alternativa ancha) |
| comercio-naranmiche.jpg | 766×202 | 09 · (43,1131,809,1333) | Hamburguesa con papas (banda ancha) | 09; 08 y 11 | Comercio **Naranmiche** (portada) |
| comercio-amaras.jpg | 766×201 | 09 · (43,1478,809,1679) | Shawarma con papas (banda ancha) | 09; 08 y 11 | Comercio **Amaras** (portada) |
| comercio-bocamar-tarjeta.jpg | 370×213 | 34 · (47,508,417,721) | Ceviche, encuadre 1,7:1 | 34 Favoritos; 41 y 08 tarjetas; 36 miniatura | Bocamar (alternativa) |
| comercio-naranmiche-tarjeta.jpg | 370×216 | 34 · (47,753,417,969) | Hamburguesa entera con papas | 34; 08 "Para tu próximo antojo"; 36 | Naranmiche (alternativa) |
| comercio-amaras-tarjeta.jpg | 370×215 | 34 · (47,999,417,1214) | Shawarma entero | 34; 41; 08; 36 | Amaras (alternativa) |
| logo-bocamar.png | 113×98 | 12 · (52,490,165,588) | Logo de olas en color sólido #004796, fondo transparente | 12: va en una baldosa de fondo **#FDF7EC** de 125×110 px (58×51 pt) | Bocamar (logo) |
| logo-bocamar-sello.png | 175×175 | 10 · (56,1300,231,1475) | Pez y palabra BOCAMAR en #063D75, fondo transparente | 10: va en un círculo blanco de 174 px (80 pt) sobre la portada | Bocamar (logo alternativo) |
| comercio-mercado-del-puerto-portada.jpg | 851×348 | 26 · (0,0,851,348) | Bolsa de mercado: lechuga, banano, tomate y leche (retocada) | 26 portada de la tienda | Mercado La Costa (portada de la pantalla de tienda) |
| logo-mercado-del-puerto.jpg | 174×175 | 26 · (43,391,217,566) | Bolsa de mercado sobre menta | 26: baldosa del logo, fondo **#D9F3E8** de 192×193 px | **Mercado La Costa** (logo) |
| fachada-mercado-del-puerto.jpg | 381×220 | 25 · (46,946,427,1166) | Fachada con el letrero "Mercado del Puerto" | 25 "Tiendas cercanas" | — (alternativa) |
| fachada-tienda-de-la-costa.jpg | 379×220 | 25 · (457,946,836,1166) | Fachada con el letrero "Tienda de la Costa" | 25 "Tiendas cercanas" | **Mercado La Costa** (portada) |
| fachada-farmacia-del-puerto.jpg | 370×193 | 29 · (46,911,416,1104) | Fachada con el letrero "Farmacia del Puerto" | 29 "Farmacias cercanas" | **Farmacia Vida** (portada) |
| fachada-bienestar-caribe.jpg | 370×193 | 29 · (449,911,819,1104) | Fachada con el letrero "Bienestar Caribe" | 29 "Farmacias cercanas" | — (alternativa) |

Los nombres del seed no coinciden con los de los diseños:

- **Mercado La Costa**: en los diseños la tienda se llama "Mercado del Puerto". Para la portada se eligió la fachada "Tienda de la Costa", porque su letrero es el más parecido al nombre del seed. El logo es la baldosa de la bolsa, que no lleva texto. La pantalla de tienda (26) puede usar `comercio-mercado-del-puerto-portada.jpg` como portada.
- **Farmacia Vida**: ningún diseño tiene una farmacia con ese nombre. Se usa la fachada "Farmacia del Puerto", que es la farmacia de la pantalla 30.

## Productos

| Archivo | px | Origen · caja | Qué es | Dónde se usa | Producto en el seed |
|---|---|---|---|---|---|
| producto-ceviche-clasico.jpg | 495×437 | 13 · (125,68,620,505) | Ceviche clásico, zona central del detalle, sin botones | 12 cuadrícula, 10 lista, 34 favorito, 43 "Menú destacado" y miniaturas de 14, 15, 20, 23, 44 y 47 | **Ceviche clásico** |
| producto-ceviche-clasico-detalle.jpg | 851×507 | 13 · (0,0,851,507) | Portada completa del detalle (retocada) | 13 portada | Ceviche clásico (solo portada del detalle) |
| producto-ceviche-camaron.jpg | 306×238 | 12 · (446,912,752,1150) | Ceviche de camarón en bowl claro | 12 cuadrícula, 10 lista | **Ceviche de camarón** |
| producto-ceviche-mixto.jpg | 305×237 | 12 · (37,1354,342,1591) | Ceviche mixto con pulpo | 12 cuadrícula, 10 lista | **Ceviche mixto** |
| producto-limonada-natural.jpg | 357×277 | 43 · (447,1149,804,1426) | Limonada con hierbabuena | 43, 12, 14, 15, 20, 23, 44 y 47 | **Limonada natural** |
| producto-limonada-coco.jpg | 172×229 | 14 · (593,346,765,575) | Limonada de coco con coco partido (pierde 15 px del borde derecho del vaso) | 14 Bebidas; 44 sugerencia | **Limonada de coco** |
| producto-patacones.jpg | 293×197 | 14 · (49,765,342,962) | Patacones con guacamole | 14 Acompañantes; 15 "Te puede gustar" | **Patacones Bocamar** |
| producto-chips-platano.jpg | 292×197 | 14 · (442,765,734,962) | Chips de plátano en bowl de madera | 14; 15 | **Chips de plátano Bocamar** |
| producto-banano.jpg | 361×283 | 26 · (45,742,406,1025) | Banano sobre mármol | 26 cuadrícula; 28 canasta | **Banano (libra)** |
| producto-tomate.jpg | 362×283 | 26 · (445,742,807,1025) | Tomates sobre madera | 26; 28 | **Tomate (libra)** |
| producto-banano-canasta.jpg | 221×187 | 28 · (47,226,268,413) | Racimo de banano sobre madera oscura | 28 línea de la canasta de mercado (103 × 87 pt) | **Banano (libra)** (`productoBananoCanasta`) |
| producto-tomate-canasta.jpg | 221×187 | 28 · (47,455,268,642) | Tomates sobre madera | 28 línea de la canasta de mercado | **Tomate (libra)** (`productoTomateCanasta`) |
| producto-arroz.jpg | 362×300 | 26 · (44,1242,406,1542) | Arroz en bowl de madera | 26; 25 "Lo esencial" | **Arroz Diana 1 kg** |
| producto-protector-solar.jpg | 796×817 | 30 · (28,102,824,919) | Frasco de protector SPF 50 con toalla y palma | 30 portada | **Protector solar FPS 50** |
| producto-banano-blanco.jpg | 815×730 | 27 · (20,95,835,825) | Racimo de banano sobre fondo blanco | 27 detalle; 25 "Lo esencial" | Banano (libra), versión de fondo blanco |
| producto-protector-solar-blanco.jpg | 236×214 | 29 · (50,1412,286,1626) | Tubo SPF 50 sobre blanco | 29 "Productos destacados" | Protector solar FPS 50, versión de fondo blanco |
| producto-agua.jpg | 170×229 | 14 · (324,346,494,575) | Botella de agua | 14 Bebidas; 44 | — (no está en el seed) |
| producto-leche.jpg | 362×299 | 26 · (445,1242,807,1541) | Botella y vaso de leche | 26 | — (no está en el seed) |
| producto-cepillo-dental.jpg | 224×214 | 29 · (322,1412,546,1626) | Dos cepillos de dientes sobre blanco | 29 | — (no está en el seed) |
| producto-apositos.jpg | 241×214 | 29 · (580,1412,821,1626) | Caja de curitas sobre blanco | 29 | — (no está en el seed) |

### Productos del seed sin foto en ningún diseño

No aparecen como producto en las pantallas 01–48, así que no se les asignó ninguna imagen. Quedan con su foto actual:

- **Naranmiche**: Clásica Naranmiche, Doble tocineta, Papas a la francesa y Gaseosa 400 ml. La hamburguesa solo sale como portada del comercio, como ícono de categoría y en la oferta "Combo hamburguesa + papas".
- **Amaras**: Shawarma de pollo, Shawarma mixto y Falafel. El shawarma solo sale como portada y en la oferta de Amaras.
- **Mercado**: Mango Tommy (unidad), Cebolla cabezona (libra) y Aceite Premier 1 L. El aceite solo aparece dentro de la foto de la categoría Despensa.
- **Farmacia**: Acetaminofén 500 mg x 10, Ibuprofeno 400 mg x 10 y Alcohol antiséptico 350 ml.
- **Comercio** Arepas Doña Rosa (solicitud pendiente): no aparece en los diseños.

## Imágenes fijas (no dependen de la BD)

Cuando la imagen va sobre una baldosa de color, el fondo indicado es el color que debe tener el contenedor. Lo ideal es poner la imagen pegada a la esquina inferior derecha de la baldosa: el recorte dejó unos 10 px (4–5 pt) de margen para quitar la esquina redondeada.

| Archivo | px | Origen · caja | Qué es | Dónde se usa | Fondo del contenedor |
|---|---|---|---|---|---|
| acceso-comida.jpg | 749×309 | 02 · (51,545,800,854) | Ceviche, hamburguesa y shawarma | 02 Acceso | — |
| categoria-comida.jpg | 192×189 | 08 · (215,321,407,510) | Hamburguesa | 08 baldosa Comida, de 379×209 px | **#FEF7E6** |
| categoria-mercado.jpg | 189×188 | 08 · (614,322,803,510) | Bolsa de mercado con leche | 08 baldosa Mercado | **#EAF6F1** |
| categoria-farmacia.jpg | 190×189 | 08 · (216,551,406,740) | Dispensador, frasco, pastillas y algodón | 08 baldosa Farmacia | **#E5F1FD** |
| categoria-envios.jpg | 216×189 | 08 · (588,551,804,740) | Caja de cartón con cinta azul | 08 baldosa Envíos | **#ECF0FD** |
| banner-sabor-costa.jpg | 352×185 | 08 · (452,783,804,968) | Plato de ceviche con patacones, rayitas amarillas y círculo amarillo de fondo | 08 banner "El sabor de la costa", de 777×205 px | **#FDF0C0** (el círculo de atrás es #FEE37F y está dentro de la imagen) |
| chip-ceviches.jpg | 172×172 | 09 · (44,440,216,612) | Ceviche | 09 chip de categoría Ceviches, de 188×188 px | — |
| chip-hamburguesas.jpg | 170×173 | 09 · (250,441,420,614) | Hamburguesa | 09 chip Hamburguesas | — |
| chip-shawarmas.jpg | 171×173 | 09 · (454,441,625,614) | Shawarma | 09 chip Shawarmas | — |
| chip-bebidas.jpg | 150×173 | 09 · (658,440,808,613) | Limonada | 09 chip Bebidas | — |
| categoria-frutas.jpg | 159×162 | 25 · (47,320,206,482) | Banano y manzanas | 25 baldosa Frutas, de 177×180 px. La foto ocupa toda la baldosa | **#FEF7E0** |
| categoria-verduras.jpg | 167×161 | 25 · (242,321,409,482) | Tomate, zanahoria, brócoli y lechuga | 25 Verduras | **#EEF7E4** |
| categoria-lacteos.jpg | 167×160 | 25 · (445,321,612,481) | Leche, yogur y queso | 25 Lácteos | **#E7F3FD** |
| categoria-despensa.jpg | 156×162 | 25 · (647,320,803,482) | Pasta, granos y aceite | 25 Despensa | **#FDEFDF** |
| banner-mercado.jpg | 368×261 | 25 · (434,566,802,827) | Bolsa con verduras y leche | 25 banner "Tu mercado, a domicilio", de 774×281 px | **#FEF7E1** |
| categoria-cuidado-personal.jpg | 194×208 | 29 · (212,330,406,538) | Dispensador, cepillo, frasco y toalla | 29 baldosa Cuidado personal, de 377×228 px | **#E8F3FE** |
| categoria-proteccion-solar.jpg | 177×208 | 29 · (626,330,803,538) | Protector, sombrero, gafas y toalla | 29 Protección solar | **#FEF5DB** |
| categoria-bebes.jpg | 206×210 | 29 · (200,573,406,783) | Patito, tetero y toalla | 29 Bebés | **#FCEFF5** |
| categoria-primeros-auxilios.jpg | 202×210 | 29 · (600,573,802,783) | Botiquín rojo y vendas | 29 Primeros auxilios | **#E9F5F0** |
| oferta-combo-ceviche.jpg | 458×359 | 33 · (345,516,803,875) | Ceviche y limonada. A la izquierda se funde con el fondo crema | 33 tarjeta Bocamar, de 773×383 px. Pegar a la derecha | Degradado de **#FDF6EC** a la izquierda hasta la foto |
| oferta-combo-hamburguesa.jpg | 485×396 | 33 · (318,926,803,1322) | Hamburguesa y papas, con fundido a la izquierda | 33 tarjeta Naranmiche | **#FDF6E3** |
| oferta-amaras.jpg | 516×184 | 33 · (290,1444,806,1628) | Dos shawarmas y papas, con fundido gris a la izquierda | 33 "Descubre más" | **#F6F5F5** |
| avatar-repartidor.jpg | 127×127 | 21 · (66,1326,193,1453) | Carlos R., gorra y camiseta azules | 21 y 22, con `borderRadius` circular | — |
| avatar-repartidor-alt.jpg | 120×120 | 24 · (57,1234,177,1354) | Carlos R., chaqueta amarilla | 24, en círculo | — |
| envio-caja.png | 166×150 | 31 · (606,1416,772,1566) | Caja de cartón con cinta azul, fondo transparente | 31 tamaños Pequeño, Mediano y Grande (la misma caja a 52, 57 y 74 pt); 32 "Paquete pequeño" | — |
| vacio-cupones.png | 272×262 | 19 · (305,695,577,957) | Cupón "%" en círculo azul claro con rayitas amarillas | 19 "No tienes cupones" | Transparente; pensada para fondo blanco |
| vacio-busqueda.png | 196×198 | 41 · (327,343,523,541) | Lupa en círculo azul claro con rayitas | 41 Sin resultados | Ídem |
| vacio-canasta.png | 246×228 | 42 · (322,553,568,781) | Canasta de líneas con rayitas amarillas | 42 Canasta vacía | Ídem |
| pago-fallido.png | 203×223 | 45 · (329,274,532,497) | Tarjeta con alerta roja | 45 Pago fallido | Ídem |
| sin-conexion.png | 232×182 | 48 · (306,609,538,791) | Nube tachada | 48 Sin conexión | Ídem |
| sin-cobertura.png | 126×121 | 46 · (48,1281,174,1402) | Pin tachado en círculo gris | 46 Fuera de cobertura | Ídem |
| notif-entregado.png | 113×112 | 38 · (83,317,196,429) | Bolsa con check, baldosa verde; esquinas transparentes | 38 Notificaciones | — |
| notif-en-camino.png | 113×113 | 38 · (83,490,196,603) | Moto con líneas de velocidad, baldosa azul | 38 | — |
| notif-confirmado.png | 113×114 | 38 · (83,670,196,784) | Recibo amarillo en baldosa crema | 38 | — |
| pago-visa.png | 78×68 | 16 · (36,915,114,983) | Logo VISA blanco sobre azul | 16, 23 y 32 | — |
| pago-visa-claro.png | 109×73 | 45 · (75,1024,184,1097) | Logo VISA azul sobre fondo claro | 20 y 45 | — |
| logo-google.png | 58×60 | 02 · (210,977,268,1037) | "G" de Google | 02 botón "Continuar con Google" | — |
| bandera-colombia.png | 59×45 | 03 · (75,622,134,667) | Bandera de Colombia | 03 selector de país | — |

## No se extrajeron

- **Mapas** (06, 16, 21, 32 y 46): el app usa un mapa real (`react-native-maps`, y OpenStreetMap en web). Las imágenes de los diseños traen nombres de calles y pines dibujados.
- **Moto del repartidor sobre el mapa** (21): mide unos 70 px y está sobre el mapa, así que no se puede separar limpia. Hay que hacerla como marcador vectorial.
- **Íconos de línea** (barra de pestañas, reloj de "Restaurante cerrado" (43), logo de Apple, candado, etc.): se implementan con íconos vectoriales.
- **Repeticiones**: las miniaturas de pedidos, canasta, chat y ayuda (15, 20, 22, 23, 36, 39, 40, 44, 45 y 47) son versiones pequeñas de las fotos de arriba. La portada de 12 tiene la misma composición que 43, pero con cuatro botones encima.

## Mapa para el código

```json
{
  "merchants": {
    "Bocamar": { "cover": "comercio-bocamar-portada.jpg", "logo": "logo-bocamar.png" },
    "Naranmiche": { "cover": "comercio-naranmiche.jpg", "logo": null },
    "Amaras": { "cover": "comercio-amaras.jpg", "logo": null },
    "Mercado La Costa": { "cover": "fachada-tienda-de-la-costa.jpg", "logo": "logo-mercado-del-puerto.jpg" },
    "Farmacia Vida": { "cover": "fachada-farmacia-del-puerto.jpg", "logo": null }
  },
  "products": {
    "Ceviche clásico": "producto-ceviche-clasico.jpg",
    "Ceviche de camarón": "producto-ceviche-camaron.jpg",
    "Ceviche mixto": "producto-ceviche-mixto.jpg",
    "Patacones Bocamar": "producto-patacones.jpg",
    "Chips de plátano Bocamar": "producto-chips-platano.jpg",
    "Limonada natural": "producto-limonada-natural.jpg",
    "Limonada de coco": "producto-limonada-coco.jpg",
    "Banano (libra)": "producto-banano.jpg",
    "Tomate (libra)": "producto-tomate.jpg",
    "Arroz Diana 1 kg": "producto-arroz.jpg",
    "Protector solar FPS 50": "producto-protector-solar.jpg"
  },
  "static": {
    "acceso-hero": "acceso-comida.jpg",
    "inicio-categoria-comida": "categoria-comida.jpg",
    "inicio-categoria-mercado": "categoria-mercado.jpg",
    "inicio-categoria-farmacia": "categoria-farmacia.jpg",
    "inicio-categoria-envios": "categoria-envios.jpg",
    "inicio-banner-sabor-costa": "banner-sabor-costa.jpg",
    "restaurantes-chip-ceviches": "chip-ceviches.jpg",
    "restaurantes-chip-hamburguesas": "chip-hamburguesas.jpg",
    "restaurantes-chip-shawarmas": "chip-shawarmas.jpg",
    "restaurantes-chip-bebidas": "chip-bebidas.jpg",
    "bocamar-banda": "comercio-bocamar.jpg",
    "bocamar-tarjeta": "comercio-bocamar-tarjeta.jpg",
    "naranmiche-tarjeta": "comercio-naranmiche-tarjeta.jpg",
    "amaras-tarjeta": "comercio-amaras-tarjeta.jpg",
    "bocamar-logo-sello": "logo-bocamar-sello.png",
    "producto-detalle-ceviche-clasico": "producto-ceviche-clasico-detalle.jpg",
    "mercado-categoria-frutas": "categoria-frutas.jpg",
    "mercado-categoria-verduras": "categoria-verduras.jpg",
    "mercado-categoria-lacteos": "categoria-lacteos.jpg",
    "mercado-categoria-despensa": "categoria-despensa.jpg",
    "mercado-banner": "banner-mercado.jpg",
    "mercado-portada-tienda": "comercio-mercado-del-puerto-portada.jpg",
    "mercado-fachada-mercado-del-puerto": "fachada-mercado-del-puerto.jpg",
    "mercado-producto-banano-blanco": "producto-banano-blanco.jpg",
    "mercado-producto-leche": "producto-leche.jpg",
    "farmacia-categoria-cuidado-personal": "categoria-cuidado-personal.jpg",
    "farmacia-categoria-proteccion-solar": "categoria-proteccion-solar.jpg",
    "farmacia-categoria-bebes": "categoria-bebes.jpg",
    "farmacia-categoria-primeros-auxilios": "categoria-primeros-auxilios.jpg",
    "farmacia-fachada-bienestar-caribe": "fachada-bienestar-caribe.jpg",
    "farmacia-producto-protector-solar-blanco": "producto-protector-solar-blanco.jpg",
    "farmacia-producto-cepillo-dental": "producto-cepillo-dental.jpg",
    "farmacia-producto-apositos": "producto-apositos.jpg",
    "bocamar-producto-agua": "producto-agua.jpg",
    "ofertas-combo-ceviche": "oferta-combo-ceviche.jpg",
    "ofertas-combo-hamburguesa": "oferta-combo-hamburguesa.jpg",
    "ofertas-amaras": "oferta-amaras.jpg",
    "repartidor-avatar": "avatar-repartidor.jpg",
    "repartidor-avatar-calificar": "avatar-repartidor-alt.jpg",
    "envios-caja": "envio-caja.png",
    "vacio-cupones": "vacio-cupones.png",
    "vacio-busqueda": "vacio-busqueda.png",
    "vacio-canasta": "vacio-canasta.png",
    "error-pago-fallido": "pago-fallido.png",
    "error-sin-conexion": "sin-conexion.png",
    "error-sin-cobertura": "sin-cobertura.png",
    "notificacion-entregado": "notif-entregado.png",
    "notificacion-en-camino": "notif-en-camino.png",
    "notificacion-confirmado": "notif-confirmado.png",
    "pago-visa": "pago-visa.png",
    "pago-visa-claro": "pago-visa-claro.png",
    "acceso-logo-google": "logo-google.png",
    "celular-bandera-colombia": "bandera-colombia.png"
  }
}
```

## Recortes retirados (28 oct 2026)

Se retiraron de `assets/images/diseno/` y de `design-images.ts` los recortes que ya nadie usaba porque los reemplazaron versiones más completas:
- `acceso-comida.jpg`
- `chip-*.jpg` (4)
- `categoria-{frutas,verduras,lacteos,despensa}.jpg`
- `banner-mercado.jpg`
- `categoria-{cuidado-personal,proteccion-solar,bebes,primeros-auxilios}.jpg`
- `oferta-combo-{ceviche,hamburguesa}.jpg`
- `oferta-amaras.jpg`
- `pago-fallido.png`

Las filas de arriba que los mencionan quedan solo como historial. Los reemplazos están en `DISENO-CLIENTE.md` §5.2.
