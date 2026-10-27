-- YAVA · 0013 · Correcciones de la auditoría (backend)
-- B1  couriers: sin UPDATE directo desde el cliente; RPC courier_set_online y courier_update_settings.
-- B2  pedido aceptado = entrega activa (dashboard, aceptar, tracking).
--     setting_int lee escalares jsonb.
--     admin_overview / merchant_dashboard / audit con guard y sin EXECUTE para anon.
--     merchants: trigger que protege columnas de dinero y aprobación.
--     Ganancias del repartidor en hora de Bogotá.
--     admin_generate_settlements: las liquidaciones rechazadas liberan sus pedidos; fechas en hora de Bogotá.
--     anonymize_account: no permite borrar la cuenta con saldo de repartidor.
--     register_courier: no sobrescribe datos de un repartidor ya enviado a revisión.
-- Idempotente: create or replace, drop ... if exists.

-- Conjunto de estados "entrega en curso" usado en todo el archivo:
--   status not in ('pending_payment','delivered','cancelled')

-- =====================================================================
-- 1. B1 · Repartidor: sin UPDATE directo (la policy causaba 42P17 recursión infinita)
-- =====================================================================
drop policy if exists "couriers self update" on couriers;
-- "couriers admin" (for all using is_admin()) se mantiene.

create or replace function public.courier_set_online(p_online boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_status courier_status;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  select status into v_status from couriers where user_id = v_uid for update;
  if coalesce(p_online, false) then
    if v_status is distinct from 'active' then
      raise exception 'Tu cuenta de repartidor aún no está activa' using errcode = '42501';
    end if;
    update couriers set is_online = true, last_seen_at = now() where user_id = v_uid;
  else
    -- Desconectarse nunca falla (p. ej. al cerrar sesión), aunque no exista la fila.
    update couriers set is_online = false where user_id = v_uid;
  end if;
end $$;
revoke execute on function public.courier_set_online(boolean) from public, anon;
grant execute on function public.courier_set_online(boolean) to authenticated, service_role;

create or replace function public.courier_update_settings(
  p_vehicle vehicle_type default null, p_plate text default null, p_bank_account jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  if p_bank_account is not null and jsonb_typeof(p_bank_account) <> 'object' then
    raise exception 'Datos bancarios no válidos';
  end if;
  update couriers set
    vehicle = coalesce(p_vehicle, vehicle),
    plate = coalesce(p_plate, plate),
    bank_account = coalesce(p_bank_account, bank_account)
  where user_id = v_uid;
  if not found then raise exception 'No eres repartidor' using errcode = '42501'; end if;
end $$;
revoke execute on function public.courier_update_settings(vehicle_type, text, jsonb) from public, anon;
grant execute on function public.courier_update_settings(vehicle_type, text, jsonb) to authenticated, service_role;

-- =====================================================================
-- 2. B2 · Un pedido aceptado por el repartidor es su entrega activa
--    (7. las ventanas hoy/semana de courier_dashboard van aquí también)
-- =====================================================================
-- Tracking: cliente y comercio ven al repartidor desde que acepta (no solo tras recoger)
drop policy if exists "couriers tracking" on couriers;
create policy "couriers tracking" on couriers for select using (
  exists (select 1 from orders o where o.courier_id = couriers.user_id
          and o.status not in ('pending_payment','delivered','cancelled')
          and (o.customer_id = auth.uid() or (o.merchant_id is not null and is_merchant_member(o.merchant_id))))
);

create or replace function public.courier_accept_order(p_order_id uuid) returns orders
language plpgsql security definer set search_path = public as $$
declare v_o orders; v_c couriers;
begin
  -- for update: serializa aceptaciones simultáneas del mismo repartidor
  select * into v_c from couriers where user_id = auth.uid() for update;
  if v_c.user_id is null or v_c.status <> 'active' then raise exception 'Repartidor no activo' using errcode = '42501'; end if;
  if exists (select 1 from orders where courier_id = auth.uid() and status not in ('pending_payment','delivered','cancelled')) then
    raise exception 'Ya tienes una entrega en curso';
  end if;
  update orders set courier_id = auth.uid(), status = (case when status = 'placed' and type = 'shipment' then 'assigned' else status::text end)::order_status, assigned_at = now()
  where id = p_order_id and courier_id is null and status in ('placed','accepted','preparing','ready')
  returning * into v_o;
  if v_o.id is null then raise exception 'La entrega ya fue tomada por otro repartidor'; end if;
  insert into order_events (order_id, status, actor_id, note) values (v_o.id, v_o.status, auth.uid(), 'Repartidor asignado');
  insert into notifications (user_id, title, body, data)
  values (v_o.customer_id, 'Repartidor asignado', format('%s llevará tu pedido #%s', (select full_name from profiles where id = auth.uid()), v_o.number),
          jsonb_build_object('order_id', v_o.id, 'type', 'order_status'));
  return v_o;
end $$;

-- Resumen del repartidor: entrega activa ampliada + ventanas hoy/semana en hora de Bogotá.
-- "Semana" = desde la medianoche de Bogotá de hace 6 días (igual que earnings.tsx).
create or replace function public.courier_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today timestamptz := date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  v_week timestamptz := (date_trunc('day', now() at time zone 'America/Bogota') - interval '6 days') at time zone 'America/Bogota';
  v jsonb;
begin
  select jsonb_build_object(
    'today_earnings', coalesce(sum(courier_payout) filter (where status='delivered' and delivered_at >= v_today),0),
    'today_deliveries', count(*) filter (where status='delivered' and delivered_at >= v_today),
    'week_earnings', coalesce(sum(courier_payout) filter (where status='delivered' and delivered_at >= v_week),0),
    'week_deliveries', count(*) filter (where status='delivered' and delivered_at >= v_week),
    'balance', (select balance from couriers where user_id = v_uid),
    'rating', (select rating_avg from couriers where user_id = v_uid),
    'total_deliveries', (select deliveries_count from couriers where user_id = v_uid),
    'active_order', (select o.id from orders o where o.courier_id = v_uid
                       and o.status not in ('pending_payment','delivered','cancelled')
                     order by coalesce(o.assigned_at, o.placed_at) desc limit 1)
  ) into v
  from orders where courier_id = v_uid;
  return v;
end $$;

-- =====================================================================
-- 3. setting_int: los valores de platform_settings son escalares jsonb ('1000', '"1000"')
-- =====================================================================
create or replace function public.setting_int(k text, dflt integer) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::numeric::int from platform_settings where key = k), dflt)
$$;

