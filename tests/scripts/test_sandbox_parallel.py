"""V5 worker protocol and real independent-process command execution."""
import importlib.util
import multiprocessing
import os
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
def load():
    spec = importlib.util.spec_from_file_location('parallel_worker', ROOT / 'scripts/ai-docker-sandbox-worker.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module

def run_job(queue, command, cwd, cancel=None):
    worker = load()
    result = worker.execute({'job_id': 'parallel-real-job', 'lease_token': 'fixture',
        'command': command, 'cwd': cwd, 'timeout_seconds': 25}, cancel)
    queue.put(result)

class ParallelTests(unittest.TestCase):
    def test_v5_protocol_uses_unique_identity_only_for_build_transport(self):
        worker = load()
        with patch.object(worker, 'PARALLEL_SLOT', 1):
            payload = worker.worker_payload({'action': 'poll', 'worker_version': 4})
            self.assertEqual(payload['worker_version'], 5)
            self.assertEqual(payload['slot'], 1)
            self.assertRegex(payload['worker_id'], r'^[a-f0-9]{32}$')
            self.assertEqual(worker.worker_payload({'action': 'sync'}, endpoint='auth'), {'action':'sync'})

    def test_parallel_worker_rejects_symlink_cwd_aliases(self):
        worker = load()
        with tempfile.TemporaryDirectory(dir='/workspace/experiments') as root:
            task = Path(root) / 'task'; task.mkdir(); alias = Path(root) / 'alias'; alias.symlink_to(task)
            with patch.object(worker, 'PARALLEL_SLOT', 1):
                with self.assertRaisesRegex(ValueError, 'canonical'):
                    worker.within_workspace(str(alias))
                self.assertEqual(worker.within_workspace(str(task)), task)

    def test_mountinfo_detects_docker_nested_volume_on_same_filesystem(self):
        worker = load()
        with patch.object(worker.os.path, 'ismount', return_value=False), patch.object(worker.Path, 'read_text', return_value='42 1 0:9 /vol /workspace/.auth ro,nosuid - ext4 /dev/test rw\n'):
            self.assertTrue(worker.is_mountpoint(Path('/workspace/.auth')))
            self.assertFalse(worker.is_mountpoint(Path('/workspace/projects')))

    def test_two_real_ten_second_commands_overlap(self):
        ctx = multiprocessing.get_context('spawn'); queue = ctx.Queue()
        started = time.monotonic()
        workers = [ctx.Process(target=run_job, args=(queue, 'sleep 10; printf independent', '/workspace/experiments')) for _ in range(2)]
        for process in workers: process.start()
        results = [queue.get(timeout=20) for _ in workers]
        elapsed = time.monotonic() - started
        for process in workers: process.join(3); self.assertEqual(process.exitcode, 0)
        self.assertTrue(all(r['exit_code'] == 0 and r['stdout'] == 'independent' for r in results))
        self.assertLess(elapsed, 14)
        print(f'Two real 10-second commands: {elapsed:.3f}s', flush=True)

    def test_cancelling_one_process_does_not_interrupt_another(self):
        ctx = multiprocessing.get_context('spawn'); queue = ctx.Queue(); cancellation = ctx.Event()
        a = ctx.Process(target=run_job, args=(queue, 'sleep 10', '/workspace/experiments', cancellation))
        b = ctx.Process(target=run_job, args=(queue, 'sleep 2; printf survivor', '/workspace/experiments'))
        a.start(); b.start(); time.sleep(.3); cancellation.set()
        results = [queue.get(timeout=8) for _ in range(2)]
        a.join(3); b.join(3)
        self.assertEqual(sorted(r['exit_code'] for r in results), [0, 130])
        self.assertIn('survivor', [r['stdout'] for r in results])

if __name__ == '__main__': unittest.main()
