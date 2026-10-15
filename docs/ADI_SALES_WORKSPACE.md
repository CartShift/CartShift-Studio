# Adi — CartShift sales workspace (October 2026)

## Goal
Help Adi consistently find, research, qualify, follow up with and hand off real Shopify development opportunities. Research candidates are **not** inbound marketing leads and do **not** confer permission to contact an individual.

## Workflow

1. **Discover:** Adi or the founder researches official business/store domains. Import with the existing CartShift ChatGPT connector using `upsert_prospect_batch` (dry run first) or through the portal's individual/bulk import (up to 20 at a time).
2. **Inbound handoff:** Inside Agency → Marketing Leads, eligible staff may click **Track this store as a prospect** for a selected lead with a supplied store URL. The server rereads the authoritative inbound lead, canonicalizes its public HTTPS domain and safely creates/deduplicates a separate private research candidate via a Firestore transaction. It links the source inbound lead ID, but never copies the email address, grants contact permission, enrolls marketing automation or sends a message. Existing suppressed/do-not-contact prospects cannot be reactivated through this action.
3. **Classify:** In **Agency → Prospects**, choose Merchant or Agency Partner, mark priority, active/archive and assign the current owner. Historical Hebrew notes are used only as unverified cohort labels; never as proof of current Shopify status or intent.
4. **Organize in batches:** Use row checkboxes (up to 20) to assign active prospects to Adi, adjust priority, or archive an out-of-scope group. A transactional API enforces valid team member roles and rejects do-not-contact records atomically. No bulk operation grants outreach permission or sends messages.
5. **Qualify:** Open the official URL and source. Run **Scan** for one specifically selected prospect only when the scanner is enabled. The six-page robot-aware static scan is **not** a checkout, security, Lighthouse or full UX audit. All extracted findings remain unverified until founder review.
6. **Request deep review:** Open the prospect, choose "Request a deep review" or copy the evidence-backed research brief for use in ChatGPT. The former creates an internal activity and places the prospect in the **Awaiting review** queue; it does not run another expensive analyzer or send an email. The founder verifies evidence and scope, then logs a completed review.
7. **Contact responsibly:** Founder/admin records an independently verified permitted channel (including an evidence URL and note). Only then may Adi log outbound communications or set a contact-ready/in-conversation stage. Public business data alone is not consent. No automatic sends or contacting third-party stores from the scan.
8. **Follow up:** Every active prospect has an assigned owner, next action and due date. The **Needs attention** view filters overdue/due records, and the per-store activity journal records notes, incoming/outgoing touches, outcomes and dates. Activity is a human log, **not** proof that an email was sent.
9. **Commercial handoff:** Founder approves the technical scope before a proposal stage. After an existing real client/org is identified and a billable request is QUOTED/ACCEPTED/PAID, only owner/admin can use the guided portal **Connect proposal** form or the existing MCP `link_prospect_proposal` tool. This validates the org website domain and real existing quote; accepted/paid may move the stage to won. Never infer that funds were collected from a mere prospective conversation. Sales edits reject manual `proposal`, `won`, and `suppressed` transitions; use linked commercial documents or founder eligibility review respectively.

## Permissions
- `business_development`: agency portal, marketing-lead list, prospect workspace, research notes, safe on-demand scan, activity journal and manual follow-ups.
- `business_development` has **no** sales revenue dashboard, profit split management, client creation, billing or pricing-management permission by navigation/permission policy. **Firestore also excludes this role from its general `isAgencyUser()` grant**, and allows explicit scoped marketing-lead reads, manual contact-status writes only, and agency-staff listing. The marketing leads screen does not load the general client roster or show the client-invitation button for this role.
- Prospect write APIs separately recheck live `portal_users` role and revocation. Founder-only functions: outreach-channel eligibility approval, technical scope approval, verified findings, permanent redaction, and review completion.
- MCP authorizes users with live agency roles, with `prospects:read/write/scan` scopes; non-prospect clients/work tools reject business development even if an older OAuth grant includes broader scopes.
- Generic commercial `requireAgencySession` remains restricted to owner/admin/sales_manager; it does **not** accept business development.

