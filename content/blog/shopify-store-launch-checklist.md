---
title: 'Shopify Store Launch Checklist: What to Verify Before You Go Live'
date: '2026-07-11'
excerpt: 'A practical Shopify store launch checklist for teams that need to verify products, payments, shipping, taxes, SEO, redirects, analytics, checkout, and rollback before launch day.'
category: 'Shopify'
image: '/images/blog/shopify-checkout-optimization.webp'
imageAlt: 'Editorial ecommerce thumbnail showing a Shopify launch readiness workspace with checkout and QA signals'
socialImage: '/images/blog/og/shopify-checkout-optimization.webp'
title_he: 'צ׳ק ליסט להשקת חנות Shopify: מה לבדוק לפני שעולים לאוויר'
excerpt_he: 'צ׳ק ליסט מעשי להשקת חנות Shopify: מוצרים, תשלומים, משלוחים, מסים, SEO, הפניות, אנליטיקס, checkout ותוכנית חזרה לאחור לפני יום ההשקה.'
category_he: 'Shopify'
---

A Shopify launch is not one task. It is the moment when catalog, checkout, operations, analytics, SEO, and customer support all have to agree with each other.

That is why a launch checklist should not be a decorative document that says "products, theme, domain, done." A useful Shopify store launch checklist helps the team prove that the store can take real orders, explain real policies, protect search visibility, and recover from problems without panic.

Use this guide before a new Shopify build, a redesign, or a migration from another platform. If the project is a migration, pair it with our [WooCommerce to Shopify migration guide](/blog/woocommerce-to-shopify-migration) and the broader [ecommerce migration checklist](/blog/complete-guide-ecommerce-migration).

## The short answer

Before a Shopify store goes live, verify six things:

1. The customer can find, understand, and buy the right product.
2. Payments, shipping, taxes, discounts, and notifications behave correctly.
3. SEO-critical URLs, redirects, titles, canonicals, and indexable pages are intentional.
4. Analytics can distinguish traffic, checkout behavior, purchases, and launch changes.
5. The team knows who owns orders, inventory, support, fulfillment, and rollback.
6. Launch day has a written sequence, not a Slack thread full of guesses.

Shopify's own help center provides a general setup checklist for new stores, and Shopify Plus has additional launch and go-live checklists for larger implementations. Treat those as platform milestones. Treat this article as the operational QA layer around revenue, SEO, and conversion.

## Choose the launch type first

The checklist changes depending on what is actually launching.

| Launch type                        | What matters most                                                         | Main risk                                  |
| ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| New Shopify store                  | Catalog setup, payments, shipping, policies, tracking, trust              | Missing a required commerce setting        |
| Redesign on existing Shopify store | Theme QA, app behavior, page speed, checkout path, content parity         | Breaking a working revenue path            |
| Platform migration to Shopify      | URL redirects, product data, customer expectations, order operations      | Losing SEO value or operational continuity |
| Shopify Plus launch                | Checkout extensibility, Markets, B2B, complex integrations, go-live roles | Too many teams changing production at once |

If the store already has traffic, revenue, or indexed URLs, the launch is not just a design release. It is a business continuity event.

## 1. Catalog and merchandising checks

Start with the parts shoppers see first.

Check every important product type, not only one perfect sample product. A store with simple products, variants, bundles, subscriptions, preorders, and digital products needs test cases for each type.

Verify:

- product titles are clear and not internally named
- descriptions answer sizing, materials, compatibility, care, warranty, or use questions
- variant names are understandable on mobile
- prices, compare-at prices, taxes, and sale rules are intentional
- product images have consistent aspect ratios and useful alt text
- unavailable variants behave clearly
- collections include the right products and sorting rules
- filters do not create confusing empty states
- search returns useful results for brand, product, SKU, and common misspellings
- product recommendations are relevant enough to show

For SEO, the goal is not to stuff collection pages with keywords. It is to make each commercially important product and collection useful enough to rank and convert. Our [Shopify SEO guide](/blog/shopify-seo-complete-guide) covers product and collection structure in more detail.

