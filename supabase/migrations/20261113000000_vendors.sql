-- Resource hub vendor directory. Same access model as the other tables: server-only, service-role key,
-- row level security on with no public policy.

create table if not exists vendors (
  id                  text primary key,
  name                text not null check (char_length(name) between 3 and 80),
  city                text not null check (char_length(city) between 2 and 40),
  pincode             text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  services            text[] not null check (cardinality(services) between 1 and 5),
  phone               text check (phone ~ '^[6-9][0-9]{9}$'),
  website             text check (website ~ '^https?://'),
  empanelment_claim   text check (char_length(empanelment_claim) <= 120),
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_sample           boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists vendors_status_idx on vendors (status);

alter table vendors enable row level security;
