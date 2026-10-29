-- YAVA · Datos de ejemplo (Puerto Colombia / Barranquilla) · COP
-- Usuarios demo (contraseña: yava2026):
--   cliente@yava.app · comercio@yava.app (Bocamar) · repartidor@yava.app · owner@yava.app · finanzas@yava.app
-- Comercios: Bocamar, Naranmiche y Amaras (comida), Mercado del Puerto y Tienda de la Costa (mercado),
-- Farmacia del Puerto y Bienestar Caribe (farmacia) y Arepas Doña Rosa (solicitud en revisión).
-- Nombres, precios, favoritos, notificaciones y soporte de María siguen los diseños del cliente 01–48
-- (docs/DISENO-CLIENTE.md). Los pedidos de historial llevan productos (receta por comercio y subtotal).

-- Ciudades
insert into cities (id, name, slug, department, center_lat, center_lng) values
 ('11111111-1111-1111-1111-111111111111','Puerto Colombia','puerto-colombia','Atlántico', 10.9878, -74.9547),
 ('22222222-2222-2222-2222-222222222222','Barranquilla','barranquilla','Atlántico', 10.9685, -74.7813);

insert into delivery_zones (city_id, name, center_lat, center_lng, radius_km, base_delivery_fee) values
 ('11111111-1111-1111-1111-111111111111','Puerto Colombia centro', 10.9878, -74.9547, 6, 3000),
 ('22222222-2222-2222-2222-222222222222','Barranquilla norte', 10.9900, -74.8000, 8, 4000);

-- Configuración
insert into platform_settings (key, value, description) values
 ('service_fee', '1000', 'Tarifa de servicio por pedido (COP)'),
 ('shipment_base_fee', '8000', 'Tarifa base de envíos punto a punto (COP)'),
 ('default_commission_rate', '0.10', 'Comisión por defecto a comercios'),
 ('min_withdrawal', '50000', 'Retiro mínimo de repartidores (COP)'),
 ('max_product_photos', '5', 'Fotos máximas por producto'),
 ('support_phone', '"+57 300 000 0000"', 'Teléfono de soporte'),
 ('cash_enabled', 'true', 'Permitir pago en efectivo');

-- Usuarios demo
create or replace function seed_user(p_id uuid, p_email text, p_phone text, p_name text, p_role text) returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, phone_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, p_phone,
          crypt('yava2026', gen_salt('bf')), now(), now(),
          '{"provider":"email","providers":["email","phone"]}'::jsonb,
          jsonb_build_object('full_name', p_name, 'role', p_role), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text, jsonb_build_object('sub', p_id::text, 'email', p_email), 'email', now(), now(), now());
end $$;

select seed_user('a0000000-0000-0000-0000-000000000001','cliente@yava.app','+573001110001','María Pérez','customer');
select seed_user('a0000000-0000-0000-0000-000000000002','comercio@yava.app','+573001110002','Juan Bocamar','merchant');
select seed_user('a0000000-0000-0000-0000-000000000003','repartidor@yava.app','+573001110003','Carlos Rodríguez','courier');
select seed_user('a0000000-0000-0000-0000-000000000004','owner@yava.app','+573001110004','Laura Owner','admin');
select seed_user('a0000000-0000-0000-0000-000000000005','finanzas@yava.app','+573001110005','Andrés Finanzas','admin');
select seed_user('a0000000-0000-0000-0000-000000000006','cliente2@yava.app','+573001110006','Ana López','customer');
select seed_user('a0000000-0000-0000-0000-000000000007','naranmiche@yava.app','+573001110007','Pedro Naranmiche','merchant');
select seed_user('a0000000-0000-0000-0000-000000000008','amaras@yava.app','+573001110008','Samir Amaras','merchant');
drop function seed_user(uuid,text,text,text,text);

update profiles set city_id = '11111111-1111-1111-1111-111111111111';

insert into admin_users (user_id, role, status, accepted_at) values
 ('a0000000-0000-0000-0000-000000000004','owner','active', now()),
 ('a0000000-0000-0000-0000-000000000005','finance','active', now());

-- Direcciones
insert into addresses (id, user_id, label, line1, line2, city_id, instructions, lat, lng, is_default) values
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Casa','Calle 2 # 3-45','Apto. 302','11111111-1111-1111-1111-111111111111','Tocar el timbre al llegar.',10.9871,-74.9541,true),
 ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','Trabajo','Carrera 53 # 76-120','Oficina 501','22222222-2222-2222-2222-222222222222',null,10.9930,-74.8030,false),
 ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000006','Casa','Carrera 4 # 2-18',null,'11111111-1111-1111-1111-111111111111',null,10.9885,-74.9560,true);