## 2. Theme, speed, and mobile QA

A launch-ready Shopify theme must be pleasant in the browser that the team uses and resilient in the browsers customers use.

Test the store on:

- a current iPhone
- a current Android device if possible
- a desktop browser
- a slower mobile connection
- the smallest common mobile viewport

Review the full path from home page to product, cart, checkout, and thank-you page. Do not stop at the product template.

Look for:

- layout shifts when images or app blocks load
- tap targets that are hard to hit
- sticky bars, chat widgets, popups, or consent banners covering purchase actions
- filters or menus that trap keyboard focus
- product media that loads too late
- cart drawers that fail with discounts, bundles, or subscriptions
- text that wraps poorly in Hebrew or English
- forms that use the wrong mobile keyboard

If performance is already fragile, launch day will make it more visible. Use our [Shopify speed optimization guide](/blog/speed-up-shopify-store) and [store speed vs conversion](/blog/store-speed-vs-conversion) to prioritize fixes that affect buying behavior, not only lab scores.

## 3. Payments, shipping, taxes, and markets

The checkout path is where launch confidence becomes real. Test it with real configurations and controlled test orders.

Verify payments:

- the intended payment providers are active
- test mode is removed only at the right point in the launch sequence
- accelerated wallets appear where expected
- failed payment states are understandable
- order confirmation and payment status match
- refunds and cancellations can be handled by the operations team

Verify shipping:

- zones match the markets you actually serve
- rates are correct for common cart sizes
- free-shipping thresholds work
- local delivery, pickup, or carrier rates are not exposed accidentally
- oversized, fragile, cold-chain, or restricted products have correct rules

Verify taxes and duties:

- tax settings reflect where the business has obligations
- prices and tax messaging are clear for the target markets
- international duties or import expectations are not hidden until too late
- invoices, receipts, and notifications use the right business details

For international selling, Shopify Markets can control region-specific domains, catalogs, currencies, and settings. Shopify's documentation also notes that deactivating or deleting markets can affect whether subfolder URLs keep working, so market decisions should be made before URL and redirect QA, not after it.

## 4. Checkout and conversion checks

Launch teams often over-focus on the homepage. Customers judge the store at the moment of risk: cart, checkout, payment, and confirmation.

Run checkout tests for:

- first-time customer
- returning customer
- mobile customer
- discount code
- free-shipping threshold
- out-of-stock or low-stock product
- international address
- failed payment
- gift card or store credit if used
- subscription or preorder if used

Then review the friction:

- Are shipping costs visible early enough?
- Does the cart explain what happens next?
- Is the discount field creating coupon hunting?
- Are return and delivery expectations accessible before payment?
- Do payment method labels feel familiar to the target market?
- Does the thank-you page tell the customer what to expect?

If checkout is already underperforming, do not bury the issue under a launch. Diagnose it with our [Shopify checkout optimization guide](/blog/shopify-checkout-optimization) and [conversion audit checklist](/blog/conversion-audit-checklist).

## 5. SEO, URLs, and redirects

This is the part of a Shopify launch that can quietly cost months.

For a new store, the main SEO risk is launching thin, confusing, or non-indexable pages. For a migration or redesign, the bigger risk is changing URLs without preserving signals.

Before launch, verify:

- every important product, collection, blog post, and landing page has an intentional title and meta description
- collection pages have useful intro or supporting content where appropriate
- no staging, test, duplicate, or filtered pages are unintentionally indexable
- canonical URLs point to the preferred production URL
- internal links use the final URL structure
- image alt text is descriptive
- the sitemap is available after launch
- robots settings do not block important pages
- old URLs redirect to the closest relevant new URL
- deleted products redirect to replacement products, parent collections, or useful alternatives

Shopify's URL redirect documentation explains that redirects help customers reach the right page when a URL changes. For migrations, export the old URL list before launch and test the highest-value URLs manually, especially pages with backlinks, organic traffic, or email traffic.

Do not redirect everything to the homepage. That is usually bad for users and weak for search engines. Map old product pages to new product pages, old categories to new collections, and old content to the closest matching content.

