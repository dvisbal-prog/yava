-- YAVA · Funciones auxiliares, triggers y RPCs

-- ---------- Helpers de autorización ----------
create or replace function public.current_admin_role() returns admin_role
language sql stable security definer set search_path = public as $$
  select role from admin_users where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid() and status = 'active')
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid() and status = 'active' and role = 'owner')
$$;

create or replace function public.has_admin_role(roles admin_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid() and status = 'active' and role = any(roles))
$$;

create or replace function public.is_merchant_member(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from merchant_members where merchant_id = m and user_id = auth.uid())
    or exists (select 1 from merchants where id = m and owner_id = auth.uid())
$$;

create or replace function public.my_merchant_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select merchant_id from merchant_members where user_id = auth.uid()
  union select id from merchants where owner_id = auth.uid()
$$;

create or replace function public.is_courier() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from couriers where user_id = auth.uid())
$$;

-- ---------- Perfil automático al registrarse ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'customer')
  )
  on conflict (id) do update set
    phone = coalesce(excluded.phone, profiles.phone),
    email = coalesce(excluded.email, profiles.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of phone, email on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','merchants','products','orders','payments','couriers','settlements','support_cases']
  loop execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t); end loop;
end $$;

-- ---------- Una sola dirección principal ----------
create or replace function public.ensure_single_default_address() returns trigger
language plpgsql as $$
begin
  if new.is_default then
    update addresses set is_default = false where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $$;
create trigger addresses_single_default before insert or update on addresses
  for each row execute function ensure_single_default_address();

-- ---------- Apertura del comercio según horario ----------
create or replace function public.merchant_is_open(m merchants) returns boolean
language sql stable as $$
  select m.status = 'active' and m.accepts_orders and not m.manual_closed and exists (
    select 1 from merchant_hours h
    where h.merchant_id = m.id
      and h.weekday = extract(dow from (now() at time zone 'America/Bogota'))::int
      and (now() at time zone 'America/Bogota')::time between h.opens and h.closes
  )
$$;

-- ---------- Configuración ----------
create or replace function public.setting_int(k text, dflt integer) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (value->>0)::int from platform_settings where key = k), dflt)
$$;

-- ---------- Eventos de pedido ----------
-- BEFORE: sellos de tiempo según el estado. AFTER: bitácora en order_events (la fila ya existe).
create or replace function public.stamp_order_status() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status = 'accepted' and new.accepted_at is null then new.accepted_at = now(); end if;
    if new.status = 'ready' and new.ready_at is null then new.ready_at = now(); end if;
    if new.status = 'assigned' and new.assigned_at is null then new.assigned_at = now(); end if;
    if new.status = 'picked_up' and new.picked_up_at is null then new.picked_up_at = now(); end if;
    if new.status = 'delivered' and new.delivered_at is null then new.delivered_at = now(); end if;
    if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at = now(); new.cancelled_by = coalesce(new.cancelled_by, auth.uid()); end if;
  end if;
  return new;
end $$;
create trigger orders_stamp_status before insert or update on orders
  for each row execute function stamp_order_status();

create or replace function public.log_order_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into order_events (order_id, status, actor_id) values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger orders_log_event after insert or update on orders
  for each row execute function log_order_event();

-- Inventario: descontar al confirmar, restaurar al cancelar
create or replace function public.apply_stock_on_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update products p set stock = greatest(0, p.stock - i.qty),
      status = case when p.stock - i.qty <= 0 then 'paused' else p.status end
    from order_items i where i.order_id = new.id and i.product_id = p.id and p.track_stock;
  elsif new.status = 'cancelled' and old.status in ('accepted','preparing','ready') then
    update products p set stock = p.stock + i.qty
    from order_items i where i.order_id = new.id and i.product_id = p.id and p.track_stock;
  end if;
  return new;
end $$;
create trigger orders_apply_stock after update of status on orders
  for each row execute function apply_stock_on_status();