-- =====================================================================
-- 4. Seguridad: admin_overview y merchant_dashboard con guard (antes devolvían datos a cualquiera)
-- =====================================================================
-- admin_overview lo usan el panorama web (todos los roles admin, incluido soporte) y la app de owners
-- (cualquier admin activo), por eso el guard es is_admin().
create or replace function public.admin_overview(p_from timestamptz default date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota', p_to timestamptz default now(), p_city uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (
  select jsonb_build_object(
    'merchant_sales', coalesce(sum(items_subtotal) filter (where status='delivered'),0),
    'yava_revenue', coalesce(sum(commission_amount + service_fee) filter (where status='delivered'),0),
    'commissions', coalesce(sum(commission_amount) filter (where status='delivered'),0),
    'service_fees', coalesce(sum(service_fee) filter (where status='delivered'),0),
    'discounts', coalesce(sum(discount) filter (where status='delivered'),0),
    'gateway_fees', coalesce(sum(gateway_fee) filter (where status='delivered'),0),
    'collected', coalesce(sum(total) filter (where status='delivered'),0),
    'delivery_fees', coalesce(sum(delivery_fee) filter (where status='delivered'),0),
    'merchant_payouts', coalesce(sum(merchant_payout) filter (where status='delivered'),0),
    'courier_payouts', coalesce(sum(courier_payout) filter (where status='delivered'),0),
    'delivered', count(*) filter (where status='delivered'),
    'active', count(*) filter (where status not in ('delivered','cancelled')),
    'cancelled', count(*) filter (where status='cancelled'),
    'avg_ticket', coalesce(avg(items_subtotal) filter (where status='delivered'),0),
    'active_merchants', (select count(*) from merchants where status='active' and (p_city is null or city_id = p_city)),
    'online_couriers', (select count(*) from couriers where is_online and (p_city is null or city_id = p_city)),
    'merchants_to_review', (select count(*) from merchants where status in ('pending','under_review') and (p_city is null or city_id = p_city)),
    'couriers_to_review', (select count(*) from couriers where status in ('pending','under_review') and (p_city is null or city_id = p_city)),
    'open_cases', (select count(*) from support_cases where status in ('open','in_progress')),
    'pending_settlements', (select coalesce(sum(net),0) from settlements where status in ('pending','approved')),
    'pending_merchant_settlements', (select coalesce(sum(net),0) from settlements where status in ('pending','approved') and payee_type='merchant'),
    'pending_courier_settlements', (select coalesce(sum(net),0) from settlements where status in ('pending','approved') and payee_type='courier'),
    'opex', (select coalesce(sum(amount),0) from operating_expenses where date between p_from::date and p_to::date and (p_city is null or city_id = p_city)),
    'hourly', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'orders', c) order by h), '[]'::jsonb) from (
        select extract(hour from placed_at at time zone 'America/Bogota')::int h, count(*) c from orders
        where placed_at between p_from and p_to and (p_city is null or city_id = p_city) group by 1) t),
    'by_type', (select coalesce(jsonb_agg(jsonb_build_object('type', type, 'orders', c, 'sales', s, 'revenue', r)), '[]'::jsonb) from (
        select type, count(*) c, sum(items_subtotal) s, sum(commission_amount + service_fee) r from orders
        where status='delivered' and delivered_at between p_from and p_to and (p_city is null or city_id = p_city) group by 1) t),
    'by_city', (select coalesce(jsonb_agg(jsonb_build_object('city', ci.name, 'city_id', ci.id, 'orders', c, 'sales', s, 'revenue', r)), '[]'::jsonb) from (
        select city_id, count(*) c, sum(items_subtotal) s, sum(commission_amount + service_fee) r from orders
        where status='delivered' and delivered_at between p_from and p_to group by 1) t join cities ci on ci.id = t.city_id)
  )
  from orders where placed_at between p_from and p_to and (p_city is null or city_id = p_city)
  );