-- Comercios
-- Portadas, logos y fotos de producto: recortes de los diseños (apps/mobile/assets/images/diseno, ver docs/FOTOS-DISENO.md)
-- subidos a Storage (merchant-media y product-images). En un proyecto nuevo hay que subirlos con `supabase storage cp`.
insert into merchants (id, owner_id, name, slug, category, tagline, description, city_id, address, lat, lng, phone, status, commission_rate, delivery_fee, prep_min, prep_max, rating_avg, rating_count, tags, featured, logo_url, cover_url, bank_account) values
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','Bocamar','bocamar','food','Ceviches','Ceviches frescos de la costa, preparados al momento.','11111111-1111-1111-1111-111111111111','Calle 3 # 4-10, Puerto Colombia',10.9880,-74.9550,'+573001110002','active',0.10,3000,25,35,4.8,320,'{ceviche,mariscos,comida de mar}',true,
  'https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000001/logo.png','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000001/portada.jpg',
  '{"bank":"Bancolombia","type":"Ahorros","number":"****4521","holder":"Bocamar SAS"}'),
 ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000007','Naranmiche','naranmiche','food','Hamburguesas','Hamburguesas artesanales con pan brioche.','11111111-1111-1111-1111-111111111111','Carrera 5 # 6-22, Puerto Colombia',10.9892,-74.9530,'+573001110007','active',0.10,3000,20,30,4.7,210,'{hamburguesas,americana}',true,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000002/portada.jpg',
  '{"bank":"Davivienda","type":"Corriente","number":"****7781","holder":"Naranmiche SAS"}'),
 ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000008','Amaras','amaras','food','Shawarmas','Shawarmas y comida árabe.','11111111-1111-1111-1111-111111111111','Calle 10 # 2-05, Puerto Colombia',10.9860,-74.9570,'+573001110008','active',0.10,3000,25,35,4.6,150,'{shawarma,arabe}',false,
  'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000003/portada.jpg',
  '{"bank":"Nequi","type":"Depósito","number":"****0008","holder":"Samir Amaras"}'),
 ('c0000000-0000-0000-0000-000000000004',null,'Mercado del Puerto','mercado-del-puerto','market','Frutas, verduras y más','Supermercado · Abarrotes y más','11111111-1111-1111-1111-111111111111','Calle 4 # 5-30, Puerto Colombia',10.9875,-74.9520,'+573001110010','active',0.10,3000,30,45,4.5,90,'{mercado,frutas,verduras}',true,
  'https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000004/logo.jpg','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000004/portada.jpg', null),
 ('c0000000-0000-0000-0000-000000000005',null,'Farmacia del Puerto','farmacia-del-puerto','pharmacy','Salud y bienestar','Medicamentos, cuidado personal y bienestar.','11111111-1111-1111-1111-111111111111','Carrera 2 # 8-12, Puerto Colombia',10.9900,-74.9545,'+573001110011','active',0.08,3000,30,40,4.8,60,'{farmacia,salud}',false,
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000005/portada.jpg', null),
 ('c0000000-0000-0000-0000-000000000006',null,'Arepas Doña Rosa','arepas-dona-rosa','food','Arepas y desayunos','Solicitud nueva pendiente de revisión.','22222222-2222-2222-2222-222222222222','Calle 72 # 41-20, Barranquilla',10.9960,-74.8010,'+573001110012','under_review',0.10,4000,15,25,0,0,'{arepas,desayunos}',false,null,null,null),
 -- Segunda tienda y segunda farmacia de 25 y 29. Sin foto en Storage: el app usa los recortes del diseño por nombre.
 -- Bienestar Caribe queda un poco más lejos que Farmacia del Puerto para que 29 las liste en ese orden (por distancia).
 ('c0000000-0000-0000-0000-000000000007',null,'Tienda de la Costa','tienda-de-la-costa','market','Lácteos, despensa y hogar','Lo de todos los días para tu casa.','11111111-1111-1111-1111-111111111111','Carrera 3 # 6-40, Puerto Colombia',10.9868,-74.9532,'+573001110013','active',0.10,3000,30,45,4.6,75,'{mercado,lacteos,despensa}',false,null,null,null),
 ('c0000000-0000-0000-0000-000000000008',null,'Bienestar Caribe','bienestar-caribe','pharmacy','Tu salud, más cerca','Droguería con domicilio en Puerto Colombia.','11111111-1111-1111-1111-111111111111','Calle 6 # 3-15, Puerto Colombia',10.9905,-74.9575,'+573001110014','active',0.08,3000,35,45,4.7,48,'{farmacia,salud}',false,null,null,null);

insert into merchant_members (merchant_id, user_id) values
 ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002'),
 ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000007'),
 ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000008');

insert into merchant_hours (merchant_id, weekday, opens, closes)
select m.id, d, '00:00'::time, '23:59'::time from merchants m, generate_series(0,6) d;

-- Categorías y productos · Bocamar
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Ceviches',1),
 ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','Acompañantes',2),
 ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','Bebidas',3);
insert into products (id, merchant_id, category_id, name, description, price, image_urls, status, sort) values
 ('e0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Ceviche clásico','Camarones, limón, cebolla morada y cilantro.',28000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/ceviche-clasico.jpg}','published',1),
 ('e0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Ceviche de camarón','Camarones en leche de tigre con mango y maíz tostado.',32000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/ceviche-camaron.jpg}','published',2),
 ('e0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Ceviche mixto','Pescado, camarón y pulpo.',36000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/ceviche-mixto.jpg}','published',3),
 ('e0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','Patacones Bocamar','Porción de patacones con suero costeño.',7000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/patacones.jpg}','published',1),
 ('e0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002','Chips de plátano Bocamar','Crocantes y ligeramente salados.',5000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/chips-platano.jpg}','published',2),
 ('e0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','Limonada natural','500 ml.',6000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/limonada-natural.jpg}','published',1),
 -- Agua: foto de Unsplash para los paneles; el app de cliente usa el recorte producto-agua.jpg por nombre
 ('e0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','Agua','600 ml.',4000,'{https://images.unsplash.com/photo-1616118132534-381148898bb4?w=800}','published',2),
 ('e0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003','Limonada de coco','500 ml.',9000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/limonada-coco.jpg}','published',3);

insert into product_option_groups (id, product_id, name, min_select, max_select, required, sort) values
 ('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','Elige el picante',1,1,true,1),
 ('f0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000001','Complementos',0,3,false,2),
 ('f0000000-0000-0000-0000-000000000003','e0000000-0000-0000-0000-000000000002','Elige el picante',1,1,true,1);
insert into product_options (group_id, name, price_delta, sort) values
 ('f0000000-0000-0000-0000-000000000001','Sin picante',0,1),
 ('f0000000-0000-0000-0000-000000000001','Suave',0,2),
 ('f0000000-0000-0000-0000-000000000001','Picante',0,3),
 ('f0000000-0000-0000-0000-000000000002','Patacones extra',4000,1),
 ('f0000000-0000-0000-0000-000000000002','Aguacate',3000,2),
 ('f0000000-0000-0000-0000-000000000002','Camarones extra',8000,3),
 ('f0000000-0000-0000-0000-000000000003','Sin picante',0,1),
 ('f0000000-0000-0000-0000-000000000003','Picante',0,2);

-- Naranmiche
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000002','Hamburguesas',1),
 ('d0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000002','Papas y bebidas',2);
insert into products (id, merchant_id, category_id, name, description, price, image_urls, status, sort) values
 ('e0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000011','Clásica Naranmiche','Carne 150 g, queso cheddar, lechuga, tomate y salsa de la casa.',24000,'{https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800}','published',1),
 ('e0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000011','Doble tocineta','Doble carne, tocineta crocante y queso.',32000,'{https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800}','published',2),
 ('e0000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000012','Papas a la francesa','Porción grande.',8000,'{https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800}','published',1),
 ('e0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000012','Gaseosa 400 ml','Coca-Cola, Sprite o Postobón.',4000,'{https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800}','published',2),
 -- Combo de la oferta de 33 (misma foto que la Clásica)
 ('e0000000-0000-0000-0000-000000000015','c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000011','Combo hamburguesa + papas','Hamburguesa clásica más papas francesas.',26000,'{https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800}','published',3);
insert into product_option_groups (id, product_id, name, min_select, max_select, required, sort) values
 ('f0000000-0000-0000-0000-000000000011','e0000000-0000-0000-0000-000000000011','Término',1,1,true,1),
 ('f0000000-0000-0000-0000-000000000012','e0000000-0000-0000-0000-000000000011','Adicionales',0,4,false,2);
insert into product_options (group_id, name, price_delta, sort) values
 ('f0000000-0000-0000-0000-000000000011','Medio',0,1),('f0000000-0000-0000-0000-000000000011','Bien cocido',0,2),
 ('f0000000-0000-0000-0000-000000000012','Tocineta',4000,1),('f0000000-0000-0000-0000-000000000012','Queso extra',3000,2),('f0000000-0000-0000-0000-000000000012','Huevo',2500,3);

-- Amaras
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000021','c0000000-0000-0000-0000-000000000003','Shawarmas',1),
 ('d0000000-0000-0000-0000-000000000022','c0000000-0000-0000-0000-000000000003','Bebidas',2);
insert into products (id, merchant_id, category_id, name, description, price, image_urls, status, sort) values
 ('e0000000-0000-0000-0000-000000000021','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000021','Shawarma de pollo','Pollo marinado, vegetales y salsa de ajo en pan pita.',22000,'{https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800}','published',1),
 ('e0000000-0000-0000-0000-000000000022','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000021','Shawarma mixto','Pollo y carne.',26000,'{https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800}','published',2),
 ('e0000000-0000-0000-0000-000000000023','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000021','Falafel','Vegetariano, con tahini.',20000,'{https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800}','published',3),
 -- Foto: la de la limonada natural de Bocamar
 ('e0000000-0000-0000-0000-000000000024','c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000022','Limonada de hierbabuena','500 ml.',8000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000001/limonada-natural.jpg}','published',1);

-- Mercado del Puerto
-- "Lo esencial" (25) ordena por sort los productos de todas las tiendas, así que sort es único y global:
-- Banano (1), Tomate (2), Arroz (3) y Leche (4) primero, como en el diseño; dentro de cada categoría el orden no cambia.
-- Sin foto en Storage para Leche: el app usa el recorte producto-leche.jpg por nombre.
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000031','c0000000-0000-0000-0000-000000000004','Frutas',1),
 ('d0000000-0000-0000-0000-000000000032','c0000000-0000-0000-0000-000000000004','Verduras',2),
 ('d0000000-0000-0000-0000-000000000034','c0000000-0000-0000-0000-000000000004','Lácteos',3),
 ('d0000000-0000-0000-0000-000000000033','c0000000-0000-0000-0000-000000000004','Despensa',4);
insert into products (merchant_id, category_id, name, description, price, image_urls, status, track_stock, stock, sort) values
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000031','Banano (1 kg)','Producto fresco de Mercado del Puerto.',4000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000004/banano.jpg}','published',true,80,1),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000031','Mango Tommy (unidad)','Mango dulce de temporada.',3500,'{https://images.unsplash.com/photo-1553279768-865429fa0078?w=800}','published',true,40,5),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000032','Tomate (1 kg)','Tomate chonto.',5000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000004/tomate.jpg}','published',true,60,2),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000032','Cebolla cabezona (1 kg)','',4500,'{https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800}','published',true,50,6),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000034','Leche (1 L)','',4000,'{https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800}','published',true,80,4),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000033','Arroz (1 kg)','',4500,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000004/arroz.jpg}','published',true,100,3),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000033','Aceite Premier 1 L','',14500,'{https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800}','published',true,0,7);

-- Tienda de la Costa
-- Sus productos van en "Lo esencial" (25) después de los de Mercado del Puerto (sort 8 en adelante).
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000071','c0000000-0000-0000-0000-000000000007','Lácteos',1),
 ('d0000000-0000-0000-0000-000000000072','c0000000-0000-0000-0000-000000000007','Despensa',2);
insert into products (merchant_id, category_id, name, description, price, image_urls, status, track_stock, stock, sort) values
 ('c0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000071','Leche (1 L)','',4200,'{https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800}','published',true,50,8),
 ('c0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000072','Arroz (1 kg)','',4600,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000004/arroz.jpg}','published',true,60,9),
 ('c0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000072','Aceite Premier 1 L','',14900,'{https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800}','published',true,30,10);

-- Farmacia del Puerto
-- "Productos destacados" (29) ordena por sort los productos de todas las farmacias:
-- Protector solar SPF 50 (1), Cepillo dental (2) y Apósitos adhesivos (3) van primero, como en el diseño.
-- Cepillo y Apósitos llevan foto de Unsplash para los paneles; el app de cliente usa los recortes del diseño por nombre.
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000042','c0000000-0000-0000-0000-000000000005','Cuidado personal',1),
 ('d0000000-0000-0000-0000-000000000043','c0000000-0000-0000-0000-000000000005','Protección solar',2),
 ('d0000000-0000-0000-0000-000000000044','c0000000-0000-0000-0000-000000000005','Primeros auxilios',3),
 ('d0000000-0000-0000-0000-000000000041','c0000000-0000-0000-0000-000000000005','Analgésicos',4);
insert into products (merchant_id, category_id, name, description, price, image_urls, status, track_stock, stock, sort) values
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000041','Acetaminofén 500 mg x 10','Venta libre.',4500,'{https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800}','published',true,200,4),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000041','Ibuprofeno 400 mg x 10','Venta libre.',6800,'{https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800}','published',true,150,5),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000043','Protector solar SPF 50','80 ml.',35000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000005/protector-solar.jpg}','published',true,25,1),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000044','Alcohol antiséptico 350 ml','',7500,'{https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800}','published',true,60,6),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000042','Cepillo dental','Cerdas suaves.',6000,'{https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800}','published',true,80,2),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000044','Apósitos adhesivos','Caja x 20.',5000,'{https://images.unsplash.com/photo-1635091237278-a882f31bc310?w=800}','published',true,70,3);

-- Bienestar Caribe (fotos: las mismas de Farmacia del Puerto)
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000081','c0000000-0000-0000-0000-000000000008','Analgésicos',1),
 ('d0000000-0000-0000-0000-000000000082','c0000000-0000-0000-0000-000000000008','Cuidado personal',2),
 ('d0000000-0000-0000-0000-000000000083','c0000000-0000-0000-0000-000000000008','Protección solar',3);
insert into products (merchant_id, category_id, name, description, price, image_urls, status, track_stock, stock, sort) values
 ('c0000000-0000-0000-0000-000000000008','d0000000-0000-0000-0000-000000000081','Acetaminofén 500 mg x 10','Venta libre.',4600,'{https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800}','published',true,120,7),
 ('c0000000-0000-0000-0000-000000000008','d0000000-0000-0000-0000-000000000082','Alcohol antiséptico 350 ml','',7400,'{https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800}','published',true,40,8),
 ('c0000000-0000-0000-0000-000000000008','d0000000-0000-0000-0000-000000000083','Protector solar SPF 50','80 ml.',36000,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000005/protector-solar.jpg}','published',true,20,9);

-- Cupones y promociones
insert into coupons (code, description, type, value, min_order, max_uses, per_user_limit, funded_by, valid_to) values
 ('BIENVENIDO','20 % en tu primer pedido','percent',20,20000,1000,1,'yava', now() + interval '90 days'),
 ('ENVIOGRATIS','Envío gratis','free_delivery',0,25000,500,3,'yava', now() + interval '30 days'),
 ('COSTA5','$5.000 de descuento','fixed',5000,30000,null,5,'yava', now() + interval '60 days');

insert into promotions (title, subtitle, image_url, merchant_id, coupon_code, sort) values
 ('El sabor de la costa','Descubre tus favoritos','https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=1200','c0000000-0000-0000-0000-000000000001',null,1),
 ('20 % en tu primer pedido','Usa el código BIENVENIDO','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200',null,'BIENVENIDO',2),
 ('Envío gratis en Mercado','Pedidos desde $25.000 con ENVIOGRATIS','https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200','c0000000-0000-0000-0000-000000000004','ENVIOGRATIS',3);

-- Repartidor
insert into couriers (user_id, city_id, vehicle, plate, document_number, status, is_online, current_lat, current_lng, last_seen_at, rating_avg, rating_count, deliveries_count, balance, bank_account) values
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','moto','ABC12D','1045678901','active',true,10.9878,-74.9547,now(),4.8,320,320,186000,
  '{"bank":"Nequi","type":"Depósito","number":"3001110003","holder":"Carlos Rodríguez"}');
