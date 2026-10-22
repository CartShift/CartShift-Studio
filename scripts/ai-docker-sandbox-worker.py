#!/usr/bin/env python3
"""Outbound-only command worker for the restricted ai-docker-sandbox container.

Run ONLY inside ai-docker-sandbox as UID 1000. No listening port, Docker socket,
host commands, or shared customer files. Requires SANDBOX_WORKER_TOKEN in the
worker process environment (never passed to command processes).
"""
from __future__ import annotations

import json
import os
import platform
import selectors
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_URL = os.environ.get(
    "SANDBOX_WORKER_URL",
    "https://portal.cart-shift.com/api/cartshift-mcp/sandbox/worker",
)
TOKEN = os.environ.get("SANDBOX_WORKER_TOKEN", "")
WORKSPACE = Path("/workspace").resolve(strict=True)
MAX_OUTPUT = 24_000
POLL_INTERVAL_SECONDS = 3


def verify_identity() -> None:
    if not (
        os.geteuid() == 1000
        and platform.system() == "Linux"
        and platform.machine() == "aarch64"
        and platform.node() == "ai-docker-sandbox"
        and WORKSPACE == Path("/workspace")
        and (WORKSPACE / "README.md").is_file()
    ):
        raise RuntimeError("Refusing to run outside the verified ARM64 Docker sandbox")
    if len(TOKEN) < 32 or not all(c.isalnum() or c in "_-" for c in TOKEN):
        raise RuntimeError("SANDBOX_WORKER_TOKEN must be set in the container environment")
    if not API_URL.startswith("https://"):
        raise RuntimeError("Worker requires an HTTPS endpoint")


def call_api(payload: dict) -> dict:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        API_URL, body, method="POST",
        headers={
            "Authorization": "Bearer " + TOKEN,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError("Worker request failed")
        data = response.read(55_000)
        result = json.loads(data)
        if not isinstance(result, dict):
            raise RuntimeError("Unexpected worker response")
        return result


def within_workspace(path_str: str) -> Path:
    path = Path(path_str).resolve(strict=True)
    if not path.is_dir() or not path.is_relative_to(WORKSPACE):
        raise ValueError("Command working directory must be inside /workspace")
    return path


def execute(job: dict) -> dict:
    started = time.monotonic()
    stdout = bytearray()
    stderr = bytearray()
    truncated = False
    exit_code = -1
    try:
        command = job["command"]
        timeout = job["timeout_seconds"]
        if not isinstance(command, str) or not 1 <= len(command) <= 2000:
            raise ValueError("Invalid command")
        if not isinstance(timeout, int) or not 1 <= timeout <= 120:
            raise ValueError("Invalid timeout")
        cwd = within_workspace(job["cwd"])

        # Never pass the worker bearer token (or other host-side secrets) to commands.
        clean_env = {
            "HOME": "/home/sandbox",
            "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
            "LANG": "C.UTF-8",
            "USER": "sandbox",
            "LOGNAME": "sandbox",
        }
        process = subprocess.Popen(
            ["/bin/sh", "-c", command], cwd=str(cwd),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            env=clean_env, start_new_session=True,
        )
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ, stdout)
            selector.register(process.stderr, selectors.EVENT_READ, stderr)
            deadline = started + timeout
            while selector.get_map():
                if time.monotonic() >= deadline:
                    os.killpg(process.pid, signal.SIGKILL)
                    stderr.extend(b"\nCommand timed out.")
                    break
                for key, _ in selector.select(timeout=min(0.25, max(0, deadline - time.monotonic()))):
                    chunk = os.read(key.fileobj.fileno(), 4096)
                    if not chunk:
                        selector.unregister(key.fileobj)
                        continue
                    target = key.data
                    if len(stdout) + len(stderr) + len(chunk) > MAX_OUTPUT:
                        remaining = max(0, MAX_OUTPUT - len(stdout) - len(stderr))
                        target.extend(chunk[:remaining])
                        truncated = True
                        os.killpg(process.pid, signal.SIGKILL)
                        break
                    target.extend(chunk)
                if truncated:
                    break
        process.wait(timeout=5)
        exit_code = process.returncode
    except Exception as error:
        stderr.extend(("\nWorker error: " + type(error).__name__).encode())
    return {
        "action": "complete",
        "job_id": job["job_id"],
        "lease_token": job["lease_token"],
        "exit_code": max(-255, min(255, exit_code)),
        "stdout": stdout.decode("utf-8", errors="replace")[:MAX_OUTPUT],
        "stderr": stderr.decode("utf-8", errors="replace")[:MAX_OUTPUT],
        "duration_ms": min(200_000, int((time.monotonic() - started) * 1000)),
        "output_truncated": truncated,
    }


def main() -> int:
    verify_identity()
    os.chdir(WORKSPACE)
    print("Sandbox worker started in verified container; outbound polling only.", flush=True)
    while True:
        try:
            result = call_api({"action": "poll"})
            job = result.get("job")
            if isinstance(job, dict):
                completion = execute(job)
                # Never rerun a command if completion reporting fails.
                for attempt in range(3):
                    try:
                        call_api(completion)
                        break
                    except (urllib.error.URLError, TimeoutError, ValueError):
                        if attempt < 2:
                            time.sleep(2)
        except KeyboardInterrupt:
            return 0
        except (urllib.error.URLError, TimeoutError, ValueError, RuntimeError) as error:
            print("Worker poll error: " + type(error).__name__, file=sys.stderr, flush=True)
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, OSError) as error:
        print("Sandbox worker refused to start: " + type(error).__name__, file=sys.stderr)
        sys.exit(1)
