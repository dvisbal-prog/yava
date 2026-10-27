-- Prueba de 0013_fixes.sql bajo RLS. Correr después de pg_smoke.sql (usa sus datos). Debe terminar en "SMOKE 0013 OK".
\set ON_ERROR_STOP on
set timezone = 'UTC'; -- igual que el proyecto vivo

-- Ayudantes de aserción (se borran al final)
create schema if not exists smoke;
create or replace function smoke.check(p_ok boolean, p_label text) returns text language plpgsql as $$
begin
  if p_ok is not true then raise exception 'FAIL: %', p_label; end if;
  return 'OK · ' || p_label;
end $$;
create or replace function smoke.expect_error(p_sql text, p_like text) returns text language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL: se esperaba error "%" y no hubo: %', p_like, p_sql using errcode = 'P0099';
exception
  when sqlstate 'P0099' then raise;
  when others then
    if sqlerrm not like p_like then
      raise exception 'FAIL: error inesperado en %: % (se esperaba "%")', p_sql, sqlerrm, p_like;
    end if;
    return 'OK · ' || sqlerrm;
end $$;
grant usage on schema smoke to anon, authenticated;
grant execute on all functions in schema smoke to anon, authenticated;

set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);

\echo '=== 1. Repartidor: UPDATE directo sobre couriers ya no está permitido'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
select balance as saldo_antes from couriers where user_id = 'a0000000-0000-0000-0000-000000000003' \gset
with u as (update couriers set balance = 999999999, is_online = true where user_id = 'a0000000-0000-0000-0000-000000000003' returning 1)
select count(*) as filas_actualizadas from u;
select smoke.check((select balance from couriers where user_id = 'a0000000-0000-0000-0000-000000000003') = :saldo_antes,
                   'UPDATE directo afecta 0 filas: el saldo no cambia y no hay recursión 42P17');

\echo '=== 2. courier_set_online / courier_update_settings'
select courier_set_online(false);
select smoke.check((select not is_online from couriers where user_id = 'a0000000-0000-0000-0000-000000000003'), 'courier_set_online(false)');
select courier_set_online(true);
select smoke.check((select is_online from couriers where user_id = 'a0000000-0000-0000-0000-000000000003'), 'courier_set_online(true) con repartidor activo');
select courier_update_settings(p_plate => 'XYZ98A', p_bank_account => '{"bank":"Bancolombia","type":"ahorros","number":"12345678901","holder":"Carlos Rodríguez"}');
select courier_update_settings(p_vehicle => 'bicicleta');
select plate, vehicle, bank_account->>'bank' as banco from couriers where user_id = 'a0000000-0000-0000-0000-000000000003';
select smoke.check((select plate = 'XYZ98A' and vehicle = 'bicicleta' and bank_account->>'number' = '12345678901'
                    from couriers where user_id = 'a0000000-0000-0000-0000-000000000003'),
                   'courier_update_settings aplica solo los argumentos no nulos');
select smoke.expect_error($$select courier_update_settings(p_bank_account => '"texto"')$$, 'Datos bancarios no válidos');

\echo '=== 3. Pedido de comida aceptado = entrega activa del repartidor'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select id as pedido, number as numero from place_order('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
  jsonb_build_array(jsonb_build_object('product_id', 'e0000000-0000-0000-0000-000000000001', 'qty', 1)), 'cash') \gset
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', false);
select status from merchant_set_order_status(:'pedido', 'accepted');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
select number, status, courier_id is not null as asignado from courier_accept_order(:'pedido');
select courier_dashboard()->>'active_order' as active_order;
select smoke.check((courier_dashboard()->>'active_order')::uuid = :'pedido'::uuid, 'courier_dashboard.active_order = pedido aceptado (status accepted)');
select smoke.expect_error(format('select courier_accept_order(%L)', '90000000-0000-0000-0000-000000001044'), 'Ya tienes una entrega en curso');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select smoke.check((select count(*) from couriers where user_id = 'a0000000-0000-0000-0000-000000000003') = 1, 'el cliente ve al repartidor desde que acepta (couriers tracking)');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', false);
select smoke.check((select count(*) from couriers where user_id = 'a0000000-0000-0000-0000-000000000003') = 1, 'el comercio ve al repartidor desde que acepta');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000006', false);
select smoke.check((select count(*) from couriers where user_id = 'a0000000-0000-0000-0000-000000000003') = 0, 'un cliente ajeno no ve al repartidor');
-- Cerrar la entrega
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
select status from courier_set_order_status(:'pedido', 'picked_up');
select status from courier_set_order_status(:'pedido', 'on_the_way');
select status from courier_set_order_status(:'pedido', 'delivered', 'EFECTIVO');
select smoke.check(courier_dashboard()->>'active_order' is null, 'sin entrega activa tras entregar');

