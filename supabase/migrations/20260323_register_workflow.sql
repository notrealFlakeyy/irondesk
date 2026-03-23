create table if not exists public.held_carts (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  label text not null,
  customer_id text,
  customer_name text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  item_count integer not null default 0 check (item_count >= 0),
  total numeric(12,2) not null default 0,
  status text not null default 'held' check (status in ('held')),
  unique (owner_id, id)
);

create table if not exists public.held_cart_items (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  held_cart_id text not null,
  position integer not null,
  sku text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  cat text not null check (cat in ('fasteners', 'electrical', 'plumbing', 'tools', 'paint', 'safety', 'lumber')),
  min_stock integer not null default 0 check (min_stock >= 0),
  supplier text,
  qty integer not null check (qty > 0),
  unique (owner_id, held_cart_id, position)
);

create table if not exists public.register_notes (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  body text not null,
  author text not null,
  register_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create index if not exists held_carts_owner_idx on public.held_carts (owner_id);
create index if not exists held_cart_items_owner_idx on public.held_cart_items (owner_id);
create index if not exists register_notes_owner_idx on public.register_notes (owner_id);

alter table public.held_carts enable row level security;
alter table public.held_cart_items enable row level security;
alter table public.register_notes enable row level security;

drop policy if exists "held_carts_select_own" on public.held_carts;
drop policy if exists "held_carts_insert_own" on public.held_carts;
drop policy if exists "held_carts_update_own" on public.held_carts;
drop policy if exists "held_carts_delete_own" on public.held_carts;
drop policy if exists "held_cart_items_select_own" on public.held_cart_items;
drop policy if exists "held_cart_items_insert_own" on public.held_cart_items;
drop policy if exists "held_cart_items_update_own" on public.held_cart_items;
drop policy if exists "held_cart_items_delete_own" on public.held_cart_items;
drop policy if exists "register_notes_select_own" on public.register_notes;
drop policy if exists "register_notes_insert_own" on public.register_notes;
drop policy if exists "register_notes_update_own" on public.register_notes;
drop policy if exists "register_notes_delete_own" on public.register_notes;

create policy "held_carts_select_own" on public.held_carts for select to authenticated using (auth.uid() = owner_id);
create policy "held_carts_insert_own" on public.held_carts for insert to authenticated with check (auth.uid() = owner_id);
create policy "held_carts_update_own" on public.held_carts for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "held_carts_delete_own" on public.held_carts for delete to authenticated using (auth.uid() = owner_id);

create policy "held_cart_items_select_own" on public.held_cart_items for select to authenticated using (auth.uid() = owner_id);
create policy "held_cart_items_insert_own" on public.held_cart_items for insert to authenticated with check (auth.uid() = owner_id);
create policy "held_cart_items_update_own" on public.held_cart_items for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "held_cart_items_delete_own" on public.held_cart_items for delete to authenticated using (auth.uid() = owner_id);

create policy "register_notes_select_own" on public.register_notes for select to authenticated using (auth.uid() = owner_id);
create policy "register_notes_insert_own" on public.register_notes for insert to authenticated with check (auth.uid() = owner_id);
create policy "register_notes_update_own" on public.register_notes for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "register_notes_delete_own" on public.register_notes for delete to authenticated using (auth.uid() = owner_id);
