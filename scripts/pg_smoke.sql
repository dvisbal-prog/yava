\set ON_ERROR_STOP on
-- Simular JWT de usuarios con RLS activa (rol authenticated)
set role authenticated;
-- Cliente María coloca pedido en Bocamar
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
\echo '--- cliente: comercios visibles'
select count(*) as merchants_visible from merchants;
\echo '--- cliente: place_order con cupón BIENVENIDO'
select number, status, items_subtotal, delivery_fee, service_fee, discount, total, commission_amount, merchant_payout
from place_order('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',
  jsonb_build_array(
    jsonb_build_object('product_id','e0000000-0000-0000-0000-000000000001','qty',1,'option_ids',
      jsonb_build_array((select id from product_options where name='Sin picante' limit 1),(select id from product_options where name='Aguacate' limit 1))),
    jsonb_build_object('product_id','e0000000-0000-0000-0000-000000000006','qty',2)),
  'cash', null, 'BIENVENIDO', 'Sin cebolla por favor') \gset
\echo '--- cliente no debe ver pedidos ajenos'
select count(*) as own_orders from orders where customer_id = 'a0000000-0000-0000-0000-000000000001';
select count(*) as foreign_orders from orders where customer_id = 'a0000000-0000-0000-0000-000000000006';
-- Comercio acepta y prepara
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', false);
\echo '--- comercio: pedidos nuevos visibles'
select number, status from orders where status='placed' order by number;
select status from merchant_set_order_status((select id from orders where number = :number), 'accepted');
select status from merchant_set_order_status((select id from orders where number = :number), 'preparing');
select status from merchant_set_order_status((select id from orders where number = :number), 'ready');
\echo '--- comercio dashboard'
select merchant_dashboard('c0000000-0000-0000-0000-000000000001');
-- Repartidor
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
\echo '--- repartidor: disponibles'
select number, status, merchant_name, courier_payout, round(distance_km::numeric,2) km from courier_available_orders(10.9878, -74.9547);
select status, courier_id is not null as assigned from courier_accept_order((select id from orders where number = :number));
select status from courier_set_order_status((select id from orders where number = :number), 'picked_up');
select status from courier_set_order_status((select id from orders where number = :number), 'on_the_way');
\echo '--- repartidor: código incorrecto debe fallar'
\set ON_ERROR_STOP off
select status from courier_set_order_status((select id from orders where number = :number), 'delivered', '0000');
\set ON_ERROR_STOP on
select status, payment_status from courier_set_order_status((select id from orders where number = :number), 'delivered', (select delivery_code from orders where number = :number));
select courier_dashboard();
-- Cliente califica
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
insert into ratings (order_id, customer_id, merchant_id, courier_id, merchant_rating, courier_rating, comment)
select id, customer_id, merchant_id, courier_id, 5, 4, 'Muy bien' from orders where number = :number;
select rating_avg, rating_count from merchants where id='c0000000-0000-0000-0000-000000000001';
\echo '--- eventos del pedido'
select status, created_at is not null as ts from order_events where order_id = (select id from orders where number = :number) order by id;
-- Owner
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', false);
\echo '--- owner: panorama'
select admin_overview(now() - interval '30 days');
select payee_type, count(*), sum(net) from settlements group by 1;
select status from admin_settlement_transition((select id from settlements where payee_type='merchant' limit 1), 'approved', 'Revisado contra conciliación');
select action, entity from audit_log order by id desc limit 3;
\echo '--- finanzas: no puede invitar'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000005', false);
\set ON_ERROR_STOP off
select admin_invite('nuevo@yava.app','operations');
\set ON_ERROR_STOP on
\echo '--- cobertura y cercanos'
select zone_name, city_name from coverage_for(10.9871, -74.9541);
select zone_name from coverage_for(4.6, -74.08);
select name, is_open, round(distance_km::numeric,2) from nearby_merchants(10.9871, -74.9541, 'food');
select kind, name, price from search_catalog('cevi') limit 5;
\echo 'SMOKE OK'
