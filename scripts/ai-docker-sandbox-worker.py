#!/usr/bin/env python3
"""Outbound-only worker for the existing restricted ai-docker-sandbox."""
from __future__ import annotations
import ctypes
import fcntl
import json
import os
import platform
import pwd
import selectors
import signal
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API_URL = os.environ.get("SANDBOX_WORKER_URL", "https://portal.cart-shift.com/api/cartshift-mcp/sandbox/worker")
TOKEN = ""
WORKSPACE = Path("/workspace").resolve(strict=True)
MAX_OUTPUT = 24_000
POLL_INTERVAL_SECONDS = 3
MAX_IDLE_POLL_SECONDS = 30
HEARTBEAT_SECONDS = 30
MAX_DRAINED_BYTES = 2_000_000
MAX_COMMAND_SECONDS = 600
UNSAFE_MARKER = Path("/tmp/cartshift-worker-unsafe")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError("Worker endpoint redirects are forbidden")


def protect_credential():
    # Deny same-UID /proc inspection; requires no added capabilities.
    if ctypes.CDLL(None, use_errno=True).prctl(4, 0, 0, 0, 0) != 0:
        raise RuntimeError("Cannot protect worker credential")


def verify_identity():
    if UNSAFE_MARKER.exists():
        raise RuntimeError("Container restart required after failed process cleanup")
    if not (os.geteuid() == 1000 and platform.system() == "Linux"
            and platform.machine() == "aarch64" and platform.node() == "ai-docker-sandbox"
            and WORKSPACE == Path("/workspace") and (WORKSPACE / "README.md").is_file()):
        raise RuntimeError("Refusing to run outside the verified ARM64 Docker sandbox")
    if len(TOKEN) < 32 or any(c not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-" for c in TOKEN):
        raise RuntimeError("Missing or invalid worker credential")
    url = urllib.parse.urlsplit(API_URL)
    if (url.scheme != "https" or url.hostname != "portal.cart-shift.com"
            or url.port not in (None, 443) or url.username or url.password or url.query or url.fragment
            or url.path != "/api/cartshift-mcp/sandbox/worker"):
        raise RuntimeError("Worker requires the production CartShift HTTPS endpoint")


def call_api(payload):
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(API_URL, body, method="POST", headers={
        "Authorization": "Bearer " + TOKEN, "Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError("Worker request failed")
        result = json.loads(response.read(55_000))
        if not isinstance(result, dict):
            raise RuntimeError("Unexpected worker response")
        return result


def within_workspace(path_str):
    path = Path(path_str).resolve(strict=True)
    if not path.is_dir() or not path.is_relative_to(WORKSPACE):
        raise ValueError("Command working directory must be inside /workspace")
    return path


def kill_group(process):
    if process is not None:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def direct_children():
    children = Path(f"/proc/self/task/{os.getpid()}/children")
    return {int(pid) for pid in children.read_text().split()}


def cleanup_adopted_children(baseline):
    # PR_SET_CHILD_SUBREAPER keeps double-fork/setsid descendants attached to
    # this serial worker instead of the container init. Kill/reap them too.
    deadline = time.monotonic() + 2
    while time.monotonic() < deadline:
        children = direct_children() - baseline
        if not children:
            return
        for pid in children:
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        for pid in children:
            try:
                os.waitpid(pid, os.WNOHANG)
            except ChildProcessError:
                pass
        time.sleep(.02)
    if direct_children() - baseline:
        UNSAFE_MARKER.touch(mode=0o600)
        raise RuntimeError("Cannot clean command descendants; refusing another job")


def execute(job):
    if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
        raise RuntimeError("Cannot enforce command descendant cleanup")
    baseline_children = direct_children()
    started = time.monotonic()
    stdout, stderr = bytearray(), bytearray()
    truncated, timed_out, exit_code, process = False, False, -1, None
    drained_bytes = 0
    try:
        command, timeout = job["command"], job["timeout_seconds"]
        if not isinstance(command, str) or not 1 <= len(command) <= 2000:
            raise ValueError("Invalid command")
        if type(timeout) is not int or not 1 <= timeout <= MAX_COMMAND_SECONDS:
            raise ValueError("Invalid timeout")
        cwd = within_workspace(job["cwd"])
        account = pwd.getpwuid(os.geteuid())
        clean_env = {"HOME": account.pw_dir, "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
                     "LANG": "C.UTF-8", "USER": account.pw_name, "LOGNAME": account.pw_name}
        process = subprocess.Popen(["/bin/sh", "-c", command], cwd=str(cwd),
                                   stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   env=clean_env, start_new_session=True)
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ, stdout)
            selector.register(process.stderr, selectors.EVENT_READ, stderr)
            deadline = started + timeout
            while selector.get_map() or process.poll() is None:
                remaining_time = deadline - time.monotonic()
                if remaining_time <= 0:
                    timed_out = True
                    kill_group(process)
                    break
                for key, _ in selector.select(timeout=min(.1, remaining_time)):
                    chunk = os.read(key.fileobj.fileno(), 4096)
                    if not chunk:
                        selector.unregister(key.fileobj)
                        continue
                    drained_bytes += len(chunk)
                    remaining = max(0, MAX_OUTPUT - len(stdout) - len(stderr))
                    key.data.extend(chunk[:remaining])
                    if len(chunk) > remaining:
                        truncated = True
                    # Truncation is NOT a command failure. An actual flood is
                    # still terminated to protect the single-worker container.
                    if drained_bytes > MAX_DRAINED_BYTES:
                        kill_group(process)
                        break
                if drained_bytes > MAX_DRAINED_BYTES:
                    break
        process.wait(timeout=5)
        exit_code = 124 if timed_out else 125 if drained_bytes > MAX_DRAINED_BYTES else process.returncode
        if timed_out:
            stderr.extend(b"\nCommand timed out."[:max(0, MAX_OUTPUT - len(stdout) - len(stderr))])
    except Exception as error:
        message = ("\nWorker error: " + type(error).__name__).encode()
        stderr.extend(message[:max(0, MAX_OUTPUT - len(stdout) - len(stderr))])
    finally:
        try:
            kill_group(process)  # Do not leave background descendants between jobs.
            if process is not None:
                try:
                    process.wait(timeout=5)
                finally:
                    process.stdout.close()
                    process.stderr.close()
            cleanup_adopted_children(baseline_children)
        except Exception:
            # Every cleanup failure stops polling until the container is restarted.
            UNSAFE_MARKER.touch(mode=0o600)
            raise RuntimeError("Command cleanup failed; container restart required") from None
    return {"action": "complete", "job_id": job["job_id"], "lease_token": job["lease_token"],
            "exit_code": max(-255, min(255, exit_code)),
            "stdout": stdout.decode("utf-8", errors="replace"), "stderr": stderr.decode("utf-8", errors="replace"),
            "duration_ms": min((MAX_COMMAND_SECONDS + 60) * 1000, int((time.monotonic() - started) * 1000)), "output_truncated": truncated}


def report_completion(completion, deadline=None):
    deadline = deadline if deadline is not None else time.monotonic() + 50
    attempt = 0
    while time.monotonic() < deadline:
        try:
            if call_api(completion).get("acknowledged") is True:
                return True
        except (urllib.error.URLError, TimeoutError, ValueError, RuntimeError, OSError):
            pass
        attempt += 1
        time.sleep(min(10, 2 ** min(attempt, 3)))
    print("Result not acknowledged before lease expiry; command was not rerun.", file=sys.stderr, flush=True)
    return False


def busy_heartbeat_loop(stop_event, busy_event):
    # One daemon thread per worker, never per command. Network I/O must not
    # block the selector's output draining or deadline enforcement.
    while not stop_event.wait(HEARTBEAT_SECONDS):
        if busy_event.is_set():
            try:
                call_api({"action": "heartbeat", "busy": True})
            except (urllib.error.URLError, TimeoutError, ValueError, RuntimeError, OSError):
                pass


def main():
    global TOKEN
    protect_credential()
    TOKEN = sys.stdin.readline(256).strip() if "--token-stdin" in sys.argv else os.environ.pop("SANDBOX_WORKER_TOKEN", "")
    verify_identity()
    os.chdir(WORKSPACE)
    lock = open("/tmp/cartshift-sandbox-worker.lock", "a")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("A sandbox worker is already running.", file=sys.stderr)
        return 0
    print("Sandbox worker started in verified container; outbound polling only.", flush=True)
    idle_delay = POLL_INTERVAL_SECONDS
    last_heartbeat = 0.0
    heartbeat_stop, worker_busy = threading.Event(), threading.Event()
    heartbeat_thread = threading.Thread(target=busy_heartbeat_loop,
        args=(heartbeat_stop, worker_busy), name="sandbox-busy-heartbeat", daemon=True)
    heartbeat_thread.start()
    try:
        while True:
            try:
                heartbeat = time.monotonic() - last_heartbeat >= HEARTBEAT_SECONDS
                request = {"action": "poll", **({"heartbeat": True} if heartbeat else {})}
                job = call_api(request).get("job")
                if heartbeat:
                    last_heartbeat = time.monotonic()
                if isinstance(job, dict):
                    idle_delay = POLL_INTERVAL_SECONDS
                    deadline = time.monotonic() + job["timeout_seconds"] + 70
                    worker_busy.set()
                    try:
                        completion = execute(job)
                    finally:
                        worker_busy.clear()
                    report_completion(completion, deadline)
                else:
                    idle_delay = min(MAX_IDLE_POLL_SECONDS, idle_delay * 1.5)
            except KeyboardInterrupt:
                return 0
            except (urllib.error.URLError, TimeoutError, ValueError, RuntimeError, OSError, KeyError) as error:
                if UNSAFE_MARKER.exists():
                    return 1
                code = error.code if isinstance(error, urllib.error.HTTPError) else ""
                print("Worker poll error: " + type(error).__name__ + " " + str(code), file=sys.stderr, flush=True)
            time.sleep(idle_delay)
    finally:
        heartbeat_stop.set()



if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, OSError, ValueError) as error:
        print("Sandbox worker refused to start: " + type(error).__name__, file=sys.stderr)
        sys.exit(1)
