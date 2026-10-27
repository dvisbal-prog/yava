-- Tareas programadas y push sin pegar la service_role key en SQL.
-- pg_cron llama las RPC directamente; el trigger de notifications llama send-push con un secreto guardado en Vault.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Secreto interno para llamadas de la base de datos a Edge Functions
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'yava_internal_hook_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'yava_internal_hook_secret', 'Header x-yava-hook para send-push');
  end if;
end $$;

create or replace function public.internal_hook_secret_ok(p_secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'yava_internal_hook_secret' and decrypted_secret = p_secret
  );
$$;
revoke execute on function public.internal_hook_secret_ok(text) from public, anon, authenticated;
grant execute on function public.internal_hook_secret_ok(text) to service_role;

-- Push: cada INSERT en notifications llama send-push (reemplaza el Database Webhook del panel)
create or replace function public.notifications_send_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'yava_internal_hook_secret';
  perform net.http_post(
    url := 'https://dgebycmouxjfuwtnhxmu.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-yava-hook', v_secret),
    body := jsonb_build_object('type', 'INSERT', 'table', 'notifications', 'record', to_jsonb(new))
  );
  return new;
end $$;
revoke execute on function public.notifications_send_push() from public, anon, authenticated;

drop trigger if exists notifications_send_push on public.notifications;
create trigger notifications_send_push after insert on public.notifications
for each row execute function public.notifications_send_push();

-- Cron (UTC). 06:30 Bogotá = 11:30 UTC
do $$
begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('yava-expire-payments', 'yava-owner-alerts', 'yava-daily-summary');
end $$;
select cron.schedule('yava-expire-payments', '*/5 * * * *', 'select public.expire_pending_payments()');
select cron.schedule('yava-owner-alerts', '*/10 * * * *', 'select public.generate_owner_alerts()');
select cron.schedule('yava-daily-summary', '30 11 * * *', 'select public.owner_daily_summary()');
