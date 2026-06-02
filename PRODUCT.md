# Product

## Register

product

## Users

**Agency staff** run day-to-day operations: client onboarding, workboard management, consultations, billing, and agency settings including white-label branding.

**Client org users** track service requests, review deliverables, approve work, and manage their relationship with the agency through org-scoped dashboards.

**Prospects and leads** interact primarily with the public site (EN/HE) to understand services, read the blog, view portfolio work, and book consultations before entering the portal.

Context: bilingual (English and Hebrew with full RTL), often on desktop during work hours for portal tasks; mixed devices on the marketing site.

## Product Purpose

CartShift Studio is an agency operating system plus public presence for a Shopify and WordPress e-commerce development agency. It unifies lead generation, client collaboration, project tracking, and billing in one branded experience.

Success means agency staff move work forward with less friction, clients self-serve status and requests without email back-and-forth, and the public site converts qualified store owners into consultations and retained engagements. The interface should signal expert craft: precise, fast, and trustworthy for high-stakes commerce projects.

## Brand Personality

**Precision. Confidence. Momentum.**

Voice is direct and expert, not salesy. The UI feels avant-garde and tool-native: dark surfaces, high-contrast borders, restrained glass, smooth motion. Typography and layout carry authority; color accents (WordPress blue, Shopify green) tie to the agency's platform expertise without becoming generic SaaS chrome.

Emotional goal: clients and staff feel they are inside a serious studio, not a template dashboard.

## Anti-references

- Generic SaaS landing pages: cream body backgrounds, gradient hero text, hero-metric stat blocks, identical icon-card grids, uppercase section eyebrows on every block.
- Over-decorated glassmorphism used as wallpaper rather than purposeful depth.
- Chatty marketing copy, buzzwords, or aphoristic short-sentence rhythm in product UI.
- Light-mode-only admin patterns that ignore the established dark portal aesthetic.
- Layouts that break in RTL or treat Hebrew as an afterthought.
- AI-slop scaffolds: numbered section markers (01/02/03) without real sequence meaning, side-stripe accent borders, decorative gradient text.

## Design Principles

1. **Design serves the workflow.** Every screen optimizes the next action on a workboard, request, or client task; decoration never competes with status, deadlines, or approvals.
2. **One system, two surfaces.** Marketing and portal share tokens and components, but portal density and data hierarchy take precedence over campaign-style storytelling.
3. **Show state, not story.** Prefer clear status, timestamps, and actionable empty states over explanatory prose.
4. **Bilingual by default.** Logical properties, mirrored layouts, and locale-aware typography (Outfit EN, Rubik HE) are non-negotiable.
5. **Motion with purpose.** Framer Motion for meaningful transitions (layoutId, panel open/close); respect `prefers-reduced-motion`.
6. **Practice what you preach.** The product UI should demonstrate the same e-commerce UX standards CartShift sells: performance, accessibility, and conversion clarity.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for text contrast, focus visibility, and interactive targets; dark-mode token adjustments already aim for 4.5:1 on primary text.
- Full **keyboard navigability** and ARIA patterns on portal components (modals, dropdowns, tables, forms).
- **RTL parity** for Hebrew: spacing, alignment, and icon direction must mirror LTR behavior.
- Honor **`prefers-reduced-motion`**: replace motion with instant state changes or subtle opacity crossfades.
- Form errors and async feedback via **sonner toasts** plus inline validation; never color alone for status.
