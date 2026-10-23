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


if __name__ == '__main__':
    unittest.main()
