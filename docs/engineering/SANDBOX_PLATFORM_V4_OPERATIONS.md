# Sandbox V4 operations and staged activation

Use the existing owner-only ChatGPT → CartShift MCP → outbound Windows ARM64 Docker bridge. There is no public shell, inbound worker listener, host mount or Docker socket in a worker, additional cloud service or new hosting tier. Current evidence belongs in SANDBOX_PLATFORM_V4_DEPLOYMENT_2026-10-23.md. Keep PR122 unmerged until replacement and mobile acceptance pass.

## Architecture

- Legacy staging: ai-dev-workspace, hostname ai-docker-sandbox, original workspace/home/device volumes. V4 legacy is compatible but retains the shared-UID credential risk.
- Build: original workspace, empty read-only nested .auth shadow, fresh clean home/device volumes. Commands/artifacts only; no OAuth guardian.
- Auth: ai-auth-sandbox, private provider volume, immutable scripts/toolchain snapshot; fixed login sessions only, no projects or general jobs.
- Managed service: only projects/PROJECT via volume-subpath, owner-selected npm/pnpm server, 127.0.0.1 preview and bounded resources.

Workers remain UID1000, read-only root, caps ALL dropped, no-new-privileges, without published ports. Controllers pin local Docker named pipe, exact image, ownership and exact mounts. Distinct CurrentUser-DPAPI tokens travel only over stdin. Reviewed worker/PTY hashes are verified on Windows and inside isolated Python memory.

Chmod0700 does not isolate same-UID secrets. Snapshot credentials only while old users are quiescent; never refresh two copies concurrently. Reject links escaping the immutable scripts/toolchain closure and verify the owner-reviewed file/link manifest. Preserve all old files/volumes: destructive Finalize is disabled. Fixed mobile login supports GitHub, Supabase, Vercel, Firebase, Shopify, Northflank and Apps Script; existing provider homes/wrappers are preserved. Credentialed push/deploy operations cannot run from credential-blind build jobs. Use existing authenticated integrations or a separately reviewed narrow broker; never remount credentials to restore convenience.

## Protocol

Leases record workerVersion; cancellation is gated on that lease. Lease heartbeats validate owner, expiry and hashed token transactionally. cancel_requested is not completed cancellation: wait for cancelled/exit130. Timeouts return124. Subreaper/process-group cleanup remains mandatory. Active/unsafe markers block a dirty restart; dedicated supervisors restart their verified container after every transport exit to kill otherwise-unrecorded detached descendants.

Auth freshness is independent of build freshness and records isolated/legacy bearer provenance. SANDBOX_AUTH_WORKER_ENFORCE=true rejects legacy session transport and restricts auth cwd to /workspace. PTY input handles partial writes, ACKs full delivery, deduplicates retries and serializes concurrent sync. No raw terminal spool is stored.

Artifacts are regular files beneath /workspace/artifacts, opened descriptor-relative with O_NOFOLLOW on every component; reject dotfiles, traversal, links and special files. Max12000-byte chunks include base64, offsets/total size and SHA256. Verify hashes and combine by offset. Never put secrets in artifacts. Commands/results retain seven days in Firestore; activity/audit logs contain metadata only.
## Encrypted backups

Backup-Sandbox streams tar directly through age using binary .NET streams: no plaintext tar and no host bind mount. It uses the existing pinned image, network disabled, UID1000, read-only source volumes and dropped caps. Include original workspace/home/device plus isolated auth/tools/build-home/device/shadow volumes; fail on missing baseline volumes or wrong ownership.

A fresh nonce maintenance barrier blocks new leases/session starts and waits for current work to finish before pausing writers. A bounded owner-side watchdog unpauses after a killed backup; expired leases cannot certify archives. Old V3 cannot acknowledge this barrier. Verify authenticates decryption and tar; Restore-Staging extracts into a NEW labelled volume, never live data. Only empty staging-root initialization uses a fixed root/CHOWN helper; extraction returns to UID1000. Check restored roots and modes. Provider grants can expire independently of archive validity; do not refresh copied credentials concurrently as a test.

Initialize-SandboxBackupIdentity stores the age identity with owner DPAPI. Independently export it in an owner-visible console with Export-SandboxBackupIdentity, choosing a private recovery passphrase and passing the independent decryption probe. Never send key/passphrase in chat. A verified off-laptop archive AND usable recovery key, with the passphrase separately retained, are mandatory cutover gates. A local cloud-folder file alone is not proof of synchronization.

Register-SandboxBackup schedules Sunday03:00 local wall time, including DST changes, after owner login and verifies each archive. Use an owner/SYSTEM-only USERPROFILE/.cartshift-sandbox folder for DPAPI files, configuration and watchdog leases; packaged-app AppData virtualization is not an unattended-task location. Resolve persistent installed ARM64 PowerShell instead of a Codex runtime cache. Workers wait while a container is paused. After streaming, certification inspects pause state and original start time without docker exec; a resumed/restarted source is refused. Review LastTaskResult and last-backup-status.json. Windows must be awake; StartWhenAvailable handles missed runs. No automatic archive deletion is configured. Keep an off-host copy and perform quarterly staging restores.

## Ordered rollout