insert into courier_documents (courier_id, doc_type, file_path, status) values
 ('a0000000-0000-0000-0000-000000000003','cedula','a0000000-0000-0000-0000-000000000003/cedula.jpg','approved'),
 ('a0000000-0000-0000-0000-000000000003','licencia','a0000000-0000-0000-0000-000000000003/licencia.jpg','approved'),
 ('a0000000-0000-0000-0000-000000000003','soat','a0000000-0000-0000-0000-000000000003/soat.pdf','approved');

-- Favoritos (34: Bocamar, Naranmiche y Amaras, en ese orden) y método de pago
insert into favorites (user_id, merchant_id, created_at) values
 ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001', now() - interval '2 min'),
 ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002', now() - interval '1 min'),
 ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000003', now());
insert into payment_methods (user_id, provider, method, brand, last4, exp_month, exp_year, holder_name, is_default) values
 ('a0000000-0000-0000-0000-000000000001','wompi','card','Visa','4242',12,2028,'María Pérez',true);

-- Pedidos de ejemplo
-- #1042 entregado (ceviche + limonada = 34.000 + 3.000 + 1.000 = 38.000); llegada estimada 25–35 min, como en 20.
insert into orders (id, number, customer_id, merchant_id, courier_id, city_id, type, status, address_snapshot, delivery_lat, delivery_lng,
  items_subtotal, delivery_fee, service_fee, discount, total, commission_rate, commission_amount, merchant_payout, courier_payout, gateway_fee,
  payment_method, payment_status, delivery_code, eta_min, eta_max, placed_at, accepted_at, ready_at, assigned_at, picked_up_at, delivered_at)