## 6. Apps, integrations, and automation

Every installed app is part of the launch surface. Some affect speed. Some affect checkout. Some affect inventory, subscriptions, reviews, search, personalization, returns, taxes, or fulfillment.

Create a launch app inventory:

- app name
- owner
- purpose
- pages affected
- data accessed
- billing owner
- theme code or app block used
- launch-critical or optional
- rollback/deactivation plan

Then test integrations by workflow, not by app name.

For example:

- order placed in Shopify creates the correct fulfillment action
- inventory sync updates Shopify without duplicate changes
- email platform receives the right event and customer consent state
- reviews widget renders without blocking product content
- ERP or accounting export handles refunds, discounts, taxes, and shipping
- support system receives customer and order context

If the app stack is already crowded, our [Shopify apps optimization guide](/blog/shopify-apps-optimization-guide) can help decide what should stay, what should be replaced, and what should be removed before launch.

## 7. Analytics and event QA

A launch without analytics is a launch without memory.

Before launch, confirm:

- GA4 is installed and receiving traffic
- purchase events fire once, not twice
- currency and revenue values are correct
- checkout and cart events match the current implementation
- paid media pixels are installed where required
- consent behavior matches the business policy
- internal team traffic is filtered or annotated where practical
- launch changes are annotated in the reporting workflow
- Search Console property and sitemap are ready

Test analytics with a real browsing sequence:

1. arrive from a tagged test URL
2. view a product
3. add to cart
4. start checkout
5. complete a test order
6. confirm the order and revenue in reporting tools

If the site uses both English and Hebrew pages, verify language and path reporting so the team can compare performance without mixing unrelated journeys.

## 8. Content, policy, and trust checks

Trust gaps become support tickets after launch.

Review:

- shipping policy
- returns and exchanges
- privacy policy
- terms
- contact details
- warranty or guarantee language
- size guides or compatibility notes
- FAQ content
- order confirmation emails
- abandoned checkout emails
- transactional email branding

Make sure the policies are visible from the places where customers need reassurance. A return policy hidden only in the footer may technically exist, but it does not help a hesitant buyer on a product page or checkout path.

For bilingual stores, check the Hebrew content directly. Translation drift is easy to miss when the launch team reviews only the English journey.

## 9. Operations and support readiness

The store is not launched when the homepage is visible. It is launched when the team can process real orders calmly.

Confirm:

- who monitors the first orders
- who owns fulfillment exceptions
- who answers customer support
- how refunds and cancellations are handled
- how inventory mismatches are escalated
- how fraud review is handled
- how high-priority bugs are reported
- who can pause campaigns if checkout fails
- who can roll back theme changes if needed

Create a launch-day contact list with names, roles, and decision authority. Avoid a plan where everyone is "available" but nobody owns the decision.

## 10. Launch sequence and rollback plan

Write the launch sequence before launch day.

A practical sequence might include:

1. freeze non-essential content and app changes
2. confirm backups, theme version, and DNS plan
3. verify final products, collections, policies, and notifications
4. enable final payment configuration
5. connect or switch domain
6. remove password protection when ready
7. test homepage, collection, product, cart, checkout, payment, and thank-you paths
8. test redirects and sitemap
9. place and cancel a controlled order
10. annotate analytics
11. monitor orders, errors, page speed, and support messages
12. hold a post-launch review within 24 to 72 hours

Rollback does not always mean taking the store offline. It can mean reverting to the previous theme, disabling a non-critical app block, pausing campaigns, restoring a DNS setting, or temporarily hiding a problematic product.

The point is to decide those moves before stress arrives.

## A compact Shopify launch checklist

Use this as the final pass.

- [ ] important product and collection pages are complete
- [ ] mobile product, cart, and checkout paths are tested
- [ ] payments are active and test mode is handled intentionally
- [ ] shipping zones, rates, and thresholds are verified
- [ ] tax, duties, and market settings are reviewed
- [ ] discount, gift card, subscription, and preorder flows are tested if used
- [ ] transactional emails are reviewed
- [ ] titles, descriptions, canonicals, sitemap, and robots behavior are checked
- [ ] old URLs are mapped to relevant new URLs
- [ ] GA4, pixels, purchase events, and Search Console are verified
- [ ] apps and integrations have owners and rollback paths
- [ ] support, fulfillment, refunds, and inventory exceptions have owners
- [ ] launch sequence is written
- [ ] rollback plan is written
- [ ] post-launch monitoring window is scheduled

