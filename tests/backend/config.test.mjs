import assert from 'node:assert/strict';
import test from 'node:test';
import { getSupabaseConfig, SupabaseConfigError } from '../../src/lib/supabase/config.ts';

test('configuration rejects missing settings and insecure remote URLs', t => {
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://remote.example';
  assert.throws(getSupabaseConfig, SupabaseConfigError);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://user:password@remote.example';
  assert.throws(getSupabaseConfig, SupabaseConfigError);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  assert.equal(getSupabaseConfig().url, 'https://project.supabase.co');
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  assert.equal(getSupabaseConfig().url, 'http://127.0.0.1:54321');
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
  assert.throws(getSupabaseConfig, SupabaseConfigError);
});