-- Contadores de repartidor y comercio al entregar
create or replace function public.on_order_delivered() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    if new.courier_id is not null then
      update couriers set deliveries_count = deliveries_count + 1, balance = balance + new.courier_payout
      where user_id = new.courier_id;
    end if;
    insert into notifications (user_id, title, body, data)
    values (new.customer_id, 'Pedido entregado', format('Tu pedido #%s fue entregado. ¡Califica tu experiencia!', new.number),
            jsonb_build_object('order_id', new.id, 'type', 'order_delivered'));
  end if;
  return new;
end $$;
create trigger orders_on_delivered after update of status on orders
  for each row execute function on_order_delivered();

-- Calificaciones → promedios
create or replace function public.apply_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.merchant_id is not null and new.merchant_rating is not null then
    update merchants set rating_avg = round(((rating_avg * rating_count) + new.merchant_rating) / (rating_count + 1.0), 2),
      rating_count = rating_count + 1 where id = new.merchant_id;
  end if;
  if new.courier_id is not null and new.courier_rating is not null then
    update couriers set rating_avg = round(((rating_avg * rating_count) + new.courier_rating) / (rating_count + 1.0), 2),
      rating_count = rating_count + 1 where user_id = new.courier_id;
  end if;
  return new;
end $$;
create trigger ratings_apply after insert on ratings for each row execute function apply_rating();

-- ---------- Auditoría genérica ----------
create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_reason text, p_before jsonb, p_after jsonb) returns void
language sql security definer set search_path = public as $$
  insert into audit_log (actor_id, action, entity, entity_id, reason, before, after)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_reason, p_before, p_after)
$$;

