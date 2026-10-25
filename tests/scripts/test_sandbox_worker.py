"""Real subprocess regressions for the container command worker (stdlib only)."""
import importlib.util
import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('sandbox_worker', ROOT / 'scripts/ai-docker-sandbox-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class ActivityLoggingTests(unittest.TestCase):
    def test_metadata_only_atomic_nonblocking_sink(self):
        with patch.object(worker, 'DOCKER_ACTIVITY_LOG', True), patch.object(worker.os, 'open', return_value=123) as opened, patch.object(worker.os, 'write') as written, patch.object(worker.os, 'close') as closed:
            worker.activity('job_finished', job_id='safe-job', exit_code=124, timed_out=True,
                            command='private command', stdout='private output', token='private credential',
                            status='invalid\nforged', duration_ms=1000)
        opened.assert_called_once_with('/proc/1/fd/1', os.O_WRONLY | os.O_NONBLOCK | os.O_CLOEXEC)
        closed.assert_called_once_with(123)
        fd, raw = written.call_args.args
        self.assertEqual(fd, 123)
        self.assertLess(len(raw), 4096)
        self.assertEqual(raw.count(b'\n'), 1)
        data = json.loads(raw)
        self.assertEqual(data['job_id'], 'safe-job')
        self.assertEqual(data['exit_code'], 124)
        self.assertTrue(data['timed_out'])
        self.assertFalse({'command', 'stdout', 'token', 'status'} & data.keys())
        self.assertNotIn(b'private', raw)

    def test_unavailable_or_full_pipe_cannot_fail_worker(self):
        with patch.object(worker, 'DOCKER_ACTIVITY_LOG', True), patch.object(worker.os, 'open', side_effect=PermissionError):
            worker.activity('heartbeat', busy=True)
        with patch.object(worker, 'DOCKER_ACTIVITY_LOG', True), patch.object(worker.os, 'open', return_value=123), patch.object(worker.os, 'write', side_effect=BlockingIOError), patch.object(worker.os, 'close') as closed:
            worker.activity('heartbeat', busy=True)
        closed.assert_called_once_with(123)

    def test_unknown_events_and_disabled_logging_do_not_open_sink(self):
        with patch.object(worker.os, 'open') as opened:
            worker.activity('job_started')
            with patch.object(worker, 'DOCKER_ACTIVITY_LOG', True):
                worker.activity('arbitrary-secret')
        opened.assert_not_called()

    def test_real_job_events_do_not_include_command_or_output(self):
        events = []
        with patch.object(worker, 'activity', side_effect=lambda event, **fields: events.append((event, fields))):
            result = worker.execute({'job_id': 'logging-test', 'lease_token': 'private-lease',
                'command': 'printf private-output', 'cwd': '/workspace', 'timeout_seconds': 2})
        self.assertEqual(result['stdout'], 'private-output')
        self.assertEqual([event for event, _ in events], ['job_started', 'job_finished'])
        self.assertNotIn('private', json.dumps(events))
        self.assertEqual(events[-1][1]['stdout_bytes'], 14)

    def test_progress_event_for_long_running_command(self):
        with patch.object(worker, 'HEARTBEAT_SECONDS', .05), patch.object(worker, 'activity') as logged:
            worker.execute({'job_id': 'progress-test', 'lease_token': 'private-lease',
                'command': 'sleep .2', 'cwd': '/workspace', 'timeout_seconds': 2})
        self.assertIn('job_progress', [call.args[0] for call in logged.call_args_list])

    def test_real_timeout_is_visible(self):
        with patch.object(worker, 'activity') as logged:
            result = worker.execute({'job_id': 'timeout-test', 'lease_token': 'private-lease',
                'command': 'sleep 3', 'cwd': '/workspace', 'timeout_seconds': 1})
        self.assertEqual(result['exit_code'], 124)
        finished = [call for call in logged.call_args_list if call.args == ('job_finished',)][0]
        self.assertTrue(finished.kwargs['timed_out'])


class WorkerExecutionTests(unittest.TestCase):
    def run_job(self, command, timeout=3, cwd='/workspace'):
        return worker.execute({'job_id': 'regression-job-1234', 'lease_token': 'test-lease-' * 4,
                               'command': command, 'cwd': cwd, 'timeout_seconds': timeout})

    def test_actual_exit_stdout_stderr(self):
        result = self.run_job("printf hello; printf failure >&2; exit 7")
        self.assertEqual(result['exit_code'], 7)
        self.assertEqual(result['stdout'], 'hello')
        self.assertEqual(result['stderr'], 'failure')

    def test_home_matches_existing_nonroot_account(self):
        result = self.run_job('printf "%s" "$HOME"; test -d "$HOME" && test -w "$HOME"')
        self.assertEqual(result['stdout'], '/home/node')
        self.assertEqual(result['exit_code'], 0)

    def test_worker_credential_excluded_from_command_environment(self):
        with patch.dict(os.environ, {'SANDBOX_WORKER_TOKEN': 'not-a-real-credential'}):
            result = self.run_job('env')
        self.assertNotIn('SANDBOX_WORKER_TOKEN', result['stdout'])
        self.assertNotIn('not-a-real-credential', result['stdout'])

    def test_timeout_when_command_closes_output_pipes(self):
        result = self.run_job('exec 1>/dev/null 2>/dev/null; sleep 5', timeout=1)
        self.assertLess(result['duration_ms'], 2500)
        self.assertEqual(result['exit_code'], 124)
        self.assertIn('timed out', result['stderr'])

    def test_timeout_kills_background_descendants(self):
        marker = Path('/workspace/experiments/worker-timeout-descendant.txt')
        marker.unlink(missing_ok=True)
        result = self.run_job('(sleep 2; printf leaked > /workspace/experiments/worker-timeout-descendant.txt) & wait', timeout=1)
        self.assertEqual(result['exit_code'], 124)
        time.sleep(1.3)
        self.assertFalse(marker.exists())

    def test_detached_descendant_does_not_survive_completion(self):
        marker = Path('/workspace/experiments/worker-detached-descendant.txt')
        marker.unlink(missing_ok=True)
        ready = Path('/workspace/experiments/worker-detached-ready.txt')
        ready.unlink(missing_ok=True)
        result = self.run_job("setsid sh -c 'printf ready > /workspace/experiments/worker-detached-ready.txt; sleep 1; printf leaked > /workspace/experiments/worker-detached-descendant.txt; sleep 20' >/dev/null 2>&1 & child=$!; while [ ! -f /workspace/experiments/worker-detached-ready.txt ]; do sleep .02; done; echo $child")
        detached_pid = int(result['stdout'].strip())
        try:
            time.sleep(1.3)
            self.assertFalse(marker.exists())
        finally:
            try:
                os.killpg(detached_pid, 9)
            except ProcessLookupError:
                pass
            marker.unlink(missing_ok=True)
            ready.unlink(missing_ok=True)

    def test_cleanup_wait_failure_marks_container_unsafe(self):
        import subprocess
        with tempfile.TemporaryDirectory(dir='/workspace/experiments') as tmp:
            marker = Path(tmp) / 'unsafe'
            with patch.object(worker, 'UNSAFE_MARKER', marker):
                with patch.object(subprocess.Popen, 'wait', side_effect=subprocess.TimeoutExpired('test', 5)):
                    with self.assertRaisesRegex(RuntimeError, 'cleanup failed'):
                        self.run_job('true')
                self.assertTrue(marker.exists())
                with self.assertRaisesRegex(RuntimeError, 'restart required'):
                    worker.verify_identity()

    def slow_heartbeat_job(self, command):
        import threading
        stop, busy = threading.Event(), threading.Event()
        busy.set()
        def slow_call(_payload):
            time.sleep(2)
            return {'acknowledged': True}
        loop = getattr(worker, 'busy_heartbeat_loop', lambda *_: None)
        with patch.object(worker, 'HEARTBEAT_SECONDS', .05), patch.object(worker, 'call_api', side_effect=slow_call) as send:
            thread = threading.Thread(target=loop, args=(stop, busy), daemon=True)
            thread.start()
            try:
                result = self.run_job(command, timeout=1)
            finally:
                stop.set()
                thread.join(timeout=3)
            self.assertTrue(send.called)
            self.assertFalse(thread.is_alive())
        return result

    def test_slow_heartbeat_does_not_delay_timeout(self):
        result = self.slow_heartbeat_job('sleep 10')
        self.assertEqual(result['exit_code'], 124)
        self.assertLess(result['duration_ms'], 1500)

    def test_slow_heartbeat_preserves_successful_output(self):
        result = self.slow_heartbeat_job('sleep .5; printf success')
        self.assertEqual(result['exit_code'], 0)
        self.assertEqual(result['stdout'], 'success')
        self.assertLess(result['duration_ms'], 1000)

    def test_combined_output_bound(self):
        result = self.run_job("python3 -c 'import sys; sys.stdout.write(\"x\"*50000)'")
        self.assertTrue(result['output_truncated'])
        self.assertLessEqual(len(result['stdout'].encode()) + len(result['stderr'].encode()), 24000)

    def test_truncation_does_not_kill_successful_command(self):
        result = self.run_job("python3 -c 'import sys;sys.stdout.write(\"x\"*50000)'; printf TAIL >&2")
        self.assertTrue(result['output_truncated'])
        self.assertEqual(result['exit_code'], 0)
        self.assertLessEqual(len(result['stdout'].encode()) + len(result['stderr'].encode()), worker.MAX_OUTPUT)

    def test_longer_than_legacy_timeout_is_accepted(self):
        result = self.run_job('echo longer-job', timeout=121)
        self.assertEqual(result['exit_code'], 0)
        self.assertEqual(result['stdout'].strip(), 'longer-job')

    def test_invalid_and_symlink_workdir(self):
        for directory in ['/etc', '/workspace/../etc', '/workspace/not-a-real-directory']:
            self.assertNotEqual(self.run_job('pwd', cwd=directory)['exit_code'], 0)
        with tempfile.TemporaryDirectory(dir='/workspace/experiments') as tmp:
            link = Path(tmp) / 'escape'
            link.symlink_to('/etc', target_is_directory=True)
            self.assertNotEqual(self.run_job('pwd', cwd=str(link))['exit_code'], 0)

    def test_exact_identity(self):
        result = self.run_job('id -u; uname -s; uname -m; hostname; pwd')
        self.assertEqual(result['exit_code'], 0)
        self.assertEqual(result['stdout'].splitlines(), ['1000', 'Linux', 'aarch64', 'ai-docker-sandbox', '/workspace'])

    def test_redirects_refused(self):
        self.assertTrue(hasattr(worker, 'NoRedirect'))
        handler = worker.NoRedirect()
        with self.assertRaises(Exception):
            handler.redirect_request(None, None, 302, 'redirect', {}, 'https://example.com/')

    def test_completion_delivery_retained_until_acknowledged(self):
        self.assertTrue(hasattr(worker, 'report_completion'))
        payload = {'action': 'complete', 'job_id': 'regression-job-1234'}
        with patch.object(worker, 'call_api', side_effect=[TimeoutError(), {'acknowledged': True}]) as send:
            with patch.object(worker.time, 'sleep'):
                self.assertTrue(worker.report_completion(payload))
            self.assertEqual(send.call_count, 2)
            self.assertEqual(send.call_args_list[0].args, send.call_args_list[1].args)


if __name__ == '__main__':
    unittest.main()