1. Preserve original controller, task XML, image/source hashes, container, volumes and provider homes. Make encrypted volume and Windows-configuration backups; verify decryption, staging restore and independent off-host recovery.
2. Add the sandbox_command_jobs(ownerUid ASC, createdAt DESC) index to cartshiftstudio/(default) without deleting unrelated indexes/TTL overrides. Verify READY. Configure distinct SANDBOX_AUTH_WORKER_TOKEN as a production Secret, enforcement OFF.
3. Test/deploy backwards-compatible V4 backend BEFORE V4 workers; prove V3 still works. A legacy-role V4 protocol staging test can preserve all existing mounts, with verified backup and controller rollback available; it does not establish isolation.
4. After recovery gates pass, stop old supervisor and all workspace users. Prepare auth snapshot with -RestoreVerified; review its manifest; CreateSidecar/Verify with exact manifest hash. Review -WhatIf without false attestations.
5. Prepare/verify build candidate using fresh homes, empty read-only shadow and original image/network; retain legacy container. Start pinned auth-only and candidate build-only supervisors with exact ImageId/worker/PTY hashes and private DPAPI files. Never run two session workers.
6. Test CLI status/login, commands, queued/running cancellation, timeouts, multi-chunk binary hashes, recent jobs, cross-token rejection, persistence and container/worker recovery. Prove build cannot access credentials or modify auth tools.
7. Enable auth enforcement and redeploy; prove dedicated bearer succeeds and build bearer fails session sync. Activate by reversible rename only after verified gates; retain ai-dev-workspace-retained and every original volume.
8. Register owner auth/build logon supervisors and fixed Start-SandboxLocalMcp launcher with exact new mounts/image pin. The old three-volume launcher must reject V4; do not weaken its mount checks. Register verified backups and test controlled failures. Coordinate any physical Windows reboot with the owner.
9. In a fresh ChatGPT Android chat with the existing CartShift app, verify refreshed tools and status/run/result/cancel/recent-jobs/artifact/login. Desktop/backend tests do not certify Android UI. Keep PR draft until acceptance evidence is recorded.

## Rollback and limits

Stop new supervisors BEFORE restoring names or credentials. Retain old sources/hashes/task and container; never run competing session workers or credential copies. Roll worker back with the backwards-compatible V4 backend retained; do not put V4 against older backend or replay unacknowledged commands. Keep auth snapshots and encrypted backups; no credential cleanup during this deployment.

Managed services require dependencies resolved inside the project subtree; project wrappers must accept Next/Vite argument conventions. Project .env remains readable by its own code. Loopback previews need a separately authorized authenticated tunnel for mobile access. Docker Desktop/logon tasks cannot provide availability while asleep/off or before owner login. No power policy is silently changed.

Docker Desktop → ai-dev-pool-1 / ai-dev-pool-2 → Logs shows command-worker health, connections, progress, results and timeouts. ai-auth-sandbox → Logs shows redacted auth-session metadata; ai-dev-workspace → Logs is the separate local MCP server. Rotation is three5MB files. Raw manual terminal sessions are separate; managed app logs may contain project data and should be viewed locally.
## Recorded workstation evidence

The compatible V4 backend is live; five existing CLI identities, command/PTY round trips, running and queued cancellation, timeout124 and a125-second command passed. The independently passphrase-tested recovery key and both original encrypted archives have matching local-copy hashes and Windows Cloud Files IN_SYNC confirmation in OneDrive/Documents/CartShiftSandboxBackups. Cloud synchronization status does not promise permanent provider grants. Current activation evidence is maintained in the deployment record; never infer isolated enforcement or Android acceptance from this paragraph.


## Active host state and October 25 corrections

The isolated auth sidecar and credential-blind primary are active; the coordinated two-slot V5 command pool is also active. Auth enforcement is enabled in production. The retained original runtime must remain stopped. Current production and rollback IDs, pins and acceptance evidence are in `SANDBOX_PLATFORM_V4_DEPLOYMENT_2026-10-23.md` and `SANDBOX_PARALLEL_EXECUTION.md`.

Managed project services now pin the actual `/app` kernel mount root before app execution. Docker follows symlink volume subpaths, so path-string validation alone is insufficient. The immutable launch guard reruns on restart. Existing services without `io.cartshift.sandbox.project-guard=mountinfo-v1` must be stopped/retained and replaced, never silently trusted.

The scheduled backup wrapper requests the existing installed Docker Desktop once when the verified local daemon is unavailable, then retries for up to 300 seconds. It does not retry security/architecture mismatches. An owner can set `docker_wait_seconds` (0–1800) and `docker_retry_seconds` (1–60) in private `scheduled-backup.json`. `last-backup-status.json` describes the latest attempt; `last-backup-success.json` is replaced atomically only after a successful authenticated full archive verification and SHA-256 check. A failed attempt never destroys earlier archives or a successful receipt. Weekly scheduling is Sunday 03:00 local wall time, after owner logon. Existing Documents copies and OneDrive sync require separate verification; a local matching hash alone does not certify off-PC recovery.

Firebase interactive login fixes `FIREBASE_DEBUG_PATH` to `/workspace/.auth/firebase/.cache/firebase-debug.log`, inside the private auth volume. Owner-only read-only status probes should also use a writable cwd or that fixed environment path; Firebase initializes its log before checking authentication. Do not publish raw provider debug logs. Reviewed guardian SHA-256: `336ab94c2da6cf0939fb1240ee5e482ef7363cdb4fdd76c07ce9c2a576af44e0`. Existing worker/tools pins are unchanged.

A genuine Windows reboot/login, actual ChatGPT Android UI acceptance and any expired provider grant remain separate checks. Keep PR #122 draft until those checks and the newest encrypted backup's off-PC synchronization are recorded.

For owner-driven source upgrades, stop the old scheduled supervisor and wait for it to exit before starting its replacement. Confirm a fresh handshake, inspect the running source hashes and perform a real session test. Updating the registered task action alone does not prove that an older Docker exec process was replaced.