end $$;
revoke execute on function public.admin_overview(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.admin_overview(timestamptz, timestamptz, uuid) to authenticated, service_role;

create or replace function public.merchant_dashboard(p_merchant uuid, p_from timestamptz default date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota')
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_merchant_member(p_merchant) or is_admin()) then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (
  select jsonb_build_object(
    'sales', coalesce(sum(items_subtotal) filter (where status='delivered'),0),
    'orders', count(*) filter (where status <> 'cancelled'),
    'to_prepare', count(*) filter (where status in ('placed','accepted')),
    'preparing', count(*) filter (where status='preparing'),
    'ready', count(*) filter (where status='ready'),
    'payout', coalesce(sum(merchant_payout) filter (where status='delivered'),0),
    'week', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'sales', s) order by d),'[]'::jsonb) from (
        select (delivered_at at time zone 'America/Bogota')::date d, sum(items_subtotal) s from orders
        where merchant_id = p_merchant and status='delivered' and delivered_at >= now() - interval '7 days' group by 1) t)
  ) from orders where merchant_id = p_merchant and placed_at >= p_from
  );
end $$;
revoke execute on function public.merchant_dashboard(uuid, timestamptz) from public, anon;
grant execute on function public.merchant_dashboard(uuid, timestamptz) to authenticated, service_role;

