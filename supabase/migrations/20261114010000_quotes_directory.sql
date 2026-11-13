-- Quote requests and messages between households and installers, a clearer vendor directory (who each entry is,
-- where it comes from, whether an administrator checked it on an official list) and the real public bodies that
-- households need. Same access model as the other tables: server-only, service-role key, RLS on, no policy.

alter table vendors add column if not exists listing_kind  text not null default 'installer' check (listing_kind in ('installer', 'official', 'company'));
alter table vendors add column if not exists source_url    text check (source_url is null or source_url ~ '^https?://');
alter table vendors add column if not exists verified_on   date;
alter table vendors add column if not exists verified_note text check (verified_note is null or char_length(verified_note) <= 200);
-- The empanelment text on public-body entries is longer than a self-declared claim.
alter table vendors drop constraint if exists vendors_empanelment_claim_check;
alter table vendors add constraint vendors_empanelment_claim_check check (empanelment_claim is null or char_length(empanelment_claim) <= 200);

create table if not exists quote_requests (
  id          text primary key,
  citizen_id  text not null references app_users (id) on delete cascade,
  vendor_id   text not null references vendors (id) on delete cascade,
  topic       text not null,
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists quote_requests_citizen_idx on quote_requests (citizen_id);
create index if not exists quote_requests_vendor_idx on quote_requests (vendor_id);

create table if not exists quote_messages (
  id           text primary key,
  request_id   text not null references quote_requests (id) on delete cascade,
  author_id    text not null,
  author_role  text not null check (author_role in ('citizen', 'installer')),
  body         text not null check (char_length(body) between 1 and 1000),
  created_at   timestamptz not null default now()
);
create index if not exists quote_messages_request_idx on quote_messages (request_id, created_at);

alter table quote_requests enable row level security;
alter table quote_messages enable row level security;

-- Real public bodies and companies, from their own public websites. Not LiFE-OS partners; no phone numbers or street
-- addresses are invented. Safe to run twice.
insert into vendors (id, name, city, pincode, services, website, source_url, empanelment_claim, status, is_sample, listing_kind) values
  ('public-pgvcl', 'PGVCL (Paschim Gujarat Vij Company)', 'Rajkot', '360004', array['rooftop-solar'], 'https://pgvcl.com/solar_rooftop', 'https://pgvcl.com/solar_rooftop', 'Electricity company for Saurashtra and Kutch: net metering and empanelled vendor list', 'approved', false, 'official'),
  ('public-dgvcl', 'DGVCL (Dakshin Gujarat Vij Company)', 'Surat', '395006', array['rooftop-solar'], 'https://www.dgvcl.com', 'https://www.dgvcl.com', 'Electricity company for South Gujarat: net metering and empanelled vendor list', 'approved', false, 'official'),
  ('public-mgvcl', 'MGVCL (Madhya Gujarat Vij Company)', 'Vadodara', '390007', array['rooftop-solar'], 'https://www.mgvcl.com', 'https://www.mgvcl.com', 'Electricity company for Central Gujarat: net metering and empanelled vendor list', 'approved', false, 'official'),
  ('public-ugvcl', 'UGVCL (Uttar Gujarat Vij Company)', 'Mehsana', '384001', array['rooftop-solar'], 'https://www.ugvcl.com', 'https://www.ugvcl.com', 'Electricity company for North Gujarat: net metering and empanelled vendor list', 'approved', false, 'official'),
  ('public-geda', 'GEDA (Gujarat Energy Development Agency)', 'Gandhinagar', '382011', array['rooftop-solar','solar-water-heater','energy-audit'], 'https://geda.gujarat.gov.in', 'https://geda.gujarat.gov.in', 'State agency for renewable energy programmes', 'approved', false, 'official'),
  ('public-torrent-power', 'Torrent Power', 'Ahmedabad', '380015', array['rooftop-solar'], 'https://www.torrentpower.com', 'https://www.torrentpower.com', 'Electricity company for Ahmedabad, Gandhinagar and Surat; rooftop solar information on its website', 'approved', false, 'company'),
  ('public-heaven-green', 'Heaven Green Energy', 'Surat', '394101', array['rooftop-solar'], 'https://www.heavengreenenergy.com', 'https://www.heavengreenenergy.com/contact', 'Rooftop solar company based in Surat with offices in Ahmedabad and Vadodara (from its own website)', 'approved', false, 'company')
on conflict (id) do nothing;
