-- YAVA · Datos de ejemplo (Puerto Colombia / Barranquilla) · COP
-- Usuarios demo (contraseña: yava2026):
--   cliente@yava.app · comercio@yava.app (Bocamar) · repartidor@yava.app · owner@yava.app · finanzas@yava.app
-- Comercios: Bocamar, Naranmiche y Amaras (comida), Mercado del Puerto y Tienda de la Costa (mercado),
-- Farmacia del Puerto y Bienestar Caribe (farmacia) y Arepas Doña Rosa (solicitud en revisión).
-- Home ("Tiendas cerca de ti" y "Cervezas y licores"): D1, Olímpica, Carulla y Oxxo (mercado). Promociones
-- patrocinadas de Bocamar, Naranmiche y Amaras con cupones que paga cada restaurante (0015).
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
 ('c0000000-0000-0000-0000-000000000008',null,'Bienestar Caribe','bienestar-caribe','pharmacy','Tu salud, más cerca','Droguería con domicilio en Puerto Colombia.','11111111-1111-1111-1111-111111111111','Calle 6 # 3-15, Puerto Colombia',10.9905,-74.9575,'+573001110014','active',0.08,3000,35,45,4.7,48,'{farmacia,salud}',false,null,null,null),
 -- Tiendas del Home ("Tiendas cerca de ti"): a 0,6–1,6 km de la Casa de María (Oxxo 0,62 · D1 0,88 · Olímpica 1,22 ·
 -- Carulla 1,55), así que en 25 siguen primero Mercado del Puerto (destacada) y Tienda de la Costa (a 0,1 km).
 -- Sin logo ni portada: el app dibuja un tile con el nombre (nunca el logo real de la cadena).
 ('c0000000-0000-0000-0000-000000000009',null,'D1','d1','market','Precios bajos todos los días','Tienda de descuento con lo básico para tu casa.','11111111-1111-1111-1111-111111111111','Calle 6 # 10-25, Puerto Colombia',10.9800,-74.9505,'+573001110015','active',0.10,3000,25,35,4.4,210,'{mercado,descuentos,despensa,cervezas}',false,null,null,null),
 ('c0000000-0000-0000-0000-000000000010',null,'Olímpica','olimpica','market','Supermercado','Mercado, aseo, licores y más.','11111111-1111-1111-1111-111111111111','Carrera 5 # 9-60, Puerto Colombia',10.9790,-74.9465,'+573001110016','active',0.10,3000,30,45,4.5,180,'{supermercado,mercado,licores}',false,null,null,null),
 ('c0000000-0000-0000-0000-000000000011',null,'Carulla','carulla','market','Supermercado gourmet','Frescos, vinos y productos gourmet.','11111111-1111-1111-1111-111111111111','Carrera 8 # 11-40, Puerto Colombia',10.9760,-74.9455,'+573001110017','active',0.10,3000,35,50,4.7,140,'{supermercado,gourmet,vinos}',false,null,null,null),
 ('c0000000-0000-0000-0000-000000000012',null,'Oxxo','oxxo','market','Tienda de conveniencia 24 horas','Bebidas, pasabocas y lo que te falte, a toda hora.','11111111-1111-1111-1111-111111111111','Calle 4 # 8-15, Puerto Colombia',10.9835,-74.9498,'+573001110018','active',0.10,3000,15,25,4.3,95,'{conveniencia,24 horas,bebidas}',false,null,null,null);

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

-- D1, Olímpica, Carulla y Oxxo (Home: "Tiendas cerca de ti" y "Cervezas y licores")
-- Categorías de mercado con los nombres de los chips de 25 y "Cervezas y licores" al final: al agregar un producto
-- de esa categoría el app pide confirmar la mayoría de edad.
-- sort sigue siendo único y global: mercado 11–21, después de Mercado del Puerto (1–7) y Tienda de la Costa (8–10), y
-- licores 114–121, al final de "Destacados" de la tienda (26) con la leyenda legal justo debajo (los licores nuevos
-- del catálogo ampliado van en 110–113). Mismos nombres que en las otras tiendas ("Lo esencial" no los repite), pero
-- con foto de estudio propia en product-images/<comercio>/ (leche-1l, arroz-1kg, aceite-vegetal-1l, banano-1kg,
-- tomate-1kg, mango-tommy): en estas cadenas el app prefiere esa foto al recorte del Drive (studioProductPhoto).
-- Licores: presentación entre paréntesis (el app la separa del nombre) y compare_at_price = precio antes del descuento.
-- Fotos de licores: genéricas y sin ninguna marca a la vista (lata plateada, botella ámbar sin etiqueta, botella
-- transparente sin etiqueta y botella de vino con etiqueta lisa).
-- "Cervezas y licores" lleva sort 9 para quedar de última también con las categorías del catálogo ampliado (abajo).
-- La de D1 se llama "Lácteos y huevos" (el chip "Lácteos" de 25 la sigue encontrando por la palabra "lácteo").
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000091','c0000000-0000-0000-0000-000000000009','Lácteos y huevos',1),
 ('d0000000-0000-0000-0000-000000000092','c0000000-0000-0000-0000-000000000009','Despensa',2),
 ('d0000000-0000-0000-0000-000000000093','c0000000-0000-0000-0000-000000000009','Cervezas y licores',9),
 ('d0000000-0000-0000-0000-000000000101','c0000000-0000-0000-0000-000000000010','Frutas',1),
 ('d0000000-0000-0000-0000-000000000102','c0000000-0000-0000-0000-000000000010','Verduras',2),
 ('d0000000-0000-0000-0000-000000000103','c0000000-0000-0000-0000-000000000010','Despensa',3),
 ('d0000000-0000-0000-0000-000000000104','c0000000-0000-0000-0000-000000000010','Cervezas y licores',9),
 ('d0000000-0000-0000-0000-000000000111','c0000000-0000-0000-0000-000000000011','Frutas',1),
 ('d0000000-0000-0000-0000-000000000112','c0000000-0000-0000-0000-000000000011','Lácteos',2),
 ('d0000000-0000-0000-0000-000000000113','c0000000-0000-0000-0000-000000000011','Despensa',3),
 ('d0000000-0000-0000-0000-000000000114','c0000000-0000-0000-0000-000000000011','Cervezas y licores',9),
 ('d0000000-0000-0000-0000-000000000121','c0000000-0000-0000-0000-000000000012','Lácteos',1),
 ('d0000000-0000-0000-0000-000000000122','c0000000-0000-0000-0000-000000000012','Despensa',2),
 ('d0000000-0000-0000-0000-000000000123','c0000000-0000-0000-0000-000000000012','Cervezas y licores',9);
