# Liquid Loom Landing Page

## Product & Design Specification

**Status:** Approved planning direction  
**Initial route:** `/en/liquid-loom`  
**Product:** Liquid Loom  
**Parent brand:** CartShift Studio

---

## 1. Purpose

The Liquid Loom landing page should introduce Liquid Loom as a serious open-source developer product for Shopify theme engineering.

The page must make the product understandable quickly without requiring visitors to already understand its architecture.

The landing page should communicate three ideas above everything else:

> **Start with the Shopify theme you already have.**
>
> **Make its engineering safer and easier to understand.**
>
> **Keep shipping normal Shopify.**

Liquid Loom must not appear to compete with Shopify or replace Shopify's development ecosystem. It should be positioned as an engineering layer around normal Shopify theme development that makes larger, real-world themes easier and safer to maintain.

---

## 2. Primary positioning

### Core positioning

**Liquid Loom is the safe engineering layer for real-world Shopify themes.**

Its value comes from the combination of:

- incremental adoption
- feature-oriented source organization
- deterministic output ownership
- safe migrations
- transactional builds
- project intelligence
- compatibility with normal Shopify workflows

Liquid Loom should **not** primarily be marketed as:

- a Tailwind framework
- a Vite framework
- an AI framework
- a replacement for Shopify CLI
- a replacement for Liquid
- a new Shopify runtime
- a headless storefront framework

Those technologies and workflows can integrate with Liquid Loom, but they are not its identity.

---

## 3. Primary audience

The page is primarily for:

- Shopify theme developers
- senior frontend developers working with Shopify
- Shopify agencies
- technical teams maintaining custom storefront themes
- developers inheriting legacy Shopify themes
- teams using coding agents on larger Shopify repositories

Secondary audiences include technical founders, engineering leads, and freelancers maintaining multiple Shopify projects.

This is not primarily a merchant-facing page.

---

## 4. Main user questions

The page should answer these questions in roughly this order:

1. What is Liquid Loom?
2. Do I have to rebuild or migrate my theme?
3. Why would I use this instead of only Shopify's standard directory structure?
4. What engineering problems does it actually solve?
5. Does it replace Shopify CLI?
6. Does it change my storefront runtime?
7. Can developers and coding agents understand the project better?
8. Is this mature and trustworthy enough to use?
9. How do I try it?

---

## 5. Conversion goal

The primary conversion is not a sales call. It is installation in an existing theme:

```bash
npx liquid-loom@latest init
```

The visitor should leave the page feeling comfortable trying Liquid Loom inside an existing Shopify theme.

### Primary CTA

**Get started** or a direct **Copy install command** interaction.

### Secondary CTA

**View on GitHub**

### Tertiary CTA

**Read the docs**

---

## 6. Page architecture

The page should contain seven major narrative movements, followed by FAQ and the final CTA:

```text
HEADER
  ↓
HERO
  ↓
START WHERE YOU ARE
  ↓
SOURCE → OWNERSHIP → SHOPIFY
  ↓
THREE ENGINEERING GUARANTEES
  ↓
UNDERSTAND BEFORE EDITING
  ↓
SHOPIFY UNDERNEATH, ALWAYS
  ↓
TRUST + OPEN SOURCE
  ↓
FAQ
  ↓
FINAL CTA
```

The page should feel focused and deliberate rather than extremely long.

Every section must do at least one of the following:

- reduce adoption anxiety
- explain the product
- establish differentiation
- establish trust
- encourage installation

If a section does none of these, it should not exist.

---

## 7. Header

Liquid Loom should behave visually as its own developer product even though the page initially lives inside CartShift.

Recommended structure:

```text
LIQUID LOOM

Why Liquid Loom
How it works
Docs

GitHub ↗
Get started

by CartShift
```

A subtle secondary navigation option can provide:

```text
← CartShift Studio
```

The normal CartShift merchant-oriented navigation should not dominate this page. This should feel like a Liquid Loom microsite hosted on the CartShift domain.

