/**
 * Client-facing proposal content is deliberately separate from billable request tasks.
 * Amounts are stored in minor currency units; hours are decimal work hours.
 */
export type ProposalPricingMode = 'fixed' | 'hourly_estimate' | 'hourly_capped';

export interface ProposalScopeItem {
  id: string;
  title: string;
  description: string;
  hoursMin?: number;
  hoursMax?: number;
  deliverable?: string;
}

export interface ProposalRequirement {
  id: string;
  title: string;
  details?: string;
  required: boolean;
}

export interface ProposalContent {
  schemaVersion: 1;
  objective: string;
  scope: ProposalScopeItem[];
  requirements: ProposalRequirement[];
  assumptions: string[];
  exclusions: string[];
  deliverables: string[];
  pricing: {
    mode: ProposalPricingMode;
    hourlyRateMinor?: number;
    hoursMin?: number;
    hoursMax?: number;
    /** The billable request total is the authorized cap for capped estimates. */
    depositPercent: number;
  };
  schedule?: {
    minBusinessDays?: number;
    maxBusinessDays?: number;
    startsAfter?: string;
  };
  paymentTerms?: string;
}

export function emptyProposalContent(): ProposalContent {
  return {
    schemaVersion: 1,
    objective: '',
    scope: [],
    requirements: [],
    assumptions: [],
    exclusions: [],
    deliverables: [],
    pricing: { mode: 'fixed', depositPercent: 50 },
  };
}

/** Optional, explicit template based on CartShift's Arava working agreement. */
export function shopifyProjectTemplate(): ProposalContent {
  return {
    schemaVersion: 1,
    objective: 'שילוב הפיתוח בחנות הקיימת תוך שמירה על חוויית הקנייה ועל פעילות החנות.',
    scope: [],
    deliverables: ['פיתוח בגרסת עבודה מבוקרת', 'בדיקות במובייל ובדסקטופ', 'מסירה לאחר אישור'],
    requirements: [
      { id: 'store-access', title: 'גישת Shopify', required: true },
      { id: 'source-materials', title: 'תכנים, תמונות וחומרי מוצר מאושרים', required: true },
      { id: 'operation', title: 'פרטי חיבורים ואינטגרציות רלוונטיים', required: false },
    ],
    assumptions: [
      'החומרים והגישות הנדרשים יימסרו לפני תחילת העבודה.',
      'שירותי צד שלישי ואינטגרציות קיימות ימשיכו לפעול ללא פיתוח נוסף מצדם.',
    ],
    exclusions: [
      'כתיבה מחדש, תרגום או עריכת מדיה משמעותית שלא הוגדרו בהיקף.',
      'עלויות אפליקציות, רישיונות או שירותי צד שלישי.',
      'עבודה נוספת מחוץ להיקף המאושר מחייבת הצעה ואישור נפרדים.',
    ],
    pricing: {
      mode: 'hourly_capped',
      hourlyRateMinor: 25000,
      hoursMin: 12,
      hoursMax: 16,
      depositPercent: 50,
    },
    schedule: {
      minBusinessDays: 5,
      maxBusinessDays: 8,
      startsAfter: 'אישור ההצעה, קבלת המקדמה וכל החומרים והגישות הנדרשים',
    },
    paymentTerms: '50% מקדמה לפני תחילת העבודה; היתרה עד 7 ימי עסקים מסיום העבודה.',
  };
}

export function calculateEstimate(content?: ProposalContent) {
  if (!content || content.pricing.mode === 'fixed') return null;
  const { hourlyRateMinor, hoursMin, hoursMax, mode } = content.pricing;
  if (
    hourlyRateMinor == null || !Number.isInteger(hourlyRateMinor) || hourlyRateMinor <= 0 ||
    hoursMin == null || hoursMax == null ||
    !Number.isFinite(hoursMin) || !Number.isFinite(hoursMax) ||
    hoursMin < 0 || hoursMax < hoursMin
  ) return null;
  return {
    mode,
    minMinor: Math.round(hoursMin * hourlyRateMinor),
    maxMinor: Math.round(hoursMax * hourlyRateMinor),
  };
}

export function calculateDeposit(totalMinor: number, percent: number): number {
  if (!Number.isInteger(totalMinor) || totalMinor < 0 ||
      !Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error('Invalid deposit');
  }
  return Math.round(totalMinor * percent / 100);
}

export function validateProposalContent(value?: ProposalContent) {
  if (!value) return;
  if (value.schemaVersion !== 1) throw new Error('Invalid proposal schema');
  if (value.pricing.depositPercent < 0 || value.pricing.depositPercent > 100 ||
      !Number.isFinite(value.pricing.depositPercent)) {
    throw new Error('Deposit must be between 0% and 100%');
  }
  if (value.pricing.mode !== 'fixed' && !calculateEstimate(value)) {
    throw new Error('Hourly proposals require a valid hourly rate and hours range');
  }
  const ids = value.scope.map(item => item.id);
  if (ids.length !== new Set(ids).size) throw new Error('Duplicate proposal section');
  if (value.scope.some(item => !item.title.trim())) throw new Error('Each scope item needs a title');
}
