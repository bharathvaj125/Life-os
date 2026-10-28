// Run against an unconfigured LOCAL production server only. This verifies HTTP
// wiring/failure behavior, not hosted Supabase persistence or successful auth.
import assert from 'node:assert/strict';
const base = process.env.LIFE_OS_TEST_ORIGIN ?? 'http://127.0.0.1:3000';
const url = new URL(base);
assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname), 'Smoke checks are restricted to a local server.');
assert.equal(url.protocol, 'http:');
let checks = 0;
for (const path of ['/','/dashboard','/footprint','/actions','/community','/resources','/admin']) {
 const response = await fetch(base + path);
 assert.equal(response.status,200,path);
 assert.ok((await response.text()).includes('Main navigation'),path);
 checks++;
}
async function check(path, status, code, { method='GET', body, origin=base, type='application/json' }={}) {
 const headers = { 'Content-Type':type };
 if(origin) headers.Origin=origin;
 const response = await fetch(base+path,{method,headers,body:body===undefined ? undefined : typeof body==='string' ? body : JSON.stringify(body)});
 const result = await response.json();
 assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(result)}`);
 assert.equal(result.error.code,code,path);
 assert.ok(response.headers.get('cache-control').includes('no-store'),path);
 assert.ok(!('stack' in result.error),path);
 checks++;
}
const validId='10000000-0000-4000-8000-000000000001';
const footprint={periodStart:'2024-01-01',periodEnd:'2024-01-31',electricityKwh:310};
for(const path of ['/api/auth/me','/api/profile','/api/footprint/entries','/api/actions/today','/api/community/challenges','/api/community/leaderboard','/api/community/me','/api/resources']) await check(path,503,'SERVICE_UNAVAILABLE');
await check('/api/footprint/entries?limit=101',400,'INVALID_INPUT');
await check('/api/footprint/entries?cursor=bad',400,'INVALID_INPUT');
await check('/api/footprint/entries',503,'SERVICE_UNAVAILABLE',{method:'POST',body:footprint});
await check('/api/footprint/entries',400,'INVALID_INPUT',{method:'POST',body:{...footprint,periodStart:'2024-02-31'}});
await check('/api/footprint/entries',400,'INVALID_INPUT',{method:'POST',body:{...footprint,points:100}});
await check('/api/footprint/entries',403,'FORBIDDEN',{method:'POST',body:footprint,origin:'https://foreign.example'});
await check(`/api/actions/${validId}/complete`,503,'SERVICE_UNAVAILABLE',{method:'POST'});
await check('/api/actions/bad/complete',400,'INVALID_INPUT',{method:'POST'});
await check(`/api/actions/${validId}/complete`,403,'FORBIDDEN',{method:'POST',origin:null});
await check(`/api/community/challenges/${validId}/join`,503,'SERVICE_UNAVAILABLE',{method:'POST'});
await check('/api/community/challenges/bad/join',400,'INVALID_INPUT',{method:'POST'});
await check('/api/community/leaderboard?limit=0',400,'INVALID_INPUT');
await check('/api/resources?category=invalid',400,'INVALID_INPUT');
await check('/api/resources/solar-estimate',503,'SERVICE_UNAVAILABLE',{method:'POST',body:{roofAreaM2:20,monthlyElectricityKwh:100}});
await check('/api/resources/solar-estimate',400,'INVALID_INPUT',{method:'POST',body:{roofAreaM2:0,monthlyElectricityKwh:100}});
await check('/api/profile',403,'FORBIDDEN',{method:'PUT',body:{},origin:'https://foreign.example'});
for(const path of ['/api/auth/sign-in','/api/auth/sign-up']) await check(path,503,'SERVICE_UNAVAILABLE',{method:'POST',body:{email:'citizen@example.com',password:'synthetic-test-only'}});
await check('/api/auth/sign-out',503,'SERVICE_UNAVAILABLE',{method:'POST'});
await check('/api/auth/sign-in',400,'INVALID_INPUT',{method:'POST',body:'{broken'});
await check('/api/auth/sign-in',415,'UNSUPPORTED_MEDIA_TYPE',{method:'POST',body:'{}',type:'text/plain'});
await check('/api/auth/sign-in',413,'PAYLOAD_TOO_LARGE',{method:'POST',body:{x:'x'.repeat(17000)}});
await check('/api/auth/confirm?token_hash=invalid&type=bad',400,'INVALID_INPUT');
await check('/api/auth/confirm?token_hash=invalid&type=email',503,'SERVICE_UNAVAILABLE');
console.log(`PASS: ${checks} local HTTP checks (7 pages and ${checks-7} API cases). Hosted authentication/persistence is not exercised.`);
