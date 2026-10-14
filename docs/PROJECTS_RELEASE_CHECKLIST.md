# Projects, Requests & Proposals — Release Gate

This checklist covers the Projects lifecycle integration from PR #72 plus security/commercial hardening from PR #82. Do not present either code merge or a green preview as proof that production Firestore rules were deployed.

## Verified on October 14, 2026

- Clean install from `pnpm-lock.yaml`.
- `pnpm i18n:merge && pnpm typecheck`: passed after regenerating locale bundles.
- ESLint on the files changed by the Projects hardening PR: passed.
- `pnpm exec vitest run`: **531 passing tests in 114 files** on the integration branch (before the final Firestore-only hardening commit).
- `pnpm test:firestore:rules`: passed against the Firestore emulator with Java 21, including the final signed-contract immutability test.
- `pnpm build`: passed in an isolated Vercel Sandbox with non-production Firebase placeholders, network access for Google Fonts and no customer data.

These checks do **not** constitute production end-to-end acceptance, live bank-payment reconciliation or authorized Shopify publication.

## Coordinated rollout (required)

1. Verify the target Firebase project is `cartshiftstudio` using an authorized Firebase CLI account; check the active project before any deployment. Do not substitute the demo project used by tests.
2. Review both `firestore.rules` and `firestore.indexes.json`. **Deploy the restrictions and required indexes before enabling client traffic to the new dashboard**, for example by using `firebase deploy --only firestore:rules,firestore:indexes --project cartshiftstudio` after explicit project verification. Index creation can take time; verify its status before accessing project-linked queries.
3. Independently verify production permissions using dedicated non-sensitive test identities: a client **cannot** directly read `portal_requests` or `portal_comments`, change published pricing or the signed change-order link, or list another organization's data. Clients **can** view authorized projections, create comments and react through the server APIs. Keep all test records isolated from real customers.
4. Confirm the deployed server is configured with Firebase Admin credentials and exercises authenticated `/api/portal/client-requests`, `/api/portal/client-comments`, proposal signing and `/api/portal/projects/[projectId]/ready` without granting raw Firestore access.
5. Only then merge the reviewed Projects feature PR into `main` (where `vercel.json` permits automatic deployment), confirm the real Vercel deployment and run production smoke tests with an authorized test organization. Do not terminate an existing Vercel Preview merely to run QA.
6. Run `pnpm audit:portal:projects --project=cartshiftstudio --max-docs=2000` with read-only authorized Firebase credentials. Review any truncated results or unresolved links before preparing an explicit, approved migration. **Never automatically invent payments or rewrite historical signed proposals.**
7. Monitor client-visible request lists, project links, payment/deposit states, change-order approvals and error rates. Keep a rollback plan for the application, but **do not roll back security rules to versions that disclose confidential proposals**.

## Non-negotiable invariants

- A single accepted proposal creates or links at most one project. A linked child request belongs to the same organization and project.
- A reported deposit is not a verified paid deposit. Work readiness respects the canonical payment ledger and approved client requirements.
- An operational scope review is not a signed, billable change order; signed proposal terms remain authoritative.
- `ready_to_launch` is an informational status, never authorization to publish a Shopify theme or make a financial charge.
- Client data is served by whitelisted server projections, not raw Firestore documents.