values ('90000000-0000-0000-0000-000000001042', 1042, 'a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','food','delivered',
 '{"label":"Casa","line1":"Calle 2 # 3-45","line2":"Apto. 302","city":"Puerto Colombia","instructions":"Tocar el timbre al llegar."}',10.9871,-74.9541,
 34000,3000,1000,0,38000,0.10,3400,30600,3000,300,'card','paid','6832',25,35,
 now() - interval '2 hours 35 min', now() - interval '2 hours 30 min', now() - interval '2 hours 15 min', now() - interval '2 hours 14 min', now() - interval '2 hours 10 min', now() - interval '2 hours');
insert into order_items (order_id, product_id, name, unit_price, qty, options, total) values
 ('90000000-0000-0000-0000-000000001042','e0000000-0000-0000-0000-000000000001','Ceviche clásico',28000,1,'[{"name":"Sin picante","price_delta":0}]',28000),
 ('90000000-0000-0000-0000-000000001042','e0000000-0000-0000-0000-000000000006','Limonada natural',6000,1,'[]',6000);
insert into order_messages (order_id, sender_id, body, created_at) values
 ('90000000-0000-0000-0000-000000001042','a0000000-0000-0000-0000-000000000003','Hola, ya recogí tu pedido. Voy en camino.', now() - interval '2 hours 9 min'),
 ('90000000-0000-0000-0000-000000001042','a0000000-0000-0000-0000-000000000001','Perfecto, gracias. Toca el timbre del 302.', now() - interval '2 hours 8 min');
