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

1. **Edit** source files in `messages/src/{locale}/`
2. **Run** `npm run i18n:merge` (also runs on `prebuild` / `predev`)

## Scripts

- `npm run i18n:merge` — merge sources into generated files
- `npm run i18n:validate` — validate key parity across locales

## File Organization

| File / folder | Contents |
|---------------|----------|
| `common.json` | Shared UI, navigation, errors |
| `website.json` | Marketing site |
| `portal/*.json` | Portal feature namespaces (requests, team, settings, agency, …) |
| `legal.json` | Privacy, terms |
| `cv.json` / `proposal.json` | Standalone pages |
