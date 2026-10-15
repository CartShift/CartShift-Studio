# ADR-017: CartShift application/backend boundaries

**Status:** Adopted design; implementation staged on `refactor/backend-boundaries-2026-10-15`.
**Date:** 2026-10-15
**Owner:** CartShift Studio

## Decision

Maintain a **modular Next.js monolith deployed to Vercel** for user-driven business operations. Keep Firebase Authentication, Firestore and Storage. Reserve Firebase Functions for Firestore-driven events, reliable scheduled recovery, and expensive/background jobs. Do not introduce NestJS, Kubernetes, an additional queue provider, or a new database without measured needs.

The business system owns exactly one implementation of each domain transition; HTTP routes, Firebase triggers and scheduled workers are adapters. The frontend may subscribe to Firestore via `onSnapshot` for safe real-time reads. Mutations that change money, roles, identity, project/proposal relationships, or invoke external services must use authenticated server APIs with server-side authorization. Firebase Admin SDK bypasses Security Rules; every server mutation needs explicit user+tenant verification.

## Target boundaries

| Domain | Primary owner | Data/event adapter |
| --- | --- | --- |
| Projects, requests and proposals | Next.js API + server domain services | Firestore transactions, realtime subscriptions |
| Billing, PayPal and financial reconciliation | Next.js server domain services | Firestore transactions and verified provider webhooks |
| Client/agency authentication | Firebase Auth + server authorization | Session cookies or explicit verified bearer token |
| Google Calendar OAuth and Calendar API | Next.js authenticated API | Server-only credential collection |
| Contact inquiries | Next.js domain transaction (implemented) | Firestore submission + marketing conversion + durable email_queue |
| Newsletter and marketing nurture | Firebase marketingCapture for now (migration pending) | Firestore sequences + Resend audience |
| Lifecycle notifications | Firebase event handlers initially | Firestore create/update triggers |
| Email rendering and sending | Shared templates + background worker | `email_queue` with atomic claim, provider idempotency key |
| Store Analyzer report PDF | Background worker initially | Chromium in Firebase Cloud Functions |
| Scheduled marketing + report recovery | Firebase scheduled workers initially | Firestore job status/leases |

Avoid duplicating orchestration in both `functions/index.js` and `app/api/`. Make adapters thin before relocating a handler.

## What is implemented in the first migration slice

1. An authenticated `/api/portal/integrations/google-calendar` POST API acts only for the verified bearer-token identity. Inputs are validated with Zod and requests are same-origin.
2. OAuth code exchanges happen on the server and the browser never receives refresh/access tokens. Private tokens live in `private_integration_credentials`, while `agency_integrations` stores only UI metadata.
3. Existing legacy credentials are lazily migrated on first server API access; an explicit dry-run-first migration script handles dormant connections.
4. Firestore rules prevent client read/write on the private collection, prevent cross-user reads of integration metadata, and only allow the owner to update `selectedCalendarId`.
5. Email queue processing claims pending records transactionally. Interrupted work is recoverable, and retries reuse the original provider idempotency key. The handler lives in `functions/runtime/email-queue.js` with replay/retry tests.
6. Contact inquiries now create their submission, converted marketing lead, conversion event and queue notification in one Firestore transaction through Vercel. This intentionally retains the existing marketing-nurture backend for newsletter and analyzer leads.
7. Calendar free/busy failures, including per-calendar errors inside HTTP 200 responses, show an explicit unverified state in the consultation scheduler rather than a false available slot.

This branch does **not** automatically deploy Firebase rules or functions.

## Release gates (mandatory)

**Gate 0 — Configuration and baseline**

