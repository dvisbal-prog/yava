-- YAVA · Operaciones administrativas atómicas, búsqueda y lectura de invitaciones

-- Índices de búsqueda en perfiles
create index if not exists profiles_name_trgm_idx on profiles using gin (full_name gin_trgm_ops);
create index if not exists profiles_email_trgm_idx on profiles using gin (email gin_trgm_ops);
create index if not exists profiles_phone_idx on profiles (phone);

-- Admin puede dejar notas en la línea de tiempo del pedido
create policy "order_events admin insert" on order_events for insert with check (is_admin());

-- Acción administrativa sobre un pedido: cancelar, liberar repartidor o forzar estado (con evento + auditoría)
create or replace function public.admin_order_action(p_order_id uuid, p_action text, p_reason text, p_status order_status default null)
returns orders language plpgsql security definer set search_path = public as $$
declare v_o orders; v_before jsonb;
begin
  if not has_admin_role(array['owner','operations']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then raise exception 'Indica un motivo'; end if;
  select * into v_o from orders where id = p_order_id for update;
  if v_o.id is null then raise exception 'Pedido no encontrado'; end if;
  v_before := to_jsonb(v_o);
  if p_action = 'cancel' then
    v_o := cancel_order(p_order_id, p_reason);
  elsif p_action = 'release_courier' then
    update orders set courier_id = null, assigned_at = null,
      status = (case when type = 'shipment' then 'placed' when status in ('assigned','picked_up','on_the_way') then 'ready' else status::text end)::order_status
    where id = p_order_id returning * into v_o;
  elsif p_action = 'force_status' then
    if p_status is null then raise exception 'Indica el estado'; end if;
    update orders set status = p_status where id = p_order_id returning * into v_o;
  else
    raise exception 'Acción desconocida: %', p_action;
  end if;
  insert into order_events (order_id, status, actor_id, note) values (v_o.id, v_o.status, auth.uid(), 'Admin · ' || p_action || ': ' || p_reason);
  perform audit('order.' || p_action, 'order', p_order_id::text, p_reason, v_before, to_jsonb(v_o));
  return v_o;
end $$;

-- Retiros de repartidores: aprobar / pagar / rechazar (devuelve saldo) con auditoría
create or replace function public.admin_withdrawal_transition(p_id uuid, p_status settlement_status, p_reason text, p_reference text default null)
returns courier_withdrawals language plpgsql security definer set search_path = public as $$
declare v_w courier_withdrawals; v_before jsonb;
begin
  if not has_admin_role(array['owner','finance']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then raise exception 'Indica un motivo'; end if;
  select * into v_w from courier_withdrawals where id = p_id for update;
  if v_w.id is null then raise exception 'Retiro no encontrado'; end if;
  if v_w.status in ('paid','rejected') then raise exception 'El retiro ya fue procesado'; end if;
  v_before := to_jsonb(v_w);
  if p_status = 'paid' and (p_reference is null or length(trim(p_reference)) = 0) then raise exception 'Indica la referencia de la transferencia'; end if;
  if p_status = 'rejected' then
    update couriers set balance = balance + v_w.amount where user_id = v_w.courier_id;
  end if;
  update courier_withdrawals set status = p_status, processed_by = auth.uid(), processed_at = now(), reference = coalesce(p_reference, reference)
  where id = p_id returning * into v_w;
  perform audit('withdrawal.' || p_status::text, 'courier_withdrawal', p_id::text, p_reason, v_before, to_jsonb(v_w));
  insert into notifications (user_id, title, body, data) values (v_w.courier_id,
    case p_status when 'paid' then 'Retiro pagado' when 'approved' then 'Retiro aprobado' else 'Retiro rechazado' end,
    format('Retiro de $%s · %s', to_char(v_w.amount, 'FM999G999G999'), p_reason), jsonb_build_object('type','withdrawal'));
  return v_w;
end $$;

-- El invitado puede leer correo y rol de su invitación por token (sin exponer la tabla)
create or replace function public.invitation_preview(p_token text)
returns table (email text, role admin_role, expires_at timestamptz, accepted boolean)
language sql stable security definer set search_path = public as $$
  select email, role, expires_at, accepted_at is not null from admin_invitations where token = p_token
$$;

-- Agregados para administración: pedidos y ventas de los últimos 30 días por comercio
create or replace function public.admin_merchant_stats(p_days integer default 30)
returns table (merchant_id uuid, orders_30d bigint, sales_30d bigint, cancelled_30d bigint, avg_prep_min numeric)
language sql stable security definer set search_path = public as $$
  select merchant_id, count(*) filter (where status = 'delivered'), coalesce(sum(items_subtotal) filter (where status = 'delivered'),0),
         count(*) filter (where status = 'cancelled'),
         round(avg(extract(epoch from (ready_at - accepted_at))/60) filter (where ready_at is not null and accepted_at is not null), 1)
  from orders where merchant_id is not null and placed_at >= now() - (p_days || ' days')::interval and is_admin()
  group by merchant_id
$$;

create or replace function public.admin_report(p_from timestamptz, p_to timestamptz, p_city uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'top_merchants', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select m.id, m.name, m.category, count(*) orders, sum(o.items_subtotal) sales, sum(o.commission_amount + o.service_fee) revenue
        from orders o join merchants m on m.id = o.merchant_id
        where o.status = 'delivered' and o.delivered_at between p_from and p_to and (p_city is null or o.city_id = p_city)
        group by m.id, m.name, m.category order by sales desc limit 10) t),
    'avg_delivery_min', (select round(avg(extract(epoch from (delivered_at - placed_at))/60), 1) from orders
        where status = 'delivered' and delivered_at between p_from and p_to and (p_city is null or city_id = p_city)),
    'cancel_rate', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where status = 'cancelled') / count(*), 1) end
        from orders where placed_at between p_from and p_to and (p_city is null or city_id = p_city)),
    'by_payment', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select payment_method, count(*) orders, sum(total) collected from orders
        where status = 'delivered' and delivered_at between p_from and p_to and (p_city is null or city_id = p_city) group by 1) t)
  ) where is_admin()
$$;
