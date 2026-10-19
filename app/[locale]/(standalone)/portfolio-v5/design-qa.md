# Portfolio V5 — Design QA (2026-10-19)

**final result: blocked**

## Evidence & scope

- Source design truth: https://itssharl.ee/ and Awwwards published visual reference of the source home and mobile pages.
- Implementation: https://cart-shift.com/en/portfolio-v5 and https://cart-shift.com/he/portfolio-v5.
- Source viewport targets: desktop 1440×900 CSS px, mobile 390×844 CSS px, 1× density.
- Implementation screenshot: unavailable because remote Chromium process lacks libnspr4.so; both source and implementation screenshots were not captured in the same browser session.
- Browser full-view and focused-region comparisons: blocked. No pixel measurements or visual matches are claimed.
- Remote HTTP check: production route returned 200 OK; Next.js production deployment completed successfully.
- Primary interactions: reviewed by code only; not browser-verified.
- Console error check: blocked by Chromium startup failure.

## Findings

- [P1] Fidelity gap: source uses high-quality, organically lit 3D tube-like objects. The original v5 used simple CSS ovals. **Partial fix:** revised the hero and project artwork toward original organic toroidal silhouettes. **Still open:** capture and compare, and consider purpose-rendered 3D assets or shader-based objects for final-quality fidelity.
- [P2] Navigation focus: closing via a section link could move the viewport unexpectedly as the menu toggle regains focus. **Fix:** apply focus with preventScroll.
- [P2] Visual validation: desktop and mobile source/implementation pairs are missing. **Blocked** pending access to a browser with required shared libraries.
- [P3] Asset quality: high-quality original transparent CGI concept exists, but is not used in the deployed page. Do not claim asset parity or reuse source-site artwork.

## Fidelity surfaces

- Typography: CSS implementation reviewed; pixel accuracy not verifiable.
- Layout/spacing: CSS breakpoints reviewed; viewport overflow not visually verifiable.
- Colors: original palette approximates the source, but no normalized image comparison completed.
- Imagery: procedural original CSS, significantly less dimensional than reference; toroidal mask work is an interim refinement.
- Copy/content: deliberately adapted to Yotam Faraggi and actual projects, not copied from Sharlee.

## New routing

Work, About and Contact were added as independent routes with shared navigation. Their responsive rendering and interaction behavior still require in-browser verification.

## Required next QA iteration

1. Capture source and implementation at 1440×900 and 390×844 on the same browser engine and density.
2. Compare images together in a single side-by-side artifact, including hero and menu states.
3. Test desktop/mobile menu, Escape/focus trap, locale switch, project links and reduced-motion setting.
4. Inspect console and ensure no horizontal overflow, then update this file to **final result: passed** only when all P0–P2 findings are resolved.

## 2026-10-20 visual iteration (pending new browser capture)

User-provided mobile screenshots directly ground the critical findings: headings in Work and Contact are dark on dark, outlined hero/about letters visually overlap, and project cards repeat nearly identical generic blobs. Added explicit high-contrast heading colors, re-authored hero/about/contact typography, and replaced generic project-card artwork with screenshots of Yotam's own portfolio projects. The supplied captures are 705px-wide screenshot images of mobile states; they were not normalized to source screenshots. After deployment, renewed visual screenshots and interactive browser checks are still required; **final result: blocked** until verified. The source reference site's assets remain unused.

## Chromium production checks (2026-10-20)

Browser QA was executed successfully on the production domain using a real headless Chromium after installing missing system packages in a one-off Vercel sandbox. Tested desktop 1440×900 CSS px and mobile 390×844 CSS px, density 1, English and Hebrew. Home, Work, About and Contact returned HTTP 200; desktop home returned HTTP 304 with a valid cached document. The mobile root document width was 390px (no horizontal overflow). Work heading computed RGB(243,240,255), contact heading RGB(250,249,255). Four original-project screenshots on the homepage reported complete and naturalWidth greater than zero. Mobile menu opened and closed successfully via Escape. No uncaught page errors on tested pages. A 404 console resource on the Work index was found, traced to external (non-local) preview candidates and replaced with a CSS fallback for those entries. Browser captures were collected during QA but could not be downloaded before the ephemeral sandbox stopped; visual side-by-side judgment remains blocked. Final result: blocked pending screenshot review.
