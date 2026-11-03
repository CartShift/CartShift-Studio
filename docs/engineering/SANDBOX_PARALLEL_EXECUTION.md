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
Fencing compares the expected prior boot UUID atomically, so delayed old HTTPS
requests cannot overwrite a newer incarnation after a timeout/retry.

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
- Fresh production typecheck passed after normal translation generation with
  incremental caching disabled; generated files were restored byte-for-byte.
  The initial one-error result was stale incremental type information. Broad
  developer typecheck still includes existing localization/dependency errors.
- Full Vitest run: 849 tests passed; two CV assertions failed in
  tests/cv/cv-optimization.test.tsx, and tests/emails/email-service.test.ts could
  not import its absent resend dependency. Sandbox/MCP tests passed. These
  unrelated failures are recorded rather than hidden or changed in this PR.

This ledger distinguishes staged Docker proof from live MCP acceptance. Do not
claim Android or physical Windows reboot verification until actually performed.


## Live activation and acceptance — October 25, 2026

Production deployment `dpl_7r9hvbcbXHmnx751m9bGJLQb2pku` is READY and serves
the existing portal aliases. Previous deployment
`dpl_2WFJ9tG9v5Wsii1RDDi7H9Pfhj1F` is retained for rollback. Auth enforcement,
parallel dispatch and two slots are enabled. The legacy task is disabled.

- Actual unchanged MCP submissions `BKzOPCKqCxAyjyeTVcU0` and
  `bAG1jipAXRh7jhZi8wGw` ran simultaneously on slots 1 and 2, each reporting
  about 10 seconds execution. `JzoRL1Q0ukrqqVS6JnWU` was observed queued
  while both were leased, then completed after capacity became available.
  Backend polling/HTTPS added dispatch overhead: the first pair spanned 14.981
  seconds from first lease to last stored result; the direct Docker benchmark
  completed the pair in 10.570 seconds.
- Actual CPU work `Yvap1jGWEkWBh4FtjMzF` and `enJ755RjJvJSV7nFdMeK`
  each computed SHA-256 hashes for 10.000 seconds (5,874,865 and 5,802,713
  hashes) on separate slots, with overlapping execution.
- Running job `tN7X8YZGmRCSemkppVbc` cancelled with exit 130 while
  `cwszhggUdnNDXo9vIcSI` was still leased; the peer completed exit 0.
- Actual production command `GqA3xrCAjQtcdHI7YIAD` stopped its Python parent.
  The independent Windows watchdog fenced only slot 1 and marked that command
  `worker_lost`, never requeued. Slot 2 completed
  `pNz53PkFARKXo0jzXfkz` after 110 seconds with exit 0. Slot 1 returned
  automatically under a new boot identity.
- Build bearer access to the auth-session endpoint returned HTTP 401.
  The auth worker remains connected with the isolated credential and enforcement
  true. Ordinary execution verified an empty read-only auth shadow and absent
  Docker socket.
- Primary local MCP was reversibly switched to the verified isolated build
  container. Original is stopped as `ai-dev-workspace-retained`; all original
  volumes/credentials remain. Current Codex configuration was encrypted and
  authenticated-decrypted byte-for-byte before its launcher section changed.
  Fresh local MCP identity, installed Node/Python, workspace and auth-shadow
  checks passed.
- An actual `docker desktop restart` completed. Both Windows pool supervisors
  and the auth supervisor recovered automatically with new worker identities.
  Post-restart command `8DaY1cZSpSe0RRiWHvh4` completed exit 0.
- Artifact `parallel-acceptance-20261025.bin` retained all 1024 bytes across
  Docker Desktop restart, SHA-256
  `785b0751fc2c53dc14a4ce3d800e69ef9ce1009eb327ccf458afe09c242c26c9`.
- The real stopped-parent host fixture also passed before production activation.
  All pool tasks use installed native PowerShell and owner logon triggers.
- Pool backup volume validation accepts owned `ai-dev-pool-*` volumes.
  `local_mcp_containers: ["ai-dev-workspace"]` explicitly lists the isolated
  local-only runtime for direct owner-controlled pause, without waiting for a
  nonexistent remote worker there. Its isolated-build label is required.
  Pool and auth workers still acknowledge their role-specific barriers.
  Previous installed backup scripts/configuration were preserved.

### Remaining owner acceptance

- [ ] Perform a physical Windows reboot, log in, and confirm two pool workers plus
  isolated auth recover. Docker Desktop restart was tested; Windows reboot was not.
- [ ] From ChatGPT Android, run two unrelated jobs and confirm results/cancellation.
  The same production MCP tools passed here; an actual Android device was not controlled.
- [ ] If a wholly green repository CI is required, resolve the unrelated CV tests
  and missing `resend` test dependency separately.

Keep the installed owner host-script folder and reviewed worker source in place.
Do not restart the retained shared-credential runtime as a general execution worker.


## Final archive verification receipt — October 25

Authenticated decryption and full tar archive verification passed without
plaintext staging for `sandbox-20261025-011828-5aee50fc.tar.gz.age`
(3,593,226,657 bytes), SHA-256
`a956106f82b6e74e0744d4cad4f6525708cdc57b0360e1b76d7d104ca8895235`.
Its manifest includes all eleven original/auth/build/pool volumes. The encrypted
archive, checksum, manifest and independently verified Codex configuration
rollback were copied into the existing OneDrive/Documents/CartShiftSandboxBackups
folder. The archive copy's SHA-256 matches; completion of this newest large
OneDrive upload has not been independently confirmed.

During the initial verification interval Docker Desktop later stopped (cause
not established). The 03:00 CET scheduled backup failed because the Docker
endpoint was absent. Docker was started again; both execution supervisors and
isolated auth recovered automatically. A separate repeated authenticated
verification of the sealed archive then passed, exit 0. The coordinated V4
host chat owns the remaining unattended Docker-unavailable backup retry work;
do not misrepresent the failed scheduled run as successful.

Before relying on the newest archive for off-PC recovery, confirm its OneDrive
upload has completed. Previous independently recoverable encrypted backups and
recovery-key copies remain preserved.
