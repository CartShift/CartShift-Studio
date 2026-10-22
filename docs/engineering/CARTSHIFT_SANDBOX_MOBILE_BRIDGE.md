# CartShift MCP → AI Docker Sandbox bridge

This is an experimental, owner-only command runner reached through the **existing
CartShift MCP** (which is already visible in ChatGPT on Android). It does not
provide Docker access until a separately authenticated worker is running in
the actual restricted container.

## Architecture

1. ChatGPT calls `sandbox_run_command` on the CartShift MCP.
2. CartShift validates its existing OAuth grant and requires the exact
   `SANDBOX_OWNER_UID` of the authorized agency account.
3. A job is queued in Firestore `sandbox_command_jobs`. No shell executes
   in Vercel, Firebase Functions, or a Windows process.
4. The container-only Python worker makes outbound HTTPS requests to poll
   and claim a job. Jobs have one-use leases.
5. Only after executing the command **inside** `ai-docker-sandbox`, the
   worker reports status/stdout/stderr. ChatGPT calls `sandbox_get_result`.

The cloud `sandbox_ping` tool is a separate, read-only connectivity check.
It cannot prove that Docker is connected.

## Required setup (owner)

### CartShift Vercel project: `cart-shift-studio`

Set these as **encrypted** environment variables for the desired deployment
environment, and redeploy to apply them:

- `SANDBOX_OWNER_UID`: the exact Firebase Auth UID of the owner account
  that connects CartShift in ChatGPT. Do not substitute an organization ID.
- `SANDBOX_WORKER_TOKEN`: a randomly generated 48+ character URL-safe
  secret; the *same* secret must be configured securely inside the Docker
  container worker. Do not put it in Git, command arguments, screenshots,
  or chat messages.

No broader CartShift agency role may use the command tools without an exact
UID match. The tools reuse `work:write` and `work:read` OAuth scopes, with
that extra UID restriction (no new OAuth consent scopes).

### Restricted Docker sandbox

Use the existing `ai-docker-sandbox` container. It must be Linux ARM64,
UID 1000, hostname `ai-docker-sandbox`, and contain
`/workspace/README.md`. The worker refuses to start otherwise.

Place this repository's `scripts/ai-docker-sandbox-worker.py` within
`/workspace` (for example clone the repo into
`/workspace/projects/cart-shift-studio`). Set `SANDBOX_WORKER_TOKEN`
in the worker's environment without exposing it in process arguments.
Start the worker **inside that container**:

```bash
python3 /workspace/projects/cart-shift-studio/scripts/ai-docker-sandbox-worker.py
```

The worker runs while the container and that process stay online. It needs
outbound HTTPS access to `portal.cart-shift.com`. It never listens on a port,
never uses a Docker socket and never requests a Windows host mount.

Commands run with `/bin/sh -c`, a selected working directory below
`/workspace`, a reduced environment that excludes the worker secret, a
120-second maximum and a bounded combined output. Commands can still
change/delete files **inside** the container: preserve development work in
Git and backups. Do not make the container privileged or share host files.

The worker pins the production HTTPS hostname and path and refuses preview endpoints. The URL is
`https://portal.cart-shift.com/api/cartshift-mcp/sandbox/worker`.

## ChatGPT acceptance check

1. Refresh/reconnect the **existing CartShift app** tools, if necessary.
2. Run `sandbox_ping`. A reachable result proves cloud connectivity only.
3. Run `sandbox_run_command` with
   `{"command":"id -u && uname -s && uname -m && hostname && pwd"}`.
4. Call `sandbox_get_result` using the exact returned `job_id`.
5. Require exit code 0 with UID `1000`, OS `Linux`, arch `aarch64`,
   hostname `ai-docker-sandbox`, and cwd `/workspace`.
6. If any field differs, stop; do not use another execution provider.
7. Only after identity verification consider a file write/read proof under
   `/workspace/experiments`.

