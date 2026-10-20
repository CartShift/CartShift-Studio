export type ChallengePriority = 'speed' | 'reliability' | 'privacy';
export type ChallengeScale = 'prototype' | 'growth' | 'enterprise';
export type ChallengeDomain = 'ai' | 'commerce' | 'workflow' | 'general';

export type ChallengePlan = {
  domain: ChallengeDomain;
  title: string;
  summary: string;
  stages: readonly [string, string, string];
  architecture: readonly [string, string, string];
  decision: string;
  tradeoff: string;
  risk: string;
  nextStep: string;
  relatedProject: string;
};

export function classifyChallenge(description: string): ChallengeDomain {
  const value = description.toLowerCase();
  if (/\b(ai|llm|agent|chatbot|model|rag|prompt)\b|סוכן|בינה|מודל|צ׳אט/.test(value)) return 'ai';
  if (/\b(shop|commerce|checkout|cart|order|store|retail|shopify)\b|חנות|מסחר|הזמנות|תשלום/.test(value)) return 'commerce';
  if (/\b(approval|automation|workflow|document|integration|permission|process)\b|אוטומצ|מסמכ|הרשא|תהליך|אינטגרצ/.test(value)) return 'workflow';
  return 'general';
}

const playbooks = {
  en: {
    ai: {
      title: 'A controllable AI workflow',
      summary: 'Start with the decision boundary, not the model. Treat generated output as a proposal, never as authority.',
      stages: ['Map the user intent', 'Prototype with a narrow toolset', 'Evaluate failures before expansion'],
      architecture: ['Grounded context + retrieval', 'Policy-gated action adapter', 'Evaluation + human review'],
      decision: 'Keep model suggestions separate from mutations; each action needs typed validation and explicit authorization.',
      tradeoff: 'Higher guardrail complexity in exchange for safer, explainable automation.',
      risk: 'Confident but incorrect output, tool misuse and unexpected inference cost.',
      nextStep: 'Define three real user questions and the exact evidence required to answer them.',
      relatedProject: 'starlinker',
    },
    commerce: {
      title: 'A conversion-aware commerce system',
      summary: 'Protect checkout integrity first, then optimize the journey using measurable signals.',
      stages: ['Observe actual funnel drop-offs', 'Ship one measured improvement', 'Validate across devices and locales'],
      architecture: ['Storefront + accessible UI', 'Server-validated integration', 'Event tracking + safe rollback'],
      decision: 'Keep pricing, inventory and order states authoritative on the commerce platform.',
      tradeoff: 'Less UI freedom at checkout, greater transactional reliability.',
      risk: 'Duplicated events, stale inventory and regressions at payment boundaries.',
      nextStep: 'Define one conversion event and instrument its baseline before redesigning.',
      relatedProject: 'cartshift-studio',
    },
    workflow: {
      title: 'A traceable operations workflow',
      summary: 'Make the source of truth and failure paths explicit before introducing automation.',
      stages: ['Model states and ownership', 'Add idempotent transitions', 'Instrument retries and audit trails'],
      architecture: ['Typed state machine', 'Validated integration boundary', 'Audit log + recovery path'],
      decision: 'Prefer an explicit state model over unstructured background side effects.',
      tradeoff: 'A little upfront modeling work avoids costly inconsistencies later.',
      risk: 'Partial writes, duplicate retries and ambiguous ownership.',
      nextStep: 'Sketch the state transitions and identify who can approve each one.',
      relatedProject: 'rightflow',
    },
    general: {
      title: 'A product that can prove its value',
      summary: 'Make the primary user job observable; only then choose the simplest architecture that supports it.',
      stages: ['Define the user job', 'Test the smallest real interaction', 'Measure and iterate'],
      architecture: ['Focused interface', 'Explicit domain model', 'Observability + feedback'],
      decision: 'Favor clear boundaries and reversible changes over speculative complexity.',
      tradeoff: 'A narrower first release can reveal the right architecture faster.',
      risk: 'Building an impressive system without evidence of user value.',
      nextStep: 'Write down the first user action and how you will know it succeeded.',
      relatedProject: 'starlinker',
    },
  },
  he: {
    ai: {
      title: 'תהליך AI שאפשר לסמוך עליו',
      summary: 'מתחילים מגבולות קבלת ההחלטות, לא מהמודל. פלט המודל הוא הצעה, לא סמכות.',
      stages: ['להגדיר כוונת משתמש', 'לבדוק סט כלים מצומצם', 'למדוד כשלים לפני הרחבה'],
      architecture: ['הקשר מאומת ואחזור מידע', 'פעולות כפופות להרשאות', 'הערכה ובקרה אנושית'],
      decision: 'להפריד בין הצעת מודל לשינוי נתונים, ולאמת כל פעולה מול הרשאות וסכמות.',
      tradeoff: 'יותר עבודה על מנגנוני הגנה, תמורת אוטומציה בטוחה והסברים ברורים.',
      risk: 'תשובות שגויות בביטחון גבוה, שימוש לרעה בכלים ועלויות לא צפויות.',
      nextStep: 'להגדיר שלוש שאלות אמיתיות ואת הראיות שנחוצות כדי לענות עליהן.',
      relatedProject: 'starlinker',
    },
    commerce: {
      title: 'מסחר דיגיטלי שמודדים',
      summary: 'קודם שומרים על אמינות הקנייה, ורק אז משפרים את החוויה באמצעות נתונים.',
      stages: ['למדוד נטישות בפאנל', 'לשחרר שיפור אחד מדיד', 'לאמת בכל מכשיר ושפה'],
      architecture: ['ממשק נגיש ומהיר', 'אינטגרציות מאומתות בשרת', 'אירועים ואפשרות חזרה לאחור'],
      decision: 'מחירים, מלאי והזמנות נשארים תחת מקור האמת של פלטפורמת המסחר.',
      tradeoff: 'פחות גמישות בצ׳קאאוט, יותר אמינות עסקאות.',
      risk: 'אירועים כפולים, מלאי לא מעודכן ותקלות בתהליך התשלום.',
      nextStep: 'לבחור אירוע המרה אחד ולמדוד את נקודת ההתחלה.',
      relatedProject: 'cartshift-studio',
    },
    workflow: {
      title: 'תהליך עבודה שניתן לעקוב אחריו',
      summary: 'מגדירים מקור אמת ומסלולי כשל לפני הכנסת אוטומציה.',
      stages: ['למפות מצבים ואחראים', 'ליצור מעברים חסינים לכפילויות', 'לעקוב אחר ניסיונות ותיקונים'],
      architecture: ['מכונת מצבים מפורשת', 'גבול אינטגרציה מאומת', 'יומן שינויים והתאוששות'],
      decision: 'להעדיף מודל מצבים ברור על פני תופעות לוואי נסתרות.',
      tradeoff: 'קצת יותר תכנון מראש חוסך חוסר עקביות יקר.',
      risk: 'כתיבות חלקיות, הרצות כפולות ובעלות לא ברורה על נתונים.',
      nextStep: 'לשרטט מעברי מצב ולזהות מי מאשר כל אחד מהם.',
      relatedProject: 'rightflow',
    },
    general: {
      title: 'מוצר שמוכיח ערך',
      summary: 'מגדירים את העבודה שהמשתמש מנסה לבצע, ואז בוחרים את הארכיטקטורה הפשוטה שתתמוך בה.',
      stages: ['להגדיר את מטרת המשתמש', 'לבדוק אינטראקציה קטנה אמיתית', 'למדוד ולשפר'],
      architecture: ['ממשק ממוקד', 'מודל דומיין מפורש', 'מדידה ומשוב'],
      decision: 'להעדיף גבולות ברורים ושינויים הפיכים על פני מורכבות שלא נדרשת.',
      tradeoff: 'גרסה ראשונה מצומצמת חושפת מוקדם יותר את הארכיטקטורה הנכונה.',
      risk: 'לבנות מערכת מרשימה בלי ראיה לערך עבור המשתמש.',
      nextStep: 'לרשום מה הפעולה הראשונה וכיצד יודעים שהיא הצליחה.',
      relatedProject: 'starlinker',
    },
  },
} as const;

