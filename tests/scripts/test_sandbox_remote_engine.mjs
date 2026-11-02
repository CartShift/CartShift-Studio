import { DesktopCommanderIntegration } from '/opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/remote-device/desktop-commander-integration.js';
const dc = new DesktopCommanderIntegration();
const file = '/workspace/experiments/dc-remote-engine-acceptance.txt';
function ensure(result) {
  if (result.isError) throw new Error(JSON.stringify(result));
  return result;
}
try {
  await dc.initialize();
  const { tools } = await dc.listClientTools();
  for (const name of ['write_file', 'read_file', 'edit_block', 'start_process', 'interact_with_process', 'force_terminate']) {
    if (!tools.some(t => t.name === name)) throw new Error('Missing tool: ' + name);
  }
  ensure(await dc.callClientTool('write_file', {path:file,content:'remote-engine-before\n',mode:'rewrite'}));
  ensure(await dc.callClientTool('edit_block', {file_path:file,old_string:'remote-engine-before',new_string:'remote-engine-after'}));
  const read = ensure(await dc.callClientTool('read_file', {path:file}));
  if (!JSON.stringify(read).includes('remote-engine-after')) throw new Error('Edited content missing');
  const started = ensure(await dc.callClientTool('start_process', {command:'python3 -i -q',timeout_ms:1000}));
  const pid = Number(JSON.stringify(started).match(/PID\s+(\d+)/i)?.[1]);
  if (!pid) throw new Error('No interactive process ID');
  const interaction = ensure(await dc.callClientTool('interact_with_process', {pid,input:'print("remote-session-verified")',timeout_ms:1000}));
  if (!JSON.stringify(interaction).includes('remote-session-verified')) throw new Error('Interactive process failed');
  ensure(await dc.callClientTool('force_terminate', {pid}));
  console.log(JSON.stringify({engine_tools:tools.length,write_edit_read:true,interactive_session:true,session_termination:true}));
} finally {
  await dc.shutdown();
}