insert into products (id, merchant_id, category_id, name, description, price, compare_at_price, image_urls, status, track_stock, stock, sort) values
 -- D1
 ('e0000000-0000-0000-0000-000000000091','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000091','Leche (1 L)','',3800,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/leche-1l.jpg}','published',true,60,11),
 ('e0000000-0000-0000-0000-000000000092','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Arroz (1 kg)','',4200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/arroz-1kg.jpg}','published',true,80,12),
 ('e0000000-0000-0000-0000-000000000093','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Aceite Premier 1 L','',13900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/aceite-vegetal-1l.jpg}','published',true,40,13),
 ('e0000000-0000-0000-0000-000000000094','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000093','Cerveza Costeña lata (6 x 330 ml)','Six pack de cerveza en lata.',13900,15900,'{https://images.unsplash.com/photo-1696739696220-8d2e27465662?w=800}','published',true,48,114),
 ('e0000000-0000-0000-0000-000000000095','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000093','Cerveza Poker lata (6 x 330 ml)','Six pack de cerveza en lata.',15500,null,'{https://images.unsplash.com/photo-1696739696220-8d2e27465662?w=800}','published',true,48,115),
 -- Olímpica
 ('e0000000-0000-0000-0000-000000000101','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000101','Banano (1 kg)','',4100,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/banano-1kg.jpg}','published',true,60,14),
 ('e0000000-0000-0000-0000-000000000102','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000102','Tomate (1 kg)','',5200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/tomate-1kg.jpg}','published',true,50,15),
 ('e0000000-0000-0000-0000-000000000103','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000103','Arroz (1 kg)','',4700,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/arroz-1kg.jpg}','published',true,80,16),
 ('e0000000-0000-0000-0000-000000000104','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000104','Club Colombia Dorada (6 x 330 ml)','Six pack de cerveza en botella.',21900,24500,'{https://images.unsplash.com/photo-1644085159285-5fd924740cb3?w=800}','published',true,36,116),
 ('e0000000-0000-0000-0000-000000000105','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000104','Aguardiente Antioqueño (750 ml)','Aguardiente tradicional colombiano.',54900,62000,'{https://images.unsplash.com/photo-1591704951890-0862b2e98acb?w=800}','published',true,24,117),
 -- Carulla
 ('e0000000-0000-0000-0000-000000000111','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000111','Mango Tommy (unidad)','Mango dulce de temporada.',4200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/mango-tommy.jpg}','published',true,30,17),
 ('e0000000-0000-0000-0000-000000000112','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000112','Leche (1 L)','',4900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/leche-1l.jpg}','published',true,40,18),
 ('e0000000-0000-0000-0000-000000000113','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000113','Aceite Premier 1 L','',15900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/aceite-vegetal-1l.jpg}','published',true,25,19),
 ('e0000000-0000-0000-0000-000000000114','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000114','Cerveza Corona (6 x 355 ml)','Six pack de cerveza en botella.',32900,null,'{https://images.unsplash.com/photo-1644085159285-5fd924740cb3?w=800}','published',true,30,118),
 ('e0000000-0000-0000-0000-000000000115','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000114','Vino tinto Casillero del Diablo (750 ml)','Vino tinto chileno.',59900,68900,'{https://images.unsplash.com/photo-1592119748016-a61c40a44320?w=800}','published',true,18,119),
 -- Oxxo
 ('e0000000-0000-0000-0000-000000000121','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000121','Leche (1 L)','',4900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/leche-1l.jpg}','published',true,30,20),
 ('e0000000-0000-0000-0000-000000000122','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000122','Arroz (1 kg)','',5200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/arroz-1kg.jpg}','published',true,30,21),
 ('e0000000-0000-0000-0000-000000000123','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000123','Cerveza Águila lata (6 x 330 ml)','Six pack de cerveza en lata.',16900,19900,'{https://images.unsplash.com/photo-1696739696220-8d2e27465662?w=800}','published',true,48,120),
 ('e0000000-0000-0000-0000-000000000124','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000123','Ron Medellín 3 años (750 ml)','Ron añejo colombiano.',48900,null,'{https://images.unsplash.com/photo-1591704951890-0862b2e98acb?w=800}','published',true,24,121);

