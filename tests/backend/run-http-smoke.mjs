import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as pause } from 'node:timers/promises';

// This suite intentionally tests fail-closed behavior without a real provider.
// Refuse configured working copies rather than sending synthetic credentials.
const localEnv = await access('.env.local').then(()=>true,()=>false);
if(localEnv || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) throw new Error('Run HTTP failure smoke tests in an unconfigured build/checkout, without .env.local or Supabase environment values.');
const reservation=createServer();
reservation.listen(0,'127.0.0.1');await once(reservation,'listening');
const port=reservation.address().port;
await new Promise((resolve,reject)=>reservation.close(error=>error ? reject(error) : resolve()));
process.env.LIFE_OS_TEST_ORIGIN=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','ignore','pipe']});
let errors='';server.stderr.on('data',chunk=>{errors=(errors+chunk.toString()).slice(-4000);});
const exited=once(server,'exit');
try {
 let ready=false;
 for(let attempt=0;attempt<50;attempt++) {
  if(server.exitCode!==null) throw new Error(`Production server exited: ${errors}`);
  try { const response=await fetch(process.env.LIFE_OS_TEST_ORIGIN,{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;} } catch { /* bounded startup wait */ }
  await pause(100);
 }
 if(!ready) throw new Error(`Production server did not become ready: ${errors}`);
 await import('./http-smoke.mjs');
} finally {
 if(server.exitCode===null) server.kill('SIGTERM');
 await exited;
}
