# Prospect Intelligence + ChatGPT MCP MVP Implementation Plan

> **For agentic workers:** Implement in reviewable stages with tests; never trigger promotional outbound actions.

**Goal:** let ChatGPT research and save candidate stores, trigger bounded on-demand static audits, capture source-backed finding/contact candidates, and let Adi move verified opportunities through internal sales stages without any automated outreach.

**Architecture:** server-only Firestore prospect service shared by MCP tool adapter and authenticated Portal APIs; domain validation and deterministic key for idempotency; role and OAuth gates enforced server-side.

**Tech Stack:** Next.js 16 App Router, Firebase Admin/Firestore, Zod 4, React 19, TanStack Query 5, next-intl, Node HTTPS + DNS pinning, sanitize-html and Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-prospect-intelligence-mcp-design.md`

## Global Constraints
- Separate `agency_prospects` from inbound `marketing_leads` and `portal_organizations`.
- Prospect upserts may not set marketing consent, verified findings, approved eligibility, nor send messages. Separate contact-candidate writes require official-site source evidence and are explicitly unverified.
- Staff role: owner/admin/sales_manager only; sales_manager cannot approve legal/technical review.
- Add OAuth scopes `prospects:read`, `prospects:write` and `prospects:scan`; existing scopes and tokens are not sufficient.
- Use source-only EN/HE translations; never edit generated locale JSON.
- Only explicit on-demand public-site scans; no real businesses scanned in development, no Vercel deploy and no CI merely for docs.

## Review Focus
- Duplicate `www`/bare domain: one prospect, no suppression overwrite.
- Private/local/IP or non-HTTPS URLs: validation fails before Firestore writes.
- Malicious remote page prose: stored as unverified data, never interpreted as directions.
- Role revoked after OAuth: fail every call; user cannot self-set outreach flags.
- Finding observed on another domain: reject unless separately reviewed as external evidence (not part of MVP).

## Tasks
### Task 1 — domain models
Files: `lib/domain/prospects.ts`, `tests/domain/prospects.test.ts`
- [x] Define strict schemas and URL normalization; add test cases for www dedupe, invalid hosts, extra keys.
- [x] Derive deterministic prospect IDs and bounded evidence inputs.
- [x] Static verify with TypeScript and pure unit assertions.

### Task 2 — private data access
Files: `lib/services/prospects-server.ts`, `firestore.rules`, `tests/services/prospects-server.test.ts`
- [x] Require active owner/admin/sales_manager from `portal_users`.
- [x] Add idempotent store upsert with preserved suppression/createdAt.
- [x] List/get and attach unverified, sourced findings.
- [x] Test missing auth, idempotency and no marketing data side effects.

### Task 3 — ChatGPT MCP tools
Files: `lib/mcp/prospect-tools.ts`, `lib/mcp/tools.ts`, `lib/mcp/connection.ts`, MCP tests
- [x] Advertise list/get/upsert/add finding with explicit prospect scopes.
- [x] Dispatch through shared service and use strict Zod input, actor/role checks.
- [x] Validate OAuth request scopes, old-token failure and tool result shapes.

### Task 4 — Agency portal and bilingual UI
Files: `app/api/portal/agency/prospects`, `app/[locale]/portal/agency/prospects`, `components/portal/shell/constants.ts`, `messages/src/{he,en}/portal/*`
- [x] Add protected list/create/get APIs and compact view with source/review states.
- [x] Add navigation link for sales roles; support RTL and empty/loading/error.
- [x] Only human-entered candidate creation; no hidden automated contact attempt.

### Task 5 — review/handoff
- [x] Inspect committed tree/diff for accidental changes and exposed data.
- [x] Verify TypeScript/changes where resources permit; do not assert passing tests without execution.
- [x] Link the feature branch and #57–#62; leave scanner/contacts as explicit next phases.
## Completion review — branch-only delivery

- [x] Domain normalization, safe source guards, deduped Firestore records and sourced findings.
- [x] ChatGPT MCP scoped read/write/scan actions, bulk import and work-stage/proposal linking.
- [x] Bounded HTTPS/robots-aware 6-page static scanner, generic business-contact extraction, JSON-LD decision-maker candidates and simple copy/404 findings.
- [x] Hebrew/English agency UI, owner-only review gates, Adi assignment and next action, suppression/contact removal.
- [x] Run focused Vitest suite: 56 tests in 12 files passed locally (2026-10-14, before final UI quality patch).
- [ ] TypeScript and lint green on the final branch HEAD.
- [ ] Firestore emulator permission tests for new prospect collections, and one safe canary scan after explicitly approved beta deployment.
- [ ] Founder legal/privacy review of outreach eligibility channels, data minimization and retention TTL before production.
- [ ] Real desktop/mobile RTL/EN QA with authenticated agency roles, reconnect CartShift OAuth scopes, and verify actual Vercel scanning runtime.
- [ ] Migrate 14 previously researched businesses through preview-confirm import only when approved; no production writes from this implementation work.

**Release decision:** remain on the feature branch until all launch gates are met. This avoids unintended Vercel Preview/CI charges from creating an early pull request and prevents an unverified feature from reaching production.
