# Portfolio V5 — Quality record

## 2026-10-20 production-hardening branch

**Scope:** `feat/portfolio-v5-production-hardening`. Quality here means behavior and maintainability, not a claim of pixel-perfect reproduction of the reference site.

### Source-backed issues addressed

| Area | Earlier behavior | Hardening |
|---|---|---|
| GPU lifecycle | Continuous RAF checks while paused/hidden; context restoration incomplete | Event-aware frame scheduling; restoration and resource cleanup |
| GPU budget | Full-resolution canvas could exceed practical pixel budget | 550k-pixel cap and lower coarse-pointer frame rate |
| Performance | Ray marching across empty center | Shader exits early in the clear headline region |
| Accessibility | Custom focus trap did not make outside content inert | Native modal `dialog`, Escape, focus return |
| Responsive | Window-only canvas resize | Element resize observer + window fallback |
| Language | Motion label always English | Localized visible motion control |
| Payload | Detail pages shipped as Client Components | Server-rendered detail pages |
| Contrast | Thin outline type in all display modes | Stronger contrast and forced-colors styles |
| Regression | No runnable browser gate | On-demand `pnpm qa:portfolio-v5` script |

### Tests performed

- Translations merged and validated in an isolated checkout.
- Focused ESLint: **0 errors**; one ref cleanup warning fixed in the follow-up commit.
- TypeScript after translation merge: **no Portfolio V5 diagnostics**, but one pre-existing error remains in `components/sections/CaseStudiesTeaser.tsx`. The bare sandbox cannot run the full prebuild because private Firebase environment variables are unavailable. Production's own configured build is authoritative for final deploy checks.
- WebGL shader compilation and interactive home/route checks had previously passed on the live pre-hardening V5 version; this is historical evidence and **must not be counted as post-change verification**.

### Release gate

- [ ] Production build and TypeScript compilation
- [ ] Production route smoke test in English and Hebrew
- [ ] Native dialog/Escape/focus return in Chromium
- [ ] Motion button and visible CSS/WebGL art
- [ ] Desktop/mobile overflow checks
- [ ] Browser console free of uncaught page errors
- [ ] High-contrast and forced-colors manual visual review
- [ ] Actual before/after visual comparison

**Result: pending release verification.** A passing build and smoke tests do not alone establish visual parity or universal device performance.
