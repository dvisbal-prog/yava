-- Grants por defecto de Supabase para roles de API.
-- Ejecutar ANTES de las migraciones (como en Supabase): así los REVOKE de cada migración
-- se aplican después de los permisos por defecto y no quedan anulados.
grant usage on schema public, storage, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
grant select on auth.users to authenticated;
grant all on storage.objects, storage.buckets to authenticated, anon;