const priorityCopy = {
  en: {
    speed: 'Time-to-first-value is the constraint: cut optional features, keep a measurable vertical slice.',
    reliability: 'Reliability is the constraint: define invariants, retries and a safe rollback first.',
    privacy: 'Privacy is the constraint: minimize collected data and design access boundaries before features.',
  },
  he: {
    speed: 'מהירות היא האילוץ: מצמצמים פיצ׳רים ומתחילים מתהליך קצר שנותן ערך מדיד.',
    reliability: 'אמינות היא האילוץ: מגדירים כללים, ניסיונות חוזרים וחזרה בטוחה לאחור.',
    privacy: 'פרטיות היא האילוץ: אוספים מינימום מידע ומגדירים הרשאות לפני פיצ׳רים.',
  },
} as const;

const scaleCopy = {
  en: {
    prototype: 'Validate with synthetic data, a single happy path and a clearly described manual fallback.',
    growth: 'Add operational monitoring, ownership of failures and repeatable regression tests.',
    enterprise: 'Plan for auditability, isolation, accessibility and contractual requirements before rollout.',
  },
  he: {
    prototype: 'בודקים עם מידע סינתטי, נתיב הצלחה אחד ואפשרות ידנית להמשך.',
    growth: 'מוסיפים מדידה תפעולית, אחריות על כשלים ובדיקות רגרסיה.',
    enterprise: 'מתכננים יכולת ביקורת, בידוד, נגישות ודרישות חוזיות לפני השקה.',
  },
} as const;

/**
 * A deterministic design exercise, NOT personalized AI consulting.
 * Every recommendation is an explicit playbook with visible constraints.
 */
export function buildChallengePlan(
  description: string,
  locale: 'en' | 'he',
  priority: ChallengePriority,
  scale: ChallengeScale,
): ChallengePlan {
  const domain = classifyChallenge(description.slice(0, 600));
  const base = playbooks[locale][domain];
  return {
    domain,
    title: base.title,
    summary: base.summary,
    stages: [...base.stages],
    architecture: [...base.architecture],
    decision: `${base.decision} ${priorityCopy[locale][priority]}`,
    tradeoff: base.tradeoff,
    risk: base.risk,
    nextStep: `${base.nextStep} ${scaleCopy[locale][scale]}`,
    relatedProject: base.relatedProject,
  };
}

export function challengeConstraints(locale: 'en' | 'he', priority: ChallengePriority, scale: ChallengeScale) {
  return { priority: priorityCopy[locale][priority], scale: scaleCopy[locale][scale] };
}