## Data and design
- `agency_prospects`: private, deduped by canonical domain; `segment`, `priority`, `archived`, owner, action/due, stage, technical approval, scan state and review state.
- `agency_prospects/{id}/activities`: bounded private journal with kind, direction, outcome, actor and timestamp. A Firestore transaction checks suppression, live role and contact permission before logging an outbound event.
- Activity, research contacts, findings and audit evidence are server-owned; direct Firebase client SDK access remains denied.
- Owner/admin permanent redaction now deletes activity journal children as well as contacts/findings, before replacing the prospect with a minimal do-not-contact tombstone.
- Filters/search are bounded and server-backed with a document cursor. The current-page KPI cards intentionally describe **only** the visible page; they are not agency-wide sales totals.

## Operator checks before inviting Adi
- Verify deployment-specific `PROSPECT_SCANS_ENABLED` flag, actual Vercel runtime duration and Firebase rules deployed. Do **not** enable the scanner without the existing robots/SSRF canary and cost checks.
- Grant `business_development` via the agency invitation form; inspect the resulting server role and portal access. Never upgrade her to owner/admin just to enable a feature.
- Verify Firestore Emulator rules denial for direct prospect activities, general client data (for the BD role), agency-staff-only queries, and the limited marketing-lead contact-status update.
- Verify active list, archive, due/review filters, pagination, same-domain findings, role-restricted outbound stage, activity timeline, founder-only approval, inbound marketing-lead handoff and quote conversion in an authenticated desktop/mobile browser, Hebrew and English.
- Validate the existing Store Analyzer separately before trusting any PageSpeed or conversion claims. No recurring scan scheduler or silent email automation.
- Existing historical prospects remain owned by the importing account. Reassign a small reviewed sample to Adi after the invitation; do not silently bulk-reassign archived or suppressed businesses.

## Focused QA
```bash
node scripts/merge-translations.js --silent
npm run typecheck
npm exec -- vitest run tests/domain/prospect-activities.test.ts tests/domain/prospect-review-brief.test.ts tests/domain/prospect-sales.test.ts tests/services/prospect-activities-server.test.ts tests/services/prospect-inbound-link-server.test.ts tests/services/prospect-bulk-server.test.ts tests/services/prospect-pagination.test.ts tests/services/prospect-sales-permissions.test.ts tests/services/prospect-privacy-server.test.ts tests/services/prospects-server.test.ts tests/security/prospect-firestore-rules.test.ts tests/api/cartshift-mcp-prospects.test.ts tests/api/prospects.route.test.ts tests/utils/agency-permissions.test.ts
npm exec -- eslint 'app/[locale]/portal/agency/prospects/ProspectsClient.tsx' 'components/portal/prospects/*.tsx' 'lib/domain/prospect*.ts' 'lib/services/prospect-activities-server.ts'
```
No GitHub Actions, automatic Vercel preview, cron crawler or externally credit-consuming enrichment is required for those local checks.

## Pilot KPI targets (not forecasts)
For a two-week manual pilot, start with 20 sourced store domains, 10 qualified merchants/partners, five useful reviewed opportunity briefs, three conversations and one real proposal. Track: verified Shopify identity, response rate on approved outreach, due follow-up completion, conversation-to-quote, quote-to-paid, and time from prospect import to founder decision.

## Outstanding production-release gates
- Firestore Emulator rules tests for prospect activities and marketing-lead updates, and authenticated role/browser QA; unit/static checks are not substitutes.
- Final deployment review for the scanner function flag, Vercel Hobby runtime limits and Firebase rules.
- Founder-approved legal retention policy, market/channel outreach rules and retention TTL for never-qualified prospects.
- Future opt-in email/Calendar integration must be independently permissioned per staff mailbox; no email sends are included in this branch.
- True Store Analyzer deep checks remain an *explicit manual follow-up*. The in-app deep-review button queues founder work and the brief prepares ChatGPT research; it does not pretend a six-page static scan is a full audit.
