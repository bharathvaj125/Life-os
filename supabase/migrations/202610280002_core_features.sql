-- Core Mission LiFE persistence. All writes are reviewed RPCs, never client totals.
begin;
-- Guarded SECURITY DEFINER functions must work for a non-superuser table
-- owner too. Ordinary authenticated clients remain subject to profile RLS.
alter table public.profiles no force row level security;
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.emission_factors (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  kg_co2e_per_kwh numeric not null check (kg_co2e_per_kwh > 0 and kg_co2e_per_kwh <= 5),
  source_url text not null check (source_url like 'https://%'),
  source_period text not null,
  valid_from date not null, valid_to date not null check (valid_to >= valid_from),
  is_active boolean not null default false,
  reviewed_at timestamptz not null
);
create unique index one_active_factor on public.emission_factors (is_active) where is_active;
-- Intentionally no seed coefficient: an administrator must review an official
-- source and its measurement-period applicability before activating a factor.

create table public.footprint_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null check (period_start >= date '2000-01-01'),
  period_end date not null,
  electricity_kwh numeric not null check (electricity_kwh between 0 and 100000),
  is_baseline boolean not null,
  factor_kg_co2e_per_kwh numeric check (factor_kg_co2e_per_kwh > 0 and factor_kg_co2e_per_kwh <= 5),
  evidence jsonb not null,
  created_at timestamptz not null default statement_timestamp(),
  check (period_end - period_start between 0 and 365)
);
create unique index one_baseline_per_user on public.footprint_entries (user_id) where is_baseline;
create index footprint_history on public.footprint_entries (user_id, period_end desc, id desc);

create table public.action_definitions (
  id text primary key, title text not null, explanation text not null,
  points integer not null check (points between 1 and 100), rule_version text not null
);
insert into public.action_definitions values
 ('switch-off', 'Switch off an unused appliance', 'Check an unused light or appliance and switch it off safely. Completion is self-reported.', 10, 'daily-v1'),
 ('daylight', 'Use daylight where practical', 'If daylight is available, choose it instead of unnecessary electric lighting. Completion is self-reported.', 10, 'daily-v1'),
 ('appliance-review', 'Review one high-use appliance', 'Your latest entry exceeds 8 kWh per day. Review an appliance setting and choose one safe efficiency improvement; this is not a live grid alert.', 15, 'daily-v1');

create table public.daily_assignments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 action_id text not null references public.action_definitions(id),
 assigned_date date not null,
 title text not null, explanation text not null, points integer not null check (points between 1 and 100), rule_version text not null,
 unique(user_id, assigned_date, action_id)
);
create index assignments_by_user_day on public.daily_assignments(user_id, assigned_date);
create table public.action_completions (
 assignment_id uuid primary key references public.daily_assignments(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 completed_at timestamptz not null default statement_timestamp()
);
create index completions_by_user on public.action_completions(user_id, completed_at);
create table public.points_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 assignment_id uuid not null unique references public.action_completions(assignment_id) on delete cascade,
 points integer not null check (points between 1 and 100),
 created_at timestamptz not null default statement_timestamp()
);
create index points_by_user on public.points_events(user_id);
create table public.community_aliases (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 alias text not null unique default ('Citizen-' || replace(gen_random_uuid()::text, '-', ''))
);
create function app_private.create_alias() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.community_aliases(user_id) values (new.id);
 return new;
end;
$$;
create trigger create_community_alias after insert on public.profiles for each row execute function app_private.create_alias();
insert into public.community_aliases(user_id) select id from public.profiles;

