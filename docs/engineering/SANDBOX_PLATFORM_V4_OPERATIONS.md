# AI Docker Sandbox V4 — Operations and staged rollout

**Scope:** one owner-only mobile development bridge, worker protocol V4, reliable recovery and backup procedures. Keep CartShift as transport; no additional public MCP endpoint, Docker socket, host filesystem mount, or inbound listener.

## Verified baseline (2026-10-23)

- Production worker V3 online, Linux ARM64, UID 1000, root filesystem read-only, capabilities empty, Docker socket absent.
- `/workspace` is backed by named volume `ai-dev-sandbox-workspace`; GitHub, Supabase, Firebase, Vercel and Shopify CLI authorization was checked.
- V3 worker and auth guardian are hash-preloaded by an owner-side Windows supervisor. This repository **does not** contain the owner-side credential, supervisor source or Task Scheduler registration. Do not claim those host settings were inspected.
- Desktop Commander was offline. It is not required for this MCP bridge.

## What V4 changes

1. **Cooperative running-job cancellation:** `sandbox_cancel_command` cancels queued jobs immediately. For an active V4 worker, it requests cancellation; a bounded independent heartbeat carries the authenticated job ID and lease token. The worker terminates the full job process group, reaps descendants and returns exit 130. A returned `cancel_requested` is *not* completed cancellation. Check `sandbox_get_result` for final `cancelled` status. With older workers, running cancellations remain unavailable.
2. **Binary-safe artifact chunks:** `sandbox_read_artifact` only reads regular files below `/workspace/artifacts`, rejects dotfiles, traversal, symlinks and directory entry races using `openat`/`O_NOFOLLOW`. Max 12,000 bytes per chunk. `sandbox_get_result` stdout contains JSON with `base64`, chunk SHA-256, offset, bytes, total_bytes. Clients must verify SHA-256 and concatenate chunks by offset. This is not a public file hosting endpoint; every chunk is subject to owner auth and 7-day Firestore job-result retention. **Do not put secrets in artifact files.**
3. **Job diagnostics:** `sandbox_recent_jobs` returns owner-only metadata, not commands/logs. Requires the new Firestore composite index on `sandbox_command_jobs(ownerUid ASC, createdAt DESC)`.
4. **Windows recovery controls:** `Test-SandboxHost.ps1` checks Docker/container/worker process, rootfs, privilege restrictions, Task Scheduler and optional backup freshness. `Register-SandboxSupervisor.ps1` registers the *existing* reviewed owner-held supervisor to start at user logon using the current Windows account and DPAPI identity. This is not a pre-logon Windows service.
5. **Encrypted recoverable backups:** `Backup-Sandbox.ps1` uses a pre-reviewed BusyBox image, disables network and capabilities during archive creation, pauses the running sandbox temporarily to quiesce the volume, encrypts with an **age public recipient**, verifies authentic decryption and restores only to a separate staging volume. The backup's temporary plaintext tar must reside on a BitLocker-encrypted drive; deleting it does not guarantee SSD secure erasure.

## Non-negotiable security boundaries

- The current command runner and per-provider OAuth homes share UID 1000. File mode 0700 **does not isolate provider secrets** from untrusted code running as UID 1000. This cannot be repaired solely with chmod, environment variables or prompt rules.
- Treat the entire sandbox as trusted development code. Do not run untrusted dependencies while provider sessions remain logged in. Grant provider minimum scopes and rotate/revoke old sessions.
- True isolation requires a **separate OS/container identity and separate auth volume**, plus a narrow broker between the credential service and the development worker. It is intentionally not faked in this PR because the owner's current volume/container topology must first be migrated and verified on Windows without losing credentials.
- Long-lived development servers remain unsupported by the stateless job process cleanup contract. Do not defeat the subreaper or leave detached processes. A dedicated supervised service runtime must be designed/deployed separately from shell jobs. This is a tracked functional limitation, not a feature claimed completed.
- A sleeping or powered-off Windows host cannot provide availability. For 24/7 uptime migrate the **same outbound-worker architecture** to an always-on VM after independent restore validation.

