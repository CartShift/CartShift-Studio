export interface ProspectReviewFinding {
  title: string;
  observedUrl: string;
  evidenceExcerpt: string;
  category: string;
  verificationStatus: string;
}
export interface ProspectReviewBriefInput {
  brandName: string;
  canonicalDomain: string;
  storeUrl: string;
  platform: string;
  sourceUrl: string;
  findings: ProspectReviewFinding[];
}
/**
 * Builds a research handoff for manual work with ChatGPT. No prompts are sent
 * to a model, no private contact data is included, and claims stay unverified.
 */
export function buildProspectReviewBrief(input: ProspectReviewBriefInput, locale: 'he' | 'en'): string {
  const he = locale === 'he';
  const header = he ? 'תיק סקירה מסחרית – למחקר ולאימות אנושי' : 'Sales opportunity review — manual verification required';
  const evidence = input.findings.length ? input.findings.map((finding, index) =>
    [
      (index + 1) + '. ' + finding.title,
      '   - ' + (he ? 'קטגוריה' : 'Category') + ': ' + finding.category,
      '   - ' + (he ? 'מקור' : 'Source') + ': ' + finding.observedUrl,
      '   - ' + (he ? 'ראיה ראשונית' : 'Candidate evidence') + ': ' + finding.evidenceExcerpt,
      '   - ' + (he ? 'סטטוס אימות' : 'Verification') + ': ' + finding.verificationStatus,
    ].join('\n')).join('\n') :
    (he ? 'אין עדיין ממצאים מתועדים. יש להתחיל בסקירה ידנית של האתר.' :
      'No saved findings yet. Start with a manual storefront review.');
  return [
    '# ' + header,
    '',
    (he ? 'מותג' : 'Store') + ': ' + input.brandName,
    (he ? 'דומיין' : 'Domain') + ': ' + input.canonicalDomain,
    'URL: ' + input.storeUrl,
    (he ? 'מקור מחקר' : 'Research source') + ': ' + input.sourceUrl,
    (he ? 'פלטפורמה שזוהתה' : 'Detected platform') + ': ' + input.platform,
    '',
    '## ' + (he ? 'ממצאים קיימים — אינם בהכרח מאומתים' : 'Existing findings — not necessarily verified'),
    evidence,
    '',
    '## ' + (he ? 'משימת הסקירה' : 'Review objectives'),
    he
      ? 'בדוק את החנות בצורה מדויקת ומבוססת מקורות: UX, חוויית מובייל, דפי מוצר, ביצועים, נגישות, SEO והזדמנויות Shopify. הפרד עובדות מאומתות מהשערות, הוסף קישורי מקור ורמות ביטחון, והצע 3 שיפורים ישימים שרלוונטיים באמת לעסק. אל תמציא נתוני המרה או הפסדים כספיים. אל תפנה לחנות או תשלח הודעות.'
      : 'Inspect the storefront using source-backed evidence: UX, mobile, product pages, performance, accessibility, SEO and relevant Shopify opportunities. Separate verified facts from hypotheses, attach source URLs and confidence, and recommend three business-relevant improvements. Do not invent conversion or lost-revenue figures. Do not contact the store.',
  ].join('\n');
}