---

## 8. Hero

### Eyebrow

```text
OPEN SOURCE ENGINEERING FOR SHOPIFY THEMES
```

### Primary headline

# Modernize your Shopify theme.
# Without rebuilding it.

### Supporting copy

Bring structure, safer builds and predictable tooling to the Shopify theme you already have. Adopt Liquid Loom gradually and keep shipping standard Shopify.

### Primary command

```bash
npx liquid-loom@latest init
```

Include a clear copy interaction.

### CTAs

```text
[ Get started ]     View on GitHub ↗
```

### Trust line

```text
No rewrite · No custom runtime · MIT licensed
```

---

## 9. Hero visualization

The hero should not use a generic dashboard or fake terminal screenshot. The architecture itself should become the illustration.

```text
EXISTING THEME              ORGANIZED SOURCE

sections/                   src/theme/
snippets/                      product/
assets/                           upsell.liquid
    │                               │
    ╰─────────────╮   ╭─────────────╯
                  ↓   ↓
               OWNERSHIP
                   ↓
                VALIDATE
                   ↓
                  BUILD
                   ↓
              dist/theme
                   ↓
                SHOPIFY
```

Subtle animated paths should flow through this system. These paths form the foundation of the Liquid Loom visual identity.

---

## 10. Start where you are

### Objective

Remove the biggest adoption concern immediately: **Do I need to restructure my entire theme?**

The answer should be obviously **no**.

### Headline

# Your theme doesn't need another rewrite.

### Before

```text
my-theme/
├── assets/
├── blocks/
├── layout/
├── sections/
├── snippets/
└── templates/
```

### Action

```bash
npx liquid-loom@latest init
```

### After

```text
my-theme/
├── assets/
├── blocks/
├── layout/
├── sections/
├── snippets/
├── templates/
│
└── src/
    └── theme/
        └── sections/
            └── product/
                └── upsell.liquid
```

### Core message

**Keep existing code exactly where it is.**

Organize new work with Liquid Loom. Move existing code only when doing so becomes useful.

Liquid Loom should feel incremental rather than invasive.

---

## 11. Why Liquid Loom exists

Only after removing adoption fear should the page explain the architectural problem.

### Headline

# Shopify's structure is a great deployment format.
# It doesn't have to be your source architecture.

Shopify's canonical directories are part of its runtime and deployment contract. Liquid Loom allows authored source to follow a structure that better reflects the product's actual features while still producing standard Shopify output.

---

## 12. Signature product visualization

This should become the central visual interaction of the page.

```text
src/theme/sections/product/gallery.liquid
                         │
src/theme/sections/product/upsell.liquid
                         │
src/theme/snippets/product/price.liquid
                         │
                         ↓
                  ┌─────────────┐
                  │ LIQUID LOOM │
                  │             │
                  │ ownership   │
                  │ validation  │
                  │ build       │
                  └─────────────┘
                         ↓
                 STANDARD SHOPIFY

sections/gallery.liquid
sections/upsell.liquid
snippets/price.liquid
```

As the user scrolls, files should visually flow into Liquid Loom and emerge in their canonical Shopify destinations.

This interaction should explain the product while simultaneously establishing its visual brand.

---

## 13. Core visual metaphor: the loom

The word “Loom” should influence the design without becoming literal.

Do **not** use:

- yarn illustrations
- fabric textures
- sewing imagery
- literal weaving machines

Instead, represent the loom concept through information paths.

A thread can represent:

- source
- ownership
- dependency
- migration
- generated output

### Normal path

```text
source ─────────────── output
```

### Validated path

```text
source ─── mint ─── validated output
```

### Collision

```text
source A ───╮
            ├── coral conflict
source B ───╯
```

### Migration

```text
old source ─────────→ new ownership
```

This should become a recognizable Liquid Loom visual language.

---

## 14. Three engineering guarantees

Avoid a large feature-card grid. Communicate three memorable engineering guarantees instead.

### 14.1 Every output has one owner

