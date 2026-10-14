# CartShift Architecture Hardening — 2026-10-14

Status: **implementation in review**. No production deployment or emulator execution has been confirmed from this change alone.

## Architecture decision

Keep the **Next.js + Firebase modular monolith**. Do not introduce Rails, microservices, a second data store or a new UI framework merely to reorganize code. Prioritize authorization invariants, robust async workflows, indexed and bounded queries, and small, testable modules.

## Work delivered on the review branch

| Area | Change | Verification |
| --- | --- | --- |
| Firestore tenant isolation | Removed memberships no longer authorize organization access; sensitive billing profiles and invite reads restricted | Emulator tests added; must run before merge |
| Tenant writes | Non-agency request creation is limited to ordinary requests; request identity fields are protected on update; notification delivery is agency/server-only; timeline actor identity checked | Emulator tests added |
| Agency access | Suspended/inactive agency users lose rule-granted access, including Storage | Verify with emulator role cases |
| Billing | Server endpoint requires agency billing owner/admin role before fetching financial profile | Integration test and manual role QA pending |
| Agency overview | Request and member totals computed using Firestore aggregations in bounded batches; removed memberships excluded | Test with realistic member counts; deploy indexes |
| Consultations | Dashboard statistics use aggregation counts instead of downloading documents | Compare against previous results |
| Invitations | Invite links resolve using a recipient email-scoped query after login | Test existing code/id links and automatic acceptance |
| Public Cloud Functions | Public form rate limits use transactional Firestore storage and fail closed; separate testable rate limiter module | Standalone Node tests added |
| Architecture discipline | Service boundary violations block lint instead of merely warning | Lint baseline before merge |
| CI | Add lightweight Node syntax and rate-limit checks plus conditional Firestore emulator security tests | Inspect GitHub check results |

## Immediate release gates

1. Execute Firestore emulator tests for agency, owner, tenant member, outsider, revoked member and anonymous user. Include both allowed and denied operations; correct any rule/query incompatibility.
2. Inspect Storage emulator coverage and add explicit revoked-user read/write cases; the Firestore emulator suite alone does not verify Storage rules.
3. Validate invitations, including auto-accept, invite-by-email queries, existing invite-code URLs and ordinary organization team lists.
4. Deploy **indexes before rules/code** where a new query relies on a composite index. Check index build status.
5. Run lint, typecheck, affected UI tests and Functions smoke tests. Do not merge if these fail.
6. Confirm that updated rules can be deployed safely independently of the web deploy and that the currently deployed rules are not mistakenly assumed to match the repository.

## Remaining workstreams (not yet implemented)

### A. Durable Store Analyzer execution

- Replace synchronous full analyzer execution in `app/api/analyze-store/route.ts` with a bounded job-creation endpoint returning an analysis job ID.
- Persist `queued/running/completed/failed` transitions, retry budgets and idempotency keys in Firestore; use a worker with explicitly bounded concurrency.
- Preserve per-feature provenance and partial-analysis result contracts, so missing PageSpeed or Chromium cannot silently masquerade as a verified score.
- Move outbound report delivery to an independently retryable queue, rather than relying exclusively on `after()`. Ensure one report per consented recipient and idempotent retries.
- Keep the existing analyzer route contract via a compatibility adapter during migration. Run existing `test:analyzer:unit` and request-level tests.

### B. Back-end module boundaries

- Split `functions/index.js` by domain (marketing, email, portal notifications, payments, analyzer) one exported trigger at a time, preserving exported Function names and deploys.
- Refactor `lib/services/analyzer.ts` into orchestration, extraction, scoring and provider adapters without changing outputs during the first pass.
- Prefer deterministic domain functions under `lib/domain/`, APIs/adapters under `lib/services/`, and hooks only for React-specific state. Do not add generic scaffolding without two real use cases.
- Split large client views by responsibility only after behavioral regression coverage exists.

### C. Bounded queries and domain contracts

- Introduce paged API contracts for agency-wide lists (organizations, MCP work items) before organizational counts or client volume become large.
- Add explicit typed validation for cross-domain writes and enforce immutable org IDs and actor fields centrally.
- Preserve roles, workflow statuses and current billing semantics during migration.

## Cost discipline

Avoid preview deployments, broad CI runs, heavy external services and migration work unless they materially reduce current risk. Keep the default CI path fast; gate the expensive emulator on security-rule changes. Do not conflate code committed with functionality verified or deployed.
