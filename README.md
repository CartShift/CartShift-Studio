<p align="center">
  <img src="https://raw.githubusercontent.com/CartShift/CartShift-Studio/main/docs/assets/readme/icon.png" alt="CartShift Studio" width="80" />
</p>

<h1 align="center">CartShift Studio</h1>

<p align="center">
  <strong>Production e-commerce product platform</strong> — marketing site, free store analyzer, and multi-role agency/client portal in one codebase.
</p>

<p align="center">
  <a href="https://cart-shift.com/en"><img src="https://img.shields.io/badge/Live-cart--shift.com-21759b?style=for-the-badge" alt="Live site" /></a>
  <a href="https://cart-shift.com/en/cv"><img src="https://img.shields.io/badge/CV_%26_Portfolio-View-96bf48?style=for-the-badge" alt="CV" /></a>
  <a href="https://github.com/CartShift/CartShift-Studio/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CartShift/CartShift-Studio/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white" alt="CI status" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Functions-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/i18n-EN%20%2B%20HE%20(RTL)-0A7EA4" alt="i18n" />
  <img src="https://img.shields.io/badge/Vercel-Production-000000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://cart-shift.com/en">Live Product</a> ·
  <a href="https://cart-shift.com/en/tools/store-analyzer">Store Analyzer</a> ·
  <a href="https://cart-shift.com/en/cv">CV & Portfolio</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/CartShift/CartShift-Studio/main/docs/assets/readme/hero-en.jpg" alt="CartShift Studio marketing homepage" width="100%" />
</p>

## Why this project exists

CartShift Studio is a real production system for an independent e-commerce studio — not a tutorial app.

It connects three surfaces that usually live in separate tools:

| Surface | What it does |
| --- | --- |
| **Public website** | Conversion-focused marketing, case studies, blog, bilingual EN/HE with full RTL |
| **Store Analyzer** | Free diagnostic that audits performance, SEO, accessibility, cart/checkout, AI readiness, and competitors |
| **Agency / client portal** | Multi-role workspace for consultations, requests, workboards, billing, invites, and file sharing |

