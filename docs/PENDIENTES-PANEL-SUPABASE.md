# Pendientes en el panel de Supabase (proyecto "Yava App" · dgebycmouxjfuwtnhxmu)

Todo lo que se puede hacer por SQL y API ya está desplegado. Estos pasos son solo del panel web (5 a 10 minutos):

1. **Authentication → Providers**
   - Phone: activar, proveedor Twilio Verify (o MessageBird). Plantilla: `Tu código YAVA es {{ .Code }}`.
   - Google: activar con los Client IDs (web, iOS, Android) de Google Cloud.
   - Apple: activar con Services ID, Team ID, Key ID y la llave .p8.
   - URL Configuration → Redirect URLs: `yava://auth/callback`, `https://<dominio-admin>/auth/callback`.
   - Attack protection: activar "Leaked password protection".
2. **Edge Functions → Secrets**: `WOMPI_EVENTS_SECRET` (del panel de Wompi). Las funciones ya están desplegadas:
   `wompi-webhook`, `send-push`, `scheduled-jobs`, `delete-account` (y `admin-tools`, ya desactivada).
3. **Database → Webhooks → Create**: tabla `notifications`, evento INSERT, tipo "Supabase Edge Function" → `send-push`,
   header `Authorization: Bearer <service_role key>`. Esto activa las notificaciones push.
4. **Database → Extensions**: activar `pg_cron`. Luego en SQL Editor ejecutar `supabase/cron.sql` reemplazando `<PROYECTO>` por
   `dgebycmouxjfuwtnhxmu` y `<SERVICE_ROLE_KEY>` por la llave service role (Settings → API).
5. **Wompi**: URL de eventos = `https://dgebycmouxjfuwtnhxmu.supabase.co/functions/v1/wompi-webhook`.

## Datos de conexión (públicos, van en las apps)
- URL: `https://dgebycmouxjfuwtnhxmu.supabase.co`
- Publishable key: `sb_publishable_UsqLAZCVWzzJR4YaDN6Few_xIXlEJAD`

## Usuarios demo (clave `yava2026`)
`cliente@yava.app` · `comercio@yava.app` (Bocamar) · `naranmiche@yava.app` · `amaras@yava.app` · `repartidor@yava.app` · `owner@yava.app` · `finanzas@yava.app` · `cliente2@yava.app`

Datos demo cargados: 2 ciudades, 6 comercios, 24 productos, cupones, 1 repartidor activo, 123 pedidos (3 vivos: #1042 entregado, #1043 nuevo, #1044 listo), 6 liquidaciones pendientes, 1 caso de soporte. Para limpiar antes del lanzamiento real, borrar desde el panel admin o con SQL las filas de `orders`, `settlements` y los comercios de prueba.
