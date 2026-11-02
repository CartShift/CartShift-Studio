import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const program = path.join(root, 'scripts/sandbox_desktop_commander.mjs');
const directory = await fs.mkdtemp('/workspace/experiments/dc-local-test-');
await fs.chmod(directory, 0o700);
const socket = path.join(directory, 'engine.sock');
const env = {...process.env, DC_BRIDGE_SOCKET:socket, DESKTOP_COMMANDER_DISABLE_TELEMETRY:'1'};
let daemon;

function run(args, timeout=20_000, customEnv=env, input='') {
  return new Promise((resolve,reject) => {
    const process = spawn('node',[program,...args],{env:customEnv,cwd:'/workspace',stdio:['pipe','pipe','pipe']});
    process.stdin.on('error',()=>{});process.stdin.end(input);
    let stdout='',stderr='';
    process.stdout.on('data',d=>stdout+=d);
    process.stderr.on('data',d=>stderr+=d);
    const timer=setTimeout(()=>{process.kill('SIGKILL');reject(new Error('CLI timeout'));},timeout);
    process.on('error',reject);
    process.on('exit',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});
  });
}
async function request(body) {
  const result=await run(['request',Buffer.from(JSON.stringify(body)).toString('base64')],90_000);
  const response=JSON.parse(result.stdout);
  assert.equal(result.code,0,JSON.stringify(response));
  assert.equal(response.ok,true,JSON.stringify(response));
  return response;
}
async function call(tool,args={}) {
  const response=await request({op:'call',tool,args});
  assert.notEqual(response.result.isError,true,JSON.stringify(response.result));
  return response;
}
async function launch() {
  daemon=spawn('node',[program,'serve'],{env,cwd:'/workspace',stdio:['ignore','pipe','pipe']});
  let diagnostic='';daemon.stderr.on('data',d=>diagnostic+=d);
  daemon.stdout.on('data',()=>{});
  for(let i=0;i<80;i++){
    if(daemon.exitCode!==null)throw new Error(`Bridge exited before readiness: ${diagnostic}`);
    try{const p=await run(['request',Buffer.from('{"op":"ping"}').toString('base64')],2000);if(p.code===0)return;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('Bridge did not become available');
}
async function makeStaleSocket(file) {
  const code='import net from "node:net";import fs from "node:fs";const s=net.createServer();s.listen(process.argv[1],()=>{fs.chmodSync(process.argv[1],0o600);console.log("ready")});';
  const child=spawn('node',['--input-type=module','-e',code,file],{env,cwd:'/workspace',stdio:['ignore','pipe','ignore']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Stale-socket fixture timeout')),3000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  child.kill('SIGKILL');await new Promise(resolve=>child.once('exit',resolve));
  assert.ok((await fs.lstat(file)).isSocket());
}
try {
  await test('persistent local engine behind private socket',async t=>{
    await launch();
    await t.test('lists the pinned native engine tools',async()=>{
      const result=await request({op:'list'});
      for(const tool of ['write_file','read_file','edit_block','start_process','interact_with_process','force_terminate'])assert.ok(result.result.tools.some(x=>x.name===tool));
      assert.equal((await fs.stat(socket)).mode & 0o777,0o600);
    });
    await t.test('writes edits and reads actual persisted files',async()=>{
      const file=path.join(directory,'proof.txt');
      await call('write_file',{path:file,content:'before\n',mode:'rewrite'});
      await call('edit_block',{file_path:file,old_string:'before',new_string:'after'});
      assert.match(JSON.stringify((await call('read_file',{path:file})).result),/after/);
      assert.equal(await fs.readFile(file,'utf8'),'after\n');
    });
    await t.test('accepts bounded plain JSON through stdin without shell interpolation',async()=>{
      const response=await run(['request'],20000,env,JSON.stringify({op:'call',tool:'read_file',args:{path:path.join(directory,'proof.txt')}}));
      assert.equal(response.code,0,response.stdout);
      assert.match(JSON.stringify(JSON.parse(response.stdout).result),/after/);
    });
    await t.test('retains interactive sessions across separate client processes',async()=>{
      const result=await call('start_process',{command:'python3 -i -q',timeout_ms:1000});
      const pid=Number(JSON.stringify(result.result).match(/PID\s+(\d+)/i)?.[1]);assert.ok(pid);
      try{
        const interaction=await call('interact_with_process',{pid,input:'print("persistent-native-session")',timeout_ms:1000});
        assert.match(JSON.stringify(interaction.result),/persistent-native-session/);
      }finally{await call('force_terminate',{pid});}
    });
    await t.test('restarts a terminated stdio engine without replaying a tool action',async()=>{
      const before=await request({op:'ping'});
      const children=(await fs.readFile(`/proc/${daemon.pid}/task/${daemon.pid}/children`,'utf8')).trim().split(/\s+/).filter(Boolean).map(Number);
      const engines=[];
      for(const pid of children)if((await fs.readFile(`/proc/${pid}/comm`,'utf8')).trim()==='tini')engines.push(pid);
      assert.equal(engines.length,1);
      process.kill(engines[0],'SIGTERM');
      let recovered;
      for(let i=0;i<30;i++){
        await new Promise(r=>setTimeout(r,100));
        const result=await run(['request',Buffer.from('{"op":"list"}').toString('base64')]);
        if(result.code===0){const response=JSON.parse(result.stdout);if(response.engineGeneration>before.engineGeneration){recovered=response;break;}}
      }
      assert.ok(recovered,'Native engine did not recover');
      assert.equal(recovered.bridgeId,before.bridgeId);
    });
    await t.test('handles concurrent independent calls',async()=>{
      const started=Date.now();
      const responses=await Promise.all([1,2].map(i=>call('start_process',{command:`sleep 2; printf 'parallel-${i}'`,timeout_ms:3000})));
      assert.ok(Date.now()-started<3800,'Calls were unexpectedly serialized');
      assert.match(JSON.stringify(responses[0].result),/parallel-1/);
      assert.match(JSON.stringify(responses[1].result),/parallel-2/);
    });
    await t.test('duplicate daemon does not unlink the active socket',async()=>{
      const before=await fs.stat(socket);
      const duplicate=await run(['serve']);assert.notEqual(duplicate.code,0);
      assert.equal((await fs.stat(socket)).ino,before.ino);
      await request({op:'ping'});
    });
    await t.test('honors an exclusive startup lock before touching a stale socket',async()=>{
      const file=path.join(directory,'locked-stale.sock');await makeStaleSocket(file);
      const before=await fs.lstat(file);await fs.writeFile(file+'.lock','',{mode:0o600});
      const lock=spawn('/usr/bin/flock',['--exclusive','--nonblock',file+'.lock','/bin/sh','-c','printf LOCKED; cat >/dev/null'],{stdio:['pipe','pipe','ignore']});
      await new Promise((resolve,reject)=>{lock.stdout.once('data',resolve);lock.once('error',reject);});
      try{
        const result=await run(['serve'],2000,{...env,DC_BRIDGE_SOCKET:file});
        assert.notEqual(result.code,0);
        assert.equal((await fs.lstat(file)).ino,before.ino);
      }finally{lock.stdin.end();await new Promise(resolve=>lock.once('exit',resolve));}
    });
    await t.test('simultaneous stale-socket starts leave exactly one reachable daemon',async()=>{
      const file=path.join(directory,'concurrent-stale.sock');await makeStaleSocket(file);
      const contenderEnv={...env,DC_BRIDGE_SOCKET:file};
      const contenders=Array.from({length:8},()=>{
        const child=spawn('node',[program,'serve'],{env:contenderEnv,cwd:'/workspace',stdio:['ignore','pipe','pipe']});
        child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});return child;
      });
      try{
        await new Promise(resolve=>setTimeout(resolve,1500));
        assert.equal(contenders.filter(child=>child.exitCode===null).length,1);
        const response=await run(['request',Buffer.from('{"op":"ping"}').toString('base64')],5000,contenderEnv);
        assert.equal(response.code,0,response.stdout);
      }finally{
        await Promise.all(contenders.filter(child=>child.exitCode===null).map(child=>new Promise(resolve=>{
          child.once('exit',resolve);child.kill('SIGTERM');setTimeout(()=>{if(child.exitCode===null)child.kill('SIGKILL');resolve();},3000).unref();
        })));
      }
    });
    await t.test('rejects malformed and oversized requests',async()=>{
      for(const body of [{op:'call',tool:'../bad',args:{}},{op:'call',tool:'read_file',args:[]},{op:'unknown'}]){
        const r=await run(['request',Buffer.from(JSON.stringify(body)).toString('base64')]);assert.notEqual(r.code,0);
      }
      const r=await run(['request',Buffer.from(JSON.stringify({op:'ping',padding:'x'.repeat(40000)})).toString('base64')]);assert.notEqual(r.code,0);
    });
    await t.test('refuses a regular file or symlink at the socket path',async()=>{
      const other=path.join(directory,'refuse.sock');await fs.writeFile(other,'preserve-me');
      const r=await run(['serve'],10000,{...env,DC_BRIDGE_SOCKET:other});assert.notEqual(r.code,0);
      assert.equal(await fs.readFile(other,'utf8'),'preserve-me');
      const alias=path.join(directory,'alias.sock');await fs.symlink(other,alias);
      const symlink=await run(['serve'],10000,{...env,DC_BRIDGE_SOCKET:alias});assert.notEqual(symlink.code,0);
      assert.equal(await fs.readFile(other,'utf8'),'preserve-me');
    });
  });
} finally {
  if(daemon && daemon.exitCode===null){daemon.kill('SIGTERM');await Promise.race([new Promise(r=>daemon.once('exit',r)),new Promise(r=>setTimeout(r,5000))]);if(daemon.exitCode===null)daemon.kill('SIGKILL');}
}
