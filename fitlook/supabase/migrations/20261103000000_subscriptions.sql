-- Subscription grace period: FitLook remembers each paid subscription so a cancelled plan stays active until the end of
-- the month already paid for (Kwop reports "free" right after a cancel). Written only by the server (service role).
create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  plan_id int not null,
  plan_name text not null check (char_length(plan_name) <= 60),
  status text not null default 'active' check (status in ('active','canceling','expired')),
  paid_since timestamptz not null default now(),
  current_period_end timestamptz not null,
  canceled_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
