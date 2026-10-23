-- YAVA · Núcleo: ciudades, perfiles, direcciones, comercios y catálogo

-- Distancia en km entre dos coordenadas (fórmula de haversine). Evita depender de PostGIS.
create or replace function public.haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select case when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null else
    2 * 6371 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )) end
$$;

create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  department text,
  timezone text not null default 'America/Bogota',
  center_lat double precision,
  center_lng double precision,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_km numeric(6,2) not null default 6,
  base_delivery_fee integer not null default 3000,
  active boolean not null default true
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'customer',
  full_name text,
  phone text unique,
  email text,
  avatar_url text,
  city_id uuid references cities(id),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Casa',
  line1 text not null,
  line2 text,
  city_id uuid references cities(id),
  instructions text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on addresses(user_id);

create table merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  name text not null,
  slug text not null unique,
  category merchant_category not null default 'food',
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  city_id uuid references cities(id),
  address text,
  lat double precision,
  lng double precision,
  phone text,
  legal_name text,
  tax_id text,
  bank_account jsonb,
  status merchant_status not null default 'pending',
  accepts_orders boolean not null default true,
  manual_closed boolean not null default false,
  commission_rate numeric(5,4) not null default 0.1000,
  delivery_fee integer not null default 3000,
  min_order integer not null default 0,
  prep_min integer not null default 20,
  prep_max integer not null default 35,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  tags text[] not null default '{}',
  featured boolean not null default false,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index merchants_city_status_idx on merchants(city_id, status);
create index merchants_name_trgm_idx on merchants using gin (name gin_trgm_ops);

create table merchant_members (
  merchant_id uuid not null references merchants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  member_role text not null default 'owner',
  primary key (merchant_id, user_id)
);

create table merchant_hours (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens time not null,
  closes time not null,
  unique (merchant_id, weekday, opens)
);

create table merchant_documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  status document_status not null default 'pending',
  notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table product_categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  sort integer not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  category_id uuid references product_categories(id) on delete set null,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  image_urls text[] not null default '{}',
  status product_status not null default 'draft',
  track_stock boolean not null default false,
  stock integer,
  sort integer not null default 0,
  available_from time,
  available_to time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_merchant_idx on products(merchant_id, status);
create index products_name_trgm_idx on products using gin (name gin_trgm_ops);

create table product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  min_select integer not null default 0,
  max_select integer not null default 1,
  required boolean not null default false,
  sort integer not null default 0
);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references product_option_groups(id) on delete cascade,
  name text not null,
  price_delta integer not null default 0,
  available boolean not null default true,
  sort integer not null default 0
);

create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  merchant_id uuid not null references merchants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, merchant_id)
);

create table promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  merchant_id uuid references merchants(id) on delete cascade,
  city_id uuid references cities(id),
  coupon_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort integer not null default 0
);
