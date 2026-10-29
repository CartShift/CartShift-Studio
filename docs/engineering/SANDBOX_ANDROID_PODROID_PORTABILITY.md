# Portable sandbox on Android / Podroid: guarded rollout

## Verified facts and boundaries

The owner's Android Podroid VM runs Alpine Linux on ARM64 and passed Docker hello-world, Compose, persistent named-volume restart, and Node.js CPU smoke tests. It has 4 vCPUs and about 3.8 GiB usable VM RAM. Its AVF diagnostic confirms **QEMU software emulation**, because the device only supports protected VMs. This proves Docker works locally, NOT that the Windows sandbox projects, tooling, auth, Desktop Commander, or durable volumes have been transferred.

The repository describes a V5 parallel-capable architecture: isolated build-only workers, OAuth sidecar, credential-blind homes, private Desktop Commander socket and engine, owner-only CartShift MCP queue, pinned owner-supplied worker source, no inbound ports, and encrypted age backups. **Actual host review (October 29): the active Windows supervisor uses a pinned V3-compatible adapter, with the second supervisor disabled.** Do not infer a live V5 dual-worker deployment from an unmerged PR; verify the effective backend/host protocol before any mobile activation. Never recreate a shared-credential all-in-one container.

The Windows ARM64 image was exported and its archive verified on Windows. The owner uploaded the 1,023,948,800-byte tar plus manifest to private Google Drive, transferred them to the Android Downloads share, obtained **SHA-256 OK** and ran `docker image load --platform linux/arm64` on Podroid. Docker returned source image digest `sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee`. This image includes **neither the workspace nor provider credentials**. New `scripts/mobile-sandbox/podroid-image-smoke.sh` tests the imported image without mounts, network, or worker registration. No running worker, production switch, workspace restore or automatic failover has occurred.

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

1. Inspect the ACTUAL live pool and Desktop Commander runtime, role mounts, volume manifests, named volumes, exact image and pinned worker/PTY sources. Do not guess mounts from the current Git repository: the live host setup contains owner-held files and Windows tasks. First run the read-only redacted inventory in the owner Windows PowerShell, with the reviewed PR branch checked out:\n\n    .\\scripts\\mobile-sandbox\\inventory-pc-sandbox.ps1 -OutputDirectory $env:USERPROFILE\\Documents\\SandboxMobileInventory\n\n   Inspect the output locally. It excludes environment values, tokens, host mount source paths, log content and volume contents. The inventory is NOT a verified backup and must not be treated as such.
2. Quiesce all workload writers, inspect pending leases and ensure jobs finish or are explicitly resolved. The V5 watchdog must physically fence a worker before an uncertain old lease may be released. Never simply delete Firestore reservations or retry uncertain jobs.
3. Verify a fresh encrypted whole-workspace backup, independent decryption test, staging restore, usable recovery key and successful off-host transfer. Preserve the existing 11/12-volume records and Windows task/config backup. Never paste the backup identity, raw credentials, or authorization tokens into chat.
4. On Windows, in the reviewed repository directory, run:

    .\scripts\mobile-sandbox\export-pc-image.ps1 -OutputDirectory C:\Private\SandboxTransfer

   It exports only the immutable ARM64 Docker image of the actual ai-dev-pool-1 container. A sibling JSON manifest includes its exact image ID, SHA256 and bytes. There are NO volumes or credentials in this tar. The script does not touch existing host containers/volumes.
5. Copy the archive and manifest to local Podroid storage via an owner-approved private transfer. Confirm sufficient disk space for image layers, workspace archive, extraction overhead and Docker usage, not just the size of the tar.

## Image import on the phone

Run in Podroid terminal with values copied from the actual owner-generated manifest:

    sh scripts/mobile-sandbox/podroid-import-image.sh ./sandbox-arm64-TIMESTAMP.tar 64_HEX_SHA256 sha256:64_HEX_IMAGE_ID

The importer checks the SHA256 before loading, checks the expected immutable image ID afterward and requires ARM64. The actual owner already imported the image using direct Docker `image load --platform linux/arm64` and checked the archive hash separately. OCI-index image IDs can differ from local platform image IDs on other Docker engines; never bypass architecture verification or assume that the index digest is always inspectable. Nothing in this step starts a worker, restores volumes or connects to the CartShift queue.

## Mandatory gates BEFORE starting mobile work

- Restore only to NEW volumes, using the actual inspected Windows mount map and verified encrypted backup. Check for path symlinks, UID 1000, file integrity, workspace version, source revisions and excluded credentials. A new backup taken while PC is off cannot include unsynchronized PC changes.
- Build a mobile Compose file from the actual V5 container specs, preserving UID1000, hostname ai-docker-sandbox, read-only root, cap_drop ALL, no-new-privileges, exact read-only empty .auth shadow, limits on CPU/RAM/PIDs, no personal host mounts, no Docker socket, and no published ports. Verify service roles and secrets are isolated. Do not use the Podroid root shell as the worker.
- Use the exact reviewed version of worker.py and sandbox_pty.py with source integrity checks and provide the build-only worker bearer through an owner-controlled out-of-band secret channel, never a repo, environment dump, terminal history, screenshot, process arguments or chat. Do not import broad provider credentials into build workers.
- Drained single-host handoff only: cleanly stop the laptop's build supervisors (including automatic restart tasks) before mobile activation. Verify no active remote job or live lease, and that the laptop cannot restart a worker. The current V5 pool tracks per-slot incarnations and fencing; a stale busy slot is a hard stop. For a clean idle slot, its previous heartbeat must be stale for >90 seconds before a new worker can claim it. Do not auto-steal.
- Mobile first: one slot, no auth sidecar. Check every active/retained slot on the real host and reconcile its reservations before claiming that the phone owns the logical workspace. Auth sidecar and local Desktop Commander must not be claimed as available until separately set up and tested.
- Acceptance through the EXISTING connector: sandbox_status must show a fresh worker; sandbox_run_command must return UID1000/Linux/aarch64/ai-docker-sandbox and /workspace. A unique write/edit/read proof must succeed against the restored mobile filesystem. Verify the actual mobile worker identity and volumes, not merely sandbox_ping or a completed remote job from the PC.
- Reverse handoff: stop mobile workload writers and worker; take a verified mobile checkpoint, sync all state back, then resume Windows workers. Never allow two active hosts modifying divergent copies of /workspace.

## Capacity and limitations

4 GiB in Podroid is a HOST budget; the PC's existing 2 x 2 GiB workers + auth + Desktop Commander cannot fit safely in the same allocation. Start only one small worker, measure RAM/CPU, and add components only after profiling. Android background termination and virtualisation performance may prevent unattended or long-running tasks.

**Windows recovery review (owner Codex, October 29):** Four selected containers and nine referenced volumes reconcile with twelve backup volumes. Authenticated decryption passed for the existing workspace and configuration backups; local OneDrive copies match. However, **off-host download and independent recovery are unverified**, and a **fresh migration checkpoint and refreshed configuration backup** remain necessary. Eleven existing containers, seven task definitions and volumes were preserved.\n\nThere is no completed phone workspace migration, automatic cloud synchronization, worker credential provisioning, authentication migration, or verified ChatGPT mobile activation yet. Keep the original Windows instance and its PR #122 / #124 acceptance gates intact.