-- =====================================================================
-- 5. audit(): solo admins (el panel web la llama directo) o service role.
--    Las RPC admin_* que la usan ya exigen rol admin. anonymize_account ya no la usa (ver 9).
-- =====================================================================
create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_reason text, p_before jsonb, p_after jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  insert into audit_log (actor_id, action, entity, entity_id, reason, before, after)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_reason, p_before, p_after);
end $$;
revoke execute on function public.audit(text, text, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.audit(text, text, text, text, jsonb, jsonb) to authenticated, service_role;

-- =====================================================================
-- 6. merchants: un miembro del comercio no puede cambiar estado, comisión, tarifa ni datos de aprobación
-- =====================================================================
-- Solo se restringe a los roles de la API (anon/authenticated) que no son admin. Las RPC SECURITY DEFINER
-- (admin_set_merchant_status, apply_rating, ...) corren como el dueño de la función y pasan; service_role y
-- postgres también.
create or replace function public.merchants_guard_protected() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not is_admin() then
    if new.status is distinct from old.status
       or new.commission_rate is distinct from old.commission_rate
       or new.delivery_fee is distinct from old.delivery_fee
       or new.featured is distinct from old.featured
       or new.rating_avg is distinct from old.rating_avg
       or new.rating_count is distinct from old.rating_count
       or new.owner_id is distinct from old.owner_id
       or new.slug is distinct from old.slug
       or new.category is distinct from old.category
       or new.legal_name is distinct from old.legal_name
       or new.tax_id is distinct from old.tax_id
       or new.review_notes is distinct from old.review_notes then
      raise exception 'No autorizado: estos datos del comercio solo los cambia YAVA. Escríbenos a soporte.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists merchants_guard_protected on merchants;
create trigger merchants_guard_protected before update on merchants
  for each row execute function public.merchants_guard_protected();

-- =====================================================================
-- 8. Liquidaciones: las rechazadas liberan sus pedidos; fechas en hora de Bogotá
-- =====================================================================
create or replace function public.admin_generate_settlements(p_start date, p_end date) returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0; r record; v_id uuid;
begin
  if not has_admin_role(array['owner','finance']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  for r in
    select o.merchant_id as payee, count(*) c, sum(o.items_subtotal) gross, sum(o.commission_amount) comm, sum(o.merchant_payout) net
    from orders o where o.status = 'delivered' and o.merchant_id is not null
      and (o.delivered_at at time zone 'America/Bogota')::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id
                      where so.order_id = o.id and s.payee_type = 'merchant' and s.status <> 'rejected')
    group by o.merchant_id
  loop
    insert into settlements (payee_type, payee_id, period_start, period_end, orders_count, gross, commissions, net, bank_snapshot)
    values ('merchant', r.payee, p_start, p_end, r.c, r.gross, r.comm, r.net, (select bank_account from merchants where id = r.payee)) returning id into v_id;
    insert into settlement_orders (settlement_id, order_id, amount)
    select v_id, o.id, o.merchant_payout from orders o where o.merchant_id = r.payee and o.status = 'delivered'
      and (o.delivered_at at time zone 'America/Bogota')::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id
                      where so.order_id = o.id and s.payee_type = 'merchant' and s.status <> 'rejected' and s.id <> v_id);
    v_count := v_count + 1;
  end loop;
  for r in
    select o.courier_id as payee, count(*) c, sum(o.courier_payout) net
    from orders o where o.status = 'delivered' and o.courier_id is not null
      and (o.delivered_at at time zone 'America/Bogota')::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id
                      where so.order_id = o.id and s.payee_type = 'courier' and s.status <> 'rejected')
    group by o.courier_id
  loop
    insert into settlements (payee_type, payee_id, period_start, period_end, orders_count, gross, commissions, net, bank_snapshot)
    values ('courier', r.payee, p_start, p_end, r.c, r.net, 0, r.net, (select bank_account from couriers where user_id = r.payee)) returning id into v_id;
    insert into settlement_orders (settlement_id, order_id, amount)
    select v_id, o.id, o.courier_payout from orders o where o.courier_id = r.payee and o.status = 'delivered'
      and (o.delivered_at at time zone 'America/Bogota')::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id
                      where so.order_id = o.id and s.payee_type = 'courier' and s.status <> 'rejected' and s.id <> v_id);
    v_count := v_count + 1;
  end loop;
  perform audit('settlements.generate', 'settlement', null, format('%s a %s', p_start, p_end), null, jsonb_build_object('count', v_count));
  return v_count;
end $$;

