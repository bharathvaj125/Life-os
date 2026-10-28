-- First backend slice: private user profiles. Apply through Supabase migrations.
-- No service-role credential is needed in the application.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  state text not null check (char_length(btrim(state)) between 2 and 80),
  district text check (district is null or char_length(btrim(district)) between 2 and 80),
  household_size integer not null check (household_size between 1 and 50),
  community_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.protect_profile_metadata()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := statement_timestamp();
  else
    if new.id is distinct from old.id then
      raise exception 'Profile identity cannot be changed';
    end if;
    new.created_at := old.created_at;
  end if;
  new.updated_at := statement_timestamp();
  return new;
end;
$$;
create trigger protect_profile_metadata before insert or update on public.profiles
for each row execute function public.protect_profile_metadata();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name, state, district, household_size, community_opt_in) on public.profiles to authenticated;
-- PostgREST upsert includes the unchanged primary key in its UPDATE columns.
-- The trigger rejects identity changes; RLS enforces ownership.
grant update (id, display_name, state, district, household_size, community_opt_in) on public.profiles to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No client delete grant/policy. Account deletion is a separate, reviewed flow.
revoke all on function public.protect_profile_metadata() from public;

commit;
