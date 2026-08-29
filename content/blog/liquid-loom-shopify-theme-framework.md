---
title: 'Liquid Loom: A Source-First Shopify Theme Development Framework'
date: '2026-08-29'
excerpt: 'Meet Liquid Loom, an open-source Shopify theme framework that turns organized source code into deterministic, Shopify-ready output with Vite, Tailwind CSS, caching, and tested build safeguards.'
category: 'Shopify'
image: '/images/blog/liquid-loom-shopify-theme-framework.webp'
imageAlt: 'Liquid Loom source-to-output map showing organized Shopify theme files becoming Shopify-ready output'
socialImage: '/images/blog/liquid-loom-shopify-theme-framework.webp'
tags:
  - 'Shopify theme development'
  - 'Liquid'
  - 'Open source'
  - 'Vite'
  - 'Tailwind CSS'
title_he: 'Liquid Loom: פריימוורק מבוסס-מקור לפיתוח תבניות Shopify'
excerpt_he: 'הכירו את Liquid Loom, פריימוורק קוד פתוח לתבניות Shopify שהופך קוד מקור מאורגן לפלט דטרמיניסטי ומוכן ל-Shopify, עם Vite, Tailwind CSS, מטמון והגנות build שנבדקו.'
category_he: 'שופיפיי'
---

This is the entire idea behind Liquid Loom:

```text
src/theme/sections/home/hero.liquid
                    ↓
dist/theme/sections/hero.liquid
```

The source stays where a developer would look for it. The output lands where Shopify requires it.

