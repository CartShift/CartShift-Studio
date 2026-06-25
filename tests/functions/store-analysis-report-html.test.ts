import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { buildStoreAnalysisReportHtml } = require('../../functions/lib/store-analysis-report-html');

const heTexts = {
  headline: 'ניתוח החנות המעמיק שלך מוכן!',
  badge: 'דוח מקיף',
  greeting: 'שלום,',
  introText: 'טקסט פתיחה',
  overallScoreLabel: 'ציון בריאות כללי',
  scoreBreakdownTitle: 'פירוט ציון לפי קטגוריה',
  scoreBreakdownSubtitle: 'פירוט הציון לפי קטגוריה',
  priorityFixesTitle: 'בעיות בעדיפות גבוהה לתיקון ראשון',
  priorityFixesSubtitle: 'כדאי להתחיל מכאן',
  detailedFindingsTitle: 'ניתוח מפורט לפי קטגוריה',
  detailedFindingsSubtitle: 'מה נבדק בכל קטגוריה',
  allRecommendationsTitle: 'רשימת המלצות מלאה',
  allRecommendationsSubtitle: 'רשימה מלאה עם צעדי פעולה',
  proTipLabel: 'תובנה מקצועית',
  proTipText: 'טקסט תובנה',
  ctaTitle: 'מוכנים לתקן?',
  ctaText: 'קבעו שיחה',
  ctaButtonText: 'קבעו שיחה חינם',
  analyzedUrl: 'כתובת שנותחה',
  footerText: 'נוצר על ידי CartShift Studio',
  revenueImpactTitle: 'השפעת הכנסות פוטנציאלית',
  revenueImpactText: 'הערכת טווח שמרנית לשיפור אפשרי בהמרות.',
  whatWeFound: 'מה מצאנו',
  howToFix: 'איך לתקן',
  noCriticalIssuesFound: 'לא נמצאו בעיות קריטיות.',
  noSpecificFindings: 'אין ממצאים ספציפיים להצגה.',
  noIssuesInAnyCategory: 'לא זוהו בעיות.',
  issueSingular: 'בעיה',
  issuePlural: 'בעיות',
  passedSingular: 'בדיקה שעברה',
  passedPlural: 'בדיקות שעברו',
  itemSingular: 'המלצה',
  itemPlural: 'המלצות',
  taskSingular: 'משימה',
  taskPlural: 'משימות',
  scoreStatus: {
    excellent: 'מצוין',
    good: 'טוב',
    warning: 'דורש שיפור',
    critical: 'קריטי',
  },
  sections: {
    performance: 'ביצועים',
    seo: 'SEO טכני',
    accessibility: 'נגישות',
    bestPractices: 'שיטות מומלצות',
    cart: "עגלה וצ'קאאוט",
    trust: 'אמון ואמינות',
  },
  sectionDescriptions: {
    performance: 'תיאור ביצועים',
    seo: 'תיאור SEO',
    accessibility: 'תיאור נגישות',
    bestPractices: 'תיאור שיטות מומלצות',
    cart: 'תיאור עגלה',
    trust: 'תיאור אמון',
  },
  impact: {
    high: 'השפעה גבוהה',
    medium: 'בינוני',
    low: 'נמוך',
  },
  deeperScanTitle: 'ראיות מסריקה עמוקה',
  deeperScanSubtitle: 'דגימות קטגוריה, מוצר ועגלה',
  deeperScanCategoryPages: 'עמודי קטגוריה',
  deeperScanProductPages: 'עמודי מוצר',
  deeperScanCartInteraction: 'אינטראקציית עגלה',
  deeperScanSucceeded: '{count} הצליחו',
  deeperScanAttempted: '{count} נוסו',
  deeperScanAvailable: 'זמין',
  deeperScanNotVerified: 'לא אומת',
  deeperScanUnavailableTitle: 'סריקה עמוקה לא זמינה',
  deeperScanUnavailableText: 'דגימת דפדפן לא הייתה זמינה.',
  deeperScanEvidence: 'ראיות',
  actionRoadmapTitle: 'מפת דרכים ל-30 יום',
  actionRoadmapSubtitle: 'צעדים מתועדפים',
  week1: 'שבוע 1: תיקונים קריטיים',
  week2: 'שבוע 2: ביצועים',
  week3: 'שבוע 3: SEO ואמון',
  week4: 'שבוע 4: אופטימיזציה',
  findingTitles: {
    'High script count': 'כמות סקריפטים גבוהה',
    'Lazy loading detected': 'זוהתה טעינה עצלה',
    'Total Blocking Time': 'זמן חסימה כולל',
  },
  findingDescriptions: {
    'Detected many script tags.': 'זוהתה כמות גבוהה של תגיות סקריפט.',
    'Images use lazy loading.': 'התמונות משתמשות בטעינה עצלה.',
  },
  recommendationTitles: {
    'Reduce storefront JavaScript': 'צמצום JavaScript בחנות',
    'Reduce JavaScript blocking time': 'צמצום זמן חסימת JavaScript',
  },
  recommendationDescriptions: {
    'Too many scripts slow down rendering and can delay menus, filters, and add-to-cart interactions.':
      'יותר מדי סקריפטים מאטים את הרינדור.',
    'Heavy JavaScript blocks interaction and makes filters, menus, and add-to-cart actions feel laggy.':
      'JavaScript כבד חוסם אינטראקציה.',
  },
  recommendationActions: {
    'Audit theme/app scripts, remove unused tags, and defer anything not needed for first render.':
      'בדקו סקריפטים של התבנית והאפליקציות.',
    'Remove unused scripts, defer third-party tags, split large bundles, and audit apps/plugins loaded on every page.':
      'הסירו סקריפטים לא בשימוש ודחו תגיות צד שלישי.',
  },
  evidenceTemplates: {
    scriptTagsDetected: 'זוהו {count} תגיות סקריפט.',
    millisecondsSavings: 'פוטנציאל חיסכון של {ms} מילישניות.',
  },
  actionSteps: {},
};

