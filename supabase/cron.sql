-- Ejecutar una vez en el SQL Editor de Supabase (requiere extensiones pg_cron y pg_net activas en el panel).
-- Reemplazar <PROYECTO> y <SERVICE_ROLE_KEY>.
select cron.schedule('yava-expire-payments', '*/5 * * * *', $$
  select net.http_post('https://<PROYECTO>.functions.supabase.co/scheduled-jobs?job=expire_payments',
    headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);
select cron.schedule('yava-owner-alerts', '*/10 * * * *', $$
  select net.http_post('https://<PROYECTO>.functions.supabase.co/scheduled-jobs?job=owner_alerts',
    headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);
-- 06:30 Bogotá = 11:30 UTC
select cron.schedule('yava-daily-summary', '30 11 * * *', $$
  select net.http_post('https://<PROYECTO>.functions.supabase.co/scheduled-jobs?job=daily_summary',
    headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);
$$);
