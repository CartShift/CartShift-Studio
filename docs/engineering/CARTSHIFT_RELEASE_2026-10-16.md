# CartShift coordinated release status — 2026-10-16

## Scope and provenance
This integration retains outstanding backend work from #87, bounded worker/count/MCP changes from #66, and atomic request/comment + transient retry changes from #29. Current main's #84 invitation APIs, client comment projections, tenant access, billing permissions and project/proposal lifecycle remain authoritative. The old rules from #29/#66 are deliberately not copied over newer main rules.

OAuth continuation/session fixes from #24 are separately merged to main after 630 tests, full TypeScript, translations, optimized build and independent review. Payment replay #32 remains a separate release because actual PayPal Sandbox QA is still outstanding.

## Conflict decisions
- Preserve authenticated /api/portal/invites/lookup; discard the old recipient client Firestore query.
- Preserve server-projected client comments and client comment write/reaction APIs; retain atomic agency create/delete writes.
- Retain projectId when consolidating createRequest/createRequestForClient into the atomic implementation.
- Union required indexes: keep current main + Calendar/email queue indexes + bounded analyzer/MCP/member-count indexes.
- Keep current tenant rules and add only #87 private Calendar credential rules.
- Share one Functions QA job for email queue, analyzer retry and distributed limiter tests.

## Verification
Completed before final integration: all 649 backend Vitest tests, TypeScript, translations, Functions lint/build and 14 worker tests; Firestore + Storage emulator suites passed.
Retained #29 tests first reproduced nine failures; then all ten atomic/retry tests and four existing public-comment security tests passed.
The first backend build attempt failed because its node_modules symlink pointed outside the Turbopack filesystem root. Dependencies were installed inside the worktree before retry; this was a test-environment issue, not an application fix.
Final combined checks are recorded on the PR after completion. A CI-stub build verifies code, not production credentials.

## Mandatory remaining live gates
1. Firebase CLI cannot access local authentication configuration in this restricted session (EPERM); the enabled Firebase plugin advertises no executable Firebase MCP tools here.
2. Vercel environment metadata returns HTTP 403. Its local authenticated CLI fallback also fails in the restricted environment. Production GOOGLE_CLIENT_ID/SECRET, Firebase Admin and CONTACT_EMAIL remain unverified.
3. Use the verified project cartshiftstudio. Back up deployed Firestore/Storage rules and compare to the candidate. Validate with staged agency/client/revoked/suspended accounts before production promotion.
4. Deploy required indexes and wait until READY before the new count/cursor queries and recovery workers.
5. Follow ADR-017 ordering: verify configuration/callback origins; deploy app; smoke-test Calendar/contact; dry-run then apply Calendar credential migration; dry-run again; deploy compatible rules; deploy only named workers.
6. Verify worker claim/retry behavior, Contact persistence/delivery and actual Google OAuth behavior with controlled accounts. Do not send real customer emails during engineering checks.
7. Store Analyzer #64 still needs named Functions deployment, retention TTL verification and an explicitly authorized recipient/scan/inbox smoke test.
8. Public expert-review intake remains gated until its documented capacity, configuration and live acceptance checks pass.

No production data migration, Firebase deployment, email, payment capture or Shopify publication is performed by this integration.

## Superseded branches
#29 and #66 can be closed only after this replacement PR is published and verified. Closing them means their current code is reconciled; it does not mean their production gates passed.

## Independent review fixes
- Resend adapter now forwards its stable key as the provider request option; adapter regression reproduced the missing option before passing.
- Recovery claims up to 25 pending jobs in batches of 3, covering missed original triggers; queue triggers retry and the recovery scheduler has the required secret.
- Ambiguous request commits are verified via the existing authorized read/projection path before replay; immutable activity rules remain unchanged.
- Separate payment PR keeps the ledger guard but repeats idempotent derived synchronization, repairing a committed payment after interrupted synchronization.
- Provider/queue/limiter/analyzer Node suite: 18 tests passed. Final app suite/build are rerun after the request fix.
