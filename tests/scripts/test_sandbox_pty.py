import datetime
import importlib.util
from pathlib import Path
import sys,time,unittest
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
                self.assertGreaterEqual(len(calls),2)
                self.assertTrue(all(p['version']==3 for p,_ in calls))
                self.assertTrue(all(e.endswith('/sandbox/sessions/worker') for _,e in calls))
            finally:
                stop.set(); thread.join(timeout=2)
if __name__=='__main__': unittest.main()
