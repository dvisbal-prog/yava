# Plan de lanzamiento · 2 semanas

Objetivo: YAVA publicada en App Store (TestFlight → revisión) y Google Play (prueba cerrada → producción) con operación real en Puerto Colombia, y panel web en Vercel.

## Lo que necesito de ti (bloqueantes)

| # | Acceso / dato | Para qué | Dónde ponerlo |
|---|---|---|---|
| 1 | Proyecto Supabase: URL, anon key, service role key, contraseña BD | Backend | Secretos del entorno (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) |
| 2 | Token de Vercel + equipo/proyecto | Desplegar admin | `VERCEL_TOKEN` |
| 3 | Cuenta Apple Developer (99 USD/año) con tu Apple ID; Team ID | Build iOS, Sign in with Apple, TestFlight | `eas credentials` (interactivo, lo haces tú o me das acceso de App Manager) |
| 4 | Cuenta Google Play Console (25 USD) + cuenta de servicio JSON | Publicar Android | `google-play-service-account.json` |
| 5 | Cuenta Expo (expo.dev) + `EXPO_TOKEN` | EAS Build/Submit/Updates | `EXPO_TOKEN` |
| 6 | Google Cloud: OAuth client IDs (web, iOS, Android) y 2 llaves de Maps | Login con Google y mapas | Supabase Auth + EAS secrets |
| 7 | Proveedor SMS (Twilio Verify recomendado) | OTP por celular | Supabase Auth → Phone |
| 8 | Wompi (o la pasarela que prefieras): llave pública, privada y secreto de eventos | Pago con tarjeta/PSE/Nequi | `EXPO_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_EVENTS_SECRET` |
| 9 | Logo aprobado en PNG 1024×1024 y textos legales (términos, privacidad) publicados en una URL | Íconos y fichas de tienda (obligatorio para Apple/Google) | `apps/mobile/assets/images/` + URLs en las fichas |
| 10 | Definición comercial: comisión por comercio (10 %), tarifa de servicio ($1.000), envío ($3.000), envío punto a punto ($8.000), retiro mínimo ($50.000) | Están como valores por defecto en `platform_settings`; confirmar | Panel admin → Configuración |

Mientras llegan, la app funciona con **efectivo y Nequi/Daviplata al recibir**; la tarjeta aparece solo cuando exista la llave de Wompi.

## Cronograma

**Semana 1 — Integración y pruebas internas**
- Día 1–2: Supabase producción (migraciones, Auth providers, buckets, funciones, cron). Vercel con dominio. EAS init, primer build de desarrollo iOS/Android.
- Día 3–4: Pruebas de extremo a extremo con los 4 roles en dispositivos reales (pedido → aceptación → recogida → entrega con código → calificación → liquidación). Ajustes de UX contra las 104 maquetas.
- Día 5: Pasarela Wompi en sandbox (webhook, pago aprobado/rechazado), push notifications reales, ubicación en segundo plano del repartidor.
- Día 6–7: Alta de 3 comercios reales (Bocamar, Naranmiche, Amaras) con sus menús y fotos desde la app; alta de 5–10 repartidores con documentos; configurar zonas de cobertura reales.

**Semana 2 — Tiendas y lanzamiento**
- Día 8: Build de producción, TestFlight interno + Google Play prueba interna. Fichas de tienda (capturas 6,7" y 6,5" iOS, 1080×1920 Android, descripción, política de privacidad, clasificación de contenido, declaración de datos).
- Día 9–10: Envío a revisión Apple (demo account: `cliente@yava.app` / `yava2026` en producción con datos reales) y Google (prueba cerrada ≥ 12 testers durante 14 días es requisito para cuentas personales nuevas de Google Play; con cuenta de organización se puede publicar directo).
- Día 11–12: Correcciones de revisión. Capacitación a comercios y repartidores (guía de 1 página).
- Día 13: Soft launch Puerto Colombia con cupón BIENVENIDO. Monitoreo en panel (operación en vivo, alertas).
- Día 14: Lanzamiento público + Barranquilla si la operación lo permite.

## Riesgos y mitigaciones
- **Revisión de Apple** puede tardar 1–3 días y rechazar por cuentas demo o permisos: textos de permisos ya están en `app.json`; proveer cuenta demo en las notas de revisión.
- **Google Play cuentas nuevas**: exige 12 testers × 14 días antes de producción si la cuenta es personal → abrir la cuenta como **organización** (con NIT) desde el día 1.
- **SMS OTP**: costos y entregabilidad en Colombia; alternativa inmediata: Google/Apple y correo.
- **Pagos**: Wompi exige comercio verificado (RUT, cuenta bancaria); el sandbox funciona de inmediato.
