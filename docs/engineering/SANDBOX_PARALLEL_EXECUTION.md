# V5 parallel sandbox operations

V5 keeps the existing owner-only MCP command, status, cancellation, artifact and
interactive-login tools. No new mobile plugin or command-submission protocol is
required. `SANDBOX_PARALLEL_ENABLED=true` opts the backend into V5 dispatch;
`SANDBOX_EXECUTION_SLOTS=2` is the default (1–8 supported). V2–V4 submissions,
workers and auth remain supported while parallel mode is disabled.

## Architecture and failure contract

Two capped containers each run one serial Python worker. They share the existing
persistent workspace and image/toolchain, use fresh independent homes, and each
shadow `/workspace/.auth` with an empty read-only volume. Neither contains a
Docker socket, host bind mount, provider credential volume or auth token. The
owner Windows supervisor supplies the build bearer only on stdin; Python turns
off dumpability before reading it. Commands inherit a cleaned environment.

A Firestore transaction on `sandbox_worker_state/pool` serializes **claiming**,
not computation. Each slot has a host-generated boot UUID, heartbeat, job,
resource scope and hard execution lease. The oldest compatible queued job is
claimed once and cannot be claimed again. A third job remains queued until a
slot completes. Poll/completion response loss never reruns a command.

**Exactly-once side effects cannot be promised after a crash.** V5 guarantees
at-most-once dispatch: uncertain jobs become `worker_lost` only after their
container is fenced; they are never automatically queued again. Inspect side
effects before consciously submitting replacement work.

Python independently drains output, applies deadlines and cancellation, kills
process groups and adopted descendants, and refuses reuse after cleanup failure.
An independent Windows watchdog handles a killed/stopped/hung Python worker. It
polls only bounded backend slot metadata, respects owner backup pauses and
restarts **only its own container** after an expired hard lease, stale worker
heartbeat or 90 seconds without control-plane contact. Only **after Docker
restart succeeds** does its `fenced` acknowledgement release the old reservation
and register a new boot identity. Lease expiry alone never releases a scope.
A repeated acknowledgement for the same boot UUID cannot clear its new job.

On a backend outage the watchdog fences work after 90 seconds without contact;
this deliberately trades availability for a bounded local process lifetime.
Job deadlines include the existing 90-second transport/cleanup margin. Retained
expired reservations fail closed until a verified supervisor recovers the slot.

## Shared files and fair scheduling

No Git repository is required. Use arbitrary task directories under
`/workspace/projects`, `/workspace/experiments`, etc. Overlapping paths in the
same task tree are serialized, with FIFO preference among conflicting jobs.
Unrelated task directories can progress while an older conflicting job waits.
Symlink cwd aliases are rejected by V5 workers, and slash normalization cannot
bypass a reservation. The scan is bounded to the oldest 100 queued jobs.

Existing submissions with default cwd `/workspace` run concurrently. The shell
is general purpose: a command's cwd does not confine its writes. Automatic task
reservations and shared-file `flock` are **cooperative conflict protection**, not
a filesystem security boundary between trusted owner agents. For cross-task
changes or installing shared tools, submit `exclusive_workspace: true` (optional,
additive MCP field), or use the same `flock /workspace/...` lock in all commands
that modify that resource. Background dev services outside this queue must use
that same lock or be quiesced. Do not assume arbitrary shell writes can be
predicted or isolated by cwd.

## Actual resource budget

The inspected Windows ARM64 host has 12 logical CPUs and 33,895,186,432 bytes RAM.
Docker reports 12 CPUs and 16,511,356,928 bytes RAM. Original runtime has a 4-CPU,
8-GiB, 512-process cap. Each new slot has 2 CPUs, 2 GiB RAM, 192 PIDs, no extra
swap and a 256-MiB tmpfs. Provisioning counts existing running memory/CPU caps,
reserves 2 GiB for Docker services, and refuses unbounded or over-budget staging.
Increase slots only after re-running the actual host budget check. A worker OOM
is contained by its cgroup and recovered by its own supervisor.

## Additive provisioning, activation and rollback

1. Preserve the independently verified encrypted backup, recovery key, staging
   restore and original Task Scheduler XML. V4 operations describe these checks.
   Never delete or reuse an existing destination volume during preparation.
2. With `SANDBOX_PARALLEL_ENABLED` still absent/false, run:

   ```powershell
   ./Prepare-SandboxPool.ps1 -Action Prepare -Slots 2
   ./Prepare-SandboxPool.ps1 -Action Verify -Slots 2
   ./Test-SandboxPool.ps1 -WorkerSource ./worker.py
   ```

   Prepare refuses replacements; Verify checks image, labels, exact named mounts,
   read-only empty credential shadow, CPU/RAM/PID limits and no published ports.
   Independent homes preserve shared project/toolchain files while avoiding old
   home credentials. Review any tools installed only in the old home separately;
   never copy an unreviewed home or credentials into an execution worker.