create table public.challenges (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 starts_on date not null, ends_on date not null check (ends_on >= starts_on),
 target_completions integer not null check (target_completions > 0)
);
insert into public.challenges(title, description, starts_on, ends_on, target_completions)
values ('30-day everyday actions', 'Work together toward 100 self-reported sustainability tasks. Points and tasks do not prove measured energy savings.', (now() at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date + 29, 100);
create table public.challenge_memberships (
 user_id uuid not null references public.profiles(id) on delete cascade,
 challenge_id uuid not null references public.challenges(id) on delete cascade,
 joined_at timestamptz not null default statement_timestamp(),
 primary key(user_id, challenge_id)
);
create index memberships_by_challenge on public.challenge_memberships(challenge_id);

create table public.resources (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 category text not null check (category in ('energy','solar','habits')),
 source_url text not null check (source_url like 'https://%'),
 reviewed_on date, published boolean not null default false
);
insert into public.resources(title,description,category,source_url,published) values
 ('Mission LiFE', 'Explore the official Mission LiFE portal for everyday environmental actions. Check the source for current guidance.', 'habits','https://missionlife-moefcc.nic.in/',true),
 ('Bureau of Energy Efficiency', 'Consult the official BEE site for energy-efficiency and appliance labelling guidance.', 'energy','https://beeindia.gov.in/',true),
 ('PM Surya Ghar', 'Visit the official rooftop solar portal for current programme details and eligibility. LiFE-OS does not guarantee subsidies or endorse vendors.', 'solar','https://pmsuryaghar.gov.in/',true);
-- reviewed_on stays null until content/availability is checked before release.

-- Private helper guard serializes user mutations on an existing profile row.
-- This prevents overlapping periods, duplicate baselines, and double rewards
-- under concurrent requests; no client receives profile-row update privileges
-- on the core tables. Keep every public write function on this locking path.
create function app_private.lock_user() returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
 if u is null then raise exception 'UNAUTHORIZED'; end if;
 perform 1 from public.profiles where id = u for update;
 if not found then raise exception 'PROFILE_REQUIRED'; end if;
 return u;
end;
$$;
create function app_private.footprint_json(e public.footprint_entries) returns jsonb language sql stable set search_path = '' as $$
 select jsonb_build_object(
 'id',e.id, 'createdAt',e.created_at, 'periodStart',e.period_start,'periodEnd',e.period_end,
 'electricityKwh',e.electricity_kwh,'isBaseline',e.is_baseline,
 'periodDays',e.period_end-e.period_start+1,
 'electricityKwhPerDay',e.electricity_kwh/(e.period_end-e.period_start+1),
 'factorKgCO2ePerKwh',e.factor_kg_co2e_per_kwh,
 'emissionsKgCO2e',e.electricity_kwh*e.factor_kg_co2e_per_kwh,
 'emissionsKgCO2ePerDay',e.electricity_kwh*e.factor_kg_co2e_per_kwh/(e.period_end-e.period_start+1),
 'evidence',e.evidence);
$$;
create function public.save_footprint(p_start date,p_end date,p_kwh numeric) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 u uuid := app_private.lock_user(); e public.footprint_entries; b public.footprint_entries;
 f public.emission_factors; ev jsonb;
begin
 if p_start is null or p_end is null or p_kwh is null or p_start < date '2000-01-01' or p_end-p_start not between 0 and 365 or p_end > (statement_timestamp() at time zone 'Asia/Kolkata')::date or p_kwh not between 0 and 100000 then raise exception 'INVALID_INPUT'; end if;
 select * into b from public.footprint_entries where user_id=u and is_baseline;
 if b.id is not null and p_start <= b.period_end then
  if exists (select 1 from public.footprint_entries where user_id=u and daterange(period_start,period_end,'[]') && daterange(p_start,p_end,'[]')) then raise exception 'PERIOD_OVERLAP'; end if;
  raise exception 'BASELINE_ORDER';
 end if;
 if exists (select 1 from public.footprint_entries where user_id=u and daterange(period_start,period_end,'[]') && daterange(p_start,p_end,'[]')) then raise exception 'PERIOD_OVERLAP'; end if;
 select * into f from public.emission_factors where is_active and valid_from <= p_start and valid_to >= p_end;
 ev := jsonb_build_object('formulaVersion','electricity-daily-v1','sourceUrl',coalesce(f.source_url,'https://github.com/bharathvaj125/Life-os/blob/feat/backend-foundation/docs/CALCULATION_METHODS.md'),
  'sourcePeriod',coalesce(f.source_period,'No reviewed emissions coefficient is configured for this period'), 'isEstimate',true,
  'assumptions',jsonb_build_array('Self-reported household electricity, not an independently verified bill.','Periods are inclusive; progress uses daily kWh, not incomparable billing totals.','This is electricity-only tracking, not a complete lifestyle carbon inventory.',
  case when f.id is null then 'Carbon estimates are unavailable, not zero. Energy tracking remains available.' else 'Carbon = kWh multiplied by the reviewed factor snapshot; factor version: '||f.version end));
 insert into public.footprint_entries(user_id,period_start,period_end,electricity_kwh,is_baseline,factor_kg_co2e_per_kwh,evidence)
 values(u,p_start,p_end,p_kwh,b.id is null,f.kg_co2e_per_kwh,ev) returning * into e;
 return app_private.footprint_json(e);
end;
$$;
create function public.footprint_history(p_limit integer default 20,p_cursor_date date default null,p_cursor_id uuid default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); b public.footprint_entries; latest public.footprint_entries; entries jsonb; cursor_value text; reduction numeric;
begin
 if u is null then raise exception 'UNAUTHORIZED'; end if;
 if p_limit is null or p_limit not between 1 and 100 or (p_cursor_date is null) <> (p_cursor_id is null) then raise exception 'INVALID_INPUT'; end if;
 select * into b from public.footprint_entries where user_id=u and is_baseline;
 select * into latest from public.footprint_entries where user_id=u order by period_end desc,id desc limit 1;
 if latest.id <> b.id and b.electricity_kwh > 0 then
  reduction := (1-(latest.electricity_kwh/(latest.period_end-latest.period_start+1))/(b.electricity_kwh/(b.period_end-b.period_start+1)))*100;
 end if;
 select coalesce(jsonb_agg(app_private.footprint_json(x) order by x.period_end desc,x.id desc),'[]'::jsonb) into entries
 from (select * from public.footprint_entries where user_id=u and (p_cursor_date is null or (period_end,id)<(p_cursor_date,p_cursor_id)) order by period_end desc,id desc limit p_limit) x;
 if jsonb_array_length(entries)=p_limit and exists(select 1 from public.footprint_entries where user_id=u and (period_end,id)<((entries->(p_limit-1)->>'periodEnd')::date,(entries->(p_limit-1)->>'id')::uuid)) then
  cursor_value := (entries->(p_limit-1)->>'periodEnd')||'~'||(entries->(p_limit-1)->>'id');
 end if;
 return jsonb_build_object('entries',entries,'nextCursor',cursor_value,'baseline',case when b.id is null then null else app_private.footprint_json(b) end,'reductionPercent',reduction,'reductionMetric','electricityKwhPerDay');
end;
$$;

create function public.today_actions() returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=app_private.lock_user(); today date:=(statement_timestamp() at time zone 'Asia/Kolkata')::date; daily_kwh numeric; selected text; result jsonb;
begin
 select electricity_kwh/(period_end-period_start+1) into daily_kwh from public.footprint_entries where user_id=u order by period_end desc,id desc limit 1;
 selected := case when daily_kwh > 8 then 'appliance-review' else 'daylight' end;
 insert into public.daily_assignments(user_id,action_id,assigned_date,title,explanation,points,rule_version)
 select u,id,today,title,explanation,points,rule_version from public.action_definitions
 where id in ('switch-off',selected) and not exists(select 1 from public.daily_assignments where user_id=u and assigned_date=today)
 on conflict(user_id,assigned_date,action_id) do nothing;
 select coalesce(jsonb_agg(jsonb_build_object('assignmentId',a.id,'date',a.assigned_date,'title',a.title,'explanation',a.explanation,'points',a.points,'completedAt',c.completed_at) order by a.action_id),'[]'::jsonb)
 into result from public.daily_assignments a left join public.action_completions c on c.assignment_id=a.id where a.user_id=u and a.assigned_date=today;
 return jsonb_build_object('actions',result);
end;
$$;
create function public.complete_action(p_assignment uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=app_private.lock_user(); a public.daily_assignments; c public.action_completions; awarded integer;
begin
 select * into a from public.daily_assignments where id=p_assignment and user_id=u;
 if a.id is null then raise exception 'NOT_FOUND'; end if;
 select * into c from public.action_completions where assignment_id=a.id;
 if c.assignment_id is not null then
  select points into awarded from public.points_events where assignment_id=a.id;
  return jsonb_build_object('assignmentId',a.id,'completedAt',c.completed_at,'awardedPoints',awarded,'alreadyCompleted',true);
 end if;
 if a.assigned_date <> (statement_timestamp() at time zone 'Asia/Kolkata')::date then raise exception 'ACTION_EXPIRED'; end if;
 insert into public.action_completions(assignment_id,user_id) values(a.id,u) returning * into c;
 insert into public.points_events(user_id,assignment_id,points) values(u,a.id,a.points);
 return jsonb_build_object('assignmentId',a.id,'completedAt',c.completed_at,'awardedPoints',a.points,'alreadyCompleted',false);
end;
$$;
create function public.community_summary() returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); today date:=(statement_timestamp() at time zone 'Asia/Kolkata')::date; last_day date; streak integer:=0; alias_value text; opt_in boolean;
begin
 if u is null then raise exception 'UNAUTHORIZED'; end if;
 select a.alias,p.community_opt_in into alias_value,opt_in from public.profiles p join public.community_aliases a on a.user_id=p.id where p.id=u;
 if not found then raise exception 'PROFILE_REQUIRED'; end if;
 select max((completed_at at time zone 'Asia/Kolkata')::date) into last_day from public.action_completions where user_id=u;
 if last_day >= today-1 then
  select count(*) into streak from (
   select day, row_number() over(order by day desc) as position from (
    select distinct (completed_at at time zone 'Asia/Kolkata')::date as day
    from public.action_completions where user_id=u
   ) days
  ) ordered_days where day=last_day-(position-1)::integer;
 end if;
 return jsonb_build_object('alias',alias_value,'communityOptIn',opt_in,'totalPoints',(select coalesce(sum(points),0) from public.points_events where user_id=u),'completedTasks',(select count(*) from public.action_completions where user_id=u),'currentStreakDays',streak,'timezone','Asia/Kolkata');
end;
$$;
create function public.list_challenges() returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); today date:=(statement_timestamp() at time zone 'Asia/Kolkata')::date; result jsonb;
begin
 if u is null then raise exception 'UNAUTHORIZED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'startsOn',c.starts_on,'endsOn',c.ends_on,'targetCompletions',c.target_completions,
 'completionCount',(select count(*) from public.action_completions ac join public.challenge_memberships m on m.user_id=ac.user_id and m.challenge_id=c.id where ac.completed_at>=m.joined_at and (ac.completed_at at time zone 'Asia/Kolkata')::date between c.starts_on and c.ends_on),
 'joined',exists(select 1 from public.challenge_memberships where user_id=u and challenge_id=c.id)) order by c.starts_on,c.id),'[]'::jsonb) into result
 from (select * from public.challenges where ends_on>=today order by starts_on,id limit 100) c;
 return jsonb_build_object('challenges',result);