-- Catálogo ampliado de D1, Olímpica, Carulla y Oxxo (tiendas de demo, 29 oct 2026): 59 productos genéricos (sin
-- marcas, salvo los licores de arriba) con la presentación entre paréntesis, en categorías propias de cada cadena:
-- D1 (descuento): Despensa, Lácteos y huevos, Aseo del hogar, Snacks y dulces.
-- Olímpica (supermercado): Frutas, Verduras, Carnes y pollo, Lácteos y huevos, Despensa, Bebidas.
-- Carulla (gourmet): Frutas, Quesos, Panadería, Delicatessen (con el jamón serrano y el salami) y dos vinos más en
-- "Cervezas y licores". La charcutería no va con los quesos: el chip "Lácteos" de 25 reconoce la palabra "queso".
-- Oxxo (conveniencia 24 h): Bebidas frías, Snacks, Comida lista, Hielo y básicos y dos cervezas más.
-- Ids fijos e0000000-…-0000000002NN (productos) y d0000000-…-0000000002NN (categorías), iguales en vivo.
-- sort ≥ 40, único en todo el catálogo: 40–60 productos de las categorías de los chips de 25 (Frutas, Verduras,
-- Lácteos, Despensa; así "Lo esencial", que trae los 60 primeros por sort, los alcanza), 70–103 el resto del mercado
-- (102–103 el jamón y el salami de Carulla) y 110–113 los licores. "Lo esencial" sigue empezando por Banano, Tomate y
-- Arroz de Mercado del Puerto (sort 1–3).
-- Fotos: bodegones de estudio generados con Higgsfield (fondo blanco, empaque sin texto ni logos), 800 × 800 en
-- product-images/<comercio>/<slug>.jpg, con el producto dentro del 66 % central del alto para que la tarjeta de 26
-- (que recorta arriba y abajo) no lo corte; las versiones reencuadradas o repetidas llevan "-v2". Ninguna coincide con
-- un recorte del diseño y en estas cadenas la foto de estudio gana siempre, así que el app usa image_urls.
-- Descuentos (compare_at_price) de 10 a 30 % en 3–4 productos por tienda.
insert into product_categories (id, merchant_id, name, sort) values
 ('d0000000-0000-0000-0000-000000000201','c0000000-0000-0000-0000-000000000009','Aseo del hogar',3),
 ('d0000000-0000-0000-0000-000000000202','c0000000-0000-0000-0000-000000000009','Snacks y dulces',4),
 ('d0000000-0000-0000-0000-000000000211','c0000000-0000-0000-0000-000000000010','Carnes y pollo',4),
 ('d0000000-0000-0000-0000-000000000212','c0000000-0000-0000-0000-000000000010','Lácteos y huevos',5),
 ('d0000000-0000-0000-0000-000000000213','c0000000-0000-0000-0000-000000000010','Bebidas',6),
 ('d0000000-0000-0000-0000-000000000221','c0000000-0000-0000-0000-000000000011','Quesos',4),
 ('d0000000-0000-0000-0000-000000000222','c0000000-0000-0000-0000-000000000011','Panadería',5),
 ('d0000000-0000-0000-0000-000000000223','c0000000-0000-0000-0000-000000000011','Delicatessen',6),
 ('d0000000-0000-0000-0000-000000000231','c0000000-0000-0000-0000-000000000012','Bebidas frías',3),
 ('d0000000-0000-0000-0000-000000000232','c0000000-0000-0000-0000-000000000012','Snacks',4),
 ('d0000000-0000-0000-0000-000000000233','c0000000-0000-0000-0000-000000000012','Comida lista',5),
 ('d0000000-0000-0000-0000-000000000234','c0000000-0000-0000-0000-000000000012','Hielo y básicos',6);