## What CartShift Studio looks for before launch

When we review a Shopify launch, we care less about whether every task has a checkmark and more about whether the system can survive first contact with real customers.

That means we look at the flow between pages, not only the pages themselves:

- product promise to cart expectation
- cart expectation to checkout reality
- checkout reality to operations workflow
- URL structure to search visibility
- analytics events to decisions after launch

If you are close to launch and the checklist is exposing more questions than answers, that is useful. It means the launch plan is doing its job before customers find the gaps.

[Talk to CartShift Studio](/contact) if you want a Shopify launch review, migration QA pass, or go-live plan before the store starts taking real orders.

---he---

השקת חנות Shopify היא לא משימה אחת. זה הרגע שבו קטלוג, checkout, תפעול, אנליטיקס, SEO ותמיכת לקוחות צריכים לעבוד יחד בלי סתירות.

לכן צ׳ק ליסט להשקה לא אמור להיות מסמך יפה עם שלוש שורות של "מוצרים, עיצוב, דומיין". צ׳ק ליסט טוב עוזר לצוות להוכיח שהחנות יכולה לקבל הזמנות אמיתיות, להסביר מדיניות אמיתית, לשמור על נראות אורגנית ולהתאושש מתקלות בלי לחץ.

המדריך מתאים לחנות Shopify חדשה, לעיצוב מחדש או למיגרציה מפלטפורמה אחרת. אם מדובר במיגרציה, כדאי לחבר אותו גם ל[מדריך מעבר מ-WooCommerce ל-Shopify](/blog/woocommerce-to-shopify-migration) ול[צ׳ק ליסט הרחב למיגרציית ecommerce](/blog/complete-guide-ecommerce-migration).

## התשובה הקצרה

לפני שחנות Shopify עולה לאוויר, צריך לאמת שישה דברים:

1. הלקוח יכול למצוא, להבין ולקנות את המוצר הנכון.
2. תשלומים, משלוחים, מסים, הנחות והתראות עובדים נכון.
3. כתובות URL, הפניות, כותרות, canonical ועמודים לאינדוקס מוגדרים בכוונה.
4. האנליטיקס יודע למדוד תנועה, checkout, רכישות ושינויים בזמן ההשקה.
5. הצוות יודע מי אחראי על הזמנות, מלאי, תמיכה, fulfillment וחזרה לאחור.
6. ליום ההשקה יש רצף פעולות כתוב, לא שרשור הודעות מלא ניחושים.

ל-Shopify יש צ׳ק ליסט כללי לפתיחת חנות, ול-Shopify Plus יש מסמכי השקה נוספים לפרויקטים גדולים. השתמשו בהם כאבני דרך של הפלטפורמה. השתמשו במאמר הזה כשכבת QA סביב הכנסות, SEO והמרה.

## קודם כל מגדירים את סוג ההשקה

הצ׳ק ליסט משתנה לפי מה שבאמת עולה לאוויר.

| סוג השקה               | מה הכי חשוב                                                   | הסיכון המרכזי                        |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------ |
| חנות Shopify חדשה      | קטלוג, תשלומים, משלוחים, מדיניות, מדידה ואמון                 | פספוס הגדרת commerce קריטית          |
| עיצוב מחדש לחנות קיימת | QA לתבנית, אפליקציות, מהירות, checkout ותוכן                  | שבירה של מסלול מכירה שעבד            |
| מיגרציה ל-Shopify      | הפניות URL, נתוני מוצרים, ציפיות לקוחות ותפעול הזמנות         | פגיעה ב-SEO או ברציפות תפעולית       |
| השקת Shopify Plus      | checkout extensibility, Markets, B2B, אינטגרציות ותפקידי השקה | יותר מדי צוותים משנים production יחד |