3. Complete V4 auth-sidecar verification, retain the original runtime and drain
   old general-command leases. Stop/disable the legacy worker supervisor before
   V5 activation. Existing active V4 jobs do not participate in pool reservations.
4. Deploy the additive Firestore composite index: `sandbox_command_jobs(status
   ASC, createdAt ASC)`, and verify it is ready before live V5 polling. Deploy
   the existing PR source through its linked CartShift Vercel project, with
   `SANDBOX_AUTH_WORKER_ENFORCE=true`, `SANDBOX_PARALLEL_ENABLED=true` and
   `SANDBOX_EXECUTION_SLOTS=2`. The dedicated auth bearer must differ from build.
5. Pin the exact reviewed worker SHA256, image ID and owner DPAPI token path.
   Register independent logon tasks (native installed PowerShell, not Codex cache):

   ```powershell
   ./Register-SandboxPoolSupervisor.ps1 -SupervisorScript ./Run-SandboxPoolWorker.ps1 `
     -WorkerSource ./worker.py -WorkerSha256 <reviewed-sha256> `
     -DpapiTokenFile C:/Users/yotam/.cartshift-sandbox/build-worker-token.dpapi `
     -ImageId sha256:<verified-image> -Slots 2
   Start-ScheduledTask CartShiftSandboxPool-1
   Start-ScheduledTask CartShiftSandboxPool-2
   ```

   Keep the complete host-script bundle together, including Common-SandboxPool,
   Common-SandboxHost and Common-SandboxTask. Supervisor source is owner-held;
   only the reviewed Python source is conveyed into execution containers.
6. Install the updated Backup-Sandbox.ps1 bundle without overwriting unrecorded
   owner changes. It recognizes pool labels as **build-only** maintenance channels
   and includes the default two pool homes/shadow in encrypted backups. Custom
   prefixes/slot counts require an explicit complete `-Volumes` list. Every
   writable container must acknowledge its barrier before backup pause.
7. Verify the existing MCP status shows two connected slots and independent job
   IDs. Submit three jobs with the usual tool. Measure two 10-second jobs near
   ten seconds, third queueing, cancellation isolation, slot crash/recovery and
   credential-denied session transport. Then perform an actual Docker Desktop
   restart and owner Windows logoff/reboot acceptance. Awake connected Windows
   and owner logon remain required; logon recovery is not pre-login service mode.

Rollback: stop/disable only the two new pool tasks; stop the two pool containers
with `Prepare-SandboxPool.ps1 -Action Stop`. Retain all containers/volumes. Restore
previous production deployment/config and recorded original worker task only
following the V4 rollback sequence; never run the old shared-auth worker while
claiming that isolated auth enforcement is active. Do not clear pool reservations
by hand while their containers may contain live processes.

## Verification ledger, October 24

- Initial Python independent-process proof: two real 10-second commands in
  10.12 seconds; cancellation of one did not stop its peer.
- Actual Windows/Docker staged containers: two real 10-second jobs in **10.592
  seconds**; cancellation isolation, one-container restart, persistent proof
  files and acceptance of new work after restart passed.
- 148 MCP tests passed; 89 Python tests ran successfully (one optional real
  provider login skip). One PTY timing assertion failed once during a combined
  run, then its unchanged 27-test suite and the complete 89-test run passed.
- Review found the SIGSTOP-parent gap. Added independent Windows watchdog and
  confirmed backend regression fails with unfenced expiry reintroduced, then
  passes with fencing required. Actual watchdog fixture and live cutover results
  must be recorded below after the coordinated host handoff.
- Existing production MCP command `7p1CKwuVAj0nUgX0xCpi` completed exit 0 through
  the unchanged command tool before the other chat began auth cutover.
- New FIFO Firestore index deployment succeeded additively; V4 worker/status
  stayed online before host migration. Vercel connector env inspection returned
  403; existing authenticated `devctl vercel run` CLI verified the exact linked
  CartShift project and production variable metadata without exporting secrets.
- Broad developer typecheck includes pre-existing localization/dependency errors.
  Normal translation generation narrowed production typecheck to existing
  CaseStudiesTeaser namespace error; no sandbox-file TypeScript error observed.

This ledger distinguishes staged Docker proof from live MCP acceptance. Do not
claim Android or physical Windows reboot verification until actually performed.
