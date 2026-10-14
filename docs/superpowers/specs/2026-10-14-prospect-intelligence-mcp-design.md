# Prospect Intelligence + ChatGPT MCP — reviewed direction

**Purpose:** research-based, human-verified Israeli Shopify lead generation for CartShift. Adi manages discovery and sales; founder approves technical proposals and outbound eligibility. Extends #57–#62, not a new CRM.

**Architecture:** existing Next.js agency portal and CartShift MCP OAuth call the same server-only prospect service. Firestore `agency_prospects` stores researched companies, distinct from opt-in `marketing_leads`. Findings are subdocuments with source URLs, excerpts, timestamps and `unverified` state. Every store retains its do-not-contact gate.

**Implemented (branch only):** manual/domain and ≤20-store bulk upserts with preview, dedupe, private list/details, sourced candidate findings and contacts, explicit on-demand bounded public-site scanning, role-restricted ChatGPT tools, Adi-facing assignment and follow-up queue, founder-only human verification/eligibility decisions and linking to a real existing commercial proposal. **Nothing is live or deployed yet.** The scanner does not submit forms, run visual browser QA or contact businesses. Business roles and generic mailboxes are candidate information, never evidence of marketing opt-in. Promotion eligibility defaults to `review_required`.

**Execution sequence:** P0/MCP-A private leads and ingestion → P1/MCP-B on-demand safe HTTPS public-site scan → P2/MCP-C sourced business contacts, no marketing automation → P3 assignment/review/proposal handoff. Branch implements these vertical slices synchronously, with strict per-user/day quotas and 15-min store cooldown. **Not implemented:** queued/asynchronous scan jobs, an automatic site-terms parser, personal-data retention TTL, first-party visual QA, and automatic outreach. Those are explicit future release decisions, not implicitly completed.

**Constraints:** sanitize and bound all inputs; prove actor agency role on every operation; authorize OAuth `prospects:read/write` independently of clients/work scopes; historical OAuth grants never escalated. No AI-generated factual claim promoted to verified; keep customer/marketing collections untouched. No public contacts or quotes emitted through email from scanner. Safe retries preserve records and suppression.

**UI:** link `/portal/agency/prospects` in agency navigation. Compact RTL/EN list with URL, source, stage, review and next action. Manual create and view evidence. Never imply contact permission from having a business address.

**Testing:** domain normalization, dedupe, source provenance, authorization including revoked users, tool registry/scopes, same-host finding evidence, no write leakage to email jobs, locale parity. Development on a feature branch; no Vercel preview deployment/Actions until it provides concrete diagnostic value.

**Success (pilot target):** 20–30 manually selected prospects; 5–8 actionable verified audits *after* safe scanner and human review; 3 discovery conversations and one proposal. These are not promised outcomes.

**Current status (2026-10-14):** implementation exists in `feat/prospect-intelligence-mcp-mvp`, with tests and quality checks reported separately in the GitHub issue. This document describes intended behavior, not authorization to publish the feature, scan real businesses, or message prospects. See `docs/PROSPECT_INTELLIGENCE_OPERATIONS.md` for launch gates.