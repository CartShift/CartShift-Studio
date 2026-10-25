# Local Desktop Commander through the existing CartShift MCP connector

## Owner-selected workflow

Use the existing CartShift MCP connector from ordinary ChatGPT Android or desktop chat. Run the pinned open-source Desktop Commander engine locally inside Docker through that connector. Codex Remote and the hosted Desktop Commander service are not part of this workflow. No additional app, hosted Desktop Commander subscription, device pairing or public port is required.

The previously paired `ai-dev-sandbox-dc-remote` container is stopped. Its container and pairing home are retained; do not delete them or restart the hosted relay without a new owner request.

## Architecture

```text
ChatGPT Android or desktop
  -> existing authenticated CartShift MCP connector
  -> sandbox_run_command / existing V5 queue
  -> either credential-isolated pool worker
  -> private UID-1000 Unix socket on shared workspace
  -> persistent local stdio MCP engine in ai-dev-workspace
  -> pinned /opt/dc Desktop Commander package
```

There is no new public MCP endpoint or inbound listener. The socket directory is mode 0700, the socket is mode 0600, and both are UID 1000. No host files, Docker socket, provider credentials, capabilities or ports are added. The existing read-only container root and read-only empty credential shadow remain mandatory. The engine runs with `DESKTOP_COMMANDER_DISABLE_TELEMETRY=1`; it does not connect to the hosted Desktop Commander relay.

Both pool workers share the same engine, so a native terminal/search session survives between MCP jobs even when different workers service the requests. PIDs returned by Desktop Commander refer to its engine container; interact with them through Desktop Commander tools, not shell kill commands in a pool worker.

The adapter checks runtime identity and the kernel credential/root mount flags, limits requests to 32 KiB and responses to 512 KiB, and accepts at most 16 simultaneous socket connections. The existing command, job, timeout and output limits remain in effect. Large writes should be split into bounded native write calls; large results can be redirected to the existing artifacts directory and read in chunks.

## Use through the existing MCP tool

Call `sandbox_run_command` with `cwd=/workspace`, `wait_seconds=15` and a suitable bounded timeout. The command to discover native tool names is:

```sh
node /workspace/scripts/sandbox_desktop_commander.mjs list
```

Read a file with the real native Desktop Commander tool:

```sh
node /workspace/scripts/sandbox_desktop_commander.mjs request <<'DC_REQUEST'
{"op":"call","tool":"read_file","args":{"path":"/workspace/README.md"}}
DC_REQUEST
```

Get the exact schema for any native tool:

```sh
node /workspace/scripts/sandbox_desktop_commander.mjs request <<'DC_REQUEST'
{"op":"describe","tool":"write_file"}
DC_REQUEST
```

All 25 pinned native tools remain available, including write/edit/read/search and persistent terminal sessions. Send `start_process`, then use its returned PID in later `interact_with_process`, `read_process_output` and `force_terminate` requests. Native tool errors remain visible in the result. The queue returns a job ID when it has not finished; inspect it with `sandbox_get_result`.

Requests are never replayed automatically after a timeout, engine crash or disconnected response. Check the prior action's actual state before retrying. Existing V5 workspace locks are cooperative and do not wrap native background processes; use separate project directories/worktrees for independent edits.

## Windows installation and recovery

The owner installs the reviewed `Run-SandboxDesktopCommanderBridge.ps1`, `Register-SandboxDesktopCommanderBridge.ps1`, `Common-SandboxHost.ps1`, `Common-SandboxTask.ps1`, and the adapter source alongside the existing host scripts. Register with the reviewed adapter SHA-256 and existing pinned image ID. The fixed supervisor verifies the existing four-mount credential-isolated local MCP runtime and hashes one byte buffer, strictly decodes that same buffer, and injects only that verified snapshot as UID 1000. It never starts a personal Windows Desktop Commander server.

