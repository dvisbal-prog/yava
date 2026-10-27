# Estado de Supabase y despliegues (proyecto "Yava App" · dgebycmouxjfuwtnhxmu)

## Hecho (26 oct 2026)
- Esquema, RLS, RPCs, vistas, buckets, Realtime y datos demo (migraciones 0001–0011).
- **Cron** (migración 0012): `pg_cron` llama directamente `expire_pending_payments()` cada 5 min, `generate_owner_alerts()` cada 10 min y `owner_daily_summary()` a las 06:30 Bogotá. Ya no hace falta `supabase/cron.sql` ni pegar la service role key.
- **Push** (migración 0012): trigger `notifications_send_push` → Edge Function `send-push` con el header `x-yava-hook` (secreto en Vault `yava_internal_hook_secret`). Reemplaza el Database Webhook del panel. Probado: respuesta 200.
- **Admin web** en Vercel: https://yava-panel.vercel.app (proyecto `yava-admin`, Root Directory `apps/admin`). `yava-admin.vercel.app` es de otra cuenta.
- **Vista web del app** en Vercel: https://yava-app.vercel.app (proyecto `yava-app`, export `expo export -p web`, SPA).
- **Migración 0013** (auditoría): repartidor sin UPDATE directo (RPC `courier_set_online` / `courier_update_settings`, se acabó la recursión de RLS), entrega activa desde que se acepta, `admin_overview`/`merchant_dashboard`/`audit` con permisos, columnas protegidas en `merchants`, `confirm_payment` y tareas internas solo para service_role, `anonymize_account` solo para la propia cuenta. Verificada en vivo con los usuarios demo (12/12).
- **EAS**: proyecto `@zds-agency/yava` (2e5ba82e-1aa1-4698-a00e-745181c1f4b4), variables `EXPO_PUBLIC_SUPABASE_*` en development/preview/production, keystore Android en la nube.

## Falta
1. **Auth → URL Configuration** (requiere aprobación para tocar la configuración remota): Site URL `https://yava-panel.vercel.app`; Redirect URLs `yava://auth/callback`, `yava://**`, `https://yava-panel.vercel.app/**`, `https://yava-app.vercel.app/**`. Plantilla SMS `Tu código YAVA es {{ .Code }}`. Leaked password protection.
2. **Proveedores de Auth** (requieren cuentas externas):
   - Phone: Twilio Verify (o MessageBird).
   - Google: Client IDs web, iOS y Android de Google Cloud.
   - Apple: Services ID, Team ID, Key ID y llave .p8.
3. **Wompi**: secreto `WOMPI_EVENTS_SECRET` en Edge Functions y URL de eventos `https://dgebycmouxjfuwtnhxmu.supabase.co/functions/v1/wompi-webhook`. Llave pública → `EXPO_PUBLIC_WOMPI_PUBLIC_KEY`.
4. **Google Maps**: llaves para iOS y Android (`GOOGLE_MAPS_IOS_KEY`, `GOOGLE_MAPS_ANDROID_KEY`).

## Datos de conexión (públicos, van en las apps)
- URL: `https://dgebycmouxjfuwtnhxmu.supabase.co`
- Publishable key: `sb_publishable_UsqLAZCVWzzJR4YaDN6Few_xIXlEJAD`

## Usuarios demo (clave `yava2026`)
`cliente@yava.app` · `comercio@yava.app` (Bocamar) · `naranmiche@yava.app` · `amaras@yava.app` · `repartidor@yava.app` · `owner@yava.app` · `finanzas@yava.app` · `cliente2@yava.app`

Datos demo cargados: 2 ciudades, 6 comercios, 24 productos, cupones, 1 repartidor activo, 123 pedidos (3 vivos: #1042 entregado, #1043 nuevo, #1044 listo), 6 liquidaciones pendientes, 1 caso de soporte. Para limpiar antes del lanzamiento real, borrar desde el panel admin o con SQL las filas de `orders`, `settlements` y los comercios de prueba.
