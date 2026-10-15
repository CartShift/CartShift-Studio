# Dashboard access and cache hardening

## Scope

This change addresses three confirmed bugs independent of the active Projects
and invitation hardening branches:

1. The agency bank/tax billing profile was readable by any logged-in user once
   a global billing owner had been configured. Server-side role checks now
   require an authorized agency finance role before loading the profile.
2. Request billing access compared `request.clientEmail` to the editable
   `portal_users.email` profile field. The legacy email-only fallback now
   uses the Firebase-verified identity email only. Linked user ID and active
   organization membership remain valid authorization paths.
3. Org-scoped pricing requests shared a global TanStack Query key and a stale
   Firestore listener could write into another organization's key. Query keys
   now include organization and draft visibility, and listeners capture the
   key from their subscription start.

## Regression checks

- `pnpm exec vitest run tests/domain/request-billing-access.test.ts tests/services/billing-profile-access.test.ts tests/utils/pricing-query-keys.test.ts tests/hooks/useFirestoreSubscription.test.tsx`
- `pnpm lint` / `pnpm typecheck` / `pnpm test:run` before merge.
- Two-client browser check: switch organizations while pricing list subscriptions
  are active, ensuring no stale rows appear.
- Agency admin, agency developer, and client checks for `GET /api/portal/billing-profile`.
- Legacy email-only billing records: verify that legitimate accounts have
  verified Firebase emails before relying on the fallback.

## Coordination / release

- Draft security PR #73 handles private invitation reads and member revocation.
  Do not deploy Firestore rule changes independently of its compatible API.
- Draft Projects PR #72 also changes `usePricingRequests.ts`. Reapply the
  organization+filter query-key fix when resolving the overlap, and preserve
  the canonical-project work in #72 / #82.
- This branch does not deploy code, mutate live Firestore data or run a build.
- The existing CI remains lightweight by design; avoid additional automatic
  full-build jobs during active development.