-- =====================================================================
-- RPC: place_order — calcula precios en el servidor y crea el pedido
-- items: [{product_id, qty, option_ids: [uuid], notes}]
-- =====================================================================
create or replace function public.place_order(
  p_merchant_id uuid,
  p_address_id uuid,
  p_items jsonb,
  p_payment_method payment_method default 'cash',
  p_payment_method_id uuid default null,
  p_coupon_code text default null,
  p_notes text default null
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_m merchants;
  v_addr addresses;
  v_order orders;
  v_item jsonb;
  v_prod products;
  v_opt_ids uuid[];
  v_opts jsonb;
  v_extras integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_service integer := setting_int('service_fee', 1000);
  v_delivery integer;
  v_discount integer := 0;
  v_coupon coupons;
  v_commission integer;
  v_courier_payout integer;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  select * into v_m from merchants where id = p_merchant_id;
  if v_m.id is null then raise exception 'Comercio no encontrado'; end if;
  if not merchant_is_open(v_m) then raise exception 'El comercio está cerrado en este momento' using errcode = 'P0001'; end if;
  select * into v_addr from addresses where id = p_address_id and user_id = v_uid;
  if v_addr.id is null then raise exception 'Dirección no válida'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'La canasta está vacía'; end if;

  v_delivery := v_m.delivery_fee;

  insert into orders (customer_id, merchant_id, city_id, type, status, address_snapshot, delivery_lat, delivery_lng,
                      payment_method, payment_method_id, payment_status, notes, commission_rate, eta_min, eta_max)
  values (v_uid, v_m.id, coalesce(v_addr.city_id, v_m.city_id), v_m.category::text::order_type,
          (case when p_payment_method in ('cash','nequi','daviplata') then 'placed' else 'pending_payment' end)::order_status,
          to_jsonb(v_addr), v_addr.lat, v_addr.lng,
          p_payment_method, p_payment_method_id, 'pending', p_notes, v_m.commission_rate, v_m.prep_min + 10, v_m.prep_max + 15)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_prod from products where id = (v_item->>'product_id')::uuid and merchant_id = v_m.id and status = 'published';
    if v_prod.id is null then raise exception 'Producto no disponible: %', v_item->>'product_id'; end if;
    if v_prod.track_stock and coalesce(v_prod.stock,0) < (v_item->>'qty')::int then
      raise exception 'Sin existencias suficientes de %', v_prod.name;
    end if;
    v_opt_ids := array(select jsonb_array_elements_text(coalesce(v_item->'option_ids','[]'::jsonb)))::uuid[];
    select coalesce(jsonb_agg(jsonb_build_object('option_id', o.id, 'group_id', o.group_id, 'name', o.name, 'price_delta', o.price_delta)), '[]'::jsonb),
           coalesce(sum(o.price_delta), 0)
      into v_opts, v_extras
      from product_options o join product_option_groups g on g.id = o.group_id
     where o.id = any(v_opt_ids) and g.product_id = v_prod.id and o.available;
    v_line_total := (v_prod.price + v_extras) * (v_item->>'qty')::int;
    v_subtotal := v_subtotal + v_line_total;
    insert into order_items (order_id, product_id, name, unit_price, qty, options, notes, total)
    values (v_order.id, v_prod.id, v_prod.name, v_prod.price, (v_item->>'qty')::int, v_opts, v_item->>'notes', v_line_total);
  end loop;

  if v_subtotal < v_m.min_order then raise exception 'El pedido mínimo es %', v_m.min_order; end if;

  if p_coupon_code is not null then
    select * into v_coupon from coupons where upper(code) = upper(p_coupon_code) and active
      and (valid_from is null or valid_from <= now()) and (valid_to is null or valid_to >= now())
      and (max_uses is null or uses < max_uses) and (merchant_id is null or merchant_id = v_m.id);
    if v_coupon.id is null then raise exception 'Cupón no válido o vencido'; end if;
    if (select count(*) from coupon_redemptions where coupon_id = v_coupon.id and user_id = v_uid) >= v_coupon.per_user_limit then
      raise exception 'Ya usaste este cupón';
    end if;
    if v_subtotal >= v_coupon.min_order then
      v_discount := case v_coupon.type
        when 'percent' then round(v_subtotal * v_coupon.value / 100.0)
        when 'fixed' then least(v_coupon.value, v_subtotal)
        when 'free_delivery' then v_delivery end;
      update coupons set uses = uses + 1 where id = v_coupon.id;
      insert into coupon_redemptions (coupon_id, user_id, order_id) values (v_coupon.id, v_uid, v_order.id);
    end if;
  end if;

  v_commission := round(v_subtotal * v_m.commission_rate);
  v_courier_payout := v_delivery; -- el envío va íntegro al repartidor por defecto

  update orders set
    items_subtotal = v_subtotal, delivery_fee = v_delivery, service_fee = v_service, discount = v_discount,
    total = greatest(0, v_subtotal + v_delivery + v_service - v_discount),
    coupon_id = v_coupon.id, commission_amount = v_commission,
    merchant_payout = v_subtotal - v_commission - (case when v_coupon.funded_by = 'merchant' then v_discount else 0 end),
    courier_payout = v_courier_payout
  where id = v_order.id returning * into v_order;

  -- notificar al comercio
  insert into notifications (user_id, title, body, data)
  select user_id, 'Nuevo pedido', format('Pedido #%s · %s productos', v_order.number, jsonb_array_length(p_items)),
         jsonb_build_object('order_id', v_order.id, 'type', 'new_order')
  from merchant_members where merchant_id = v_m.id;

  return v_order;
end $$;

-- =====================================================================
-- RPC: place_shipment — envíos punto a punto (sin comercio)
-- =====================================================================
create or replace function public.place_shipment(
  p_pickup jsonb, p_dropoff jsonb, p_package jsonb, p_payment_method payment_method default 'cash', p_notes text default null
) returns orders
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_order orders;
  v_fee integer := setting_int('shipment_base_fee', 8000);
  v_service integer := setting_int('service_fee', 1000);
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  insert into orders (customer_id, type, status, address_snapshot, delivery_lat, delivery_lng, pickup_snapshot, package_details,
                      items_subtotal, delivery_fee, service_fee, total, courier_payout, payment_method, notes, eta_min, eta_max,
                      city_id)
  values (v_uid, 'shipment', (case when p_payment_method in ('cash','nequi','daviplata') then 'placed' else 'pending_payment' end)::order_status,
          p_dropoff, (p_dropoff->>'lat')::float, (p_dropoff->>'lng')::float, p_pickup, p_package,
          0, v_fee, v_service, v_fee + v_service, v_fee, p_payment_method, p_notes, 30, 60,
          (select city_id from profiles where id = v_uid))
  returning * into v_order;
  return v_order;
end $$;

-- =====================================================================
-- RPC: cancel_order (cliente antes de preparación; comercio/admin siempre)
-- =====================================================================
create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns orders
language plpgsql security definer set search_path = public as $$
declare v_o orders;
begin
  select * into v_o from orders where id = p_order_id for update;
  if v_o.id is null then raise exception 'Pedido no encontrado'; end if;
  if v_o.status in ('delivered','cancelled') then raise exception 'El pedido ya no se puede cancelar'; end if;
  if v_o.customer_id = auth.uid() then
    if v_o.status not in ('pending_payment','placed','accepted') then
      raise exception 'El pedido ya está en preparación. Contacta a soporte.';
    end if;
  elsif not (is_admin() or (v_o.merchant_id is not null and is_merchant_member(v_o.merchant_id))) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update orders set status = 'cancelled', cancel_reason = p_reason, cancelled_by = auth.uid(),
    payment_status = (case when payment_status = 'paid' then 'refunded' else payment_status::text end)::payment_status
  where id = p_order_id returning * into v_o;
  insert into notifications (user_id, title, body, data)
  values (v_o.customer_id, 'Pedido cancelado', format('Tu pedido #%s fue cancelado. %s', v_o.number, coalesce(p_reason,'')),
          jsonb_build_object('order_id', v_o.id, 'type', 'order_cancelled'));
  return v_o;
end $$;

-- =====================================================================
-- RPC: merchant_set_order_status — accepted → preparing → ready
-- =====================================================================
create or replace function public.merchant_set_order_status(p_order_id uuid, p_status order_status, p_eta_min integer default null)
returns orders language plpgsql security definer set search_path = public as $$
declare v_o orders;
begin
  select * into v_o from orders where id = p_order_id for update;
  if v_o.id is null then raise exception 'Pedido no encontrado'; end if;
  if not (is_merchant_member(v_o.merchant_id) or is_admin()) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_status not in ('accepted','preparing','ready') then raise exception 'Estado no permitido para el comercio'; end if;
  if (p_status = 'accepted' and v_o.status <> 'placed')
     or (p_status = 'preparing' and v_o.status not in ('accepted','placed'))
     or (p_status = 'ready' and v_o.status not in ('preparing','accepted')) then
    raise exception 'Transición inválida de % a %', v_o.status, p_status;
  end if;
  update orders set status = p_status, eta_min = coalesce(p_eta_min, eta_min) where id = p_order_id returning * into v_o;
  insert into notifications (user_id, title, body, data) values (
    v_o.customer_id,
    case p_status when 'accepted' then 'Pedido confirmado' when 'preparing' then 'Preparando tu pedido' else 'Pedido listo' end,
    format('Pedido #%s', v_o.number), jsonb_build_object('order_id', v_o.id, 'type', 'order_status'));
  return v_o;
end $$;

-- =====================================================================
-- RPC: courier_available_orders — pedidos listos/aceptados sin repartidor cerca
-- =====================================================================
create or replace function public.courier_available_orders(p_lat float default null, p_lng float default null, p_radius_km float default 8)
returns table (
  id uuid, number integer, type order_type, status order_status, merchant_name text, merchant_address text,
  merchant_lat float, merchant_lng float, delivery_address jsonb, delivery_lat float, delivery_lng float,
  courier_payout integer, total integer, placed_at timestamptz, distance_km float
) language sql stable security definer set search_path = public as $$
  with base as (
    select o.id, o.number, o.type, o.status,
           coalesce(m.name, 'Envío') as merchant_name,
           coalesce(m.address, o.pickup_snapshot->>'line1') as merchant_address,
           coalesce(m.lat, (o.pickup_snapshot->>'lat')::float) as merchant_lat,
           coalesce(m.lng, (o.pickup_snapshot->>'lng')::float) as merchant_lng,
           o.address_snapshot, o.delivery_lat, o.delivery_lng, o.courier_payout, o.total, o.placed_at
    from orders o left join merchants m on m.id = o.merchant_id
    where o.courier_id is null
      and ((o.type <> 'shipment' and o.status in ('accepted','preparing','ready')) or (o.type = 'shipment' and o.status = 'placed'))
      and is_courier()
  )
  select b.id, b.number, b.type, b.status, b.merchant_name, b.merchant_address, b.merchant_lat, b.merchant_lng,
         b.address_snapshot, b.delivery_lat, b.delivery_lng, b.courier_payout, b.total, b.placed_at,
         haversine_km(p_lat, p_lng, b.merchant_lat, b.merchant_lng) as distance_km
  from base b
  where p_lat is null or b.merchant_lat is null or haversine_km(p_lat, p_lng, b.merchant_lat, b.merchant_lng) <= p_radius_km
  order by b.placed_at
$$;

-- =====================================================================
-- RPC: courier_accept_order
-- =====================================================================
create or replace function public.courier_accept_order(p_order_id uuid) returns orders
language plpgsql security definer set search_path = public as $$
declare v_o orders; v_c couriers;
begin
  select * into v_c from couriers where user_id = auth.uid();
  if v_c.user_id is null or v_c.status <> 'active' then raise exception 'Repartidor no activo' using errcode = '42501'; end if;
  if exists (select 1 from orders where courier_id = auth.uid() and status in ('assigned','picked_up','on_the_way')) then
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

-- =====================================================================
-- RPC: courier_set_order_status — picked_up → on_the_way → delivered (con código)
-- =====================================================================
create or replace function public.courier_set_order_status(p_order_id uuid, p_status order_status, p_delivery_code text default null)
returns orders language plpgsql security definer set search_path = public as $$
declare v_o orders;
begin
  select * into v_o from orders where id = p_order_id and courier_id = auth.uid() for update;
  if v_o.id is null then raise exception 'Pedido no asignado a ti' using errcode = '42501'; end if;
  if p_status = 'picked_up' and v_o.status not in ('ready','assigned','accepted','preparing') then raise exception 'Aún no está listo para recoger'; end if;
  if p_status = 'on_the_way' and v_o.status <> 'picked_up' then raise exception 'Primero confirma la recogida'; end if;
  if p_status = 'delivered' then
    if v_o.status not in ('on_the_way','picked_up') then raise exception 'El pedido no está en camino'; end if;
    if p_delivery_code is distinct from v_o.delivery_code and not (v_o.payment_method = 'cash' and p_delivery_code = 'EFECTIVO') then
      raise exception 'Código de entrega incorrecto';
    end if;
  end if;
  if p_status not in ('picked_up','on_the_way','delivered') then raise exception 'Estado no permitido'; end if;
  update orders set status = p_status,
    payment_status = (case when p_status = 'delivered' and payment_method = 'cash' then 'paid' else payment_status::text end)::payment_status
  where id = p_order_id returning * into v_o;
  if p_status <> 'delivered' then
    insert into notifications (user_id, title, body, data) values (
      v_o.customer_id, case p_status when 'picked_up' then 'Pedido recogido' else 'Tu pedido está en camino' end,
      format('Pedido #%s · Llega en %s-%s min', v_o.number, coalesce(v_o.eta_min,10), coalesce(v_o.eta_max,20)),
      jsonb_build_object('order_id', v_o.id, 'type', 'order_status'));
  end if;
  return v_o;
end $$;

-- Ubicación del repartidor (solo si es él mismo)
create or replace function public.courier_update_location(p_lat float, p_lng float, p_order_id uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  update couriers set current_lat = p_lat, current_lng = p_lng, last_seen_at = now() where user_id = auth.uid();
  if p_order_id is not null then
    insert into courier_location_history (courier_id, order_id, lat, lng) values (auth.uid(), p_order_id, p_lat, p_lng);
  end if;
end $$;

-- =====================================================================
-- RPC: request_withdrawal — retiro de saldo del repartidor
-- =====================================================================
create or replace function public.request_withdrawal(p_amount integer) returns courier_withdrawals
language plpgsql security definer set search_path = public as $$
declare v_c couriers; v_w courier_withdrawals; v_min integer := setting_int('min_withdrawal', 50000);
begin
  select * into v_c from couriers where user_id = auth.uid() for update;
  if v_c.user_id is null then raise exception 'No eres repartidor'; end if;
  if p_amount < v_min then raise exception 'El retiro mínimo es %', v_min; end if;
  if p_amount > v_c.balance then raise exception 'Saldo insuficiente'; end if;
  update couriers set balance = balance - p_amount where user_id = auth.uid();
  insert into courier_withdrawals (courier_id, amount, bank_snapshot) values (auth.uid(), p_amount, v_c.bank_account) returning * into v_w;
  return v_w;
end $$;

-- =====================================================================
-- RPC admin: aprobar / pagar liquidación con auditoría
-- =====================================================================
create or replace function public.admin_settlement_transition(p_id uuid, p_status settlement_status, p_reason text, p_reference text default null)
returns settlements language plpgsql security definer set search_path = public as $$
declare v_s settlements; v_before jsonb;
begin
  if not has_admin_role(array['owner','finance']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then raise exception 'Indica un motivo'; end if;
  select * into v_s from settlements where id = p_id for update;
  v_before := to_jsonb(v_s);
  if p_status = 'approved' and v_s.status <> 'pending' then raise exception 'Solo se aprueban liquidaciones pendientes'; end if;
  if p_status = 'paid' and v_s.status <> 'approved' then raise exception 'Primero debe aprobarse'; end if;
  update settlements set status = p_status,
    approved_by = case when p_status = 'approved' then auth.uid() else approved_by end,
    approved_at = case when p_status = 'approved' then now() else approved_at end,
    approval_reason = case when p_status = 'approved' then p_reason else approval_reason end,
    paid_by = case when p_status = 'paid' then auth.uid() else paid_by end,
    paid_at = case when p_status = 'paid' then now() else paid_at end,
    payment_reference = coalesce(p_reference, payment_reference),
    notes = coalesce(notes,'') || E'\n' || p_reason
  where id = p_id returning * into v_s;
  perform audit('settlement.' || p_status::text, 'settlement', p_id::text, p_reason, v_before, to_jsonb(v_s));
  return v_s;
end $$;

-- Generar liquidaciones pendientes para un período (comercios y repartidores)
create or replace function public.admin_generate_settlements(p_start date, p_end date) returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer := 0; r record; v_id uuid;
begin
  if not has_admin_role(array['owner','finance']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  for r in
    select o.merchant_id as payee, count(*) c, sum(o.items_subtotal) gross, sum(o.commission_amount) comm, sum(o.merchant_payout) net
    from orders o where o.status = 'delivered' and o.merchant_id is not null
      and o.delivered_at::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id where so.order_id = o.id and s.payee_type = 'merchant')
    group by o.merchant_id
  loop
    insert into settlements (payee_type, payee_id, period_start, period_end, orders_count, gross, commissions, net, bank_snapshot)
    values ('merchant', r.payee, p_start, p_end, r.c, r.gross, r.comm, r.net, (select bank_account from merchants where id = r.payee)) returning id into v_id;
    insert into settlement_orders (settlement_id, order_id, amount)
    select v_id, o.id, o.merchant_payout from orders o where o.merchant_id = r.payee and o.status = 'delivered' and o.delivered_at::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id where so.order_id = o.id and s.payee_type = 'merchant' and s.id <> v_id);
    v_count := v_count + 1;
  end loop;
  for r in
    select o.courier_id as payee, count(*) c, sum(o.courier_payout) net
    from orders o where o.status = 'delivered' and o.courier_id is not null
      and o.delivered_at::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id where so.order_id = o.id and s.payee_type = 'courier')
    group by o.courier_id
  loop
    insert into settlements (payee_type, payee_id, period_start, period_end, orders_count, gross, commissions, net, bank_snapshot)
    values ('courier', r.payee, p_start, p_end, r.c, r.net, 0, r.net, (select bank_account from couriers where user_id = r.payee)) returning id into v_id;
    insert into settlement_orders (settlement_id, order_id, amount)
    select v_id, o.id, o.courier_payout from orders o where o.courier_id = r.payee and o.status = 'delivered' and o.delivered_at::date between p_start and p_end
      and not exists (select 1 from settlement_orders so join settlements s on s.id = so.settlement_id where so.order_id = o.id and s.payee_type = 'courier' and s.id <> v_id);
    v_count := v_count + 1;
  end loop;
  perform audit('settlements.generate', 'settlement', null, format('%s a %s', p_start, p_end), null, jsonb_build_object('count', v_count));
  return v_count;
end $$;

-- Revisión de comercio / repartidor por admin (con auditoría)
create or replace function public.admin_set_merchant_status(p_id uuid, p_status merchant_status, p_reason text) returns merchants
language plpgsql security definer set search_path = public as $$
declare v_m merchants; v_before jsonb;
begin
  if not has_admin_role(array['owner','operations']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  select * into v_m from merchants where id = p_id; v_before := to_jsonb(v_m);
  update merchants set status = p_status, review_notes = p_reason where id = p_id returning * into v_m;
  perform audit('merchant.status.' || p_status::text, 'merchant', p_id::text, p_reason, v_before, to_jsonb(v_m));
  insert into notifications (user_id, title, body, data)
  select user_id, 'Estado de tu comercio', format('%s: %s', v_m.name, p_status), jsonb_build_object('merchant_id', p_id) from merchant_members where merchant_id = p_id;
  return v_m;
end $$;

create or replace function public.admin_set_courier_status(p_id uuid, p_status courier_status, p_reason text) returns couriers
language plpgsql security definer set search_path = public as $$
declare v_c couriers; v_before jsonb;
begin
  if not has_admin_role(array['owner','operations']::admin_role[]) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  select * into v_c from couriers where user_id = p_id; v_before := to_jsonb(v_c);
  update couriers set status = p_status, review_notes = p_reason where user_id = p_id returning * into v_c;
  perform audit('courier.status.' || p_status::text, 'courier', p_id::text, p_reason, v_before, to_jsonb(v_c));
  insert into notifications (user_id, title, body, data) values (p_id, 'Estado de tu cuenta de repartidor', p_status::text, jsonb_build_object('type','courier_status'));
  return v_c;
end $$;

-- Invitaciones al equipo administrativo
create or replace function public.admin_invite(p_email text, p_role admin_role) returns admin_invitations
language plpgsql security definer set search_path = public as $$
declare v_i admin_invitations;
begin
  if not is_owner() then raise exception 'Solo el owner invita miembros' using errcode = '42501'; end if;
  insert into admin_invitations (email, role, invited_by) values (lower(p_email), p_role, auth.uid()) returning * into v_i;
  perform audit('admin.invite', 'admin_invitation', v_i.id::text, 'Invitación a ' || p_email, null, to_jsonb(v_i) - 'token');
  return v_i;
end $$;

create or replace function public.admin_accept_invitation(p_token text) returns admin_users
language plpgsql security definer set search_path = public as $$
declare v_i admin_invitations; v_a admin_users; v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  select * into v_i from admin_invitations where token = p_token and accepted_at is null and expires_at > now();
  if v_i.id is null then raise exception 'Invitación inválida o vencida'; end if;
  if lower(v_i.email) <> lower(coalesce(v_email,'')) then raise exception 'La invitación es para otro correo'; end if;
  insert into admin_users (user_id, role, status, invited_by, invited_at, accepted_at)
  values (auth.uid(), v_i.role, 'active', v_i.invited_by, v_i.created_at, now())
  on conflict (user_id) do update set role = excluded.role, status = 'active', accepted_at = now()
  returning * into v_a;
  update admin_invitations set accepted_at = now() where id = v_i.id;
  update profiles set role = 'admin' where id = auth.uid();
  return v_a;
end $$;

-- Registro de comercio desde la app
create or replace function public.register_merchant(p jsonb) returns merchants
language plpgsql security definer set search_path = public as $$
declare v_m merchants; v_slug text;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  v_slug := regexp_replace(lower(p->>'name'), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6);
  insert into merchants (owner_id, name, slug, category, tagline, description, city_id, address, lat, lng, phone, legal_name, tax_id, status)
  values (auth.uid(), p->>'name', v_slug, coalesce((p->>'category')::merchant_category, 'food'), p->>'tagline', p->>'description',
          (p->>'city_id')::uuid, p->>'address', (p->>'lat')::float, (p->>'lng')::float, p->>'phone', p->>'legal_name', p->>'tax_id', 'under_review')
  returning * into v_m;
  insert into merchant_members (merchant_id, user_id, member_role) values (v_m.id, auth.uid(), 'owner');
  update profiles set role = 'merchant' where id = auth.uid();
  insert into merchant_hours (merchant_id, weekday, opens, closes) select v_m.id, d, '08:00', '22:00' from generate_series(0,6) d;
  return v_m;
end $$;

-- Registro de repartidor desde la app
create or replace function public.register_courier(p jsonb) returns couriers
language plpgsql security definer set search_path = public as $$
declare v_c couriers;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '28000'; end if;
  insert into couriers (user_id, city_id, vehicle, plate, document_number, status)
  values (auth.uid(), (p->>'city_id')::uuid, coalesce((p->>'vehicle')::vehicle_type,'moto'), p->>'plate', p->>'document_number', 'pending')
  on conflict (user_id) do update set vehicle = excluded.vehicle, plate = excluded.plate, document_number = excluded.document_number
  returning * into v_c;
  update profiles set role = 'courier' where id = auth.uid();
  return v_c;
end $$;

-- Marcar documentos enviados → pasa a revisión
create or replace function public.courier_submit_for_review() returns void
language sql security definer set search_path = public as $$
  update couriers set status = 'under_review' where user_id = auth.uid() and status = 'pending'
$$;

-- Búsqueda global del cliente
create or replace function public.search_catalog(p_q text, p_city uuid default null)
returns table (kind text, id uuid, merchant_id uuid, name text, subtitle text, image_url text, price integer, rating numeric)
language sql stable security definer set search_path = public as $$
  select 'merchant', m.id, m.id, m.name, m.tagline, m.logo_url, null::int, m.rating_avg
  from merchants m where m.status = 'active' and (p_city is null or m.city_id = p_city)
    and (m.name ilike '%'||p_q||'%' or m.tagline ilike '%'||p_q||'%' or exists (select 1 from unnest(m.tags) t where t ilike '%'||p_q||'%'))
  union all
  select 'product', p.id, p.merchant_id, p.name, m.name, p.image_urls[1], p.price, m.rating_avg
  from products p join merchants m on m.id = p.merchant_id
  where p.status = 'published' and m.status = 'active' and (p_city is null or m.city_id = p_city)
    and (p.name ilike '%'||p_q||'%' or p.description ilike '%'||p_q||'%')
  limit 60
$$;

-- Marcar notificaciones leídas
create or replace function public.mark_notifications_read(p_ids bigint[] default null) returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;

-- Cobertura: ¿hay una zona activa que cubra estas coordenadas?
create or replace function public.coverage_for(p_lat float, p_lng float)
returns table (zone_id uuid, zone_name text, city_id uuid, city_name text, base_delivery_fee integer, distance_km float)
language sql stable security definer set search_path = public as $$
  select z.id, z.name, z.city_id, c.name, z.base_delivery_fee, haversine_km(p_lat, p_lng, z.center_lat, z.center_lng)
  from delivery_zones z join cities c on c.id = z.city_id
  where z.active and c.active and haversine_km(p_lat, p_lng, z.center_lat, z.center_lng) <= z.radius_km
  order by 6 limit 1
$$;

-- Comercios cercanos con distancia (para "Restaurantes cerca")
create or replace function public.nearby_merchants(p_lat float, p_lng float, p_category merchant_category default null, p_radius_km float default 15)
returns table (id uuid, name text, slug text, category merchant_category, tagline text, logo_url text, cover_url text,
               delivery_fee integer, prep_min integer, prep_max integer, rating_avg numeric, rating_count integer, tags text[],
               featured boolean, is_open boolean, distance_km float)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.slug, m.category, m.tagline, m.logo_url, m.cover_url, m.delivery_fee, m.prep_min, m.prep_max,
         m.rating_avg, m.rating_count, m.tags, m.featured, merchant_is_open(m), haversine_km(p_lat, p_lng, m.lat, m.lng)
  from merchants m
  where m.status = 'active' and (p_category is null or m.category = p_category)
    and (p_lat is null or m.lat is null or haversine_km(p_lat, p_lng, m.lat, m.lng) <= p_radius_km)
  order by merchant_is_open(m) desc, m.featured desc, haversine_km(p_lat, p_lng, m.lat, m.lng) nulls last, m.rating_avg desc
$$;
