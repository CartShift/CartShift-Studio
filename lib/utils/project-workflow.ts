import type {
  ClientProject,
  ProjectReview,
  ProjectTemplate,
  ProjectStage,
  ProjectChecklistItem,
} from '@/lib/types/project';

const stage = (title: string, index: number): ProjectStage => ({
  id: 'stage-' + index, title, status: 'pending',
});
const check = (title: string, index: number): ProjectChecklistItem => ({
  id: 'check-' + index, title, required: true, done: false,
});

export const PROJECT_TEMPLATES: Record<ProjectTemplate, {
  en: string;
  he: string;
  stages: string[];
  checks: string[];
  inputs: string[];
  stagesHe: string[];
  checksHe: string[];
  inputsHe: string[];
}> = {
  shopify_theme: {
    en: 'Shopify theme / redesign', he: 'שדרוג ועיצוב חנות Shopify',
    stages: ['Discovery & scope', 'Design and development', 'Client review', 'QA & launch'],
    checks: ['Mobile and desktop QA', 'Navigation, cart and checkout tested', 'Client sign-off', 'Rollback plan documented'],
    inputs: ['Shopify collaborator access', 'Brand assets and content'],
    stagesHe: ['אבחון והגדרת היקף', 'עיצוב ופיתוח', 'בדיקת הלקוח', 'בדיקות והשקה'],
    checksHe: ['בדיקה במובייל ובדסקטופ', 'בדיקת ניווט, סל ותשלום', 'אישור הלקוח', 'תוכנית חזרה לגרסה קודמת'],
    inputsHe: ['גישת שותף לחנות Shopify', 'לוגו, מדיה ותכני מותג'],
  },
  catalog_launch: {
    en: 'New product catalog', he: 'השקת קטלוג מוצרים',
    stages: ['Catalog and source files', 'Products and collections', 'Review and revisions', 'Operational testing', 'Go live'],
    checks: ['Product and variant data verified', 'Inventory locations validated', 'Mixed orders and fulfillment tested', 'Payment integrations tested', 'Client sign-off'],
    inputs: ['Product spreadsheet and variants', 'Nutrition/content and approved media', 'Fulfillment provider access'],
    stagesHe: ['איסוף קבצי קטלוג', 'הקמת מוצרים וקולקציות', 'בדיקת הלקוח ותיקונים', 'בדיקות תפעוליות', 'עלייה לאוויר'],
    checksHe: ['בדיקת מוצרים ווריאציות', 'אימות Locations ומלאי', 'בדיקת הזמנות מעורבות וליקוט', 'בדיקת אינטגרציות תשלום', 'אישור הלקוח'],
    inputsHe: ['טבלת מוצרים ווריאציות', 'מידע מקצועי, תוכן ומדיה מאושרת', 'גישה לספק הפולפילמנט'],
  },
  seo: {
    en: 'SEO improvements', he: 'פרויקט SEO',
    stages: ['Audit', 'Prioritization', 'Implementation', 'Verification & handoff'],
    checks: ['Metadata and indexing verified', 'Redirects and internal links tested', 'Client handoff'],
    inputs: ['Search Console access', 'Priority categories and markets'],
    stagesHe: ['אודיט', 'תעדוף', 'מימוש', 'אימות ומסירה'],
    checksHe: ['אימות מטא-דאטה ואינדוקס', 'בדיקת הפניות וקישורים פנימיים', 'מסירה ללקוח'],
    inputsHe: ['גישה ל-Search Console', 'קטגוריות ושווקי יעד'],
  },
  custom: {
    en: 'Custom project', he: 'פרויקט מותאם',
    stages: ['Planning', 'Implementation', 'Review', 'Delivery'],
    checks: ['QA completed', 'Client approval'],
    inputs: [],
    stagesHe: ['תכנון', 'מימוש', 'סקירה', 'מסירה'],
    checksHe: ['בדיקות איכות הושלמו', 'אישור הלקוח'],
    inputsHe: [],
  },
};

export function buildProjectTemplate(template: ProjectTemplate, locale: 'en' | 'he' = 'en') {
  const value = PROJECT_TEMPLATES[template];
  const isHe = locale === 'he';
  return {
    stages: (isHe ? value.stagesHe : value.stages).map(stage),
    launchChecks: (isHe ? value.checksHe : value.checks).map(check),
    inputs: (isHe ? value.inputsHe : value.inputs).map((title, index) => ({
      id: 'input-' + index, title, done: false, required: true,
    })),
  };
}

export function getProjectHealth(
  project: Pick<ClientProject, 'blockers' | 'deliverables' | 'launchChecks' | 'inputs' | 'stages'>,
  reviews: ProjectReview[]
) {
  const openBlockers = project.blockers.filter(blocker => !blocker.resolved).length;
  const missingInputs = project.inputs.filter(input => input.required && !input.done).length;
  const missingChecks = project.launchChecks.filter(item => item.required && !item.done).length;
  const pendingReviews = project.deliverables.filter(deliverable => {
    const matches = reviews.filter(review =>
      review.deliverableId === deliverable.id && review.revision === deliverable.revision
    );
    return matches.length === 0 || matches.some(review => review.decision !== 'approved');
  }).length;
  const completedStages = project.stages.filter(s => s.status === 'completed').length;
  const progress = project.stages.length ? Math.round(completedStages / project.stages.length * 100) : 0;
  return {
    openBlockers, missingInputs, missingChecks, pendingReviews, progress,
    readyForLaunch: openBlockers === 0 && missingInputs === 0 && missingChecks === 0 && pendingReviews === 0,
  };
}

export function loggedHours(project: Pick<ClientProject, 'workLogs'>): number {
  return project.workLogs.reduce((total, log) => total + log.hours, 0);
}

export function projectBudget(project: Pick<ClientProject, 'scope'>) {
  return {
    minCents: Math.round(project.scope.minHours * project.scope.rateCents),
    maxCents: Math.round(project.scope.maxHours * project.scope.rateCents),
  };
}

/** Prepare an editable, factual client update without sending anything. */
export function buildProjectUpdateDraft(
  project: Pick<ClientProject, 'title' | 'stages' | 'blockers' | 'nextStep'>,
  locale: string
): string {
  const he = locale === 'he';
  const completed = project.stages.filter(stage => stage.status === 'completed').map(stage => stage.title);
  const active = project.stages.filter(stage => stage.status === 'in_progress').map(stage => stage.title);
  const blockers = project.blockers.filter(blocker => !blocker.resolved).map(blocker => blocker.title);
  return [
    he ? 'עדכון פרויקט: ' + project.title : 'Project update: ' + project.title,
    '',
    he ? 'מה הושלם:' : 'Completed:',
    completed.length ? completed.map(name => '• ' + name).join('\n') : (he ? '• טרם סומנו שלבים שהושלמו' : '• No milestones marked complete yet'),
    '',
    he ? 'במה אנחנו מטפלים:' : 'In progress:',
    active.length ? active.map(name => '• ' + name).join('\n') : (he ? '• לא הוגדר שלב פעיל' : '• No active milestone recorded'),
    '',
    he ? 'מה עדיין מעכב:' : 'Open dependencies:',
    blockers.length ? blockers.map(name => '• ' + name).join('\n') : (he ? '• אין חסמים פתוחים' : '• No open blockers'),
    '',
    he ? 'השלב הבא: ' + (project.nextStep || 'טרם הוגדר') : 'Next step: ' + (project.nextStep || 'To be confirmed'),
  ].join('\n');
}