אם לחנות כבר יש טראפיק, הכנסות או כתובות שמאונדקסות בגוגל, זו לא רק השקת עיצוב. זו השקת רציפות עסקית.

## 1. בדיקות קטלוג ומרצ׳נדייזינג

מתחילים במה שהקונים רואים קודם.

בדקו כל סוג מוצר חשוב, לא רק מוצר לדוגמה שנראה מושלם. אם יש מוצרים פשוטים, וריאציות, באנדלים, מנויים, preorders או מוצרים דיגיטליים, צריך תרחיש בדיקה לכל סוג.

בדקו:

- שמות מוצרים ברורים ולא שמות פנימיים
- תיאורים שעונים על מידות, חומרים, תאימות, טיפול, אחריות או שימוש
- שמות וריאציות מובנים במובייל
- מחירים, compare-at, מסים וכללי מבצע מכוונים
- תמונות מוצר ביחסי גודל עקביים ו-alt text שימושי
- וריאציות לא זמינות מוצגות בצורה ברורה
- קולקציות כוללות את המוצרים הנכונים וכללי מיון נכונים
- פילטרים לא יוצרים מצבים ריקים ומבלבלים
- חיפוש מחזיר תוצאות טובות לפי מותג, מוצר, SKU ושגיאות נפוצות
- המלצות מוצר מספיק רלוונטיות כדי להופיע

ב-SEO, המטרה היא לא לדחוף מילות מפתח לכל קולקציה. המטרה היא להפוך כל מוצר וקולקציה חשובים למספיק שימושיים כדי לדרג ולהמיר. [מדריך ה-Shopify SEO שלנו](/blog/shopify-seo-complete-guide) נכנס עמוק יותר למבנה מוצרים וקולקציות.

## 2. QA לתבנית, מהירות ומובייל

תבנית Shopify מוכנה להשקה צריכה להיות נוחה בדפדפן של הצוות ועמידה בדפדפנים של הלקוחות.

בדקו את החנות על:

- iPhone עדכני
- מכשיר Android עדכני אם אפשר
- דפדפן desktop
- חיבור מובייל איטי יותר
- viewport מובייל קטן ונפוץ

עברו את כל המסלול: דף בית, מוצר, עגלה, checkout ודף תודה. אל תעצרו בתבנית המוצר.

חפשו:

- קפיצות layout אחרי טעינת תמונות או app blocks
- כפתורים שקשה ללחוץ עליהם
- ברים דביקים, צ׳אט, פופאפים או באנרי consent שמסתירים פעולות קנייה
- פילטרים או תפריטים שתופסים פוקוס מקלדת
- מדיה של מוצרים שנטענת מאוחר מדי
- cart drawers שנשברים עם הנחות, באנדלים או מנויים
- טקסט שנשבר רע בעברית או באנגלית
- טפסים שפותחים מקלדת מובייל לא נכונה

אם הביצועים כבר שבירים, יום ההשקה יחשוף את זה מהר. השתמשו ב[מדריך האצת Shopify](/blog/speed-up-shopify-store) וב[Store speed vs conversion](/blog/store-speed-vs-conversion) כדי לתעדף תיקונים שמשפיעים על קנייה, לא רק על ציון מעבדה.

## 3. תשלומים, משלוחים, מסים ו-Markets

מסלול checkout הוא המקום שבו ביטחון ההשקה הופך למציאות. בדקו אותו עם הגדרות אמיתיות והזמנות בדיקה מבוקרות.

בדקו תשלומים:

- ספקי התשלום הרצויים פעילים
- test mode מוסר רק בנקודה הנכונה ברצף ההשקה
- ארנקים מהירים מופיעים במקום הצפוי
- מצבי כשל בתשלום מובנים
- אישור ההזמנה וסטטוס התשלום תואמים
- הצוות יודע לבצע החזרים וביטולים

בדקו משלוחים:

