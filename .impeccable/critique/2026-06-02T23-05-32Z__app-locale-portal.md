---
target: portal
total_score: 34
p0_count: 0
p1_count: 0
p2_count: 2
timestamp: 2026-06-02T23-05-32Z
slug: app-locale-portal
---
# Portal Design Critique (Third Run)

Target: `app/[locale]/portal` + `components/portal` (authenticated shell, agency workspace, client workspace, auth)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons, Sonner toasts, workboard drag overlay, command palette feedback |
| 2 | Match System / Real World | 3 | Agency/commerce vocabulary; bilingual auth and empty states |
| 3 | User Control and Freedom | 3 | Skippable onboarding; collapsible dashboard secondary panel; Esc on palettes |
| 4 | Consistency and Standards | 4 | Single portal CSS layer; dark sidebar; unified onboarding/tips styling |
| 5 | Error Prevention | 3 | Zod + inline validation; destructive confirmations on workboard |
| 6 | Recognition Rather Than Recall | 4 | Expanded group headings; collapsed micro-labels + abbrevs + tooltips |
| 7 | Flexibility and Efficiency | 3 | Cmd/Ctrl+K palette, bulk workboard, shortcuts documented in Help |
| 8 | Aesthetic and Minimalist Design | 4 | Route fade-ins removed; quieter empty/tips states; dashboard distilled |
| 9 | Error Recovery | 3 | Dashboard retry; plain-language auth errors |
| 10 | Help and Documentation | 4 | In-portal Help page with search, role-aware guides, keyboard reference |
| **Total** | | **34/40** | **Good (upper band) — prior P1/P2 issues resolved; only polish gaps remain** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a bespoke agency OS, not template AI slop. Residual tells are minor: login gradient CTA (on-brand), glass header on light content area, and static help articles rather than deep linked docs.

**Deterministic scan:** `detect.mjs` on `app/[locale]/portal` + `components/portal` returned **0 findings** (exit 0).

**Browser visualization:** Inspected `http://localhost:3000/en/portal/login` (390×844 mobile) and `/en/portal/help` route metadata. Help briefly mounts then auth redirects to login without session. Detect overlay injection not run (browser MCP limitation); CLI scan is the deterministic layer.

## Overall Impression

The portal crossed from "acceptable foundation" (26/40) through "good" (30/40) to **upper-band good (34/40)**. Navigation IA, dashboard density, help discoverability, motion noise, and i18n gaps from the original critique are addressed. What remains is authenticated visual QA and micro-accessibility polish—not structural UX debt.

## What's Working

1. **Help stays in the shell.** Role-aware `/help/` and `/agency/help/` with searchable guides, documented shortcuts, and sidebar + command palette entry—no marketing-page context switch.
2. **Collapsed nav is usable.** 10px two-line labels, group abbreviations with dividers, and tooltips reduce icon-only recall burden.
3. **Visual noise is down.** No per-route fade-in wrappers; TipsCard and onboarding icons use the same restrained primary/surface language as the rest of the shell.

## Priority Issues

### [P2] Authenticated surfaces not browser-verified this run
- **Why it matters:** Sidebar groups, dashboard hierarchy, and Help content layout were validated in code but not visually confirmed with a live session.
- **Fix:** QA pass with authenticated cookies on dashboard, collapsed sidebar, and Help search.
- **Suggested command:** `/impeccable critique portal` (after login)

### [P2] Collapsed group abbreviations still 9px
- **Why it matters:** Improved from icon-only, but `.portal-nav-group-abbrev` at 9px may still strain low-vision users at 200% zoom.
- **Fix:** Match section-title scale (10px) or show abbrev only on `:focus-within` of the group.
- **Suggested command:** `/impeccable harden portal sidebar`

### [P3] Agency expanded nav remains long
- **Why it matters:** Group headings help scan, but power users still scroll 10+ items; mobile bottom nav only covers four destinations.
- **Fix:** "More" sheet pattern for infrequent agency routes or role-based default collapse.
- **Suggested command:** `/impeccable layout portal navigation`

## Persona Red Flags

**Alex (Power User):** Shortcuts now documented on Help page and command palette footer. Minor friction: no persistent shortcut hint in header chrome; agency mobile still tab-switches workboard columns.

**Jordan (First-Timer):** Login labeled and thumb-friendly. Improved: in-portal Help, anchored onboarding, nav group labels. Residual: agency expanded list still intimidating on first day.

**Sam (Accessibility):** Auth inputs labeled; help mailto is clear. Red flags: 9px group abbrevs; some toolbar controls may still use sub-44px hit targets on dense agency pages.

**Agency Operator (project-specific):** Dark grouped sidebar reduces scan cost. Collapsed abbreviations (`Ops`, `Clients`) help cluster recall without expanded headings.

## Minor Observations

- Help topics are static JSON—not deep-linked to live UI states.
- Login card gradient CTA is intentional brand expression, not slop.
- `portal-content-reveal` (0.2s) is the only remaining global enter motion—appropriate.

## Questions to Consider

- Should Help topics deep-link into the routes they describe (e.g. "Open Workboard")?
- Would a header `?` icon beside notifications beat footer-only Help discovery?
- Is 34/40 the ceiling without shortening agency nav, or is authenticated QA the last unlock?