insert into products (id, merchant_id, category_id, name, description, price, compare_at_price, image_urls, status, track_stock, stock, sort) values
 -- D1
 ('e0000000-0000-0000-0000-000000000201','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Azúcar blanca (1 kg)','Azúcar refinada para el café y los postres.',4300,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/azucar-blanca-v2.jpg}','published',true,90,40),
 ('e0000000-0000-0000-0000-000000000202','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Pasta espagueti (500 g)','Pasta de trigo, lista en 10 minutos.',2900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/pasta-espagueti.jpg}','published',true,120,41),
 ('e0000000-0000-0000-0000-000000000203','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Lentejas (500 g)','Lentejas secas seleccionadas.',3900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/lentejas-v2.jpg}','published',true,70,42),
 ('e0000000-0000-0000-0000-000000000204','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000092','Atún en aceite (160 g)','Lomitos de atún en aceite vegetal.',5200,6500,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/atun-en-aceite.jpg}','published',true,60,43),
 ('e0000000-0000-0000-0000-000000000205','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000091','Huevos AA (30 und)','Huevos rojos tamaño AA en cubeta de 30.',16900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/huevos-aa-30-v2.jpg}','published',true,40,44),
 ('e0000000-0000-0000-0000-000000000206','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000091','Queso costeño (500 g)','Queso blanco salado, típico de la costa.',11900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/queso-costeno.jpg}','published',true,35,45),
 ('e0000000-0000-0000-0000-000000000207','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000091','Yogur de fresa (1 L)','Yogur bebible sabor a fresa.',5900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/yogur-fresa-v2.jpg}','published',true,45,46),
 ('e0000000-0000-0000-0000-000000000208','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000201','Detergente en polvo (1 kg)','Para ropa blanca y de color.',8900,10900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/detergente-polvo-v2.jpg}','published',true,50,70),
 ('e0000000-0000-0000-0000-000000000209','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000201','Lavaloza en crema (500 g)','Arranca la grasa de ollas y platos.',4500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/lavaloza-crema.jpg}','published',true,60,71),
 ('e0000000-0000-0000-0000-000000000210','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000201','Papel higiénico (12 rollos)','Doble hoja, suave y resistente.',16900,19900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/papel-higienico-v2.jpg}','published',true,40,72),
 ('e0000000-0000-0000-0000-000000000211','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000201','Blanqueador (1 L)','Desinfecta y blanquea, con cloro.',3200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/blanqueador-v2.jpg}','published',true,70,73),
 ('e0000000-0000-0000-0000-000000000212','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000202','Papas fritas (150 g)','Papas fritas clásicas con sal.',4500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/papas-fritas-v2.jpg}','published',true,80,74),
 ('e0000000-0000-0000-0000-000000000213','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000202','Galletas de soda (9 paquetes)','Galletas saladas en paquetes individuales.',4900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/galletas-soda-v2.jpg}','published',true,60,75),
 ('e0000000-0000-0000-0000-000000000214','c0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000202','Gomitas surtidas (100 g)','Gomitas de frutas surtidas.',2500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000009/gomitas-v2.jpg}','published',true,90,76),
 -- Olímpica
 ('e0000000-0000-0000-0000-000000000221','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000101','Papaya (unidad)','Papaya madura de 1,5 kg aprox.',5900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/papaya-v2.jpg}','published',true,25,47),
 ('e0000000-0000-0000-0000-000000000222','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000101','Piña (unidad)','Piña dulce, lista para picar.',5500,6900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/pina-v2.jpg}','published',true,30,48),
 ('e0000000-0000-0000-0000-000000000223','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000101','Limón Tahití (1 kg)','Limón jugoso y sin semillas.',4800,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/limon-tahiti.jpg}','published',true,40,49),
 ('e0000000-0000-0000-0000-000000000224','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000102','Yuca (1 kg)','Yuca fresca para sancocho o frita.',3200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/yuca.jpg}','published',true,40,50),
 ('e0000000-0000-0000-0000-000000000225','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000212','Huevos rojos AA (15 und)','Huevos rojos tamaño AA.',9400,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/huevos-rojos-15.jpg}','published',true,40,51),
 ('e0000000-0000-0000-0000-000000000226','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000212','Suero costeño (400 g)','Suero atollabuey para la arepa y el bollo.',7900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/suero-costeno.jpg}','published',true,30,52),
 ('e0000000-0000-0000-0000-000000000227','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000212','Mantequilla con sal (250 g)','Mantequilla de leche de vaca.',8900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/mantequilla.jpg}','published',true,30,53),
 ('e0000000-0000-0000-0000-000000000228','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000103','Café molido (500 g)','Café colombiano tostado y molido.',19900,23900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/cafe-molido-v2.jpg}','published',true,35,54),
 ('e0000000-0000-0000-0000-000000000229','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000103','Harina de maíz (1 kg)','Harina de maíz precocida, para arepas suaves.',4900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/harina-maiz-v2.jpg}','published',true,50,55),
 ('e0000000-0000-0000-0000-000000000230','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000211','Pechuga de pollo (1 kg)','Pechuga fresca, sin hueso y sin piel.',17900,21900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/pechuga-pollo.jpg}','published',true,25,77),
 ('e0000000-0000-0000-0000-000000000231','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000211','Carne molida de res (500 g)','Carne de res molida, 90 % magra.',13900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/carne-molida.jpg}','published',true,25,78),
 ('e0000000-0000-0000-0000-000000000232','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000211','Chuleta de cerdo (1 kg)','Chuletas frescas con hueso.',22900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/chuleta-cerdo.jpg}','published',true,20,79),
 ('e0000000-0000-0000-0000-000000000233','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000213','Agua sin gas (6 x 600 ml)','Seis botellas de agua potable.',8900,10900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/agua-six-pack-v2.jpg}','published',true,40,80),
 ('e0000000-0000-0000-0000-000000000234','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000213','Jugo de naranja (1 L)','Jugo de naranja sin azúcar añadida.',6900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/jugo-naranja-v2.jpg}','published',true,35,81),
 ('e0000000-0000-0000-0000-000000000235','c0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000213','Gaseosa cola (1,5 L)','Bebida gaseosa sabor a cola.',5900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000010/gaseosa-cola-v2.jpg}','published',true,50,82),
 -- Carulla
 ('e0000000-0000-0000-0000-000000000241','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000111','Fresas (500 g)','Fresas frescas, dulces y firmes.',9900,12900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/fresas-v2.jpg}','published',true,25,56),
 ('e0000000-0000-0000-0000-000000000242','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000111','Arándanos (125 g)','Arándanos frescos en canastilla.',11900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/arandanos.jpg}','published',true,20,57),
 ('e0000000-0000-0000-0000-000000000243','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000111','Aguacate Hass (3 und)','Aguacates Hass en su punto.',10900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/aguacate-hass.jpg}','published',true,25,58),
 ('e0000000-0000-0000-0000-000000000244','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000221','Queso parmesano (200 g)','Queso madurado, ideal para rallar.',26900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/queso-parmesano.jpg}','published',true,15,59),
 ('e0000000-0000-0000-0000-000000000245','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000221','Mozzarella fresca (250 g)','Mozzarella fresca en suero.',14900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/mozzarella.jpg}','published',true,20,60),
 ('e0000000-0000-0000-0000-000000000246','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000223','Jamón serrano (100 g)','Lonjas finas de jamón curado.',21900,26900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/jamon-serrano.jpg}','published',true,15,102),
 ('e0000000-0000-0000-0000-000000000247','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000223','Salami italiano (100 g)','Salami curado en lonjas.',14900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/salami.jpg}','published',true,15,103),
 ('e0000000-0000-0000-0000-000000000248','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000222','Pan de masa madre (600 g)','Pan artesanal de fermentación lenta.',14900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/pan-masa-madre.jpg}','published',true,15,83),
 ('e0000000-0000-0000-0000-000000000249','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000222','Croissants (4 und)','Croissants de mantequilla, horneados del día.',13900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/croissants.jpg}','published',true,15,84),
 ('e0000000-0000-0000-0000-000000000250','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000222','Baguette (unidad)','Baguette crujiente horneada en tienda.',6900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/baguette.jpg}','published',true,20,85),
 ('e0000000-0000-0000-0000-000000000251','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000223','Aceite de oliva (500 ml)','Extra virgen, de primera prensada en frío.',39900,46900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/aceite-oliva-v2.jpg}','published',true,15,86),
 ('e0000000-0000-0000-0000-000000000252','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000223','Pasta artesanal (500 g)','Pasta corta de sémola de trigo, secada lentamente.',15900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/pasta-artesanal-v2.jpg}','published',true,20,87),
 ('e0000000-0000-0000-0000-000000000253','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000223','Pesto genovés (190 g)','Salsa de albahaca, queso y piñones.',17900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/pesto.jpg}','published',true,15,88),
 ('e0000000-0000-0000-0000-000000000254','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000114','Vino blanco (750 ml)','Sauvignon Blanc seco y fresco.',54900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/vino-blanco-v2.jpg}','published',true,18,110),
 ('e0000000-0000-0000-0000-000000000255','c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000114','Vino tinto Malbec (750 ml)','Vino tinto de cuerpo medio.',69900,79900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000011/vino-malbec-v2.jpg}','published',true,18,111),
 -- Oxxo
 ('e0000000-0000-0000-0000-000000000261','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000231','Agua sin gas (600 ml)','Botella de agua fría.',2500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/agua-600-v2.jpg}','published',true,60,89),
 ('e0000000-0000-0000-0000-000000000262','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000231','Bebida energética (473 ml)','Lata de bebida energética.',6500,7900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/bebida-energetica-v2.jpg}','published',true,40,90),
 ('e0000000-0000-0000-0000-000000000263','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000231','Té frío de limón (500 ml)','Té negro frío con limón.',3900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/te-frio-limon-v2.jpg}','published',true,40,91),
 ('e0000000-0000-0000-0000-000000000264','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000232','Maní con sal (100 g)','Maní tostado y salado.',3500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/mani-sal-v2.jpg}','published',true,50,92),
 ('e0000000-0000-0000-0000-000000000265','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000232','Chocolatina con leche (40 g)','Barra de chocolate con leche.',2900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/chocolatina-v2.jpg}','published',true,60,93),
 ('e0000000-0000-0000-0000-000000000266','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000232','Galletas con chips (8 und)','Galletas horneadas con chips de chocolate.',4200,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/galletas-chips-v2.jpg}','published',true,40,94),
 ('e0000000-0000-0000-0000-000000000267','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000233','Sándwich de jamón (unidad)','Pan blanco con jamón y queso, se calienta en tienda.',9900,11900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/sandwich-jamon-queso-v2.jpg}','published',true,20,95),
 ('e0000000-0000-0000-0000-000000000268','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000233','Empanada de carne (unidad)','Empanada frita de carne y papa.',3500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/empanada-carne.jpg}','published',true,30,96),
 ('e0000000-0000-0000-0000-000000000269','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000233','Perro caliente (unidad)','Pan, salchicha y salsas.',7900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/perro-caliente.jpg}','published',true,20,97),
 ('e0000000-0000-0000-0000-000000000270','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000233','Café americano (12 oz)','Café recién preparado.',3900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/cafe-americano.jpg}','published',true,50,98),
 ('e0000000-0000-0000-0000-000000000271','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000234','Bolsa de hielo (2 kg)','Hielo en cubos para la nevera.',3500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/bolsa-hielo-v2.jpg}','published',true,40,99),
 ('e0000000-0000-0000-0000-000000000272','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000234','Pilas AA (4 und)','Pilas alcalinas AA.',9900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/pilas-aa.jpg}','published',true,30,100),
 ('e0000000-0000-0000-0000-000000000273','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000234','Vasos desechables (25 und)','Vasos plásticos de 7 oz.',3900,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/vasos-desechables-v2.jpg}','published',true,40,101),
 ('e0000000-0000-0000-0000-000000000274','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000123','Cerveza rubia lata (473 ml)','Lata grande de cerveza rubia.',4500,null,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/cerveza-rubia-lata-v2.jpg}','published',true,72,112),
 ('e0000000-0000-0000-0000-000000000275','c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000123','Cerveza negra (6 x 330 ml)','Seis botellas de cerveza negra.',21900,24900,'{https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/c0000000-0000-0000-0000-000000000012/cerveza-negra-v2.jpg}','published',true,30,113);

