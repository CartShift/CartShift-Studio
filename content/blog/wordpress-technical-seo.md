---
title: 'WordPress Technical SEO Checklist: Ecommerce Edition'
date: '2025-12-18'
excerpt: 'A practical WordPress technical SEO guide for reducing ambiguity around indexability, canonicals, sitemaps, structured data, performance, and multilingual setup.'
category: 'WordPress'
image: '/images/blog/wordpress-technical-seo.webp'
imageAlt: 'Editorial ecommerce thumbnail showing a WordPress technical SEO blueprint table'
socialImage: '/images/blog/og/wordpress-technical-seo.webp'
title_he: 'צ׳ק ליסט SEO טכני לוורדפרס: גרסת איקומרס'
excerpt_he: 'מדריך Technical SEO מעשי ל-WordPress שמפחית אי-בהירות סביב אינדוקס, canonicals, sitemaps, structured data, ביצועים וריבוי שפות.'
category_he: 'וורדפרס'
title_de: "Technische SEO-Checkliste für WordPress: E-Commerce-Edition"
excerpt_de: "Ein praktischer technischer SEO-Leitfaden für WordPress zur Reduzierung von Unklarheiten in Bezug auf Indexierbarkeit, Canonicals, Sitemaps, strukturierte Daten, Leistung und mehrsprachige Einrichtung."
category_de: "WordPress"
---

Technical SEO on WordPress is mostly about removing ambiguity. Which pages should be indexed? Which versions are canonical? Which products, categories, and content hubs deserve crawl attention? Which plugins are creating noise?