- אזורי משלוח תואמים לשווקים שבהם מוכרים בפועל
- תעריפים נכונים לגדלי עגלה נפוצים
- סף משלוח חינם עובד
- איסוף עצמי, משלוח מקומי או תעריפי carrier לא נחשפים בטעות
- למוצרים גדולים, רגישים, קרים או מוגבלים יש כללים נכונים

בדקו מסים ומכסים:

- הגדרות מס תואמות לאזורים שבהם לעסק יש חובות
- מחירים והודעות מס ברורים לשווקי היעד
- ציפיות על מכסים או יבוא בינלאומי לא מוסתרות עד הרגע האחרון
- חשבוניות, קבלות והתראות משתמשות בפרטי העסק הנכונים

למכירה בינלאומית, Shopify Markets יכול לשלוט בדומיינים, קטלוגים, מטבעות והגדרות לפי אזור. התיעוד של Shopify גם מציין ששינוי או מחיקה של Markets יכולים להשפיע על עבודה של subfolders, ולכן החלטות Markets צריכות לבוא לפני בדיקות URL והפניות.

## 4. בדיקות checkout והמרה

צוותי השקה מתמקדים יותר מדי בדף הבית. לקוחות שופטים את החנות ברגע הסיכון: עגלה, checkout, תשלום ואישור.

הריצו בדיקות checkout עבור:

- לקוח חדש
- לקוח חוזר
- לקוח מובייל
- קוד הנחה
- סף משלוח חינם
- מוצר חסר או כמעט חסר במלאי
- כתובת בינלאומית
- תשלום שנכשל
- gift card או store credit אם משתמשים בהם
- מנוי או preorder אם קיימים

אחר כך בדקו את החיכוך:

- האם עלויות משלוח ברורות מספיק מוקדם?
- האם העגלה מסבירה מה קורה בהמשך?
- האם שדה הנחה מעודד חיפוש קופונים?
- האם מידע על החזרות ומשלוח נגיש לפני התשלום?
- האם שמות אמצעי התשלום מוכרים לשוק היעד?
- האם דף התודה מסביר ללקוח למה לצפות?

אם ה-checkout כבר לא ממיר טוב, אל תקברו את הבעיה בתוך ההשקה. אבחנו אותה עם [מדריך Shopify checkout optimization](/blog/shopify-checkout-optimization) ו[צ׳ק ליסט בדיקת המרה](/blog/conversion-audit-checklist).

## 5. SEO, כתובות URL והפניות

זה החלק בהשקת Shopify שעלול לעלות חודשים בשקט.

בחנות חדשה, הסיכון המרכזי הוא השקת עמודים דלים, לא ברורים או לא ניתנים לאינדוקס. במיגרציה או עיצוב מחדש, הסיכון הגדול יותר הוא שינוי כתובות בלי לשמר אותות קיימים.

לפני ההשקה, ודאו:

- לכל מוצר, קולקציה, פוסט ועמוד נחיתה חשובים יש title ו-meta description מכוונים
- לעמודי קולקציה יש תוכן תומך כשזה מתאים
- עמודי staging, בדיקה, כפילות או פילטרים לא מאונדקסים בטעות
- canonical מצביע לכתובת production המועדפת
- קישורים פנימיים משתמשים במבנה ה-URL הסופי
- alt text של תמונות מתאר את התמונה
- sitemap זמין אחרי ההשקה
- robots לא חוסם עמודים חשובים
- כתובות ישנות מופנות לכתובת החדשה הכי רלוונטית
- מוצרים שנמחקו מופנים למוצר חלופי, קולקציה אם רלוונטית או חלופה שימושית

התיעוד של Shopify על URL redirects מסביר שהפניות עוזרות ללקוחות להגיע לעמוד הנכון אחרי שינוי כתובת. במיגרציה, יצאו את רשימת ה-URL הישנים לפני ההשקה ובדקו ידנית את הכתובות החשובות ביותר, במיוחד עמודים עם קישורים חיצוניים, תנועה אורגנית או תנועה מאימייל.

אל תפנו הכל לדף הבית. זה בדרך כלל חלש למשתמשים וחלש למנועי חיפוש. מפו מוצר ישן למוצר חדש, קטגוריה ישנה לקולקציה חדשה, ותוכן ישן לתוכן הקרוב ביותר.