- Verify Vercel *production* has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (not prefixed with `NEXT_PUBLIC_`), and `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Verify Vercel `CONTACT_EMAIL` resolves to the correct agency inbox (or deliberately accept the documented fallback `hello@cart-shift.com`).
- Confirm the Google OAuth console authorizes exactly the callback URI for each allowed origin. Additional origins are set only via server-side `GOOGLE_OAUTH_ALLOWED_ORIGINS`.
- Capture current production behavior for Calendar login, list, create, free/busy and disconnect with a test agency account.
- Require targeted automated tests + TypeScript validation to pass. Do not generate Vercel preview deployments.

**Gate 1 — Application deploy**

- Only after Gate 0, merge and deploy Next.js to Vercel production (normal main-branch deployment).
- Smoke-test Google OAuth, token refresh, selected calendar, event creation and deletion, verified/unverified free-busy states, and disconnect. Confirm a Vercel Contact POST creates one `contact_submissions` document, one converted `marketing_leads` record and one `email_queue` notification (and that the agency email is delivered). Confirm browser traffic and `agency_integrations` contain **no tokens** for *new* connections.
- Keep old Cloud Functions deployed during the changeover. Do not invoke the legacy Calendar endpoints from the updated browser.

**Gate 2 — Credential cleanup and Firestore Rules**

- Run `pnpm exec tsx scripts/migrate-google-calendar-credentials.ts` without flags; confirm `skippedIncomplete=0`.
- Run the same command with `--apply` with privileged Firebase Admin environment only after Vercel smoke tests.
- Re-run dry-run and ensure no legacy credential fields remain.
- Deploy `firebase deploy --only firestore:rules` using the correct Firebase project and source revision.
- Test with owner A, agency member B, non-agency client and unauthenticated user. None may read another user's metadata; **nobody** may directly read private credentials.

**Gate 3 — Reliable worker release**

- Deploy indexes **before** new recovery worker code: `firebase deploy --only firestore:indexes --project <verified-project-id>`; wait for both `email_queue` composite indexes (`status+processingStartedAt`, `status+retryAfter`) to become READY. Never deploy the worker before these indexes exist.
- Deploy only the touched Functions by name:
  `firebase deploy --only functions:processEmailQueue,functions:processRetriedEmailQueue,functions:recoverEmailQueue`
- Verify two concurrent deliveries claim once. Verify a crashed processing attempt is retried after its timeout and a provider failure is retried with the same idempotency key.
- Confirm no notification or email duplicates. Check Firestore billing/indexes before raising scheduler frequency.

**Gate 4 — Cleanup**

- After a stable observation window, remove unused Google Calendar Firebase endpoints and the legacy analyzer endpoint (currently HTTP 410) in a separate verified Functions release.
- Remove the old `contactForm` HTTP function *only after* verifying all website contact routes use the Vercel transaction and durable email queue. Migrate newsletter and other marketing HTTP handlers *only after* lifting their lead-enrollment rules into tested domain services; deleting these hops without preserving marketing consent/enrollment is not acceptable.
- Split `functions/index.js` into worker modules and maintain one importable email-template registry. Minimize Firebase-only dependencies in the Next.js package.
- Replace obsolete docs, cross-cloud URL fallback hacks, and unneeded environment variables after both environments are proven independent of them.

## Rollback and compatibility

- **Before applying credential migration:** Next.js can be rolled back if the new API fails; verify legacy Functions and rules still accept the previous client.
- **After applying credential migration:** Rolling back the frontend alone is **not safe** because old client flows expect token fields that were removed. Roll forward with a repaired Server API or a specially tested compatibility release. Do not re-expose private tokens in Firestore.
- When sending fails, keep the job and error in Firestore for retry/reconciliation; never promise exactly-once delivery solely from trigger execution.

## Operational validation

Required evidence: 401/403/400 auth tests, Firestore emulator tenant-isolation tests, function/queue replay tests, reconnect/revoke test, baseline vs migrated logs and latency, dry-run credential counts (never token values), and a verified production test.

## Cost and deployment discipline

No preview builds or automatic wide CI on every documentation-only change. Prefer targeted tests; run a full production-equivalent build before merging code that changes Next.js routes. Keep new jobs within existing infrastructure until usage metrics justify another service.

## Known limitations and follow-up

- The Vercel connector returned HTTP 403 when listing environment-variable metadata on 2026-10-15. Production config and credentials are **not verified** by this branch.
- Google Calendar legacy Cloud Functions remain until the coordinated application/rules migration is proven. Their older token handling must not become the future implementation.
- Contact inquiry migration and queue worker extraction are implemented in this branch. Newsletter/marketing HTTP migration, full modularization of the Functions entrypoint, complete live OAuth smoke tests, production build and production deployment remain outstanding.
