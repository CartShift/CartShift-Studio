import datetime
import importlib.util
from pathlib import Path
import sys,time,unittest
import os
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
import sandbox_pty as pty
spec=importlib.util.spec_from_file_location('worker',ROOT/'scripts/ai-docker-sandbox-worker.py')
worker=importlib.util.module_from_spec(spec); spec.loader.exec_module(worker)
def desired():
    import json
    item=json.loads((ROOT/'tests/fixtures/sandbox-session-desired.json').read_text())['session']
    assert type(item['expires_at']) is int
    item['expires_at']=int((time.time()+60)*1000)
    return item
class PTYTests(unittest.TestCase):
    def setUp(self):
        import tempfile
        temporary = tempfile.TemporaryDirectory(prefix='cartshift-pty-fixture-')
        self.addCleanup(temporary.cleanup)
        metadata = patch.object(pty, 'META', Path(temporary.name))
        metadata.start()
        self.addCleanup(metadata.stop)
        for name,filename in (('BACKUP_REQUEST','backup-request'),('BACKUP_BUILD_READY','backup-build-ready'),('BACKUP_AUTH_READY','backup-auth-ready')):
            marker=patch.object(worker,name,Path(temporary.name)/filename)
            marker.start(); self.addCleanup(marker.stop)
    def guardian(self,code):
        original=pty.GuardianState.__init__
        def fixture(state): original(state,[sys.executable,'-u','-c',code])
        with patch.object(pty.GuardianState,'__init__',fixture): g=pty.Guardian()
        self.addCleanup(g.close); return g
    def wait(self,g,predicate):
        deadline=time.monotonic()+4
        while time.monotonic()<deadline:
            s=g.sync()
            if s and predicate(s): return s
            time.sleep(.03)
        self.fail('Fixture deadline exceeded')
    def test_input(self):
        self.assertTrue(pty.valid_input('supabase','verification_code','aabb0099'))
        self.assertTrue(pty.valid_input('firebase','verification_code','4/once-only'))
        self.assertTrue(pty.valid_input('apps-script','verification_code','4/once-only'))
        self.assertFalse(pty.valid_input('northflank','verification_code','4/once-only'))
        self.assertIn('northflank', pty.PROVIDERS)
        self.assertIn('apps-script', pty.PROVIDERS)
        for provider in pty.PROVIDERS:
            for value in ('password','ghp_abc123','eyJabc.def.ghi','a\nb','y\r'):
                self.assertFalse(pty.valid_input(provider,'verification_code',value))
    def test_split_redaction(self):
        r=pty.Redactor()
        out=''.join(r.feed(x) for x in (b'Open https://example.com/device\n gh',b'p_abcdef',b'123\x1b[',b'31m456\x1b[0m \n'))
        self.assertIn('https://example.com/device',out)
        self.assertNotIn('abcdef',out); self.assertNotIn('\x1b',out)
    def test_echo_env_dedup_stop(self):
        code="import os,termios,time; print('echo='+str(bool(termios.tcgetattr(0)[3] & (termios.ECHO|termios.ECHONL)))); print('token='+str('SANDBOX_WORKER_TOKEN' in os.environ)); input('Code: '); print('received'); b=input(); print('second='+b); time.sleep(20)"
        g=self.guardian(code); item=desired(); g.sync(item)
        self.wait(g,lambda s:'echo=False' in s['output'])
        item['pending_input']=dict(input_id='one',input_type='verification_code',input='aabb0099')
        g.sync(item); self.assertEqual(g.sync(item)['ack_input_id'],'one')
        time.sleep(.1); s=g.sync()
        self.assertNotIn('aabb0099',s['output']); self.assertNotIn('second=',s['output']); self.assertIn('token=False',s['output'])
        item['status']='stop_requested'; self.assertEqual(g.sync(item)['status'],'stopped')
    def test_firebase_log_uses_private_provider_cache(self):
        g=self.guardian("import os; print('log='+os.environ.get('FIREBASE_DEBUG_PATH','missing'))")
        item=desired(); item['provider']='firebase'; g.sync(item)
        s=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertIn('log=/workspace/.auth/firebase/.cache/firebase-debug.log',s['output'])
    def test_stateless_cleanup_preserves_login(self):
        g=self.guardian("import time; print('alive'); time.sleep(30)")
        g.sync(desired()); self.wait(g,lambda s:'alive' in s['output'])
        result=worker.execute(dict(job_id='fixture',lease_token='fixture',command='echo success',cwd='/workspace',timeout_seconds=3))
        self.assertEqual(result['exit_code'],0); self.assertNotIn(g.sync()['status'],pty.TERMINAL)
    def test_flood_bound(self):
        g=self.guardian("import sys; sys.stdout.write(('\\u00e9 '*12000+'\\n')*80)")
        g.sync(desired()); s=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertEqual(s['reason'],'output_flood'); self.assertLessEqual(len(s['output'].encode()),24000)
        self.assertEqual(s['cursor']-s['output_start'],len(s['output']))
    def test_absolute_deadline(self):
        g=self.guardian("import time; time.sleep(30)"); item=desired()
        item['expires_at']=int((time.time()+.2)*1000)
        g.sync(item); self.assertEqual(self.wait(g,lambda s:s['status']=='expired')['reason'],'ttl_expired')
    def test_eof_reaps_detached(self):
        g=self.guardian("import subprocess,time; p=subprocess.Popen(['sleep','30'],start_new_session=True); print(p.pid); time.sleep(30)")
        g.sync(desired()); s=self.wait(g,lambda s:s['output'].strip().isdigit()); pid=int(s['output'].strip())
        g.close(); self._cleanups.pop(); self.assertIsNone(pty.ticks(pid))
    def test_invalid_request(self):
        g=self.guardian("raise Exception('must never run')")
        for key,value in (('provider','shell'),('cwd','/etc')):
            item=desired(); item[key]=value
            with self.assertRaises(ValueError): g.sync(item)
        self.assertIsNone(g.sync())
    def test_null_desired_stops_and_tty_is_controlling(self):
        g=self.guardian("import os,time; f=open('/dev/tty'); print('tty='+str(os.isatty(f.fileno()))); time.sleep(30)")
        g.sync(desired()); self.wait(g,lambda s:'tty=True' in s['output'])
        self.assertEqual(g.sync(None)['status'],'stopped')
    def test_idle_expiry_without_sync_or_output_activity(self):
        original=pty.GuardianState.start
        def fast_idle(state,item):
            original(state,item); state.idle=.15
        with patch.object(pty.GuardianState,'start',fast_idle):
            g=self.guardian("import time; print('prompt'); time.sleep(30)")
        g.sync(desired()); time.sleep(.3)
        self.assertEqual(g.sync()['reason'],'idle_expired')
    def test_labelled_secret_split_across_whitespace(self):
        r=pty.Redactor()
        out=r.feed(b'access_token: ')+r.feed(b'do-not-publish-me ')
        self.assertNotIn('do-not-publish-me',out)
    def test_crash_recovery_verifies_start_ticks(self):
        import ctypes,os,signal
        ctypes.CDLL(None).prctl(36,1,0,0,0)
        g=self.guardian("import subprocess,time; p=subprocess.Popen(['sleep','30'],start_new_session=True); print(p.pid); time.sleep(30)")
        g.sync(desired()); snap=self.wait(g,lambda s:s['output'].strip().isdigit())
        detached=int(snap['output'].strip()); time.sleep(.1)
        os.kill(g.pid,signal.SIGKILL); os.waitpid(g.pid,0)
        g.socket.close(); self._cleanups.pop()
        pty.recover(); pty.reap_all()
        self.assertIsNone(pty.ticks(detached))
    def test_pid_reuse_guard_does_not_kill_unrelated_child(self):
        import json,os,subprocess
        p=subprocess.Popen(['sleep','30'])
        try:
            pty.META.mkdir(mode=0o700,exist_ok=True)
            record=pty.META/'stale-fixture.json'
            record.write_text(json.dumps(dict(guardian=99999999,guardian_ticks='1',children=[dict(pid=p.pid,ticks='incorrect-start-ticks')])))
            pty.recover(); self.assertIsNone(p.poll())
        finally:
            p.kill(); p.wait()
    def test_sessions_transport_continues_during_stateless_execute(self):
        import threading
        g=self.guardian("import time; print('login active'); time.sleep(30)")
        stop=threading.Event(); calls=[]; item=desired()
        def api(payload,endpoint=None):
            calls.append((payload,endpoint)); return {'session':item}
        with patch.object(worker,'call_api',side_effect=api):
            thread=threading.Thread(target=worker.sessions_sync_loop,args=(stop,g))
            thread.start()
            try:
                self.wait(g,lambda s:'login active' in s['output'])
                result=worker.execute(dict(job_id='fixture',lease_token='fixture',command='sleep 1.2; echo done',cwd='/workspace',timeout_seconds=3))
                self.assertEqual(result['exit_code'],0)
                # Let the independently scheduled transport publish its next
                # 1s poll; a busy CI runner can delay the tick beyond 1.2s.
                deadline=time.monotonic()+2
                while len(calls)<2 and time.monotonic()<deadline:
                    time.sleep(.05)
                self.assertGreaterEqual(len(calls),2)
                self.assertTrue(all(p['version']==3 for p,_ in calls))
                self.assertTrue(all(e.endswith('/sandbox/sessions/worker') for _,e in calls))
            finally:
                stop.set(); thread.join(timeout=2)
    def test_confirm_sends_carriage_return_to_raw_terminal(self):
        code = "import os,tty,sys; tty.setraw(0); print('ready'); data=b''.join(os.read(0,1) for _ in range(2)); print('enter='+str(data[-1])); sys.exit(0 if data==b'n\\r' else 1)"
        g=self.guardian(code); item=desired(); item['provider']='github'
        g.sync(item); self.wait(g,lambda s:'ready' in s['output'])
        item['pending_input']=dict(input_id='raw-confirm',input_type='confirm',input='n')
        g.sync(item); snap=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertEqual(snap['exit_code'],0)
        self.assertIn('enter=13',snap['output'])
    def test_confirm_preserves_canonical_line_input(self):
        g=self.guardian("value=input('confirm: '); print('accepted='+value)")
        item=desired(); item['provider']='github'
        g.sync(item); self.wait(g,lambda s:'confirm:' in s['output'])
        item['pending_input']=dict(input_id='line-confirm',input_type='confirm',input='n')
        g.sync(item); snap=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertEqual(snap['exit_code'],0)
        self.assertIn('accepted=n',snap['output'])
    def test_terminal_has_fixed_dimensions(self):
        code="import os,sys; size=os.get_terminal_size(0); print('size='+str(tuple(size))); sys.exit(0 if tuple(size)==(120,30) else 1)"
        g=self.guardian(code); g.sync(desired())
        snap=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertEqual(snap['exit_code'],0)
        self.assertIn('size=(120, 30)',snap['output'])
    def test_split_cursor_queries_and_clamped_positions(self):
        terminal=pty.TerminalQueries()
        self.assertEqual(terminal.feed(b'\x1b[999;99'),b'')
        self.assertEqual(terminal.feed(b'9f\x1b['),b'')
        self.assertEqual(terminal.feed(b'6n'),b'\x1b[30;120R')
        self.assertEqual(terminal.feed(b'\x1b[0;0H\x1b[6n'),b'\x1b[1;1R')
        self.assertEqual(terminal.feed(b'\x1b[5n'),b'')
    def test_terminal_query_memory_and_response_limits(self):
        terminal=pty.TerminalQueries()
        self.assertEqual(terminal.feed(b'\x1b['+b'9'*5000),b'')
        self.assertLessEqual(len(terminal.pending),64)
        terminal.feed(b'\x1b[6n'*64)
        with self.assertRaises(OverflowError): terminal.feed(b'\x1b[6n')
    def test_raw_cli_waiting_for_cursor_report_then_confirm(self):
        code="import os,tty,sys; tty.setraw(0); os.write(1,b'\\x1b[999;999f\\x1b[6n'); response=b''\nwhile not response.endswith(b'R'): response+=os.read(0,1)\nprint('ready'); value=b''.join(os.read(0,1) for _ in range(2)); sys.exit(0 if response==b'\\x1b[30;120R' and value==b'n\\r' else 1)"
        g=self.guardian(code); item=desired(); item['provider']='github'
        g.sync(item); self.wait(g,lambda s:'ready' in s['output'])
        item['pending_input']=dict(input_id='cursor-confirm',input_type='confirm',input='n')
        g.sync(item); snap=self.wait(g,lambda s:s['status'] in pty.TERMINAL)
        self.assertEqual(snap['exit_code'],0)
    def test_terminal_replies_handle_backpressure_and_partial_write(self):
        state=pty.GuardianState(); state.master=99999
        state.terminal_replies=bytearray(b'report'); state.activity=123
        with patch.object(pty.os,'write',side_effect=BlockingIOError()):
            state.flush_terminal_replies()
        self.assertEqual(state.terminal_replies,b'report')
        with patch.object(pty.os,'write',return_value=2):
            state.flush_terminal_replies()
        self.assertEqual(state.terminal_replies,b'port')
        self.assertEqual(state.activity,123)
    def test_recovery_discovers_unrecorded_descendants_before_killing_parent(self):
        import ctypes,json,subprocess,signal
        self.assertEqual(ctypes.CDLL(None).prctl(36,1,0,0,0),0)
        parent=subprocess.Popen([sys.executable,'-u','-c',
            "import subprocess,time; child=subprocess.Popen(['sleep','30'],start_new_session=True); print(child.pid,flush=True); time.sleep(30)"],stdout=subprocess.PIPE,text=True)
        child=int(parent.stdout.readline().strip())
        try:
            record=pty.META/'unrecorded-child.json'
            record.write_text(json.dumps(dict(guardian=99999999,guardian_ticks='1',
                children=[dict(pid=parent.pid,ticks=pty.ticks(parent.pid))])))
            pty.recover(); parent.wait(timeout=3)
            deadline=time.monotonic()+2
            while pty.ticks(child) is not None and time.monotonic()<deadline:
                try: os.waitpid(child,os.WNOHANG)
                except ChildProcessError: pass
                time.sleep(.01)
            self.assertIsNone(pty.ticks(child))
        finally:
            for pid in (child,parent.pid):
                try: os.kill(pid,signal.SIGKILL)
                except ProcessLookupError: pass
            parent.wait(); parent.stdout.close()
    def test_concurrent_sync_keeps_each_request_with_its_response(self):
        import json,threading
        class Transport:
            def __init__(self): self.message=None; self.overlap=False
            def sendall(self,data):
                if self.message is not None: self.overlap=True
                self.message=json.loads(data)['desired']
                time.sleep(.01) # Give another caller a chance to interleave.
            def recv(self,size):
                message=self.message; self.message=None
                return (json.dumps(dict(session=message))+'\n').encode()
        guardian=object.__new__(pty.Guardian)
        guardian.socket=Transport(); guardian.buffer=b''
        guardian._sync_lock=threading.Lock()
        barrier=threading.Barrier(6); errors=[]
        def request(number):
            try:
                barrier.wait()
                for turn in range(3):
                    item=dict(caller=number,turn=turn)
                    self.assertEqual(guardian.sync(item),item)
            except BaseException as error: errors.append(error)
        threads=[threading.Thread(target=request,args=(number,)) for number in range(6)]
        for thread in threads: thread.start()
        for thread in threads: thread.join(timeout=3)
        self.assertFalse(any(thread.is_alive() for thread in threads))
        self.assertEqual(errors,[])
        self.assertFalse(guardian.socket.overlap)
    def pending_input_state(self):
        state=pty.GuardianState(); state.master=99999; state.process=object()
        state.provider='supabase'; state.activity=123
        state.snapshot=dict(session_id='queued-input',ack_input_id=None)
        item=dict(session_id='queued-input',status='running',pending_input=dict(
            input_id='queued-once',input_type='verification_code',input='aabb0099'))
        return state,item
    def test_input_backpressure_does_not_ack_or_drop_input(self):
        state,item=self.pending_input_state()
        with patch.object(pty.os,'write',side_effect=BlockingIOError()):
            state.apply(item); state.apply(item)
        self.assertIsNone(state.snapshot['ack_input_id'])
        self.assertEqual(state.pending_input_bytes,b'aabb0099\r')
        self.assertEqual(state.activity,123)
        delivered=[]
        def complete(fd,data): delivered.append(bytes(data)); return len(data)
        with patch.object(pty.os,'write',side_effect=complete): state.flush_input()
        self.assertEqual(delivered,[b'aabb0099\r'])
        self.assertEqual(state.snapshot['ack_input_id'],'queued-once')
        with patch.object(pty.os,'write') as write:
            state.apply(item)
        write.assert_not_called()
    def test_input_partial_writes_ack_only_complete_delivery(self):
        state,item=self.pending_input_state(); delivered=[]
        def partial(fd,data):
            delivered.append(bytes(data[:2])); return min(2,len(data))
        with patch.object(pty.os,'write',side_effect=partial):
            state.apply(item)
            self.assertIsNone(state.snapshot['ack_input_id'])
            self.assertEqual(state.pending_input_bytes,b'bb0099\r')
            while state.pending_input_bytes: state.flush_input()
        self.assertEqual(b''.join(delivered),b'aabb0099\r')
        self.assertEqual(state.snapshot['ack_input_id'],'queued-once')
    def test_input_queue_rejects_second_entry_until_delivery(self):
        state,item=self.pending_input_state()
        with patch.object(pty.os,'write',side_effect=BlockingIOError()): state.apply(item)
        item['pending_input']['input_id']='second-entry'
        with self.assertRaisesRegex(ValueError,'pending'): state.apply(item)
        self.assertLessEqual(len(state.pending_input_bytes),513)
    @unittest.skipUnless(os.environ.get('CARTSHIFT_TEST_REAL_GH_DECLINE')=='1','Opt-in: decline existing GitHub authentication only')
    def test_real_installed_github_decline_completes(self):
        import ctypes
        self.assertEqual(ctypes.CDLL(None).prctl(36,1,0,0,0),0)
        state=pty.GuardianState()
        self.addCleanup(state.finish,'stopped','stopped')
        item=desired(); item['provider']='github'; state.apply(item)
        deadline=time.monotonic()+4; declined=False
        while time.monotonic()<deadline and state.process:
            state.tick()
            if not declined and 're-authenticate?' in state.snapshot['output'] and state.terminal_queries.responses>=2:
                item['pending_input']=dict(input_id='real-gh-decline-only',input_type='confirm',input='n')
                state.apply(item); declined=True
            time.sleep(.02)
        self.assertTrue(declined,'Expected existing-auth confirmation; no other input was sent')
        self.assertEqual(state.snapshot['status'],'completed')
        self.assertEqual(state.snapshot['exit_code'],0)
if __name__=='__main__': unittest.main()