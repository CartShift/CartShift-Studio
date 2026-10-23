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


## V4.1: isolated auth/build runtime (new host-side implementation)

The V4 Python binary now supports three intentionally distinct roles:

| Role | Container hostname | Jobs | OAuth sessions | Required volumes |
| --- | --- | --- | --- | --- |
| `legacy` (default) | `ai-docker-sandbox` | Yes | Yes | Current combined workspace, only for backward-compatible staging |
| `build` | `ai-docker-sandbox` | Yes | No | Workspace with a **separately mounted, empty, read-only** `/workspace/.auth` shadow |
| `auth` | `ai-auth-sandbox` | **No** | Yes | Separate credential home and immutable-reviewed CLI snapshot; **no projects** |

Build role **refuses to start** if the nested auth volume is missing, writable, contains files, or if the verified hostname does not match. Auth role refuses to start if it can see `/workspace/projects`. Auth sidecar never polls general command jobs. The old V3 worker remains supported until the owner explicitly cuts over.

Two independent backend credentials are supported. `SANDBOX_WORKER_TOKEN` continues to authorize normal build jobs. A distinct `SANDBOX_AUTH_WORKER_TOKEN` authorizes the auth-session endpoint. During staged migration, legacy session credentials can still be used. After the separate auth worker is healthy, set **`SANDBOX_AUTH_WORKER_ENFORCE=true`** and redeploy. After that point the build-worker bearer can no longer access auth-session synchronization. Auth-session workdirs are constrained to `/workspace` after enforcement.

**Why separate toolchains?** Merely copying OAuth files to another volume would not be sufficient if malicious build code could modify a shared CLI script that the auth sidecar later executes. `Prepare-SandboxAuthIsolation.ps1` snapshots `devctl` and installed CLI dependencies to their own volume and mounts the snapshot read-only in the auth sidecar. Review that snapshot before the cutover; the snapshot is not an automatic trust guarantee.

### Safe host activation sequence

These scripts require **PowerShell 7.3+, Docker Desktop, owner login, and an existing authenticated Windows workstation**. They have not yet been executed or verified on the owner's Windows machine.

1. Make and **verify an off-host encrypted backup and a staging restore** using `Backup-Sandbox.ps1`. Confirm all source and Windows-side worker hashes; do not store bearer tokens in source control.
2. Deploy backend V4 and Firestore index. Add a **distinct** `SANDBOX_AUTH_WORKER_TOKEN` in backend production secrets, leaving enforcement OFF during staging.
3. Run `Prepare-SandboxAuthIsolation.ps1 -Action Prepare -WhatIf`, review the plan, then run without `-WhatIf`. This snapshots only; it never deletes current logins. Run `-Action CreateSidecar` and `-Action Verify`.
4. Run `Convert-SandboxBuildContainer.ps1 -Action Prepare -WhatIf`, then create and `-Action Verify` the shadow-mounted candidate. The legacy container remains available for rollback.
5. On Windows, use `Save-SandboxAuthToken.ps1 -OutputFile <private DPAPI path>` to store a separate auth worker secret. The same value must already be configured privately in backend secrets. The token file must NOT be in the repository or a synced folder.
6. Stop the **old worker supervisor** and confirm no active authentication session or command. Stop the legacy Docker container (its data volume is preserved). This avoids concurrent session epochs and command workers. No seamless zero-downtime credential migration is claimed.
7. Start the auth sidecar supervisor with `Run-SandboxAuthWorker.ps1 -WorkerSource <reviewed worker.py> -GuardianSource <reviewed sandbox_pty.py> -WorkerSha256 <exact verified hash> -GuardianSha256 <exact verified hash> -DpapiTokenFile <owner-only DPAPI file>`. It accepts token data only via stdin. Validate a fresh auth-session handshake.
8. Start the **candidate** build worker using the existing hash-verified Windows supervisor, but target `ai-docker-sandbox-v4-candidate`, set `SANDBOX_WORKER_ROLE=build`, and use the **current reviewed V4 worker SHA**. Verify `sandbox_status.worker_version === 4`, run/read/cancel, artifact chunks and login from mobile. Do not remove the legacy container yet.
9. Enable `SANDBOX_AUTH_WORKER_ENFORCE=true` in backend and redeploy. Verify the old build-worker bearer now fails auth-session access while the dedicated auth bearer still works. Then, with the original container stopped, run `Convert-SandboxBuildContainer.ps1 -Action Activate -AuthWorkerVerified -AuthTokenEnforced -OffHostBackupVerified`. The legacy container is preserved as `ai-docker-sandbox-retained`.
10. Update the existing worker supervisor to target the activated container and keep role `build`. Register `Run-SandboxAuthWorker.ps1` via `Register-SandboxAuthSupervisor.ps1` and confirm both supervisors start at Windows logon. Test recovery from a controlled worker failure and a **user-initiated** Docker restart.
11. **Only after** verifying login, source checksums and off-host restore, optionally run `Prepare-SandboxAuthIsolation.ps1 -Action Finalize -BuildContainer ai-docker-sandbox-retained -RestoreVerified -AuthWorkerVerified -AuthTokenEnforced`. This deliberately deletes the old credential copies in the original workspace volume. Historical backups still contain those tokens; retain encryption and rotate credentials as appropriate.

