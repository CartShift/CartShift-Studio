# Portal security and data-integrity release checklist

Related: PR #29 (security/reliability), issue #30 (follow-up engineering).

## Before deployment

1. Verify a green `pnpm lint`, `pnpm test:run`, and `pnpm build` on the exact release commit.
2. Run the Firestore Emulator rules tests. Check active/revoked users, invitation acceptance, comments, file access and payments.
3. Smoke-test with a **non-production** agency account and two separate client organizations, including logout, user switching, new requests, attachments, team removal, invitation acceptance, comments and payments.
4. Treat application and Firestore rules changes as one coordinated release. Merging or deploying a Next.js app alone does **not** deploy new Firestore rules.
5. Preserve a copy of the previously deployed rules, plan how to restore them and check for compatibility with existing mobile/browser sessions.

## Historical internal-comment preview audit

Old portal code could copy an internal agency comment into a request's `lastComment` field. PR #29 stops future writes of that kind but does **not** modify existing customer-authored comments or existing request documents.

A read-only, bounded auditor is available:

```bash
pnpm audit:portal:private-previews --max-docs=1000
```

It uses Application Default Credentials or `FIREBASE_SERVICE_ACCOUNT_KEY`. The report includes only counts and shortened hashes of candidate request IDs, never comments, email addresses or raw identifiers. The audit checks for exact/truncated preview matches; a match is a **candidate for review**, not proof that the text was exposed. A capped run reports `incomplete: true` and is not a comprehensive historical audit. The script has **no write mode**.

For any remediation, first confirm the candidate and the intended public preview, back up affected request documents, write a separately reviewed dry-run plan, and preserve all original client-authored content. Never run a bulk write in Production as part of this audit.

## Still outstanding

- End-to-end staging QA, accessibility and RTL smoke checks
- Explicit production trace/correlation IDs with PII redaction
- Cursor pagination and server-side aggregation for large agency request lists
- Concurrent proposal/payment replay tests and Firebase Functions CI
- Required GitHub checks/branch protection on `main`
