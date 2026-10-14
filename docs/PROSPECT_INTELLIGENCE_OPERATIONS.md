# Prospect Intelligence — rollout and operator runbook

**State:** feature branch only. No production rollout, prospect imports, real scans, outreach, partner consent approvals, or Vercel previews have been performed. Recheck this document against deployment before enabling live usage.

## What is implemented

The CartShift agency portal hosts a separate `/portal/agency/prospects` workspace, distinct from `marketing_leads`. Research candidates can be created individually or imported from up to 20 store URLs with preview and explicit confirmation. The pre-existing ChatGPT CartShift MCP OAuth connector has nine prospect operations:

| Tool | Scope | Effect |
| --- | --- | --- |
| `list_prospects` / `get_prospect` | `prospects:read` | Read private prospect records and their evidence |
| `upsert_prospect` | `prospects:write` | Idempotent domain-based candidate creation |
| `upsert_prospect_batch` | `prospects:write` | Preview or save ≤20 candidates |
| `add_prospect_finding` | `prospects:write` | Store an unverified issue with same-store source |
| `add_prospect_contact_candidate` | `prospects:write` | Store an unverified sourced business contact/role |
| `update_prospect_sales` | `prospects:write` | Manage assigned salesperson, next action and protected stage |
| `link_prospect_proposal` | `prospects:write` | Associate a real approved commercial request (no sending) |
| `scan_prospect` | `prospects:scan` | Explicitly start one bounded public-site audit and persist candidates |

The server-side audit caps 6 public pages including homepage, 2 seconds between page requests, max 25 scans per actor per UTC day and 15-minute per-store cooldown. It requests `robots.txt` before other content and skips prohibited pages, uses a restricted HTTPS client with a DNS-pinned public IPv4 connection, same-domain redirects only, 8s request timeout, 512KB response cap, no login/cart/checkout endpoints and no form submission. Scan errors are reported instead of treated as customer defects.

**Caution:** This is a deliberately conservative static audit, not browser-based end-to-end Shopify QA, a Lighthouse-grade benchmark, or a guarantee that a potential issue is visible. It detects candidate omissions (e.g. missing homepage description), obviously failed public links (404/410), conflicting published shipping thresholds and selected official structured-data business roles / generic publicly published mailboxes. Those can be false positives and require verification; no conversion/revenue impact is inferred.

## Repeatable local validation

Run `pnpm test:prospects:release` at the repository root. This merges source translations, checks TypeScript, runs the focused prospect/MCP Vitest suites and focused ESLint. It requires already installed dependencies and **does not invoke GitHub Actions, create Vercel previews, deploy, or scan external stores**. It cannot substitute for real Firestore Emulator rules tests or authenticated browser QA. The last fully executed code check was 67 passing focused tests on commit `29ecbe7`; newer hardening and UI commits still require the repeatable gate to be run once in a working Node environment.

## Release checks — required before merging

1. Run full generated localization parity check and TypeScript typecheck after `pnpm i18n:merge`.
2. Run targeted prospect/MCP Vitest suites and Firestore emulator security rules including prospect, quota, audit and contact client denial. The current static rules test ensures the deny clauses are present but is **not** a substitute for an Emulator test.
3. Confirm role tests for owner/admin, sales_manager, developer, client, unauthenticated and revoked actor. Founder-only human approval and erasure must not be callable by a sales manager. Linking an existing commercial request must match the prospect domain to the organization's published website or require owner review if no website is recorded.
4. Validate safe network behavior (DNS/IP literals, redirects to another host, content types, redirects and oversized responses). A real authorized canary store scan should be performed *only after deployment on approval*; no production write during testing.
5. Visual QA on desktop/mobile with Hebrew RTL and English, including the 20-URL preview, saved duplicate, evidence review, assignment, owner-only contact decision, and empty/failed scan states.
6. Check current platform terms, robots directives and legal basis for collecting contact fields and any future outreach. No automatic emailing/contact-form sending.
7. Review Vercel/Firebase environment authorization/limits and budget before rollout. Vercel Hobby functions with Fluid Compute support a maximum duration up to 300 seconds, but **without** Fluid Compute Hobby's published maximum is 60 seconds; this code uses `maxDuration=120`, so confirm the project actually has Fluid Compute before deploying scans. Official docs: https://vercel.com/docs/functions/limitations. MCP scans run synchronously with `maxDuration=120`; verify that the deployed Vercel runtime actually permits that duration before exposing it.
8. Roll out to agency-only beta; no uncontrolled background scan scheduler. Existing user OAuth grants do **not** gain new scopes automatically — reconnect/reauthorize CartShift in ChatGPT to obtain `prospects:read`, `prospects:write` and `prospects:scan`.

## Adi / founder workflow

1. In ChatGPT: research publicly listed Israeli Shopify stores and their public source pages. Save candidates using `upsert_prospect_batch` (optionally dry-run preview) or `upsert_prospect`. No fictional business identity, guessed email or promise of contact permission.
2. Scan one selected prospect with `scan_prospect` (manual only). If the site refuses access, leave it unchanged, note the reason, and do not bypass it. No automatic contact attempts.
3. In CartShift: founder reviews each candidate issue and approves/rejects using evidence. Named people and email suggestions remain unverified. Owner/admin reviews legitimate channel eligibility and can block a business. Removed contact IDs remain suppressed to prevent reharvesting.
4. Assign Adi via agency-user selector. Adi sets the next action/date and stage. `contact_ready` or `in_conversation` is blocked unless contact-channel eligibility has been recorded by owner/admin. A proposal stage requires founder technical approval. A `won` stage cannot be set directly and requires linking an accepted or paid real proposal.
5. When a real client authorizes paid work, use existing CartShift organization/request/proposal workflows (not this prospect research workspace) and link the commercial request. `PAID` proposal status is only a reference to recorded commercial state; don't double-count collections.

## Privacy and retention

- Personal contact collection is intentionally limited. Default contact state is candidate, `marketingConsent=false`, and `outreachEligibility=review_required`. Public business information does **not** confer marketing opt-in.
- Owner/admin may remove an individual candidate; the generated contact ID is saved as a minimal suppression record to prevent re-import by later audits. They may also permanently redact an entire prospect through the authenticated agency portal after typing REDACT: this removes contacts, findings, former per-prospect audit evidence and commercial cross-references, retaining only the normalized business domain and a blocked do-not-contact tombstone. An aggregate redaction receipt retains the staff actor and count.
- No raw full webpage snapshots, cookies, signup events or invented contact details are persisted by the scan.
- **Not yet implemented:** automatic retention/TTL cleanup of never-visited candidates, source-specific terms policy engine, legal assessment for cross-border processing and independent verification of marketing permission. Manual, audited erasure is available now, but is not a replacement for a reviewed retention policy. Keep the feature as private human-reviewed research until these decisions are made.
- Existing `marketing_leads`, `marketing_email_jobs`, client invitations and paid proposals are not modified by scanner operations.

## Cost control

No Vercel Preview or GitHub Actions is required merely to inspect design or update docs. Use local Vitest, localization and TypeScript checks first; one intentional CI/preview check only when ready for release. Avoid a recurring crawler, external enrichment credits and routine Puppeteer/Lighthouse executions until a pilot proves sales value.