A failed cutover must stop the new supervisors **before** restoring the old worker and token configuration. Never run both session workers against the active session control document. Rollback must retain the private credential snapshot.

### Managed development servers

`Manage-SandboxDevService.ps1` is a separate **Windows owner-side** lifecycle controller (`Start`, `Stop`, `Status`, `Logs`, `Remove`). It creates a supervised container from the already-pinned sandbox image, mounted on **only the selected project's volume-subpath**, with UID 1000, read-only root, no Docker socket, no credential volume, limited memory/PIDs/CPU and host loopback-only port publishing.

Example after inspecting the project package.json:

```powershell
./scripts/sandbox-host/Manage-SandboxDevService.ps1 -Action Start -Project cart-shift-studio -Framework Next -ContainerPort 3000 -HostPort 13000 -WhatIf
./scripts/sandbox-host/Manage-SandboxDevService.ps1 -Action Start -Project cart-shift-studio -Framework Next -ContainerPort 3000 -HostPort 13000
./scripts/sandbox-host/Manage-SandboxDevService.ps1 -Action Status -Project cart-shift-studio
```

This service survives the normal stateless command cleanup because it runs as a **distinct host-supervised Docker container**. It does not make the Docker daemon remotely available to ChatGPT, nor publish previews publicly; use only a reviewed authenticated tunnel for off-host viewing if needed. Docker Engine must support `volume-subpath`; the selected subdirectory must exist. See the [Docker volume documentation](https://docs.docker.com/engine/storage/volumes/) and [loopback-only port publishing guidance](https://docs.docker.com/engine/network/port-publishing).

### Remaining verification, not implementation promises

- **Windows PowerShell script execution and NTFS/DPAPI verification** require the owner's host. The current mobile bridge cannot execute on Windows; it intentionally cannot control Docker.
- **Provider CLI validity in the isolated sidecar** requires an owner-approved real login check after copy; automatic copying is not proof that OAuth grants remain usable.
- **Per-project app secrets** can still be read by that project's own code; do not mistake project-subpath mounts for secrets management.
- **Remote start/stop of managed dev services** is not exposed through MCP: deliberate boundary, not an accidental omission. Changes go through the Windows owner.
- **Availability while the laptop is asleep/off** cannot be solved through local Docker. Deploy the outbound worker to an always-on host if that becomes necessary.
- **Full repository typecheck** previously failed on unrelated locale typing errors. Check them separately from sandbox-specific validation before production deployment.