-- Verificación del catálogo ampliado
do $$
declare
  v_n integer;
  v_ids uuid[];
  v_names text[];
  v_new uuid[] := array['e0000000-0000-0000-0000-000000000201'::uuid,'e0000000-0000-0000-0000-000000000202'::uuid,'e0000000-0000-0000-0000-000000000203'::uuid,'e0000000-0000-0000-0000-000000000204'::uuid,'e0000000-0000-0000-0000-000000000205'::uuid,'e0000000-0000-0000-0000-000000000206'::uuid,'e0000000-0000-0000-0000-000000000207'::uuid,'e0000000-0000-0000-0000-000000000221'::uuid,'e0000000-0000-0000-0000-000000000222'::uuid,'e0000000-0000-0000-0000-000000000223'::uuid,'e0000000-0000-0000-0000-000000000224'::uuid,'e0000000-0000-0000-0000-000000000225'::uuid,'e0000000-0000-0000-0000-000000000226'::uuid,'e0000000-0000-0000-0000-000000000227'::uuid,'e0000000-0000-0000-0000-000000000228'::uuid,'e0000000-0000-0000-0000-000000000229'::uuid,'e0000000-0000-0000-0000-000000000241'::uuid,'e0000000-0000-0000-0000-000000000242'::uuid,'e0000000-0000-0000-0000-000000000243'::uuid,'e0000000-0000-0000-0000-000000000244'::uuid,'e0000000-0000-0000-0000-000000000245'::uuid,'e0000000-0000-0000-0000-000000000246'::uuid,'e0000000-0000-0000-0000-000000000247'::uuid,'e0000000-0000-0000-0000-000000000208'::uuid,'e0000000-0000-0000-0000-000000000209'::uuid,'e0000000-0000-0000-0000-000000000210'::uuid,'e0000000-0000-0000-0000-000000000211'::uuid,'e0000000-0000-0000-0000-000000000212'::uuid,'e0000000-0000-0000-0000-000000000213'::uuid,'e0000000-0000-0000-0000-000000000214'::uuid,'e0000000-0000-0000-0000-000000000230'::uuid,'e0000000-0000-0000-0000-000000000231'::uuid,'e0000000-0000-0000-0000-000000000232'::uuid,'e0000000-0000-0000-0000-000000000233'::uuid,'e0000000-0000-0000-0000-000000000234'::uuid,'e0000000-0000-0000-0000-000000000235'::uuid,'e0000000-0000-0000-0000-000000000248'::uuid,'e0000000-0000-0000-0000-000000000249'::uuid,'e0000000-0000-0000-0000-000000000250'::uuid,'e0000000-0000-0000-0000-000000000251'::uuid,'e0000000-0000-0000-0000-000000000252'::uuid,'e0000000-0000-0000-0000-000000000253'::uuid,'e0000000-0000-0000-0000-000000000261'::uuid,'e0000000-0000-0000-0000-000000000262'::uuid,'e0000000-0000-0000-0000-000000000263'::uuid,'e0000000-0000-0000-0000-000000000264'::uuid,'e0000000-0000-0000-0000-000000000265'::uuid,'e0000000-0000-0000-0000-000000000266'::uuid,'e0000000-0000-0000-0000-000000000267'::uuid,'e0000000-0000-0000-0000-000000000268'::uuid,'e0000000-0000-0000-0000-000000000269'::uuid,'e0000000-0000-0000-0000-000000000270'::uuid,'e0000000-0000-0000-0000-000000000271'::uuid,'e0000000-0000-0000-0000-000000000272'::uuid,'e0000000-0000-0000-0000-000000000273'::uuid,'e0000000-0000-0000-0000-000000000254'::uuid,'e0000000-0000-0000-0000-000000000255'::uuid,'e0000000-0000-0000-0000-000000000274'::uuid,'e0000000-0000-0000-0000-000000000275'::uuid];
  v_chains uuid[] := array['c0000000-0000-0000-0000-000000000009'::uuid,'c0000000-0000-0000-0000-000000000010'::uuid,'c0000000-0000-0000-0000-000000000011'::uuid,'c0000000-0000-0000-0000-000000000012'::uuid];
