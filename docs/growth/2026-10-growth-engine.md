# CartShift Growth Engine — execution plan

**Owner:** CartShift Studio  
**Created:** 2026-10-16  
**Scope:** Public website, SEO, expert store-review funnel, measurement, and commercial handoff  
**Operating principle:** Quality of qualified leads and won revenue outranks raw organic traffic.

## Decision and positioning

Lead with **Shopify development and store improvement** for operating ecommerce teams. Emphasize practical fixes to buying friction, technical SEO, B2B operations, stock/fulfilment integration, and maintainable custom functionality. WordPress and general software development remain available but are secondary in acquisition messaging.

Primary offer: **Free expert store review**. It is a scoped, human-led review of public pages, not an instant or exhaustive audit. Initial output targets 3–5 evidence-backed prioritized observations when a review is accepted. No ranking, speed, conversion or revenue outcome is guaranteed.

Primary languages: English and Hebrew. German expansion is a separate experiment requiring real local content and evidence. Never auto-publish thin local landing pages.

## Baseline and confirmed code inventory (2026-10-16)

- Public site uses Next.js App Router and localized EN/HE routes.
- Homepage Hero and StoreAnalyzerTeaser already link to /free-store-review. Do not rebuild them.
- /free-store-review includes a human-led offer, visible request form and explicit limits.
- /api/store-review-requests implements URL normalization, 48-hour email/store deduplication, rate limiting, optional attribution, a Firestore transaction, internal notifications and a marketing lead mirror. Durable primary writes are not rolled back when secondary notifications fail.
- Production requires STORE_REVIEW_INTAKE_ENABLED=true plus valid reCAPTCHA configuration and Firebase Admin access; current production values were **not confirmed**, because environment-variable listing was forbidden.
- /api/human-review is a distinct legacy/analyzer-related path. **Do not merge collections or change the funnel contract without an audited migration plan**.
- Google Analytics code exists but its production measurement ID, receipt of conversion events, and Search Console access are unverified.
- Sitemap/canonical/hreflang implementations exist. A historical indexing incident involving trailing slashes and old /blog redirects is documented in docs/SEO_INDEXING_FIX.md. Historic "resolved" notes do not establish current Google index coverage.
- The website's self-serving review structured-data snippet is not a valid route to Google review stars for this business. Displaying actual client testimonials is separate from eligibility for review-rich results.
- Unverified marketing counters ("98%", "12+", "24/7") should not be shown as verified facts until source evidence is attached to an approved claim register.

## Architecture and single source of truth

Visitor -> page/article/service -> expert review form -> human_review_requests (canonical review record) -> agency leads workflow -> scoped findings -> consultation/proposal -> project/closed outcome.

Maintain two separate concepts:
1. **Review request:** intake, assigned reviewer, review status, 3–5 observations with evidence and confidence, delivery decision.
2. **Sales opportunity:** sales owner, qualification, follow-up, proposal linkage, deal stage and won/lost outcome.

Prefer references to the existing canonical review request and prospect/lead records over copying data into a second CRM. Existing marketing_leads mirrors remain compatible; use reviewRequestId for reconciliation. Idempotent writes, permission checks, explicit consent and no unwanted marketing subscriptions are release gates.

### Human review editorial standard

For each item record: URL or screenshot evidence, direct observation, customer impact or risk (without unsupported certainty), concrete next action, impact priority, effort estimate where possible, and verification confidence (verified / estimated / needs_access). Never present a public-only check as an authenticated Shopify admin audit. Client-identifiable case material requires explicit permission.

An accepted review has a clear owner and next action. Operational goal: acknowledge in one business day **when capacity permits**; do not publish an unconditional response-time guarantee. Keep submissions private by default and decouple review acceptance from promotional email consent.

## Public-site information architecture

- /solutions/shopify — Shopify service hub.
- /services/shopify-conversion-optimization — conversion and buying-flow friction.
- /services/shopify-b2b-integrations — operational integration and B2B workflows.
- /services/shopify-performance-seo — technical indexing/performance.
- /free-store-review — primary conversion destination.
- /work and /work/[slug] — verified evidence of past work.
- /blog and /blog/[slug] — practical content with relevant internal links.
- /solutions/seo, /solutions/wordpress and /contact remain available but are secondary in acquisition hierarchy.

Each new service page must have its own EN/HE copy, title/description, canonical/hreflang, relevant Shopify hub links and two links to the expert review. Do not add FAQ rich-result promises; FAQs are for real customers.

## 90-day work plan and release gates

| Window | Deliverables | Acceptance / evidence |
|---|---|---|
| Days 1–7: P0 | Review funnel smoke test, Search Console/GA4 baseline, remove unverified trust claims and invalid self-review markup, fix false sitemap lastmod | Real submission saved exactly once with notification and follow-up ownership; no critical 404, canonical, hreflang or indexability regressions |
| Days 8–21: P1 | Commercial-service pages and links from Shopify hub; refreshed home/CTA | Three distinct accessible EN/HE pages with correct metadata and working CTA |
| Days 15–35: P1 | Case-study evidence packet for Honeypot, Stiletto and Arava; keyword-to-page map | Screenshots/results/permissions verified; no invented metrics, statements or testimonials |
| Days 22–45: P1 | Upgrade existing high-intent articles first, then publish up to three original articles | Unique examples, sourced technical claims, review, contextual CTA, no keyword cannibalization |
| Days 30–75: P1 | Introductions, referral outreach, Eddy's prospect prioritization and follow-up workflow | Source-backed targets, compliant outreach, named owner, next action; tracked replies and qualified calls |
| Days 45–90: P2 | Conversion iteration and measurement | Compare sessions, reviews, qualified leads, proposals, and won deals by first/last touch; prioritize based on evidence |

