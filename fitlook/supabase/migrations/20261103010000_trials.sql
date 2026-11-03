-- 7-day free trial: one per account, no card needed (Kwop/Whop do not expose a trial). Written only by the server.
create table public.trials (
  user_id uuid primary key references auth.users on delete cascade,
  plan_id int not null check (plan_id in (1064, 1065, 1066)),
  plan_name text not null check (char_length(plan_name) <= 60),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  canceled_at timestamptz,
  check (ends_at > started_at)
);
alter table public.trials enable row level security;
create policy "trials_select_own" on public.trials for select to authenticated using (auth.uid() = user_id);
revoke all on public.trials from anon, authenticated;
grant select on public.trials to authenticated;
