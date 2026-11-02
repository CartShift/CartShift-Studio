# Sandbox V4 Windows Activation Implementation Plan

**Goal:** Deploy and verify PR122 without losing the working V3 environment or any authentication.
**Architecture:** Existing outbound CartShift transport; separate immutable-toolchain authentication container and credential-blind build container. Owner-only Windows Docker lifecycle, source hash verification, no Docker socket or public listener in workers.
**Spec:** docs/engineering/SANDBOX_PLATFORM_V4_OPERATIONS.md

## Global constraints
Preserve all existing files, volumes and credentials. No destructive credential cleanup. Keep PR unmerged until replacement verified. No new paid services. Back up and restore before migration. A verified independent off-host archive and recoverable key are cutover gates.

## Review focus
Mixed worker leases must not misreport cancellation; stale lease heartbeats cannot impersonate live work. Partial PTY input must not be falsely acknowledged. A worker crash must not leave commands running across restart. Backup streams must stay encrypted off-host with no plaintext archive. Role mount and immutable toolchain checks must fail closed on escapes or mismatched resources.

- [ ] Review entire PR, operations doc and host baseline; preserve hashes/task/container metadata.
- [ ] Fix lease-bound backend status/cancellation and separate-channel provenance with regression tests.
- [ ] Fix partial PTY input/recovery; add bounded input tests and worker restart gates.
- [ ] Correct host endpoint pinning, paths, resource/mount checks and task launch settings; test on Windows.
- [ ] Stream encrypted snapshots of all required named volumes; verify authenticated decryption and staging restore; confirm off-host archive and recovery-key availability.
- [ ] Deploy new Firestore index additively, verify READY, then backwards-compatible backend with enforcement off; prove V3 still works.
- [ ] Stage private auth/toolchain snapshots and build candidate; verify provider sessions without exposing contents.
- [ ] Cut over only after backup gates: stop old worker safely, run pinned isolated workers, test actual MCP command/cancellation/artifacts/authentication/persistence/recovery.
- [ ] Enable auth enforcement; prove wrong-channel bearer rejection; activate name/task startup and managed dev-service tests.
- [ ] Update operations architecture and same PR with exact tests/deployment status and unresolved human-only mobile/reboot/key actions.
