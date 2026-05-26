const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const {
  sendEmailWithLogging,
  sendBatchEmails,
  parseWebhookEvent,
  handleWebhookEvent,
  generateIdempotencyKey,
  addToAudience,
} = require('./lib/emails/email-service');

admin.initializeApp();

const contactRateLimitMap = new Map();
const newsletterRateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const CONTACT_RATE_LIMIT_MAX_REQUESTS = 5;
const NEWSLETTER_RATE_LIMIT_MAX_REQUESTS = 3;

// Default company contact email from environment or fallback
const DEFAULT_CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@cart-shift.com';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  : [
      'https://cart-shift.com',
      'https://www.cart-shift.com',
      'https://portal.cart-shift.com',
      'http://localhost:3000',
    ];

function applyCors(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.length > 0) {
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    res.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    res.set('Vary', 'Origin');
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }

  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}

function getRateLimitKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function checkRateLimit(map, key, maxRequests) {
  const now = Date.now();
  const record = map.get(key);

  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

async function checkFirestoreRateLimit(key, maxRequests, windowMs = 60 * 60 * 1000) {
  const ref = admin
    .firestore()
    .collection('rate_limits')
    .doc(key.replace(/[^a-zA-Z0-9]/g, '_')); // Sanitize key

  try {
    return await admin.firestore().runTransaction(async t => {
      const doc = await t.get(ref);
      const now = Date.now();

      if (!doc.exists) {
        t.set(ref, { count: 1, resetTime: now + windowMs });
        return true;
      }

      const data = doc.data();

      if (now > data.resetTime) {
        t.set(ref, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (data.count >= maxRequests) {
        return false;
      }

      t.update(ref, { count: admin.firestore.FieldValue.increment(1) });
      return true;
    });
  } catch (e) {
    console.error('Rate limit transaction error:', e);
    // Fail open (allow request) if DB check fails to avoid blocking users during outages
    return true;
  }
}

const resendApiKey = defineSecret('RESEND_API_KEY', { required: false });
const resendWebhookSecret = defineSecret('RESEND_WEBHOOK_SECRET', { required: false });
const contactEmail = defineSecret('CONTACT_EMAIL', { required: false });
const pagespeedApiKey = defineSecret('PAGESPEED_API_KEY', { required: false });
const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY', { required: false });
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'https://portal.cart-shift.com';
const MARKETING_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

async function sendPortalEmail(to, subject, templateName, data, options = {}) {
  const { tags = [], uniqueId, scheduledAt } = options;

  const enhancedTags = [
    ...tags,
    ...(data.orgId ? [{ name: 'org_id', value: data.orgId }] : []),
    ...(data.requestId ? [{ name: 'request_id', value: data.requestId }] : []),
  ];

  return sendEmailWithLogging(admin, resendApiKey.value(), {
    to,
    subject,
    templateName,
    data,
    tags: enhancedTags,
    idempotencyKey: uniqueId
      ? generateIdempotencyKey(to, subject, templateName, uniqueId)
      : undefined,
    scheduledAt,
  });
}

// ============================================
// MARKETING FUNNEL HELPERS
// ============================================

const MARKETING_SEQUENCE_ID = 'cartshift_project_inquiry_v1';
const MARKETING_JOB_BATCH_SIZE = 25;

const MARKETING_SEQUENCE_STEPS = [
  {
    stepId: 'welcome',
    delayDays: 0,
    kind: 'welcome',
    en: {
      subject: 'Welcome to CartShift Studio',
      eyebrow: 'CartShift Studio',
      title: 'You are on the list. Now let us make this useful.',
      intro:
        'Most ecommerce growth problems are not mysterious. They are usually hiding in speed, trust, product pages, checkout flow, or unclear positioning.',
      bullets: [
        'We will send practical fixes you can evaluate without jargon.',
        'When the timing is right, you can send us the project details and we will map the right next move.',
      ],
      cta: 'Start a project inquiry',
      preheader: 'A practical ecommerce growth sequence from CartShift Studio.',
    },
    he: {
      subject: 'ברוכים הבאים ל-CartShift Studio',
      eyebrow: 'CartShift Studio',
      title: 'אתם ברשימה. עכשיו נהפוך את זה לשימושי.',
      intro:
        'רוב בעיות הצמיחה באיקומרס לא מסתוריות. הן בדרך כלל מסתתרות במהירות, אמון, עמודי מוצר, צ׳קאאוט או מיצוב לא מספיק חד.',
      bullets: [
        'נשלח תיקונים פרקטיים שאפשר לבחון בלי רעש מקצועי מיותר.',
        'כשהתזמון נכון, תוכלו לשלוח לנו פרטי פרויקט ונמפה את הצעד הנכון.',
      ],
      cta: 'שליחת פרטי פרויקט',
      preheader: 'רצף פרקטי לצמיחת איקומרס מ-CartShift Studio.',
    },
  },
  {
    stepId: 'leaking-revenue',
    delayDays: 1,
    kind: 'score',
    en: {
      subject: 'Your store is leaking revenue in places you can fix',
      eyebrow: 'Day 1',
      title: 'The first job is finding the expensive friction.',
      intro:
        'A weak score is not a verdict. It is a map. The fastest wins usually come from issues shoppers feel before they can explain them.',
      bullets: [
        'Slow first load makes paid traffic more expensive.',
        'Weak trust cues make shoppers hesitate near checkout.',
        'Unclear product pages force motivated buyers to think too hard.',
      ],
      cta: 'Send us the project details',
      preheader: 'Use your store score as a prioritization map, not just a report card.',
    },
    he: {
      subject: 'החנות שלכם מאבדת הכנסות במקומות שאפשר לתקן',
      eyebrow: 'יום 1',
      title: 'השלב הראשון הוא לזהות חיכוך יקר.',
      intro:
        'ציון נמוך הוא לא פסק דין. הוא מפה. הניצחונות המהירים מגיעים בדרך כלל מבעיות שקונים מרגישים לפני שהם יודעים להסביר.',
      bullets: [
        'טעינה איטית מייקרת טראפיק ממומן.',
        'סימני אמון חלשים יוצרים היסוס ליד הצ׳קאאוט.',
        'עמודי מוצר לא ברורים גורמים לקונים לחשוב יותר מדי.',
      ],
      cta: 'שליחת פרטי פרויקט',
      preheader: 'השתמשו בציון החנות כמפת תיעדוף, לא רק כתעודה.',
    },
  },
  {
    stepId: 'three-fixes',
    delayDays: 3,
    kind: 'education',
    en: {
      subject: 'The 3 fixes we would prioritize first',
      eyebrow: 'Day 3',
      title: 'Do not fix everything. Fix the sequence that changes behavior.',
      intro:
        'A strong ecommerce optimization plan has order. We start where the buyer journey is most fragile and where implementation risk is lowest.',
      bullets: [
        'Clarify the promise above the fold.',
        'Make product and checkout trust visible at the decision moment.',
        'Remove speed and mobile friction before scaling traffic.',
      ],
      cta: 'Get a project roadmap',
      preheader: 'A practical order of operations for improving store conversion.',
    },
    he: {
      subject: 'שלושת התיקונים שהיינו מתעדפים קודם',
      eyebrow: 'יום 3',
      title: 'לא מתקנים הכל. מתקנים את הרצף שמשנה התנהגות.',
      intro:
        'תכנית אופטימיזציה טובה לחנות צריכה סדר. מתחילים במקום שבו מסע הקנייה הכי רגיש והסיכון הטכני הכי נמוך.',
      bullets: [
        'לחדד את ההבטחה בחלק העליון של העמוד.',
        'להציג אמון בעמוד מוצר ובצ׳קאאוט ברגע ההחלטה.',
        'להסיר חיכוך מהירות ומובייל לפני שמגדילים טראפיק.',
      ],
      cta: 'קבלת מפת פרויקט',
      preheader: 'סדר פעולה פרקטי לשיפור המרה בחנות.',
    },
  },
  {
    stepId: 'professional-rebuild',
    delayDays: 5,
    kind: 'process',
    en: {
      subject: 'What a professional rebuild actually changes',
      eyebrow: 'Day 5',
      title: 'A rebuild is not a prettier theme. It is a better selling system.',
      intro:
        'The visual layer matters, but the real value is in structure: merchandising, UX logic, performance, analytics, and a backend your team can keep using.',
      bullets: [
        'Cleaner information architecture makes products easier to buy.',
        'Reusable sections let you launch campaigns faster.',
        'Analytics and events make future decisions less emotional.',
      ],
      cta: 'Tell us what you want rebuilt',
      preheader: 'The difference between surface redesign and a store that sells better.',
    },
    he: {
      subject: 'מה ריבילד מקצועי באמת משנה',
      eyebrow: 'יום 5',
      title: 'ריבילד הוא לא תבנית יפה יותר. הוא מערכת מכירה טובה יותר.',
      intro:
        'השכבה הוויזואלית חשובה, אבל הערך האמיתי נמצא במבנה: מרצ׳נדייזינג, UX, ביצועים, אנליטיקה ובקאנד שהצוות יכול להמשיך לתפעל.',
      bullets: [
        'ארכיטקטורת מידע נקייה מקלה על רכישה.',
        'סקשנים לשימוש חוזר מאפשרים להשיק קמפיינים מהר יותר.',
        'אנליטיקה ואיוונטים הופכים החלטות עתידיות לפחות רגשיות.',
      ],
      cta: 'ספרו לנו מה צריך לבנות מחדש',
      preheader: 'ההבדל בין עיצוב מחדש שטחי לבין חנות שמוכרת טוב יותר.',
    },
  },
  {
    stepId: 'case-study-proof',
    delayDays: 8,
    kind: 'proof',
    en: {
      subject: 'Proof: how better store structure creates confidence',
      eyebrow: 'Day 8',
      title: 'Buyers trust what feels deliberate.',
      intro:
        'Good ecommerce work makes the brand feel sharper and the next action feel obvious. That is the pattern across the strongest CartShift projects.',
      bullets: [
        'Category context reduces uncertainty.',
        'Stronger product storytelling raises confidence.',
        'A cleaner buying path makes the store feel more serious.',
      ],
      cta: 'Start your project inquiry',
      preheader: 'A case-study angle on turning store structure into buyer confidence.',
    },
    he: {
      subject: 'הוכחה: איך מבנה חנות טוב יותר יוצר ביטחון',
      eyebrow: 'יום 8',
      title: 'קונים סומכים על חוויה שמרגישה מכוונת.',
      intro:
        'עבודת איקומרס טובה מחדדת את המותג והופכת את הפעולה הבאה לברורה. זה הדפוס בפרויקטים החזקים של CartShift.',
      bullets: [
        'הקשר קטגוריאלי מוריד אי-ודאות.',
        'סטוריטלינג מוצרי חזק מעלה ביטחון.',
        'מסלול קנייה נקי גורם לחנות להרגיש רצינית יותר.',
      ],
      cta: 'התחלת פנייה לפרויקט',
      preheader: 'זווית קייס סטאדי על הפיכת מבנה חנות לביטחון קנייה.',
    },
  },
  {
    stepId: 'objections',
    delayDays: 12,
    kind: 'objection',
    en: {
      subject: 'Cost, timing, risk: the honest version',
      eyebrow: 'Day 12',
      title: 'A good project should reduce uncertainty before it adds scope.',
      intro:
        'You do not need to commit to a giant rebuild to get clarity. The right first conversation should expose priority, timeline, risk, and the business case.',
      bullets: [
        'We separate must-fix issues from nice-to-have polish.',
        'We protect live stores from avoidable migration and launch risk.',
        'We recommend scope based on ROI, not feature excitement.',
      ],
      cta: 'Share your constraints',
      preheader: 'How to think about ecommerce project scope without overcommitting.',
    },
    he: {
      subject: 'עלות, תזמון וסיכון: הגרסה הכנה',
      eyebrow: 'יום 12',
      title: 'פרויקט טוב צריך להוריד אי-ודאות לפני שהוא מוסיף סקופ.',
      intro:
        'לא צריך להתחייב לריבילד ענק כדי לקבל בהירות. שיחה ראשונה נכונה צריכה לחשוף תיעדוף, לו״ז, סיכון והיגיון עסקי.',
      bullets: [
        'נפריד בין בעיות שחייבים לתקן לבין פוליש נחמד.',
        'נגן על חנויות פעילות מסיכוני מיגרציה והשקה מיותרים.',
        'נמליץ על סקופ לפי ROI, לא לפי התלהבות מפיצ׳רים.',
      ],
      cta: 'שתפו את האילוצים שלכם',
      preheader: 'איך לחשוב על סקופ איקומרס בלי להתחייב יותר מדי.',
    },
  },
  {
    stepId: 'project-inquiry',
    delayDays: 18,
    kind: 'conversion',
    en: {
      subject: 'Ready to turn this into a project?',
      eyebrow: 'Day 18',
      title: 'Send us the store, the goal, and what feels stuck.',
      intro:
        'If the store matters to revenue this quarter, the useful next step is not more generic tips. It is a clear project brief and a sharp recommendation.',
      bullets: [
        'Tell us what platform you are on.',
        'Share what you want improved first.',
        'We will respond with the right project direction.',
      ],
      cta: 'Submit a project inquiry',
      preheader: 'Turn the audit into a concrete project brief.',
    },
    he: {
      subject: 'מוכנים להפוך את זה לפרויקט?',
      eyebrow: 'יום 18',
      title: 'שלחו לנו את החנות, המטרה ומה מרגיש תקוע.',
      intro:
        'אם החנות חשובה להכנסות ברבעון הקרוב, הצעד הבא הוא לא עוד טיפים כלליים. הוא בריף ברור והמלצה חדה.',
      bullets: [
        'ספרו לנו על איזו פלטפורמה אתם עובדים.',
        'שתפו מה תרצו לשפר קודם.',
        'נחזור עם כיוון הפרויקט הנכון.',
      ],
      cta: 'שליחת פנייה לפרויקט',
      preheader: 'להפוך את האודיט לבריף פרויקט קונקרטי.',
    },
  },
  {
    stepId: 'breakup',
    delayDays: 28,
    kind: 'breakup',
    en: {
      subject: 'Should we close the loop?',
      eyebrow: 'Day 28',
      title: 'One last practical nudge.',
      intro:
        'If improving the store is still on the table, send us the URL and the one thing you most want fixed. We will help you decide whether it is worth a project.',
      bullets: [
        'No pressure to start big.',
        'No vague pitch deck.',
        'Just a practical read on the next best move.',
      ],
      cta: 'Send the store URL',
      preheader: 'A final check-in from CartShift Studio.',
    },
    he: {
      subject: 'נסגור מעגל?',
      eyebrow: 'יום 28',
      title: 'דחיפה פרקטית אחרונה.',
      intro:
        'אם שיפור החנות עדיין על השולחן, שלחו לנו את ה-URL ואת הדבר האחד שהכי חשוב לכם לתקן. נעזור להבין אם זה שווה פרויקט.',
      bullets: [
        'אין צורך להתחיל גדול.',
        'אין מצגת מכירה מעורפלת.',
        'רק קריאה פרקטית של הצעד הנכון הבא.',
      ],
      cta: 'שליחת URL של החנות',
      preheader: 'צ׳ק-אין אחרון מ-CartShift Studio.',
    },
  },
];

function normalizeMarketingEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function getMarketingLeadId(email) {
  return crypto
    .createHash('sha256')
    .update(normalizeMarketingEmail(email))
    .digest('hex')
    .slice(0, 32);
}

function getScoreBand(score) {
  if (typeof score !== 'number') return 'unknown';
  if (score < 40) return 'critical';
  if (score < 70) return 'warning';
  if (score < 85) return 'good';
  return 'excellent';
}

function getLeadScoreDelta(data = {}) {
  let score = 0;
  if (data.source === 'contact_form') score += 60;
  if (data.source === 'store_analyzer') score += 20;
  if (data.source === 'newsletter' || data.source === 'newsletter_footer') score += 5;
  if (data.source === 'blog_sidebar') score += 8;
  if (data.source === 'blog_cta' || data.source === 'service_page_cta') score += 10;

  if (typeof data.overallScore === 'number') {
    if (data.overallScore < 50) score += 15;
    else if (data.overallScore < 70) score += 8;
  }

  return score;
}

function getMarketingLocale(locale) {
  return locale === 'he' ? 'he' : 'en';
}

function isStoreAnalyzerLead(lead) {
  const sources = [lead?.primarySource, lead?.latestSource].filter(Boolean);
  return sources.includes('store_analyzer');
}

function getSequenceStepDelayDays(step, lead) {
  const score = lead?.overallScore;
  if (!isStoreAnalyzerLead(lead) || typeof score !== 'number') {
    return step.delayDays;
  }

  if (score < 50) {
    if (step.stepId === 'project-inquiry') return Math.max(1, step.delayDays - 6);
    if (step.stepId === 'breakup') return Math.max(3, step.delayDays - 10);
    if (step.stepId === 'objections') return Math.max(2, step.delayDays - 4);
  }

  return step.delayDays;
}

function resolveMarketingStepCopy(step, lead) {
  const score = lead?.overallScore;
  if (!isStoreAnalyzerLead(lead) || typeof score !== 'number') {
    return step;
  }

  const resolved = {
    ...step,
    en: { ...step.en },
    he: { ...step.he },
  };

  if (score < 50 && step.stepId === 'leaking-revenue') {
    resolved.en.subject = 'Critical store issues are costing you sales';
    resolved.en.title = 'Your score signals urgent fixes, not cosmetic polish.';
    resolved.he.subject = 'בעיות קריטיות בחנות עולות לכם במכירות';
    resolved.he.title = 'הציון שלכם מסמן תיקונים דחופים, לא שיפורי פני שטח.';
  }

  if (score >= 80 && step.stepId === 'professional-rebuild') {
    resolved.en.subject = 'Your store is strong — time to optimize for growth';
    resolved.en.title = 'High scores usually mean the next wins are strategic, not emergency fixes.';
    resolved.en.intro =
      'You already cleared the basics. The next layer is merchandising depth, campaign velocity, and sharper analytics.';
    resolved.he.subject = 'החנות חזקה — הגיע הזמן לאופטימיזציה לצמיחה';
    resolved.he.title = 'ציון גבוה בדרך כלל אומר שהניצחונות הבאים אסטרטגיים, לא חירום.';
    resolved.he.intro =
      'כבר עברתם את הבסיס. השכבה הבאה היא עומק מרצ׳נדייזינג, מהירות קמפיינים ואנליטיקה חדה יותר.';
  }

  if (score >= 80 && step.stepId === 'case-study-proof') {
    resolved.en.subject = 'How strong stores unlock the next revenue tier';
    resolved.en.title = 'Growth-focused stores compound small UX wins into bigger AOV and repeat rate.';
    resolved.he.subject = 'איך חנויות חזקות פותחות את מדרגת ההכנסה הבאה';
    resolved.he.title = 'חנויות ממוקדות צמיחה מכפילות שיפורי UX קטנים ל-AOV וחזרה גבוהים יותר.';
  }

  if (score >= 80 && step.stepId === 'objections') {
    resolved.en.subject = 'Scaling a healthy store without unnecessary risk';
    resolved.en.title = 'The right next project should expand revenue, not rebuild what already works.';
    resolved.en.intro =
      'When the fundamentals are solid, scope should focus on campaigns, merchandising systems, and measurable experiments.';
    resolved.he.subject = 'לסקל חנות בריאה בלי סיכון מיותר';
    resolved.he.title = 'הפרויקט הנכון הבא צריך להרחיב הכנסות, לא לבנות מחדש מה שכבר עובד.';
    resolved.he.intro =
      'כשהיסודות יציבים, הסקופ צריך להתמקד בקמפיינים, מערכות מרצ׳נדייזינג וניסויים מדידים.';
  }

  return resolved;
}

function getMarketingContactUrl(locale, leadId) {
  const lang = getMarketingLocale(locale);
  const url = new URL(`/${lang}/contact`, MARKETING_SITE_URL);
  url.searchParams.set('utm_source', 'email');
  url.searchParams.set('utm_medium', 'nurture');
  url.searchParams.set('utm_campaign', MARKETING_SEQUENCE_ID);
  url.searchParams.set('lead', leadId);
  return url.toString();
}

function getUnsubscribeUrl(lead, locale) {
  const url = new URL('/api/marketing/unsubscribe', MARKETING_SITE_URL);
  url.searchParams.set('leadId', lead.leadId);
  url.searchParams.set('token', lead.unsubscribeToken);
  url.searchParams.set('locale', getMarketingLocale(locale));
  return url.toString();
}

function getClickUrl(lead, job, targetUrl) {
  const url = new URL('/api/marketing/click', MARKETING_SITE_URL);
  url.searchParams.set('leadId', lead.leadId);
  url.searchParams.set('token', lead.unsubscribeToken);
  url.searchParams.set('target', targetUrl);
  if (job?.id) url.searchParams.set('jobId', job.id);
  return url.toString();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarketingEmail({ lead, job, step }) {
  const resolvedStep = resolveMarketingStepCopy(step, lead);
  const locale = getMarketingLocale(lead.locale);
  const copy = resolvedStep[locale] || resolvedStep.en;
  const isRtl = locale === 'he';
  const dir = isRtl ? 'rtl' : 'ltr';
  const textAlign = isRtl ? 'right' : 'left';
  const scoreBand = lead.scoreBand && lead.scoreBand !== 'unknown' ? lead.scoreBand : null;
  const platform = lead.platform || (locale === 'he' ? 'החנות' : 'your store');
  const contactUrl = getMarketingContactUrl(locale, lead.leadId);
  const ctaUrl = getClickUrl(lead, job, contactUrl);
  const unsubscribeUrl = getUnsubscribeUrl(lead, locale);
  const scoreLine =
    scoreBand && typeof lead.overallScore === 'number'
      ? locale === 'he'
        ? `בהתבסס על ציון ${lead.overallScore}/100, החנות מסומנת כ-${scoreBand}.`
        : `Based on a ${lead.overallScore}/100 score, ${platform} is currently in the ${scoreBand} band.`
      : locale === 'he'
        ? 'המסר הבא מבוסס על דפוסי איקומרס שאנחנו רואים שוב ושוב.'
        : 'This note is based on ecommerce patterns we see repeatedly.';
  const footerText =
    locale === 'he'
      ? 'קיבלתם את האימייל כי ביקשתם תובנות מ-CartShift Studio.'
      : 'You received this because you asked CartShift Studio for ecommerce insights.';

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#070a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#f8fafc;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(copy.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070a12;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0f172a;border:1px solid rgba(148,163,184,.22);border-radius:18px;overflow:hidden;direction:${dir};">
            <tr>
              <td style="padding:34px 30px 18px;text-align:${textAlign};background:#0b1120;">
                <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#1d4ed8;color:#dbeafe;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(copy.eyebrow)}</div>
                <h1 style="margin:18px 0 12px;color:#ffffff;font-size:30px;line-height:1.12;font-weight:900;">${escapeHtml(copy.title)}</h1>
                <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.7;">${escapeHtml(copy.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;text-align:${textAlign};background:#0b1120;">
                <div style="border:1px solid rgba(59,130,246,.35);background:rgba(59,130,246,.12);border-radius:14px;padding:16px;color:#bfdbfe;font-size:14px;line-height:1.65;">${escapeHtml(scoreLine)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;text-align:${textAlign};background:#ffffff;color:#0f172a;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${copy.bullets
                    .map(
                      item =>
                        `<tr><td style="padding:0 0 14px;color:#334155;font-size:15px;line-height:1.65;"><span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:#2563eb;margin-inline-end:10px;"></span>${escapeHtml(item)}</td></tr>`
                    )
                    .join('')}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                  <tr>
                    <td style="border-radius:10px;background:#2563eb;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:15px 24px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;">${escapeHtml(copy.cta)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 30px;text-align:center;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;">
                ${escapeHtml(footerText)}<br>
                <a href="${unsubscribeUrl}" style="color:#475569;text-decoration:underline;">${locale === 'he' ? 'הסרה מרשימת התפוצה' : 'Unsubscribe'}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function recordMarketingEvent(leadId, type, data = {}) {
  await admin
    .firestore()
    .collection('marketing_events')
    .add({
      leadId,
      type,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function isMarketingLeadUnsubscribed(leadId) {
  const unsubDoc = await admin.firestore().collection('marketing_unsubscribes').doc(leadId).get();
  return unsubDoc.exists;
}

async function upsertMarketingLead(data) {
  const email = normalizeMarketingEmail(data.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Valid email is required');
  }

  const leadId = getMarketingLeadId(email);
  const ref = admin.firestore().collection('marketing_leads').doc(leadId);
  const source = data.source || 'website';
  const locale = getMarketingLocale(data.locale);
  const scoreDelta = getLeadScoreDelta({ ...data, source });
  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : {};
    const unsubscribeToken = existing.unsubscribeToken || crypto.randomBytes(24).toString('hex');
    const marketingConsent =
      typeof data.consent === 'boolean'
        ? data.consent
        : source === 'contact_form'
          ? false
          : data.subscribeNewsletter !== false;
    const isConverted = source === 'contact_form';

    tx.set(
      ref,
      {
        leadId,
        email,
        normalizedEmail: email,
        locale,
        name: data.name || existing.name || null,
        company: data.company || existing.company || null,
        interest: data.interest || existing.interest || null,
        projectType: data.projectType || existing.projectType || null,
        storeUrl: data.storeUrl || existing.storeUrl || null,
        platform: data.platform || existing.platform || null,
        overallScore:
          typeof data.overallScore === 'number' ? data.overallScore : existing.overallScore || null,
        scoreBand:
          typeof data.overallScore === 'number'
            ? getScoreBand(data.overallScore)
            : existing.scoreBand || 'unknown',
        primarySource: existing.primarySource || source,
        latestSource: source,
        sources: admin.firestore.FieldValue.arrayUnion(source),
        marketingConsent,
        subscribeNewsletter:
          data.subscribeNewsletter === true || existing.subscribeNewsletter || false,
        funnelStage: isConverted ? 'converted' : existing.funnelStage || 'nurture',
        conversionStatus: isConverted ? 'project_inquiry' : existing.conversionStatus || 'lead',
        leadScore: admin.firestore.FieldValue.increment(scoreDelta),
        unsubscribeToken,
        lastEngagedAt: now,
        updatedAt: now,
        createdAt: existing.createdAt || now,
      },
      { merge: true }
    );
  });

  await recordMarketingEvent(
    leadId,
    source === 'contact_form' ? 'project_inquiry_started' : 'marketing_lead_created',
    {
      source,
      locale,
      metadata: data.metadata || null,
    }
  );

  const leadSnap = await ref.get();
  return { leadId, lead: leadSnap.data() };
}

async function enrollMarketingSequence(leadId, lead, options = {}) {
  if (!lead?.marketingConsent || lead.conversionStatus === 'project_inquiry') return false;
  if (await isMarketingLeadUnsubscribed(leadId)) return false;

  const batch = admin.firestore().batch();
  const now = Date.now();
  const steps = options.skipWelcome
    ? MARKETING_SEQUENCE_STEPS.filter(step => step.stepId !== 'welcome')
    : MARKETING_SEQUENCE_STEPS;

  steps.forEach(step => {
    const jobId = `${leadId}_${MARKETING_SEQUENCE_ID}_${step.stepId}`;
    const jobRef = admin.firestore().collection('marketing_email_jobs').doc(jobId);
    const delayDays = getSequenceStepDelayDays(step, lead);
    batch.set(
      jobRef,
      {
        id: jobId,
        leadId,
        email: lead.email,
        locale: getMarketingLocale(lead.locale),
        sequenceId: MARKETING_SEQUENCE_ID,
        stepId: step.stepId,
        status: 'pending',
        dueAt: admin.firestore.Timestamp.fromDate(
          new Date(now + delayDays * 24 * 60 * 60 * 1000)
        ),
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
  await admin.firestore().collection('marketing_leads').doc(leadId).set(
    {
      sequenceId: MARKETING_SEQUENCE_ID,
      sequenceEnrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await recordMarketingEvent(leadId, 'marketing_sequence_enrolled', {
    sequenceId: MARKETING_SEQUENCE_ID,
    skipWelcome: !!options.skipWelcome,
  });
  return true;
}

async function captureAndEnrollMarketingLead(data, options = {}) {
  const { leadId, lead } = await upsertMarketingLead(data);
  await enrollMarketingSequence(leadId, lead, options);
  return { leadId, lead };
}

async function sendMarketingJob(jobDoc) {
  const job = { id: jobDoc.id, ...jobDoc.data() };
  const jobRef = jobDoc.ref;
  const leadRef = admin.firestore().collection('marketing_leads').doc(job.leadId);
  const leadSnap = await leadRef.get();

  if (!leadSnap.exists) {
    await jobRef.update({ status: 'canceled', cancelReason: 'missing_lead' });
    return;
  }

  const lead = leadSnap.data();
  if (!lead.marketingConsent || lead.conversionStatus === 'project_inquiry') {
    await jobRef.update({ status: 'canceled', cancelReason: 'not_eligible' });
    return;
  }

  if (await isMarketingLeadUnsubscribed(job.leadId)) {
    await jobRef.update({ status: 'canceled', cancelReason: 'unsubscribed' });
    return;
  }

  const step = MARKETING_SEQUENCE_STEPS.find(item => item.stepId === job.stepId);
  if (!step) {
    await jobRef.update({ status: 'canceled', cancelReason: 'unknown_step' });
    return;
  }

  const resolvedStep = resolveMarketingStepCopy(step, lead);
  const copy = resolvedStep[getMarketingLocale(lead.locale)] || resolvedStep.en;
  const { Resend } = require('resend');
  const resend = new Resend(resendApiKey.value());
  const html = renderMarketingEmail({ lead, job, step: resolvedStep });

  await jobRef.update({
    status: 'sending',
    attempts: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    const result = await resend.emails.send({
      from: 'CartShift Studio <nurture@cart-shift.com>',
      to: lead.email,
      subject: copy.subject,
      html,
      reply_to: DEFAULT_CONTACT_EMAIL,
      tags: [
        { name: 'type', value: 'marketing_nurture' },
        { name: 'sequence', value: MARKETING_SEQUENCE_ID },
        { name: 'step', value: step.stepId },
      ],
    });

    await jobRef.update({
      status: 'sent',
      resendEmailId: result?.data?.id || null,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await leadRef.set(
      {
        lastEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEmailStepId: step.stepId,
        funnelStage: step.kind === 'conversion' ? 'conversion_push' : 'nurture',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await recordMarketingEvent(job.leadId, 'marketing_email_sent', {
      jobId: job.id,
      stepId: step.stepId,
      sequenceId: MARKETING_SEQUENCE_ID,
    });
  } catch (error) {
    console.error('[Marketing] Failed to send job', job.id, error);
    await jobRef.update({
      status: 'failed',
      error: error.message || 'Unknown send failure',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

exports.marketingCapture = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { leadId } = await captureAndEnrollMarketingLead(req.body, {
        skipWelcome: !!req.body.skipWelcome,
      });
      return res.status(200).json({ success: true, leadId });
    } catch (error) {
      console.error('[Marketing] Capture error:', error);
      return res.status(400).json({ error: error.message || 'Failed to capture lead' });
    }
  }
);

exports.marketingUnsubscribe = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (!['GET', 'POST'].includes(req.method)) {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const leadId = req.body?.leadId || req.query.leadId;
      const token = req.body?.token || req.query.token;
      if (!leadId || !token) return res.status(400).json({ error: 'Missing unsubscribe token' });

      const leadRef = admin.firestore().collection('marketing_leads').doc(leadId);
      const leadSnap = await leadRef.get();
      if (!leadSnap.exists || leadSnap.data().unsubscribeToken !== token) {
        return res.status(403).json({ error: 'Invalid unsubscribe token' });
      }

      const batch = admin.firestore().batch();
      batch.set(admin.firestore().collection('marketing_unsubscribes').doc(leadId), {
        leadId,
        email: leadSnap.data().email,
        unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(
        leadRef,
        {
          marketingConsent: false,
          funnelStage: 'unsubscribed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const pendingJobs = await admin
        .firestore()
        .collection('marketing_email_jobs')
        .where('leadId', '==', leadId)
        .where('status', '==', 'pending')
        .get();
      pendingJobs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'canceled',
          cancelReason: 'unsubscribed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      await recordMarketingEvent(leadId, 'marketing_unsubscribed');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Marketing] Unsubscribe error:', error);
      return res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  }
);

exports.marketingTrackClick = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
      const leadId = req.body?.leadId || req.query.leadId;
      const token = req.body?.token || req.query.token;
      const jobId = req.body?.jobId || req.query.jobId || null;
      const targetUrl = req.body?.targetUrl || req.query.target || null;
      if (!leadId || !token) return res.status(400).json({ error: 'Missing click token' });

      const leadRef = admin.firestore().collection('marketing_leads').doc(leadId);
      const leadSnap = await leadRef.get();
      if (!leadSnap.exists || leadSnap.data().unsubscribeToken !== token) {
        return res.status(403).json({ error: 'Invalid click token' });
      }

      await leadRef.set(
        {
          leadScore: admin.firestore.FieldValue.increment(15),
          lastClickedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastEngagedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (jobId) {
        await admin.firestore().collection('marketing_email_jobs').doc(jobId).set(
          {
            clickedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await recordMarketingEvent(leadId, 'marketing_email_clicked', { jobId, targetUrl });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Marketing] Click tracking error:', error);
      return res.status(500).json({ error: 'Failed to track click' });
    }
  }
);

exports.marketingTrackEngagement = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { leadId, ctaText, ctaLocation, intent, source } = req.body || {};
      if (!leadId || !ctaLocation) {
        return res.status(400).json({ error: 'leadId and ctaLocation are required' });
      }

      const leadRef = admin.firestore().collection('marketing_leads').doc(String(leadId));
      const leadSnap = await leadRef.get();
      if (!leadSnap.exists) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const updatePayload = {
        leadScore: admin.firestore.FieldValue.increment(10),
        lastCtaClickedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEngagedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (source) {
        updatePayload.latestSource = String(source);
        updatePayload.sources = admin.firestore.FieldValue.arrayUnion(String(source));
      }

      await leadRef.set(updatePayload, { merge: true });

      await recordMarketingEvent(String(leadId), 'marketing_cta_clicked', {
        ctaText: ctaText || null,
        ctaLocation,
        intent: intent || 'project_inquiry',
        source: source || null,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Marketing] Engagement tracking error:', error);
      return res.status(500).json({ error: 'Failed to track engagement' });
    }
  }
);

exports.processMarketingEmailJobs = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Asia/Jerusalem',
    secrets: [resendApiKey],
    maxInstances: 1,
  },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await admin
      .firestore()
      .collection('marketing_email_jobs')
      .where('status', '==', 'pending')
      .where('dueAt', '<=', now)
      .orderBy('dueAt', 'asc')
      .limit(MARKETING_JOB_BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      console.log('[Marketing] No due email jobs.');
      return;
    }

    for (const doc of snapshot.docs) {
      await sendMarketingJob(doc);
    }
  }
);

// Helper to generate and upload invoice PDF
async function saveInvoicePDF(request) {
  try {
    const orgSnap = await admin
      .firestore()
      .collection('portal_organizations')
      .doc(request.orgId)
      .get();
    if (!orgSnap.exists) return;
    const organization = orgSnap.data();

    const pdfBuffer = await new Promise((resolve, reject) => {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header - Simplified design for PDFKit compatibility
      doc.fillColor('#2563eb').fontSize(24).text('CartShift Studio', 50, 50);
      doc.fillColor('#6b7280').fontSize(10).text('Premium E-commerce Development', 50, 80);

      doc.fillColor('#111827').fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
      doc
        .fillColor('#6b7280')
        .fontSize(10)
        .text(`#INV-${request.id.substring(0, 8).toUpperCase()}`, 400, 75, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 90, { align: 'right' });

      doc.moveDown(3);

      // Info Section
      const y1 = doc.y;
      doc.fillColor('#6b7280').fontSize(10).text('FROM', 50, y1);
      doc.fillColor('#1a1a1a').text('CartShift Studio', 50, y1 + 15);
      doc.text('Tel Aviv, Israel', 50, y1 + 30);
      doc.text('hello@cart-shift.com', 50, y1 + 45);

      doc.fillColor('#6b7280').text('BILL TO', 350, y1);
      doc.fillColor('#1a1a1a').text(organization.name, 350, y1 + 15);
      doc.text(`Org ID: ${request.orgId}`, 350, y1 + 30);
      if (organization.website) doc.text(organization.website, 350, y1 + 45);

      doc.moveDown(4);

      // Table Header
      const tableY = doc.y;
      doc.fillColor('#6b7280').fontSize(9).text('DESCRIPTION', 50, tableY);
      doc.text('QTY', 350, tableY, { width: 50, align: 'center' });
      doc.text('PRICE', 400, tableY, { width: 70, align: 'right' });
      doc.text('TOTAL', 470, tableY, { width: 70, align: 'right' });

      doc
        .moveTo(50, tableY + 15)
        .lineTo(540, tableY + 15)
        .strokeColor('#e5e7eb')
        .stroke();

      // Table Items
      let y = tableY + 25;
      const currency = request.currency === 'ILS' ? '₪' : '$';
      const items = request.lineItems || [
        { description: request.title, quantity: 1, unitPrice: request.totalAmount || 0 },
      ];

      items.forEach(item => {
        doc.fillColor('#111827').fontSize(10).text(item.description, 50, y);
        doc.text(item.quantity.toString(), 350, y, { width: 50, align: 'center' });
        doc.text(`${currency}${(item.unitPrice / 100).toLocaleString()}`, 400, y, {
          width: 70,
          align: 'right',
        });
        doc.text(
          `${currency}${((item.quantity * item.unitPrice) / 100).toLocaleString()}`,
          470,
          y,
          { width: 70, align: 'right' }
        );
        y += 20;
      });

      doc.moveTo(50, y).lineTo(540, y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(2);

      // Summary
      const total = (request.totalAmount || 0) / 100;
      doc
        .fillColor('#111827')
        .fontSize(10)
        .text('Total Paid', 350, doc.y, { width: 100, align: 'right' });
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text(`${currency}${total.toLocaleString()}`, 450, doc.y - 4, {
          width: 90,
          align: 'right',
        });

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text('Thank you for your business. Generated by CartShift Studio Portal.', 50, 750, {
          align: 'center',
        });

      doc.end();
    });

    // Upload to Storage
    const bucket = admin.storage().bucket();
    const filePath = `portal_invoices/${request.orgId}/${request.id}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        firebaseStorageDownloadTokens: request.id, // Fixed token for easier access if public, or just use signed URLs
      },
    });

    // Update Request with Invoice URL (signed URL or standard path)
    await admin.firestore().collection('portal_requests').doc(request.id).update({
      invoicePath: filePath,
      invoiceGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Invoice saved for request ${request.id} at ${filePath}`);
  } catch (error) {
    console.error('Error generating/saving invoice:', error);
  }
}

async function getUserEmail(userId) {
  const userSnap = await admin.firestore().collection('portal_users').doc(userId).get();
  return userSnap.exists ? userSnap.data().email : null;
}

// Helper to create portal notifications
async function createNotification(userId, type, title, body, link) {
  if (!userId) return;
  try {
    await admin
      .firestore()
      .collection('portal_notifications')
      .add({
        userId,
        type,
        title,
        body,
        link: link || null,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

exports.contactForm = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey, contactEmail],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const rateLimitKey = getRateLimitKey(req);
      if (!checkRateLimit(contactRateLimitMap, rateLimitKey, CONTACT_RATE_LIMIT_MAX_REQUESTS)) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const { name, email, interest, message, company, projectType } = req.body;
      const locale = getMarketingLocale(req.body.locale);

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const teamEmail = contactEmail.value() || DEFAULT_CONTACT_EMAIL;
      const leadsUrl = `${PORTAL_BASE_URL}/${locale}/portal/agency/leads`;
      const notificationSubject =
        locale === 'he'
          ? `פנייה חדשה: ${name}${projectType ? ` — ${projectType}` : ''}`
          : `New inquiry: ${name}${projectType ? ` — ${projectType}` : ''}`;

      await sendPortalEmail(teamEmail, notificationSubject, 'contact_form_notification', {
        name,
        email,
        company: company || null,
        projectType: projectType || interest || null,
        message: message || null,
        locale,
        leadsUrl,
      }, {
        tags: [{ name: 'type', value: 'contact_form_notification' }],
        uniqueId: `contact_${getMarketingLeadId(email)}_${Date.now()}`,
      });

      await admin
        .firestore()
        .collection('contact_submissions')
        .add({
          name,
          email,
          interest: interest || null,
          message: message || null,
          company: company || null,
          projectType: projectType || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      await captureAndEnrollMarketingLead({
        email,
        name,
        company,
        interest,
        projectType,
        message,
        source: 'contact_form',
        locale,
        consent: false,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

exports.newsletterSubscription = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const rateLimitKey = getRateLimitKey(req);
      if (
        !checkRateLimit(newsletterRateLimitMap, rateLimitKey, NEWSLETTER_RATE_LIMIT_MAX_REQUESTS)
      ) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Add to Firestore
      await admin
        .firestore()
        .collection('newsletter_subscriptions')
        .add({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Add to Resend Audience
      await addToAudience(resendApiKey.value(), {
        email,
        firstName,
        lastName,
        source: 'newsletter',
        properties: {
          subscription_type: 'newsletter',
        },
      });

      await captureAndEnrollMarketingLead({
        email,
        name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        source: req.body.source || 'newsletter',
        locale: req.body.locale || 'en',
        subscribeNewsletter: true,
        consent: true,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// ============================================
// PORTAL NOTIFICATION TRIGGERS
// ============================================

// 1. New Request Trigger (Notify Admin)
exports.onPortalRequestCreated = onDocumentCreated(
  { document: 'portal_requests/{requestId}', secrets: [resendApiKey, contactEmail] },
  async event => {
    const requestData = event.data.data();
    const orgSnap = await admin
      .firestore()
      .collection('portal_organizations')
      .doc(requestData.orgId)
      .get();

    let toEmail = contactEmail.value() || DEFAULT_CONTACT_EMAIL;
    let orgName = 'Unknown Organization';

    if (orgSnap.exists) {
      const orgData = orgSnap.data();
      orgName = orgData.name;

      // Check for responsible agent
      if (orgData.responsibleAgencyUserId) {
        const agentEmail = await getUserEmail(orgData.responsibleAgencyUserId);
        if (agentEmail) {
          toEmail = agentEmail;
        }
      }
    }

    await sendPortalEmail(
      toEmail,
      `New Request: ${requestData.title}`,
      'new_request',
      {
        clientName: requestData.createdByName || 'A client',
        organizationName: orgName,
        requestTitle: requestData.title,
        requestDescription: requestData.description,
        requestType: requestData.type,
        requestPriority: requestData.priority,
        actionUrl: `${PORTAL_BASE_URL}/en/requests/${event.params.requestId}`,
        requestId: event.params.requestId,
        orgId: requestData.orgId,
      },
      {
        uniqueId: event.params.requestId,
        tags: [
          { name: 'request_type', value: requestData.type || 'unknown' },
          { name: 'priority', value: requestData.priority || 'normal' },
        ],
      }
    );

    // Create Notification for the agent/admin
    // If we have a specific agent, notify them, otherwise notify all agency admins
    let targetUserIds = [];
    if (orgSnap.exists && orgSnap.data().responsibleAgencyUserId) {
      targetUserIds.push(orgSnap.data().responsibleAgencyUserId);
    } else {
      const adminsSnap = await admin
        .firestore()
        .collection('portal_users')
        .where('isAgency', '==', true)
        .where('agencyRole', 'in', ['owner', 'admin'])
        .get();
      adminsSnap.forEach(doc => targetUserIds.push(doc.id));
    }

    for (const userId of [...new Set(targetUserIds)]) {
      await createNotification(
        userId,
        'request_created',
        'New Request Received',
        `${requestData.createdByName || 'A client'} from ${orgName} created: ${requestData.title}`,
        `/portal/requests/${event.params.requestId}`
      );
    }
  }
);

// 2. Request Updated Trigger (Notify Client on Status Change / Quote)
exports.onPortalRequestUpdated = onDocumentUpdated(
  { document: 'portal_requests/{requestId}', secrets: [resendApiKey] },
  async event => {
    const oldData = event.data.before.data();
    const newData = event.data.after.data();

    const clientEmail = await getUserEmail(newData.createdBy);
    if (!clientEmail) return;

    const requestUrl = `${PORTAL_BASE_URL}/en/requests/${event.params.requestId}`;

    // Detect Status Change
    if (oldData.status !== newData.status) {
      const statusConfigs = {
        IN_PROGRESS: { label: 'In Progress', style: 'background: #dbeafe; color: #1e40af;' },
        IN_REVIEW: { label: 'In Review', style: 'background: #fef3c7; color: #92400e;' },
        DELIVERED: { label: 'Delivered', style: 'background: #d1fae5; color: #065f46;' },
        PAID: { label: 'Paid', style: 'background: #ecfdf5; color: #065f46;' },
        CLOSED: { label: 'Closed', style: 'background: #f1f5f9; color: #475569;' },
      };

      const config = statusConfigs[newData.status];
      if (config) {
        await sendPortalEmail(
          clientEmail,
          `Update: ${newData.title}`,
          'status_update',
          {
            requestTitle: newData.title,
            statusLabel: config.label,
            statusStyle: config.style,
            actionUrl: requestUrl,
            requestId: event.params.requestId,
            orgId: newData.orgId,
          },
          {
            uniqueId: `${event.params.requestId}-status-${newData.status}`,
            tags: [{ name: 'new_status', value: newData.status }],
          }
        );

        // Notify Client
        await createNotification(
          newData.createdBy,
          'request_updated',
          'Request Status Updated',
          `Your request "${newData.title}" is now ${config.label}`,
          `/portal/requests/${event.params.requestId}`
        );
      }
    }

    // 2. Detect Milestone Completion
    if (newData.milestones && Array.isArray(newData.milestones)) {
      const oldMilestones = oldData.milestones || [];
      const milestoneEmails = [];

      newData.milestones.forEach((m, index) => {
        const oldM = oldMilestones[index];
        if (m.status === 'completed' && (!oldM || oldM.status !== 'completed')) {
          milestoneEmails.push(
            sendPortalEmail(
              clientEmail,
              `Milestone Completed: ${m.title}`,
              'milestone_completed',
              {
                requestTitle: newData.title,
                milestoneTitle: m.title,
                actionUrl: requestUrl,
                requestId: event.params.requestId,
                orgId: newData.orgId,
              },
              {
                uniqueId: `${event.params.requestId}-milestone-${index}`,
                tags: [{ name: 'milestone_index', value: String(index) }],
              }
            )
          );
        }
      });

      if (milestoneEmails.length > 0) {
        await Promise.all(milestoneEmails);

        // Notify Client for each completed milestone
        for (let i = 0; i < newData.milestones.length; i++) {
          const m = newData.milestones[i];
          const oldM = oldMilestones[i];
          if (m.status === 'completed' && (!oldM || oldM.status !== 'completed')) {
            await createNotification(
              newData.createdBy,
              'request_updated',
              'Milestone Completed',
              `Milestone "${m.title}" for your request "${newData.title}" has been completed.`,
              `/portal/requests/${event.params.requestId}`
            );
          }
        }
      }
    }

    // 3. Detect Quote added (New Quote)
    if (!oldData.isBillable && newData.isBillable && newData.status === 'QUOTED') {
      const currencySymbol = newData.currency === 'ILS' ? '₪' : '$';
      const totalFormatted = `${currencySymbol}${(newData.totalAmount / 100).toLocaleString()}`;

      await sendPortalEmail(
        clientEmail,
        `New Quote: ${newData.title}`,
        'quote_received',
        {
          requestTitle: newData.title,
          totalAmount: totalFormatted,
          actionUrl: requestUrl,
          requestId: event.params.requestId,
          orgId: newData.orgId,
        },
        {
          uniqueId: `${event.params.requestId}-quote`,
        }
      );

      // Notify Client
      await createNotification(
        newData.createdBy,
        'request_updated',
        'New Quote Received',
        `We've added a quote for "${newData.title}". Total: ${totalFormatted}`,
        `/portal/requests/${event.params.requestId}`
      );
    }

    // Detect Payment (Paid)
    if (!oldData.paidAt && newData.paidAt) {
      const currencySymbol = newData.currency === 'ILS' ? '₪' : '$';
      const totalFormatted = `${currencySymbol}${(newData.totalAmount / 100).toLocaleString()}`;

      await sendPortalEmail(
        clientEmail,
        `Payment Received: ${newData.title}`,
        'payment_receipt',
        {
          requestTitle: newData.title,
          totalAmount: totalFormatted,
          paymentId: newData.paymentId || 'N/A',
          actionUrl: requestUrl,
          requestId: event.params.requestId,
          orgId: newData.orgId,
        },
        {
          uniqueId: `${event.params.requestId}-payment-${newData.paymentId}`,
          tags: [{ name: 'payment_id', value: newData.paymentId || 'unknown' }],
        }
      );

      // Generate and store Invoice PDF
      await saveInvoicePDF(newData);

      // Notify Responsible Agent/Admin about payment
      const orgSnap = await admin
        .firestore()
        .collection('portal_organizations')
        .doc(newData.orgId)
        .get();
      if (orgSnap.exists && orgSnap.data().responsibleAgencyUserId) {
        await createNotification(
          orgSnap.data().responsibleAgencyUserId,
          'request_updated',
          'Payment Received',
          `Payment received for "${newData.title}" (${totalFormatted})`,
          `/portal/requests/${event.params.requestId}`
        );
      }
    }
  }
);

// 3. New Comment Trigger
exports.onPortalCommentCreated = onDocumentCreated(
  { document: 'portal_comments/{commentId}', secrets: [resendApiKey, contactEmail] },
  async event => {
    const commentData = event.data.data();
    if (commentData.isInternal) return; // Don't notify for internal comments

    const requestSnap = await admin
      .firestore()
      .collection('portal_requests')
      .doc(commentData.requestId)
      .get();
    if (!requestSnap.exists) return;
    const requestData = requestSnap.data();

    const authorId = commentData.userId;
    const isAgencyAuthor = authorId === 'agency' || authorId.includes('agency'); // Rough check, improved below

    // Try to find if the user is agency
    const authorSnap = await admin.firestore().collection('portal_users').doc(authorId).get();
    const isAgency = authorSnap.exists ? authorSnap.data().isAgency : false;

    let targetEmail;

    if (isAgency) {
      // Agency commented -> Notify client
      targetEmail = await getUserEmail(requestData.createdBy);
    } else {
      // Client commented -> Notify responsible agent or admin
      targetEmail = contactEmail.value() || DEFAULT_CONTACT_EMAIL;

      // Fetch org to check for responsible agent
      const orgSnap = await admin
        .firestore()
        .collection('portal_organizations')
        .doc(commentData.orgId)
        .get();
      if (orgSnap.exists) {
        const orgData = orgSnap.data();
        if (orgData.responsibleAgencyUserId) {
          const agentEmail = await getUserEmail(orgData.responsibleAgencyUserId);
          if (agentEmail) {
            targetEmail = agentEmail;
          }
        }
      }
    }

    if (!targetEmail) return;

    await sendPortalEmail(
      targetEmail,
      `New message: ${requestData.title}`,
      'new_comment',
      {
        userName: commentData.userName,
        requestTitle: requestData.title,
        commentText: commentData.content,
        actionUrl: `${PORTAL_BASE_URL}/en/requests/${commentData.requestId}`,
        requestId: commentData.requestId,
        orgId: commentData.orgId,
      },
      {
        uniqueId: event.params.commentId,
        tags: [{ name: 'comment_author', value: isAgency ? 'agency' : 'client' }],
      }
    );

    // Create Notification
    if (isAgency) {
      // Agency commented -> Notify client
      await createNotification(
        requestData.createdBy,
        'comment_added',
        'New Message',
        `${commentData.userName} sent a message on "${requestData.title}"`,
        `/portal/requests/${commentData.requestId}`
      );
    } else {
      // Client commented -> Notify responsible agent or agency admins
      const orgSnap = await admin
        .firestore()
        .collection('portal_organizations')
        .doc(commentData.orgId)
        .get();
      let targetUserIds = [];
      const responsibleAgentId = orgSnap.exists && orgSnap.data().responsibleAgencyUserId;

      if (responsibleAgentId) {
        targetUserIds.push(responsibleAgentId);
      } else {
        const adminsSnap = await admin
          .firestore()
          .collection('portal_users')
          .where('isAgency', '==', true)
          .where('agencyRole', 'in', ['owner', 'admin'])
          .get();
        adminsSnap.forEach(doc => targetUserIds.push(doc.id));
      }

      for (const userId of [...new Set(targetUserIds)]) {
        await createNotification(
          userId,
          'comment_added',
          'New Client Message',
          `${commentData.userName} sent a message on "${requestData.title}"`,
          `/portal/requests/${commentData.requestId}`
        );
      }
    }

    // NEW: Handle @mentions
    if (commentData.mentions && Array.isArray(commentData.mentions)) {
      for (const mentionedUserId of commentData.mentions) {
        if (mentionedUserId === authorId) continue;
        await createNotification(
          mentionedUserId,
          'mention',
          'You were mentioned',
          `${commentData.userName} mentioned you in a comment on "${requestData.title}"`,
          `/portal/requests/${commentData.requestId}`
        );
      }
    }
  }
);

// 4. File Upload Trigger
exports.onPortalFileCreated = onDocumentCreated(
  { document: 'portal_files/{fileId}', secrets: [resendApiKey, contactEmail] },
  async event => {
    const fileData = event.data.data();
    if (!fileData.uploadedBy) return;

    // Get author details
    const authorSnap = await admin
      .firestore()
      .collection('portal_users')
      .doc(fileData.uploadedBy)
      .get();
    const isAgency = authorSnap.exists ? authorSnap.data().isAgency : false;

    if (isAgency) {
      // Agency uploaded -> Notify client
      if (fileData.requestId) {
        const requestSnap = await admin
          .firestore()
          .collection('portal_requests')
          .doc(fileData.requestId)
          .get();
        if (requestSnap.exists) {
          await createNotification(
            requestSnap.data().createdBy,
            'request_updated',
            'New File Uploaded',
            `${fileData.uploadedByName} uploaded a file to "${requestSnap.data().title}": ${fileData.originalName}`,
            `/portal/requests/${fileData.requestId}`
          );
        }
      }
    } else {
      // Client uploaded -> Notify responsible agent or admins
      const orgSnap = await admin
        .firestore()
        .collection('portal_organizations')
        .doc(fileData.orgId)
        .get();
      let targetUserIds = [];
      const responsibleAgentId = orgSnap.exists && orgSnap.data().responsibleAgencyUserId;

      if (responsibleAgentId) {
        targetUserIds.push(responsibleAgentId);
      } else {
        const adminsSnap = await admin
          .firestore()
          .collection('portal_users')
          .where('isAgency', '==', true)
          .where('agencyRole', 'in', ['owner', 'admin'])
          .get();
        adminsSnap.forEach(doc => targetUserIds.push(doc.id));
      }

      const link = fileData.requestId ? `/portal/requests/${fileData.requestId}` : `/portal/files/`;
      const orgName = orgSnap.exists ? orgSnap.data().name : 'A client';

      for (const userId of [...new Set(targetUserIds)]) {
        await createNotification(
          userId,
          'request_updated',
          'Client Uploaded File',
          `${fileData.uploadedByName} from ${orgName} uploaded: ${fileData.originalName}`,
          link
        );
      }
    }
  }
);

// 5. Consultation Triggers
exports.onPortalConsultationCreated = onDocumentCreated(
  { document: 'portal_consultations/{consultationId}', secrets: [resendApiKey] },
  async event => {
    const data = event.data.data();
    const participants = data.participants || [];
    const dateStr =
      data.scheduledAt && data.scheduledAt.toDate
        ? data.scheduledAt.toDate().toLocaleString()
        : 'scheduled time';

    for (const userId of participants) {
      if (userId === data.createdBy) continue; // Don't notify the one who created/scheduled it

      const userSnap = await admin.firestore().collection('portal_users').doc(userId).get();
      const isAgency = userSnap.exists ? userSnap.data().isAgency : false;
      const link = isAgency ? '/portal/agency/consultations/' : '/portal/consultations/';

      await createNotification(
        userId,
        'request_updated',
        'Consultation Scheduled',
        `A new consultation "${data.title}" has been scheduled for ${dateStr}`,
        link
      );
    }
  }
);

exports.onPortalConsultationUpdated = onDocumentUpdated(
  { document: 'portal_consultations/{consultationId}', secrets: [resendApiKey] },
  async event => {
    const oldData = event.data.before.data();
    const newData = event.data.after.data();

    // Notify on status change or rescheduling
    if (
      oldData.status !== newData.status ||
      oldData.scheduledAt?.seconds !== newData.scheduledAt?.seconds
    ) {
      const participants = newData.participants || [];
      const dateStr =
        newData.scheduledAt && newData.scheduledAt.toDate
          ? newData.scheduledAt.toDate().toLocaleString()
          : 'scheduled time';

      let title = 'Consultation Updated';
      let body = `Consultation "${newData.title}" has been updated. Status: ${newData.status}`;

      if (oldData.scheduledAt?.seconds !== newData.scheduledAt?.seconds) {
        title = 'Consultation Rescheduled';
        body = `Consultation "${newData.title}" has been rescheduled to ${dateStr}`;
      } else if (newData.status === 'canceled') {
        title = 'Consultation Canceled';
        body = `Consultation "${newData.title}" has been canceled`;
      }

      for (const userId of participants) {
        const userSnap = await admin.firestore().collection('portal_users').doc(userId).get();
        const isAgency = userSnap.exists ? userSnap.data().isAgency : false;
        const link = isAgency ? '/portal/agency/consultations/' : '/portal/consultations/';

        await createNotification(userId, 'request_updated', title, body, link);
      }
    }
  }
);

// 6. Testimonial Trigger
exports.onPortalTestimonialCreated = onDocumentCreated(
  { document: 'portal_testimonials/{testimonialId}', secrets: [resendApiKey] },
  async event => {
    const data = event.data.data();

    // Notify all agency admins/owners
    const adminsSnap = await admin
      .firestore()
      .collection('portal_users')
      .where('isAgency', '==', true)
      .where('agencyRole', 'in', ['owner', 'admin'])
      .get();

    for (const doc of adminsSnap.docs) {
      await createNotification(
        doc.id,
        'request_updated',
        'New Testimonial',
        `New testimonial submitted by ${data.userName} from ${data.companyName}`,
        '/portal/agency/testimonials/'
      );
    }
  }
);

// ============================================
// GOOGLE CALENDAR OAUTH CALLBACK
// ============================================

const googleClientId = defineSecret('GOOGLE_CLIENT_ID', { required: false });
const googleClientSecret = defineSecret('GOOGLE_CLIENT_SECRET', { required: false });

exports.googleCalendarOAuthCallback = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [googleClientId, googleClientSecret],
  },
  async (req, res) => {
    if (!applyCors(req, res)) {
      return;
    }

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const clientId = googleClientId.value();
      const clientSecret = googleClientSecret.value();

      if (!clientId || !clientSecret) {
        console.error('[Google Calendar] Missing OAuth credentials');
        return res.status(500).json({
          success: false,
          message: 'Google OAuth not configured',
        });
      }

      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        console.error('[Google Calendar] Missing parameters:', {
          hasCode: !!code,
          hasRedirectUri: !!redirectUri,
        });
        return res.status(400).json({
          success: false,
          message: 'Missing code or redirectUri',
        });
      }

      console.log('[Google Calendar] Exchanging code for tokens');
      console.log('[Google Calendar] Redirect URI:', redirectUri);
      console.log('[Google Calendar] Client ID:', clientId.substring(0, 20) + '...');
      console.log('[Google Calendar] Code length:', code?.length || 0);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Google Calendar] Token exchange error:', errorText);
        let errorMessage = 'Failed to exchange code for tokens';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error_description || errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      const tokens = await tokenResponse.json();

      return res.status(200).json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        scope: tokens.scope,
      });
    } catch (error) {
      console.error('[Google Calendar] Callback API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ============================================
// GOOGLE CALENDAR HELPERS
// ============================================

// Helper to verify Firebase ID Token
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

// Helper to get a valid Google access token (refreshes if needed)
async function getValidGoogleToken(userId) {
  const integrationDoc = await admin
    .firestore()
    .collection('agency_integrations')
    .doc(`${userId}_google_calendar`)
    .get();
  if (!integrationDoc.exists) {
    throw new Error('Google Calendar not connected');
  }

  const data = integrationDoc.data();
  const now = Date.now();

  // Check if tokenExpiry exists and is a Timestamp
  let expiry = 0;
  if (data.tokenExpiry && typeof data.tokenExpiry.toDate === 'function') {
    expiry = data.tokenExpiry.toDate().getTime();
  } else if (data.tokenExpiry) {
    expiry = new Date(data.tokenExpiry).getTime();
  }

  // If token is still valid (with 5 min buffer), return it
  if (expiry > now + 5 * 60 * 1000) {
    return {
      accessToken: data.accessToken,
      selectedCalendarId: data.selectedCalendarId || 'primary',
    };
  }

  // Otherwise, refresh it
  if (!data.refreshToken) {
    throw new Error('Token expired and no refresh token available');
  }

  console.log(`Refreshing Google token for user ${userId}`);
  const clientId = googleClientId.value();
  const clientSecret = googleClientSecret.value();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on server');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to refresh Google token');
  }

  const tokens = await response.json();
  const accessToken = tokens.access_token;
  const newExpiry = new Date(now + tokens.expires_in * 1000);

  // Update Firestore
  await integrationDoc.ref.update({
    accessToken: accessToken,
    tokenExpiry: admin.firestore.Timestamp.fromDate(newExpiry),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    accessToken,
    selectedCalendarId: data.selectedCalendarId || 'primary',
  };
}

// ============================================
// GOOGLE CALENDAR API ROUTES
// ============================================

// 1. List Calendars
exports.googleCalendarListCalendars = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken } = await getValidGoogleToken(userId);

      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      const calendars = (data.items || []).map(item => ({
        id: item.id,
        summary: item.summary,
        primary: item.primary || false,
        backgroundColor: item.backgroundColor,
      }));

      return res.status(200).json({ calendars });
    } catch (error) {
      console.error('List calendars error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 2. Create Event
exports.googleCalendarCreateEvent = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken, selectedCalendarId } = await getValidGoogleToken(userId);
      const eventData = req.body;

      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.startTime },
        end: { dateTime: eventData.endTime },
        attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
        location: eventData.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const calendarId = encodeURIComponent(selectedCalendarId || 'primary');
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      return res.status(200).json({
        eventId: data.id,
        meetLink: data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri,
      });
    } catch (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 3. Get Free/Busy Intervals
exports.googleCalendarGetFreeBusy = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken, selectedCalendarId } = await getValidGoogleToken(userId);
      const { timeMin, timeMax } = req.body;

      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: 'Missing timeMin or timeMax' });
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: selectedCalendarId || 'primary' }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      const busySlots = data.calendars?.[selectedCalendarId || 'primary']?.busy || [];

      return res.status(200).json({ busy: busySlots });
    } catch (error) {
      console.error('Free/busy error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 4. Delete Event
exports.googleCalendarDeleteEvent = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { eventId, calendarId } = req.body;
      if (!eventId) {
        return res.status(400).json({ error: 'Missing eventId' });
      }

      const { accessToken } = await getValidGoogleToken(userId);
      const targetCalendar = calendarId ? encodeURIComponent(calendarId) : 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${targetCalendar}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 204 No Content is success for DELETE
      if (
        !response.ok &&
        response.status !== 204 &&
        response.status !== 404 &&
        response.status !== 410
      ) {
        // 410 = GONE (already deleted)
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete event error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============================================
// TEAM INVITATION EMAIL TRIGGER
// ============================================

exports.onTeamInviteCreated = onDocumentCreated(
  { document: 'portal_invites/{inviteId}', secrets: [resendApiKey] },
  async event => {
    const invite = event.data.data();
    if (!invite.email) return;

    // Handle agency invites (no orgId) vs organization invites
    let orgName = 'CartShift Studio'; // Default for agency invites
    if (invite.orgId) {
      const orgSnap = await admin
        .firestore()
        .collection('portal_organizations')
        .doc(invite.orgId)
        .get();
      orgName = orgSnap.exists ? orgSnap.data().name : 'an organization';
    } else if (invite.isAgency) {
      orgName = 'CartShift Studio Agency Team';
    }
    const inviteUrl = `${PORTAL_BASE_URL}/en/invite/${invite.code}`;

    await sendPortalEmail(
      invite.email,
      `You're invited to join ${orgName}`,
      'team_invite',
      {
        inviterName: invite.invitedByName || 'A team member',
        organizationName: orgName,
        actionUrl: inviteUrl,
        orgId: invite.orgId,
      },
      {
        tags: [{ name: 'invite_id', value: event.params.inviteId }],
        uniqueId: invite.code,
      }
    );

    // NEW: Create in-portal notification for existing users
    const userSnap = await admin
      .firestore()
      .collection('portal_users')
      .where('email', '==', invite.email.toLowerCase())
      .limit(1)
      .get();

    if (!userSnap.empty) {
      await createNotification(
        userSnap.docs[0].id,
        'invite',
        'Team Invitation',
        `You have been invited to join ${orgName}`,
        inviteUrl
      );
    }
  }
);

// ============================================
// EMAIL QUEUE PROCESSOR (for batch/reliable sending)
// ============================================

exports.processEmailQueue = onDocumentCreated(
  { document: 'email_queue/{emailId}', secrets: [resendApiKey] },
  async event => {
    const emailDoc = event.data;
    const email = emailDoc.data();

    if (email.status !== 'pending') return;

    await emailDoc.ref.update({ status: 'processing' });

    const result = await sendPortalEmail(email.to, email.subject, email.templateName, email.data, {
      tags: email.tags || [],
      uniqueId: event.params.emailId,
      scheduledAt: email.scheduledAt,
    });

    await emailDoc.ref.update({
      status: result.success ? 'sent' : 'failed',
      emailId: result.id || null,
      result,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

// ============================================
// STORE ANALYZER - SEND ANALYSIS REPORT
// ============================================

const ANALYSIS_TEXTS = {
  en: {
    subject: 'Your Complete Store Analysis Report',
    headline: 'Your In-Depth Store Analysis is Ready!',
    badge: 'COMPREHENSIVE REPORT',
    greeting: 'Hello,',
    introText:
      "We've completed an in-depth analysis of your e-commerce store, examining 40+ data points across 6 critical areas. This report contains detailed findings, actionable recommendations, and a prioritized roadmap to help you improve conversions and revenue.",
    overallScoreLabel: 'OVERALL HEALTH SCORE',
    scoreBreakdownTitle: 'Score Breakdown by Category',
    scoreBreakdownSubtitle: 'Score breakdown by category',
    priorityFixesTitle: 'High-Priority Issues to Fix First',
    priorityFixesSubtitle: 'Fix these first for the fastest practical lift',
    proTipLabel: 'Expert Insight',
    proTipText:
      'Stores usually see the fastest return by fixing high-impact friction first. Start with the items shoppers feel before scaling traffic.',
    ctaTitle: 'Ready to Fix These Issues?',
    ctaText:
      'Book a free 30-minute strategy call with our e-commerce experts to discuss your results and create a custom action plan.',
    ctaButtonText: 'Book Free Strategy Call',
    analyzedUrl: 'Analyzed URL',
    footerText: 'This comprehensive report was generated by CartShift Studio',
    criticalIssuesLabel: 'Critical Issues',
    totalIssuesLabel: 'Total Issues',
    tasksLabel: 'tasks',
    issueSingular: 'issue',
    issuePlural: 'issues',
    passedSingular: 'passed check',
    passedPlural: 'passed checks',
    itemSingular: 'recommendation',
    itemPlural: 'recommendations',
    taskSingular: 'task',
    taskPlural: 'tasks',
    noCriticalIssuesFound: 'Great job! No critical issues found.',
    noSpecificFindings: 'No specific findings available.',
    noIssuesInAnyCategory: 'Amazing! No issues detected in any category.',
    generatedByFooter: 'Generated by CartShift Studio • cart-shift.com',
    questionsContact: 'Questions? Contact us at',
    reportGeneratedOn: 'Report generated on',
    scoreStatus: {
      excellent: 'Excellent! Your store is performing above industry standards.',
      good: 'Good foundation! A few optimizations can take you to the next level.',
      warning: 'Needs attention. These issues are likely costing you sales.',
      critical: 'Critical issues detected. Immediate action recommended.',
    },
    sections: {
      performance: 'Performance',
      seo: 'Technical SEO',
      accessibility: 'Accessibility',
      bestPractices: 'Best Practices',
      cart: 'Cart & Checkout',
      trust: 'Trust & Credibility',
    },
    sectionDescriptions: {
      performance:
        'Page speed directly impacts bounce rates and conversions. Every 1-second delay can reduce conversions by 7%.',
      seo: 'Technical SEO determines how well search engines can find and rank your store pages.',
      accessibility:
        'Accessibility affects 15-20% of users and is increasingly a legal requirement.',
      bestPractices:
        'Security and modern standards build customer confidence and protect your business.',
      cart: 'Cart and checkout optimization can recover up to 70% of abandoned carts.',
      trust: 'Trust signals can increase conversions by 15-30% for new visitors.',
    },
    impact: {
      high: 'HIGH IMPACT',
      medium: 'MEDIUM',
      low: 'LOW',
    },
    // New detailed sections
    detailedFindingsTitle: 'Detailed Analysis by Category',
    detailedFindingsSubtitle: 'What we checked in each category',
    whatWeFound: 'What We Found',
    issuesDetected: 'Issues Detected',
    passingChecks: 'Passing Checks',
    allRecommendationsTitle: 'Complete Recommendations List',
    allRecommendationsSubtitle: 'Complete list with action steps',
    howToFix: 'How to Fix',
    estimatedImpact: 'Estimated Impact',
    coreWebVitalsTitle: 'Core Web Vitals Analysis',
    coreWebVitalsSubtitle: "Google's key metrics for user experience",
    lcpLabel: 'Largest Contentful Paint (LCP)',
    lcpDesc: 'Measures loading performance. Should occur within 2.5 seconds.',
    clsLabel: 'Cumulative Layout Shift (CLS)',
    clsDesc: 'Measures visual stability. Should be less than 0.1.',
    fidLabel: 'First Input Delay (FID)',
    fidDesc: 'Measures interactivity. Should be less than 100ms.',
    actionRoadmapTitle: '30-Day Action Roadmap',
    actionRoadmapSubtitle: "Prioritized steps to maximize your store's potential",
    week1: 'Week 1: Critical Fixes',
    week2: 'Week 2: Performance',
    week3: 'Week 3: SEO & Trust',
    week4: 'Week 4: Optimization',
    revenueImpactTitle: 'Potential Revenue Impact',
    revenueImpactText:
      'Estimated directional conversion upside if the prioritized issues are fixed and validated.',
    conversionIncrease: '15-35%',
    industryBenchmark: 'Industry Benchmark',
    yourScore: 'Your Score',
    good: 'Good',
    needsWork: 'Needs Work',
    critical: 'Critical',
    actionSteps: {
      // Performance action steps
      'Reduce server response time':
        'Upgrade hosting, enable caching, or use a CDN like Cloudflare.',
      'Minimize JavaScript': 'Remove unused code, defer non-critical scripts, use code splitting.',
      'Optimize images': 'Compress images, use WebP format, implement lazy loading.',
      'Eliminate render-blocking resources':
        'Defer CSS/JS, inline critical CSS, use async/defer attributes.',
      'Implement lazy loading for images': 'Add loading="lazy" attribute to images below the fold.',
      'Minimize and bundle JavaScript':
        'Use build tools like Webpack to bundle and minify JS files.',
      // SEO action steps
      'Add a descriptive page title':
        'Create unique, keyword-rich titles under 60 characters for each page.',
      'Add meta description':
        'Write compelling 150-160 character descriptions for better click-through rates.',
      'Add a main H1 heading':
        'Each page should have one clear H1 that describes the page content.',
      'Fix broken links': 'Use tools like Screaming Frog to find and fix 404 errors.',
      'Add structured data': 'Implement Product, Organization, and BreadcrumbList schema markup.',
      // Accessibility action steps
      'Add lang attribute to HTML tag':
        'Add lang="en" (or appropriate language) to your <html> tag.',
      'Add viewport meta tag':
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Add alt text to images': 'Write descriptive alt text for all product and content images.',
      'Improve color contrast':
        'Ensure text has at least 4.5:1 contrast ratio against backgrounds.',
      'Add form labels': 'Associate visible labels with all form inputs using the for attribute.',
      // Cart action steps
      'Ensure cart is always visible':
        'Add a persistent cart icon in the header showing item count.',
      'Add security assurances near checkout/cart':
        'Display SSL badges, secure payment icons, and guarantees.',
      'Simplify checkout process':
        'Reduce form fields, offer guest checkout, show progress indicator.',
      // Trust action steps
      'Add customer reviews':
        'Implement product reviews and display aggregate ratings prominently.',
      'Ensure Privacy Policy is visible': 'Link to privacy policy in footer and during checkout.',
      'Add trust badges': 'Display security seals, payment icons, and guarantee badges.',
    },
  },
  he: {
    subject: 'דוח ניתוח החנות המלא שלך',
    headline: 'ניתוח החנות המעמיק שלך מוכן!',
    badge: 'דוח מקיף',
    greeting: 'שלום,',
    introText:
      'סיימנו ניתוח מעמיק של חנות האיקומרס שלך, בחנו 40+ נקודות נתונים ב-6 תחומים קריטיים. דוח זה מכיל ממצאים מפורטים, המלצות ניתנות לפעולה, ומפת דרכים מתועדפת שתעזור לשפר המרות והכנסות.',
    overallScoreLabel: 'ציון בריאות כללי',
    scoreBreakdownTitle: 'פירוט ציון לפי קטגוריה',
    scoreBreakdownSubtitle: 'פירוט הציון לפי קטגוריה',
    priorityFixesTitle: 'בעיות בעדיפות גבוהה לתיקון ראשון',
    priorityFixesSubtitle: 'כדאי להתחיל מכאן כדי לייצר שיפור מהיר ומדיד',
    proTipLabel: 'תובנה מקצועית',
    proTipText:
      'התשואה המהירה ביותר מגיעה בדרך כלל מטיפול בחיכוך בעל השפעה גבוהה. התחילו בפריטים שהלקוחות מרגישים עוד לפני שמגדילים תנועה.',
    ctaTitle: 'מוכנים לתקן את הבעיות האלה?',
    ctaText:
      'קבעו שיחת אסטרטגיה חינמית של 30 דקות עם מומחי האיקומרס שלנו לדון בתוצאות וליצור תוכנית פעולה מותאמת.',
    ctaButtonText: 'קבעו שיחה חינם',
    analyzedUrl: 'כתובת שנותחה',
    footerText: 'הדוח המקיף הזה נוצר על ידי CartShift Studio',
    criticalIssuesLabel: 'בעיות קריטיות',
    totalIssuesLabel: 'סה"כ בעיות',
    tasksLabel: 'משימות',
    issueSingular: 'בעיה',
    issuePlural: 'בעיות',
    passedSingular: 'בדיקה שעברה',
    passedPlural: 'בדיקות שעברו',
    itemSingular: 'המלצה',
    itemPlural: 'המלצות',
    taskSingular: 'משימה',
    taskPlural: 'משימות',
    noCriticalIssuesFound: 'עבודה מצוינת! לא נמצאו בעיות קריטיות.',
    noSpecificFindings: 'אין ממצאים ספציפיים להצגה.',
    noIssuesInAnyCategory: 'מצוין! לא זוהו בעיות באף קטגוריה.',
    generatedByFooter: 'נוצר על ידי CartShift Studio • cart-shift.com',
    questionsContact: 'שאלות? צרו קשר ב-',
    reportGeneratedOn: 'הדוח נוצר ב-',
    scoreStatus: {
      excellent: 'מצוין! החנות שלך מתפקדת מעל לסטנדרטים בתעשייה.',
      good: 'בסיס טוב! כמה אופטימיזציות יכולות לקחת אתכם לשלב הבא.',
      warning: 'דורש תשומת לב. הבעיות האלה כנראה עולות לכם במכירות.',
      critical: 'נמצאו בעיות קריטיות. מומלצת פעולה מיידית.',
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
      performance:
        'מהירות עמוד משפיעה ישירות על אחוזי נטישה והמרות. כל שנייה עיכוב יכולה להפחית המרות ב-7%.',
      seo: 'SEO טכני קובע כמה טוב מנועי חיפוש יכולים למצוא ולדרג את עמודי החנות שלך.',
      accessibility: 'נגישות משפיעה על 15-20% מהמשתמשים והופכת יותר ויותר לדרישה חוקית.',
      bestPractices: 'אבטחה וסטנדרטים מודרניים בונים אמון לקוחות ומגנים על העסק שלך.',
      cart: "אופטימיזציית עגלה וצ'קאאוט יכולה לשחזר עד 70% מהעגלות הנטושות.",
      trust: 'סימני אמון יכולים להגדיל המרות ב-15-30% עבור מבקרים חדשים.',
    },
    impact: {
      high: 'השפעה גבוהה',
      medium: 'בינוני',
      low: 'נמוך',
    },
    // New detailed sections
    detailedFindingsTitle: 'ניתוח מפורט לפי קטגוריה',
    detailedFindingsSubtitle: 'מה נבדק בכל קטגוריה',
    whatWeFound: 'מה מצאנו',
    issuesDetected: 'בעיות שזוהו',
    passingChecks: 'בדיקות שעברו',
    allRecommendationsTitle: 'רשימת המלצות מלאה',
    allRecommendationsSubtitle: 'רשימה מלאה עם צעדי פעולה',
    howToFix: 'איך לתקן',
    estimatedImpact: 'השפעה משוערת',
    coreWebVitalsTitle: 'ניתוח Core Web Vitals',
    coreWebVitalsSubtitle: 'המדדים המרכזיים של גוגל לחוויית משתמש',
    lcpLabel: 'Largest Contentful Paint (LCP)',
    lcpDesc: 'מודד ביצועי טעינה. צריך להתרחש תוך 2.5 שניות.',
    clsLabel: 'Cumulative Layout Shift (CLS)',
    clsDesc: 'מודד יציבות ויזואלית. צריך להיות פחות מ-0.1.',
    fidLabel: 'First Input Delay (FID)',
    fidDesc: 'מודד אינטראקטיביות. צריך להיות פחות מ-100 מילישניות.',
    actionRoadmapTitle: 'מפת דרכים ל-30 יום',
    actionRoadmapSubtitle: 'צעדים מתועדפים למיקסום הפוטנציאל של החנות שלך',
    week1: 'שבוע 1: תיקונים קריטיים',
    week2: 'שבוע 2: ביצועים',
    week3: 'שבוע 3: SEO ואמון',
    week4: 'שבוע 4: אופטימיזציה',
    revenueImpactTitle: 'השפעת הכנסות פוטנציאלית',
    revenueImpactText:
      'הערכת טווח שמרנית לשיפור אפשרי בהמרות אם מתקנים ומאמתים את הבעיות בעדיפות.',
    conversionIncrease: '15-35%',
    industryBenchmark: 'סטנדרט תעשייה',
    yourScore: 'הציון שלך',
    good: 'טוב',
    needsWork: 'דורש עבודה',
    critical: 'קריטי',
    findingTitles: {
      'Page title found': 'נמצאה כותרת עמוד',
      'Meta description found': 'נמצא תיאור מטא',
      'H1 heading found': 'נמצאה כותרת H1',
      'High script count': 'כמות סקריפטים גבוהה',
      'Lazy loading detected': 'זוהתה טעינה עצלה',
      'Reasonable script usage': 'שימוש סביר בסקריפטים',
      'Language attribute': 'מאפיין שפה',
      'Mobile optimization': 'התאמה למובייל',
      'Image alt text': 'טקסט חלופי לתמונות',
      'Cart accessible': 'העגלה נגישה',
      'Purchase actions found': 'נמצאו פעולות רכישה',
      'Security terms found': 'נמצאו אזכורי אבטחה',
      'Social proof detected': 'זוהתה הוכחה חברתית',
      'Privacy policy found': 'נמצאה מדיניות פרטיות',
      'Trust signals detected': 'זוהו סימני אמון',
      'HTTPS Check': 'בדיקת HTTPS',
      'Missing page title': 'חסרה כותרת עמוד',
      'Missing meta description': 'חסר תיאור מטא',
      'Cart visibility low': 'נראות העגלה נמוכה',
      Passed: 'עבר בהצלחה',
      'First Contentful Paint': 'הצגת התוכן הראשונה',
      'Largest Contentful Paint': 'הצגת התוכן המרכזי',
      'Speed Index': 'מדד מהירות',
      'Total Blocking Time': 'זמן חסימה כולל',
      'Cumulative Layout Shift': 'תזוזת פריסה מצטברת',
      'Initial server response time was short': 'זמן תגובת השרת הראשוני קצר',
      'Time to Interactive': 'זמן עד אינטראקטיביות',
      'Minimize main-thread work': 'צמצום עבודה על ה-thread הראשי',
      'Document has a meta description': 'לעמוד יש תיאור מטא',
      'robots.txt is valid': 'קובץ robots.txt תקין',
      'Links are crawlable': 'קישורים ניתנים לסריקה',
      'Page is blocked from indexing': 'העמוד חסום לאינדוקס',
      'Links have descriptive text': 'לקישורים יש טקסט תיאורי',
      'Background and foreground colors have a sufficient contrast ratio':
        'לצבעי הרקע והטקסט יש יחס ניגודיות מספק',
      'Buttons have an accessible name': 'לכפתורים יש שם נגיש',
      'Links have a discernible name': 'לקישורים יש שם ברור',
      'Form elements have associated labels': 'לשדות טופס יש תוויות מקושרות',
      'Form fields do not have multiple labels': 'לשדות טופס אין תוויות כפולות',
      'Uses HTTPS': 'משתמש ב-HTTPS',
      'Uses HTTP/2': 'משתמש ב-HTTP/2',
      'No browser errors logged to the console': 'לא נרשמו שגיאות דפדפן בקונסול',
      'Detected JavaScript libraries': 'זוהו ספריות JavaScript',
      'Page has the HTML doctype': 'לעמוד יש doctype של HTML',
      'Properly defines charset': 'העמוד מגדיר charset תקין',
    },
    findingDescriptions: {
      'HTML title tag is present.': 'תגית הכותרת קיימת.',
      'Meta description is present.': 'תיאור המטא קיים.',
      'Main heading structure exists.': 'מבנה הכותרת הראשית קיים.',
      'Detected many script tags.': 'זוהתה כמות גבוהה של תגיות סקריפט.',
      'Images use lazy loading.': 'התמונות משתמשות בטעינה עצלה.',
      'Script tag count is normal.': 'כמות תגיות הסקריפט תקינה.',
      'HTML tag specifies a language.': 'תגית ה-HTML מגדירה שפה.',
      'Viewport meta tag is present.': 'תגית viewport קיימת.',
      'Most images have description tags.': 'לרוב התמונות יש תיאור חלופי.',
      'Cart link or icon detected.': 'זוהו קישור או אייקון לעגלה.',
      'Add to cart or Buy buttons detected.': 'זוהו כפתורי הוספה לעגלה או רכישה.',
      'Page mentions security.': 'העמוד כולל אזכורי אבטחה.',
      'Reviews or ratings found.': 'נמצאו ביקורות או דירוגים.',
      'Legal pages appear to be linked.': 'נראה שעמודים משפטיים מקושרים.',
      'Payment/Security icons found.': 'נמצאו אייקוני תשלום או אבטחה.',
      'Basic security check passed.': 'בדיקת האבטחה הבסיסית עברה.',
      Passed: 'הבדיקה עברה בהצלחה.',
      'The Lighthouse audit did not pass.': 'בדיקת Lighthouse לא עברה.',
    },
    recommendationTitles: {
      'Reduce storefront JavaScript': 'צמצום JavaScript בחנות',
      'Add a descriptive page title': 'הוספת כותרת עמוד תיאורית',
      'Add a search-ready meta description': 'הוספת תיאור מטא שמוכן לחיפוש',
      'Add one clear H1 heading': 'הוספת כותרת H1 ברורה אחת',
      'Lazy load below-fold images': 'טעינה עצלה לתמונות מתחת לקו הראשון',
      'Set the page language': 'הגדרת שפת העמוד',
      'Add a mobile viewport tag': 'הוספת תגית viewport למובייל',
      'Add descriptive alt text to images': 'הוספת טקסט חלופי תיאורי לתמונות',
      'Make the cart easy to find': 'הפיכת העגלה לקלה לאיתור',
      'Add checkout trust cues': 'הוספת סימני אמון ליד הצ׳קאאוט',
      'Show customer reviews or ratings': 'הצגת ביקורות או דירוגי לקוחות',
      'Make privacy policy visible': 'הצגת מדיניות הפרטיות בצורה ברורה',
      'First Contentful Paint': 'שיפור הצגת התוכן הראשונה',
      'Largest Contentful Paint': 'שיפור הצגת התוכן המרכזי',
      'Speed Index': 'שיפור מדד המהירות',
      'Total Blocking Time': 'צמצום זמן החסימה הכולל',
      'Cumulative Layout Shift': 'מניעת קפיצות פריסה',
      'Initial server response time was short': 'קיצור זמן תגובת השרת',
      'Time to Interactive': 'שיפור הזמן עד אינטראקטיביות',
      'Minimize main-thread work': 'צמצום עומס על ה-thread הראשי',
      'Document has a meta description': 'הוספת תיאור מטא לעמוד',
      'robots.txt is valid': 'תיקון קובץ robots.txt',
      'Links are crawlable': 'שיפור קישורים לסריקה',
      'Page is blocked from indexing': 'פתיחת העמוד לאינדוקס',
      'Links have descriptive text': 'שיפור טקסט הקישורים',
      'Background and foreground colors have a sufficient contrast ratio':
        'שיפור ניגודיות צבעים',
      'Buttons have an accessible name': 'מתן שם נגיש לכפתורים',
      'Links have a discernible name': 'מתן שם ברור לקישורים',
      'Form elements have associated labels': 'חיבור תוויות לשדות טופס',
      'Form fields do not have multiple labels': 'תיקון תוויות כפולות בשדות טופס',
      'Uses HTTPS': 'הפעלת HTTPS',
      'Uses HTTP/2': 'שיפור שימוש ב-HTTP/2',
      'No browser errors logged to the console': 'תיקון שגיאות דפדפן בקונסול',
      'Detected JavaScript libraries': 'בדיקת ספריות JavaScript',
      'Page has the HTML doctype': 'הגדרת doctype תקין',
      'Properly defines charset': 'הגדרת charset תקין',
      'Fix robots.txt crawl rules': 'תיקון כללי הסריקה בקובץ robots.txt',
      'Improve low-contrast text': 'שיפור טקסט עם ניגודיות נמוכה',
      'Name icon-only buttons': 'מתן שם נגיש לכפתורי אייקון',
      'Make links understandable': 'הפיכת קישורים לברורים',
      'Connect labels to form fields': 'חיבור תוויות לשדות טופס',
      'Reduce server response time': 'קיצור זמן תגובת השרת',
      'Speed up the largest visible element': 'האצת האלמנט המרכזי הגלוי',
      'Reduce JavaScript blocking time': 'צמצום זמן חסימת JavaScript',
      'Prevent layout shifts': 'מניעת קפיצות פריסה',
      'Run a full accessibility audit': 'הרצת בדיקת נגישות מלאה',
      'Fix First Contentful Paint': 'שיפור הצגת התוכן הראשונה',
      'Fix Largest Contentful Paint': 'שיפור הצגת התוכן המרכזי',
      'Fix Speed Index': 'שיפור מדד המהירות',
      'Fix Total Blocking Time': 'שיפור זמן החסימה הכולל',
      'Fix Cumulative Layout Shift': 'שיפור יציבות הפריסה',
      'Fix Time to Interactive': 'שיפור הזמן עד אינטראקטיביות',
      'Fix Minimize main-thread work': 'צמצום עומס על ה-thread הראשי',
      'Fix Uses HTTPS': 'תיקון שימוש ב-HTTPS',
      'Fix Uses HTTP/2': 'שיפור שימוש ב-HTTP/2',
      'Fix Page has the HTML doctype': 'תיקון הגדרת doctype',
      'Fix Properly defines charset': 'תיקון הגדרת charset',
    },
    recommendationDescriptions: {
      'Too many scripts slow down rendering and can delay menus, filters, and add-to-cart interactions.':
        'יותר מדי סקריפטים מאטים את הרינדור ועלולים לעכב תפריטים, פילטרים והוספה לעגלה.',
      'The page title is one of the strongest signals for search listings and browser tabs.':
        'כותרת העמוד היא אחד הסיגנלים החזקים ביותר לתוצאות חיפוש וללשוניות הדפדפן.',
      'Search engines and AI answer engines use the description to understand the page and influence click-through rate.':
        'מנועי חיפוש ומנועי תשובות משתמשים בתיאור כדי להבין את העמוד ולהשפיע על שיעור הקליקים.',
      'A clear H1 helps shoppers, search engines, and assistive technologies understand the page topic.':
        'כותרת H1 ברורה עוזרת לקונים, למנועי חיפוש ולטכנולוגיות מסייעות להבין את נושא העמוד.',
      'Images below the first viewport should not compete with critical content for initial bandwidth.':
        'תמונות מתחת לקו הראשון לא צריכות להתחרות בתוכן הקריטי על רוחב הפס הראשוני.',
      'Language metadata helps screen readers pronounce content correctly and helps search engines classify the page.':
        'מטא-דאטה של שפה עוזר לקוראי מסך להגות תוכן נכון ולעזור למנועי חיפוש לסווג את העמוד.',
      'Without a viewport tag, mobile browsers may render the store at desktop width and create a poor shopping experience.':
        'בלי תגית viewport, דפדפני מובייל עלולים לרנדר את החנות ברוחב דסקטופ ולפגוע בחוויית הקנייה.',
      'Product and content images without alt text lose accessibility context and reduce image-search clarity.':
        'תמונות מוצר ותוכן בלי טקסט חלופי מאבדות הקשר נגישות ופוגעות בבהירות חיפוש התמונות.',
      'A hidden cart creates friction for returning shoppers and makes checkout feel less predictable.':
        'עגלה מוסתרת יוצרת חיכוך לקונים חוזרים וגורמת לצ׳קאאוט להרגיש פחות צפוי.',
      'Trust cues near purchase actions reduce hesitation when shoppers are about to enter payment details.':
        'סימני אמון ליד פעולות רכישה מפחיתים היסוס רגע לפני הזנת פרטי תשלום.',
      'Social proof helps new shoppers validate quality, sizing, service, and delivery confidence.':
        'הוכחה חברתית עוזרת לקונים חדשים לאמת איכות, מידות, שירות וביטחון במשלוח.',
      'Visible policies build trust and help shoppers understand how their information is handled.':
        'מדיניות גלויה בונה אמון ועוזרת לקונים להבין איך המידע שלהם מטופל.',
      'Invalid robots.txt directives can stop crawlers from discovering important product, category, or asset URLs.':
        'הנחיות לא תקינות בקובץ robots.txt עלולות למנוע מסורקים לגלות עמודי מוצר, קטגוריות או נכסים חשובים.',
      'Low contrast makes important copy and buttons harder to read, especially on mobile and for users with impaired vision.':
        'ניגודיות נמוכה מקשה על קריאת טקסט וכפתורים חשובים, במיוחד במובייל ועבור משתמשים עם לקות ראייה.',
      'Buttons without accessible names are confusing for screen reader users and automated assistants.':
        'כפתורים ללא שם נגיש מבלבלים משתמשי קוראי מסך וכלים אוטומטיים.',
      'Generic or empty links make navigation unclear and weaken semantic understanding of the page.':
        'קישורים כלליים או ריקים מקשים על ניווט ופוגעים בהבנה הסמנטית של העמוד.',
      'Unlabeled inputs hurt accessibility and can reduce checkout and newsletter form completion.':
        'שדות ללא תווית פוגעים בנגישות ועלולים להוריד השלמת טפסי צ׳קאאוט והרשמה.',
      'Slow server response delays every later loading milestone and makes paid traffic less efficient.':
        'תגובת שרת איטית מעכבת כל שלב טעינה אחר והופכת תנועה ממומנת לפחות יעילה.',
      'A slow hero image or main content block delays the moment shoppers feel the page is usable.':
        'תמונת הירו או בלוק תוכן מרכזי איטיים מעכבים את הרגע שבו הקונים מרגישים שהעמוד שימושי.',
      'Heavy JavaScript blocks interaction and makes filters, menus, and add-to-cart actions feel laggy.':
        'JavaScript כבד חוסם אינטראקציה וגורם לפילטרים, תפריטים והוספה לעגלה להרגיש איטיים.',
      'Unexpected movement can cause misclicks and makes product pages feel unstable.':
        'תזוזות לא צפויות עלולות לגרום ללחיצות שגויות ולתחושה שעמודי מוצר אינם יציבים.',
      'This audit did not meet Lighthouse standards.':
        'הבדיקה הזו לא עמדה בסטנדרטים של Lighthouse.',
      'Accessibility score is below target.':
        'ציון הנגישות נמוך מהיעד.',
    },
    recommendationActions: {
      'Audit theme/app scripts, remove unused tags, and defer anything not needed for first render.':
        'בדקו סקריפטים של התבנית והאפליקציות, הסירו תגיות לא בשימוש ודחו כל מה שלא נדרש לרינדור הראשוני.',
      'Add a unique title under 60 characters that includes the store name and main product/category promise.':
        'הוסיפו כותרת ייחודית עד 60 תווים שכוללת את שם החנות ואת ההבטחה המרכזית של המוצר או הקטגוריה.',
      'Write a unique 140-160 character description for the homepage that names the offer, audience, and primary reason to buy.':
        'כתבו תיאור ייחודי של 140-160 תווים שמציג את ההצעה, הקהל והסיבה המרכזית לקנייה.',
      'Add one visible H1 near the top of the homepage that describes the store or primary collection.':
        'הוסיפו H1 גלוי ליד ראש העמוד שמתאר את החנות או הקולקציה המרכזית.',
      'Add loading="lazy" to below-fold images while keeping the hero image eager/preloaded.':
        'הוסיפו loading="lazy" לתמונות מתחת לקו הראשון, והשאירו את תמונת ההירו בטעינה מיידית או preload.',
      'Add the correct lang attribute to the <html> element, such as lang="he" or lang="en".':
        'הוסיפו לתגית <html> את מאפיין השפה הנכון, למשל lang="he" או lang="en".',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.':
        'הוסיפו ל-head תגית <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Add concise alt text to meaningful images and leave purely decorative images empty with alt="".':
        'הוסיפו טקסט חלופי קצר לתמונות משמעותיות, והשאירו תמונות דקורטיביות בלבד עם alt="".',
      'Add a persistent cart entry point in the header with a clear icon, accessible label, and item count.':
        'הוסיפו נקודת כניסה קבועה לעגלה בכותרת עם אייקון ברור, תווית נגישה ומספר פריטים.',
      'Place secure payment, returns, warranty, or guarantee messaging near cart and checkout entry points.':
        'מקמו מסרים על תשלום מאובטח, החזרות, אחריות או התחייבות ליד העגלה ונקודות הכניסה לצ׳קאאוט.',
      'Add review snippets, star ratings, testimonials, or UGC near product and collection decision points.':
        'הוסיפו קטעי ביקורות, דירוגים, המלצות או תוכן משתמשים ליד נקודות החלטה במוצר ובקולקציות.',
      'Link privacy, returns, shipping, and terms pages from the footer and checkout-adjacent areas.':
        'קשרו למדיניות פרטיות, החזרות, משלוחים ותנאים מהפוטר ומאזורים הסמוכים לצ׳קאאוט.',
      'Validate /robots.txt, remove unsupported directives, and confirm important pages and assets are not blocked.':
        'בדקו את robots.txt, הסירו הנחיות לא נתמכות וודאו שעמודים ונכסים חשובים אינם חסומים.',
      'Adjust foreground/background color pairs to meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text.':
        'התאימו זוגות צבעי טקסט ורקע ל-WCAG AA: יחס 4.5:1 לטקסט רגיל ו-3:1 לטקסט גדול.',
      'Add visible text or aria-label values to every button, especially cart, menu, search, and carousel controls.':
        'הוסיפו טקסט גלוי או aria-label לכל כפתור, במיוחד עגלה, תפריט, חיפוש ופקדי קרוסלה.',
      'Replace vague link labels with destination-specific text and add aria-labels when an icon is the only visible content.':
        'החליפו תוויות קישור עמומות בטקסט שמתאר יעד, והוסיפו aria-label כאשר רק אייקון גלוי.',
      'Use visible labels or aria-label/aria-labelledby for each form input, select, and textarea.':
        'השתמשו בתוויות גלויות או ב-aria-label/aria-labelledby לכל input, select ו-textarea.',
      'Enable page caching, review hosting resources, move heavy plugins/apps off the critical path, and add CDN caching.':
        'הפעילו caching לעמודים, בדקו משאבי אחסון, הוציאו תוספים ואפליקציות כבדות מהנתיב הקריטי והוסיפו CDN caching.',
      'Preload the hero image, compress it, serve responsive sizes, and defer non-critical scripts competing for bandwidth.':
        'בצעו preload לתמונת ההירו, דחסו אותה, הגישו גדלים רספונסיביים ודחו סקריפטים לא קריטיים שמתחרים על רוחב הפס.',
      'Remove unused scripts, defer third-party tags, split large bundles, and audit apps/plugins loaded on every page.':
        'הסירו סקריפטים לא בשימוש, דחו תגיות צד שלישי, פצלו bundles גדולים ובדקו אפליקציות/תוספים שנטענים בכל עמוד.',
      'Reserve width/height for images, embeds, banners, and sticky bars before they load.':
        'שמרו מראש רוחב וגובה לתמונות, embeds, באנרים וברים דביקים לפני שהם נטענים.',
      'Review the failing Lighthouse audit details and fix the affected templates or theme code.':
        'עברו על פרטי בדיקת Lighthouse שנכשלה ותקנו את התבניות או קוד התבנית המושפעים.',
      'Run a browser-based accessibility audit and fix keyboard, label, alt text, and contrast failures.':
        'הריצו בדיקת נגישות בדפדפן ותקנו כשלים במקלדת, תוויות, טקסט חלופי וניגודיות.',
    },
    evidenceTemplates: {
      scriptTagsDetected: 'זוהו {count} תגיות סקריפט.',
      millisecondsSavings: 'פוטנציאל חיסכון של {ms} מילישניות.',
      kibSavings: 'פוטנציאל חיסכון של {kib} KiB.',
      secondsMetric: 'נמדדו {seconds} שניות.',
    },
    actionSteps: {
      // Performance
      'Reduce server response time': 'שדרגו אחסון, הפעילו caching, או השתמשו ב-CDN כמו Cloudflare.',
      'Minimize JavaScript':
        'הסירו קוד לא בשימוש, דחו סקריפטים לא קריטיים, השתמשו ב-code splitting.',
      'Optimize images': 'דחסו תמונות, השתמשו בפורמט WebP, יישמו lazy loading.',
      'Eliminate render-blocking resources':
        'דחו CSS/JS, הטמיעו CSS קריטי inline, השתמשו ב-async/defer.',
      'Implement lazy loading for images': 'הוסיפו loading="lazy" לתמונות מתחת לקו הראשון.',
      'Minimize and bundle JavaScript': 'השתמשו בכלי build כמו Webpack לאיחוד ומינימיזציה של JS.',
      // SEO
      'Add a descriptive page title':
        'צרו כותרות ייחודיות עשירות במילות מפתח עד 60 תווים לכל עמוד.',
      'Add meta description': 'כתבו תיאורים משכנעים של 150-160 תווים לשיפור שיעור הקליקים.',
      'Add a main H1 heading': 'כל עמוד צריך H1 ברור אחד שמתאר את תוכן העמוד.',
      'Fix broken links': 'השתמשו בכלים כמו Screaming Frog למציאת ותיקון שגיאות 404.',
      'Add structured data': 'יישמו Product, Organization ו-BreadcrumbList schema markup.',
      // Accessibility
      'Add lang attribute to HTML tag': 'הוסיפו lang="he" (או שפה מתאימה) לתג <html> שלכם.',
      'Add viewport meta tag':
        'הוסיפו <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Add alt text to images': 'כתבו טקסט alt תיאורי לכל תמונות המוצרים והתוכן.',
      'Improve color contrast': 'וודאו שלטקסט יש יחס ניגודיות של לפחות 4.5:1 מול רקעים.',
      'Add form labels': 'שייכו תוויות נראות לכל שדות הטופס באמצעות תכונת for.',
      // Cart
      'Ensure cart is always visible': 'הוסיפו אייקון עגלה קבוע בכותרת שמציג מספר פריטים.',
      'Add security assurances near checkout/cart':
        'הציגו תגי SSL, אייקוני תשלום מאובטח והתחייבויות.',
      'Simplify checkout process': 'צמצמו שדות טופס, הציעו checkout כאורח, הציגו מחוון התקדמות.',
      // Trust
      'Add customer reviews': 'יישמו ביקורות מוצרים והציגו דירוגים מצטברים באופן בולט.',
      'Ensure Privacy Policy is visible': "קשרו למדיניות פרטיות בפוטר ובמהלך הצ'קאאוט.",
      'Add trust badges': 'הציגו חותמות אבטחה, אייקוני תשלום ותגי התחייבות.',
    },
  },
};
// HTML report builders: lib/store-analysis-report-html.js
// PDF generation: lib/store-analysis-pdf.js (HTML → Chromium PDF)

// ==========================================
// PDF REPORT GENERATION — see lib/store-analysis-pdf.js
// ==========================================

exports.sendStoreAnalysisReport = onRequest(
  {
    cors: true,
    maxInstances: 10,
    memory: '1GiB',
    timeoutSeconds: 120,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { email, storeUrl, locale, results, subscribeNewsletter } = req.body;

      if (!email || !results) {
        return res.status(400).json({ error: 'Email and results are required' });
      }

      const lang = locale === 'he' ? 'he' : 'en';
      const texts = ANALYSIS_TEXTS[lang];
      const isRtl = lang === 'he';

      // Save lead to Firestore
      await admin
        .firestore()
        .collection('store_analysis_leads')
        .add({
          email,
          storeUrl,
          locale: lang,
          overallScore: results.overallScore,
          platform: results.platform,
          source: 'store_analyzer',
          scoreBand: getScoreBand(results.overallScore),
          funnelStage: subscribeNewsletter ? 'nurture' : 'lead_only',
          leadScore: getLeadScoreDelta({
            source: 'store_analyzer',
            overallScore: results.overallScore,
          }),
          conversionStatus: 'lead',
          subscribeNewsletter: subscribeNewsletter || false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Add to Resend Audience
      await addToAudience(resendApiKey.value(), {
        email,
        source: 'store_analyzer',
        properties: {
          subscription_type: subscribeNewsletter ? 'newsletter_and_lead' : 'lead_only',
          store_url: storeUrl || '',
          store_score: String(results.overallScore),
          platform: results.platform || 'unknown',
          locale: lang,
        },
      });

      // If subscribed to newsletter, add to newsletter collection
      if (subscribeNewsletter) {
        await admin.firestore().collection('newsletter_subscriptions').add({
          email,
          source: 'store_analyzer',
          locale: lang,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await captureAndEnrollMarketingLead(
        {
          email,
          storeUrl,
          locale: lang,
          source: 'store_analyzer',
          platform: results.platform || undefined,
          overallScore: results.overallScore,
          subscribeNewsletter: !!subscribeNewsletter,
          consent: !!subscribeNewsletter,
        },
        { skipWelcome: true }
      );

      // Generate PDF Report
      console.log('[Store Analysis] Generating PDF report...');
      const { generateStoreAnalysisPDF } = require('./lib/store-analysis-pdf');
      const pdfBuffer = await generateStoreAnalysisPDF(
        results,
        storeUrl,
        texts,
        isRtl,
        DEFAULT_CONTACT_EMAIL
      );
      console.log('[Store Analysis] PDF generated, size:', pdfBuffer.length, 'bytes');

      // Create a clean filename from the store URL
      const cleanStoreUrl = (storeUrl || 'store')
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-')
        .slice(0, 30);
      const pdfFilename = `store-analysis-${cleanStoreUrl}-${Date.now()}.pdf`;

      // Determine score status text
      const scoreStatus =
        results.overallScore >= 80
          ? 'excellent'
          : results.overallScore >= 60
            ? 'good'
            : results.overallScore >= 40
              ? 'warning'
              : 'critical';

      // Simple cover email data
      const emailData = {
        badge: texts.badge,
        headline: texts.headline,
        greeting: texts.greeting,
        overallScoreLabel: texts.overallScoreLabel,
        overallScore: results.overallScore,
        scoreStatusText: texts.scoreStatus[scoreStatus],
        storeUrl: storeUrl || 'N/A',
        ctaTitle: texts.ctaTitle,
        ctaText: texts.ctaText,
        ctaUrl: `https://cart-shift.com/${lang}/contact`,
        ctaButtonText: texts.ctaButtonText,
        proTipLabel: texts.proTipLabel,
        proTipText: texts.proTipText,
        analyzedUrl: texts.analyzedUrl,
        footerText: texts.footerText,
        dir: isRtl ? 'rtl' : 'ltr',
        textAlign: isRtl ? 'right' : 'left',
        paddingSide: isRtl ? 'right' : 'left',
        footerYear: new Date().getFullYear(),
        // PDF attachment message
        pdfAttachmentMessage:
          lang === 'he'
            ? 'מצורף לאימייל זה דוח PDF מלא עם כל הממצאים, ההמלצות ומפת הדרכים לשיפור.'
            : 'Attached to this email is a comprehensive PDF report with all findings, recommendations, and improvement roadmap.',
      };

      // Send email with PDF attachment using Resend directly
      const { Resend } = require('resend');
      const resend = new Resend(resendApiKey.value());

      // Build simple HTML email (no Handlebars dependency)
      const htmlContent = `
<!DOCTYPE html>
<html lang="${lang}" dir="${emailData.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; direction: ${emailData.dir};">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #3b82f6; border-radius: 20px; padding: 8px 20px;">
                    <span style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase;">${emailData.badge}</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 12px;">${emailData.headline}</h1>
              <p dir="ltr" style="color: #94a3b8; font-size: 14px; margin: 0; direction: ltr; unicode-bidi: isolate;">${emailData.storeUrl}</p>
            </td>
          </tr>
          <!-- Score -->
          <tr>
            <td style="background-color: #1e293b; padding: 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1.5px;">${emailData.overallScoreLabel}</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #334155; border-radius: 80px; width: 140px; height: 140px;">
                <tr>
                  <td align="center" valign="middle" style="padding: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 64px; width: 124px; height: 124px;">
                      <tr>
                        <td align="center" valign="middle">
                          <span dir="ltr" style="display: block; direction: ltr; unicode-bidi: isolate; font-size: 48px; font-weight: 900; color: #0f172a;">${emailData.overallScore}</span>
                          <span dir="ltr" style="display: block; direction: ltr; unicode-bidi: isolate; font-size: 14px; color: #64748b; font-weight: 600;">/100</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color: #ffffff; font-size: 16px; margin: 20px 0 0; font-weight: 600;">${emailData.scoreStatusText}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; text-align: ${emailData.textAlign};">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${emailData.greeting}</p>
              <!-- PDF Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6;">${emailData.pdfAttachmentMessage}</p>
                  </td>
                </tr>
              </table>
              <!-- Pro Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #92400e;">${emailData.proTipLabel}</p>
                    <p style="margin: 0; font-size: 14px; color: #b45309; line-height: 1.6;">${emailData.proTipText}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 32px; text-align: center;">
                    <h3 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 12px;">${emailData.ctaTitle}</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">${emailData.ctaText}</p>
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="background-color: #3b82f6; border-radius: 8px;">
                          <a href="${emailData.ctaUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700;">${emailData.ctaButtonText}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">${emailData.analyzedUrl}: <span dir="ltr" style="direction: ltr; unicode-bidi: isolate;">${emailData.storeUrl}</span></p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">${emailData.footerText}<br><span dir="ltr" style="direction: ltr; unicode-bidi: isolate;">&copy; ${emailData.footerYear} CartShift Studio</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Send email with PDF attachment
      const result = await resend.emails.send({
        from: 'CartShift Studio <reports@cart-shift.com>',
        to: email,
        subject: texts.subject,
        html: htmlContent,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer.toString('base64'),
          },
        ],
        tags: [{ name: 'type', value: 'store_analysis' }],
      });

      console.log('[Store Analysis] Email sent successfully:', result);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Store analysis email error:', error);
      return res.status(500).json({ error: 'Failed to send report' });
    }
  }
);

// ============================================
// RESEND WEBHOOK HANDLER (Email Event Tracking)
// ============================================

/*
exports.resendWebhook = onRequest(
  {
    cors: false,
    maxInstances: 10,
    secrets: [resendWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const webhookSecret = resendWebhookSecret.value();

      if (!webhookSecret) {
        console.warn('[Webhook] RESEND_WEBHOOK_SECRET not configured');
        return res.status(200).json({ received: true, warning: 'webhook_secret_not_configured' });
      }

      const event = parseWebhookEvent(req, webhookSecret);
      await handleWebhookEvent(admin, event);

      return res.status(200).json({ received: true, type: event.type });
    } catch (error) {
      console.error('[Webhook] Error:', error.message);

      if (error.message.includes('signature') || error.message.includes('headers')) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);
*/

// ============================================
// BATCH EMAIL SENDER (for bulk operations)
// ============================================

exports.sendBatchEmails = onRequest(
  {
    cors: true,
    maxInstances: 5,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: 'emails array is required' });
      }

      if (emails.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 emails per batch' });
      }

      const result = await sendBatchEmails(resendApiKey.value(), emails);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('Batch email error:', error);
      return res.status(500).json({ error: 'Failed to send batch emails' });
    }
  }
);

// ============================================
// STORE ANALYZER - DEPRECATED (use Next.js /api/analyze-store)
// ============================================

exports.analyzeStore = onRequest({ cors: true, maxInstances: 2 }, async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).send('');
  return res.status(410).json({
    error: 'This endpoint is deprecated. Use the site /api/analyze-store route instead.',
    code: 'analyzer_endpoint_deprecated',
  });
});