\echo '=== 4. Guards: admin_overview / merchant_dashboard / audit'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select smoke.expect_error($$select admin_overview()$$, 'No autorizado');
select smoke.expect_error($$select merchant_dashboard('c0000000-0000-0000-0000-000000000001')$$, 'No autorizado');
select smoke.expect_error($$select audit('forjado', 'order', null, 'cliente', null, null)$$, 'No autorizado');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', false);
select merchant_dashboard('c0000000-0000-0000-0000-000000000001')->>'orders' as pedidos_hoy_bocamar;
select smoke.expect_error($$select merchant_dashboard('c0000000-0000-0000-0000-000000000002')$$, 'No autorizado');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', false);
select smoke.check((admin_overview(now() - interval '30 days')->>'delivered')::int > 0, 'admin_overview para la owner');
select audit('smoke.0013', 'test', null, 'owner directo', null, null);
select smoke.check((select action from audit_log order by id desc limit 1) = 'smoke.0013', 'audit() directo para admin');
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
select smoke.expect_error($$select admin_overview()$$, 'permission denied%');
select smoke.expect_error($$select merchant_dashboard('c0000000-0000-0000-0000-000000000001')$$, 'permission denied%');
select smoke.expect_error($$select audit('forjado', 'order', null, 'anon', null, null)$$, 'permission denied%');
reset role;
set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);

\echo '=== 5. setting_int lee los valores guardados (no el valor por defecto)'
select setting_int('service_fee', 0) as service_fee, setting_int('shipment_base_fee', 0) as shipment_base_fee,
       setting_int('min_withdrawal', 0) as min_withdrawal, setting_int('no_existe', 7) as por_defecto;
select smoke.check(setting_int('service_fee', 0) = 1000 and setting_int('shipment_base_fee', 0) = 8000
                   and setting_int('min_withdrawal', 0) = 50000 and setting_int('no_existe', 7) = 7, 'setting_int');

\echo '=== 6. merchants: columnas protegidas'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', false);
update merchants set manual_closed = false, tagline = 'Ceviches frescos de la costa' where id = 'c0000000-0000-0000-0000-000000000001';
select smoke.check((select tagline = 'Ceviches frescos de la costa' from merchants where id = 'c0000000-0000-0000-0000-000000000001'), 'el comercio edita sus datos operativos');
select smoke.expect_error($$update merchants set commission_rate = 0 where id = 'c0000000-0000-0000-0000-000000000001'$$, 'No autorizado%');
select smoke.expect_error($$update merchants set delivery_fee = 0 where id = 'c0000000-0000-0000-0000-000000000001'$$, 'No autorizado%');
select smoke.expect_error($$update merchants set status = 'suspended' where id = 'c0000000-0000-0000-0000-000000000001'$$, 'No autorizado%');
select smoke.expect_error($$update merchants set rating_avg = 5 where id = 'c0000000-0000-0000-0000-000000000001'$$, 'No autorizado%');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', false);
update merchants set commission_rate = 0.12 where id = 'c0000000-0000-0000-0000-000000000001';
update merchants set commission_rate = 0.10 where id = 'c0000000-0000-0000-0000-000000000001';
select status from admin_set_merchant_status('c0000000-0000-0000-0000-000000000003', 'paused', 'Prueba 0013');
select status from admin_set_merchant_status('c0000000-0000-0000-0000-000000000003', 'active', 'Prueba 0013');

