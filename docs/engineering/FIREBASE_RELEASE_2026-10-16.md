# Firebase production release — 2026-10-16

## Verified environment and scope

Project `cartshiftstudio` (559544522324), Firebase CLI 15.34.0. The application and Functions use the `(default)` Firestore database, STANDARD edition, nam5. The separate `cartshift` database was inspected but not changed.

This release independently ships compatible Firebase infrastructure and workers from `refactor/backend-boundaries-2026-10-15` (code source 6d0c4f4391584c9820d3fcc7fe4e28fc55b32f1b). It does not ship the candidate Calendar or Contact application migration. Firestore and Storage rules were taken from production main b2e3b7a5058b5528357a8b6df95a9c00aa11d2df; candidate Calendar restrictions remain gated.

## Completed live work

- Deployed 35 composite indexes and verified every index READY. Removed the rejected single-field-equivalent `portal_requests: orgId + __name__` definition. Preserved both production-only pricing/request indexes rather than deleting them.
- Enabled `store_analysis_reports.expiresAt` TTL and exempted that field from indexing. Raw Firestore API state is ACTIVE. Application retention is 30 days; there were no report documents before enabling this policy.
- Deployed main's Firestore and Storage rules. Live checks reproduced improper project access by a removed organization member and a suspended agency account before deployment. After deployment all 12 checks passed, covering permitted agency/member access, denied revoked/suspended/outsider/anonymous access, private credential denial and denied client self-promotion.
- Removed all five temporary Auth users and ten test documents after those live checks.
- Deployed these eight explicitly selected Node.js 24 Functions: `processEmailQueue`, `processRetriedEmailQueue`, `recoverEmailQueue`, `marketingCapture`, `sendStoreAnalysisReport`, `retryStoreAnalysisReports`, `contactForm`, `newsletterSubscription`.
- Resend secret binding and enabled analyzer delivery secret version 1 were verified through metadata only. An unsigned live report-delivery POST returns 401.
- Real Firestore transactions in an isolated test collection verified five concurrent workers produce one mock delivery, and provider failure/retry preserves the delivery idempotency key. Recovery's three actual production queries succeeded with the deployed indexes and zero eligible jobs. All queue fixtures were removed; no real email was sent.
- The two pre-existing terminal email failures were left unchanged. Baseline queue: three sent, two failed, no pending/processing jobs and no failed job with retryAfter.
- Fixed the worker/application status contract: exhausted retries now surface as failed delivery instead of unconfigured. The regression first failed with actual unconfigured vs expected failed, then passed with the one-line fix.

## Automated validation

631 application tests in 134 files passed on the isolated main-based release branch. Functions build and all 18 queue/idempotency/limiter/report-retry Node tests passed. Both candidate and current-main Firestore/Storage emulator suites passed, including the standalone Storage tenant suite. TypeScript checks passed; lint passed with zero errors (five existing warnings). The optimized Next.js production build passed, including TypeScript and 203 generated pages, using CI-stub Firebase configuration. This proves compilation, not production Vercel credentials. Both recovery schedulers are ENABLED at a 60-minute interval; all eight selected Functions are ACTIVE on Node.js 24.

## Backups and release decisions

Exact prior default Firestore ruleset: `projects/cartshiftstudio/rulesets/415da6f7-e238-4394-9949-5be099e05d80`. Prior Storage ruleset: `projects/cartshiftstudio/rulesets/2fd4728f-3b1e-438b-8ce8-1fa744e4fed4`. Named database `cartshift` ruleset `1153792c-0bf3-422f-8bbb-a4247f67acd4` was not changed. Full rule files and release metadata were backed up before deployment. The MCP rules helper selected the named database by release-name prefix; its initial short rules result was not used as the default database backup.

Rulings:
- Deploy current-main authorization fixes separately from candidate Calendar restrictions, because the current application still uses the legacy connection flow.
- Release queue/retry/limiter workers independently from the Calendar application gate: existing producers, templates and payload contracts remain supported and were tested.
- Accept the Firebase CLI retry-policy confirmation only for explicitly selected Functions after idempotency checks. No blanket Functions deployment or deletion was performed.
- Keep known terminal email failures untouched and avoid real-recipient engineering tests.

Do not restore older authorization rules without retaining the verified revocation/suspension protections.

## Still gated outside this Firebase release

1. Vercel production environment metadata remains HTTP 403; its local CLI fallback was unavailable in this restricted environment. Matching analyzer delivery secret/configuration and Calendar client credentials/callback origins remain unverified.
2. One complete legacy Calendar credential document exists. Its dry-run inventory was recorded without logging credentials. Do not apply the migration or candidate Calendar rules until the new Vercel API is deployed and its OAuth/refresh/disconnect smoke tests pass, per ADR-017.
3. Actual authorized recipient PDF/inbox delivery and Google OAuth acceptance are not proven by infrastructure or mocked-provider tests. No customer emails were sent.
4. Keep legacy Calendar/contact endpoints until the coordinated application changeover is verified. Broader PR #87 and payment PR #32 retain their remaining application/provider gates.
