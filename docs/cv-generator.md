# Tailored CV Generator

The CV system is designed so that creating a new tailored CV does not require editing the PDF layout.

## Source of truth

- `messages/src/en/cv.json` contains the canonical public CV content.
- `lib/cv/cv-data.ts` normalizes that content into the render model.
- `lib/cv/cv-variants.ts` contains named tailoring configs.
- `app/[locale]/(standalone)/cv/CVDocument.tsx` owns the PDF layout.
- `scripts/render-cv-pdf.tsx` renders variants to PDF.
- `scripts/cv.mjs` is the cross-platform command wrapper.

The public CV remains the `default` variant. Tailored variants are overlays on top of the canonical data rather than copied CV documents.

## Everyday usage

List available variants:

```bash
node scripts/cv.mjs list
```

Render one variant:

```bash
node scripts/cv.mjs render product-frontend
node scripts/cv.mjs render fullstack-healthcare
node scripts/cv.mjs render product-ai
```

Render every registered variant:

```bash
node scripts/cv.mjs render-all
```

Use a temporary output directory while experimenting:

```bash
node scripts/cv.mjs render product-ai --output ./tmp/cv-experiments
```

By default PDFs are written to `generated/cv/`, which is gitignored.

## Adding a new tailored CV

Add one config object in `lib/cv/cv-variants.ts` and add its ID to `cvVariantIds`.

A variant can control:

- PDF filename
- document title
- headline
- summary and meta description
- experience ordering
- experience descriptions and highlights
- skill-group ordering
- skill labels and items
- portfolio project ordering

Do not copy `CVDocument.tsx` for a new role. The layout should remain shared.

## Factual safety

Variant overrides intentionally cannot change the identity fields of an employment record:

- company
- role title
- dates
- duration
- location

Those stay canonical. Tailoring is limited to emphasis, summaries, descriptions, highlights, ordering, and skill presentation.

If a factual employment field needs correction, update the canonical CV source instead of hiding the correction inside one tailored variant.

## Current targeting lanes

The initial reusable variants are:

| Variant | Intended use |
| --- | --- |
| `product-frontend` | Senior Product Engineer roles with strong React / Next.js / frontend ownership |
| `fullstack-healthcare` | Senior Full-Stack roles, especially healthcare, telemedicine, APIs, integrations, and regulated products |
| `product-ai` | Product-oriented AI / full-stack roles where AI is part of a shipped product rather than ML research or model infrastructure |

All three preserve the complete employment history while changing the first-screen positioning and technical emphasis.

## Tests

Variant tests live in `tests/cv/cv-variants.test.ts`.

Run them with:

```bash
pnpm vitest run tests/cv/cv-variants.test.ts
```

The existing PDF export test remains in `tests/cv/cv-pdf-export.test.tsx` and continues to protect searchable text, page count, contact links, and PDF rendering.

## Recommended workflow for a specific job

1. Score the job before tailoring. Only spend time on roles that are genuinely strong matches.
2. Start from the closest reusable lane instead of creating a CV from scratch.
3. Add a new variant only when the job needs materially different emphasis.
4. Keep every claim factual. Do not invent metrics or technologies.
5. Render to a temporary directory while iterating.
6. Once the copy is final, render the named PDF and use that exact file for the application.

This keeps the layout stable while making content experimentation cheap and reversible.