A QUEUED or LEASED job is not proof of execution. If the worker never polls,
the job eventually appears EXPIRED or WORKER_LOST. A successful deployment
alone is not proof Android tool discovery works.

## Deferred after functional proof

- Consider a separate MCP app or a completely separate broker to avoid
  coupling developer command execution to the client-management product.
- Rotate the worker token and review audit logs/retention.
- Add operator controls (worker presence/heartbeat, queue concurrency,
  cancellation, output redaction, longer-running task support).
- Run expanded integration/security testing before operational use.

## Activation and reliability update (2026-10-22)

The existing tool names and OAuth scopes remain unchanged. The backend now accepts identical completion retries, retires expired queued jobs, bounds streamed request bodies (including JSON escaping expansion), and reports `failed`/`timed_out` separately from successful `completed` results. Queued jobs expire after ten minutes; an unreported lease becomes `worker_lost`. A lost job is never silently rerun: an owner may submit a new job explicitly.

The stdlib-only Python worker uses the actual UID-1000 account home (`/home/node`), validates the exact Linux ARM64 identity, resolves workdirs under `/workspace`, suppresses endpoint redirects, kills command process groups and reaps detached descendants with a Linux child-subreaper on timeout/output limits/completion, closes pipes, and retains completion delivery retries until the lease deadline. Its production credential can be supplied through `--token-stdin`; it is absent from command arguments and child environments. PR_SET_DUMPABLE=0 prevents same-UID command processes from inspecting worker memory through `/proc`. A flock permits one worker per container. Failed descendant cleanup blocks further jobs until a container restart. Arbitrary preview endpoints are now intentionally refused; the production HTTPS hostname/path is pinned to prevent credential forwarding.

For this Windows setup, the owner-side `cartshift-worker-supervisor.ps1` validates the owned restricted runtime and the owner-held worker source SHA-256 before invoking one fixed `docker exec` command as UID 1000. The worker runs inside Docker; Windows never receives development commands. The dedicated token is protected with current-user DPAPI and a private owner ACL on Windows, then supplied over stdin after a verified source bootstrap. Isolated Python (`-I`) imports only its read-only standard library; no container-writable script or user-site import executes at credential startup, and the hash is checked on the exact source bytes executed. No host credential store is mounted or copied into the container. A Windows logon task keeps the supervisor running and reconnects after Docker/container restarts. This requires the owner Windows session, Docker Desktop, and network connectivity to remain available.

Owner deployment procedure: generate a fresh random 48-byte URL-safe credential, configure SANDBOX_OWNER_UID and SANDBOX_WORKER_TOKEN as production secrets in the verified CartShift Vercel project, store only the dedicated worker credential in owner-protected storage, deploy, and sign out any temporary platform CLI session. Never copy broad platform credentials into the running worker. In the executed setup, a temporary public-key handoff transfers ciphertext only; temporary plaintext setup credentials are removed before any queued command runs.

Validation commands:

```bash
python3 -m unittest discover -s tests/scripts -p test_sandbox_worker.py
COREPACK_HOME=/home/node/.cache/corepack pnpm exec vitest run tests/api/cartshift-mcp-*.test.ts
COREPACK_HOME=/home/node/.cache/corepack pnpm exec tsc -p tsconfig.build.json --noEmit
```

Test Android through the existing CartShift app after refreshing its tool list. Require an actual completed queue job showing `1000`, `Linux`, `aarch64`, `ai-docker-sandbox`, and `/workspace`, then write/read `/workspace/experiments/mobile-proof.txt`. Public `tools/list` or the separate cloud `sandbox_ping` alone cannot establish Docker execution or Android tool availability.

### Worker credential trust boundary

The worker runs as the same UID 1000 as development commands. Its credential is excluded from child arguments and environments; isolated Python imports and a non-dumpable process protect ordinary process inspection. This does not establish a security boundary against arbitrary hostile code already running under the same UID, including interference during worker startup. Use this owner-only runner for trusted development commands. Windows personal files, Docker control, and host credentials remain outside the container. Cleanup failures stop polling and require a container restart.


