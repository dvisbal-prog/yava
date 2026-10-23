-- YAVA · Pedidos, pagos, cupones, calificaciones y chat

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  type coupon_type not null,
  value integer not null default 0,
  min_order integer not null default 0,
  max_uses integer,
  uses integer not null default 0,
  per_user_limit integer not null default 1,
  funded_by text not null default 'yava' check (funded_by in ('yava','merchant')),
  merchant_id uuid references merchants(id) on delete cascade,
  valid_from timestamptz,
  valid_to timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'wompi',
  provider_token text,
  method payment_method not null default 'card',
  brand text,
  last4 text,
  exp_month smallint,
  exp_year smallint,
  holder_name text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create sequence order_number_seq start 1042;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number integer not null default nextval('order_number_seq') unique,
  customer_id uuid not null references profiles(id),
  merchant_id uuid references merchants(id),
  courier_id uuid references profiles(id),
  city_id uuid references cities(id),
  type order_type not null default 'food',
  status order_status not null default 'placed',
  address_snapshot jsonb not null default '{}'::jsonb,
  delivery_lat double precision,
  delivery_lng double precision,
  pickup_snapshot jsonb,          -- para envíos: origen
  package_details jsonb,          -- para envíos: tamaño, descripción, destinatario
  items_subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  service_fee integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  coupon_id uuid references coupons(id),
  commission_rate numeric(5,4) not null default 0.1,
  commission_amount integer not null default 0,
  merchant_payout integer not null default 0,
  courier_payout integer not null default 0,
  gateway_fee integer not null default 0,
  payment_method payment_method not null default 'cash',
  payment_method_id uuid references payment_methods(id),
  payment_status payment_status not null default 'pending',
  notes text,
  delivery_code text not null default lpad((floor(random()*10000))::int::text, 4, '0'),
  eta_min integer,
  eta_max integer,
  placed_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id),
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id, placed_at desc);
create index orders_merchant_idx on orders(merchant_id, status, placed_at desc);
create index orders_courier_idx on orders(courier_id, status);
create index orders_status_idx on orders(status) where status not in ('delivered','cancelled');
create index orders_placed_idx on orders(placed_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  name text not null,
  unit_price integer not null,
  qty integer not null check (qty > 0),
  options jsonb not null default '[]'::jsonb,
  notes text,
  total integer not null
);
create index order_items_order_idx on order_items(order_id);

create table order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  actor_id uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events(order_id, created_at);

create table order_messages (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index order_messages_order_idx on order_messages(order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'wompi',
  provider_ref text,
  amount integer not null,
  currency text not null default 'COP',
  status payment_status not null default 'pending',
  gateway_fee integer not null default 0,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on payments(order_id);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade unique,
  customer_id uuid not null references profiles(id),
  merchant_id uuid references merchants(id),
  courier_id uuid references profiles(id),
  merchant_rating smallint check (merchant_rating between 1 and 5),
  courier_rating smallint check (courier_rating between 1 and 5),
  tags text[] not null default '{}',
  comment text,
  tip integer not null default 0,
  created_at timestamptz not null default now()
);

create table coupon_redemptions (
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coupon_id, order_id)
);