## Owner activation checklist

- [ ] Review the PR diff and targeted tests. Do not deploy a worker before the backend accepts V4. Verify `SANDBOX_OWNER_UID` and `SANDBOX_WORKER_TOKEN` are configured as production secrets without printing their values.
- [ ] Review/create the composite Firestore index and verify it becomes **READY**. Do not overwrite unrelated live indexes. Deploy backend before worker; confirm V3 `sandbox_status` and ordinary commands still work.
- [ ] On Windows, confirm Docker Desktop auto-start, sandbox container start policy, and the existing hash-validating supervisor script. The owner-side script is not accessible from this repo. Recompute/review SHA-256 for **both** V4 worker and unchanged PTY module; update only the allowlisted owner-held hashes after code review.
- [ ] Use `Register-SandboxSupervisor.ps1 -OwnerSupervisorScript <reviewed absolute host path> -WhatIf`, then register as the signed-in owner. The account must log in after reboot; select power/sleep policy explicitly.
- [ ] Restart the owner supervisor using its trusted host mechanism. Verify `sandbox_status.worker_version === 4`, capabilities include `cancel_running` and `artifact_chunks`, and V3 interactive authorization still works.
- [ ] Verify queued cancellation, running cancellation on a harmless `sleep 20`, timeout, artifact binary/chunk hash and a multi-chunk file. Check owner isolation and reject symlink/dotfile reads.
- [ ] On an encrypted drive, set up a separate age identity and backup **public** recipient. Review and pre-pull `busybox:1.36.1`. Execute `Backup-Sandbox.ps1 -Action Backup -BackupDir <encrypted dir> -Recipient <age1...>`, then `-Action Verify -BackupDir <dir> -Archive <file.age> -IdentityFile <owner private key>`. Finally execute `Restore-Staging` to a new volume and inspect it. Store an additional encrypted copy **off the Windows laptop**.
- [ ] Review and register `Register-SandboxBackup.ps1 -BackupScript <reviewed Backup-Sandbox.ps1> -BackupDir <encrypted dir> -Recipient <age1...> -Day Sunday -Time 03:00 -WhatIf`, then register for real under the owner identity. Set host monitoring/alerting on task failures. Backups temporarily pause the container; never run during active jobs. Document backup retention, encrypted-drive recovery key location, and quarterly staging-restore drills.
- [ ] Run `Test-SandboxHost.ps1 -BackupDir <dir> -SupervisorTaskName CartShiftSandboxWorker` on the host. A logon task cannot be certified from inside Linux.
- [ ] Verify old V3 worker / backend rollback together; do not roll backend below V4 while V4 worker is active. To roll back safely, stop the owner supervisor first, restore old hashes and worker, then confirm V3 status. Artifact jobs queued at rollback will fail without being rerun.

## Development verification

```bash
python3 -m unittest discover -s tests/scripts -p 'test_sandbox_v4.py' -v
python3 -m unittest discover -s tests/scripts -p 'test_sandbox_worker.py' -v
pnpm exec vitest run tests/api/cartshift-mcp-sandbox-jobs.test.ts tests/api/cartshift-mcp-sandbox-worker-route.test.ts
python3 -m json.tool firestore.indexes.json >/dev/null
```

Run typecheck after preparing repository-generated translation types. A baseline site/portal message-key mismatch may block the broad typecheck even when sandbox-specific tests pass. Report it separately rather than silently modifying localization keys in a sandbox PR.

## Rollout risk controls

- V4 job types only lease when worker heartbeat reports `version >= 4`. V3 command/auth sessions continue working.
- The worker remains single-owner, single serial command executor. Cancellation is polled separately and doesn't block subprocess output or timeouts; cancellation requests are authenticated against the current job lease token.
- The command and output are not included in activity events. Firestore persists command strings and bounded outputs for seven days; do not put secrets in command arguments or output.
- Backups are independent only after a **verified off-host copy and a staging restore**. A named volume alone is not a backup.
