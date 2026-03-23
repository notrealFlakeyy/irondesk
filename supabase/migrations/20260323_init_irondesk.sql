create table if not exists public.products (
  sku text primary key,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  cat text not null check (cat in ('fasteners', 'electrical', 'plumbing', 'tools', 'paint', 'safety', 'lumber')),
  min_stock integer not null default 0 check (min_stock >= 0),
  supplier text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  email text not null,
  type text not null check (type in ('trade', 'retail')),
  total_spent numeric(12,2) not null default 0,
  last_purchase text not null default 'No purchases yet',
  balance numeric(12,2) not null default 0,
  credit_limit numeric(12,2),
  loyalty_points integer,
  terms text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suppliers (
  id text primary key,
  name text not null,
  category text not null,
  lead_days integer not null default 1 check (lead_days > 0),
  account text not null,
  skus integer not null default 0 check (skus >= 0),
  monthly_spend numeric(12,2) not null default 0,
  on_time_rate numeric(5,2) not null default 0 check (on_time_rate >= 0 and on_time_rate <= 100),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id text primary key,
  customer text not null,
  customer_id text references public.customers(id) on delete set null,
  date_label text not null,
  due_label text not null,
  status text not null check (status in ('ready', 'paid', 'pending', 'processing')),
  total numeric(12,2) not null default 0,
  deposit numeric(12,2),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  position integer not null,
  sku text not null,
  name text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  status text not null check (status in ('reserved', 'ready', 'backorder')),
  unique (order_id, position)
);

create table if not exists public.order_timeline_events (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  position integer not null,
  label text not null,
  time_text text not null default '',
  state text not null check (state in ('done', 'active', 'pending')),
  unique (order_id, position)
);

create table if not exists public.transactions (
  id text primary key,
  customer text not null,
  customer_id text references public.customers(id) on delete set null,
  items integer not null default 0 check (items >= 0),
  amount numeric(12,2) not null default 0,
  method text not null check (method in ('card', 'cash', 'invoice')),
  timestamp timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transaction_lines (
  id bigint generated always as identity primary key,
  transaction_id text not null references public.transactions(id) on delete cascade,
  position integer not null,
  sku text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0,
  cat text not null check (cat in ('fasteners', 'electrical', 'plumbing', 'tools', 'paint', 'safety', 'lumber')),
  min_stock integer not null default 0,
  supplier text,
  qty integer not null check (qty > 0),
  unique (transaction_id, position)
);

create table if not exists public.customer_purchases (
  id bigint generated always as identity primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  purchase_id text not null,
  date_label text not null,
  amount numeric(12,2) not null default 0,
  status text not null check (status in ('paid', 'invoice', 'processing')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, purchase_id)
);

create table if not exists public.app_settings (
  id text primary key default 'default',
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_timeline_events_order_id_idx on public.order_timeline_events (order_id);
create index if not exists transactions_timestamp_idx on public.transactions (timestamp desc);
create index if not exists transaction_lines_transaction_id_idx on public.transaction_lines (transaction_id);
create index if not exists customer_purchases_customer_id_idx on public.customer_purchases (customer_id);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_timeline_events enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_lines enable row level security;
alter table public.customer_purchases enable row level security;
alter table public.app_settings enable row level security;