## Operations v2 (staged, backwards-compatible)

The v2 release adds **owner-only** `sandbox_status` and `sandbox_cancel_command`
plus optional `wait_seconds: 1..15` to `sandbox_run_command`. Calls without
`wait_seconds` retain the queued job ID contract. The wait uses a bounded
Firestore document listener on the Vercel server, not busy polling from ChatGPT.

`sandbox_status` is driven by an actual authenticated worker heartbeat, never
by the unrelated cloud `sandbox_ping`. A v2 worker piggybacks a heartbeat
on approximately one idle poll per 30 seconds; during long commands it sends
periodic busy heartbeats. An absent heartbeat cannot prove an older worker
is offline. A v2 heartbeat older than 90 seconds is considered stale.

The worker polls every 3 seconds initially and backs off toward 30 seconds
when idle, reducing sustained idle reads by roughly 90% relative to a 3-second
constant rate (not an observed billing claim). New jobs can take up to 30
seconds to start after extended inactivity. A push channel / long polling
should be separately evaluated before optimizing further.

v2 commands support up to 600 seconds, **only** while the server has a fresh
v2 heartbeat. Otherwise the server rejects requests over 120 seconds with
`SANDBOX_WORKER_UPDATE_REQUIRED`. Leases extend with the requested execution
timeout; expired jobs are never silently rerun. The 24 KB returned-output
cap remains, but ordinary truncation no longer kills otherwise successful
commands. An exceptional stream exceeding 2 MB **does** terminate the
command (exit 125) to contain abusive output.

`sandbox_cancel_command` atomically cancels **queued** work only. Once leased,
the command is already executing and cancellation returns `cancelled: false`.
Never present this as a kill switch for running production operations.

Every newly submitted job has a `purgeAt` Firestore Timestamp set to seven
days after submission. Deploy the `sandbox_command_jobs.purgeAt` TTL field
override via `firebase deploy --only firestore:indexes` after reviewing
the current live index inventory. Firestore TTL is asynchronous and only
applies to new documents carrying the timestamp; older queue records need
a separately audited cleanup. Output redaction removes recognizable OAuth
tokens, authorization bearer strings, GitHub tokens and PEM private keys
before writing results. It is **best effort**: commands can still contain
secrets and must never echo credentials or copy them into queue payloads.

### Upgrade and rollback procedure

1. Keep the already-active Windows supervisor and old worker running while
   deploying the backwards-compatible Vercel MCP changes.
2. Run targeted MCP tests, production type-check and real worker subprocess
   tests. Deploy the TTL field policy separately and verify its state.
3. Review the pinned SHA-256 of `scripts/ai-docker-sandbox-worker.py` and
   update the **owner-side** supervisor's allowlisted source hash to the
   exact reviewed release. Because the supervisor verifies source bytes
   executed, simply replacing the container file will *not* safely
   activate it. Never disable the hash check.
4. Restart the supervisor through its existing authorized Windows mechanism.
   Confirm `sandbox_status` is `online`, version 2, with a recent heartbeat.
   Verify fast wait, queued cancellation, exit 7, timeout, truncation,
   and >120-second compatibility using harmless fixtures.
5. Roll back worker and server together if a regression is found.
   Do not run unattended privileged Firebase/GCP operations from an
   unverified worker version.

### Credential boundaries

Firebase CLI interactive sign-in persists Google OAuth tokens under the
container user's config directory. This is broader than the worker's
separate minimal-purpose credential, and arbitrary trusted commands under
the same UID can access that login. Prefer short-lived, least-privilege
production credentials, explicitly log out after administration, and
never pass credentials through MCP command strings, Git, stdout, or logs.
The existing worker credential is excluded from child environments;
this does not isolate the owner's Firebase CLI session.

### Remaining hardening

An auditable privileged credential broker, safe live running-job
cancellation, reliable long-term log streaming, and retention-aware
cleanup of historical jobs remain separate engineering projects. Do not
represent them as delivered by Operations v2.