```text
sections/hero.liquid ──────╮
                           ├── ✕
src/.../hero.liquid ───────╯

OUTPUT OWNERSHIP CONFLICT
```

Liquid Loom refuses ambiguous output instead of silently choosing whichever file happens to win.

### 14.2 Failed builds don't replace good builds

```text
SOURCE
  ↓
STAGING
  ↓
VALIDATE ───── ✕
               │
               ╰── Previous output remains

VALIDATE ✓
  ↓
ATOMIC PROMOTION
```

Builds happen in isolation. Invalid output never replaces the last known good theme.

### 14.3 Migration is explicit

Preview:

```bash
liquid-loom migrate sections/hero.liquid
```

Apply:

```bash
liquid-loom migrate sections/hero.liquid --apply
```

Migration should be intentional, inspectable, and reversible through normal source control. Liquid Loom does not silently reorganize an existing theme.

---

## 15. Understand before editing

### Headline

# Understand the theme before changing it.

Introduce:

```bash
liquid-loom explain product
```

Example visualization:

```text
PRODUCT

sections/main-product.liquid
│
├── blocks/product-title.liquid
├── blocks/product-price.liquid
├── blocks/product-purchase.liquid
│
└── snippets/product-price.liquid
```

Then introduce structured output:

```bash
liquid-loom explain product --json
```

---

## 16. Developers and coding agents

This section should avoid turning Liquid Loom into an “AI product.” AI is an important consumer of deterministic project information, not the identity of the framework.

### For developers

Understand:

- where a feature lives
- which source owns an output
- static relationships between theme components
- unresolved references
- architectural boundaries

### For coding agents

Expose deterministic project data instead of forcing agents to infer architecture from filenames and directory conventions.

### Messaging principle

> **Give coding agents facts, not guesses.**

Liquid Loom should remain useful even if no coding agent is involved.

---

## 17. Liquid Loom and Shopify CLI

This section should proactively answer a common misunderstanding.

### Headline

# Works with Shopify.
# Not instead of Shopify.

| Capability | Shopify CLI | Liquid Loom |
| --- | ---: | ---: |
| Develop against Shopify | ✓ | Uses Shopify CLI |
| Preview and push themes | ✓ | Uses Shopify CLI |
| Organize authored source by feature |  | ✓ |
| Existing + organized source together |  | ✓ |
| Output ownership validation |  | ✓ |
| Transactional build promotion |  | ✓ |
| Safe source migration |  | ✓ |
| Project architecture queries |  | ✓ |
| Custom storefront runtime | No | No |

### Key sentence

**Liquid Loom doesn't compete with Shopify CLI. It prepares and protects the theme that Shopify CLI runs.**

---

## 18. Shopify underneath, always

### Headline

# Shopify underneath.
# Always.

Display Shopify-native concepts prominently:

```text
Liquid                ✓
Theme Editor           ✓
Theme blocks           ✓
App blocks             ✓
Shopify CLI            ✓
Theme Check            ✓
Standard theme output  ✓
```

Liquid Loom does not introduce a custom storefront runtime. The deployable output remains a conventional Shopify theme.

---

## 19. Tooling philosophy

Vite and Tailwind should no longer dominate Liquid Loom's marketing.

```text
DEFAULT
Shopify-native assets

OPTIONAL
Vite

OPTIONAL
Tailwind
```

Supporting message:

> Use modern tooling when it solves a real problem. Liquid Loom does not require it to justify its architecture.

Vite and Tailwind are integrations, not Liquid Loom's foundation or long-term moat.

---

## 20. Technical trust

Liquid Loom is an engineering product, so proof should be technical rather than promotional.

Where appropriate, display current validated support such as:

```text
Linux      ✓
macOS      ✓
Windows    ✓

Node 22    ✓
Node 24    ✓

Theme Check        ✓
CodeQL             ✓
Dependency Review  ✓
CI                 ✓
```

Technical trust can appear relatively early in the page as a compact credibility strip.