Built end-to-end by [Yotam Faraggi](https://github.com/yotamon) — product direction, UX, frontend, backend, Firebase rules, CI, SEO, and deployment.

## Highlights recruiters care about

- **Full-stack product ownership** — App Router, Firebase Auth/Firestore/Storage/Functions, Vercel production
- **Real product complexity** — org/agency roles, session cookies, security rules, PayPal billing, email workflows
- **Engineering craft** — TypeScript strict, CVA design system, TanStack Query hooks, optimistic updates, Vitest + CI
- **Internationalization done properly** — `next-intl`, logical CSS (`ms-*` / `ps-*` / `start-*`), Hebrew RTL
- **Growth engineering** — SEO metadata/schema, store analyzer lead funnel, LinkedIn publishing tooling
- **Ship discipline** — GitHub Actions CI (lint → test → build), env validation, translation merge pipeline

## Product tour

### Marketing site (EN + HE / RTL)

Dark, conversion-led public site with services, work, blog, and CTAs into the analyzer and portal.

<p align="center">
  <img src="https://raw.githubusercontent.com/CartShift/CartShift-Studio/main/docs/assets/readme/website-en-dark.jpg" alt="English marketing site" width="48%" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/CartShift/CartShift-Studio/main/docs/assets/readme/website-he-dark.jpg" alt="Hebrew RTL marketing site" width="48%" />
</p>

### Free Store Analyzer

Instant e-commerce audit covering Core Web Vitals, SEO, accessibility, best practices, cart actionability, structured data / AI readiness, screenshots (Puppeteer), and competitor context.

<p align="center">
  <img src="https://raw.githubusercontent.com/CartShift/CartShift-Studio/main/docs/assets/readme/store-analyzer.jpg" alt="Store Analyzer tool" width="100%" />
</p>

**Try it:** [cart-shift.com/en/tools/store-analyzer](https://cart-shift.com/en/tools/store-analyzer)

### Client & agency portal

Authenticated multi-tenant workspace:

- Agency: clients, consultations, workboards, testimonials, pricing
- Client orgs: requests, attachments, notifications, billing
- Shared: invites, onboarding tour, command palette, role-aware navigation

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 (App Router)                 │
│  app/[locale]/(website) · portal · API routes · RSC/SSR     │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
     ┌──────────▼──────────┐       ┌──────────▼──────────┐
     │  TanStack Query     │       │  Firebase            │
     │  custom hooks       │       │  Auth · Firestore    │
     │  optimistic UI      │       │  Storage · Functions │
     └─────────────────────┘       └─────────────────────┘
                │                             │
     ┌──────────▼──────────┐       ┌──────────▼──────────┐
     │  Design system      │       │  Integrations        │
     │  CVA · Motion · RTL │       │  PayPal · Email ·    │
     │  next-intl EN/HE    │       │  PageSpeed · Puppeteer│
     └─────────────────────┘       └─────────────────────┘
```

### Repository map

```text
app/[locale]/          # Website + portal + locale routing
components/            # Design system, sections, portal UI
lib/hooks/             # TanStack Query + Firestore (SSOT for data)
lib/services/          # Domain services
functions/             # Firebase Cloud Functions
messages/src/          # Translation sources (never edit generated JSON)
tests/                 # Vitest unit / integration coverage
.github/workflows/     # CI: lint, test, build
```

## Tech stack

| Layer | Choices |
| --- | --- |
| Framework | Next.js 16, React, TypeScript (strict) |
| Server state | TanStack Query v5 |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions |
| UI | Tailwind CSS, CVA, Radix, Framer Motion, Sonner |
| Forms | React Hook Form + Zod |
| i18n | next-intl (English + Hebrew RTL) |
| Analyzer | PageSpeed Insights API, Puppeteer / Chromium |
| Quality | ESLint, Prettier, Vitest, GitHub Actions |
| Hosting | Vercel (web) + Firebase (backend) |

## Getting started

### Prerequisites

- Node.js **24.x** (see `.nvmrc`)
- [pnpm](https://pnpm.io/)
- Firebase CLI (`npm i -g firebase-tools`) for functions / rules

### Setup

```bash
pnpm install
cd functions && pnpm install && cd ..
cp .env.example .env.local   # fill Firebase + API values
pnpm dev                     # web + translation watcher
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
| --- | --- |
| `pnpm dev:full` | Web + Firebase Functions emulator |
| `pnpm lint` | ESLint + TypeScript |
| `pnpm test:run` | Vitest |
| `pnpm build` | Production build |
| `pnpm i18n:merge` | Regenerate locale bundles from `messages/src/` |

> **Translations:** edit `messages/src/{locale}/*.json` only. Generated `messages/en.json` / `messages/he.json` are rebuilt by `i18n:merge` (also on `predev` / `prebuild`).

## Documentation

| Doc | Topic |
| --- | --- |
| [SECURITY.md](./SECURITY.md) | Vulnerability reporting & production checklist |
| [messages/README.md](./messages/README.md) | i18n source → merge workflow |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deploy guide |
| [docs/STORE_ANALYZER_SETUP.md](./docs/STORE_ANALYZER_SETUP.md) | Analyzer setup & diagnostics |
| [docs/TESTING.md](./docs/TESTING.md) | Testing notes |
| [DESIGN.md](./DESIGN.md) | Design tokens & visual system |

## Security

Public for portfolio transparency. Secrets stay in environment variables — never in the repo.

- Session cookies verified with Firebase Admin
- Firestore / Storage rules enforce org & agency membership
- Rate limiting + validation on public endpoints
- Dev-only auth routes disabled outside localhost

See [SECURITY.md](./SECURITY.md) to report issues.

## License

© 2026 CartShift Studio. All rights reserved.

This repository is public for transparency and portfolio purposes. **No license is granted for reuse, redistribution, or commercial use without written permission.**

---

<p align="center">
  Built by <a href="https://github.com/yotamon">Yotam Faraggi</a> ·
  <a href="https://cart-shift.com/en">cart-shift.com</a> ·
  <a href="mailto:yotamon@gmail.com">yotamon@gmail.com</a>
</p>
