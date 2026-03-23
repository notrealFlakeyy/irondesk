drop table if exists public.customer_purchases;
drop table if exists public.order_timeline_events;
drop table if exists public.order_items;
drop table if exists public.transaction_lines;
drop table if exists public.transactions;
drop table if exists public.orders;
drop table if exists public.products;
drop table if exists public.suppliers;
drop table if exists public.customers;
drop table if exists public.app_settings;

create table public.products (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  sku text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  cat text not null check (cat in ('fasteners', 'electrical', 'plumbing', 'tools', 'paint', 'safety', 'lumber')),
  min_stock integer not null default 0 check (min_stock >= 0),
  supplier text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, sku)
);

create table public.customers (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  email text not null,
  type text not null check (type in ('trade', 'retail')),
  total_spent numeric(12,2) not null default 0,
  last_purchase text not null default 'No purchases yet',
  balance numeric(12,2) not null default 0,
  credit_limit numeric(12,2),
  loyalty_points integer,
  terms text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.suppliers (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  category text not null,
  lead_days integer not null default 1 check (lead_days > 0),
  account text not null,
  skus integer not null default 0 check (skus >= 0),
  monthly_spend numeric(12,2) not null default 0,
  on_time_rate numeric(5,2) not null default 0 check (on_time_rate >= 0 and on_time_rate <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.orders (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  customer text not null,
  customer_id text,
  date_label text not null,
  due_label text not null,
  status text not null check (status in ('ready', 'paid', 'pending', 'processing')),
  total numeric(12,2) not null default 0,
  deposit numeric(12,2),
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.order_items (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  order_id text not null,
  position integer not null,
  sku text not null,
  name text not null,
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  status text not null check (status in ('reserved', 'ready', 'backorder')),
  unique (owner_id, order_id, position)
);

create table public.order_timeline_events (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  order_id text not null,
  position integer not null,
  label text not null,
  time_text text not null default '',
  state text not null check (state in ('done', 'active', 'pending')),
  unique (owner_id, order_id, position)
);

create table public.transactions (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  customer text not null,
  customer_id text,
  items integer not null default 0 check (items >= 0),
  amount numeric(12,2) not null default 0,
  method text not null check (method in ('card', 'cash', 'invoice')),
  timestamp timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.transaction_lines (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  transaction_id text not null,
  position integer not null,
  sku text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0,
  cat text not null check (cat in ('fasteners', 'electrical', 'plumbing', 'tools', 'paint', 'safety', 'lumber')),
  min_stock integer not null default 0,
  supplier text,
  qty integer not null check (qty > 0),
  unique (owner_id, transaction_id, position)
);

create table public.customer_purchases (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  customer_id text not null,
  purchase_id text not null,
  date_label text not null,
  amount numeric(12,2) not null default 0,
  status text not null check (status in ('paid', 'invoice', 'processing')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, customer_id, purchase_id)
);

create table public.app_settings (
  owner_id uuid primary key default auth.uid(),
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index products_owner_idx on public.products (owner_id);
create index customers_owner_idx on public.customers (owner_id);
create index suppliers_owner_idx on public.suppliers (owner_id);
create index orders_owner_idx on public.orders (owner_id);
create index order_items_owner_idx on public.order_items (owner_id);
create index order_timeline_owner_idx on public.order_timeline_events (owner_id);
create index transactions_owner_idx on public.transactions (owner_id);
create index transaction_lines_owner_idx on public.transaction_lines (owner_id);
create index customer_purchases_owner_idx on public.customer_purchases (owner_id);

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

create policy "products_select_own" on public.products for select to authenticated using (auth.uid() = owner_id);
create policy "products_insert_own" on public.products for insert to authenticated with check (auth.uid() = owner_id);
create policy "products_update_own" on public.products for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "products_delete_own" on public.products for delete to authenticated using (auth.uid() = owner_id);

create policy "customers_select_own" on public.customers for select to authenticated using (auth.uid() = owner_id);
create policy "customers_insert_own" on public.customers for insert to authenticated with check (auth.uid() = owner_id);
create policy "customers_update_own" on public.customers for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "customers_delete_own" on public.customers for delete to authenticated using (auth.uid() = owner_id);

create policy "suppliers_select_own" on public.suppliers for select to authenticated using (auth.uid() = owner_id);
create policy "suppliers_insert_own" on public.suppliers for insert to authenticated with check (auth.uid() = owner_id);
create policy "suppliers_update_own" on public.suppliers for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "suppliers_delete_own" on public.suppliers for delete to authenticated using (auth.uid() = owner_id);

create policy "orders_select_own" on public.orders for select to authenticated using (auth.uid() = owner_id);
create policy "orders_insert_own" on public.orders for insert to authenticated with check (auth.uid() = owner_id);
create policy "orders_update_own" on public.orders for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "orders_delete_own" on public.orders for delete to authenticated using (auth.uid() = owner_id);

create policy "order_items_select_own" on public.order_items for select to authenticated using (auth.uid() = owner_id);
create policy "order_items_insert_own" on public.order_items for insert to authenticated with check (auth.uid() = owner_id);
create policy "order_items_update_own" on public.order_items for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "order_items_delete_own" on public.order_items for delete to authenticated using (auth.uid() = owner_id);

create policy "order_timeline_select_own" on public.order_timeline_events for select to authenticated using (auth.uid() = owner_id);
create policy "order_timeline_insert_own" on public.order_timeline_events for insert to authenticated with check (auth.uid() = owner_id);
create policy "order_timeline_update_own" on public.order_timeline_events for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "order_timeline_delete_own" on public.order_timeline_events for delete to authenticated using (auth.uid() = owner_id);

create policy "transactions_select_own" on public.transactions for select to authenticated using (auth.uid() = owner_id);
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check (auth.uid() = owner_id);
create policy "transactions_update_own" on public.transactions for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "transactions_delete_own" on public.transactions for delete to authenticated using (auth.uid() = owner_id);

create policy "transaction_lines_select_own" on public.transaction_lines for select to authenticated using (auth.uid() = owner_id);
create policy "transaction_lines_insert_own" on public.transaction_lines for insert to authenticated with check (auth.uid() = owner_id);
create policy "transaction_lines_update_own" on public.transaction_lines for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "transaction_lines_delete_own" on public.transaction_lines for delete to authenticated using (auth.uid() = owner_id);

create policy "customer_purchases_select_own" on public.customer_purchases for select to authenticated using (auth.uid() = owner_id);
create policy "customer_purchases_insert_own" on public.customer_purchases for insert to authenticated with check (auth.uid() = owner_id);
create policy "customer_purchases_update_own" on public.customer_purchases for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "customer_purchases_delete_own" on public.customer_purchases for delete to authenticated using (auth.uid() = owner_id);

create policy "app_settings_select_own" on public.app_settings for select to authenticated using (auth.uid() = owner_id);
create policy "app_settings_insert_own" on public.app_settings for insert to authenticated with check (auth.uid() = owner_id);
create policy "app_settings_update_own" on public.app_settings for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "app_settings_delete_own" on public.app_settings for delete to authenticated using (auth.uid() = owner_id);
