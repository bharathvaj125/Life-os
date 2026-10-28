import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL SQL execution. Only the Supabase-owned auth schema is stubbed.
// These tests do not claim to exercise hosted GoTrue, PostgREST, or email delivery.
const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${alice}'), ('${bob}');
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/202610280001_profiles.sql', import.meta.url), 'utf8'));
  return db;
}
async function asUser(db, id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec('set role authenticated');
}
async function insert(db, id, size = 3) {
  return db.query('insert into public.profiles (id, display_name, state, household_size) values ($1, $2, $3, $4) returning *', [id, 'Citizen', 'Gujarat', size]);
}
test('migration: two users cannot read, insert, update, or delete each other’s profiles', async () => {
  const db = await database();
  try {
    await asUser(db, alice);
    await insert(db, alice);
    await assert.rejects(insert(db, bob), /row-level security/);
    await asUser(db, bob);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
    assert.equal((await db.query('update public.profiles set display_name = $1 where id = $2 returning id', ['Changed', alice])).rows.length, 0);
    await assert.rejects(db.query('delete from public.profiles where id = $1', [alice]), /permission denied/);
    await insert(db, bob);
    assert.equal((await db.query('select * from public.profiles')).rows[0].id, bob);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from public.profiles'), /permission denied/);
    await assert.rejects(insert(db, alice), /permission denied/);
  } finally { await db.close(); }
});
test('migration: own-profile upsert works, identity/timestamps and constraints are protected', async () => {
  const db = await database();
  try {
    await asUser(db, alice);
    const before = (await insert(db, alice)).rows[0];
    const result = await db.query(`insert into public.profiles (id, display_name, state, district, household_size, community_opt_in)
      values ($1, 'Updated Citizen', 'Gujarat', null, 4, true)
      on conflict (id) do update set id = excluded.id, display_name = excluded.display_name,
      state = excluded.state, district = excluded.district, household_size = excluded.household_size,
      community_opt_in = excluded.community_opt_in returning *`, [alice]);
    assert.equal(result.rows[0].household_size, 4);
    assert.equal(result.rows[0].created_at.toISOString(), before.created_at.toISOString());
    assert.equal(result.rows[0].community_opt_in, true);
    await assert.rejects(db.query('update public.profiles set id = $1 where id = $2', [bob, alice]), /identity cannot be changed/);
    await assert.rejects(db.query("update public.profiles set created_at = now()"), /permission denied/);
    await assert.rejects(db.query('update public.profiles set household_size = 0'), /check constraint/);
    await assert.rejects(db.query("update public.profiles set display_name = ' '"), /check constraint/);
    await db.exec('reset role');
    await db.query('delete from auth.users where id = $1', [alice]);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
  } finally { await db.close(); }
});
