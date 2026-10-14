# Expert Store Review — Implementation and release runbook

Created 2026-10-14 · Engineering branch `feat/expert-store-review-funnel` · Planning: [#67](https://github.com/CartShift/CartShift-Studio/issues/67)

## What changed

CartShift's primary acquisition path is an **expert-led**, free initial store review at `/[locale]/free-store-review`. It intentionally has no dependency on Lighthouse, Puppeteer, analyzer scoring, PDF generation, or an external AI call. The old analyzer homepage and intent URLs redirect to the manual entry, preserving the intent focus, and the public expensive scan API has a separate production feature gate.

Pages, navigation, homepage hero/teaser, the tools directory and contextual blog buttons now point at the manual page. All website contact details are protected by server validation, reCAPTCHA v3, distributed rate limiting and an atomic 48-hour dedupe marker. No storefront probing occurs at submission.

The durable source is Firestore `human_review_requests` (schema version 2). Optional `marketing_leads` capture and agency notifications occur after the primary write and may fail independently. An agency-only review workspace inside `/portal/agency/leads` allows accepting/declining, writing 3–5 findings, human review, and explicit delivery to the user's submitted address. Existing `human_review_requests` records without version 2 stay visible but read-only in the new workflow.

## Product promise (must match public copy)

- Free initial, focused professional assessment of public pages and buying flows (not exhaustive).
- The output is 3–5 prioritized, evidence-backed observations and practical next steps.
- No assurance of revenue lift, measured traffic/conversion metrics, accessibility compliance, legal compliance, privacy compliance, vulnerability-free status, or guaranteed response time.
- An implementation proposal is optional, founder-reviewed and remains governed by the existing portal request/proposals lifecycle.
- No automated marketing subscription without distinct opt-in. A reply to a requested service inquiry is not a general marketing consent.
- Review data and reports are **private** by default; sharing as a named example or public case study requires separate consent.

## Production env: opt-in gated

Set in the **Next.js/Vercel server environment**, not GitHub:
- `STORE_REVIEW_INTAKE_ENABLED=true`: enable accepting new manual review requests. Default in production: **closed** (503 `INTAKE_PAUSED`).
- `RECAPTCHA_SECRET_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: matching v3 keys with site/action `request_store_review`. Production submissions fail closed if secret missing. Existing `analyze_store` action remains supported for legacy analyzer.
- `RESEND_API_KEY`: needed to send human-written review emails from Next.js. Use same verified sender domain as the existing Firebase Function email system; verify Next.js runtime secret access and `noreply@cart-shift.com` verification.
- `PUBLIC_ANALYZER_ENABLED=true`: **optional** legacy instant scan API. Production default **disabled** to avoid exposing untested browser compute. Enabling requires separate analyzer release checks (#64).

The existing Firebase Admin credentials and rate limit backing store must be correctly configured. Enabling the intake flag without deployed Firestore rules, working Firebase credentials, reCAPTCHA keys and agency visibility is **not an acceptable release**.

## Data and privacy

`human_review_requests`: existing collection is canonical for service fulfillment. New records include `requestId`, `schemaVersion=2`, `canonicalDomain`, normalized root `storeUrl`, `name`, `email`, `focus`, `notes`, `reviewStatus`, `statusHistory`, `marketingConsent`, `reviewVisibility=private` and staff-written `reviewReport`. Old analyzer score remains absent.

`store_review_dedupe`: server-only hash of normalized email+domain, latest request reference and creation timestamp; 48-hour dedupe window. Do not put raw PII in fingerprint IDs, route/query analytics, or logs. The marker stays for dedupe; agree on a retention/deletion policy and implement erasure before broad-scale launch.

`marketing_leads`: optional secondary marketing/commercial view, captured with source `human_review` and `ctaType=expert_store_review`. No second `agency_prospects` record is created.

New report drafts are scoped to the same canonical domain. Staff changes require an authenticated, owner/admin API. Firestore client SDK cannot change review lifecycle, report or delivery fields. Legacy visibility/qualification UI remains available with explicit stored consent checks in Firestore rules.

## Recommended acceptance workflow

1. On a *non-production branch*, regenerate translation bundles via `node scripts/merge-translations.js --silent` then `node scripts/validate-translations.js`.
2. Run focused tests: `pnpm exec vitest run tests/domain/store-review.test.ts tests/api/store-review-requests.route.test.ts tests/validation/human-review.test.ts`; then focused ESLint, `npm run typecheck`. These runs must not start expensive analyzer scans.
3. Firestore Emulator permissions: anonymous/client cannot read reviews or dedupe markers; agency can see requests; client SDK cannot set `reviewStatus`, `reviewReport`, `statusHistory`, `delivery`; consent does not automatically publish.
4. Verify `GET/PATCH /api/portal/agency/store-reviews/[requestId]` fails for absent/expired user, client role, cross-origin requests, invalid status transitions and legacy write attempts.
5. Verify the intake route: invalid URL, private IP, duplicate email/store, double click, honeypot, spoofed fields, invalid/expired CAPTCHA, rate limiting, no Firebase, marketing function outage and agency notification outage.
6. Test HE/EN on 320px/mobile/tablet/desktop plus keyboard, screen reader, and RTL direction for URL/email inputs. Verify localized meta, sitemap, header/menu/footer/blog referral focus and legacy URL redirects.
7. Run **one** authorized end-to-end smoke test using a store and email address you own. Confirm exactly one `human_review_requests` record; staff notification; separately check CRM mirror. Draft 3–5 real verified findings, save the draft, confirm that stale/blank drafts cannot be sent, explicitly approve email, and verify Resend ID and inbox. Treat email API acceptance as provider acceptance, **not confirmed inbox delivery**.
8. Confirm the existing proposal creation page still works, and require explicit client/org onboarding and real scope/pricing approval before sending proposals. Do not automatically mark a proposal `won` or `paid` for audit delivery.
9. Measure weekly: visited page → submitted requests → accepted → reports sent → qualified conversations → offers → paid projects. Segment by locale/focus/channel; no fabricated historical baseline or analyzer-vs-human lift.
10. Deploy after a passing gate: Next.js app, new Firestore rules, Vercel env keys, verification of existing Functions `marketingCapture` and Resend sender. Enable intake intentionally, monitor first submissions and roll back via `STORE_REVIEW_INTAKE_ENABLED=false` if abnormal.

## Current implementation limitations (not to be misrepresented)

- This feature branch has not been deployed or run through authenticated production smoke tests. **Do not call it production-ready before the above checks.**
- Agency notification and CRM mirror failures are logged rather than surfaced to the visitor; the authoritative staff queue is the canonical review record. There is no durable retry worker yet for these secondary side effects.
- Review delivery uses Resend idempotency keys per report version and a 10-minute sending lease; ambiguous network failures require manual reconciliation. Provider idempotency keys expire, so a long-delayed retry could send twice. Inspect `delivery` state and Resend logs before retrying an uncertain result.
- Customer-facing public report links/PDF export, review-to-org/proposal automatic linkage, automated follow-up and bidirectional ChatGPT MCP report editing are **not shipped**. The workspace provides a manual proposal draft action. They require separate secure workflows rather than speculative integration.
- Live release requires GDPR privacy notice/retention and stored consent review for the target markets.
- Vercel Preview/GitHub Actions usage is intentionally avoided until one deliberate release validation.

## Rollback

Disable intake `STORE_REVIEW_INTAKE_ENABLED=false`. New submission attempts receive a clear pause response; existing staff reviews remain available, and the legacy analyzer API stays independent. To revert visitor entry links, revert the public CTA/redirect commits without deleting any Firestore records. Restore only validated production behavior after a controlled release.
