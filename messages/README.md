# Translation Files Structure

## ⚠️ IMPORTANT: Source Files Only

**DO NOT EDIT** `en.json` or `he.json` directly. These are **generated files**.

## Source Files (Edit These)

Translations live under `messages/src/{locale}/`:

```
messages/src/
├── en/
│   ├── common.json
│   ├── cv.json
│   ├── legal.json
│   ├── proposal.json
│   ├── website.json
│   └── portal/           # Split portal namespaces (40+ files)
│       ├── common.json
│       ├── requests.json
│       ├── settings.json
│       ├── toast.json
│       └── ...
└── he/
    └── (same structure)
```

## Generated Files (Auto-Generated)

- `messages/en.json` — **DO NOT EDIT**
- `messages/he.json` — **DO NOT EDIT**

Generated files include `_meta._generated: true` at the top.

## Workflow

1. **Edit** source files in `messages/src/{locale}/` (always add keys to **both** `en` and `he`)
2. **Merge** with `pnpm i18n:merge` (also runs on `prebuild` / `predev`)
3. **Validate** with `pnpm i18n:validate` (also runs on `prebuild` after merge)

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm i18n:merge` | Merge sources → generated locale files |
| `pnpm i18n:validate` | Key parity, interpolation, structure, empty strings, missing code refs |
| `pnpm i18n:watch` | Watch `messages/src` and re-merge (also via `pnpm dev`) |

## File Organization

| File / folder | Contents |
|---------------|----------|
| `common.json` | Shared UI, navigation, errors |
| `website.json` | Marketing site + analyzer |
| `portal/*.json` | Portal feature namespaces (requests, team, settings, agency, …) |
| `legal.json` | Privacy, terms |
| `cv.json` / `proposal.json` | Standalone pages |

## Code Pattern (required)

Use the helpers in `@/lib/i18n/translations` instead of inventing new call styles:

```tsx
import { usePortalTranslations } from '@/lib/i18n/translations';

const t = usePortalTranslations();
t('dashboard.title'); // ✅ relative to portal

// Website / shared chrome
import { useWebsiteTranslations, useCommonTranslations } from '@/lib/i18n/translations';

// Analyzer
import { useAnalyzerTranslations } from '@/lib/i18n/translations';
```

See [BEST_PRACTICES.md](./BEST_PRACTICES.md) for full conventions.
