---
name: CartShift Studio
description: Precision dark commerce-studio UI for agency portal and public surfaces
colors:
  primary: "#21759b"
  primary-deep: "#1a698c"
  accent: "#96bf48"
  accent-deep: "#87ac41"
  surface-900: "#0f172a"
  surface-850: "#172033"
  surface-800: "#1e293b"
  surface-50: "#f8fafc"
  background-light: "#f0f4f8"
  foreground-light: "#1e293b"
  foreground-dark: "#f8fafc"
  success: "#10b981"
  error: "#ef4444"
  warning: "#f59e0b"
typography:
  display:
    fontFamily: "var(--font-outfit), system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.75rem + 2.5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-outfit), system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.25rem + 1.25vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "var(--font-main), system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "var(--font-outfit), system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.04em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.surface-800}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  input-default:
    backgroundColor: "{colors.surface-850}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: CartShift Studio

## 1. Overview

**Creative North Star: "The Commerce Control Room"**

CartShift Studio looks like a studio floor for serious e-commerce work: dark, legible, bordered, and fast. Surfaces stack in tonal layers instead of decorative chrome. WordPress blue and Shopify green appear as expert signals, not as a rainbow SaaS palette. Motion confirms state changes; it never hides content behind choreography.

The system rejects template marketing aesthetics and generic admin dashboards. Portal density wins over campaign storytelling when the two conflict. Hebrew and English share one component language with locale-aware typography.

**Key Characteristics:**

- Dark-first portal with `surface-900` body and elevated `surface-850` cards
- High-contrast borders and restrained glass on overlays only
- CVA-driven components with semantic z-index and 44px touch targets on primary actions
- Outfit for EN display/UI labels; Rubik for HE via `--font-main`
- Framer Motion for layoutId transitions; reduced-motion fallbacks required

## 2. Colors

A committed dual-accent system on a cool slate foundation: platform expertise encoded in hue, not in decorative gradients.

### Primary