const sampleResults = {
  overallScore: 85,
  deeperScan: {
    available: true,
    categoryPagesAttempted: 1,
    categoryPagesSucceeded: 1,
    productPagesAttempted: 2,
    productPagesSucceeded: 1,
    cartInteractionSucceeded: true,
    categorySamples: [{ evidence: ['זוהו 12 קישורי מוצר'] }],
    productSamples: [{ evidence: ['כפתור הוספה לעגלה זוהה'] }],
    cartInteraction: {
      evidence: ['checkout link/control detected after click'],
    },
    limitations: [],
  },
  sections: {
    performance: {
      name: 'Performance',
      score: 60,
      findings: [
        { type: 'issue', title: 'High script count', description: 'Detected many script tags.' },
        {
          type: 'positive',
          title: 'Lazy loading detected',
          description: 'Images use lazy loading.',
        },
      ],
      recommendations: [
        {
          impact: 'high',
          title: 'Reduce storefront JavaScript',
          description:
            'Too many scripts slow down rendering and can delay menus, filters, and add-to-cart interactions.',
          action:
            'Audit theme/app scripts, remove unused tags, and defer anything not needed for first render.',
          evidence: '60 script tags were detected.',
        },
      ],
    },
  },
};

describe('buildStoreAnalysisReportHtml', () => {
  it('renders Hebrew PDF HTML without hard-coded English report chrome', () => {
    const html = buildStoreAnalysisReportHtml(sampleResults, 'https://cart-shift.com', heTexts, true);

    expect(html).toContain('data-template="store-analysis-pdf"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('כדאי להתחיל מכאן');
    expect(html).toContain('מה נבדק בכל קטגוריה');
    expect(html).toContain('רשימה מלאה עם צעדי פעולה');
    expect(html).toContain('ראיות מסריקה עמוקה');
    expect(html).toContain('עמודי קטגוריה');
    expect(html).toContain('זוהו 12 קישורי מוצר');
    expect(html).toContain('צמצום JavaScript בחנות');
    expect(html).toContain('זוהו 60 תגיות סקריפט.');
    expect(html).not.toContain('Critical issues to address first');
    expect(html).not.toContain('What we checked in each category');
    expect(html).not.toContain('Complete list with action steps');
    expect(html).not.toContain('1 tasks');
    expect(html).not.toContain('1 items');
  });

  it('uses bidi isolation for scores, urls, and current footer year', () => {
    const html = buildStoreAnalysisReportHtml(sampleResults, 'https://cart-shift.com', heTexts, true);

    expect(html).toContain('dir="ltr"');
    expect(html).toContain('85');
    expect(html).toContain('/100');
    expect(html).toContain(String(new Date().getFullYear()));
    expect(html).not.toContain('&copy; 2025 CartShift Studio');
  });

  it('localizes Lighthouse-derived recommendation strings and evidence patterns', () => {
    const lighthouseResults = {
      overallScore: 72,
      sections: {
        performance: {
          name: 'Performance',
          score: 58,
          findings: [
            {
              type: 'issue',
              title: 'Total Blocking Time',
              description: 'Est savings of 1,240 ms',
            },
          ],
          recommendations: [
            {
              impact: 'high',
              title: 'Reduce JavaScript blocking time',
              description:
                'Heavy JavaScript blocks interaction and makes filters, menus, and add-to-cart actions feel laggy.',
              action:
                'Remove unused scripts, defer third-party tags, split large bundles, and audit apps/plugins loaded on every page.',
              evidence: 'Est savings of 1,240 ms',
            },
          ],
        },
      },
    };

    const html = buildStoreAnalysisReportHtml(lighthouseResults, 'https://cart-shift.com', heTexts, true);

    expect(html).toContain('צמצום זמן חסימת JavaScript');
    expect(html).toContain('JavaScript כבד חוסם אינטראקציה.');
    expect(html).toContain('הסירו סקריפטים לא בשימוש ודחו תגיות צד שלישי.');
    expect(html).toContain('פוטנציאל חיסכון של 1,240 מילישניות.');
    expect(html).not.toContain('Est savings of 1,240 ms');
  });

  it('escapes dynamic audit content rendered through raw HTML sections', () => {
    const unsafeResults = {
      overallScore: 60,
      deeperScan: {
        available: true,
        categoryPagesAttempted: 1,
        categoryPagesSucceeded: 1,
        productPagesAttempted: 0,
        productPagesSucceeded: 0,
        cartInteractionSucceeded: false,
        categorySamples: [{ evidence: ['<img src=x onerror=alert(2)>'] }],
        productSamples: [],
        limitations: ['<script>alert("deep")</script>'],
      },
      sections: {
        performance: {
          name: 'Performance',
          score: 60,
          findings: [
            {
              type: 'issue',
              title: '<script>alert("x")</script>',
              description: '<img src=x onerror=alert(1)>',
            },
          ],
          recommendations: [
            {
              impact: 'high',
              title: '<script>alert("x")</script>',
              description: '<img src=x onerror=alert(1)>',
              action: '<b>fix</b>',
              evidence: '<svg onload=alert(1)>',
            },
          ],
        },
      },
    };

    const html = buildStoreAnalysisReportHtml(unsafeResults, 'https://cart-shift.com', heTexts, true);

    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(2)&gt;');
    expect(html).toContain('&lt;script&gt;alert(&quot;deep&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });
});
