-- OPERATOR TEMPLATE; not a migration and never run with invented values.
-- Requires psql -v variables (or replace each placeholder in a reviewed SQL
-- Editor session). Obtain all values from a reviewed, applicable source first.
-- Variables: version, kg_co2e_per_kwh, source_url, source_period, valid_from, valid_to.
-- No database password or connection string belongs in this file.
begin;
update public.emission_factors set is_active=false where is_active;
insert into public.emission_factors(version,kg_co2e_per_kwh,source_url,source_period,valid_from,valid_to,is_active,reviewed_at)
values (:'version', :'kg_co2e_per_kwh'::numeric, :'source_url', :'source_period', :'valid_from'::date, :'valid_to'::date, true, now());
commit;