-- =====================================================================
-- 9. Eliminación de cuenta: no si el repartidor tiene saldo por retirar
-- =====================================================================
-- Además corrige el guard: dentro de una función SECURITY DEFINER current_user siempre es el dueño (postgres),
-- así que `current_user not in ('postgres',...)` nunca se cumplía y cualquiera podía anonimizar otra cuenta.
create or replace function public.anonymize_account(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and auth.uid() is distinct from p_uid then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if exists (select 1 from orders where (customer_id = p_uid or courier_id = p_uid) and status not in ('delivered','cancelled')) then
    raise exception 'Tienes pedidos en curso. Espera a que terminen para eliminar tu cuenta.';
  end if;
  if exists (select 1 from merchants where owner_id = p_uid and status = 'active') then
    raise exception 'Tu comercio está activo. Pide a soporte pausarlo antes de eliminar la cuenta.';
  end if;
  if exists (select 1 from couriers where user_id = p_uid and balance > 0) then
    raise exception 'Tienes saldo por retirar. Retíralo antes de eliminar tu cuenta.';
  end if;
  -- Directo a audit_log (audit() exige rol admin y el propio usuario puede llamar esta función)
  insert into audit_log (actor_id, action, entity, entity_id, reason, before, after)
  values (auth.uid(), 'account.delete', 'profile', p_uid::text, 'Solicitud del usuario', null, null);
  update orders set address_snapshot = '{}'::jsonb, notes = null where customer_id = p_uid;
  update order_messages set body = '[mensaje eliminado]' where sender_id = p_uid;
  update couriers set plate = null, document_number = null, bank_account = null, is_online = false, current_lat = null, current_lng = null where user_id = p_uid;
  update profiles set full_name = 'Usuario eliminado', phone = null, email = null, avatar_url = null, notifications_enabled = false where id = p_uid;
end $$;
revoke execute on function public.anonymize_account(uuid) from public, anon;
grant execute on function public.anonymize_account(uuid) to authenticated, service_role;

-- =====================================================================
-- 10. register_courier: no sobrescribe a un repartidor que ya pasó de 'pending'
-- =====================================================================
create or replace function public.register_courier(p jsonb) returns couriers
language plpgsql security definer set search_path = public as $$
declare v_c couriers; v_status courier_status;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  select status into v_status from couriers where user_id = auth.uid() for update;
  if found and v_status <> 'pending' then
    raise exception 'Tus datos ya están en revisión o verificados. Para cambiarlos, escríbenos a soporte.';
  end if;
  insert into couriers (user_id, city_id, vehicle, plate, document_number, status)
  values (auth.uid(), (p->>'city_id')::uuid, coalesce((p->>'vehicle')::vehicle_type,'moto'), p->>'plate', p->>'document_number', 'pending')
  on conflict (user_id) do update set vehicle = excluded.vehicle, plate = excluded.plate, document_number = excluded.document_number
  returning * into v_c;
  update profiles set role = 'courier' where id = auth.uid();
  return v_c;
end $$;

-- =====================================================================
-- 11. Endurecimiento: funciones internas de 0009 (pasarela y tareas programadas)
-- =====================================================================
-- 0009 revocó EXECUTE a anon/authenticated pero no a PUBLIC, del que ambos heredan; y su guard
-- `current_user not in ('postgres',...)` no protege dentro de SECURITY DEFINER (current_user es el dueño).
-- Resultado: cualquier usuario podía llamar confirm_payment(..., 'paid', ...) y marcar su pedido como pagado.
-- Quedan solo para service_role (Edge Functions) y postgres (pg_cron).
revoke execute on function public.confirm_payment(uuid, text, text, payment_status, integer, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.expire_pending_payments() from public, anon, authenticated;
revoke execute on function public.owner_daily_summary() from public, anon, authenticated;
revoke execute on function public.generate_owner_alerts() from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, text, text, payment_status, integer, integer, jsonb) to service_role;
grant execute on function public.expire_pending_payments() to service_role;
grant execute on function public.owner_daily_summary() to service_role;
grant execute on function public.generate_owner_alerts() to service_role;