insert into ratings (order_id, customer_id, merchant_id, courier_id, merchant_rating, courier_rating, comment) values
 ('90000000-0000-0000-0000-000000001042','a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003',5,5,'Excelente, muy fresco.');
-- Notificaciones de María por #1042 (38), con la misma forma de data que las funciones de 0005_functions.sql.
-- Confirmado y en camino ya leídas (2 min después); entregado sin leer (punto azul).
insert into notifications (user_id, title, body, data, read_at, created_at)
select o.customer_id, n.title, n.body, jsonb_build_object('order_id', o.id, 'type', n.tipo),
  case when n.leida then n.ts + interval '2 min' end, n.ts
from orders o
cross join lateral (values
  ('Pedido confirmado', 'Bocamar recibió tu pedido', 'order_status', o.accepted_at, true),
  ('Tu pedido está en camino', 'Carlos se dirige a tu dirección', 'order_status', o.picked_up_at, true),
  ('Pedido entregado', 'Tu pedido de Bocamar llegó a Casa', 'order_delivered', o.delivered_at, false)
) as n(title, body, tipo, ts, leida)
where o.number = 1042;

-- #1043 nuevo (Ana, 1 ceviche)
insert into orders (id, number, customer_id, merchant_id, city_id, type, status, address_snapshot, delivery_lat, delivery_lng,
  items_subtotal, delivery_fee, service_fee, total, commission_amount, merchant_payout, courier_payout, payment_method, payment_status, delivery_code, eta_min, eta_max, placed_at)
values ('90000000-0000-0000-0000-000000001043', 1043, 'a0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','food','placed',
 '{"label":"Casa","line1":"Carrera 4 # 2-18","city":"Puerto Colombia"}',10.9885,-74.9560, 28000,3000,1000,32000,2800,25200,3000,'cash','pending','4471',30,45, now() - interval '3 min');
insert into order_items (order_id, product_id, name, unit_price, qty, options, total) values
 ('90000000-0000-0000-0000-000000001043','e0000000-0000-0000-0000-000000000001','Ceviche clásico',28000,1,'[{"name":"Picante","price_delta":0}]',28000);

-- #1044 listo para recoger (Naranmiche) — disponible para repartidores
insert into orders (id, number, customer_id, merchant_id, city_id, type, status, address_snapshot, delivery_lat, delivery_lng,
  items_subtotal, delivery_fee, service_fee, total, commission_amount, merchant_payout, courier_payout, payment_method, payment_status, delivery_code, eta_min, eta_max, placed_at, accepted_at, ready_at)
