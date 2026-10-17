# CartShift Studio — Marketing Content Release Review

Date: 2026-10-17  
Scope: public marketing copy, localized headings, service FAQs, blog calls to action, and customer-proof hygiene.

## Primary positioning

CartShift Studio is a hands-on, senior-led technical partner specializing in improving existing Shopify stores. The lead entry point is a **free, expert-led initial store review**. It is **not** an instant, complete, automated audit.

Editorial hierarchy:

1. Start with a concrete store problem: product page friction, speed, technical SEO, inventory/operations, B2B, or integrations.
2. Explain the process: inspect public evidence, prioritize issues, agree on scope, implement and verify.
3. Invite an expert review, or offer direct contact for a scoped project.
4. Present WordPress/WooCommerce as selected complementary capabilities, not the primary storefront pitch.
5. Make no guarantees of increased conversion, rankings, ROI, time to deliver, or response times without evidence and agreed terms.

## Implemented in this branch

- Hebrew and English hero, intro, services, process, trust differentiators, contact copy, blog copy and CTAs revised.
- The existing expert review intake at `/free-store-review` remains the central conversion destination.
- WordPress and WooCommerce offering reconciled with Shopify specialization in copy and FAQs.
- Fixed competing screen-reader-only English H1 text on Shopify, WordPress and SEO service pages. Localized visible heading is now also the accessible heading.
- Page-specific JSON-LD FAQ data now draws from the same localized FAQ items as the visible page.
- Blog inventory article now directs to the relevant integration service or human review, not generic SEO.
- Clarified that work filters can overlap; the sum of filtered category counts may exceed the total number of projects.
- Temporarily removed homepage testimonials pending source and permission verification; case study pages remain.
- Added regression checks in `tests/content/marketing-copy-integrity.test.ts`.

## Evidence and permission gate (must be resolved before re-enabling claims)

| Claim / asset | Evidence required | Current treatment |
| --- | --- | --- |
| Public client quotes, named authors, ratings | Confirmed authentic quote, author/role attribution, explicit approval to publish exact wording | Homepage testimonial section not rendered |
| 98% satisfaction | Defined calculation, sample size, period, source data | Do not publish |
| 24/7 coverage or 24-hour response guarantees | Contractual support coverage/SLA that can actually be met | Removed from core contact messaging |
| Improved conversion, revenue, SEO results | Verified before/after analytics, timeframe and attribution caveats | Do not imply measurable uplift from design changes alone |
| Case study release status (especially Stiletto) | Client-reviewed scope, published vs preview status, screenshots and launch date | Review before asserting work is live or results have materialized |
| Shopify Partner badge or similar affiliation | Actual current partner enrollment and brand usage rights | Check separately before adjusting badges |
| Experience years | Clear basis (individual founder vs business age) | Prefer attributed individual expertise over an unattributed studio claim |

## Follow-up before production release

- [x] Source locale key parity and interpolation validation.
- [x] Targeted ESLint / TypeScript check.
- [x] 20 targeted Vitest cases including new content-integrity checks.
- [ ] Complete production build **in an environment with the correct Firebase variables**. Sandbox lacks `NEXT_PUBLIC_FIREBASE_*` required values.
- [ ] Confirm localized rendered HTML and one meaningful H1 per service page in a deployed build.
- [ ] Verify that `/free-store-review` submission, CRM intake, and tracking events work against the production service.
- [ ] Review specific case study status and attribution with each client before rewriting project outcomes.
- [ ] Review Search Console, analytics funnels, and current indexing before making claims about SEO or conversion impact.
- [ ] Consider a real A/B test on the revised hero and review CTA once reliable tracking exists.

## Localization rules

- Change only `messages/src/en/` and `messages/src/he/`; never directly edit generated `messages/en.json` or `messages/he.json`.
- Run `pnpm i18n:merge` followed by `pnpm i18n:validate` during QA.
- Preserve Hebrew naturalness, technical terms where needed, and logical RTL properties.
- Align the on-page FAQ and structured data through the same translation source.
