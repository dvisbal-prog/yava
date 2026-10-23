-- YAVA · Repartidores, liquidaciones, soporte, administración y auditoría

create table couriers (
  user_id uuid primary key references profiles(id) on delete cascade,
  city_id uuid references cities(id),
  vehicle vehicle_type not null default 'moto',
  plate text,
  document_number text,
  status courier_status not null default 'pending',
  is_online boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  last_seen_at timestamptz,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  deliveries_count integer not null default 0,
  balance integer not null default 0,
  bank_account jsonb,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index couriers_online_idx on couriers(city_id, is_online) where is_online;

create table courier_documents (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references couriers(user_id) on delete cascade,
  doc_type text not null, -- cedula, licencia, soat, tarjeta_propiedad, foto, antecedentes
  file_path text not null,
  status document_status not null default 'pending',
  notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table courier_location_history (
  id bigint generated always as identity primary key,
  courier_id uuid not null references couriers(user_id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);
create index courier_location_history_idx on courier_location_history(courier_id, recorded_at desc);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  payee_type payee_type not null,
  payee_id uuid not null, -- merchants.id o couriers.user_id
  period_start date not null,
  period_end date not null,
  orders_count integer not null default 0,
  gross integer not null default 0,
  commissions integer not null default 0,
  adjustments integer not null default 0,
  net integer not null default 0,
  status settlement_status not null default 'pending',
  bank_snapshot jsonb,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  approval_reason text,
  paid_by uuid references profiles(id),
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index settlements_payee_idx on settlements(payee_type, payee_id, status);

create table settlement_orders (
  settlement_id uuid not null references settlements(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount integer not null,
  primary key (settlement_id, order_id)
);

create table courier_withdrawals (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references couriers(user_id) on delete cascade,
  amount integer not null check (amount > 0),
  status settlement_status not null default 'pending',
  bank_snapshot jsonb,
  processed_by uuid references profiles(id),
  processed_at timestamptz,
  reference text,
  created_at timestamptz not null default now()
);

create table support_cases (
  id uuid primary key default gen_random_uuid(),
  number integer generated always as identity,
  order_id uuid references orders(id) on delete set null,
  opened_by uuid not null references profiles(id),
  opener_role app_role not null default 'customer',
  category text not null default 'otro',
  subject text not null,
  description text,
  status support_status not null default 'open',
  priority text not null default 'normal' check (priority in ('baja','normal','alta','urgente')),
  assigned_to uuid references profiles(id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_cases_status_idx on support_cases(status, created_at desc);

create table support_messages (
  id bigint generated always as identity primary key,
  case_id uuid not null references support_cases(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table admin_users (
  user_id uuid primary key references profiles(id) on delete cascade,
  role admin_role not null default 'operations',
  status text not null default 'active' check (status in ('invited','active','disabled')),
  invited_by uuid references profiles(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role admin_role not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  reason text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log(entity, entity_id, created_at desc);

create table platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, created_at desc);

create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios','android','web')),
  created_at timestamptz not null default now()
);

create table owner_alerts (
  id bigint generated always as identity primary key,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  title text not null,
  body text,
  entity text,
  entity_id text,
  acknowledged_by uuid references profiles(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table operating_expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  city_id uuid references cities(id),
  category text not null,
  description text,
  amount integer not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
