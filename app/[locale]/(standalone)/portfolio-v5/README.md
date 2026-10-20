# Portfolio V5 — Fluid Studio

An original experimental portfolio for Yotam Faraggi in the CartShift Studio repository. Inspired by the editorial composition and playful materiality of https://itssharl.ee/, but **no images, 3D models, fonts, brand assets, shaders, or code were copied**. All decorative artwork is ours.

## Routes

| Locale | Home | Work | Experience | About | Contact |
| --- | --- | --- | --- | --- | --- |
| English | /en/portfolio-v5 | /en/portfolio-v5/work | /en/portfolio-v5/experience | /en/portfolio-v5/about | /en/portfolio-v5/contact |
| Hebrew | /he/portfolio-v5 | /he/portfolio-v5/work | /he/portfolio-v5/experience | /he/portfolio-v5/about | /he/portfolio-v5/contact |

This is an isolated, **noindex / nofollow** experiment; the primary CartShift website is unchanged. Portfolio content and projects are based on our existing \`lib/portfolio-showcase.ts\` data, not fictitious case studies.

## Architecture

- **Homepage:** \`PortfolioV5.tsx\` is the minimal interactive landing page. \`FluidField.tsx\` contains the optional WebGL2 ray-marching renderer and its CSS fallback.
- **Navigation:** \`V5Navigation.tsx\` is shared across routes. Uses Next.js links with prefetch disabled and a native modal \`<dialog>\` (browser-managed keyboard focus, Escape behavior, and background inertness).
- **Detail pages:** \`PortfolioV5Detail.tsx\` is a Server Component. Work indexes real projects and original local previews; About and Contact are fully rendered on the server. This keeps data and noninteractive markup out of client bundles.
- **Copy:** \`v5-copy.ts\` contains both languages. Metadata is generated from each route's server page.
- **CSS:** \`portfolio-v5.css\` is the original experiment's foundation, \`portfolio-v5-refresh.css\` contains editorial styles for shared/detail screens, and \`portfolio-v5-immersive.css\` contains the one-screen experience and new accessibility overrides. **The legacy layers are retained to preserve the look of the existing detail pages**; any future consolidation must be followed by fresh visual regression testing.

## Rendering and performance

The visual effect uses four original iridescent implicit toroidal sculptures rendered via GLSL ES 3.00. The central region is empty for typography. No Three.js or external asset fetch is required.

The renderer:

- Limits drawing to about **24 FPS on precise pointers** and **18 FPS on coarse/touch pointers**.
- Caps the drawing buffer at **550,000 pixels** to avoid unconstrained high-DPI GPU work.
- Does **not schedule ongoing frames** when the user pauses, requests reduced motion, the tab is hidden, or the scene is outside the viewport.
- Rebuilds buffers/programs after \`webglcontextlost\` / \`webglcontextrestored\`.
- Responds to element resizing via \`ResizeObserver\`, with window-resize fallback.
- Keeps original CSS sculptures visible if WebGL initialization fails; content and navigation never depend on successful WebGL.

## Accessibility

- Proper heading structure, skip links that can focus the target, keyboard-operable navigation, visible focus rings and multilingual labels.
- Native \`<dialog>\` focus containment, keyboard Escape and restored trigger focus.
- Motion pause button with \`aria-pressed\` and translated label.
- \`prefers-reduced-motion\`, \`prefers-contrast: more\`, and \`forced-colors\` accommodations.
- Decorative scene elements marked as decorative, avoiding screen-reader noise.

## Testing

The QA script is **manual / on-demand**, not an always-running GitHub Action or Preview deployment. It uses existing dependencies (\`puppeteer-core\` and \`@sparticuz/chromium\`):

\`\`\`bash
PORTFOLIO_V5_BASE_URL=https://cart-shift.com pnpm qa:portfolio-v5

# Or with a local server
PORTFOLIO_V5_BASE_URL=http://localhost:3000 V5_QA_SCREENSHOTS=1 pnpm qa:portfolio-v5
\`\`\`

Checks English/Hebrew routes, 390px mobile and 1440px desktop, horizontal overflow, primary routes, accessible dialog/Escape/focus return, pause and resume, visible fallback if WebGL is unavailable, console errors and noindex. Screenshots are saved under \`tmp/portfolio-v5-qa\` when requested; this folder should remain untracked.

Always run focused ESLint, project type-check and production smoke checks before declaring a new version complete. A full visual review (including high-DPI devices, small landscape screens, and touch navigation) is still necessary; automated tests cannot judge all aesthetics.

## Deployment

Only deploy after branch checks; use one production deployment on \`main\`. Do not run unnecessary Preview builds. The code does not add analytics or user tracking.

## Career experience page

`experience/page.tsx` is a standalone, **server-rendered**, bilingual career narrative with an original dark editorial intro, detailed recent timeline, compact earlier career timeline, skill groups, education, languages, download CV link and contact CTA. It consumes `buildCVData()` using `messages/src/{en,he}/cv.json`; company names, role titles, date ranges and highlights are not duplicated or fabricated. Its styling is isolated in `portfolio-v5-experience.css`. The Experience route is linked in the modal navigation and from About, and keeps the experiment's noindex policy. The PDF points to the CV already produced by the normal build.
