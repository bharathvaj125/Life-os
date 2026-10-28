import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const alice='10000000-0000-4000-8000-000000000001';
const bob='10000000-0000-4000-8000-000000000002';
const empty='10000000-0000-4000-8000-000000000003';
async function as(db,id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec('set role authenticated');
}
async function rpc(db,name,args=[],types=[]) {
  const params=args.map((_,i)=>`$${i+1}${types[i] ? `::${types[i]}` : ''}`).join(',');
  return (await db.query(`select public.${name}(${params}) as result`,args)).rows[0].result;
}
async function profile(db,id) {
  await db.query('insert into public.profiles(id,display_name,state,household_size) values($1,$2,$3,3)',[id,'Private Name','Gujarat']);
}
async function save(db,start,end,kwh) { return rpc(db,'save_footprint',[start,end,kwh],['date','date','numeric']); }

test('core backend integration on PostgreSQL with authenticated/anonymous roles',async t=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon nologin; create role authenticated nologin;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth,public to anon,authenticated;
   grant execute on function auth.uid() to anon,authenticated;
   insert into auth.users values('${alice}'),('${bob}'),('${empty}');`);
  for(const migration of ['202610280001_profiles.sql','202610280002_core_features.sql']) await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`,import.meta.url),'utf8'));

  // Simulate a managed deployment migration owner without SUPERUSER/BYPASSRLS.
  // SECURITY DEFINER guards must not rely on the embedded engine's superuser.
  await db.exec(`create role app_operator nologin nosuperuser nobypassrls;
   grant usage,create on schema public,app_private to app_operator;
   grant usage on schema auth to app_operator;
   grant execute on function auth.uid() to app_operator;`);
  const tables=(await db.query("select tablename from pg_tables where schemaname='public'")).rows;
  for(const {tablename} of tables) await db.exec(`alter table public.${tablename} owner to app_operator`);
  const functions=(await db.query("select p.oid::regprocedure::text as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','app_private')")).rows;
  for(const {signature} of functions) await db.exec(`alter function ${signature} owner to app_operator`);

  await t.test('functions require identity/profile; RLS and published-resource policy deny direct abuse',async()=>{
   await db.exec('set role anon');
   await assert.rejects(rpc(db,'today_actions'),/permission denied/);
   assert.equal((await db.query('select * from public.resources')).rows.length,3);
   await assert.rejects(db.query("insert into public.resources(title) values('forged')"),/permission denied/);
   await db.exec('reset role');
   await db.exec("insert into public.resources(title,description,category,source_url,published) values('Unpublished draft','private draft','habits','https://example.com/test-only',false)");
   await db.exec('set role anon');
   assert.equal((await db.query('select * from public.resources')).rows.length,3);
   await as(db,empty);
   await assert.rejects(save(db,'2024-01-01','2024-01-31',310),/PROFILE_REQUIRED/);
   await db.exec('reset role');
   await db.query("select set_config('request.jwt.claim.sub','',false)");
   await assert.rejects(rpc(db,'today_actions'),/UNAUTHORIZED/);
  });

  await t.test('energy baseline works with no coefficient; no fabricated carbon values',async()=>{
   await as(db,alice); await profile(db,alice);
   const e=await save(db,'2024-01-01','2024-01-31',310);
   assert.equal(e.isBaseline,true); assert.equal(e.periodDays,31); assert.equal(e.electricityKwhPerDay,10);
   assert.equal(e.emissionsKgCO2e,null); assert.equal(e.factorKgCO2ePerKwh,null);
   const history=await rpc(db,'footprint_history');
   assert.equal(history.reductionPercent,null); assert.equal(history.reductionMetric,'electricityKwhPerDay');
   await assert.rejects(save(db,'2024-01-31','2024-02-10',10),/PERIOD_OVERLAP/);
   await assert.rejects(save(db,'2023-01-01','2023-01-31',20),/BASELINE_ORDER/);
   await assert.rejects(save(db,'2999-01-01','2999-01-31',20),/INVALID_INPUT/);
   await assert.rejects(save(db,'2024-03-01','2024-02-01',20),/INVALID_INPUT/);
   await assert.rejects(save(db,'2024-02-01','2024-02-29',-1),/INVALID_INPUT/);
   await assert.rejects(db.query('update public.footprint_entries set electricity_kwh=0'),/permission denied/);
  });

  await t.test('reviewed coefficient snapshots, unequal periods, and cursor pages are consistent',async()=>{
   await db.exec('reset role');
   // Synthetic TEST DATA ONLY: never seed this coefficient in production.
   await db.exec("insert into public.emission_factors(version,kg_co2e_per_kwh,source_url,source_period,valid_from,valid_to,is_active,reviewed_at) values('synthetic-test',0.5,'https://example.com/test-only','synthetic test period','2024-01-01','2024-12-31',true,now())");
   await as(db,alice);
   const e=await save(db,'2024-02-01','2024-02-29',145);
   assert.equal(e.periodDays,29);assert.equal(e.electricityKwhPerDay,5); assert.equal(e.emissionsKgCO2e,72.5);
   const page=await rpc(db,'footprint_history',[1,null,null],['integer','date','uuid']);
   assert.equal(page.entries.length,1);assert.equal(page.reductionPercent,50);assert.ok(page.baseline.isBaseline);
   const [date,id]=page.nextCursor.split('~');
   const next=await rpc(db,'footprint_history',[1,date,id],['integer','date','uuid']);
   assert.equal(next.entries[0].id,page.baseline.id);assert.equal(next.nextCursor,null);
   await db.exec('reset role');await db.exec('update public.emission_factors set kg_co2e_per_kwh=0.9');
   await as(db,alice);
   assert.equal((await rpc(db,'footprint_history')).entries[0].factorKgCO2ePerKwh,0.5);
   await save(db,'2024-03-01','2024-03-31',310);
   const attempts=await Promise.allSettled([save(db,'2024-04-01','2024-04-30',300),save(db,'2024-04-01','2024-04-30',300)]);
   assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
   assert.equal((await db.query('select * from public.footprint_entries where is_baseline')).rows.length,1);
   // PGlite serializes queries on one connection: separate hosted concurrent
   // transaction testing is still required; this verifies retry/uniqueness paths.
  });

  await t.test('daily context, stable assignment, idempotent completion, ledger, and streak',async()=>{
   await as(db,alice);
   const first=await rpc(db,'today_actions');const again=await rpc(db,'today_actions');
   assert.equal(first.actions.length,2);assert.deepEqual(first,again);
   assert.ok(first.actions.some(x=>x.explanation.includes('8 kWh')));
   const challenges=(await rpc(db,'list_challenges')).challenges;assert.equal(challenges.length,1);
   await rpc(db,'join_challenge',[challenges[0].id],['uuid']);
   await rpc(db,'join_challenge',[challenges[0].id],['uuid']);
   assert.equal((await db.query('select * from public.challenge_memberships')).rows.length,1);
   const action=first.actions[0];
   const completed=await rpc(db,'complete_action',[action.assignmentId],['uuid']);
   const retried=await rpc(db,'complete_action',[action.assignmentId],['uuid']);
   assert.equal(completed.alreadyCompleted,false);assert.equal(retried.alreadyCompleted,true);
   assert.equal(completed.completedAt,retried.completedAt);assert.equal(retried.awardedPoints,action.points);
   const summary=await rpc(db,'community_summary');
   assert.equal(summary.totalPoints,action.points);assert.equal(summary.completedTasks,1);assert.equal(summary.currentStreakDays,1);
   assert.equal(summary.communityOptIn,false);assert.ok(summary.alias.startsWith('Citizen-'));
   await assert.rejects(db.query('insert into public.points_events(user_id,assignment_id,points) values($1,$2,100)',[alice,action.assignmentId]),/permission denied/);
   await as(db,bob);await profile(db,bob);
   assert.equal((await db.query('select * from public.footprint_entries')).rows.length,0);
   assert.equal((await db.query('select * from public.points_events')).rows.length,0);
   await assert.rejects(rpc(db,'complete_action',[action.assignmentId],['uuid']),/NOT_FOUND/);
   const bobActions=(await rpc(db,'today_actions')).actions;
   assert.ok(bobActions.some(x=>x.title.includes('daylight')));
   await rpc(db,'complete_action',[bobActions[0].assignmentId],['uuid']);
   await rpc(db,'join_challenge',[challenges[0].id],['uuid']);
   await rpc(db,'complete_action',[bobActions[1].assignmentId],['uuid']);
   assert.equal((await rpc(db,'list_challenges')).challenges[0].completionCount,2);
  });

  await t.test('leaderboard exposes opt-in aliases only; opting out removes visibility',async()=>{
   await as(db,alice);
   assert.equal((await rpc(db,'community_leaderboard')).entries.length,0);
   await db.query('update public.profiles set community_opt_in=true where id=$1',[alice]);
   const board=await rpc(db,'community_leaderboard');assert.equal(board.entries.length,1);
   assert.deepEqual(Object.keys(board.entries[0]).sort(),['alias','points','rank']);
   assert.ok(!JSON.stringify(board).includes('Private Name'));assert.ok(!JSON.stringify(board).includes(alice));
   await db.query('update public.profiles set community_opt_in=false where id=$1',[alice]);
   assert.equal((await rpc(db,'community_leaderboard')).entries.length,0);
   await assert.rejects(rpc(db,'community_leaderboard',[101],['integer']),/INVALID_INPUT/);
  });

  await t.test('reward failure rolls back completion, and zero-energy baselines do not divide by zero',async()=>{
   await as(db,empty);await profile(db,empty);
   await save(db,'2024-01-01','2024-01-31',0);
   await save(db,'2024-02-01','2024-02-29',29);
   assert.equal((await rpc(db,'footprint_history')).reductionPercent,null);
   const assignment=(await rpc(db,'today_actions')).actions[0];
   await db.exec('reset role');
   await db.exec(`create function app_private.fail_test_reward() returns trigger language plpgsql as $$ begin raise exception 'simulated storage failure'; end $$;
    create trigger fail_test_reward before insert on public.points_events for each row execute function app_private.fail_test_reward();`);
   await as(db,empty);
   await assert.rejects(rpc(db,'complete_action',[assignment.assignmentId],['uuid']),/simulated storage failure/);
   assert.equal((await db.query('select * from public.action_completions')).rows.length,0);
   assert.equal((await db.query('select * from public.points_events')).rows.length,0);
   await db.exec('reset role; drop trigger fail_test_reward on public.points_events; drop function app_private.fail_test_reward()');
   await as(db,empty);
   const completed=await rpc(db,'complete_action',[assignment.assignmentId],['uuid']);
   assert.equal(completed.alreadyCompleted,false);
   assert.equal((await rpc(db,'community_summary')).totalPoints,assignment.points);
  });

  await t.test('streak counts consecutive local dates once and tolerates an unfinished current day',async()=>{
   await db.exec('reset role; begin');
   try {
    // Administrative fixtures only: clients cannot backdate assignments/completions.
    await db.query(`insert into public.daily_assignments(user_id,action_id,assigned_date,title,explanation,points,rule_version)
      select $1,'switch-off',(now() at time zone 'Asia/Kolkata')::date-n,'past fixture','test',10,'test' from generate_series(1,2) n`,[alice]);
    await db.query(`insert into public.action_completions(assignment_id,user_id,completed_at)
      select id,user_id,assigned_date::timestamp at time zone 'Asia/Kolkata' + interval '12 hours'
      from public.daily_assignments where user_id=$1 and assigned_date<(now() at time zone 'Asia/Kolkata')::date`,[alice]);
    await as(db,alice);
    assert.equal((await rpc(db,'community_summary')).currentStreakDays,3);
    await db.exec('reset role');
    await db.query("delete from public.action_completions where user_id=$1 and (completed_at at time zone 'Asia/Kolkata')::date=(now() at time zone 'Asia/Kolkata')::date",[alice]);
    await as(db,alice);
    assert.equal((await rpc(db,'community_summary')).currentStreakDays,2);
   } finally { await db.exec('rollback; reset role'); }
  });

  await t.test('expired tasks and closed challenges reject new writes; stale streak resets',async()=>{
   await as(db,alice);
   const actions=(await rpc(db,'today_actions')).actions;
   const incomplete=actions.find(x=>x.completedAt===null);
   await db.exec('reset role');
   await db.query('update public.daily_assignments set assigned_date=assigned_date-2 where id=$1',[incomplete.assignmentId]);
   await db.exec("update public.challenges set ends_on=starts_on, starts_on=starts_on-5");
   // End the challenge yesterday, retaining the range invariant.
   await db.exec("update public.challenges set ends_on=(now() at time zone 'Asia/Kolkata')::date-1");
   await db.query("update public.action_completions set completed_at=now()-interval '3 days' where user_id=$1",[alice]);
   await as(db,alice);
   await assert.rejects(rpc(db,'complete_action',[incomplete.assignmentId],['uuid']),/ACTION_EXPIRED/);
   assert.equal((await rpc(db,'community_summary')).currentStreakDays,0);
   await db.exec('reset role');
   const challenge=(await db.query('select id from public.challenges')).rows[0].id;
   await as(db,alice);
   await assert.rejects(rpc(db,'join_challenge',[challenge],['uuid']),/CHALLENGE_CLOSED/);
  });
  await t.test('account removal cascades core private records without deleting other users',async()=>{
   await db.exec('reset role');
   await db.query('delete from auth.users where id=$1',[alice]);
   for(const table of ['footprint_entries','daily_assignments','action_completions','points_events','community_aliases','challenge_memberships']) assert.equal((await db.query(`select count(*)::int as count from public.${table} where user_id=$1`,[alice])).rows[0].count,0,table);
   assert.equal((await db.query('select count(*)::int as count from public.profiles where id=$1',[bob])).rows[0].count,1);
  });
 } finally { await db.close(); }
});