Do not rely on fake social proof. Do not fabricate testimonials. Do not emphasize GitHub stars or npm downloads until those numbers are genuinely useful trust signals.

---

## 21. Open source

### Headline

# Built in the open.

Include:

```text
MIT licensed
npm package
GitHub repository
Public documentation
```

Primary actions:

- View on GitHub
- View npm package
- Read documentation

If meaningful real-time project metrics eventually become strong enough, they can be added later.

---

## 22. CartShift attribution

Liquid Loom should feel independent while still benefiting from CartShift credibility.

Recommended near the bottom:

```text
LIQUID LOOM

An open-source project by CartShift Studio.

Built from real-world Shopify theme engineering
and the problems that appear once themes stop
being small.
```

Optionally include:

```text
Created by Yotam Faraggi
```

The page should not become a personal portfolio page, but clear creator ownership is positive for an open-source project.

---

## 23. FAQ

The FAQ should remain small and focused on serious objections.

### Does Liquid Loom replace Shopify CLI?

No. Liquid Loom works around Shopify's normal theme tooling and uses Shopify CLI for development and deployment workflows.

### Do I need to migrate my existing theme?

No. Liquid Loom can be adopted without moving existing Shopify source.

### Does Liquid Loom change the Shopify storefront runtime?

No. It produces a conventional Shopify theme.

### Are Vite and Tailwind required?

No. Shopify-native assets are the default. Vite and Tailwind are optional integrations.

### Can coding agents use Liquid Loom?

Yes. Liquid Loom can expose deterministic project and ownership information in machine-readable form.

### Is Liquid Loom for headless Shopify?

No. Liquid Loom is designed for Shopify Liquid themes.

---

## 24. Final CTA

The closing section should be extremely simple.

```text
Try Liquid Loom
on the theme you already have.

$ npx liquid-loom@latest init

[ Copy command ]

Get started        GitHub ↗

Open source · MIT
```

The main visual thread introduced earlier in the page can continue through the layout and terminate at this command, giving the page a visual beginning and end.

---

## 25. Visual identity

Liquid Loom already has a strong core palette.

| Role | Value |
| --- | --- |
| Main background | `#0B0F14` |
| Primary foreground | `#F4F0E6` |
| Liquid Loom mint | `#4DE3C1` |
| Conflict/error coral | `#FF6B5E` |
| Structural borders | `#25303A` |
| Secondary text | `#7D8994` |

### Typography

**Headings:** large geometric or neo-grotesque sans-serif. Prefer an existing CartShift-compatible variable font where possible; Geist or Inter are appropriate references.

**Body:** highly readable sans-serif.

**Technical content:** clean monospace such as Geist Mono or the existing system monospace stack.

Monospace typography should be reserved for actual technical concepts rather than used everywhere.

---

## 26. Layout principles

The page should feel:

- spacious
- architectural
- precise
- technical
- calm
- premium

Avoid excessive card layouts.

Prefer:

- large editorial typography
- diagrams
- connected paths
- direct comparisons
- structured code
- negative space

Sections should feel like chapters rather than collections of components.

---

## 27. Motion principles

Animation must explain the product.

Use motion for:

- source paths flowing into output
- ownership resolution
- collision detection
- migration
- build promotion
- progressive architectural reveal

Avoid motion that exists purely as decoration.

Respect `prefers-reduced-motion`. Every animated concept must remain understandable without animation.

---

## 28. Responsive behavior

The experience must remain strong on mobile. Desktop architecture diagrams cannot simply shrink.

On narrow layouts, horizontal diagrams should become vertical flows:

```text
SOURCE
  ↓
OWNERSHIP
  ↓
VALIDATION
  ↓
OUTPUT
```

Additional requirements:

- command blocks remain easily copyable
- navigation remains minimal
- no important explanation depends solely on hover
- diagram labels remain readable without horizontal page scrolling

---

## 29. Accessibility

The landing page should meet a high accessibility standard.

Requirements include:

- semantic heading hierarchy
- keyboard accessibility
- visible focus states
- sufficient color contrast
- reduced-motion support
- meaningful diagram labels
- no information communicated by color alone
- accessible copy buttons
- proper code semantics
- descriptive link labels

Technical polish includes accessibility rather than treating it as a later pass.

---

## 30. SEO strategy

Primary topic cluster:

- Shopify theme development
- Shopify theme tooling
- Shopify Liquid development
- Shopify theme architecture
- Shopify developer framework
- Shopify theme build tools

Suggested page title:

```text
Liquid Loom — Modern Engineering for Shopify Themes
```

Suggested meta description:

```text
Modernize existing Shopify themes with structured source, deterministic ownership,
safe migrations and transactional builds while keeping standard Shopify output.
```

The focused FAQ can also support long-tail discoverability and structured FAQ content where appropriate.

---

## 31. Things we explicitly avoid

Do not use:

- generic gradient blobs
- excessive glassmorphism
- dozens of tiny feature cards
- fake testimonials
- meaningless performance claims
- “blazingly fast” language
- forced AI messaging
- random VS Code screenshots
- exaggerated npm/GitHub metrics
- Shopify-green imitation branding
- literal loom/fabric illustrations
- a merchant-focused CartShift sales funnel
- Vite or Tailwind as the headline value proposition

---

## 32. Success criteria

The page succeeds if a Shopify developer can answer the following quickly.

### Within ~10 seconds

**What is it?**

A safer engineering layer for Shopify themes.

### Within ~20 seconds

**Will it force me to rewrite my theme?**

No.

### Within ~45 seconds

**Why isn't Shopify CLI enough?**

Shopify CLI handles Shopify development and deployment. Liquid Loom adds source organization, ownership guarantees, safe builds, migration tooling, and project intelligence around it.

### Within ~90 seconds

**What makes it trustworthy?**

It preserves Shopify's runtime model, produces conventional output, explicitly validates ownership, protects good builds, supports incremental adoption, and is open source.

### Final action

The developer copies:

```bash
npx liquid-loom@latest init
```

---

## 33. Core product narrative

The entire page should communicate one continuous story:

```text
You already have a Shopify theme.

↓

You do not need to rebuild it.

↓

Liquid Loom can sit around what already exists.

↓

New source can be organized around your product.

↓

Every Shopify output has explicit ownership.

↓

Builds are validated before publication.

↓

Migration happens only when you choose it.

↓

Developers and coding tools can understand
the project before editing it.

↓

Shopify remains Shopify.

↓

Try Liquid Loom on the theme you already have.
```

---

## 34. Implementation principles

When implementation begins:

1. Reuse CartShift primitives only where they support the Liquid Loom identity; do not inherit the normal merchant-site shell blindly.
2. Keep the page under the existing locale architecture so `/en/liquid-loom` can coexist cleanly with the rest of the site and future localization remains possible.
3. Build diagrams from accessible HTML/CSS/SVG primitives rather than raster screenshots.
4. Treat motion as progressive enhancement and make every state understandable without JavaScript animation.
5. Keep all CTA destinations and package/repository metadata in centralized configuration rather than repeating URLs across components.
6. Prefer reusable Liquid Loom-specific primitives for code blocks, threads, pipeline nodes, and technical badges so the visual language stays coherent.
7. Measure page weight carefully; the visual centerpiece should not compromise Core Web Vitals.
8. Do not surface live GitHub/npm numbers until they are useful and fetched in a way that cannot destabilize page rendering.
9. Validate all product claims against the current Liquid Loom repository before launch.
10. Preserve the page's microsite identity while making CartShift authorship clear and accessible.

---

## 35. Final principle

The landing page should mirror Liquid Loom's product philosophy.

It should not feel flashy because it is trying to compensate for complexity. It should feel beautiful because the architecture itself is clear.

**Liquid Loom should come across as conservative where safety matters, modern where developer experience matters, and invisible where Shopify itself already provides the right abstraction.**
