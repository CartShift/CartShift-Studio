# Prospect Intelligence + ChatGPT MCP MVP Implementation Plan

> **For agentic workers:** Implement in reviewable stages with tests; never trigger promotional outbound actions.

**Goal:** let ChatGPT save and read researched candidate stores and unverified findings inside CartShift; let Adi view them in the existing Agency Portal.

**Architecture:** server-only Firestore prospect service shared by MCP tool adapter and authenticated Portal APIs; domain validation and deterministic key for idempotency; role and OAuth gates enforced server-side.

**Tech Stack:** Next.js 16 App Router, Firebase Admin/Firestore, Zod 4, React 19, TanStack Query 5, next-intl and Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-prospect-intelligence-mcp-design.md`

## Global Constraints
- Separate `agency_prospects` from inbound `marketing_leads` and `portal_organizations`.
- Prospect upserts may not set marketing consent, verified findings, contacts, approved eligibility, nor send messages.
- Staff role: owner/admin/sales_manager only; sales_manager cannot approve legal/technical review.
- Add OAuth scopes `prospects:read` and `prospects:write`; existing scopes and tokens are not sufficient.
- Use source-only EN/HE translations; never edit generated locale JSON.
- No remote scans or previews in this first implementation; no Vercel deploy and no CI merely for docs.

## Review Focus
- Duplicate `www`/bare domain: one prospect, no suppression overwrite.
- Private/local/IP or non-HTTPS URLs: validation fails before Firestore writes.
- Malicious remote page prose: stored as unverified data, never interpreted as directions.
- Role revoked after OAuth: fail every call; user cannot self-set outreach flags.
- Finding observed on another domain: reject unless separately reviewed as external evidence (not part of MVP).

## Tasks
### Task 1 — domain models
Files: `lib/domain/prospects.ts`, `tests/domain/prospects.test.ts`
- [ ] Define strict schemas and URL normalization; add test cases for www dedupe, invalid hosts, extra keys.
- [ ] Derive deterministic prospect IDs and bounded evidence inputs.
- [ ] Static verify with TypeScript and pure unit assertions.

### Task 2 — private data access
Files: `lib/services/prospects-server.ts`, `firestore.rules`, `tests/services/prospects-server.test.ts`
- [ ] Require active owner/admin/sales_manager from `portal_users`.
- [ ] Add idempotent store upsert with preserved suppression/createdAt.
- [ ] List/get and attach unverified, sourced findings.
- [ ] Test missing auth, idempotency and no marketing data side effects.

### Task 3 — ChatGPT MCP tools
Files: `lib/mcp/prospect-tools.ts`, `lib/mcp/tools.ts`, `lib/mcp/connection.ts`, MCP tests
- [ ] Advertise list/get/upsert/add finding with explicit prospect scopes.
- [ ] Dispatch through shared service and use strict Zod input, actor/role checks.
- [ ] Validate OAuth request scopes, old-token failure and tool result shapes.

### Task 4 — Agency portal and bilingual UI
Files: `app/api/portal/agency/prospects`, `app/[locale]/portal/agency/prospects`, `components/portal/shell/constants.ts`, `messages/src/{he,en}/portal/*`
- [ ] Add protected list/create/get APIs and compact view with source/review states.
- [ ] Add navigation link for sales roles; support RTL and empty/loading/error.
- [ ] Only human-entered candidate creation; no hidden automated contact attempt.

### Task 5 — review/handoff
- [ ] Inspect committed tree/diff for accidental changes and exposed data.
- [ ] Verify TypeScript/changes where resources permit; do not assert passing tests without execution.
- [ ] Link the feature branch and #57–#62; leave scanner/contacts as explicit next phases.