The goal is not to please a checklist. It is to make the site easier for Google to crawl and easier for customers to trust. Start with [Google Search Central](https://developers.google.com/search), then inspect the actual templates your visitors use.

## What “technical SEO” actually means for ecommerce

For ecommerce, technical SEO is mostly about:

- **Crawling**: can Google access your important URLs?
- **Indexing**: are the right URLs eligible to appear in search results?
- **Canonicalization**: do duplicate URLs get consolidated properly?
- **Structured data**: does Google understand products, pricing, availability, and policies?
- **Performance**: is the site fast and stable enough to convert (and not fail CWV)?

Let’s get into the checklist.

## WordPress technical SEO working checklist for ecommerce

### 1) Indexing controls: robots.txt vs noindex (don’t mix them up)

Two rules that people confuse:

- **robots.txt** controls _crawling_ (whether Googlebot can fetch a URL).
- **noindex** controls _indexing_ (whether a URL can appear in search results).

Important: for `noindex` to work, Google has to be able to crawl the page and see the tag/header — so don’t block it in robots.txt if your goal is deindexing.

**Action items:**

- [ ] Confirm your store isn’t blocking essential assets (CSS/JS) needed for rendering.
- [ ] Use `noindex` for thin/utility pages you don’t want in Google (example: internal search results, account pages, cart, checkout).
- [ ] Keep robots.txt clean and intentional — don’t copy/paste random “SEO robots templates” from 2016.

Helpful reference:

- Google’s robots.txt documentation: https://developers.google.com/search/reference/robots_txt
- Google on noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing

### 2) Sitemaps: generate clean signals (and submit them)

A sitemap is not magic. It’s a strong hint. It tells Google: “These are the URLs we care about.”

**Action items:**

- [ ] Ensure you have an XML sitemap (most SEO plugins generate it).
- [ ] Submit it in Google Search Console.
- [ ] Make sure it includes only indexable URLs (not `noindex`, not 404s, not redirected URLs).
- [ ] If your site is large, use sitemap index files and keep things organized.

Reference:

- Google sitemap index best practices: https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps

### 3) Canonicals: stop duplicates from eating your rankings

Ecommerce creates duplicates constantly:

- product variants with different URLs,
- category pages with sorting parameters,
- filtered pages,
- pagination,
- tracking parameters.

Google explains canonicalization as selecting the “representative” URL among duplicates. You can suggest a canonical, but it’s a hint — not a command.

**Action items:**

- [ ] Ensure each product page has a single preferred canonical URL.
- [ ] Avoid canonical mistakes on pagination (don’t point page 2 → page 1 unless it’s truly a duplicate).
- [ ] If you have both HTTP and HTTPS (or www vs non-www), fix it with redirects + consistent canonicals.

References:

- Canonicalization overview: https://developers.google.com/search/docs/crawling-indexing/canonicalization
- Common canonical mistakes (pagination): https://developers.google.com/search/blog/2013/04/5-common-mistakes-with-relcanonical

### 4) Faceted navigation (filters) — the #1 WooCommerce SEO trap

Filters are great UX. They are also a crawling/indexing nightmare.

Typical problem:

- Google discovers thousands of filter combinations
- crawl budget gets wasted
- duplicate content explodes
- category pages weaken instead of strengthening

**Action items:**

- [ ] Decide which filtered pages deserve indexing (usually very few).
- [ ] For the rest: `noindex, follow` is often a sane approach.
- [ ] Consider blocking endless parameter combinations in robots.txt _only if_ you’re sure you don’t need Google to crawl them for discovery.

Pro tip: keep “SEO filter pages” intentional. Example:
Instead of letting `/category/shoes?color=black&size=42&sort=price` index, create a curated landing page like `/black-running-shoes/` with real copy, internal links, and a stable URL.

### 5) Product structured data (schema): make Google understand what you sell

If you want rich results (price, availability, ratings), you need correct `Product` structured data.

**Action items:**

- [ ] Add `Product` schema with required properties (name + at least one of review/aggregateRating/offers).
- [ ] Ensure prices, currency, and availability update correctly.
- [ ] Validate with Google’s Rich Results Test.
- [ ] Don’t generate schema only via heavy client-side JS if you can avoid it.

References:

- Product structured data (snippets): https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Structured data general guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

### 6) Return policy schema (optional, but powerful for trust)

If you’re investing in SEO, trust signals matter. Return policy markup can help search engines understand your merchant policies.

**Action items:**

- [ ] Publish a clear return policy page.
- [ ] If relevant, add MerchantReturnPolicy structured data.

Reference:

- MerchantReturnPolicy documentation: https://developers.google.com/search/docs/appearance/structured-data/return-policy

### 7) Core Web Vitals: ecommerce performance isn’t “nice to have”

Google’s Core Web Vitals targets are well-known, but stores still ignore them until paid traffic gets expensive.

Targets Google documents:

- LCP within 2.5s
- INP under 200ms
- CLS under 0.1

**Action items (WordPress/WooCommerce specific):**

- [ ] Use a fast host (managed WP/Woo hosting if possible).
- [ ] Add full-page caching + object cache (Redis if the stack supports it).
- [ ] Optimize images (WebP + correct sizing + lazy load).
- [ ] Reduce plugin bloat (especially page builders + multiple analytics scripts).
- [ ] Delay non-critical JS and third-party scripts (chat widgets, heatmaps, etc).

Reference:

- Core Web Vitals in Search: https://developers.google.com/search/docs/appearance/core-web-vitals

### 8) Multilingual setup (Hebrew + English): do it the “Google-safe” way

If your store is bilingual, don’t rely on cookies or browser-language redirects for critical content. Google recommends using distinct URLs per language and using hreflang annotations to help send users to the right language version.

**Action items:**

- [ ] Use separate URLs for each language (for example `/en/` and `/he/`).
- [ ] Add `hreflang` correctly (plugin or custom output).
- [ ] Ensure each language version has equivalent internal links and indexability.

Reference:

- Google guidance for multilingual sites: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites

### 9) Monitoring: Search Console is your technical SEO dashboard

If you don’t measure it, you won’t notice breakages until revenue dips.

**Action items:**

- [ ] Use URL Inspection for key pages (products + categories).
- [ ] Monitor “Pages” indexing reports (look for “Duplicate, Google chose different canonical” type issues).
- [ ] Track Core Web Vitals report in Search Console.
- [ ] Re-submit sitemap after major site changes.

## Quick “Done” checklist (copy/paste)

**Crawl & Index**

- [ ] robots.txt is intentional (not blocking important pages/assets)
- [ ] noindex used for thin utility pages (cart/checkout/account/search)
- [ ] XML sitemap submitted and clean

**Duplicates**

- [ ] canonicals are correct on products and categories
- [ ] pagination isn’t canonicals-to-page-1 by mistake
- [ ] filter URLs are controlled (noindex or curated landing pages)

**Rich Results**

- [ ] Product schema valid and tested
- [ ] Return policy page exists (schema if relevant)

**Performance**

- [ ] CWV targets addressed (LCP/INP/CLS)
- [ ] plugins/scripts trimmed and optimized

**Bilingual**

- [ ] separate language URLs + hreflang
- [ ] both languages internally linked and indexable

## Conclusion

Technical SEO isn’t about being “perfect.” It’s about removing friction:

- for crawlers (so you get indexed correctly),
- for users (so pages load and convert),
- and for your team (so changes don’t break everything).

If you want, we can run a technical SEO audit on your WordPress/WooCommerce store and turn this checklist into a prioritized roadmap:
[Contact us](/contact) — and include your store URL + top 3 countries you sell to.

---he---

Technical SEO ב-WordPress הוא בעיקר הסרת אי-בהירות. אילו עמודים צריכים להיכנס לאינדקס? איזו גרסה היא canonical? אילו מוצרים, קטגוריות ו-content hubs ראויים לתשומת לב סריקה? אילו פלאגינים מייצרים רעש?

המטרה היא לא לרצות צ׳קליסט. המטרה היא להפוך את האתר לקל יותר לסריקה על ידי גוגל וקל יותר לאמון מצד לקוחות. התחילו עם [Google Search Central](https://developers.google.com/search), ואז בדקו את התבניות האמיתיות שהמבקרים משתמשים בהן.

## מה זה “SEO טכני” באיקומרס (במילים של בני אדם)

באיקומרס, SEO טכני זה בעיקר:

- **סריקה (Crawling):** האם גוגל יכול לגשת לעמודים החשובים?
- **אינדוקס (Indexing):** האם העמודים הנכונים יכולים להופיע בתוצאות?
- **קנוניקל (Canonical):** האם עמודים כפולים מתאחדים בצורה חכמה?
- **סכמות (Structured Data):** האם גוגל מבין מוצר/מחיר/מלאי/מדיניות?
- **ביצועים:** האם האתר מהיר ויציב מספיק כדי למכור (ולא להיכשל ב־CWV)?

יאללה לצ׳ק ליסט.

## צ׳ק ליסט SEO טכני לוורדפרס (איקומרס)

### 1) robots.txt מול noindex — לא אותו דבר

שני דברים שאנשים מערבבים:

- **robots.txt** קובע האם גוגל _יסרוק_ URL.
- **noindex** קובע האם URL _יופיע בתוצאות_.

שימו לב: כדי ש־`noindex` יעבוד, גוגל חייב להצליח לסרוק את העמוד ולקרוא את התג. כלומר — אם חסמתם את העמוד ב־robots.txt, ייתכן שגוגל לא יראה את ה־noindex.

**מה עושים בפועל:**

- [ ] לבדוק שלא חסמתם בטעות CSS/JS שצריך לרינדור
- [ ] להגדיר `noindex` לעמודים “תפעוליים” שאין להם ערך חיפוש (חיפוש פנימי, חשבון, סל, צ׳קאאוט)
- [ ] לא להעתיק קובץ robots “תבנית” בלי להבין

### 2) סייטמאפ: לשדר לגוגל מה חשוב

סייטמאפ הוא לא קסם — הוא “רמז חזק” לגוגל על מה חשוב לכם.

**מה עושים בפועל:**

- [ ] לוודא שיש XML sitemap (רוב תוספי SEO מייצרים)
- [ ] לשלוח ב־Google Search Console
- [ ] לוודא שהסייטמאפ כולל רק עמודים שאמורים להיות באינדקס (לא noindex/404/רידיירקטים)
- [ ] אם האתר גדול — לעבוד עם sitemap index

### 3) קנוניקל: לא לתת לכפילויות לאכול לכם את הדירוגים

באיקומרס יש כפילויות בלי סוף:

- וריאציות,
- מיון,
- פילטרים,
- עימוד,
- פרמטרים/UTM.

גוגל מסביר שקנוניקל הוא “ה-URL המייצג”. אתם מציעים — וגוגל מחליט (זה hint, לא חוק).

**מה עושים בפועל:**

- [ ] לכל מוצר יש canonical אחד ברור
- [ ] לא לעשות טעויות קנוניקל בעימוד (עמוד 2 לא אמור להצביע לעמוד 1 אם זה לא כפול)
- [ ] לסדר http/https ו־www/non-www עם רידיירקטים וקנוניקל עקביים

### 4) פילטרים (Facets) — המלכודת הכי גדולה בווקומרס

פילטרים זה UX מעולה. זה גם כאוס SEO.

מה קורה בדרך כלל:

- גוגל מגלה אלפי קומבינציות פילטרים
- מבזבז סריקה
- כפילויות מתפוצצות
- דפי קטגוריה נחלשים במקום להתחזק

**מה עושים בפועל:**

- [ ] להחליט איזה דפי פילטר כן שווים אינדוקס (בדרך כלל מעט מאוד)
- [ ] כל השאר: לרוב `noindex, follow` זה פתרון שפוי
- [ ] לחסום ב־robots.txt רק קומבינציות אינסופיות שאתם בטוחים שלא צריכים

טיפ מהשטח: במקום לתת ל־`/category/shoes?color=black&size=42&sort=price` להיכנס לאינדקס — ליצור דף נחיתה קבוע כמו `/black-running-shoes/` עם טקסט אמיתי, קישורים פנימיים ו־URL יציב.

### 5) סכמות מוצר (Product schema): כדי שגוגל יבין מה אתם מוכרים

רוצים תוצאות עשירות (מחיר, מלאי, דירוגים)? צריך `Product` structured data תקין.

**מה עושים בפועל:**

- [ ] לוודא סכמת Product עם שדות חובה (name + לפחות אחד מ־review/aggregateRating/offers)
- [ ] שהמחיר/מטבע/מלאי מתעדכנים נכון
- [ ] לבדוק ב־Rich Results Test
- [ ] לא להשאיר את כל הסכמה ל־JS כבד בצד לקוח אם אפשר להימנע

### 6) סכמת מדיניות החזרות (אופציונלי אבל מוסיף אמון)

ב-SEO, אמון הוא חלק מהמשחק. יש אפשרות לסמן מדיניות החזרות בצורה שגוגל מבין.

**מה עושים בפועל:**

- [ ] לפרסם עמוד מדיניות החזרות ברור
- [ ] (אם רלוונטי) להוסיף MerchantReturnPolicy schema

### 7) Core Web Vitals: ביצועים זה כסף

גוגל מציין יעדים ברורים:

- LCP עד 2.5 שניות
- INP מתחת ל־200ms
- CLS מתחת ל־0.1

**מה עושים בפועל בוורדפרס/ווקומרס:**

- [ ] הוסטינג טוב (מנוהל זה בוסט רציני)
- [ ] קאשינג מלא + object cache (אם אפשר Redis)
- [ ] תמונות WebP + מידות נכונות + lazy load
- [ ] לצמצם תוספים (במיוחד בוני עמודים + אינסוף סקריפטים)
- [ ] לדחות JS לא קריטי וסקריפטים צד-שלישי (צ׳אט/היטמאפ/וכו׳)

### 8) אתר דו-לשוני (עברית + אנגלית): לעשות “כמו שגוגל אוהב”

לא להסתמך על cookies / דחיפת שפה לפי הדפדפן בתור פתרון עיקרי. גוגל ממליץ על **כתובות שונות לכל שפה** + hreflang.

**מה עושים בפועל:**

- [ ] `/en/` ו־`/he/` או מבנה URL עקבי אחר
- [ ] hreflang תקין (תוסף או קוד מותאם)
- [ ] לשמור על קישורים פנימיים והיררכיה דומה בין השפות

### 9) ניטור: Search Console זה הלוח בקרה שלכם

אם לא מודדים, מגלים תקלות רק כשהכנסות יורדות.

**מה עושים בפועל:**

- [ ] URL Inspection לעמודי מוצר/קטגוריה חשובים
- [ ] לעקוב אחרי דוחות אינדוקס (בעיות “Duplicate, Google chose different canonical” וכו׳)
- [ ] לבדוק Core Web Vitals ב־Search Console
- [ ] לשלוח מחדש sitemap אחרי שינויים גדולים

## צ׳ק ליסט קצר לסיום

**סריקה ואינדוקס**

- [ ] robots.txt נקי ומכוון
- [ ] noindex לעמודי סל/צ׳קאאוט/חשבון/חיפוש פנימי
- [ ] sitemap נקי ונשלח

**כפילויות**

- [ ] קנוניקל נכון למוצרים וקטגוריות
- [ ] אין קנוניקל “לעמוד 1” בעימוד בטעות
- [ ] פילטרים בשליטה (noindex או דפי נחיתה ייעודיים)

**סכמות**

- [ ] Product schema תקין ונבדק
- [ ] מדיניות החזרות קיימת (סכמה אם מתאים)

**ביצועים**

- [ ] CWV מטופל
- [ ] צמצום תוספים וסקריפטים

**דו-לשוני**

- [ ] URL נפרד לכל שפה + hreflang
- [ ] שתי השפות מאונדקסות נכון ומקושרות פנימית

## סיכום

SEO טכני זה לא להיות “מושלמים”. זה להוריד חיכוך:

- לגוגל (כדי שיאנדקס נכון),
- ללקוחות (כדי שהאתר יטען וימכור),
- ולצוות (כדי ששינויים לא ישברו דברים).

אם תרצו, נעשה לכם Audit טכני ונמפה את זה לתכנית עבודה מסודרת לפי ROI:
[צרו קשר](/contact) — ושלחו גם URL + 3 המדינות המרכזיות שאתם מוכרים אליהן.

---de---
Beim technischen SEO auf WordPress geht es hauptsächlich darum, Unklarheiten zu beseitigen. Welche Seiten sollen indexiert werden? Welche Versionen sind kanonisch? Welche Produkte, Kategorien und Content Hubs verdienen Crawling-Aufmerksamkeit? Welche Plugins verursachen Lärm?

Das Ziel besteht nicht darin, einer Checkliste zu gefallen. Dies soll das Crawlen der Website durch Google und das Vertrauen der Kunden erleichtern. Beginnen Sie mit [Google Search Central](https://developers.google.com/search) und überprüfen Sie dann die tatsächlichen Vorlagen, die Ihre Besucher verwenden.

## Was „technisches SEO“ eigentlich für den E-Commerce bedeutet

Im E-Commerce geht es bei technischem SEO hauptsächlich um Folgendes:

- **Crawling**: Kann Google auf Ihre wichtigen URLs zugreifen?
- **Indexierung**: Können die richtigen URLs in den Suchergebnissen erscheinen?
- **Kanonisierung**: Werden doppelte URLs ordnungsgemäß konsolidiert?
- **Strukturierte Daten**: Versteht Google Produkte, Preise, Verfügbarkeit und Richtlinien?
- **Leistung**: Ist die Website schnell und stabil genug, um eine Konvertierung durchzuführen (und CWV nicht auszufallen)?

Kommen wir zur Checkliste.

## Technische SEO-Arbeitscheckliste für WordPress für E-Commerce

### 1) Indexierungskontrollen: robots.txt vs. noindex (nicht verwechseln)

Zwei Regeln, die die Leute verwirren:

- **robots.txt** steuert das _Crawling_ (ob Googlebot eine URL abrufen kann).
- **noindex** steuert die _Indexierung_ (ob eine URL in den Suchergebnissen erscheinen kann).

Wichtig: Damit `noindex` funktioniert, muss Google in der Lage sein, die Seite zu crawlen und das Tag/den Header zu sehen – blockieren Sie es also nicht in robots.txt, wenn Ihr Ziel die Deindexierung ist.

**Aktionselemente:**

- [ ] Stellen Sie sicher, dass Ihr Shop keine wesentlichen Assets (CSS/JS) blockiert, die für das Rendering benötigt werden.
- [ ] Verwenden Sie `noindex` für Thin-/Utility-Seiten, die Sie nicht in Google haben möchten (Beispiel: interne Suchergebnisse, Kontoseiten, Warenkorb, Checkout).
- [ ] Halten Sie robots.txt sauber und zielgerichtet – kopieren/fügen Sie keine zufälligen „SEO-Roboter-Vorlagen“ aus dem Jahr 2016 ein.

Hilfreiche Referenz:

- Googles robots.txt-Dokumentation: https://developers.google.com/search/reference/robots_txt
- Google auf noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing

### 2) Sitemaps: saubere Signale generieren (und übermitteln)

Eine Sitemap ist keine Zauberei. Es ist ein starker Hinweis. Es teilt Google mit: „Das sind die URLs, die uns wichtig sind.“

**Aktionselemente:**

- [ ] Stellen Sie sicher, dass Sie über eine XML-Sitemap verfügen (die meisten SEO-Plugins generieren diese).
- [ ] Senden Sie es in der Google Search Console.
- [ ] Stellen Sie sicher, dass es nur indexierbare URLs enthält (nicht `noindex`, keine 404s, keine umgeleiteten URLs).
- [ ] Wenn Ihre Website groß ist, verwenden Sie Sitemap-Indexdateien und sorgen Sie für Ordnung.

Referenz:

- Best Practices für den Google Sitemap-Index: https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps

### 3) Canonicals: Verhindern Sie, dass Duplikate Ihr Ranking verschlingen

E-Commerce erzeugt ständig Duplikate:

- Produktvarianten mit unterschiedlichen URLs,
- Kategorieseiten mit Sortierparametern,
- gefilterte Seiten,
- Paginierung,
- Tracking-Parameter.

Google erklärt Kanonisierung als Auswahl der „repräsentativen“ URL unter Duplikaten. Sie können einen Kanon vorschlagen, aber es ist ein Hinweis – kein Befehl.

**Aktionselemente:**

- [ ] Stellen Sie sicher, dass jede Produktseite eine einzige bevorzugte kanonische URL hat.
- [ ] Vermeiden Sie kanonische Fehler bei der Paginierung (verweisen Sie nicht auf Seite 2 → Seite 1, es sei denn, es handelt sich tatsächlich um ein Duplikat).
- [ ] Wenn Sie sowohl HTTP als auch HTTPS (oder www vs. nicht-www) haben, beheben Sie das Problem mit Weiterleitungen + konsistenten Canonicals.

Referenzen:

- Übersicht über die Kanonisierung: https://developers.google.com/search/docs/crawling-indexing/canonicalization
- Häufige kanonische Fehler (Paginierung): https://developers.google.com/search/blog/2013/04/5-common-mistakes-with-relcanonical

### 4) Facettierte Navigation (Filter) – die WooCommerce-SEO-Falle Nr. 1

Filter sind eine großartige UX. Sie sind auch ein Crawling-/Indexierungs-Albtraum.

Typisches Problem:

- Google entdeckt Tausende von Filterkombinationen
- Crawling-Budget wird verschwendet
- Duplicate Content explodiert
- Kategorieseiten werden schwächer statt gestärkt

**Aktionselemente:**

- [ ] Entscheiden Sie, welche gefilterten Seiten eine Indexierung verdienen (normalerweise nur sehr wenige).
- [ ] Im Übrigen: `noindex, follow` ist oft ein vernünftiger Ansatz.
- [ ] Erwägen Sie das Blockieren endloser Parameterkombinationen in robots.txt _nur wenn_ Sie sicher sind, dass Google sie nicht für die Entdeckung crawlen muss.

Profi-Tipp: Halten Sie „SEO-Filterseiten“ bewusst. Beispiel:
Anstatt `/category/shoes?color=black&size=42&sort=price` indexieren zu lassen, erstellen Sie eine kuratierte Landingpage wie `/black-running-shoes/` mit echtem Text, internen Links und einer stabilen URL.

### 5) Produktstrukturierte Daten (Schema): Machen Sie Google verständlich, was Sie verkaufen

Wenn Sie umfassende Ergebnisse (Preis, Verfügbarkeit, Bewertungen) wünschen, benötigen Sie korrekte `Product` strukturierte Daten.

**Aktionselemente:**

- [ ] Fügen Sie das Schema `Product` mit den erforderlichen Eigenschaften hinzu (Name + mindestens eines von review/aggregateRating/offers).
- [ ] Stellen Sie sicher, dass Preise, Währung und Verfügbarkeit korrekt aktualisiert werden.
- [ ] Validieren Sie mit dem Rich Results Test von Google.
- [ ] Generieren Sie Schemata nicht nur über umfangreiches clientseitiges JS, wenn Sie dies vermeiden können.

Referenzen:

- Strukturierte Produktdaten (Snippets): https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Allgemeine Richtlinien für strukturierte Daten: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

### 6) Rückgaberichtlinienschema (optional, aber leistungsstark für Vertrauen)

Wenn Sie in SEO investieren, sind Vertrauenssignale wichtig. Markup für Rückgaberichtlinien kann Suchmaschinen dabei helfen, Ihre Händlerrichtlinien zu verstehen.

**Aktionselemente:**

- [ ] Veröffentlichen Sie eine klare Seite mit den Rückgabebedingungen.
- [ ] Fügen Sie gegebenenfalls strukturierte MerchantReturnPolicy-Daten hinzu.

Referenz:

- MerchantReturnPolicy-Dokumentation: https://developers.google.com/search/docs/appearance/structured-data/return-policy

### 7) Core Web Vitals: E-Commerce-Leistung ist nicht „nice to have“

Die Core Web Vitals-Ziele von Google sind bekannt, aber die Geschäfte ignorieren sie immer noch, bis der bezahlte Traffic teuer wird.

Zielt auf Google-Dokumente ab:

- LCP innerhalb von 2,5 s
- INP unter 200 ms
- CLS unter 0,1

**Aktionselemente (WordPress/WooCommerce-spezifisch):**

- [ ] Verwenden Sie einen schnellen Host (wenn möglich verwaltetes WP/Woo-Hosting).
- [ ] Vollseiten-Caching + Objekt-Cache hinzufügen (Redis, wenn der Stack dies unterstützt).
- [ ] Bilder optimieren (WebP + korrekte Größe + Lazy Load).
- [ ] Reduzieren Sie das Aufblähen von Plugins (insbesondere Seitenersteller + mehrere Analyseskripte).
- [ ] Verzögern Sie nicht kritische JS- und Drittanbieter-Skripte (Chat-Widgets, Heatmaps usw.).

Referenz:

- Kern-Web-Vitals in der Suche: https://developers.google.com/search/docs/appearance/core-web-vitals

### 8) Mehrsprachige Einrichtung (Hebräisch + Englisch): Machen Sie es auf die „Google-sichere“ Art und Weise

Wenn Ihr Shop zweisprachig ist, verlassen Sie sich bei kritischen Inhalten nicht auf Cookies oder Browser-Sprachweiterleitungen. Google empfiehlt die Verwendung unterschiedlicher URLs pro Sprache und die Verwendung von Hreflang-Anmerkungen, um Nutzer zur richtigen Sprachversion weiterzuleiten.

**Aktionselemente:**

- [ ] Verwenden Sie für jede Sprache separate URLs (zum Beispiel `/en/` und `/he/`).
- [ ] Fügen Sie `hreflang` korrekt hinzu (Plugin oder benutzerdefinierte Ausgabe).
- [ ] Stellen Sie sicher, dass jede Sprachversion über gleichwertige interne Links und Indexierbarkeit verfügt.

Referenz:

- Google-Anleitung für mehrsprachige Websites: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites

### 9) Überwachung: Die Search Console ist Ihr technisches SEO-Dashboard

Wenn Sie es nicht messen, werden Sie die Ausfälle erst dann bemerken, wenn die Einnahmen sinken.

**Aktionselemente:**

- [ ] Verwenden Sie die URL-Inspektion für wichtige Seiten (Produkte + Kategorien).
- [ ] Überwachen Sie die Indexierungsberichte „Seiten“ (suchen Sie nach Problemen vom Typ „Duplikat, Google hat andere kanonische Daten ausgewählt“).
- [ ] Verfolgen Sie den Core Web Vitals-Bericht in der Search Console.
- [ ] Sitemap nach größeren Site-Änderungen erneut einreichen.

## Schnelle „Fertig“-Checkliste (Kopieren/Einfügen)

**Crawling & Index**

- [ ] robots.txt ist beabsichtigt (blockiert keine wichtigen Seiten/Assets)
- [ ] noindex wird für Thin-Utility-Seiten (Warenkorb/Checkout/Konto/Suche) verwendet.
- [ ] XML-Sitemap eingereicht und bereinigt

**Duplikate**

- [ ] Canonicals sind für Produkte und Kategorien korrekt
- [ ] Die Paginierung ist nicht versehentlich Canonicals-to-page-1
- [ ] Filter-URLs werden kontrolliert (kein Index oder kuratierte Zielseiten)

**Rich-Ergebnisse**

- [ ] Produktschema gültig und getestet
- [ ] Seite mit Rückgaberichtlinien vorhanden (Schema, falls relevant)

**Leistung**

- [ ] CWV-Ziele angesprochen (LCP/INP/CLS)
- [ ] Plugins/Skripte getrimmt und optimiert

**Zweisprachig**

- [ ] separate Sprach-URLs + hreflang
- [ ] beide Sprachen intern verknüpft und indizierbar

## Fazit

Bei technischem SEO geht es nicht darum, „perfekt“ zu sein. Es geht darum, Reibungen zu beseitigen:

- für Crawler (damit Sie richtig indiziert werden),
- für Benutzer (damit Seiten geladen und konvertiert werden),
- und für Ihr Team (damit Änderungen nicht alles kaputt machen).

Wenn Sie möchten, können wir ein technisches SEO-Audit für Ihren WordPress/WooCommerce-Shop durchführen und diese Checkliste in eine priorisierte Roadmap umwandeln:
[Kontaktieren Sie uns](/contact) – und geben Sie Ihre Shop-URL + die drei wichtigsten Länder an, in die Sie verkaufen.
