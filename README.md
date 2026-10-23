# YAVA · Superapp de domicilios

Comida · Mercado · Farmacia · Envíos — Puerto Colombia y Barranquilla.

| Paquete | Qué es | Despliegue |
|---|---|---|
| `apps/mobile` | App iOS/Android (Expo SDK 58). Cliente, comercio, repartidor y owners en una sola app con enrutamiento por rol. | EAS Build → App Store / Google Play |
| `apps/admin` | Panel administrativo web (Next.js 16). | Vercel |
| `supabase/` | Base de datos, seguridad por rol (RLS), RPCs, Realtime, Storage, Edge Functions. | Supabase |
| `packages/shared` | Tokens de diseño, tipos, cálculo de precios, formato COP. | — |

## Arranque local

```bash
pnpm install
# Base de datos local (requiere Docker + Supabase CLI)
npx supabase start && npx supabase db reset        # aplica migraciones + seed
# Admin web
cp apps/admin/.env.example apps/admin/.env.local   # URL y anon key de `supabase status`
pnpm admin                                          # http://localhost:3000 → owner@yava.app / yava2026
# App móvil
cp apps/mobile/.env.example apps/mobile/.env
pnpm mobile                                         # Expo Go o dev client
```

Usuarios de prueba (clave `yava2026`): `cliente@yava.app`, `comercio@yava.app` (Bocamar), `repartidor@yava.app`, `owner@yava.app`, `finanzas@yava.app`.

## Documentación

- `docs/ARCHITECTURE.md` — estructura, convenciones, RPCs.
- `docs/PLAN-LANZAMIENTO.md` — plan de 2 semanas y lista de accesos/credenciales necesarios.
- `docs/CHECKLIST-TIENDAS.md` — publicación en App Store y Google Play.
- `docs/DESPLIEGUE.md` — Supabase (producción), Vercel, Edge Functions y cron.
- `docs/PENDIENTES-PANEL-SUPABASE.md` — lo que falta hacer en el panel de Supabase (Auth, webhook push, cron, Wompi).