- **WordPress Channel Blue** (#21759b): Primary CTAs, links, focus rings, active nav. Gradient buttons run `primary-500` to `primary-600`.

### Secondary

- **Shopify Growth Green** (#96bf48): Secondary highlights, success-adjacent accents, brand gradient endpoints paired with primary blue.

### Neutral

- **Studio Night** (#0f172a): Default dark background (`surface-900`).
- **Elevated Panel** (#172033): Cards and sidebars (`surface-850`).
- **Ink Slate** (#1e293b): Light-mode body text and dark card surfaces (`surface-800`).
- **Cool Mist** (#f0f4f8): Light-mode page background.
- **Paper White** (#f8fafc): Light surfaces and dark-mode primary text.

### Named Rules

**The Platform Accent Rule.** Primary blue and accent green each have a job: blue drives action and navigation; green marks growth, secondary emphasis, or brand-gradient pairing. Never sprinkle both at full saturation on the same control without hierarchy.

**The Dark Default Rule.** Portal and authenticated surfaces default to dark `surface-900`. Light mode is supported but is not the identity anchor.

## 3. Typography

**Display Font:** Outfit (Latin), Rubik (Hebrew), with system-ui fallback  
**Body Font:** `--font-main` switches by `lang` attribute  
**Label Font:** Outfit semibold for buttons and compact UI chrome

**Character:** Geometric, confident, and readable at dashboard density. Display sizes use negative tracking sparingly; body stays neutral for long portal copy.

### Hierarchy

- **Display** (700, fluid-4xl/5xl clamp, 1.1): Marketing heroes and page titles only. Max clamp ceiling 4rem on marketing; avoid shouting past 6rem.
- **Headline** (600, fluid-2xl/3xl, 1.3): Section headers in portal and site.
- **Title** (600, fluid-lg/xl, 1.4): Card titles, modal headings, table section labels.
- **Body** (400, fluid-base, 1.6): Descriptions, form help, table cells. Cap line length at 65–75ch in prose blocks.
- **Label** (600, xs/sm, 0.04em tracking): Button text and compact badges. Uppercase only for badges ≤4 words, not body copy.

### Named Rules

**The Locale Font Rule.** Never hardcode Outfit on Hebrew surfaces. `--font-main` must follow `lang="he"` → Rubik, `lang="en"` → Outfit.

## 4. Elevation

Hybrid system: tonal layering is default; shadows appear on interactive lift (cards, primary buttons). Glass (`backdrop-blur-md`, `--glass-bg`) is reserved for overlays, glass buttons, and modal backdrops, not base page backgrounds.

### Shadow Vocabulary

- **Card default** (`0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`): Resting cards in light mode.
- **Card dark** (`0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15)`): Resting cards in dark mode.
- **Button primary** (inset highlight + primary-tinted spread): Primary gradient buttons at rest.
- **Glow accent** (accent-600 at 40%/20% opacity): Rare emphasis on featured actions, not default decoration.

### Named Rules

**The Flat-By-Default Rule.** Surfaces at rest use border + tonal step (`surface-850` on `surface-900`). Shadows signal hover, focus, or modal elevation only.

## 5. Components

Tactile, bordered, and stateful. Components use CVA variants from `components/ui/` and portal-specific extensions.

### Buttons

- **Shape:** Rounded-xl (12px), inline-flex, gap-2, semibold Outfit label
- **Primary:** Gradient `primary-500→600`, white text, `shadow-btn-primary`, shine-sweep on hover
- **Hover / Focus:** Lighten gradient top stop, deepen shadow, `focus-visible:ring-2 ring-primary-500`; active scale 0.97
- **Secondary / Ghost / Glass:** Surface fills with hairline borders; glass variant uses `backdrop-blur-md` and white/10 fills
- **Danger / Success:** Rose and emerald gradients with matching shadow tokens

### Cards / Containers

- **Corner Style:** xl (12px) default; 2xl on featured marketing panels
- **Background:** `surface-800` dark cards on `surface-900`; light cards use white / `surface-50`
- **Border:** `border-surface-700` dark, `border-surface-200` light; high-contrast hairlines over heavy fills
- **Internal Padding:** md (16px) compact portal; lg (24px) marketing sections

### Inputs / Fields

- **Style:** Rounded-lg, surface fill, 2px border on focus path
- **Focus:** Ring + border shift to primary-500; never glow-only focus
- **Error / Disabled:** `error` token border/text; 50% opacity disabled, no pointer events

### Navigation

- **Portal sidebar:** Fixed start edge, collapsible 280px / 80px (`--sidebar-width-*`), `z-sidebar`
- **Typography:** Title weight for section labels; muted `surface-400` icons
- **Active state:** Primary-tinted background or start border ≤1px only when structurally required

### Modal / Toast

- **Modal backdrop:** Blurred dark scrim, `z-modal`
- **Toasts:** Sonner at `z-toast`; semantic colors for success/error

## 6. Do's and Don'ts

### Do:

- **Do** use logical properties (`ms-*`, `pe-*`, `start-*`) for RTL parity on every new layout.
- **Do** route Firestore UI through TanStack Query hooks; toast async outcomes with Sonner.
- **Do** keep primary actions at `lg` size (48px height) on mobile-critical flows.
- **Do** use semantic z-index tokens (`dropdown`, `modal`, `toast`) from Tailwind config.
- **Do** preserve dark portal identity on authenticated routes even when marketing pages go lighter.

### Don't:

- **Don't** use generic SaaS landing clichés: cream hero backgrounds, gradient hero text, hero-metric stat blocks, identical icon-card grids, uppercase section eyebrows on every block.
- **Don't** use glassmorphism as wallpaper; blur is for overlays and deliberate glass buttons only.
- **Don't** use side-stripe borders (`border-s-start` >1px colored accents) on cards or alerts.
- **Don't** use numbered section markers (01/02/03) unless the section is a real ordered sequence.
- **Don't** ship chatty marketing voice or buzzwords inside portal UI copy.
- **Don't** break Hebrew layouts with physical `ml-*` / `left-*` utilities.
- **Don't** gate content visibility on entrance animations; defaults must render without JS motion.
