# Parallel Sandbox Implementation Plan

**Goal:** Two independent agents run existing MCP commands concurrently on the existing ARM64 host.
**Architecture:** Firestore transaction serializes only claims, not computation. Two credential-blind containers each run one serial V5 worker, with unique boot identities, bounded leases and independent host supervisors. Keep all V2–V4 endpoints compatible with pool activation disabled. Never requeue a leased command: lost work is explicitly uncertain, preserving at-most-once execution.
**Tech Stack:** Existing Firestore, Next.js, Python stdlib, Docker Desktop, PowerShell.
**Spec:** User requirements in PR #122 continuation, 2026-10-24.

## Global constraints
Preserve every existing file, volume, credential and configuration. Keep auth role separate. No worker Docker socket or host mount. Two slots by default; maximum 8 configured slots. No Git requirement for tasks. Independent task directories share the persistent workspace and installed tools. Scope reservations serialize overlapping cwd trees; commands modifying resources outside cwd must use a workspace-wide cwd or explicit flock (cooperative, not a security boundary).

## Review focus
Lost poll/completion responses must never rerun jobs; simultaneous claims must not oversubscribe; old worker incarnations must not overwrite new ones; overlapping paths and symlinks must not bypass reservations; crashing one worker must only restart its own container.

### Task 1: Atomic pool backend
- [ ] Add transaction concurrency tests for two claims, third queued, FIFO and overlapping resources, stale identity, lease expiry and idempotency.
- [ ] Implement lib/mcp/sandbox-pool.ts and V5 route dispatch; expose per-slot status through existing status tool; add FIFO index.
- [ ] Run sandbox API tests.

### Task 2: Independent worker and Windows lifecycle
- [ ] Test V5 envelope, canonical cwd, lost heartbeat and worker isolation.
- [ ] Extend existing serial worker with opt-in V5 identity; retain auth/legacy behavior. Add capped per-slot provisioning, verified source startup and independent supervisor restart.
- [ ] Run Python and PowerShell checks; run real two-process ten-second commands, cancellation and crash recovery.

### Task 3: Integration, deployment and evidence
- [ ] Inspect host limits, preserve rollback, verify data before any migration.
- [ ] Stage isolated containers and verify resource/auth boundary and persistence without disrupting existing runtime.
- [ ] Exercise production MCP only if backend deployment/auth cutover prerequisites are verified; otherwise document exact blocker, never claim local tests are production proof.
- [ ] Update existing PR branch and description with measured evidence and remaining owner actions.
