create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  version text not null,
  enabled boolean not null default true,
  access_mode text not null default 'login',
  created_at timestamptz not null default now()
);

alter table public.strategies add column if not exists access_mode text not null default 'login';

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null unique,
  strategy text not null,
  version text not null,
  symbol text not null,
  timeframe text not null,
  side text not null check (side in ('long', 'short')),
  entry numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  rr numeric not null default 2,
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'cancelled')),
  reasons jsonb not null default '[]'::jsonb,
  confidence numeric default 70,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signal_events (
  id uuid primary key default gen_random_uuid(),
  signal_id text,
  source text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  status text not null default 'accepted',
  error text
);

create table if not exists public.notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('telegram', 'line', 'email', 'push')),
  external_user_id text,
  label text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  signal_id text references public.signals(signal_id) on delete set null,
  user_id uuid,
  channel_id uuid references public.notification_channels(id) on delete set null,
  platform text not null,
  status text not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  signal_id text references public.signals(signal_id) on delete set null,
  symbol text not null,
  side text not null check (side in ('long', 'short')),
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric not null,
  take_profit numeric not null,
  position_size numeric not null default 0,
  fee numeric not null default 0,
  pnl numeric not null default 0,
  pnl_r numeric not null default 0,
  status text not null default 'planned' check (status in ('planned', 'open', 'closed')),
  emotion text,
  mistake_tags jsonb not null default '[]'::jsonb,
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  strategy text not null,
  metric_date date not null,
  signal_count integer not null default 0,
  win_rate numeric,
  average_r numeric,
  max_drawdown_r numeric,
  created_at timestamptz not null default now(),
  unique (strategy, metric_date)
);

insert into public.strategies (code, name, version, access_mode)
values ('SMC_PRO', 'SMC PRO', '0.4.0', 'login')
on conflict (code) do update set version = excluded.version;

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists signals_created_at_idx on public.signals(created_at desc);
create index if not exists signals_strategy_symbol_time_side_idx on public.signals(strategy, symbol, timeframe, side, created_at desc);
create index if not exists signal_events_received_idx on public.signal_events(received_at desc);
create index if not exists signal_events_status_received_idx on public.signal_events(status, received_at desc);
create index if not exists trades_user_opened_idx on public.trades(user_id, opened_at desc);
create index if not exists trades_user_status_opened_idx on public.trades(user_id, status, opened_at desc);
create index if not exists trades_symbol_opened_idx on public.trades(symbol, opened_at desc);
create index if not exists notification_channels_user_idx on public.notification_channels(user_id);
create index if not exists notifications_signal_idx on public.notifications(signal_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_status_created_idx on public.notifications(status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'member'
  )
  on conflict (user_id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.strategies enable row level security;
alter table public.signals enable row level security;
alter table public.signal_events enable row level security;
alter table public.notification_channels enable row level security;
alter table public.notifications enable row level security;
alter table public.trades enable row level security;
alter table public.strategy_daily_metrics enable row level security;

drop policy if exists "members can read strategies" on public.strategies;
create policy "members can read strategies"
on public.strategies for select
to authenticated
using (true);

drop policy if exists "members can read signals" on public.signals;
create policy "members can read signals"
on public.signals for select
to authenticated
using (true);

drop policy if exists "members can read metrics" on public.strategy_daily_metrics;
create policy "members can read metrics"
on public.strategy_daily_metrics for select
to authenticated
using (true);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can manage own channels" on public.notification_channels;
create policy "users can manage own channels"
on public.notification_channels for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can manage own trades" on public.trades;
create policy "users can manage own trades"
on public.trades for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