## 6. אפליקציות, אינטגרציות ואוטומציה

כל אפליקציה מותקנת היא חלק משטח ההשקה. חלק משפיעות על מהירות. חלק על checkout. חלק על מלאי, מנויים, ביקורות, חיפוש, פרסונליזציה, החזרות, מסים או fulfillment.

צרו inventory לאפליקציות:

- שם האפליקציה
- בעלים
- מטרה
- עמודים מושפעים
- נתונים שאליהם יש גישה
- בעלים לחיוב
- theme code או app block
- קריטית להשקה או אופציונלית
- תוכנית rollback או כיבוי

לאחר מכן בדקו אינטגרציות לפי workflow, לא לפי שם אפליקציה.

לדוגמה:

- הזמנה ב-Shopify יוצרת פעולת fulfillment נכונה
- סנכרון מלאי מעדכן את Shopify בלי כפילויות
- מערכת האימייל מקבלת event נכון ומצב consent נכון
- widget ביקורות נטען בלי לחסום תוכן מוצר
- יצוא ל-ERP או הנהלת חשבונות מטפל בהחזרים, הנחות, מסים ומשלוח
- מערכת support מקבלת הקשר של לקוח והזמנה

אם ערימת האפליקציות כבר עמוסה, [מדריך אופטימיזציית אפליקציות Shopify](/blog/shopify-apps-optimization-guide) יעזור להחליט מה נשאר, מה מחליפים ומה מסירים לפני ההשקה.

## 7. QA לאנליטיקס ואירועים

השקה בלי אנליטיקס היא השקה בלי זיכרון.

לפני ההשקה, ודאו:

- GA4 מותקן ומקבל תנועה
- אירוע purchase נשלח פעם אחת, לא פעמיים
- מטבע וערכי הכנסה נכונים
- אירועי checkout ועגלה תואמים למימוש הנוכחי
- פיקסלים של מדיה ממומנת מותקנים איפה שצריך
- consent תואם למדיניות העסק
- תנועת צוות פנימית מסוננת או מסומנת ככל האפשר
- שינויים בהשקה מסומנים בדוחות
- Search Console וה-sitemap מוכנים

בדקו אנליטיקס עם מסלול גלישה אמיתי:

1. כניסה מכתובת בדיקה עם UTM
2. צפייה במוצר
3. הוספה לעגלה
4. התחלת checkout
5. השלמת הזמנת בדיקה
6. אימות ההזמנה וההכנסה בכלי הדיווח

אם האתר משתמש גם באנגלית וגם בעברית, ודאו שהשפה וה-path מדווחים נכון כדי שהצוות יוכל להשוות ביצועים בלי לערבב מסעות שונים.

## 8. תוכן, מדיניות ואמון

פערי אמון הופכים לכרטיסי תמיכה אחרי ההשקה.

בדקו:

- מדיניות משלוחים
- החזרות והחלפות
- פרטיות
- תנאי שימוש
- פרטי קשר
- אחריות או הבטחה
- מדריכי מידות או תאימות
- FAQ
- אימייל אישור הזמנה
- אימייל abandoned checkout
- מיתוג אימיילים טרנזקציונליים

ודאו שהמדיניות גלויה במקומות שבהם הלקוח צריך ביטחון. מדיניות החזרות שקיימת רק בפוטר אולי קיימת טכנית, אבל היא לא עוזרת לקונה מהסס בעמוד מוצר או ב-checkout.

בחנות דו-לשונית, בדקו את התוכן בעברית ישירות. קל לפספס drift בתרגום אם הצוות בודק רק את המסע באנגלית.

## 9. מוכנות תפעול ותמיכה

החנות לא באמת הושקה כשהדף הראשי גלוי. היא הושקה כשהצוות יכול לעבד הזמנות אמיתיות ברוגע.

ודאו:

