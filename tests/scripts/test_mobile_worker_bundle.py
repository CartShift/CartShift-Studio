"""Portable, network-free tests; no Linux runtime, Docker or real bearer needed."""
import ast
import hashlib
import importlib.util
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('builder', ROOT/'scripts/mobile-sandbox/prepare-mobile-worker.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

WORKER = b'''import os
ROLE=os.environ.get('SANDBOX_WORKER_ROLE')
PARALLEL_SLOT=int(os.environ.get('SANDBOX_WORKER_SLOT','0'))
TOKEN=''
EVENTS=[]
def execute(job, cancel_event=None):
    EVENTS.append('execute')
    return {'action':'complete','exit_code':job.get('exit_code',0)}
def activity(event, **fields): return fields
def verify_identity(): assert ROLE=='build' and len(TOKEN)>=32
def main(): raise AssertionError('main must not run during identity probe')
'''
ADAPTER = (ROOT/'scripts/mobile-sandbox/protocol-v3.py').read_bytes()
digest = lambda b: hashlib.sha256(b).hexdigest()

class MobileBundleTests(unittest.TestCase):
    def bundle(self): return builder.build(WORKER, digest(WORKER), ADAPTER, digest(ADAPTER))
    def test_rejects_either_unreviewed_source_pin(self):
        for worker_pin, adapter_pin in [('0'*64,digest(ADAPTER)),(digest(WORKER),'0'*64)]:
            with self.assertRaises(ValueError): builder.build(WORKER, worker_pin, ADAPTER, adapter_pin)
    def test_deterministic_pins_and_compiles_without_running_code(self):
        a=self.bundle();self.assertEqual(a,self.bundle());compile(a,'mobile','exec')
        self.assertIn(digest(WORKER).encode(),a)
    def load(self, role='build', slot='0'):
        ns={'__name__':'test_bundle'}
        with patch.dict(os.environ,{'SANDBOX_WORKER_ROLE':role,'SANDBOX_WORKER_SLOT':slot}):
            exec(compile(self.bundle(),'mobile','exec'),ns)
            return ns,ns['load_worker']()
    def test_refuses_auth_legacy_and_parallel_roles(self):
        for role,slot in [('auth','0'),('legacy','0'),('build','1')]:
            with self.assertRaises(RuntimeError):self.load(role,slot)
    def test_v3_wire_schema_matches_deployed_strict_backend(self):
        _,ns=self.load();payload=ns['worker_payload']
        self.assertEqual(payload({'action':'poll','worker_version':4,'heartbeat':True}),{'action':'poll','worker_version':3,'heartbeat':True})
        self.assertEqual(payload({'action':'heartbeat','busy':True,'job_id':'fixture','lease_token':'x'*40}),{'action':'heartbeat','busy':True,'worker_version':3})
        with self.assertRaises(RuntimeError):payload({'action':'sync'},endpoint='auth')
        data={'action':'complete','worker_version':4,'job_id':'fixture','lease_token':'x'*40,'exit_code':0,'stdout':'','stderr':'','duration_ms':1,'output_truncated':False}
        self.assertNotIn('worker_version',payload(data))
    def test_workspace_flush_precedes_returned_completion(self):
        ns,worker=self.load();events=[];worker['EVENTS']=events
        ns['sync_workspace']=lambda:events.append('flush')
        result=worker['execute']({})
        self.assertEqual(events,['execute','flush'])
        self.assertEqual(result['exit_code'],0)
    def test_flush_failure_stops_worker_without_returning_completion(self):
        ns,worker=self.load()
        def failed_flush():raise OSError('simulated storage error')
        ns['sync_workspace']=failed_flush
        with self.assertRaises(SystemExit):worker['execute']({})
    def test_nonzero_exit_still_flushes_partial_workspace_changes(self):
        ns,worker=self.load();events=[];worker['EVENTS']=events
        ns['sync_workspace']=lambda:events.append('flush')
        result=worker['execute']({'exit_code':7})
        self.assertEqual(events,['execute','flush'])
        self.assertEqual(result['exit_code'],7)
    def sync_fixture(self, result=0, missing=False):
        node=next(n for n in ast.parse(self.bundle()).body if isinstance(n,ast.FunctionDef) and n.name=='sync_workspace')
        events=[]
        def syncfs(fd):events.append(('sync',fd));return result
        lib=types.SimpleNamespace() if missing else types.SimpleNamespace(syncfs=syncfs)
        fake_os=types.SimpleNamespace(O_RDONLY=0,O_DIRECTORY=1,O_CLOEXEC=2,O_NOFOLLOW=4,
            open=lambda path,flags:events.append(('open',path,flags)) or 9,
            close=lambda fd:events.append(('close',fd)))
        ns={'os':fake_os,'ctypes':types.SimpleNamespace(CDLL=lambda *a,**kw:lib,c_int=int,get_errno=lambda:5)}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'durability','exec'),ns)
        return ns['sync_workspace'],events
    def test_syncfs_closes_nofollow_directory_descriptor(self):
        sync,events=self.sync_fixture();sync()
        self.assertEqual(events,[('open','/workspace',7),('sync',9),('close',9)])
    def test_syncfs_error_is_reported_and_descriptor_closed(self):
        sync,events=self.sync_fixture(-1)
        with self.assertRaises(OSError):sync()
        self.assertEqual(events[-1],('close',9))
    def test_missing_syncfs_is_not_silently_accepted(self):
        sync,events=self.sync_fixture(missing=True)
        with self.assertRaises(AttributeError):sync()
        self.assertEqual(events[-1],('close',9))
    def test_activity_reports_actual_v3_protocol(self):
        _,ns=self.load();self.assertEqual(ns['activity']('worker_started',worker_version=4)['worker_version'],3)
    def test_identity_only_never_runs_main_or_consumes_credentials(self):
        ns={'__name__':'__main__'}
        with patch.dict(os.environ,{'SANDBOX_WORKER_ROLE':'build','SANDBOX_WORKER_SLOT':'0'}),patch.object(sys,'argv',['mobile','--identity-only']):
            exec(compile(self.bundle(),'mobile','exec'),ns)
    def test_reviewed_source_matches_mobile_pin_and_loads_build_adapter(self):
        source=(ROOT/'scripts/ai-docker-sandbox-worker.py').read_text().replace('\r\n','\n').encode()
        self.assertEqual(digest(source),'4bc128b5db15f7bf87c34458f3919f6f825ae6fbfa87e6078bc4820b3667ba19')
        ns={'__name__':'test_real_worker'}
        wrapper=builder.build(source,digest(source),ADAPTER,digest(ADAPTER))
        resolve=Path.resolve
        def no_workspace_access(path,*args,**kwargs):
            return path if str(path).replace('\\','/')=='/workspace' else resolve(path,*args,**kwargs)
        # Only import/adapter integration is exercised here. Actual Linux identity
        # and mount checks remain mandatory in the offline Podroid probe.
        modules={} if os.name!='nt' else {'fcntl':types.ModuleType('fcntl'),'pwd':types.ModuleType('pwd')}
        with patch.dict(os.environ,{'SANDBOX_WORKER_ROLE':'build','SANDBOX_WORKER_SLOT':'0'}),patch.dict(sys.modules,modules),patch.object(Path,'resolve',no_workspace_access):
            exec(compile(wrapper,'real-mobile','exec'),ns)
            worker=ns['load_worker']()
        self.assertEqual(worker['ROLE'],'build')
        self.assertEqual(worker['worker_payload']({'action':'poll','worker_version':4}),{'action':'poll','worker_version':3})

if __name__=='__main__':unittest.main()