Phases overlap. SEO outcomes depend on indexing, competition and time; no schedule guarantees rankings.

### Keyword/intent starting hypotheses (research required)

- shopify conversion optimization service / שיפור יחס המרה שופיפיי
- shopify b2b integration / חיבור שופיפיי למלאי ומחסן
- shopify technical seo and speed / קידום טכני שופיפיי
- shopify developer for existing store / מפתח שופיפיי לחנות קיימת
- shopify store audit / בדיקת חנות שופיפיי

These are **hypotheses**, not validated search-volume or keyword-difficulty figures. Confirm with Google Search Console queries, landing pages and competitors before expanding content.

## Measurement contract

1. Search Console: indexed/non-indexed canonical URLs, non-brand clicks and impressions, query-page mapping, CTR and positions, segmented by EN/HE and intent. Brand filter documented, with regex/version.
2. Site analytics: organic sessions to commercial landing pages, form starts, successful expert review submissions, booking intent, booking outcomes.
3. Commercial CRM: canonical review ID, review status, qualification, responsible person, proposal linkage, outcome and currency-specific won revenue.
4. Attribution: retain origin/source, landing page, campaign and first/last-touch fields. Never include customer email or store-private data in analytics events or URLs.
5. Review: weekly source/landing-page and conversion diagnostic; monthly channel and won-revenue review. Do not infer lead counts or win rate from Vercel deployments.
6. Dashboards must label periods, definitions, missing sources, sample sizes, deduplicated counts and confidence.

### Starter KPI formulas

- Review CVR = unique successfully persisted review requests / qualified public-site sessions reaching eligible landing pages.
- Qualified lead rate = qualified unique leads / valid unique leads.
- Proposal rate = opportunities with submitted proposals / qualified opportunities.
- Win rate = won opportunities / decided opportunities; open opportunities excluded.
- Attributed won revenue = sum of verified won project values using the business-defined currency conversion/reporting rules.

Do not divide by zero; unavailable denominators should display "not measured", not 0%.

## Quality and release checklist

- [ ] Verify currently deployed commit and exact app domain.
- [ ] Confirm all required server/client review env variable **presence and correct scope** without exposing values. Permission-blocked checks remain pending.
- [ ] Submit one controlled production review only with a designated internal test identity/store and clean it up according to policy; verify single review, attribution, email/notification and explicit marketing opt-in.
- [ ] Confirm URL behavior (200/308 where expected) for six localized commercial service URLs, both localized review pages, canonical/hreflang pairs and sitemap entries.
- [ ] Confirm robots keeps portal/admin/data and user-specific pages excluded from public search as appropriate.
- [ ] Ensure sitemaps do not advertise build-time as a genuine content modification time.
- [ ] Review structured data against current Google guidance; no self-serving business review-rich snippet.
- [ ] Inspect mobile/desktop accessibility, RTL and form success/failure states.
- [ ] Run a focused typecheck/build and smoke test before a production update; avoid preview deployments and unnecessary GitHub Actions or duplicate builds.
- [ ] Verify Production READY and check errors/behavior after deployment.
- [ ] Confirm GA4/Google Search Console access, real events and conversion tracking; **not yet verified**.
- [ ] Publish case-study metrics/quotes only after client permission and source verification.

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Intake disabled or reCAPTCHA mismatched | Lost inbound leads | Test submission and production configuration before traffic campaigns |
| Search Console inaccessible | No defensible baseline | Connect Google property and take first export |
| Duplicate review paths | Duplicated/incorrect lead records | Keep primary reviewRequestId and reconcile legacy mirrors, no blind migration |
| Unverified marketing statements | Credibility / compliance | Claims register with sources or remove claims |
| Thin generic pages | Weak rankings and trust | Publish expert problem/solution content, avoid mass page generation |
| Self-serving review structured data | Invalid rich-result eligibility | Keep genuine human-facing testimonials, remove review rich-result markup |
| Deploy usage cost | Development friction | One coherent change set; no unsolicited preview; targeted checks |

## Editorial backlog: drafts to commission only after evidence review

1. "Why Shopify stores get traffic but not orders" — map actual buying friction and scope of audit.
2. "Choosing between Shopify B2B, apps and custom integration" — plan limitations and operation tradeoffs.
3. "Shopify SEO diagnosis: indexing, canonicals and speed" — distinguish real indexing bugs from noisy scores.

Every article needs a named technical reviewer, actual observed example or reproducible explanation, current platform documentation, unique page intent, and a context-appropriate route to the free expert review.

## Status interpretation

This file is the implementation plan and release checklist. A code artifact being committed is **not evidence that production has deployed, a live lead test passed, Search Console is connected, or organic client acquisition improved**. Update statuses only on verified evidence and link to the corresponding deployment, PR, test and analytics source.

## Official guidance

- Google: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google review snippets: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Google sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
