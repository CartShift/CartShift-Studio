#!/usr/bin/env node
// Local-only adapter for the existing authenticated CartShift command transport.
// No HTTP listener, hosted Desktop Commander relay or credential import.
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_REQUEST=32768, MAX_RESPONSE=524288;
const socketPath=process.env.DC_BRIDGE_SOCKET || '/workspace/.desktop-commander-local/engine.sock';
const engineEntry='/opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/index.js';
const sdk='/opt/dc/node_modules/@modelcontextprotocol/sdk/dist/esm/client/';
const bridgeId=randomUUID();
let engine,transport,initializing,generation=0,closing=false;

function fail(code){throw Object.assign(new Error(code),{code});}
function validate(request){
  if(!request || typeof request!=='object' || Array.isArray(request))fail('invalid_request');
  const allowed=request.op==='call'?['op','tool','args']:request.op==='describe'?['op','tool']:['op'];
  if(Object.keys(request).some(k=>!allowed.includes(k)))fail('invalid_request');
  if(!['ping','list','describe','call'].includes(request.op))fail('invalid_request');
  if(['describe','call'].includes(request.op) && (typeof request.tool!=='string' || !/^[a-z_]{1,64}$/.test(request.tool)))fail('invalid_request');
  if(request.op==='call' && (!request.args || typeof request.args!=='object' || Array.isArray(request.args)))fail('invalid_request');
  return request;
}
async function socketDirectory(){
  if(!path.isAbsolute(socketPath) || path.normalize(socketPath)!==socketPath || !socketPath.startsWith('/workspace/'))fail('unsafe_socket_path');
  const parent=path.dirname(socketPath);
  await fs.mkdir(parent,{recursive:true,mode:0o700});
  const st=await fs.lstat(parent);
  if(!st.isDirectory() || st.isSymbolicLink() || st.uid!==1000 || (st.mode & 0o777)!==0o700 || await fs.realpath(parent)!==parent)fail('unsafe_socket_directory');
}
async function ownedSocket(){
  const st=await fs.lstat(socketPath);
  if(!st.isSocket() || st.uid!==1000 || (st.mode & 0o777)!==0o600)fail('unsafe_socket_file');
  return st;
}
async function verifyRuntime(){
  if(process.getuid?.()!==1000 || os.platform()!=='linux' || os.arch()!=='arm64' || os.hostname()!=='ai-docker-sandbox')fail('runtime_identity_mismatch');
  const mounts=(await fs.readFile('/proc/self/mountinfo','utf8')).split('\n').map(x=>x.split(' '));
  if(!mounts.some(x=>x[4]==='/workspace/.auth' && x[5].split(',').includes('ro')) || (await fs.readdir('/workspace/.auth')).length)fail('credential_shadow_mismatch');
  if(!mounts.some(x=>x[4]==='/' && x[5].split(',').includes('ro')))fail('readonly_root_required');
  try{await fs.lstat('/var/run/docker.sock');fail('docker_socket_forbidden');}catch(e){if(e.code!=='ENOENT')throw e;}
  process.chdir('/workspace');
}
async function ensureEngine(){
  if(engine)return engine;
  if(closing)fail('bridge_stopping');
  if(!initializing){
    initializing=(async()=>{
      const {Client}=await import(sdk+'index.js');
      const {StdioClientTransport}=await import(sdk+'stdio.js');
      const client=new Client({name:'cartshift-local-desktop-commander',version:'1.0.0'},{capabilities:{}});
      const stdio=new StdioClientTransport({
        command:'/usr/bin/tini',args:['-s','-p','SIGTERM','-g','--',process.execPath,engineEntry,'--no-onboarding'],
        cwd:'/workspace',stderr:'ignore',
        env:{...process.env,DC_REMOTE_DEVICE:'true',DESKTOP_COMMANDER_DISABLE_TELEMETRY:'1'}
      });
      try{
        await client.connect(stdio);
        client.onclose=()=>{if(engine===client){engine=null;transport=null;}};
        client.onerror=()=>{}; // SDK diagnostics do not prove that a live child died.
        client.localTools=(await client.listTools()).tools;
        if(closing)fail('bridge_stopping');
        engine=client;transport=stdio;generation++;
        return client;
      }catch(e){await stdio.close().catch(()=>{});throw e;}
    })().finally(()=>{initializing=null;});
  }
  return initializing;
}
async function execute(request){
  validate(request);
  if(request.op==='ping')return {identity:{uid:1000,os:'Linux',arch:'aarch64',hostname:os.hostname(),cwd:'/workspace'}};
  const client=await ensureEngine();
  if(request.op==='list')return {tools:client.localTools.map(t=>({name:t.name,description:t.description?.trim().split('\n')[0]}))};
  const tool=client.localTools.find(t=>t.name===request.tool);
  if(!tool)fail('unknown_tool');
  if(request.op==='describe')return tool;
  // One call only. A failed/disconnected response must never replay an action.
  return client.callTool({name:request.tool,arguments:request.args},undefined,{timeout:65000});
}
function occupied(){
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection(socketPath);
    const timer=setTimeout(()=>{socket.destroy();reject(new Error('socket_probe_timeout'));},1000);
    socket.once('connect',()=>{clearTimeout(timer);socket.destroy();resolve(true);});
    socket.once('error',e=>{clearTimeout(timer);if(e.code==='ECONNREFUSED' || e.code==='ENOENT')resolve(false);else reject(e);});
  });
}
async function serve(){
  await verifyRuntime();await socketDirectory();
  try{
    const before=await ownedSocket();
    if(await occupied())fail('bridge_already_running');
    const after=await ownedSocket();
    if(before.dev!==after.dev || before.ino!==after.ino)fail('socket_changed_during_start');
    await fs.unlink(socketPath); // Only an unchanged, owned, stale socket.
  }catch(e){if(e.code!=='ENOENT')throw e;}
  let created;
  const server=net.createServer(socket=>{
    let input=Buffer.alloc(0),handled=false;
    socket.setTimeout(90000,()=>socket.destroy());
    socket.on('error',()=>{});
    socket.on('data',async chunk=>{
      if(handled)return;
      input=Buffer.concat([input,chunk]);
      if(input.length>MAX_REQUEST){handled=true;socket.end(JSON.stringify({ok:false,error:'request_too_large'})+'\n');return;}
      const newline=input.indexOf(10);if(newline<0)return;
      handled=true;
      let response;
      try{
        if(input.subarray(newline+1).some(x=>x!==10 && x!==13))fail('multiple_requests_forbidden');
        const result=await execute(JSON.parse(input.subarray(0,newline).toString('utf8')));
        response={ok:true,bridgeId,engineGeneration:generation,result};
      }catch(e){
        const known=['invalid_request','unknown_tool','bridge_stopping'];
        response={ok:false,bridgeId,error:known.includes(e.code)?e.code:'engine_unavailable',retry:'Check the prior action result before retrying; actions are not replayed.'};
      }
      const output=JSON.stringify(response);
      socket.end(Buffer.byteLength(output)>MAX_RESPONSE?JSON.stringify({ok:false,error:'response_too_large'})+'\n':output+'\n');
    });
  });
  server.maxConnections=16;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve);});
  await fs.chmod(socketPath,0o600);created=await ownedSocket();
  console.log('Local Desktop Commander bridge ready; private Unix socket only.');
  const shutdown=async()=>{
    if(closing)return;closing=true;
    const deadline=setTimeout(()=>process.exit(1),5000);deadline.unref();
    await engine?.close().catch(()=>{});await transport?.close().catch(()=>{});
    try{const st=await ownedSocket();if(st.dev===created.dev && st.ino===created.ino)await fs.unlink(socketPath);}catch{}
    server.close(()=>process.exit(0));
  };
  process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
}
async function send(request){
  validate(request);
  const input=JSON.stringify(request)+'\n';if(Buffer.byteLength(input)>MAX_REQUEST)fail('request_too_large');
  await socketDirectory();await ownedSocket();
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection(socketPath);let output=Buffer.alloc(0),finished=false,sent=false;
    const stop=e=>{if(finished)return;finished=true;socket.destroy();reject(e);};
    socket.setTimeout(85000,()=>stop(new Error('unknown_result_after_timeout_do_not_replay')));
    socket.once('connect',()=>{sent=true;socket.write(input);});
    socket.on('data',chunk=>{output=Buffer.concat([output,chunk]);if(output.length>MAX_RESPONSE)stop(new Error('response_too_large'));});
    socket.once('error',stop);
    socket.once('end',()=>{
      if(finished)return;finished=true;
      try{if(!output.length)fail(sent?'unknown_result_after_disconnect_do_not_replay':'bridge_unavailable');resolve(JSON.parse(output.toString('utf8')));}catch(e){reject(e);}
    });
  });
}
try{
  if(process.argv[2]==='serve')await serve();
  else{
    let request;
    if(process.argv[2]==='list')request={op:'list'};
    else if(process.argv[2]==='request'){
      const encoded=process.argv[3];
      if(encoded!==undefined){
        if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length>Math.ceil(MAX_REQUEST*4/3)+4)fail('invalid_request');
        request=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
      }else{
        let input=Buffer.alloc(0);
        for await(const chunk of process.stdin){input=Buffer.concat([input,chunk]);if(input.length>MAX_REQUEST)fail('request_too_large');}
        request=JSON.parse(input.toString('utf8'));
      }
    }else fail('usage_list_or_request_base64_json');
    const response=await send(request);console.log(JSON.stringify(response));
    process.exitCode=response.ok?(response.result?.isError?2:0):1;
  }
}catch(e){
  console.log(JSON.stringify({ok:false,error:typeof e.code==='string'?e.code:e.message || 'bridge_unavailable'}));
  process.exitCode=1;
}
