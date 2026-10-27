# scripts/

Validación local de la base de datos sin Docker (usa un PostgreSQL 16 local):

- `pg_prelude.sql` — stubs mínimos de los esquemas `auth` y `storage` de Supabase.
- `pg_grants.sql` — permisos por defecto equivalentes a los de Supabase para `anon`/`authenticated` (correr ANTES de las migraciones para que sus REVOKE apliquen).
- `pg_smoke_0013.sql` — pruebas de la migración 0013 (repartidor, guards, columnas protegidas, pagos).
- `pg_smoke.sql` — prueba de ciclo completo bajo RLS: cliente pide → comercio prepara → repartidor entrega con código → calificación → owner aprueba liquidación.

```bash
createdb yava_test
psql -d yava_test -f scripts/pg_prelude.sql
psql -d yava_test -f scripts/pg_grants.sql
for f in supabase/migrations/*.sql; do case $f in *0012_*) continue;; esac; psql -d yava_test -v ON_ERROR_STOP=1 -f $f; done   # 0012 requiere pg_cron/Vault
psql -d yava_test -f supabase/seed/seed.sql
psql -d yava_test -f scripts/pg_smoke.sql        # debe terminar en "SMOKE OK"
psql -d yava_test -f scripts/pg_smoke_0013.sql   # debe terminar en "SMOKE 0013 OK"
```
