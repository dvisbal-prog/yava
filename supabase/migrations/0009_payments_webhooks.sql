-- YAVA · Confirmación de pagos (pasarela) y utilidades para Edge Functions (service role)

-- Confirma/actualiza un pago reportado por la pasarela. Llamado solo por la Edge Function con service role.
create or replace function public.confirm_payment(
  p_order_id uuid, p_provider text, p_provider_ref text, p_status payment_status, p_amount integer, p_gateway_fee integer default 0, p_raw jsonb default null
) returns orders language plpgsql security definer set search_path = public as $$
declare v_o orders;
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','service_role') then
    raise exception 'Solo la pasarela puede confirmar pagos' using errcode = '42501';
  end if;
  select * into v_o from orders where id = p_order_id for update;
  if v_o.id is null then raise exception 'Pedido no encontrado'; end if;
  insert into payments (order_id, provider, provider_ref, amount, status, gateway_fee, raw)
  values (p_order_id, p_provider, p_provider_ref, p_amount, p_status, p_gateway_fee, p_raw)
  on conflict do nothing;
  if p_status = 'paid' then
    if p_amount <> v_o.total then
      raise exception 'Monto pagado (%) distinto al total del pedido (%)', p_amount, v_o.total;
    end if;
    update orders set payment_status = 'paid', gateway_fee = p_gateway_fee,
      status = case when status = 'pending_payment' then 'placed'::order_status else status end
    where id = p_order_id returning * into v_o;
    insert into notifications (user_id, title, body, data)
    select user_id, 'Nuevo pedido', format('Pedido #%s pagado con tarjeta', v_o.number), jsonb_build_object('order_id', v_o.id, 'type', 'new_order')
    from merchant_members where merchant_id = v_o.merchant_id;
  elsif p_status = 'failed' then
    update orders set payment_status = 'failed' where id = p_order_id returning * into v_o;
    insert into notifications (user_id, title, body, data)
    values (v_o.customer_id, 'Pago rechazado', format('No pudimos procesar el pago del pedido #%s. Intenta con otro método.', v_o.number),
            jsonb_build_object('order_id', v_o.id, 'type', 'payment_failed'));
  end if;
  return v_o;
end $$;
revoke execute on function public.confirm_payment(uuid, text, text, payment_status, integer, integer, jsonb) from anon, authenticated;

-- Cancela pedidos con pago pendiente de más de 30 minutos (cron desde Edge Function o pg_cron).
create or replace function public.expire_pending_payments() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','service_role') then raise exception 'Solo tareas internas' using errcode = '42501'; end if;
  with upd as (
    update orders set status = 'cancelled', cancel_reason = 'Pago no completado', payment_status = 'failed'
    where status = 'pending_payment' and placed_at < now() - interval '30 minutes' returning 1
  ) select count(*) into n from upd;
  return n;
end $$;
revoke execute on function public.expire_pending_payments() from anon, authenticated;

-- Resumen diario para owners: crea una notificación por owner con los números del día anterior.
create or replace function public.owner_daily_summary() returns integer
language plpgsql security definer set search_path = public as $$
declare v jsonb; n integer := 0; r record;
  v_from timestamptz := date_trunc('day', (now() at time zone 'America/Bogota') - interval '1 day') at time zone 'America/Bogota';
  v_to timestamptz := date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','service_role') then raise exception 'Solo tareas internas' using errcode = '42501'; end if;
  select jsonb_build_object(
    'delivered', count(*) filter (where status = 'delivered'),
    'cancelled', count(*) filter (where status = 'cancelled'),
    'sales', coalesce(sum(items_subtotal) filter (where status = 'delivered'), 0),
    'revenue', coalesce(sum(commission_amount + service_fee) filter (where status = 'delivered'), 0))
  into v from orders where placed_at >= v_from and placed_at < v_to;
  for r in select a.user_id from admin_users a join profiles p on p.id = a.user_id where a.role = 'owner' and a.status = 'active' and p.notifications_enabled loop
    insert into notifications (user_id, title, body, data)
    values (r.user_id, 'Resumen de ayer',
      format('%s pedidos entregados · Ventas $%s · Ingresos YAVA $%s', v->>'delivered', to_char((v->>'sales')::int, 'FM999G999G999'), to_char((v->>'revenue')::int, 'FM999G999G999')),
      v || jsonb_build_object('type', 'daily_summary'));
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.owner_daily_summary() from anon, authenticated;

-- Alertas automáticas de dirección: pagos fallidos y pedidos estancados
create or replace function public.generate_owner_alerts() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0; c integer;
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','service_role') then raise exception 'Solo tareas internas' using errcode = '42501'; end if;
  select count(*) into c from payments where status = 'failed' and created_at > now() - interval '1 hour';
  if c >= 3 and not exists (select 1 from owner_alerts where entity = 'payments' and created_at > now() - interval '1 hour') then
    insert into owner_alerts (severity, title, body, entity) values ('critical', 'Pagos fallidos recurrentes', format('%s intentos fallidos con la pasarela en la última hora.', c), 'payments');
    n := n + 1;
  end if;
  select count(*) into c from orders where status in ('ready') and ready_at < now() - interval '25 minutes' and courier_id is null;
  if c > 0 and not exists (select 1 from owner_alerts where entity = 'orders_unassigned' and created_at > now() - interval '30 minutes') then
    insert into owner_alerts (severity, title, body, entity) values ('warning', 'Pedidos listos sin repartidor', format('%s pedidos llevan más de 25 min listos sin asignación.', c), 'orders_unassigned');
    n := n + 1;
  end if;
  select count(*) into c from merchants where status in ('pending','under_review');
  if c > 0 and not exists (select 1 from owner_alerts where entity = 'merchants' and created_at > now() - interval '1 day') then
    insert into owner_alerts (severity, title, body, entity) values ('info', format('%s comercios por revisar', c), 'Tienen documentos o solicitudes pendientes.', 'merchants');
    n := n + 1;
  end if;
  return n;
end $$;
revoke execute on function public.generate_owner_alerts() from anon, authenticated;
