-- Grants por defecto de Supabase para roles de API
grant usage on schema public, storage, auth to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
grant select on auth.users to authenticated;
grant all on storage.objects, storage.buckets to authenticated, anon;
