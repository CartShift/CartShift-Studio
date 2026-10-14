# Prospect Intelligence + ChatGPT MCP — reviewed direction

**Purpose:** research-based, human-verified Israeli Shopify lead generation for CartShift. Adi manages discovery and sales; founder approves technical proposals and outbound eligibility. Extends #57–#62, not a new CRM.

**Architecture:** existing Next.js agency portal and CartShift MCP OAuth call the same server-only prospect service. Firestore `agency_prospects` stores researched companies, distinct from opt-in `marketing_leads`. Findings are subdocuments with source URLs, excerpts, timestamps and `unverified` state. Every store retains its do-not-contact gate.

**MVP (first release):** manual/domain upserts, dedupe, private list/details, attach sourced finding candidates and public business-contact candidates, role-restricted ChatGPT tools, Adi-facing view and source badges. No automated scanning, contact crawling, consent approval or outreach yet. Contact suggestions are unverified and never indicate a permitted marketing channel. Current sources are just user-/ChatGPT-provided research, never represented as independently verified. Business promotion channel stays `review_required`.

**Sequence:** (1) P0+MCP-A private leads and external prospect ingestion; (2) P1+MCP-B safe server scan with robot/terms/SSRF enforcement and scan job polling; (3) P2+MCP-C official business contact suggestions with legal basis and suppression; (4) P3 assignment, follow-up and approved proposal/payment handoff.

**Constraints:** sanitize and bound all inputs; prove actor agency role on every operation; authorize OAuth `prospects:read/write` independently of clients/work scopes; historical OAuth grants never escalated. No AI-generated factual claim promoted to verified; keep customer/marketing collections untouched. No public contacts or quotes emitted through email from scanner. Safe retries preserve records and suppression.

**UI:** link `/portal/agency/prospects` in agency navigation. Compact RTL/EN list with URL, source, stage, review and next action. Manual create and view evidence. Never imply contact permission from having a business address.

**Testing:** domain normalization, dedupe, source provenance, authorization including revoked users, tool registry/scopes, same-host finding evidence, no write leakage to email jobs, locale parity. Development on a feature branch; no Vercel preview deployment/Actions until it provides concrete diagnostic value.

**Success (pilot target):** 20–30 manually selected prospects; 5–8 actionable verified audits *after* safe scanner and human review; 3 discovery conversations and one proposal. These are not promised outcomes.

**Status:** this design covers the agreed business direction. Actual current execution is restricted to first MVP slice; the scanners/contact extractors remain explicit dependent phases.