- מי מנטר את ההזמנות הראשונות
- מי אחראי על חריגות fulfillment
- מי עונה לתמיכת לקוחות
- איך מטפלים בהחזרים וביטולים
- איך מסלימים פערי מלאי
- איך מטפלים בבדיקות fraud
- איך מדווחים על באגים קריטיים
- מי יכול לעצור קמפיינים אם checkout נכשל
- מי יכול להחזיר theme אחורה אם צריך

צרו רשימת קשר ליום ההשקה עם שמות, תפקידים וסמכות החלטה. אל תבנו תוכנית שבה כולם "זמינים" אבל אף אחד לא מחליט.

## 10. רצף השקה ותוכנית rollback

כתבו את רצף ההשקה לפני יום ההשקה.

רצף מעשי יכול להיראות כך:

1. מקפיאים שינויי תוכן ואפליקציות לא חיוניים
2. מאשרים גיבויים, גרסת theme ותוכנית DNS
3. מאמתים מוצרים, קולקציות, מדיניות והתראות סופיים
4. מפעילים קונפיגורציית תשלום סופית
5. מחברים או מחליפים דומיין
6. מסירים סיסמת חנות בזמן הנכון
7. בודקים דף בית, קולקציה, מוצר, עגלה, checkout, תשלום ודף תודה
8. בודקים הפניות ו-sitemap
9. מבצעים ומבטלים הזמנה מבוקרת
10. מסמנים את ההשקה באנליטיקס
11. מנטרים הזמנות, שגיאות, מהירות ותמיכה
12. מקיימים review אחרי 24 עד 72 שעות

Rollback לא תמיד אומר להוריד את החנות. לפעמים זה להחזיר theme קודם, לכבות app block לא קריטי, לעצור קמפיינים, להחזיר הגדרת DNS או להסתיר זמנית מוצר בעייתי.

העניין הוא להחליט על המהלכים האלה לפני שהלחץ מגיע.

## צ׳ק ליסט קצר להשקת Shopify

השתמשו בזה כסבב אחרון.

- [ ] עמודי מוצר וקולקציה חשובים מלאים
- [ ] מסלול מוצר, עגלה ו-checkout במובייל נבדק
- [ ] תשלומים פעילים ו-test mode מטופל בכוונה
- [ ] אזורי משלוח, תעריפים וספים מאומתים
- [ ] מסים, מכסים ו-Markets נבדקו
- [ ] הנחות, gift cards, מנויים ו-preorders נבדקו אם קיימים
- [ ] אימיילים טרנזקציונליים נבדקו
- [ ] titles, descriptions, canonical, sitemap ו-robots נבדקו
- [ ] כתובות ישנות מופו לכתובות חדשות רלוונטיות
- [ ] GA4, פיקסלים, purchase events ו-Search Console אומתו
- [ ] לאפליקציות ואינטגרציות יש בעלים ודרך rollback
- [ ] לתמיכה, fulfillment, החזרים וחריגות מלאי יש בעלים
- [ ] רצף ההשקה כתוב
- [ ] תוכנית rollback כתובה
- [ ] חלון ניטור אחרי ההשקה נקבע

## מה CartShift Studio בודקת לפני השקה

כשאנחנו בודקים השקת Shopify, פחות מעניין אותנו אם לכל משימה יש וי ויותר מעניין אם המערכת תחזיק מפגש ראשון עם לקוחות אמיתיים.

לכן אנחנו מסתכלים על המעבר בין עמודים, לא רק על העמודים עצמם:

- הבטחת מוצר לציפיית עגלה
- ציפיית עגלה למציאות checkout
- מציאות checkout לתפעול הזמנה
- מבנה URL לנראות אורגנית
- אירועי אנליטיקס להחלטות אחרי ההשקה

אם אתם קרובים להשקה והצ׳ק ליסט מעלה יותר שאלות מתשובות, זה טוב. זה אומר שתוכנית ההשקה עושה את העבודה לפני שהלקוחות מוצאים את הפערים.

[דברו עם CartShift Studio](/contact) אם אתם רוצים בדיקת השקת Shopify, QA למיגרציה או תוכנית go-live לפני שהחנות מתחילה לקבל הזמנות אמיתיות.
