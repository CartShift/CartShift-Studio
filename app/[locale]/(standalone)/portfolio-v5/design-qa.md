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

## Required next QA iteration

1. Capture source and implementation at 1440×900 and 390×844 on the same browser engine and density.
2. Compare images together in a single side-by-side artifact, including hero and menu states.
3. Test desktop/mobile menu, Escape/focus trap, locale switch, project links and reduced-motion setting.
4. Inspect console and ensure no horizontal overflow, then update this file to **final result: passed** only when all P0–P2 findings are resolved.
