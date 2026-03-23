create table if not exists public.purchase_orders (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  supplier_id text not null,
  supplier_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expected_date text not null,
  status text not null check (status in ('draft', 'sent', 'received')),
  total numeric(12,2) not null default 0,
  item_count integer not null default 0,
  unique (owner_id, id)
);

create table if not exists public.purchase_order_items (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  purchase_order_id text not null,
  position integer not null,
  sku text not null,
  name text not null,
  qty integer not null check (qty > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  unique (owner_id, purchase_order_id, position)
);

create index if not exists purchase_orders_owner_idx on public.purchase_orders (owner_id);
create index if not exists purchase_order_items_owner_idx on public.purchase_order_items (owner_id);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists "purchase_orders_select_own" on public.purchase_orders;
drop policy if exists "purchase_orders_insert_own" on public.purchase_orders;
drop policy if exists "purchase_orders_update_own" on public.purchase_orders;
drop policy if exists "purchase_orders_delete_own" on public.purchase_orders;
drop policy if exists "purchase_order_items_select_own" on public.purchase_order_items;
drop policy if exists "purchase_order_items_insert_own" on public.purchase_order_items;
drop policy if exists "purchase_order_items_update_own" on public.purchase_order_items;
drop policy if exists "purchase_order_items_delete_own" on public.purchase_order_items;

create policy "purchase_orders_select_own" on public.purchase_orders for select to authenticated using (auth.uid() = owner_id);
create policy "purchase_orders_insert_own" on public.purchase_orders for insert to authenticated with check (auth.uid() = owner_id);
create policy "purchase_orders_update_own" on public.purchase_orders for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "purchase_orders_delete_own" on public.purchase_orders for delete to authenticated using (auth.uid() = owner_id);

create policy "purchase_order_items_select_own" on public.purchase_order_items for select to authenticated using (auth.uid() = owner_id);
create policy "purchase_order_items_insert_own" on public.purchase_order_items for insert to authenticated with check (auth.uid() = owner_id);
create policy "purchase_order_items_update_own" on public.purchase_order_items for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "purchase_order_items_delete_own" on public.purchase_order_items for delete to authenticated using (auth.uid() = owner_id);
