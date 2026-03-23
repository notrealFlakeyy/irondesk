alter table public.customers
  add column if not exists phone text;

create table if not exists public.integration_runs (
  row_id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  id text not null,
  provider text not null check (provider in ('stripe', 'twilio', 'xero', 'woocommerce', 'quickbooks')),
  event text not null,
  target_id text,
  status text not null check (status in ('success', 'failed', 'skipped')),
  message text not null,
  reference text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create index if not exists integration_runs_owner_idx on public.integration_runs (owner_id);
create index if not exists integration_runs_provider_idx on public.integration_runs (owner_id, provider, created_at desc);

alter table public.integration_runs enable row level security;

drop policy if exists "integration_runs_select_own" on public.integration_runs;
drop policy if exists "integration_runs_insert_own" on public.integration_runs;
drop policy if exists "integration_runs_update_own" on public.integration_runs;
drop policy if exists "integration_runs_delete_own" on public.integration_runs;

create policy "integration_runs_select_own" on public.integration_runs for select to authenticated using (auth.uid() = owner_id);
create policy "integration_runs_insert_own" on public.integration_runs for insert to authenticated with check (auth.uid() = owner_id);
create policy "integration_runs_update_own" on public.integration_runs for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "integration_runs_delete_own" on public.integration_runs for delete to authenticated using (auth.uid() = owner_id);