The task `CartShiftSandboxDesktopCommanderLocal` uses owner logon and one-minute recovery triggers, a limited interactive principal, IgnoreNew, a single-owner mutex and no credential arguments. It waits for the verified local Docker daemon, requests Docker Desktop startup when unavailable, and retries the verified engine after failure. The engine itself reconnects its local stdio child after a child crash; the failed action is not replayed. Active interactive processes may end when their engine/container restarts.

An exclusive kernel flock is held for the daemon lifetime, serializing stale-socket cleanup and binding across simultaneous starts. It is released on process death. An active socket is never removed by a duplicate daemon. An unchanged owned stale socket may be removed on startup; a regular file, symlink, changed inode or foreign ownership is refused. The existing worker and auth supervisors retain their one-minute recovery/logon triggers and separate credential boundaries.

Keep the host plugged in, online and logged in. Plugged-in idle sleep is disabled; battery sleep remains three minutes. A physical Windows reboot/login remains a separate manual acceptance step.

## Backups and verification

The existing encrypted workspace/build-home backups include adapter files and engine configuration. The existing local-MCP writer pause covers this engine in the same container; its snapshot is crash-consistent, and active commands should be avoided during a backup. The stopped hosted pairing home remains included as an optional volume. Preserve previous scripts, task XML, recovery identities and encrypted archives.

Run native integration tests inside the verified Docker runtime:

```sh
node --test tests/scripts/test_sandbox_desktop_commander_bridge.mjs
```

These use the actual pinned engine, not a replacement implementation. They cover file effects, plain-JSON stdin, cross-client terminal sessions, local stdio-child recovery, concurrent calls, duplicate-daemon refusal, bounded/malformed input and unsafe socket paths. Windows registration-expression fixtures verify logon and periodic recovery triggers.

## Android acceptance

In a fresh ordinary ChatGPT Android conversation, enable the existing CartShift MCP connector and ask:

> Use my existing CartShift MCP connector and the local Desktop Commander adapter at /workspace/scripts/sandbox_desktop_commander.mjs. Do not use Codex Remote or the hosted Desktop Commander service. List the native tools, read /workspace/README.md, then write, edit and read /workspace/experiments/android-native-dc-proof.txt through native Desktop Commander calls. Start a Python interactive session, send a harmless print statement in a later call, and terminate only that session. Report the actual tool results and job IDs.

The connector-to-Docker workflow is verified by real MCP calls from this desktop conversation. Actual phone acceptance is complete only when calls from Android succeed. This removes hosted Desktop Commander provider quotas; ChatGPT/model and existing hosting/resource limits remain separate.

## Production continuity

V5 worker routes must remain deployed. On October 25, a newer `main` website deployment replaced an unmerged V5 production deployment with V4 and returned `invalid_worker_version`. The reviewed repair merges the current website changes with the V5 backend; it preserves the website changes and does not downgrade workers or relax authentication. Merge the reviewed V5 changes into the production source branch before relying on future unrelated `main` deploys, otherwise that deployment drift can recur. PR review and merge remain owner decisions.

## Owner-confirmed Android acceptance — 25 October 2026

The owner confirmed a successful test from ordinary ChatGPT Android through the existing CartShift MCP connector: 25 native tools discovered, followed by native write/edit/read of `/workspace/experiments/android-native-dc-proof.txt`. Final contents:

```text
android-native-dc-proof
bridge=local-desktop-commander
phase=edited
transport=sandbox_run_command
```

Independent native `read_file` job `AQ3CURIWznbdwzNRmU6F` completed with exit 0 and confirmed those bytes on bridge `c0d4ff0a-110c-4ae0-8168-8b0f689fbe82`, engine generation 1. Neither Codex Remote nor the hosted Desktop Commander service was used. Phone-side terminal sessions and concurrent operations have not yet been tested on the phone; those capabilities passed the separate desktop-to-existing-connector checks. Windows reboot/login, cloud-upload confirmation and owner review/merge remain separate gates.
