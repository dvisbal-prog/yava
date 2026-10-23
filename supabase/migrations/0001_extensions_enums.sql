-- YAVA · Extensiones y tipos enumerados
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type app_role as enum ('customer','merchant','courier','admin');
create type admin_role as enum ('owner','finance','operations','support');
create type merchant_category as enum ('food','market','pharmacy');
create type order_type as enum ('food','market','pharmacy','shipment');
create type order_status as enum (
  'pending_payment','placed','accepted','preparing','ready',
  'assigned','picked_up','on_the_way','delivered','cancelled'
);
create type payment_method as enum ('cash','card','pse','nequi','daviplata');
create type payment_status as enum ('pending','authorized','paid','failed','refunded');
create type merchant_status as enum ('pending','under_review','active','paused','rejected','suspended');
create type courier_status as enum ('pending','under_review','active','suspended');
create type product_status as enum ('draft','published','paused');
create type document_status as enum ('pending','approved','rejected');
create type settlement_status as enum ('pending','approved','paid','rejected');
create type payee_type as enum ('merchant','courier');
create type support_status as enum ('open','in_progress','resolved','closed');
create type coupon_type as enum ('percent','fixed','free_delivery');
create type vehicle_type as enum ('moto','bicicleta','carro','a_pie');
