# YAVA · Panel administrativo (`apps/admin`)

Next.js 16 (App Router) + Tailwind 4 + `@supabase/ssr`. Pantallas 81–96 del diseño.

## Configuración

```bash
cp apps/admin/.env.example apps/admin/.env.local   # NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm admin                                           # http://localhost:3000
pnpm --filter @yava/admin typecheck && pnpm --filter @yava/admin build
```

Usuarios demo (seed): `owner@yava.app` (owner) y `finanzas@yava.app` (finance), clave `yava2026`.

## Estructura

- `src/proxy.ts` + `src/lib/supabase/middleware.ts`: refresca la sesión y protege el panel (sin sesión → `/login`; sin fila activa en `admin_users` → `/sin-acceso`).
- `src/lib/auth.ts`: `getAdminContext()` (rol + perfil) y `requireSection()` (404 si el rol no tiene la sección).
- `src/lib/roles.ts`: visibilidad de menú y permisos por rol (owner, finance, operations, support).
- `src/app/(auth)`: `/login`, `/verificar`, `/invitacion/[token]`, `/sin-acceso`; `src/app/auth/callback` intercambia el código del enlace mágico.
- `src/app/(admin)`: Panorama `/`, `/pedidos`, `/comercios`, `/repartidores`, `/finanzas/{ingresos,conciliacion,liquidaciones}`, `/soporte`, `/reportes` (+ `/reportes/csv`), `/equipo`, `/configuracion`, `/buscar`.
- Mutaciones: server actions en cada `actions.ts`; toda acción sensible exige motivo y queda en `audit_log` (RPC `audit`).
- UI reutilizable en `src/components/ui`; gráficas en `src/components/charts` (recharts); Realtime en `src/components/realtime`.

Tokens de color: variables CSS en `src/app/globals.css` (espejo de `colors` en `@yava/shared`).
