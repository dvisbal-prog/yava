# Despliegue

> **Estado real (23 oct 2026):** el backend está desplegado en el proyecto Supabase `dgebycmouxjfuwtnhxmu` ("Yava App", us-east-2): esquema, RLS, RPCs, vistas, buckets, Edge Functions (`wompi-webhook`, `send-push`, `scheduled-jobs`, `delete-account`) y datos demo. URL `https://dgebycmouxjfuwtnhxmu.supabase.co`. Pendiente: proveedores de Auth (Phone/Google/Apple), secreto de Wompi, Database Webhook de `send-push`, cron, Vercel y builds EAS.

## 1. Supabase (producción)

1. Crear proyecto en supabase.com (región `us-east-1` es la más cercana a Colombia). Guardar: `Project URL`, `anon key`, `service_role key`, `DB password`.
2. Vincular y aplicar migraciones + seed:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push                      # migraciones 0001–0011
   psql "<DATABASE_URL>" -f supabase/seed/seed.sql   # opcional: datos demo (NO en producción real; usar solo cities y platform_settings)
   ```
   Para producción real ejecutar solo las secciones *Ciudades* y *Configuración* del seed y crear la primera owner con el SQL Editor:
   ```sql
   insert into admin_users (user_id, role, status, accepted_at) values ('<uuid del usuario>', 'owner', 'active', now());
   update profiles set role = 'admin' where id = '<uuid>';
   ```
3. Auth → Providers: **Phone** (Twilio Verify o MessageBird; plantilla "Tu código YAVA es {{ .Code }}"), **Google** (client IDs web/iOS/Android), **Apple** (Services ID, Team ID, Key ID, .p8), **Email** (para admin). Redirect URLs: `yava://auth/callback`, `https://<admin>.vercel.app/auth/callback`.
4. Storage: los buckets se crean en la migración 0008. Verificar en el panel.
5. Realtime: activado para `orders, order_events, order_messages, couriers, notifications, support_messages` (migración 0006).
6. Edge Functions:
   ```bash
   npx supabase secrets set WOMPI_EVENTS_SECRET=<secreto de eventos Wompi>
   npx supabase functions deploy wompi-webhook --no-verify-jwt
   npx supabase functions deploy send-push
   npx supabase functions deploy scheduled-jobs
   ```
   - Database Webhook: tabla `notifications`, evento INSERT → `send-push`, header `Authorization: Bearer <service_role>`.
   - Cron: activar `pg_cron` y `pg_net` y ejecutar `supabase/cron.sql` reemplazando `<PROYECTO>` y `<SERVICE_ROLE_KEY>`.
7. Wompi: en el panel de comercios de Wompi, URL de eventos = `https://<ref>.functions.supabase.co/wompi-webhook`. Llave pública → `EXPO_PUBLIC_WOMPI_PUBLIC_KEY`.

## 2. Vercel (admin web)

- Importar el repo; Root Directory: raíz del monorepo (usa `vercel.json`). Framework Next.js.
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (dominio del panel).
- Dominio sugerido: `admin.yava.app`. Agregar `https://admin.yava.app/auth/callback` en Supabase Auth → Redirect URLs.

## 3. App móvil (EAS)

```bash
npm i -g eas-cli && eas login
cd apps/mobile
eas init                                   # genera projectId → reemplazar REEMPLAZAR_CON_EAS_PROJECT_ID en app.json
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon>
eas secret:create --scope project --name GOOGLE_MAPS_IOS_KEY --value <key>
eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_KEY --value <key>
eas build -p all --profile preview         # APK + build interno iOS (TestFlight requiere cuenta Apple)
eas build -p all --profile production
eas submit -p ios && eas submit -p android
```

Google Maps: crear 2 llaves en Google Cloud (Maps SDK for iOS y Maps SDK for Android) restringidas por bundle `co.yava.app`.
Push: EAS gestiona credenciales APNs y FCM (`eas credentials`). Para Android subir el `google-services.json` de Firebase si se usa FCM v1.
