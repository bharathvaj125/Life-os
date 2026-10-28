import assert from 'node:assert/strict';
import test from 'node:test';
import { InputError, parseCredentials, parseProfile } from '../../src/lib/utils/validation.ts';
import { assertSameOrigin, readJson, RequestError } from '../../src/lib/utils/request.ts';

const validProfile = { displayName: '  Citizen  ', state: 'Gujarat', district: null, householdSize: 3, communityOptIn: false };
test('profile input trims text and requires explicit privacy preference', () => {
  assert.equal(parseProfile(validProfile).displayName, 'Citizen');
  for (const patch of [{ householdSize: 1.5 }, { householdSize: 0 }, { householdSize: 51 }, { communityOptIn: 'true' }, { district: '' }, { state: ' ' }, { id: 'other-user' }, { points: 100 }]) {
    assert.throws(() => parseProfile({ ...validProfile, ...patch }), InputError);
  }
  for (const input of [null, [], true]) assert.throws(() => parseProfile(input), InputError);
});
test('credentials preserve passwords and distinguish signup from legacy signin', () => {
  const password = '  twelve character password  ';
  assert.equal(parseCredentials({ email: ' user@example.com ', password }, 'signup').password, password);
  assert.equal(parseCredentials({ email: ' user@example.com ', password }, 'signup').email, 'user@example.com');
  assert.throws(() => parseCredentials({ email: 'user@example.com', password: 'short' }, 'signup'), InputError);
  assert.doesNotThrow(() => parseCredentials({ email: 'user@example.com', password: 'short' }, 'signin'));
  assert.throws(() => parseCredentials({ email: 'not-email', password }, 'signup'), InputError);
  assert.throws(() => parseCredentials({ email: 'user@example.com', password, role: 'admin' }, 'signup'), InputError);
});
test('mutations reject missing and foreign origins', () => {
  for (const origin of [null, 'https://evil.example', 'null']) {
    const headers = origin ? { origin } : {};
    assert.throws(() => assertSameOrigin(new Request('https://life.example/api/profile', { headers })), error => error instanceof RequestError && error.status === 403);
  }
  assert.doesNotThrow(() => assertSameOrigin(new Request('https://life.example/api/profile', { headers: { origin: 'https://life.example' } })));
  // Next may reconstruct a localhost URL despite a different actual HTTP Host.
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://localhost:3000/api/profile', { headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' } })));
  assert.throws(() => assertSameOrigin(new Request('https://life.example/api/profile', { headers: { host: 'life.example', origin: 'https://evil.example', 'x-forwarded-host': 'evil.example' } })), RequestError);
});
test('JSON reader enforces media type, syntax, and actual body size', async () => {
  function req(body, contentType = 'application/json') { return new Request('https://life.example', { method: 'POST', headers: { 'content-type': contentType }, body }); }
  assert.deepEqual(await readJson(req('{"ok":true}', 'application/json; charset=utf-8')), { ok: true });
  await assert.rejects(readJson(req('{}', 'text/plain')), error => error.status === 415);
  await assert.rejects(readJson(req('{broken')), error => error.status === 400);
  await assert.rejects(readJson(req(JSON.stringify({ text: 'x'.repeat(17_000) }))), error => error.status === 413);
});
