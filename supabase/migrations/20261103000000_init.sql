-- LiFE-OS initial schema.
-- Run in the Supabase SQL editor, or with `supabase db push`.
-- Access model: the app talks to these tables only from the server with the service-role key.
-- Row level security is enabled and no policy is granted to anon/authenticated, so the public
-- publishable key can read or write nothing here.

create table if not exists app_users (
  id                  text primary key,
  display_name        text not null check (char_length(display_name) between 2 and 40),
  pincode             text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  household_size      integer not null check (household_size between 1 and 20),
  leaderboard_opt_in  boolean not null default false,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists app_users_region_idx on app_users (left(pincode, 3));

create table if not exists footprint_snapshots (
  id               text primary key,
  user_id          text not null references app_users (id) on delete cascade,
  period           text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  electricity_kwh  numeric not null check (electricity_kwh > 0),
  bill_amount_inr  numeric check (bill_amount_inr >= 0),
  lpg_cylinders    numeric not null default 0 check (lpg_cylinders >= 0),
  car_km           numeric not null default 0 check (car_km >= 0),
  bike_km          numeric not null default 0 check (bike_km >= 0),
  public_km        numeric not null default 0 check (public_km >= 0),
  electricity_kg   numeric not null,
  commute_kg       numeric not null,
  lpg_kg           numeric not null,
  total_kg         numeric not null,
  factor_version   text not null,
  created_at       timestamptz not null default now(),
  unique (user_id, period)
);

create table if not exists task_completions (
  id            text primary key,
  user_id       text not null references app_users (id) on delete cascade,
  task_id       text not null,
  -- e.g. 'ac-setpoint:2026-11-03', 'air-dry:2026-W45', 'led-swap:once'. Makes double rewards impossible.
  dedupe_key    text not null,
  completed_on  date not null,
  points        integer not null check (points >= 0),
  impact_kg     numeric not null default 0 check (impact_kg >= 0),
  created_at    timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists task_completions_user_day_idx on task_completions (user_id, completed_on);

create table if not exists challenges (
  id            text primary key,
  title         text not null,
  description   text not null,
  region        text not null,
  region_prefix text,
  metric        text not null check (metric in ('kg_avoided', 'actions')),
  target        numeric not null check (target > 0),
  starts_on     date not null,
  ends_on       date not null check (ends_on >= starts_on)
);

create table if not exists challenge_members (
  challenge_id  text not null references challenges (id) on delete cascade,
  user_id       text not null references app_users (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table app_users           enable row level security;
alter table footprint_snapshots enable row level security;
alter table task_completions    enable row level security;
alter table challenges          enable row level security;
alter table challenge_members   enable row level security;

-- Starter community goals, dated relative to the day this runs.
insert into challenges (id, title, description, region, region_prefix, metric, target, starts_on, ends_on) values
  ('cool-24-ahmedabad',   'Cool 24 · Ahmedabad',        'Keep AC at 24 °C or above and shift heavy appliances off-peak.',          'Ahmedabad',   '380', 'actions',    250,  current_date - 14, current_date + 30),
  ('gandhinagar-150kg',   '150 kg Club · Gandhinagar',  'Together avoid 150 kg of CO₂e through everyday habits.',                  'Gandhinagar', '382', 'kg_avoided', 150,  current_date - 14, current_date + 30),
  ('gujarat-peak-pledge', 'Gujarat Peak-Hour Pledge',   'Gujarat-wide: 1,000 appliance runs moved out of the 6–10 PM peak.',       'Gujarat',     null,  'actions',    1000, current_date - 14, current_date + 30)
on conflict (id) do nothing;
