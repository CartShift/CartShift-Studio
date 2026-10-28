# Portable sandbox on Android / Podroid: guarded rollout

## Verified facts and boundaries

The owner's Android Podroid VM runs Alpine Linux on ARM64 and passed Docker hello-world, with 4 vCPUs and about 3.8 GiB usable VM RAM. This proves Docker works locally, NOT that the Windows Docker sandbox (projects, tooling, auth, Desktop Commander, durable volumes) has been transferred. KVM/AVF backend has not been verified in this conversation.

The Windows architecture is V5, not the old V3 single-worker setup: 2 concurrent build-only workers, isolated OAuth sidecar, credential-blind homes, private Desktop Commander socket and engine, authenticated owner-only CartShift MCP queue, pinned owner-supplied worker source, no inbound ports, plus independently encrypted age backups. Do not recreate it as a shared-credential all-in-one container.

This change supplies tested-oriented diagnostics and exact Docker image export/import ONLY. It does not start a worker, alter production, migrate secrets or workspace state, or provide automatic failover.

## Desired architecture

ChatGPT Android or desktop -> the existing CartShift MCP -> its existing Firestore queue -> only one active HOST at a time. The active host runs the same verified ARM64 image and a verified, current workspace snapshot. The phone initially runs at most ONE isolated build worker; isolated auth and local Desktop Commander are separate later acceptance gates. Avoid a second MCP or hosted Desktop Commander service.

A Git repository synchronizes committed source, not uncommitted changes, ignored state, databases, persistent volumes or credentials. Git alone cannot implement the requested handoff. Running process memory and open sessions do not migrate; they restart.

## What can be done right now on Podroid

1. In Podroid VM terminal, after login and changing the root password, run:

    sh scripts/mobile-sandbox/podroid-preflight.sh

   Get this script from the reviewed PR branch, not from an untrusted paste site.
2. It validates Linux/ARM64, Docker server, Compose, and a named-volume read/write. It keeps volume cartshift-mobile-preflight deliberately.
3. Stop and restart the Podroid VM and repeat. Separately inspect AVF/KVM versus QEMU backend inside the Android Podroid app. Check battery/background restrictions in the Android OS.
4. Disable wireless debugging when no longer needed; restore other temporary debug-security changes. Do not expose SSH, container ports, a Docker socket, or an unauthenticated TCP API on a public network.

## What must be done while the laptop is online again

1. Inspect the ACTUAL live pool and Desktop Commander runtime, role mounts, volume manifests, named volumes, exact image and pinned worker/PTY sources. Do not guess mounts from the current Git repository: the live host setup contains owner-held files and Windows tasks.
2. Quiesce all workload writers, inspect pending leases and ensure jobs finish or are explicitly resolved. The V5 watchdog must physically fence a worker before an uncertain old lease may be released. Never simply delete Firestore reservations or retry uncertain jobs.
3. Verify a fresh encrypted whole-workspace backup, independent decryption test, staging restore, usable recovery key and successful off-host transfer. Preserve the existing 11/12-volume records and Windows task/config backup. Never paste the backup identity, raw credentials, or authorization tokens into chat.
4. On Windows, in the reviewed repository directory, run:

    .\scripts\mobile-sandbox\export-pc-image.ps1 -OutputDirectory C:\Private\SandboxTransfer

   It exports only the immutable ARM64 Docker image of the actual ai-dev-pool-1 container. A sibling JSON manifest includes its exact image ID, SHA256 and bytes. There are NO volumes or credentials in this tar. The script does not touch existing host containers/volumes.
5. Copy the archive and manifest to local Podroid storage via an owner-approved private transfer. Confirm sufficient disk space for image layers, workspace archive, extraction overhead and Docker usage, not just the size of the tar.

## Image import on the phone

Run in Podroid terminal with values copied from the actual owner-generated manifest:

    sh scripts/mobile-sandbox/podroid-import-image.sh ./sandbox-arm64-TIMESTAMP.tar 64_HEX_SHA256 sha256:64_HEX_IMAGE_ID

The importer checks the SHA256 before loading, checks the expected immutable image ID afterward and requires ARM64. It does NOT create worker containers, restore volumes, or connect to the production CartShift queue.

## Mandatory gates BEFORE starting mobile work

- Restore only to NEW volumes, using the actual inspected Windows mount map and verified encrypted backup. Check for path symlinks, UID 1000, file integrity, workspace version, source revisions and excluded credentials. A new backup taken while PC is off cannot include unsynchronized PC changes.
- Build a mobile Compose file from the actual V5 container specs, preserving UID1000, hostname ai-docker-sandbox, read-only root, cap_drop ALL, no-new-privileges, exact read-only empty .auth shadow, limits on CPU/RAM/PIDs, no personal host mounts, no Docker socket, and no published ports. Verify service roles and secrets are isolated. Do not use the Podroid root shell as the worker.
- Use the exact reviewed version of worker.py and sandbox_pty.py with source integrity checks and provide the build-only worker bearer through an owner-controlled out-of-band secret channel, never a repo, environment dump, terminal history, screenshot, process arguments or chat. Do not import broad provider credentials into build workers.
- Drained single-host handoff only: cleanly stop the laptop's build supervisors (including automatic restart tasks) before mobile activation. Verify no active remote job or live lease, and that the laptop cannot restart a worker. The current V5 pool tracks per-slot incarnations and fencing; a stale busy slot is a hard stop. For a clean idle slot, its previous heartbeat must be stale for >90 seconds before a new worker can claim it. Do not auto-steal.
- Mobile first: one slot, no auth sidecar. Because the laptop had two active slots, all reservations on both must be reconciled before claiming the phone owns the logical workspace. Auth sidecar and local Desktop Commander must not be claimed as available until separately set up and tested.
- Acceptance through the EXISTING connector: sandbox_status must show a fresh worker; sandbox_run_command must return UID1000/Linux/aarch64/ai-docker-sandbox and /workspace. A unique write/edit/read proof must succeed against the restored mobile filesystem. Verify the actual mobile worker identity and volumes, not merely sandbox_ping or a completed remote job from the PC.
- Reverse handoff: stop mobile workload writers and worker; take a verified mobile checkpoint, sync all state back, then resume Windows workers. Never allow two active hosts modifying divergent copies of /workspace.

## Capacity and limitations

4 GiB in Podroid is a HOST budget; the PC's existing 2 x 2 GiB workers + auth + Desktop Commander cannot fit safely in the same allocation. Start only one small worker, measure RAM/CPU, and add components only after profiling. Android background termination and virtualisation performance may prevent unattended or long-running tasks.

There is no completed phone migration, automatic cloud synchronization, worker credential provisioning, authentication migration, or measured ChatGPT mobile activation yet. Keep the original Windows instance and its PR #122 / #124 acceptance gates intact.