end;
$$;
create function public.join_challenge(p_challenge uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=app_private.lock_user(); c public.challenges; today date:=(statement_timestamp() at time zone 'Asia/Kolkata')::date;
begin
 select * into c from public.challenges where id=p_challenge;
 if c.id is null then raise exception 'NOT_FOUND'; end if;
 if today not between c.starts_on and c.ends_on then raise exception 'CHALLENGE_CLOSED'; end if;
 insert into public.challenge_memberships(user_id,challenge_id) values(u,c.id) on conflict do nothing;
 return jsonb_build_object('challengeId',c.id,'joined',true);
end;
$$;
create function public.community_leaderboard(p_limit integer default 20) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'INVALID_INPUT'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('rank',rank,'alias',alias,'points',points) order by rank),'[]'::jsonb) into result from (
 select row_number() over(order by coalesce(sum(e.points),0) desc,a.alias) as rank,a.alias,coalesce(sum(e.points),0) as points
 from public.profiles p join public.community_aliases a on a.user_id=p.id left join public.points_events e on e.user_id=p.id
 where p.community_opt_in group by a.alias order by points desc,a.alias limit p_limit) x;
 return jsonb_build_object('entries',result);
end;
$$;

-- RLS plus grants: privileged mutations exist only in the guarded functions.
alter table public.emission_factors enable row level security;
alter table public.footprint_entries enable row level security;
alter table public.action_definitions enable row level security;
alter table public.daily_assignments enable row level security;
alter table public.action_completions enable row level security;
alter table public.points_events enable row level security;
alter table public.community_aliases enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_memberships enable row level security;
alter table public.resources enable row level security;
revoke all on public.emission_factors,public.footprint_entries,public.action_definitions,public.daily_assignments,public.action_completions,public.points_events,public.community_aliases,public.challenges,public.challenge_memberships,public.resources from public,anon,authenticated;
grant select on public.footprint_entries,public.daily_assignments,public.action_completions,public.points_events,public.community_aliases,public.challenge_memberships to authenticated;
grant select on public.resources to anon,authenticated;
create policy footprint_read_own on public.footprint_entries for select to authenticated using ((select auth.uid())=user_id);
create policy assignments_read_own on public.daily_assignments for select to authenticated using ((select auth.uid())=user_id);
create policy completions_read_own on public.action_completions for select to authenticated using ((select auth.uid())=user_id);
create policy points_read_own on public.points_events for select to authenticated using ((select auth.uid())=user_id);
create policy aliases_read_own on public.community_aliases for select to authenticated using ((select auth.uid())=user_id);
create policy memberships_read_own on public.challenge_memberships for select to authenticated using ((select auth.uid())=user_id);
create policy resources_published on public.resources for select to anon,authenticated using (published);
revoke all on all functions in schema app_private from public,anon,authenticated;
revoke all on function public.save_footprint(date,date,numeric),public.footprint_history(integer,date,uuid),public.today_actions(),public.complete_action(uuid),public.community_summary(),public.list_challenges(),public.join_challenge(uuid),public.community_leaderboard(integer) from public,anon,authenticated;
grant execute on function public.save_footprint(date,date,numeric),public.footprint_history(integer,date,uuid),public.today_actions(),public.complete_action(uuid),public.community_summary(),public.list_challenges(),public.join_challenge(uuid),public.community_leaderboard(integer) to authenticated;
commit;
