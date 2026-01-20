# Next-intl Migration Guide

## ✅ Completed

1. **Core Setup**
   - ✅ Installed `next-intl`
   - ✅ Created routing configuration (`i18n/routing.ts`)
   - ✅ Created request configuration (`i18n/request.ts`)
   - ✅ Set up proxy (`proxy.ts`) - migrated from middleware per Next.js 16
   - ✅ Updated `next.config.mjs` with next-intl plugin
   - ✅ Converted translations to JSON (`messages/en.json`, `messages/he.json`)
   - ✅ Set up TypeScript type safety (`i18n/global.ts`)
   - ✅ Created navigation utilities (`i18n/navigation.ts`)

2. **Layouts & Providers**
   - ✅ Updated `app/[locale]/layout.tsx` to use `NextIntlClientProvider`
   - ✅ Added `LocaleAttributes` component for lang/dir attributes
   - ✅ Updated `app/[locale]/page.tsx` to use `setRequestLocale`

3. **Migrated Components**
   - ✅ `components/ui/LanguageSwitcher.tsx`
   - ✅ `components/layout/Header.tsx`
   - ✅ `components/layout/Footer.tsx`
   - ✅ `components/sections/Hero.tsx`
   - ✅ `components/layout/ConditionalLayout.tsx`

## 🔄 Migration Pattern

For each component using the old system, follow this pattern:

### Client Components

**Before:**

```tsx
import { useLanguage } from '@/components/providers/LanguageProvider';

const { t, language, direction, localizePath } = useLanguage();
const isHe = language === 'he';
```

**After:**

```tsx
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useDirection } from '@/lib/i18n-utils';

const t = useTranslations();
const locale = useLocale();
const direction = useDirection();
const isHe = locale === 'he';
```

### Server Components

**Before:**

```tsx
import { useLanguage } from '@/components/providers/LanguageProvider';
```

**After:**

```tsx
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function Component({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // ...
}
```

### Navigation

**Before:**

```tsx
import Link from 'next/link';
const href = localizePath('/some-path');
<Link href={href}>...</Link>;
```

**After:**

```tsx
import { Link } from '@/i18n/navigation';
<Link href="/some-path">...</Link>;
```

### Language Switching

**Before:**

```tsx
const { setLanguage } = useLanguage();
setLanguage('he');
```

**After:**

```tsx
import { useRouter, usePathname } from '@/i18n/navigation';
const router = useRouter();
const pathname = usePathname();
router.replace(pathname, { locale: 'he' });
```

## 📋 Remaining Components to Migrate

### Components (87+ files found)

**High Priority:**

- `components/sections/*` - All section components
- `components/templates/*` - All template components
- `components/portal/*` - Portal components
- `components/ui/*` - UI components using translations
- `components/forms/*` - Form components

**App Routes:**

- `app/[locale]/portal/**` - Portal pages
- `app/[locale]/blog/**` - Blog pages
- `app/[locale]/*/page.tsx` - All page components

### Migration Checklist

For each file:

1. Replace `useLanguage` import with `useTranslations`/`useLocale`/`getTranslations`
2. Replace `localizePath` with direct paths (next-intl Link handles localization)
3. Replace `Link` from `next/link` with `Link` from `@/i18n/navigation`
4. Remove `as string` type casts (next-intl is type-safe)
5. Replace `language === 'he'` with `locale === 'he'`
6. Replace `direction` with `useDirection()` hook
7. For server components, add `setRequestLocale(locale)` call

## 🗑️ Files to Remove (After Migration)

- `components/providers/LanguageProvider.tsx`
- `lib/translations.ts` (keep for reference until all migrations complete)

## 🎯 Key Benefits

1. **Type Safety**: Full TypeScript support with autocomplete
2. **Performance**: Lazy loading of translations
3. **Best Practices**: Industry-standard library
4. **Server Components**: Full support for App Router
5. **Maintainability**: Less custom code to maintain
