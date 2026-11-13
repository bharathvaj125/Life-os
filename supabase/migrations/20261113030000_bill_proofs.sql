-- Scanned electricity bills. We keep the readings and a one-way fingerprint of the consumer number, so the same
-- bill cannot be used twice. Never the image, the name, the address or the full consumer number.
-- Same access model as the other tables: server-only, service-role key, row level security on with no public policy.

create table if not exists bill_proofs (
  id                text primary key,
  user_id           text not null references app_users (id) on delete cascade,
  period            text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  consumer_hash     text not null,
  consumer_last4    text not null check (consumer_last4 ~ '^[0-9]{1,4}$'),
  previous_reading  numeric not null check (previous_reading >= 0),
  current_reading   numeric not null check (current_reading >= previous_reading),
  multiplier        numeric not null default 1 check (multiplier > 0),
  units             numeric not null check (units > 0),
  amount_inr        numeric check (amount_inr >= 0),
  source            text not null check (source in ('image', 'pdf')),
  created_at        timestamptz not null default now(),
  unique (user_id, period),
  unique (consumer_hash, period)
);

alter table bill_proofs enable row level security;
