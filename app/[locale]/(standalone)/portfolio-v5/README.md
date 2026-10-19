# Portfolio V5 — Fluid Studio

A self-contained, original fluid-art portfolio experiment inspired by the *interaction principles* of the Sharlee portfolio. **No images, fonts, illustrations, logos, or other source-site assets were copied.** The hero sculptures and work illustrations are purpose-built CSS artwork.

## Preview paths

- /en/portfolio-v5
- /he/portfolio-v5

The route is a standalone App Router page and deliberately has no navigation link in the main CartShift website. Metadata uses noindex/nofollow while the design is exploratory.

## Implementation

- No added packages, external fonts, remote media, WebGL, or tracking code.
- Content is Yotam's own professional portfolio, reusing factual project descriptions and case-study links from the existing showcase model.
- Light-reactive glossy organic forms are implemented using original CSS gradients, highlights, masks, shadows and subtly different toroidal silhouettes.
- Hero mouse parallax, animated sculptures, motion pause, keyboard-operable full-screen menu, English/Hebrew locale switch, real case-study links and contact link.
- Mobile layout and prefers-reduced-motion support.
- All styles are scoped under v5 classes and no global CSS rules were modified.

## QA

1. Verify the current source content and translations from the repo.
2. Run pnpm exec tsc --noEmit and pnpm exec eslint on the files.
3. Test desktop/mobile, mobile menu, Escape/Tab focus, locale switch, reduced motion, project links, and mailto.
4. Visual browser QA required before declaring production-ready; no preview deployment was created automatically.

This is an experiment, not an authorized reproduction of Sharlee artwork or branding.