\echo '=== 7. Ganancias hoy / semana en hora de Bogotá'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
select courier_dashboard()->>'today_deliveries' as hoy_nuevo,
       (select count(*) from orders where courier_id = auth.uid() and status = 'delivered'
          and delivered_at >= (now() at time zone 'America/Bogota')::date) as hoy_formula_vieja_utc,
       courier_dashboard()->>'week_deliveries' as semana_nuevo;
select smoke.check((courier_dashboard()->>'today_deliveries')::int = (select count(*) from orders where courier_id = auth.uid() and status = 'delivered'
                     and (delivered_at at time zone 'America/Bogota')::date = (now() at time zone 'America/Bogota')::date), 'today_deliveries = entregas del día en Bogotá');
select smoke.check((courier_dashboard()->>'week_deliveries')::int = (select count(*) from orders where courier_id = auth.uid() and status = 'delivered'
                     and (delivered_at at time zone 'America/Bogota')::date >= (now() at time zone 'America/Bogota')::date - 6), 'week_deliveries = últimos 7 días de Bogotá');
select smoke.check((courier_dashboard()->>'today_earnings')::int = (select coalesce(sum(courier_payout), 0) from orders where courier_id = auth.uid() and status = 'delivered'
                     and (delivered_at at time zone 'America/Bogota')::date = (now() at time zone 'America/Bogota')::date), 'today_earnings en Bogotá');

\echo '=== 8. Liquidación rechazada libera sus pedidos'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', false);
select id as rech, payee_id as rech_payee, orders_count as rech_n, period_start as rech_ini, period_end as rech_fin
from settlements where payee_type = 'merchant' and status = 'pending' order by net desc limit 1 \gset
select status from admin_settlement_transition(:'rech', 'rejected', 'Prueba 0013: montos no cuadran');
select admin_generate_settlements(:'rech_ini', :'rech_fin') as liquidaciones_nuevas;
select smoke.check((select orders_count from settlements where payee_id = :'rech_payee' and payee_type = 'merchant' and status = 'pending' and id <> :'rech') = :rech_n,
                   'los pedidos de la liquidación rechazada vuelven a liquidarse');

\echo '=== 9. Eliminación de cuenta'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000006', false);
select smoke.expect_error($$select anonymize_account('a0000000-0000-0000-0000-000000000001')$$, 'Sin permiso');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', false);
select smoke.expect_error($$select anonymize_account('a0000000-0000-0000-0000-000000000003')$$, 'Tienes saldo por retirar%');

\echo '=== 10. register_courier y repartidor no activo'
select smoke.expect_error($$select register_courier('{"vehicle":"carro","plate":"HACK01"}')$$, 'Tus datos ya están en revisión%');
select smoke.check((select plate = 'XYZ98A' from couriers where user_id = 'a0000000-0000-0000-0000-000000000003'), 'register_courier no sobrescribe al repartidor activo');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000006', false);
select status from register_courier('{"city_id":"11111111-1111-1111-1111-111111111111","vehicle":"moto","plate":"AAA11B","document_number":"1045000000"}');
select status, plate from register_courier('{"city_id":"11111111-1111-1111-1111-111111111111","vehicle":"moto","plate":"AAA22B","document_number":"1045000000"}');
select smoke.expect_error($$select courier_set_online(true)$$, 'Tu cuenta de repartidor aún no está activa');
select courier_set_online(false);

\echo '=== 11. confirm_payment ya no es invocable por usuarios'
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000006', false);
select smoke.expect_error($$select confirm_payment('90000000-0000-0000-0000-000000001044', 'wompi', 'x', 'paid', 36000)$$, 'permission denied%');

reset role;
drop schema smoke cascade;
\echo 'SMOKE 0013 OK'