values ('90000000-0000-0000-0000-000000001044', 1044, 'a0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','food','ready',
 '{"label":"Casa","line1":"Carrera 4 # 2-18","city":"Puerto Colombia"}',10.9885,-74.9560, 32000,3000,1000,36000,3200,28800,3000,'card','paid','9012',10,20, now() - interval '25 min', now() - interval '23 min', now() - interval '2 min');
insert into order_items (order_id, product_id, name, unit_price, qty, options, total) values
 ('90000000-0000-0000-0000-000000001044','e0000000-0000-0000-0000-000000000011','Clásica Naranmiche',24000,1,'[{"name":"Medio","price_delta":0}]',24000),
 ('90000000-0000-0000-0000-000000001044','e0000000-0000-0000-0000-000000000013','Papas a la francesa',8000,1,'[]',8000);

select setval('order_number_seq', 1050);

-- Historial de entregas para el panorama (últimos 7 días)
insert into orders (customer_id, merchant_id, courier_id, city_id, type, status, address_snapshot, items_subtotal, delivery_fee, service_fee, total,
  commission_amount, merchant_payout, courier_payout, gateway_fee, payment_method, payment_status, placed_at, delivered_at)
select 'a0000000-0000-0000-0000-000000000001',
  (array['c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005'])[1 + (g % 5)]::uuid,
  'a0000000-0000-0000-0000-000000000003',
  (array['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222'])[1 + (g % 2)]::uuid,
  (array['food','food','food','market','pharmacy'])[1 + (g % 5)]::order_type, 'delivered',
  '{"label":"Casa","line1":"Calle 2 # 3-45","city":"Puerto Colombia"}',
  30000 + (g % 7) * 4000, 3000, 1000, 34000 + (g % 7) * 4000,
  (30000 + (g % 7) * 4000) / 10, (30000 + (g % 7) * 4000) * 9 / 10, 3000, 300,
  (array['card','cash','nequi'])[1 + (g % 3)]::payment_method, 'paid',
  now() - (g || ' hours')::interval - interval '3 hours', now() - (g || ' hours')::interval - interval '2 hours 20 min'
from generate_series(1, 120) g;

-- 36 · Historial: el pedido de historial más reciente de Naranmiche pasa a 1 combo ($26.000 → total $30.000)
-- y el de Amaras a 1 shawarma de pollo ($22.000 → total $26.000). Nunca un pedido liquidado o dentro de un
-- período ya liquidado (aquí va antes de generar las liquidaciones, así que cuadran con estos montos).
do $$
declare v_cliente uuid := 'a0000000-0000-0000-0000-000000000001'; r record; v_id uuid; v_o orders;
begin
  for r in select * from (values ('naranmiche', 26000, 30000, 2600, 23400), ('amaras', 22000, 26000, 2200, 19800))
                      as t(slug, subtotal, total, comision, pago) loop
    v_id := null;
    select o.id into v_id from orders o join merchants m on m.id = o.merchant_id
     where o.customer_id = v_cliente and m.slug = r.slug and o.status = 'delivered'
       and not exists (select 1 from order_items i where i.order_id = o.id)
     order by o.delivered_at desc limit 1;
    if v_id is null then raise exception 'No hay pedido de historial de % para ajustar', r.slug; end if;
    if exists (select 1 from settlement_orders so where so.order_id = v_id)
       or (select (delivered_at at time zone 'America/Bogota')::date from orders where id = v_id)
          <= coalesce((select max(period_end) from settlements), '-infinity'::date) then
      raise exception 'El pedido de % está en un período liquidado: no se toca', r.slug;
    end if;
    update orders set items_subtotal = r.subtotal, total = r.total, commission_amount = r.comision, merchant_payout = r.pago
     where id = v_id returning * into v_o;
    if v_o.total <> v_o.items_subtotal + v_o.delivery_fee + v_o.service_fee - v_o.discount
       or v_o.commission_amount <> round(v_o.items_subtotal * v_o.commission_rate)
       or v_o.merchant_payout <> v_o.items_subtotal - v_o.commission_amount then
      raise exception 'Montos del pedido #% no cuadran', v_o.number;
    end if;
  end loop;
end $$;

