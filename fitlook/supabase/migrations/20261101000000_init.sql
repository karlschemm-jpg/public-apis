-- FitLook schema. RLS on every table: a user only sees and changes their own rows.
-- Quota-consuming inserts and all counters are written by the server (service role) only.

create extension if not exists pgcrypto;

-- PROFILES -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text check (char_length(display_name) <= 60),
  intended_plan text check (char_length(intended_plan) <= 30),
  trip_style text check (trip_style in ('beach','city','cold','work')),
  pain text check (pain in ('overpack','matching','forget','all')),
  style_vibe text check (style_vibe in ('casual','classic','bold','sporty')),
  trip_length text check (trip_length in ('weekend','week','two_weeks')),
  onboarding_done boolean not null default false,
  free_uses int not null default 0,
  aha_at timestamptz,
  last_plan_id int,
  last_plan_name text,
  last_plan_checked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, trip_style, pain, style_vibe, trip_length) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- GARMENTS (Closet Digitizer) -------------------------------------------------
create table public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (category in ('top','bottom','dress','outerwear','shoes','accessory')),
  color text check (char_length(color) <= 30),
  warmth text not null default 'medium' check (warmth in ('light','medium','warm')),
  formality text not null default 'casual' check (formality in ('casual','smart','formal')),
  image_path text not null,
  is_example boolean not null default false,
  created_at timestamptz not null default now()
);
create index garments_user_idx on public.garments(user_id, created_at desc);
alter table public.garments enable row level security;
create policy "garments_select_own" on public.garments for select to authenticated using (auth.uid() = user_id);
create policy "garments_update_own" on public.garments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "garments_delete_own" on public.garments for delete to authenticated using (auth.uid() = user_id);
revoke all on public.garments from anon, authenticated;
grant select, delete on public.garments to authenticated;
grant update (name, category, color, warmth, formality) on public.garments to authenticated;

-- TRIPS (Trip Planner) --------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  destination text not null check (char_length(destination) between 1 and 80),
  start_date date,
  days int not null check (days between 1 and 30),
  temp_low int not null check (temp_low between -40 and 130),
  temp_high int not null check (temp_high between -40 and 130),
  rain boolean not null default false,
  trip_type text not null default 'city' check (trip_type in ('beach','city','cold','work')),
  notes text check (char_length(notes) <= 500),
  is_example boolean not null default false,
  created_at timestamptz not null default now()
);
create index trips_user_idx on public.trips(user_id, created_at desc);
alter table public.trips enable row level security;
create policy "trips_select_own" on public.trips for select to authenticated using (auth.uid() = user_id);
create policy "trips_update_own" on public.trips for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips_delete_own" on public.trips for delete to authenticated using (auth.uid() = user_id);
revoke all on public.trips from anon, authenticated;
grant select, delete on public.trips to authenticated;
grant update (destination, start_date, days, temp_low, temp_high, rain, trip_type, notes) on public.trips to authenticated;

-- TRIP ITEMS (Suitcase View) --------------------------------------------------
create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trip_id uuid not null references public.trips on delete cascade,
  garment_id uuid not null references public.garments on delete cascade,
  packed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trip_id, garment_id)
);
alter table public.trip_items enable row level security;
create policy "trip_items_select_own" on public.trip_items for select to authenticated using (auth.uid() = user_id);
create policy "trip_items_insert_own" on public.trip_items for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  and exists (select 1 from public.garments g where g.id = garment_id and g.user_id = auth.uid())
);
create policy "trip_items_update_own" on public.trip_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trip_items_delete_own" on public.trip_items for delete to authenticated using (auth.uid() = user_id);
revoke all on public.trip_items from anon, authenticated;
grant select, insert, delete on public.trip_items to authenticated;
grant update (packed) on public.trip_items to authenticated;

-- OUTFITS (AI Matcher) --------------------------------------------------------
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trip_id uuid not null references public.trips on delete cascade,
  day_index int not null check (day_index between 0 and 29),
  top_id uuid references public.garments on delete set null,
  bottom_id uuid references public.garments on delete set null,
  dress_id uuid references public.garments on delete set null,
  outer_id uuid references public.garments on delete set null,
  shoes_id uuid references public.garments on delete set null,
  accessory_id uuid references public.garments on delete set null,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (trip_id, day_index)
);
alter table public.outfits enable row level security;
create policy "outfits_select_own" on public.outfits for select to authenticated using (auth.uid() = user_id);
create policy "outfits_update_own" on public.outfits for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfits_delete_own" on public.outfits for delete to authenticated using (auth.uid() = user_id);
revoke all on public.outfits from anon, authenticated;
grant select, delete on public.outfits to authenticated;
grant update (top_id, bottom_id, dress_id, outer_id, shoes_id, accessory_id, note) on public.outfits to authenticated;

-- USAGE (quota per billing period, server-written only) -----------------------
create table public.usage (
  user_id uuid not null references auth.users on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  kind text not null check (kind in ('digitize','trip','generate')),
  count int not null default 0,
  primary key (user_id, period, kind)
);
alter table public.usage enable row level security;
create policy "usage_select_own" on public.usage for select to authenticated using (auth.uid() = user_id);
revoke all on public.usage from anon, authenticated;
grant select on public.usage to authenticated;

create or replace function public.increment_usage(p_user uuid, p_period text, p_kind text, p_by int default 1)
returns int language sql security definer set search_path = public as $$
  insert into public.usage (user_id, period, kind, count) values (p_user, p_period, p_kind, p_by)
  on conflict (user_id, period, kind) do update set count = public.usage.count + excluded.count
  returning count;
$$;
create or replace function public.increment_free_uses(p_user uuid)
returns int language sql security definer set search_path = public as $$
  update public.profiles set free_uses = free_uses + 1 where id = p_user returning free_uses;
$$;
revoke execute on function public.increment_usage(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.increment_free_uses(uuid) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid, text, text, int) to service_role;
grant execute on function public.increment_free_uses(uuid) to service_role;

-- STORAGE: private bucket, files under <user_id>/..., written by the server ----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garments', 'garments', false, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
create policy "garments_files_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
