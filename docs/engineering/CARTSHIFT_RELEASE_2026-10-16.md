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
The final combined source passed 674 tests in 142 files, full TypeScript validation, and lint with zero errors/five existing warnings after the required translation generation. The optimized CI-stub production build also passed (204 generated pages). The first overlapping build was killed by the temporary environment's memory limit; the isolated rerun passed. A CI-stub build verifies code, not production credentials.

## Completed Firebase release

PR [#89](https://github.com/CartShift/CartShift-Studio/pull/89) is merged to main at `f6c376fd1571bad7cc5f9ca5cf1a1c03b83559af`. Firebase access is no longer blocked.

- Exact default-database and Storage rules backed up; current-main rules deployed. Five temporary real Auth identities reproduced removed/suspended access bugs before deployment; all 12 checks passed afterward. All fixtures removed. The separate named `cartshift` database remains unchanged.
- 35 composite indexes READY, including queue/report recovery; existing production-only indexes preserved. The unnecessary single-field-equivalent index was removed. Report expiresAt TTL is ACTIVE.
- Eight named Functions ACTIVE on Node.js 24; both recovery schedulers ENABLED. Real Firestore transaction tests verified one mock delivery under five contenders and a stable retry key; no real emails sent.
- Main's release passed 631 app tests, 18 worker tests, TypeScript/lint and an optimized build with 203 generated pages. The report retry terminal-state/UI contract regression was verified RED→GREEN.
- See [FIREBASE_RELEASE_2026-10-16.md](https://github.com/CartShift/CartShift-Studio/blob/main/docs/engineering/FIREBASE_RELEASE_2026-10-16.md) for source provenance, backup IDs, independent review and live evidence.

## Mandatory remaining application/provider gates

1. Vercel CLI access is verified as the project owner for `cart-shift/cart-shift-studio`. Production `GOOGLE_CLIENT_ID` was added from the matching public/Firebase client ID; `CONTACT_EMAIL` was copied from the existing Firebase destination. Firebase Admin certificate access and project ID are verified. Existing Vercel Google client secret was preserved.
2. Google accepts the callback URI `/portal/oauth-callback` for all three allowed production origins (`cart-shift.com`, `www.cart-shift.com`, `portal.cart-shift.com`), returning `interaction_required` rather than a redirect/client error. The existing refresh grant returns `invalid_grant` with Vercel credentials. The old Firebase client secret returns `invalid_client`; it was not copied into Vercel. This baseline prevents list/create/delete/free-busy verification until the owner reconnects.
3. Deploy the validated Calendar/Contact application slice, then complete fresh Calendar OAuth/refresh/disconnect and transactional Contact persistence/delivery with controlled accounts. The existing broken refresh grant is recorded as the pre-deployment baseline.
4. One complete legacy Calendar credential document remains. Apply its migration only after the new API is deployed and verified, repeat dry-run, then deploy candidate Calendar restrictions. Current rules intentionally retain compatibility during the changeover.
5. Actual authorized Shopify scan/PDF/inbox acceptance remains outstanding for issue #64. The analyzer delivery key exists as a production Secret; its value is intentionally unreadable. Signed Functions checks and mocked-provider tests do not prove the full Vercel-to-Functions/inbox path. Do not send customer mail during engineering checks.
6. Public expert-review intake remains gated by its capacity, configuration and live acceptance checks. Payment PR #32 still requires actual PayPal Sandbox QA.

Production Firebase indexes, main authorization rules and eight named Functions were deployed in #89. No credential data migration, real-recipient email, payment capture or Shopify publication was performed.

## Superseded branches
#29 and #66 were closed as superseded after reconciliation into #87. Firebase-compatible work then shipped independently in #89; the application/Calendar gates above remain open.

## Independent review fixes
- Resend adapter now forwards its stable key as the provider request option; adapter regression reproduced the missing option before passing.
- Recovery claims up to 25 pending jobs in batches of 3, covering missed original triggers; queue triggers retry and the recovery scheduler has the required secret.
- Ambiguous request commits are verified via the existing authorized read/projection path before replay; immutable activity rules remain unchanged.
- Separate payment PR keeps the ledger guard but repeats idempotent derived synchronization, repairing a committed payment after interrupted synchronization.
- Provider/queue/limiter/analyzer Node suite: 18 tests passed. The combined pre-Firebase integration app suite passed 673 tests and its optimized build passed. Release #89 separately passed 631 tests including the terminal delivery-state regression.
