-- YAVA · Vistas para administración y owners (acceso vía RLS de tablas base + security_invoker)

create or replace view merchant_public with (security_invoker = true) as
select m.*, merchant_is_open(m) as is_open
from merchants m;

create or replace view order_summary with (security_invoker = true) as
select o.*, m.name as merchant_name, m.logo_url as merchant_logo, m.category as merchant_category,
       c.full_name as customer_name, c.phone as customer_phone,
       r.full_name as courier_name, r.phone as courier_phone,
       (select count(*) from order_items i where i.order_id = o.id) as items_count,
       ci.name as city_name
from orders o
left join merchants m on m.id = o.merchant_id
left join profiles c on c.id = o.customer_id
left join profiles r on r.id = o.courier_id
left join cities ci on ci.id = o.city_id;

-- Resumen financiero diario (solo admins/owners por RLS de orders)
create or replace view daily_finance with (security_invoker = true) as
select
  (o.delivered_at at time zone 'America/Bogota')::date as day,
  o.city_id,
  o.type,
  count(*) as delivered_orders,
  sum(o.items_subtotal) as merchant_sales,
  sum(o.delivery_fee) as delivery_fees,
  sum(o.service_fee) as service_fees,
  sum(o.discount) as discounts,
  sum(o.commission_amount) as commissions,
  sum(o.gateway_fee) as gateway_fees,
  sum(o.commission_amount + o.service_fee) as yava_gross_revenue,
  sum(o.commission_amount + o.service_fee - o.gateway_fee - case when o.coupon_id is not null then o.discount else 0 end) as yava_contribution,
  sum(o.total) as collected,
  sum(o.merchant_payout) as merchant_payouts,
  sum(o.courier_payout) as courier_payouts
from orders o
where o.status = 'delivered'
group by 1,2,3;

create or replace view city_summary with (security_invoker = true) as
select c.id as city_id, c.name as city_name,
  count(o.id) filter (where o.status = 'delivered') as delivered_orders,
  count(o.id) filter (where o.status not in ('delivered','cancelled')) as active_orders,
  coalesce(sum(o.items_subtotal) filter (where o.status = 'delivered'),0) as merchant_sales,
  coalesce(sum(o.commission_amount + o.service_fee) filter (where o.status = 'delivered'),0) as yava_revenue,
  (select count(*) from merchants m where m.city_id = c.id and m.status = 'active') as active_merchants,
  (select count(*) from couriers r where r.city_id = c.id and r.is_online) as online_couriers
from cities c left join orders o on o.city_id = c.id and o.placed_at >= (now() at time zone 'America/Bogota')::date
group by c.id, c.name;

-- Panorama en vivo
create or replace function public.admin_overview(p_from timestamptz default date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota', p_to timestamptz default now(), p_city uuid default null)
returns jsonb language sql stable security definer set search_path = public as $$
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
  from orders where placed_at between p_from and p_to and (p_city is null or city_id = p_city) and is_admin()
$$;

-- Resumen para el comercio
create or replace function public.merchant_dashboard(p_merchant uuid, p_from timestamptz default date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota')
returns jsonb language sql stable security definer set search_path = public as $$
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
  ) from orders where merchant_id = p_merchant and placed_at >= p_from and (is_merchant_member(p_merchant) or is_admin())
$$;

-- Resumen para el repartidor
create or replace function public.courier_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'today_earnings', coalesce(sum(courier_payout) filter (where status='delivered' and delivered_at >= (now() at time zone 'America/Bogota')::date),0),
    'today_deliveries', count(*) filter (where status='delivered' and delivered_at >= (now() at time zone 'America/Bogota')::date),
    'week_earnings', coalesce(sum(courier_payout) filter (where status='delivered' and delivered_at >= now() - interval '7 days'),0),
    'week_deliveries', count(*) filter (where status='delivered' and delivered_at >= now() - interval '7 days'),
    'balance', (select balance from couriers where user_id = auth.uid()),
    'rating', (select rating_avg from couriers where user_id = auth.uid()),
    'total_deliveries', (select deliveries_count from couriers where user_id = auth.uid()),
    'active_order', (select id from orders where courier_id = auth.uid() and status in ('assigned','picked_up','on_the_way') limit 1)
  ) from orders where courier_id = auth.uid()
$$;