-- Productos de los pedidos de historial (los que no tienen detalle), con una receta por comercio y subtotal.
-- Genérico (busca comercio por slug y producto por nombre): es el mismo SQL que se aplicó al proyecto en vivo.
-- Precio = precio actual del producto; si tiene un grupo obligatorio va su primera opción sin costo (como #1042).
do $$
declare v_sin integer; v_descuadre integer;
begin
  with receta(slug, subtotal, orden, producto, qty) as (values
    ('bocamar', 30000, 1, 'Limonada de coco', 2), ('bocamar', 30000, 2, 'Limonada natural', 2),
    ('bocamar', 34000, 1, 'Ceviche clásico', 1), ('bocamar', 34000, 2, 'Limonada natural', 1),
    ('bocamar', 38000, 1, 'Ceviche de camarón', 1), ('bocamar', 38000, 2, 'Limonada natural', 1),
    ('bocamar', 42000, 1, 'Ceviche mixto', 1), ('bocamar', 42000, 2, 'Limonada natural', 1),
    ('bocamar', 46000, 1, 'Ceviche clásico', 1), ('bocamar', 46000, 2, 'Patacones Bocamar', 1),
    ('bocamar', 46000, 3, 'Chips de plátano Bocamar', 1), ('bocamar', 46000, 4, 'Limonada natural', 1),
    ('bocamar', 50000, 1, 'Ceviche clásico', 1), ('bocamar', 50000, 2, 'Patacones Bocamar', 1),
    ('bocamar', 50000, 3, 'Limonada natural', 1), ('bocamar', 50000, 4, 'Limonada de coco', 1),
    ('bocamar', 54000, 1, 'Ceviche de camarón', 1), ('bocamar', 54000, 2, 'Patacones Bocamar', 1),
    ('bocamar', 54000, 3, 'Limonada natural', 1), ('bocamar', 54000, 4, 'Limonada de coco', 1),
    ('naranmiche', 26000, 1, 'Combo hamburguesa + papas', 1),
    ('naranmiche', 30000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 30000, 2, 'Gaseosa 400 ml', 1),
    ('naranmiche', 34000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 34000, 2, 'Papas a la francesa', 1),
    ('naranmiche', 38000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 38000, 2, 'Papas a la francesa', 1),
    ('naranmiche', 38000, 3, 'Gaseosa 400 ml', 1),
    ('naranmiche', 42000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 42000, 2, 'Papas a la francesa', 2),
    ('naranmiche', 46000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 46000, 2, 'Papas a la francesa', 2),
    ('naranmiche', 46000, 3, 'Gaseosa 400 ml', 1),
    ('naranmiche', 50000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 50000, 2, 'Clásica Naranmiche', 1),
    ('naranmiche', 54000, 1, 'Combo hamburguesa + papas', 1), ('naranmiche', 54000, 2, 'Clásica Naranmiche', 1),
    ('naranmiche', 54000, 3, 'Gaseosa 400 ml', 1),
    ('amaras', 22000, 1, 'Shawarma de pollo', 1),
    ('amaras', 30000, 1, 'Shawarma de pollo', 1), ('amaras', 30000, 2, 'Limonada de hierbabuena', 1),
    ('amaras', 34000, 1, 'Shawarma mixto', 1), ('amaras', 34000, 2, 'Limonada de hierbabuena', 1),
    ('amaras', 38000, 1, 'Shawarma de pollo', 1), ('amaras', 38000, 2, 'Limonada de hierbabuena', 2),
    ('amaras', 42000, 1, 'Shawarma de pollo', 1), ('amaras', 42000, 2, 'Falafel', 1),
    ('amaras', 46000, 1, 'Shawarma mixto', 1), ('amaras', 46000, 2, 'Falafel', 1),
    ('amaras', 50000, 1, 'Shawarma de pollo', 1), ('amaras', 50000, 2, 'Falafel', 1),
    ('amaras', 50000, 3, 'Limonada de hierbabuena', 1),
    ('amaras', 54000, 1, 'Shawarma mixto', 1), ('amaras', 54000, 2, 'Falafel', 1),
    ('amaras', 54000, 3, 'Limonada de hierbabuena', 1),
    ('mercado-del-puerto', 30000, 1, 'Banano (1 kg)', 2), ('mercado-del-puerto', 30000, 2, 'Tomate (1 kg)', 2),
    ('mercado-del-puerto', 30000, 3, 'Leche (1 L)', 3),
    ('mercado-del-puerto', 34000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 34000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 34000, 3, 'Tomate (1 kg)', 3),
    ('mercado-del-puerto', 38000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 38000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 38000, 3, 'Tomate (1 kg)', 3), ('mercado-del-puerto', 38000, 4, 'Banano (1 kg)', 1),
    ('mercado-del-puerto', 42000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 42000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 42000, 3, 'Tomate (1 kg)', 3), ('mercado-del-puerto', 42000, 4, 'Banano (1 kg)', 1),
    ('mercado-del-puerto', 42000, 5, 'Leche (1 L)', 1),
    ('mercado-del-puerto', 46000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 46000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 46000, 3, 'Tomate (1 kg)', 3), ('mercado-del-puerto', 46000, 4, 'Banano (1 kg)', 2),
    ('mercado-del-puerto', 46000, 5, 'Leche (1 L)', 1),
    ('mercado-del-puerto', 50000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 50000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 50000, 3, 'Tomate (1 kg)', 3), ('mercado-del-puerto', 50000, 4, 'Banano (1 kg)', 2),
    ('mercado-del-puerto', 50000, 5, 'Leche (1 L)', 2),
    ('mercado-del-puerto', 54000, 1, 'Aceite Premier 1 L', 1), ('mercado-del-puerto', 54000, 2, 'Arroz (1 kg)', 1),
    ('mercado-del-puerto', 54000, 3, 'Tomate (1 kg)', 3), ('mercado-del-puerto', 54000, 4, 'Banano (1 kg)', 2),
    ('mercado-del-puerto', 54000, 5, 'Leche (1 L)', 3),
    ('farmacia-del-puerto', 30000, 1, 'Acetaminofén 500 mg x 10', 1), ('farmacia-del-puerto', 30000, 2, 'Alcohol antiséptico 350 ml', 1),
    ('farmacia-del-puerto', 30000, 3, 'Cepillo dental', 3),
    ('farmacia-del-puerto', 34000, 1, 'Acetaminofén 500 mg x 10', 1), ('farmacia-del-puerto', 34000, 2, 'Alcohol antiséptico 350 ml', 1),
    ('farmacia-del-puerto', 34000, 3, 'Cepillo dental', 2), ('farmacia-del-puerto', 34000, 4, 'Apósitos adhesivos', 2),
    ('farmacia-del-puerto', 38000, 1, 'Alcohol antiséptico 350 ml', 2), ('farmacia-del-puerto', 38000, 2, 'Cepillo dental', 3),
    ('farmacia-del-puerto', 38000, 3, 'Apósitos adhesivos', 1),
    ('farmacia-del-puerto', 42000, 1, 'Alcohol antiséptico 350 ml', 2), ('farmacia-del-puerto', 42000, 2, 'Cepillo dental', 2),
    ('farmacia-del-puerto', 42000, 3, 'Apósitos adhesivos', 3),
    ('farmacia-del-puerto', 46000, 1, 'Protector solar SPF 50', 1), ('farmacia-del-puerto', 46000, 2, 'Cepillo dental', 1),
    ('farmacia-del-puerto', 46000, 3, 'Apósitos adhesivos', 1),
    ('farmacia-del-puerto', 50000, 1, 'Protector solar SPF 50', 1), ('farmacia-del-puerto', 50000, 2, 'Alcohol antiséptico 350 ml', 2),
    ('farmacia-del-puerto', 54000, 1, 'Protector solar SPF 50', 1), ('farmacia-del-puerto', 54000, 2, 'Acetaminofén 500 mg x 10', 2),
    ('farmacia-del-puerto', 54000, 3, 'Apósitos adhesivos', 2)
  ),
  pendientes as (
    select o.id, o.merchant_id, m.slug, o.items_subtotal
    from orders o join merchants m on m.id = o.merchant_id
    where not exists (select 1 from order_items i where i.order_id = o.id)
  )
  insert into order_items (order_id, product_id, name, unit_price, qty, options, total)
  select pe.id, p.id, p.name, p.price, r.qty,
    coalesce((select jsonb_build_array(jsonb_build_object('name', op.name, 'price_delta', op.price_delta))
              from product_option_groups g join product_options op on op.group_id = g.id
              where g.product_id = p.id and g.required and op.price_delta = 0
              order by g.sort, op.sort limit 1), '[]'::jsonb),
    p.price * r.qty
  from pendientes pe
  join receta r on r.slug = pe.slug and r.subtotal = pe.items_subtotal
  join products p on p.merchant_id = pe.merchant_id and p.name = r.producto
  order by pe.id, r.orden;

  -- Verificación: ningún pedido (salvo envíos) sin productos y todos con items_subtotal = suma de sus productos
  select count(*) into v_sin from orders o
   where o.type <> 'shipment' and not exists (select 1 from order_items i where i.order_id = o.id);
  if v_sin > 0 then raise exception 'Quedan % pedidos sin productos: revisa la receta', v_sin; end if;
  select count(*) into v_descuadre from orders o
   where o.type <> 'shipment' and o.items_subtotal <> (select coalesce(sum(i.total), 0) from order_items i where i.order_id = o.id);
  if v_descuadre > 0 then raise exception '% pedidos con items_subtotal distinto de la suma de sus productos', v_descuadre; end if;
end $$;

-- Liquidaciones pendientes (ejecutado como la owner para pasar la verificación de rol)
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', false);
select admin_generate_settlements((now() - interval '7 days')::date, (now() - interval '1 day')::date);
select set_config('request.jwt.claim.sub', '', false);

-- Caso de soporte (40: chat de María con soporte sobre un cobro de #1042; responde la owner).
-- El caso se abre 1 min después de la entrega y los mensajes van a +2, +3 y +4 min, en ese orden.
insert into support_cases (order_id, opened_by, opener_role, category, subject, description, status, priority, created_at)
select o.id, 'a0000000-0000-0000-0000-000000000001', 'customer', 'pago', 'Revisar un cobro', 'Necesito revisar un cobro del pedido #1042.', 'open', 'normal',
       o.delivered_at + interval '1 min'
from orders o where o.id = '90000000-0000-0000-0000-000000001042';
insert into support_messages (case_id, sender_id, body, internal, created_at)
select c.id, m.sender, m.body, false, o.delivered_at + m.despues
from support_cases c join orders o on o.id = c.order_id
cross join (values
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Hola, María. ¿En qué podemos ayudarte con tu pedido?', interval '2 min', 1),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Necesito revisar un cobro.', interval '3 min', 2),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Cuéntanos qué ocurrió para revisar el caso.', interval '4 min', 3)
) as m(sender, body, despues, orden)
where o.number = 1042 and c.opened_by = 'a0000000-0000-0000-0000-000000000001'
order by m.orden;

-- Gastos operativos
insert into operating_expenses (date, city_id, category, description, amount) values
 (current_date,'11111111-1111-1111-1111-111111111111','marketing','Pauta redes',150000),
 (current_date,'11111111-1111-1111-1111-111111111111','soporte','Turno de soporte',200000),
 (current_date,'22222222-2222-2222-2222-222222222222','operacion','Bonos repartidores',100000);

-- Alertas de dirección
insert into owner_alerts (severity, title, body, entity) values
 ('warning','6 comercios por revisar','Tienen documentos pendientes o calificaciones bajas.','merchants'),
 ('critical','Pago fallido recurrente','3 intentos fallidos con la pasarela en la última hora.','payments'),
 ('info','Liquidaciones listas','Hay liquidaciones pendientes de aprobación para el período anterior.','settlements');