That small mapping resolves a persistent tension in Shopify theme development. [Shopify themes use a prescribed directory structure](https://shopify.dev/docs/storefronts/themes/architecture), and most deployable directories do not support arbitrary subfolders. A growing codebase, however, is easier to reason about when related sections, snippets, styles, and behavior can live together by feature.

[Liquid Loom](https://github.com/yotamon/Liquid-Loom) is an open-source, source-first framework built around that boundary. It lets developers author an Online Store 2.0 theme in an organized workspace, compile modern frontend assets through Vite and Tailwind CSS, and generate a conventional `dist/theme/` directory that Shopify CLI can preview or push directly.

It does not replace Liquid. It does not add a storefront runtime. It makes the build between authored source and Shopify-ready output explicit, deterministic, and testable.

## Why source-first theme development matters

Shopify's runtime contract is useful precisely because it is conventional. A deployable theme has recognizable directories such as `layout`, `sections`, `snippets`, `templates`, `config`, `locales`, and `assets`. The platform, theme editor, Theme Check, and Shopify CLI all understand that shape.

Teams still choosing between light customization, a native custom build, and headless delivery should first use our [custom Shopify theme development decision guide](/blog/custom-shopify-theme-development). Liquid Loom is intentionally built for the native-theme branch of that decision.

The problem begins when the deployment format also becomes the authoring format.

Imagine a theme with dozens of sections. A homepage hero, featured collection, product gallery, product recommendations, cart drawer, search interface, and global navigation all sit beside one another in a flat `sections/` directory. Their related snippets are separated into another flat directory. JavaScript and CSS often accumulate around them without a clear ownership boundary.

The theme is valid, but the source tree stops communicating how the product is organized.

Liquid Loom treats Shopify's directory structure as a build target, not a limit on how source must be arranged. Developers can group files by concern:

```text
src/
├── entrypoints/
│   └── theme.js
├── public/
│   └── icons/
│       └── cart.svg
├── styles/
│   └── theme.css
└── theme/
    ├── sections/
    │   ├── home/
    │   │   └── hero.liquid
    │   └── products/
    │       └── main-product.liquid
    └── snippets/
        └── product/
            └── price.liquid
```

The build then produces Shopify's expected structure:

```text
dist/theme/
├── assets/
│   ├── cart.svg
│   ├── style.css
│   └── theme.js
├── sections/
│   ├── hero.liquid
│   └── main-product.liquid
└── snippets/
    └── price.liquid
```

This is not abstraction for its own sake. The source tree tells developers where a feature belongs, while the generated tree remains boring enough for Shopify to understand.

## The mapping contract is the framework

Liquid Loom deliberately separates two jobs.

The static mapper owns Liquid, JSON, and public files. Vite owns JavaScript and CSS. Both write into the same generated theme, but neither pretends the other kind of file works the same way.

| Authored source                              | Generated output                              | Behavior                                   |
| -------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `src/theme/sections/home/hero.liquid`        | `dist/theme/sections/hero.liquid`             | Flattens the feature folder                |
| `src/theme/snippets/product/price.liquid`    | `dist/theme/snippets/price.liquid`            | Flattens the feature folder                |
| `src/theme/templates/customers/account.json` | `dist/theme/templates/customers/account.json` | Preserves a supported nested template path |
| `src/public/icons/cart.svg`                  | `dist/theme/assets/cart.svg`                  | Copies a public asset into Shopify assets  |
| `src/entrypoints/theme.js`                   | `dist/theme/assets/theme.js`                  | Bundles and minifies with Vite             |
| `src/styles/theme.css`                       | `dist/theme/assets/style.css`                 | Compiles Tailwind and authored CSS         |

Every supported source path has one predictable destination. Unsupported paths fail. Missing required theme files fail. Invalid theme JSON fails. The generated directory is disposable and should never be edited by hand.

This contract also fits Shopify CLI's own guidance. Shopify notes that theme commands need to run against the standard theme directory structure, and that projects using build tools may need to run those commands from their generated output. Liquid Loom does exactly that: `shopify theme dev --path dist/theme`.

## Flattening needs a collision strategy

Feature folders create one important risk.

```text
src/theme/sections/home/hero.liquid
src/theme/sections/campaigns/hero.liquid
```

Both files would map to:

```text
dist/theme/sections/hero.liquid
```

A careless copier would let the last file win. The build would succeed, one section would disappear, and the result could depend on filesystem ordering.

Liquid Loom plans the complete copy operation first. If two source files resolve to one destination, it raises a `BuildCollisionError` before either file is copied. The error names the destination and both competing sources.

That behavior is more important than the nested folders themselves. Organization is only useful when the process that flattens it is safe.

## Incremental builds without stale output

Liquid Loom keeps a manifest under `.cache/manifest.json`. For each static source file, the manifest stores a SHA-256 content fingerprint, its output path, and its byte size.

On the next build, a file is skipped only when three conditions are true:

1. its content fingerprint is unchanged
2. its mapped destination is unchanged
3. the expected output file still exists

Changed files are copied again. Deleted source files remove their stale generated output. A renamed file cannot leave an old deployable artifact behind.

The manifest is written to a process-specific temporary file and renamed only after the static build succeeds. An interrupted build therefore cannot leave a half-written cache that claims the output is current.

A typical unchanged build reports useful work directly:

```text
LIQUID LOOM · production build
✓ 27 theme files · 0 copied · 27 cached · 0 removed · 21.4 KiB · 1.85s
output dist/theme
```

The goal is not a theatrical terminal. It is a build report that answers what changed, what was reused, what was removed, and where the deployable theme now lives.

## Clean commands should be defensive

Build tools eventually delete generated files. That makes path validation part of the framework's safety model.

Before Liquid Loom runs a clean build or removes its cache, it resolves the project root, source root, and output root. It rejects an output target when that target is:

- the project root itself
- the source directory or one of its children
- anywhere outside the repository

It applies the same principle when reading stale output paths from the cache manifest. A malformed or tampered cache entry cannot point cleanup outside `dist/theme/`.

These checks are covered by tests because a clean command should be convenient, not courageous.

## A real OS 2.0 starter, without pretending to be a store

The repository includes a merchant-neutral Online Store 2.0 reference theme. It covers the surfaces needed to prove the workflow:

- home, product, collection, cart, page, search, and 404 templates
- JSON templates and editable header and footer section groups
- theme settings exposed as CSS custom properties
- semantic navigation, visible focus states, skip links, and reduced-motion support
- standard Shopify product and cart forms that continue to work without JavaScript
- small progressive enhancements for mobile navigation and quantity controls

This matters because a framework is easier to evaluate against real theme behavior than against an empty folder.

The starter is intentionally not a production storefront. It includes no merchant data, private integrations, analytics provider, store identifiers, customer workflow, or vertical-specific visual system. Its job is to demonstrate the build contract and sensible defaults. The presentation is meant to be replaced.

## The quality gate is one command

`pnpm validate` reproduces the repository's CI gate locally. It runs:

```text
test coverage
→ formatting check
→ clean production build
→ project validation
→ Shopify Theme Check
→ public-readiness scan
```

At the time of this release, the repository reports 15 passing tests, 96.92% line coverage, 91.67% branch coverage, 100% function coverage, and zero Shopify Theme Check offenses in the generated starter. CI runs the same validation command on Node 24.

The public-readiness scan adds a less common release check. It examines repository filenames and public text files for excluded legacy product or brand terms while avoiding dependencies, generated output, Git internals, and cache data. It reports the location of a finding without repeating the excluded value into CI logs.

That check reflects a broader principle: an open-source repository should prove that it is portable, not merely claim that private details were removed.

## Start building with Liquid Loom

Liquid Loom is public under the MIT License. It requires Node.js 22.12 or newer, Corepack, and pnpm. A Shopify development store is needed only for live theme preview and deployment.

```bash
git clone https://github.com/yotamon/Liquid-Loom.git liquid-loom
cd liquid-loom

corepack enable
pnpm install
pnpm build
```

Authenticate once, then launch the build watcher and Shopify development theme together:

```bash
pnpm exec shopify auth login
pnpm dev
```

For local compilation without Shopify preview, use `pnpm watch`. Before opening a pull request, use `pnpm validate`.

## What Liquid Loom is for

Liquid Loom is a good fit when a Shopify theme team wants:

- native Liquid and Online Store 2.0 behavior
- feature-oriented source folders without giving up standard Shopify output
- modern CSS and JavaScript compilation through Tailwind and Vite
- deterministic builds with explicit failure modes
- a small starter that demonstrates commerce surfaces without imposing a brand or app stack

It is not a headless storefront, an application framework, or a replacement for Shopify CLI. It is the workshop around a theme: organized inputs, guarded transformations, and a deployable result that remains native to the platform.

The most useful open-source tools often do not erase constraints. They turn constraints into contracts developers can see, test, and trust.

For a production storefront, pair the repository checks with a [store speed and conversion review](/blog/store-speed-vs-conversion). If the work extends into theme architecture, integrations, or storefront QA, [CartShift's Shopify development service](/solutions/shopify) can help turn the framework into a production-ready theme.

Explore the [Liquid Loom repository on GitHub](https://github.com/yotamon/Liquid-Loom), run the validation suite, and open a focused issue or pull request when you find a way to make Shopify theme development more predictable.

---he---

זה כל הרעיון מאחורי Liquid Loom:

```text
src/theme/sections/home/hero.liquid
                    ↓
dist/theme/sections/hero.liquid
```

קוד המקור נשאר במקום שבו מפתח מצפה למצוא אותו. הפלט מגיע בדיוק למקום ש-Shopify דורשת.

המיפוי הקטן הזה פותר מתח קבוע בפיתוח תבניות Shopify. [תבניות Shopify משתמשות במבנה תיקיות מוגדר](https://shopify.dev/docs/storefronts/themes/architecture), ורוב תיקיות הפריסה אינן תומכות בתיקיות משנה שרירותיות. לעומת זאת, קל יותר להבין בסיס קוד שגדל כאשר sections, snippets, סגנונות והתנהגות שקשורים לאותה יכולת יכולים לחיות יחד לפי פיצ'ר.

[Liquid Loom](https://github.com/yotamon/Liquid-Loom) הוא פריימוורק קוד פתוח, מבוסס-מקור, שנבנה סביב הגבול הזה. הוא מאפשר למפתחים לכתוב תבנית Online Store 2.0 בסביבת עבודה מאורגנת, לקמפל נכסי frontend מודרניים באמצעות Vite ו-Tailwind CSS, ולייצר תיקיית `dist/theme/` קונבנציונלית ש-Shopify CLI יכולה להציג בתצוגה מקדימה או להעלות ישירות.

הוא לא מחליף את Liquid. הוא לא מוסיף runtime לחנות. הוא הופך את ה-build בין קוד המקור לבין הפלט המוכן ל-Shopify למפורש, דטרמיניסטי וניתן לבדיקה.

## למה פיתוח תבניות מבוסס-מקור חשוב

החוזה של Shopify בזמן ריצה שימושי דווקא מפני שהוא קונבנציונלי. לתבנית מוכנה לפריסה יש תיקיות מוכרות כמו `layout`, `sections`, `snippets`, `templates`, `config`, `locales` ו-`assets`. הפלטפורמה, עורך התבנית, Theme Check ו-Shopify CLI מבינים את המבנה הזה.

צוותים שעדיין בוחרים בין התאמה קלה, תבנית native מותאמת אישית ופתרון headless יכולים להתחיל עם [מדריך ההחלטה שלנו לפיתוח תבנית Shopify מותאמת](/blog/custom-shopify-theme-development). Liquid Loom נועד במכוון למסלול התבנית ה-native בהחלטה הזו.

הבעיה מתחילה כאשר פורמט הפריסה הופך גם לפורמט הכתיבה.

דמיינו תבנית עם עשרות sections. אזור hero לדף הבית, אוסף מוצרים, גלריית מוצר, המלצות, עגלת צד, חיפוש וניווט גלובלי יושבים זה לצד זה בתיקיית `sections/` שטוחה. ה-snippets הקשורים אליהם נמצאים בתיקייה שטוחה אחרת. JavaScript ו-CSS מצטברים סביבם בלי גבול בעלות ברור.

התבנית תקינה, אבל עץ המקור מפסיק להסביר כיצד המוצר מאורגן.

Liquid Loom מתייחס למבנה התיקיות של Shopify כאל יעד build, לא כאל מגבלה על צורת הארגון של קוד המקור. מפתחים יכולים לקבץ קבצים לפי תחום:

```text
src/
├── entrypoints/
│   └── theme.js
├── public/
│   └── icons/
│       └── cart.svg
├── styles/
│   └── theme.css
└── theme/
    ├── sections/
    │   ├── home/
    │   │   └── hero.liquid
    │   └── products/
    │       └── main-product.liquid
    └── snippets/
        └── product/
            └── price.liquid
```

לאחר מכן ה-build מייצר את המבנה ש-Shopify מצפה לו:

```text
dist/theme/
├── assets/
│   ├── cart.svg
│   ├── style.css
│   └── theme.js
├── sections/
│   ├── hero.liquid
│   └── main-product.liquid
└── snippets/
    └── price.liquid
```

זו אינה הפשטה לשם הפשטה. עץ המקור מספר למפתחים היכן פיצ'ר שייך, בעוד העץ שנוצר נשאר פשוט מספיק כדי ש-Shopify תבין אותו.

## חוזה המיפוי הוא הפריימוורק

Liquid Loom מפריד בכוונה בין שתי משימות.

הממפה הסטטי אחראי על קובצי Liquid, JSON וקבצים ציבוריים. Vite אחראי על JavaScript ו-CSS. שניהם כותבים לאותה תבנית שנוצרת, אבל אף אחד מהם אינו מעמיד פנים שסוגי הקבצים עובדים באותה צורה.

| קוד מקור                                     | פלט שנוצר                                     | התנהגות                         |
| -------------------------------------------- | --------------------------------------------- | ------------------------------- |
| `src/theme/sections/home/hero.liquid`        | `dist/theme/sections/hero.liquid`             | תיקיית הפיצ'ר משוטחת            |
| `src/theme/snippets/product/price.liquid`    | `dist/theme/snippets/price.liquid`            | תיקיית הפיצ'ר משוטחת            |
| `src/theme/templates/customers/account.json` | `dist/theme/templates/customers/account.json` | נתיב template נתמך נשמר         |
| `src/public/icons/cart.svg`                  | `dist/theme/assets/cart.svg`                  | נכס ציבורי מועתק לתיקיית assets |
| `src/entrypoints/theme.js`                   | `dist/theme/assets/theme.js`                  | נארז וממוזער באמצעות Vite       |
| `src/styles/theme.css`                       | `dist/theme/assets/style.css`                 | Tailwind ו-CSS נכתב מתקמפלים    |

לכל נתיב מקור נתמך יש יעד צפוי אחד. נתיבים שאינם נתמכים נכשלים. קובצי תבנית נדרשים שחסרים נכשלים. JSON לא תקין נכשל. התיקייה שנוצרת ניתנת למחיקה ואסור לערוך אותה ידנית.

החוזה הזה גם תואם להנחיות של Shopify CLI. Shopify מציינת שפקודות theme צריכות לרוץ מול מבנה התיקיות הסטנדרטי, ושפרויקטים שמשתמשים בכלי build עשויים להזדקק להריץ אותן מתוך הפלט שנוצר. Liquid Loom עושה בדיוק את זה: `shopify theme dev --path dist/theme`.

## השטחה דורשת אסטרטגיית התנגשויות

תיקיות פיצ'רים יוצרות סיכון חשוב אחד.

```text
src/theme/sections/home/hero.liquid
src/theme/sections/campaigns/hero.liquid
```

שני הקבצים ימופו אל:

```text
dist/theme/sections/hero.liquid
```

מעתיק פזיז יאפשר לקובץ האחרון לנצח. ה-build יצליח, section אחד ייעלם, והתוצאה עלולה להיות תלויה בסדר הקבצים במערכת.

Liquid Loom מתכנן מראש את פעולת ההעתקה המלאה. אם שני קובצי מקור נפתרים לאותו יעד, הוא מעלה `BuildCollisionError` לפני שאחד מהם מועתק. השגיאה מציינת את היעד ואת שני מקורות ההתנגשות.

ההתנהגות הזו חשובה יותר מהתיקיות המקוננות עצמן. ארגון מועיל רק כאשר התהליך שמשטח אותו בטוח.

## בניות אינקרמנטליות ללא פלט מיושן

Liquid Loom שומר manifest תחת `.cache/manifest.json`. לכל קובץ מקור סטטי נשמרים טביעת תוכן SHA-256, נתיב הפלט וגודל הקובץ בבייטים.

ב-build הבא, קובץ נדלג רק כאשר שלושה תנאים מתקיימים:

1. טביעת התוכן שלו לא השתנתה
2. היעד הממופה שלו לא השתנה
3. קובץ הפלט הצפוי עדיין קיים

קבצים שהשתנו מועתקים שוב. קובצי מקור שנמחקו מסירים את הפלט המיושן שלהם. שינוי שם של קובץ אינו משאיר artifact ישן שמוכן לפריסה.

ה-manifest נכתב לקובץ זמני ייחודי לתהליך ומשנה שם רק לאחר שה-build הסטטי מצליח. לכן build שנקטע אינו יכול להשאיר מטמון חלקי שטוען שהפלט עדכני.

כך נראה דיווח טיפוסי של build ללא שינויים:

```text
LIQUID LOOM · production build
✓ 27 theme files · 0 copied · 27 cached · 0 removed · 21.4 KiB · 1.85s
output dist/theme
```

המטרה אינה טרמינל תיאטרלי. זהו דיווח שעונה מה השתנה, במה נעשה שימוש חוזר, מה הוסר והיכן נמצאת כעת התבנית המוכנה לפריסה.

## פקודות ניקוי צריכות להיות הגנתיות

כלי build מוחקים בסופו של דבר קבצים שנוצרו. לכן אימות נתיבים הוא חלק ממודל הבטיחות של הפריימוורק.

לפני ש-Liquid Loom מריץ build נקי או מסיר את המטמון, הוא פותר את הנתיבים המלאים של שורש הפרויקט, שורש המקור ושורש הפלט. הוא דוחה יעד פלט כאשר היעד הוא:

- שורש הפרויקט עצמו
- תיקיית המקור או אחת מתיקיות המשנה שלה
- כל מיקום מחוץ למאגר

אותו עיקרון חל גם על נתיבי פלט ישנים שנקראים מ-manifest המטמון. רשומת מטמון פגומה או ששונתה אינה יכולה להפנות ניקוי מחוץ ל-`dist/theme/`.

הבדיקות מכסות את המקרים האלה, מפני שפקודת clean צריכה להיות נוחה, לא אמיצה.

## starter אמיתי של OS 2.0, בלי להעמיד פנים שהוא חנות

המאגר כולל תבנית reference ניטרלית לסוחרים עבור Online Store 2.0. היא מכסה את המשטחים הדרושים כדי להוכיח את תהליך העבודה:

- templates לדף הבית, מוצר, אוסף, עגלה, עמוד, חיפוש ו-404
- JSON templates וקבוצות sections ניתנות לעריכה עבור header ו-footer
- הגדרות תבנית שחשופות כ-CSS custom properties
- ניווט סמנטי, מצבי focus גלויים, קישורי דילוג ותמיכה ב-reduced motion
- טפסי מוצר ועגלה סטנדרטיים של Shopify שממשיכים לעבוד ללא JavaScript
- שיפורים קטנים ומדורגים לניווט במובייל ולבקרי כמות

זה חשוב מפני שקל יותר להעריך פריימוורק מול התנהגות אמיתית של תבנית מאשר מול תיקייה ריקה.

ה-starter אינו מתיימר להיות חנות production. אין בו נתוני סוחר, אינטגרציות פרטיות, ספק אנליטיקה, מזהי חנות, תהליך לקוח או מערכת עיצוב לענף מסוים. התפקיד שלו הוא להדגים את חוזה ה-build ואת ברירות המחדל הסבירות. את המראה אמורים להחליף.

## שער האיכות הוא פקודה אחת

`pnpm validate` משחזר מקומית את שער ה-CI של המאגר. הוא מריץ:

```text
test coverage
→ formatting check
→ clean production build
→ project validation
→ Shopify Theme Check
→ public-readiness scan
```

בזמן ההשקה, המאגר מדווח על 15 בדיקות שעוברות, 96.92% כיסוי שורות, 91.67% כיסוי ענפים, 100% כיסוי פונקציות ואפס עבירות Shopify Theme Check ב-starter שנוצר. ה-CI מריץ את אותה פקודת אימות על Node 24.

סריקת public-readiness מוסיפה בדיקת שחרור פחות נפוצה. היא בוחנת שמות קבצים וטקסטים ציבוריים במאגר כדי לאתר מונחי מוצר או מותג ישנים שהוגדרו להחרגה, תוך דילוג על dependencies, פלט שנוצר, נתוני Git ומטמון. היא מדווחת על מיקום הממצא בלי לחזור על הערך המוחרג בלוגים של CI.

הבדיקה הזו מבטאת עיקרון רחב יותר: מאגר קוד פתוח צריך להוכיח שהוא נייד, לא רק לטעון שהפרטים הפרטיים הוסרו.

## מתחילים לבנות עם Liquid Loom

Liquid Loom ציבורי תחת רישיון MIT. הוא דורש Node.js 22.12 ומעלה, Corepack ו-pnpm. חנות פיתוח של Shopify נדרשת רק לתצוגה מקדימה חיה ולפריסה.

```bash
git clone https://github.com/yotamon/Liquid-Loom.git liquid-loom
cd liquid-loom

corepack enable
pnpm install
pnpm build
```

לאחר אימות חד-פעמי, אפשר להפעיל יחד את צופה ה-build ואת תבנית הפיתוח של Shopify:

```bash
pnpm exec shopify auth login
pnpm dev
```

לקומפילציה מקומית ללא תצוגה מקדימה של Shopify, השתמשו ב-`pnpm watch`. לפני פתיחת pull request, השתמשו ב-`pnpm validate`.

## למי Liquid Loom מתאים

Liquid Loom מתאים לצוותי תבניות Shopify שרוצים:

- התנהגות native של Liquid ו-Online Store 2.0
- תיקיות מקור לפי פיצ'רים בלי לוותר על פלט Shopify סטנדרטי
- קומפילציה מודרנית של CSS ו-JavaScript באמצעות Tailwind ו-Vite
- builds דטרמיניסטיים עם מצבי כשל מפורשים
- starter קטן שמדגים משטחי מסחר בלי לכפות מותג או app stack

הוא אינו חנות headless, פריימוורק אפליקציה או תחליף ל-Shopify CLI. הוא סביבת העבודה שמקיפה תבנית: קלטים מאורגנים, טרנספורמציות מוגנות ותוצאה מוכנה לפריסה שנשארת native לפלטפורמה.

כלי הקוד הפתוח השימושיים ביותר לא תמיד מוחקים מגבלות. הם הופכים מגבלות לחוזים שמפתחים יכולים לראות, לבדוק ולסמוך עליהם.

בחנות production כדאי לשלב את בדיקות המאגר עם [סקירת מהירות והמרות](/blog/store-speed-vs-conversion). אם העבודה מתרחבת לארכיטקטורת תבנית, אינטגרציות או QA לחנות, [שירותי הפיתוח שלנו ל-Shopify](/solutions/shopify) יכולים לעזור להפוך את הפריימוורק לתבנית מוכנה לפריסה.

היכנסו ל-[מאגר Liquid Loom ב-GitHub](https://github.com/yotamon/Liquid-Loom), הריצו את חבילת האימות ופתחו issue ממוקד או pull request כאשר תמצאו דרך להפוך את פיתוח תבניות Shopify לצפוי יותר.
