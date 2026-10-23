# scripts/

Validación local de la base de datos sin Docker (usa un PostgreSQL 16 local):

- `pg_prelude.sql` — stubs mínimos de los esquemas `auth` y `storage` de Supabase.
- `pg_grants.sql` — permisos equivalentes a los roles `anon`/`authenticated` de Supabase.
- `pg_smoke.sql` — prueba de ciclo completo bajo RLS: cliente pide → comercio prepara → repartidor entrega con código → calificación → owner aprueba liquidación.

```bash
createdb yava_test
psql -d yava_test -f scripts/pg_prelude.sql
for f in supabase/migrations/*.sql; do psql -d yava_test -v ON_ERROR_STOP=1 -f $f; done
psql -d yava_test -f scripts/pg_grants.sql
psql -d yava_test -f supabase/seed/seed.sql
psql -d yava_test -f scripts/pg_smoke.sql   # debe terminar en "SMOKE OK"
```
