"""Regression tests for V4 sandbox artifact and cooperative cancellation paths."""
import base64
import importlib.util
import json
import os
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('sandbox_worker_v4', ROOT / 'scripts/ai-docker-sandbox-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class SandboxV4Tests(unittest.TestCase):
    def test_isolated_roles_fail_closed_in_legacy_unsegmented_container(self):
        with patch.object(worker, 'TOKEN', 'a' * 48):
            with patch.object(worker, 'ROLE', 'legacy'):
                worker.verify_identity()  # existing V3 compatible startup
            with patch.object(worker, 'ROLE', 'build'):
                with self.assertRaisesRegex(RuntimeError, 'shadow mount'):
                    worker.verify_identity()
            with patch.object(worker, 'ROLE', 'auth'):
                with self.assertRaisesRegex(RuntimeError, 'shared project access'):
                    worker.verify_identity()

    def test_active_job_marker_gates_restart_and_cleans_success(self):
        import tempfile
        with tempfile.TemporaryDirectory(dir='/workspace/experiments') as tmp:
            marker = Path(tmp) / 'active'
            with patch.object(worker, 'ACTIVE_JOB_MARKER', marker), patch.object(worker, 'JOB_RECOVERY_GUARD', True):
                result = worker.execute({'job_id':'marker-test', 'lease_token':'lease',
                    'command':'true', 'cwd':'/workspace', 'timeout_seconds':2})
                self.assertEqual(result['exit_code'],0)
                self.assertFalse(marker.exists())
                marker.touch()
                with patch.object(worker, 'TOKEN', 'a' * 48):
                    with self.assertRaisesRegex(RuntimeError, 'incomplete process cleanup'):
                        worker.verify_identity()

    def auth_topology(self, mounts=None, writable_tools=None, readonly_auth=False, projects=False):
        from contextlib import ExitStack
        from types import SimpleNamespace
        stack=ExitStack(); self.addCleanup(stack.close)
        mounts=mounts if mounts is not None else {'.auth','scripts','toolchain'}
        stack.enter_context(patch.object(worker,'TOKEN','a'*48))
        stack.enter_context(patch.object(worker,'ROLE','auth'))
        stack.enter_context(patch.object(worker.platform,'node',return_value='ai-auth-sandbox'))
        stack.enter_context(patch.object(worker.Path,'exists',lambda path: projects if str(path)=='/workspace/projects' else False))
        stack.enter_context(patch.object(worker.Path,'is_dir',lambda path: str(path) in {'/workspace/.auth','/workspace/scripts','/workspace/toolchain'}))
        stack.enter_context(patch.object(worker.Path,'is_file',lambda path: str(path)=='/workspace/scripts/devctl'))
        stack.enter_context(patch.object(worker.os.path,'ismount',lambda path: Path(path).name in mounts))
        def filesystem(path):
            readonly=(Path(path).name!='.auth' and Path(path).name!=writable_tools) or (Path(path).name=='.auth' and readonly_auth)
            return SimpleNamespace(f_flag=worker.os.ST_RDONLY if readonly else 0)
        stack.enter_context(patch.object(worker.os,'statvfs',side_effect=filesystem))
    def test_auth_role_accepts_separate_credential_and_readonly_tool_mounts(self):
        self.auth_topology(); worker.verify_identity()
    def test_auth_role_rejects_directory_only_topology(self):
        self.auth_topology(mounts=set())
        with self.assertRaisesRegex(RuntimeError,'mount'): worker.verify_identity()
    def test_auth_role_rejects_each_writable_tool_mount(self):
        for tool in ('scripts','toolchain'):
            with self.subTest(tool=tool):
                self.auth_topology(writable_tools=tool)
                with self.assertRaisesRegex(RuntimeError,'read-only'): worker.verify_identity()
    def test_auth_role_rejects_readonly_credential_mount(self):
        self.auth_topology(readonly_auth=True)
        with self.assertRaisesRegex(RuntimeError,'writable'): worker.verify_identity()
    def test_auth_role_rejects_shared_projects(self):
        self.auth_topology(projects=True)
        with self.assertRaisesRegex(RuntimeError,'shared project'): worker.verify_identity()

    def test_cancellation_kills_running_process_group(self):
        cancelled = threading.Event()
        timer = threading.Timer(.2, cancelled.set)
        timer.start()
        try:
            result = worker.execute({'job_id': 'cancelled-job', 'lease_token': 'lease',
                'command': 'sleep 5', 'cwd': '/workspace', 'timeout_seconds': 6}, cancelled)
            self.assertEqual(result['exit_code'], 130)
            self.assertLess(result['duration_ms'], 2500)
        finally:
            timer.cancel()

    def test_binary_artifact_roundtrip_and_chunk_hash(self):
        import hashlib
        file = Path('/workspace/artifacts/v4-test-binary.tmp')
        original = bytes(range(256)) * 2
        file.write_bytes(original)
        try:
            result = worker.execute_artifact({'job_id':'artifact-test','lease_token':'lease',
                'artifact_path': file.name,'offset':17,'length':73})
            self.assertEqual(result['exit_code'], 0)
            payload = json.loads(result['stdout'])
            self.assertEqual(payload['offset'],17)
            self.assertEqual(payload['total_bytes'],len(original))
            self.assertEqual(base64.b64decode(payload['base64']), original[17:90])
            self.assertEqual(payload['sha256'],hashlib.sha256(original[17:90]).hexdigest())
        finally:
            file.unlink(missing_ok=True)

    def test_artifact_path_traversal_and_symlink_rejected(self):
        root = Path('/workspace/artifacts')
        alias = root / 'v4-test-link'
        alias.symlink_to('/workspace/README.md')
        try:
            for path in ('../README.md', '.auth/github', alias.name):
                result = worker.execute_artifact({'job_id':'artifact-test','lease_token':'lease',
                    'artifact_path':path,'offset':0,'length':500})
                self.assertEqual(result['exit_code'],1)
                self.assertNotIn('README',result['stderr'])
        finally:
            alias.unlink(missing_ok=True)

    def test_cancellation_heartbeat_only_signals_matching_job(self):
        class Stop:
            def __init__(self): self.calls = 0
            def wait(self, timeout):
                self.calls += 1
                return self.calls > 1
        cancel = threading.Event()
        calls = []
        def reply(request):
            calls.append(request)
            return {'cancel_requested':True}
        with patch.object(worker, 'call_api', side_effect=reply):
            worker.busy_heartbeat_loop(Stop(), threading.Event(), {'current':('job-123','lease',cancel)})
        self.assertFalse(cancel.is_set()) # idle signal is never eligible
        busy = threading.Event()
        busy.set()
        with patch.object(worker, 'call_api', side_effect=reply):
            worker.busy_heartbeat_loop(Stop(), busy, {'current':('job-123','lease',cancel)})
        self.assertTrue(cancel.is_set())
        self.assertEqual(calls[-1]['worker_version'],4)
        self.assertEqual(calls[-1]['job_id'],'job-123')



class BackupMaintenanceTests(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.temporary=tempfile.TemporaryDirectory(prefix='sandbox-backup-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name); self.nonce='a'*32
        for name,filename in (('BACKUP_REQUEST','request'),('BACKUP_BUILD_READY','build-ready'),('BACKUP_AUTH_READY','auth-ready')):
            item=patch.object(worker,name,self.root/filename,create=True)
            item.start(); self.addCleanup(item.stop)
    def request(self):
        worker.BACKUP_REQUEST.write_text(self.nonce+'\n')
        worker.BACKUP_REQUEST.chmod(0o600)
    def embedded_host_program(self):
        source=(ROOT/'scripts/sandbox-host/Common-SandboxBackupBarrier.ps1').read_text()
        prefix="$script:SandboxBackupMarkerPython=@'"+chr(10)
        self.assertEqual(source.count(prefix),1)
        program=source.split(prefix,1)[1].split(chr(10)+"'@",1)[0]
        root_open="root=os.open('/tmp',"
        self.assertEqual(program.count(root_open),1)
        return program.replace(root_open,'root=os.open('+repr(str(self.root))+',',1)
    def host_marker(self,program,action,roles='build,auth'):
        import subprocess,sys
        result=subprocess.run([sys.executable,'-I','-c',program,action,self.nonce,roles],
            capture_output=True,text=True,timeout=5)
        self.assertEqual(result.returncode,0,result.stderr)
        return result.stdout.strip()
    def test_real_host_program_worker_barrier_roundtrip(self):
        program=self.embedded_host_program()
        with patch.object(worker,'BACKUP_REQUEST',self.root/'cartshift-backup-request'), \
             patch.object(worker,'BACKUP_BUILD_READY',self.root/'cartshift-backup-build-ready'), \
             patch.object(worker,'BACKUP_AUTH_READY',self.root/'cartshift-backup-auth-ready'):
            self.assertEqual(self.host_marker(program,'request'),'requested')
            request=worker.BACKUP_REQUEST.stat()
            self.assertEqual(worker.BACKUP_REQUEST.read_bytes(),self.nonce.encode('ascii')+bytes([10]))
            self.assertEqual(self.host_marker(program,'check'),'waiting')
            self.assertTrue(worker.backup_pause_requested(worker.BACKUP_BUILD_READY,idle=True))
            self.assertEqual(self.host_marker(program,'check'),'waiting')
            self.assertTrue(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=False))
            self.assertEqual(self.host_marker(program,'check'),'waiting')
            self.assertTrue(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True))
            self.assertEqual(self.host_marker(program,'check'),'ready')
            after=worker.BACKUP_REQUEST.stat()
            self.assertEqual((request.st_dev,request.st_ino),(after.st_dev,after.st_ino))
            self.assertEqual(self.host_marker(program,'cleanup'),'cleared')
            self.assertFalse(worker.backup_pause_requested(worker.BACKUP_BUILD_READY,idle=True))
            self.assertFalse(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True))
    def test_ready_file_mode_is_private_even_with_restrictive_umask(self):
        self.request(); previous=os.umask(0o777)
        try: self.assertTrue(worker.backup_pause_requested(worker.BACKUP_BUILD_READY,idle=True))
        finally: os.umask(previous)
        self.assertEqual(worker.BACKUP_BUILD_READY.stat().st_mode & 0o777,0o600)
    def test_nonce_accepts_only_exact_hex_with_optional_real_lf(self):
        for suffix,valid in ((b'',True),(bytes([10]),True),(bytes([13,10]),False),
                (bytes([10,10]),False),(bytes([92,110]),False),(b' ',False)):
            with self.subTest(suffix=suffix):
                worker.BACKUP_REQUEST.write_bytes(self.nonce.encode('ascii')+suffix)
                if valid:
                    self.assertTrue(worker.backup_pause_requested(worker.BACKUP_BUILD_READY,idle=True))
                    self.assertEqual(worker.BACKUP_BUILD_READY.read_bytes(),self.nonce.encode('ascii')+bytes([10]))
                else:
                    with self.assertRaises(RuntimeError): worker.backup_pause_requested(worker.BACKUP_BUILD_READY,idle=True)
    def test_future_timestamp_and_hardlinked_request_fail_closed(self):
        self.request(); future=time.time()+120
        os.utime(worker.BACKUP_REQUEST,(future,future))
        with self.assertRaises(RuntimeError): worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True)
        os.utime(worker.BACKUP_REQUEST,None)
        os.link(worker.BACKUP_REQUEST,self.root/'request-alias')
        with self.assertRaises(RuntimeError): worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True)
    def test_readiness_only_when_idle_and_removed_on_resume(self):
        self.request()
        self.assertTrue(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=False))
        self.assertFalse(worker.BACKUP_AUTH_READY.exists())
        self.assertTrue(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True))
        self.assertEqual(worker.BACKUP_AUTH_READY.read_text(),self.nonce+'\n')
        worker.BACKUP_REQUEST.unlink()
        self.assertFalse(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True))
        self.assertFalse(worker.BACKUP_AUTH_READY.exists())
    def test_stale_request_expires_and_clears_readiness(self):
        self.request(); worker.BACKUP_AUTH_READY.write_text(self.nonce+'\n')
        expired=time.time()-3601
        os.utime(worker.BACKUP_REQUEST,(expired,expired))
        self.assertFalse(worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True))
        self.assertFalse(worker.BACKUP_AUTH_READY.exists())
    def test_symlink_request_and_readiness_fail_closed(self):
        target=self.root/'target'; target.write_text(self.nonce+'\n')
        worker.BACKUP_REQUEST.symlink_to(target)
        with self.assertRaises(RuntimeError): worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True)
        worker.BACKUP_REQUEST.unlink(); self.request()
        worker.BACKUP_AUTH_READY.symlink_to(target)
        with self.assertRaises(RuntimeError): worker.backup_pause_requested(worker.BACKUP_AUTH_READY,idle=True)
        self.assertEqual(target.read_text(),self.nonce+'\n')
    def test_build_main_cannot_lease_while_ready_and_resumes_after_request_removed(self):
        from contextlib import ExitStack
        from unittest.mock import Mock
        self.request(); stop=Mock(); stop.is_set.return_value=False
        busy=Mock(); busy.is_set.return_value=False
        def wait(seconds):
            self.assertEqual(worker.BACKUP_BUILD_READY.read_text(),self.nonce+'\n')
            worker.BACKUP_REQUEST.unlink(); return False
        stop.wait.side_effect=wait
        def poll(payload):
            self.assertFalse(worker.BACKUP_REQUEST.exists())
            self.assertFalse(worker.BACKUP_BUILD_READY.exists())
            raise KeyboardInterrupt
        with ExitStack() as stack:
            for name,value in (('ROLE','build'),('TOKEN',''),('DOCKER_ACTIVITY_LOG',False),('JOB_RECOVERY_GUARD',False)):
                stack.enter_context(patch.object(worker,name,value))
            stack.enter_context(patch.object(worker,'protect_credential'))
            stack.enter_context(patch.object(worker,'verify_identity'))
            stack.enter_context(patch.object(worker,'activity'))
            stack.enter_context(patch.object(worker.os,'chdir'))
            stack.enter_context(patch.object(worker,'open',create=True))
            stack.enter_context(patch.object(worker.fcntl,'flock'))
            stack.enter_context(patch.dict(worker.os.environ,{},clear=True))
            stack.enter_context(patch.object(worker.sys,'argv',[]))
            stack.enter_context(patch.object(worker.threading,'Event',side_effect=[stop,busy]))
            stack.enter_context(patch.object(worker.threading,'Thread'))
            api=stack.enter_context(patch.object(worker,'call_api',side_effect=poll))
            self.assertEqual(worker.main(),0)
            api.assert_called_once()
    def test_auth_does_not_start_desired_returned_after_maintenance_request(self):
        from unittest.mock import Mock
        stop=Mock(); stop.is_set.return_value=False
        guardian=Mock(); guardian.sync.return_value=None
        def reply(payload,endpoint=None):
            self.request()
            return dict(session=dict(session_id='must-not-start',status='pending'))
        def wait(seconds):
            self.assertEqual(worker.BACKUP_AUTH_READY.read_text(),self.nonce+'\n')
            stop.is_set.return_value=True
            return True
        stop.wait.side_effect=wait
        with patch.object(worker,'call_api',side_effect=reply) as api:
            worker.sessions_sync_loop(stop,guardian)
        api.assert_called_once(); guardian.sync.assert_called_once_with()
    def test_active_auth_finishes_locally_before_ready_without_fetching(self):
        from unittest.mock import Mock
        self.request(); stop=Mock(); stop.is_set.return_value=False
        guardian=Mock(); guardian.sync.side_effect=[dict(status='running'),dict(status='completed')]
        waits=[]
        def wait(seconds):
            waits.append(seconds)
            if len(waits)==1: self.assertFalse(worker.BACKUP_AUTH_READY.exists())
            else:
                self.assertEqual(worker.BACKUP_AUTH_READY.read_text(),self.nonce+'\n')
                stop.is_set.return_value=True
            return stop.is_set.return_value
        stop.wait.side_effect=wait
        with patch.object(worker,'call_api') as api: worker.sessions_sync_loop(stop,guardian)
        api.assert_not_called(); self.assertEqual(guardian.sync.call_count,2)

if __name__ == '__main__':
    unittest.main()
