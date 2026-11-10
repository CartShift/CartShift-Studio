# CartShift German translation — 1:1 content mirror

## Product decision (corrected)

German is **a translation of the existing CartShift website**, not a second marketing site or a rewritten German microsite.

**Invariants:**
1. The same URL types, React page components, section sequence, layouts, images, case studies, testimonials, forms, navigation, CTAs, and functionality as English/Hebrew.
2. The same underlying facts, products, offers and claims; translate faithfully, never silently add/delete/rewrite content for the German locale.
3. Text comes from the `next-intl` source catalog or localized editorial content; do not create a dedicated German-only page/component tree.
4. New German-specific offers, sales funnels, or Berlin-only landing pages require separate product approval and routes; they are **not** part of the base translation.
5. Preserve RTL only for Hebrew; English/German are LTR.

## Source of truth

- `messages/src/en/` is the English translation source hierarchy.
- `messages/src/he/` demonstrates the locale model currently in use.
- `messages/src/de/` is the German translation hierarchy being filled using the **same keys, arrays and ICU placeholders**. Until finished, the generated DE runtime overlay may contain English fallback for development only; **never publish it as translated content**.
- `content/blog/*.md` uses English text and optional Hebrew content blocks. Add German translations to those same content records; keep slugs, images and metadata consistent.
- `content/case-studies/*.md` carries structured case studies with nested Hebrew translation data. Extend that record to German rather than creating another case-study design.
- Localized SEO metadata should translate the existing title/description and preserve the existing page intent; canonical and hreflang only for published, fully translated routes.

## Current progress

- Restored the original shared homepage, service templates, About, Work, Contact, and MainLayout; deleted divergent German-only components.
- German drafts exist for 1,876 checked marketing strings, all 37 blog posts and 9 case studies, plus 186 inline Shopify service and subscription strings; exact-source structure is checked in CI.
- Two CI workflows pass on the latest tested commit: standard quality and German QA (QA temporarily enables all release flags only inside its own runner).
- The German copy is machine-assisted and partially edited. **A full native-language review has not happened**, especially the German legal text.
- Added regression tests for component/section parity and a strict translation-coverage report.
- German stays **disabled** even in Preview until the approved translation is complete.

## Release gate

Three independent opt-ins are required:
```sh
NEXT_PUBLIC_GERMAN_MARKETING_ENABLED=true
NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED=true
NEXT_PUBLIC_GERMAN_LEGAL_APPROVED=true
```

All three are **false by default**. During a German-enabled build, `scripts/merge-translations.js` runs the strict `scripts/check-german-parity.cjs` gate and **fails the build if content is missing or structurally inconsistent**. Do not set any release flag in public production before complete native copy and legal approval. CI sets them in disposable test builds only.

The allowlist in `lib/i18n/german-routes.ts` includes shared public route families: static pages, services, industries, 37 blog posts and nine case studies. Authenticated areas and report tokens stay excluded. Public launch remains blocked even with full string coverage until verified legal and native review. No separate layouts for each language.

## Work remaining before release

- [x] Complete structural translation drafts for public marketing source keys, with matching arrays and interpolation arguments; native German review is outstanding.
- [x] Translate known hardcoded public page metadata and inline Shopify service strings using their existing components. Remaining isolated strings can be captured by browser/native-language review.
- [x] Support German editorial text in the same blog/case-study records, with all 37 posts and nine project records drafted and structural checks.
- [x] Enforce shared templates and structural parity via unit, HTTP and Chromium browser CI checks.
- [ ] Translate and legally review relevant Impressum, Datenschutz and commercial disclosures based on verified business details.
- [ ] Native German review for accuracy, tone and unchanged claims; check translated testimonials preserve their meaning.
- [ ] E2E checks: locale switch, desktop/mobile section and visual parity, forms, consent, SEO, deep links, article and case-study routes.
- [x] Run `pnpm i18n:de:check`, translation validation and German-enabled QA build in CI; Preview builds succeed with public German disabled by default.
- [ ] Publish only after sign-off. Track German organic traffic and qualified leads separately; do not modify the base site to optimize only for German prospects.

## Commands

```sh
pnpm i18n:merge
pnpm i18n:de:check    # expected to fail until translation is complete
pnpm i18n:validate
pnpm exec vitest run tests/i18n/german-layout-parity.test.ts tests/lib/german-routes.test.ts tests/seo/german-metadata.test.ts
pnpm build
```

### Scope separation

The existing EN/HE site remains unchanged. The DE mirror should eventually match both in presentation and site features. Commercial localization (country-specific contact channels, legal details, payments, dedicated sales offers) should be approached *after* faithful translation, as a separate decision. No German prospect-facing release is authorized while content is missing.

## Legal release dependencies (verified November 2026)

- Obtain and privately verify the actual legal operator's name, business/service address, permitted contact details, and any legally required register/tax identifiers under § 5 DDG. Do not infer these from the brand or cofounders, and never push a personal address to the repository without explicit authorization.
- Draft, professionally review and publicly link an Impressum; the website's German translation of an existing privacy notice is **not itself an Impressum**. Where appropriate, identify the editorially responsible party under applicable media law.
- Verify the German Datenschutzerklärung against the *actual* production processors and flows (forms, analytics, hosting, cookies, newsletters and external links), including Article 13 GDPR disclosures; do not assume translated EN terms constitute a compliant German privacy notice.
- Review consent flows for optional storage and tracking under § 25 TDDDG.
- Only then approve `NEXT_PUBLIC_GERMAN_LEGAL_APPROVED=true` in a public deployment. Otherwise leave it false and German routes redirect to EN.

Official references: https://www.gesetze-im-internet.de/ddg/__5.html , https://www.gesetze-im-internet.de/ttdsg/__25.html , https://www.die-medienanstalten.de/aufgaben/aufsicht/impressumspflicht/ .
