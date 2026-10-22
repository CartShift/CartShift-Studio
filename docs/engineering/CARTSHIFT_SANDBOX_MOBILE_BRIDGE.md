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

For preview environments, set `SANDBOX_WORKER_URL` on the worker to the
preview endpoint, but only if the preview domain is accessible to the
worker. The normal URL is
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
