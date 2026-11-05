-- Try-first funnel: a capsule built from one photo before (or without) an account. Server-written only.
create table public.tries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  device_id text not null check (char_length(device_id) <= 64),
  ip_hash text not null check (char_length(ip_hash) <= 64),
  trip_type text not null check (trip_type in ('beach','city','cold','work')),
  piece jsonb not null,
  image_path text not null,
  result jsonb not null,
  trip_id uuid references public.trips on delete set null,
  created_at timestamptz not null default now()
);
create index tries_device_idx on public.tries(device_id, created_at desc);
create index tries_ip_idx on public.tries(ip_hash, created_at desc);
create index tries_user_idx on public.tries(user_id, created_at desc);
alter table public.tries enable row level security;
create policy "tries_select_own" on public.tries for select to authenticated using (auth.uid() = user_id);
create policy "tries_delete_own" on public.tries for delete to authenticated using (auth.uid() = user_id);
revoke all on public.tries from anon, authenticated;
grant select, delete on public.tries to authenticated;

-- Where a user came from (utm_source / ref), captured at sign-up.
alter table public.profiles add column if not exists source text check (char_length(source) <= 80);
