# Projects, Requests & Proposals — Production release verification

Updated October 14, 2026 following integrated [PR #84](https://github.com/CartShift/CartShift-Studio/pull/84).

## Current state: application release is not Firebase Rules release

- The Projects/Requests/Proposals and tenancy hardening from #84 is **merged** to `main`. The matching Vercel production deployment reached READY. Do not repeat the old instruction to merge the Projects PR.
- Combined [integration verification](https://github.com/CartShift/CartShift-Studio/actions/runs/38625718922) and [post-merge Firestore/Storage Rules QA](https://github.com/CartShift/CartShift-Studio/actions/runs/38629559670) passed with demo/test credentials.
- **Production Firestore rules, Storage rules, and required index readiness have not been independently confirmed in this runbook.** A green GitHub CI or deployed Next.js bundle does **not** establish that the live Firebase authorization boundaries are enforced.
- No customer data migration, payment reconciliation or authorized Shopify publishing is part of this rollout.

## Coordinated rule and index release (privileged operation)

1. Confirm the authenticated Firebase CLI or console identity, target project ID `cartshiftstudio`, service account role, and current active rules/indexes. Export or preserve the existing ruleset/version for incident analysis. Do not use `demo-cartshift`, which is reserved for emulator tests.
2. Read and review **all three** source files at the intended application commit: `firestore.rules`, `storage.rules`, `firestore.indexes.json`. Do not apply rules from a stale feature branch; #84 superseded earlier branches.
3. Test with dedicated non-sensitive Firebase identities (verified invited client, unverified client, agency owner/admin/developer/viewer, revoked and re-invited member, suspended agency user). Confirm organization switch isolation, legacy invite URL acceptance, access to request and comment projections, protected pricing and proposals, and uploads/downloads. Check both EN and HE; do not send live proposals or payments.
4. Provision **new indexes first**, as needed: `firebase deploy --only firestore:indexes --project cartshiftstudio`. Wait for required indexes to be Ready in the Firebase Console; index creation is asynchronous.
5. Confirm the Vercel production app/API is the version compatible with the new restrictions, Firebase Admin is configured, and authenticated projection routes work. Existing browser sessions may be running old JavaScript; account for these before tightening reads. Then deploy **both** rule sets in one controlled window: `firebase deploy --only firestore:rules,storage --project cartshiftstudio`.
6. Verify the currently active Firestore and Storage rules versions after deployment. With separate test accounts, assert direct Firestore `portal_requests` and `portal_comments` reads are denied to client roles while the authorized server projection APIs work; ensure revoked members and suspended agency accounts cannot access project data, private evidence, or Storage objects.
7. Observe errors, invite redemption, current clients, billing/deposit state and organization switching immediately after release. Roll back application code if needed, but do **not** roll back security rules to a permissive version that exposes tenant or commercial data.

Do not call this release complete without steps 1–7 being checked against the **production Firebase project**.

## Read-only project integrity and document growth audit

Run the bounded audit only after confirming the explicit Firebase target and read-only credentials:

`pnpm audit:portal:projects --project=cartshiftstudio --max-docs=2000`

The output reports broken proposal/project links, potential billing scope issues, and **estimated** UTF-8 JSON sizes for the largest project documents. It also reports whether each collection was completely scanned. Missing linked IDs outside a capped scan are marked **unverified**, not falsely classified as broken. Increase `--max-docs` or inspect those IDs before preparing a migration. These are *not* exact Firestore protobuf sizes. Large `workLogs`, `changes`, `updates` or `deliverables` arrays may justify migrating that collection to subcollections, but decide only after reviewing size, contention and read patterns. The audit never writes documents, issues payments or invents ledger entries.

Run `pnpm test:firestore:rules` locally for Firestore **and Storage** emulator coverage (with Java and the Firebase CLI available). Do not mistake emulator results for active production rules.

## Non-negotiable commercial and publication invariants

- One accepted proposal creates or links at most one project; child requests and linked proposals belong to the same organization.
- A reported deposit is **not** proof of payment. Readiness is based on the canonical ledger and real client approvals.
- A scope review is not a signed billable change order. The accepted quote remains authoritative.
- `ready_to_launch` never authorizes automatic Shopify publication or collection of payment.
- Tenant data must be served through authorized projections, not raw client-side reads of protected Firestore collections.
