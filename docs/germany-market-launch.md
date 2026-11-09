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
- Completed the German common UI source file and a first batch of translations for existing homepage content sections. Other marketing namespaces, editorial content, legal content and many pieces of copy remain untranslated.
- Added regression tests for component/section parity and a strict translation-coverage report.
- German stays **disabled** even in Preview until the approved translation is complete.

## Release gate

Two opt-ins are required:
```sh
NEXT_PUBLIC_GERMAN_MARKETING_ENABLED=true
NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED=true
```

Both are **false by default**. During a German-enabled build, `scripts/merge-translations.js` runs the strict `scripts/check-german-parity.cjs` gate and **fails the build if content is missing or structurally inconsistent**. Do not set either flag before the gate passes and translation/legal review is complete.

The original seven German routes in `lib/i18n/german-routes.ts` are **a temporary allowlist**, not the complete rollout scope. Expand coverage to every public site route after its corresponding catalog and editorial content pass parity. No separate layouts for each language.

## Work remaining before release

- [ ] Complete German copies of all marketing translation namespaces, with identical keys, array lengths and interpolation arguments.
- [ ] Review existing page-local hardcoded English/Hebrew strings, including headings, SEO metadata and structured data. Move translation-worthy strings into the shared i18n catalog.
- [ ] Extend blog and case-study data models to support German translations alongside English/Hebrew; translate the actual articles and full case-study records.
- [ ] Verify that all localized pages use the original shared templates and the same interactive behavior.
- [ ] Translate and legally review relevant Impressum, Datenschutz and commercial disclosures based on verified business details.
- [ ] Native German review for accuracy, tone and unchanged claims; check translated testimonials preserve their meaning.
- [ ] E2E checks: locale switch, desktop/mobile section and visual parity, forms, consent, SEO, deep links, article and case-study routes.
- [ ] Open Preview with approved translation content, then run `pnpm i18n:de:check`, `pnpm i18n:validate`, CI and production build.
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