begin
  -- Cada cadena tiene su catálogo nuevo completo (D1 14, Olímpica 15, Carulla 15, Oxxo 15)
  select count(*) into v_n from products where id = any(v_new) and status = 'published' and track_stock and stock > 0;
  if v_n <> 59 then raise exception 'Productos nuevos publicados con stock: % (se esperaban 59)', v_n; end if;
  select count(*) into v_n from products p join product_categories c on c.id = p.category_id
   where p.id = any(v_new) and c.merchant_id = p.merchant_id and p.merchant_id = any(v_chains)
     and p.name ~ '\(.+\)$' and p.sort >= 40 and p.price % 100 = 0
     and array_length(p.image_urls, 1) = 1
     and p.image_urls[1] = 'https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/' || p.merchant_id || '/' || substring(p.image_urls[1] from '[^/]+$')
     and p.image_urls[1] ~ '/[a-z0-9-]+\.jpg$';
  if v_n <> 59 then raise exception 'Productos nuevos con categoría, presentación, sort, precio o foto inválidos: % de 59', v_n; end if;
  -- Cada foto es distinta y el sort no se repite en todo el catálogo
  select count(distinct image_urls[1]) into v_n from products where id = any(v_new);
  if v_n <> 59 then raise exception 'Fotos repetidas en los productos nuevos'; end if;
  if exists (select sort from products where merchant_id = any(v_chains) group by sort having count(*) > 1) then
    raise exception 'Hay valores de sort repetidos en las cadenas';
  end if;
  -- Descuentos: entre 2 y 4 por tienda, del 10 al 30 %
  select count(*) into v_n from (select p.merchant_id from products p where p.id = any(v_new) and p.compare_at_price is not null
     group by p.merchant_id having count(*) between 2 and 4 and bool_and((p.compare_at_price - p.price)::numeric / p.compare_at_price between 0.10 and 0.30)) t;
  if v_n <> 4 then raise exception 'Descuentos fuera de rango en % de 4 tiendas', 4 - v_n; end if;
  -- Licores solo en la categoría de licores (is_alcohol) y ningún producto de mercado con nombre de licor
  if exists (select 1 from products p join product_categories c on c.id = p.category_id
              where p.id = any(v_new) and (c.is_alcohol <> is_alcohol_name(p.name))) then
    raise exception 'Hay un licor fuera de "Cervezas y licores" o un producto de mercado dentro';
  end if;
  -- "Cervezas y licores" queda de última en cada cadena
  select count(*) into v_n from product_categories c
   where c.merchant_id = any(v_chains) and c.is_alcohol and c.name = 'Cervezas y licores'
     and c.sort > (select max(c2.sort) from product_categories c2 where c2.merchant_id = c.merchant_id and not c2.is_alcohol);
  if v_n <> 4 then raise exception '"Cervezas y licores" no es la última categoría en % cadenas', 4 - v_n; end if;
  -- En "Destacados" (26, orden por sort) los licores van al final de cada cadena, justo encima de la leyenda legal
  if exists (select 1 from products p join product_categories c on c.id = p.category_id
              where p.merchant_id = any(v_chains) and c.is_alcohol
                and p.sort < (select max(p2.sort) from products p2 join product_categories c2 on c2.id = p2.category_id
                               where p2.merchant_id = p.merchant_id and not c2.is_alcohol)) then
    raise exception 'Hay licores antes que productos de mercado en "Destacados" de una cadena';
  end if;
  -- El chip "Lácteos" de 25 (palabras lacteo, leche, queso, yogur) no encuentra charcutería
  if exists (select 1 from products p join product_categories c on c.id = p.category_id
              where p.merchant_id = any(v_chains)
                and lower(translate(c.name, 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) ~ '(lacteo|leche|queso|yogur)'
                and lower(translate(p.name, 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) ~ '(jamon|salami|salchichon|chorizo)') then
    raise exception 'Hay charcutería en una categoría que el chip "Lácteos" reconoce';
  end if;
  -- Leche, arroz, aceite, banano, tomate y mango de las cadenas: foto de estudio propia (no el recorte del Drive)
  select count(*) into v_n from products p
   where p.id in ('e0000000-0000-0000-0000-000000000091','e0000000-0000-0000-0000-000000000092','e0000000-0000-0000-0000-000000000093',
                  'e0000000-0000-0000-0000-000000000101','e0000000-0000-0000-0000-000000000102','e0000000-0000-0000-0000-000000000103',
                  'e0000000-0000-0000-0000-000000000111','e0000000-0000-0000-0000-000000000112','e0000000-0000-0000-0000-000000000113',
                  'e0000000-0000-0000-0000-000000000121','e0000000-0000-0000-0000-000000000122')
     and p.image_urls[1] like 'https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/product-images/' || p.merchant_id || '/%.jpg';
  if v_n <> 11 then raise exception 'Productos básicos de las cadenas sin foto de estudio propia: % de 11', 11 - v_n; end if;
  -- Tiendas cercanas: siguen primero Mercado del Puerto y Tienda de la Costa
  select array_agg(t.id order by t.ordinality) into v_ids from nearby_merchants(10.9871, -74.9541, 'market') with ordinality t;
  if v_ids[1] <> 'c0000000-0000-0000-0000-000000000004' or v_ids[2] <> 'c0000000-0000-0000-0000-000000000007' or array_length(v_ids, 1) <> 6 then
    raise exception 'Orden de tiendas cercanas inesperado: %', v_ids;
  end if;
  -- "Lo esencial" (25) trae los 60 primeros por sort de esas tiendas y empieza por la más cercana: Banano, Tomate, Arroz
  select array_agg(t.name order by t.sort, t.name) into v_names
    from (select p.name, p.sort, p.merchant_id from products p where p.merchant_id = any(v_ids) and p.status = 'published'
           order by p.sort, p.name limit 60) t
   where t.merchant_id = 'c0000000-0000-0000-0000-000000000004';
  if v_names[1:3] is distinct from array['Banano (1 kg)','Tomate (1 kg)','Arroz (1 kg)'] then
    raise exception '"Lo esencial" ya no empieza por Banano, Tomate y Arroz: %', v_names;
  end if;
end $$;

-- Cupones y promociones
insert into coupons (code, description, type, value, min_order, max_uses, per_user_limit, funded_by, valid_to) values
 ('BIENVENIDO','20 % en tu primer pedido','percent',20,20000,1000,1,'yava', now() + interval '90 days'),
 ('ENVIOGRATIS','Envío gratis','free_delivery',0,25000,500,3,'yava', now() + interval '30 days'),
 ('COSTA5','$5.000 de descuento','fixed',5000,30000,null,5,'yava', now() + interval '60 days');

insert into promotions (title, subtitle, image_url, merchant_id, coupon_code, sort) values
 ('El sabor de la costa','Descubre tus favoritos','https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=1200','c0000000-0000-0000-0000-000000000001',null,1),
 ('20 % en tu primer pedido','Usa el código BIENVENIDO','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200',null,'BIENVENIDO',2),
 ('Envío gratis en Mercado','Pedidos desde $25.000 con ENVIOGRATIS','https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200','c0000000-0000-0000-0000-000000000004','ENVIOGRATIS',3);

-- Cupones que paga cada restaurante (funded_by 'merchant'): place_order solo los acepta en pedidos de ese comercio y
-- descuenta el cupón de su pago. El mínimo es el precio "Antes" del combo de su promoción.
-- Vigencia fija: los flyers imprimen "Válido hasta el 27/01/2027", así que el cupón y su promoción valen hasta ese día
-- a las 23:59:59 (hora de Colombia). Si cambia la fecha, hay que volver a renderizar los flyers (YAVA/flyers).
insert into coupons (code, description, type, value, min_order, max_uses, per_user_limit, funded_by, merchant_id, valid_to) values
 ('BOCAMAR5','$5.000 de descuento en Bocamar','fixed',5000,34000,null,2,'merchant','c0000000-0000-0000-0000-000000000001', '2027-01-27 23:59:59-05'),
 ('NARAN20','20 % de descuento en Naranmiche','percent',20,26000,null,1,'merchant','c0000000-0000-0000-0000-000000000002', '2027-01-27 23:59:59-05'),
 ('AMARAS2X','$8.000 de descuento en Amaras','fixed',8000,44000,null,2,'merchant','c0000000-0000-0000-0000-000000000003', '2027-01-27 23:59:59-05');

-- Promociones patrocinadas (carrusel "Promociones" del Home, con la etiqueta "Patrocinado"). El banner (08) y Ofertas
-- (33) no las muestran. sort 11–13 las deja después de las demás. image_url es el respaldo: el app usa el flyer local.
insert into promotions (title, subtitle, image_url, merchant_id, coupon_code, ends_at, active, sponsored, sort) values
 ('Combo ceviche + limonada','Ceviche clásico + Limonada natural · Antes $34.000 · Hoy $29.000 con BOCAMAR5','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000001/flyer.jpg','c0000000-0000-0000-0000-000000000001','BOCAMAR5', '2027-01-27 23:59:59-05', true, true, 11),
 ('Combo hamburguesa + papas','Antes $26.000 · Hoy $20.800 con NARAN20','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000002/flyer.jpg','c0000000-0000-0000-0000-000000000002','NARAN20', '2027-01-27 23:59:59-05', true, true, 12),
 ('2 shawarmas de pollo','Antes $44.000 · Hoy $36.000 con AMARAS2X','https://dgebycmouxjfuwtnhxmu.supabase.co/storage/v1/object/public/merchant-media/c0000000-0000-0000-0000-000000000003/flyer.jpg','c0000000-0000-0000-0000-000000000003','AMARAS2X', '2027-01-27 23:59:59-05', true, true, 13);

-- Verificación de 0015: tiendas nuevas con horario y al menos 2 licores (Carulla y Oxxo tienen 4 con el catálogo
-- ampliado; categoría marcada is_alcohol por el disparador),
-- precios "antes" mayores que el actual, en 25 siguen primero Mercado del Puerto y Tienda de la Costa, y cada
-- promoción patrocinada lleva el cupón de su comercio.
do $$
declare v_n integer; v_ids uuid[];
begin
  select count(*) into v_n from merchants m
   where m.id in ('c0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000012')
     and (select count(*) from merchant_hours h where h.merchant_id = m.id) = 7
     and (select count(*) from products p join product_categories c on c.id = p.category_id
           where p.merchant_id = m.id and c.name = 'Cervezas y licores' and c.is_alcohol and p.status = 'published' and p.name ~ '\(.+\)$') >= 2
     and haversine_km(10.9871, -74.9541, m.lat, m.lng) between 0.6 and 1.6;
  if v_n <> 4 then raise exception 'Solo % de 4 tiendas nuevas tienen horario, 2 o más licores y están a 0,6–1,6 km de María', v_n; end if;
  if exists (select 1 from products where compare_at_price is not null and compare_at_price <= price) then
    raise exception 'Hay productos con precio antes menor o igual al actual';
  end if;
  select array_agg(t.id order by t.ordinality) into v_ids from nearby_merchants(10.9871, -74.9541, 'market') with ordinality t;
  if v_ids[1] <> 'c0000000-0000-0000-0000-000000000004' or v_ids[2] <> 'c0000000-0000-0000-0000-000000000007' or array_length(v_ids, 1) <> 6 then
    raise exception 'Orden de tiendas cercanas inesperado: %', v_ids;
  end if;
  select count(*) into v_n from coupons c join promotions p on p.coupon_code = c.code and p.merchant_id = c.merchant_id
   where p.sponsored and p.active and c.funded_by = 'merchant';
  if v_n <> 3 then raise exception 'Promociones patrocinadas con el cupón de su comercio: % (se esperaban 3)', v_n; end if;
end $$;

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
