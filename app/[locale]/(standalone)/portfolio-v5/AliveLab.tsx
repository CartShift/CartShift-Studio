'use client';

import { useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, Circle,
  Command, GitBranch, LockKeyhole, RotateCcw, ShieldCheck, Sparkles,
} from 'lucide-react';
import {
  buildChallengePlan,
  challengeConstraints,
  type ChallengePriority,
  type ChallengeScale,
} from '@/lib/yotam-alive-challenge';

type Locale = 'en' | 'he';
type Props = { locale: Locale };
type LabProps = Props & { slug: string };

const common = {
  en: {
    sample: 'INTERACTIVE MODEL · SYNTHETIC DATA',
    caption: 'This is a simulated interaction, not a connection to a live product or customer account.',
    reset: 'Start over',
    next: 'Next',
    undo: 'Undo',
    blocked: 'Action blocked',
    applied: 'Action applied',
  },
  he: {
    sample: 'מודל אינטראקטיבי · מידע סינתטי',
    caption: 'זוהי סימולציה, לא חיבור למוצר חי או לחשבון לקוח.',
    reset: 'להתחיל מחדש',
    next: 'הבא',
    undo: 'ביטול',
    blocked: 'הפעולה נחסמה',
    applied: 'הפעולה בוצעה',
  },
};

function LabFrame({
  locale, name, children, note,
}: Props & { name: string; children: React.ReactNode; note?: string }) {
  const t = common[locale];
  return (
    <div className="alive-lab" aria-label={name}>
      <div className="alive-lab-head">
        <span className="alive-lab-status"><span className="alive-lab-pulse" />{t.sample}</span>
        <strong>{name}</strong>
      </div>
      {children}
      <p className="alive-lab-disclaimer">{note ?? t.caption}</p>
    </div>
  );
}

function StarLinkerLab({ locale }: Props) {
  const he = locale === 'he';
  const t = common[locale];
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [status, setStatus] = useState<'pending' | 'blocked' | 'applied'>('pending');
  const nodes = he ? ['מטרה שנתית', 'פרויקט נבחר', 'משימה חדשה'] : ['Annual goal', 'Project', 'New task'];
  const tryAction = () => setStatus(role === 'editor' ? 'applied' : 'blocked');
  return (
    <LabFrame locale={locale} name={he ? 'סוכן עם הרשאות ו-Undo' : 'Permission-aware agent + undo'}>
      <div className="alive-graph" aria-label={he ? 'גרף עבודה לדוגמה' : 'Example workspace graph'}>
        {nodes.map((node, index) => (
          <div key={node} className={'alive-graph-node alive-graph-node--' + index + (index === 2 && status === 'applied' ? ' is-created' : '')}>
            <span>{index === 2 ? <Sparkles size={15} /> : <GitBranch size={15} />}</span>
            <strong>{node}</strong>
            {index < 2 && <span className="alive-graph-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <div className="alive-lab-metadata">
        <span>{he ? 'זהות המבקר' : 'Visitor role'}</span>
        <div className="alive-lab-segment" role="group" aria-label={he ? 'בחירת הרשאה' : 'Choose permission'}>
          <button type="button" aria-pressed={role === 'viewer'} onClick={() => { setRole('viewer'); setStatus('pending'); }}>{he ? 'צופה' : 'Viewer'}</button>
          <button type="button" aria-pressed={role === 'editor'} onClick={() => { setRole('editor'); setStatus('pending'); }}>{he ? 'עורך' : 'Editor'}</button>
        </div>
      </div>
      <div className={'alive-lab-decision alive-lab-decision--' + status} role="status">
        <LockKeyhole size={17}/>
        <span>{status === 'pending' ? (he ? 'הסוכן מציע ליצור משימה תחת הפרויקט' : 'Agent proposes creating a task in this project')
          : status === 'blocked' ? (he ? 'אין הרשאת כתיבה. המערכת לא שונתה.' : 'Viewer permission denies the write. Nothing changed.')
          : (he ? 'המשימה נוספה. אפשר לבטל את הפעולה.' : 'Task added to the workspace. Undo is available.')}</span>
      </div>
      <div className="alive-lab-actions">
        <button type="button" className="alive-lab-primary" onClick={tryAction} disabled={status === 'applied'}>
          <ShieldCheck size={15}/>{he ? 'לאמת ולבצע פעולה' : 'Authorize + apply'}
        </button>
        <button type="button" onClick={() => setStatus('pending')} disabled={status === 'pending'}>
          <RotateCcw size={15}/>{t.undo}
        </button>
      </div>
    </LabFrame>
  );
}

function RightFlowLab({ locale }: Props) {
  const he = locale === 'he';
  const [reviewed, setReviewed] = useState(false);
  const records = [
    { label: he ? 'דיווח הפקדה' : 'Reported contribution', amount: 1250 },
    { label: he ? 'סכום במסמך מוסדי' : 'Institution record', amount: 1175 },
  ];
  return (
    <LabFrame locale={locale} name={he ? 'מנוע אימות עם חריגות' : 'Traceable document verification'}>
      <div className="alive-document-pair">
        {records.map((r, index) => (
          <div className="alive-document" key={r.label}>
            <span>{he ? 'מסמך סינתטי' : 'Synthetic document'} / 0{index + 1}</span>
            <strong>{r.label}</strong>
            <div className="alive-document-amount" dir="ltr">₪{r.amount.toLocaleString('en-US')}.00</div>
          </div>
        ))}
      </div>
      <div className="alive-verification-results" aria-live="polite">
        <div className="alive-verification-result">
          <CheckCircle2 size={17}/>
          <span>{he ? 'זוהתה התאמה: מזהה עובד ותקופה' : 'Match confirmed: employee ID and period'}</span>
        </div>
        {reviewed && (
          <div className="alive-verification-result is-warning">
            <Activity size={18}/>
            <span>{he ? 'חריגה: פער של ₪75 בין המסמכים, דורש בדיקה אנושית' : 'Exception: ₪75 discrepancy. Human review required.'}</span>
          </div>
        )}
      </div>
      <div className="alive-lab-actions">
        <button type="button" className="alive-lab-primary" onClick={() => setReviewed(true)} disabled={reviewed}>
          {he ? 'הרצת בדיקה' : 'Run verification'}<ArrowRight size={15}/>
        </button>
        <button type="button" onClick={() => setReviewed(false)} disabled={!reviewed}><RotateCcw size={15}/>{common[locale].reset}</button>
      </div>
    </LabFrame>
  );
}

function WakeMyWayLab({ locale }: Props) {
  const he = locale === 'he';
  const steps = he
    ? ['מתוכנן', 'השעון מצלצל', 'בדיקת תגובה', 'השכמה הושלמה']
    : ['Scheduled', 'Alarm active', 'Response check', 'Awake'];
  const [step, setStep] = useState(0);
  return (
    <LabFrame locale={locale} name={he ? 'מכונת מצבים מקומית' : 'Local-first wake state machine'}>
      <div className="alive-alarm">
        <div className="alive-alarm-time" dir="ltr">07:00</div>
        <span className="alive-alarm-stage">{steps[step]}</span>
        <div className="alive-alarm-bars" aria-hidden="true">
          {Array.from({ length: 17 }, (_, i) => <i key={i} style={{ height: 9 + ((i * 23) % 42) }} className={step > 0 && step < 3 ? 'is-active' : ''} />)}
        </div>
      </div>
      <ol className="alive-lab-timeline">
        {steps.map((label, i) => (
          <li key={label} className={i <= step ? 'is-complete' : ''}>
            <span>{i < step ? <Check size={11}/> : i + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div className="alive-lab-decision" role="status"><Activity size={16}/>{
        he ? 'ההדגמה אינה מפעילה התראות או מערכת שעון במכשיר.' : 'Simulation only — no device alarm or notification is scheduled.'
      }</div>
      <div className="alive-lab-actions">
        <button type="button" className="alive-lab-primary" disabled={step === 3} onClick={() => setStep(s => Math.min(3, s + 1))}>
          {step === 0 ? (he ? 'הפעלת סימולציה' : 'Simulate alarm') :
            step === 1 ? (he ? 'התחלת תגובה' : 'Respond') : (he ? 'אישור התעוררות' : 'Confirm awake')}
          <ArrowRight size={15}/>
        </button>
        <button type="button" onClick={() => setStep(0)} disabled={step === 0}><RotateCcw size={15}/>{common[locale].reset}</button>
      </div>
    </LabFrame>
  );
}

function CartShiftLab({ locale }: Props) {
  const he = locale === 'he';
  const steps = he ? ['ליד', 'סקירה', 'הצעה', 'פרויקט'] : ['Lead', 'Review', 'Proposal', 'Project'];
  const [step, setStep] = useState(0);
  return (
    <LabFrame locale={locale} name={he ? 'ממערכת לידים לפרויקט' : 'From qualified lead to delivery'}>
      <div className="alive-pipeline">
        <div className="alive-pipeline-label">{he ? 'לקוח דוגמה · חנות פיקטיבית' : 'Sample client · fictional shop'}</div>
        <h4>{he ? 'חנות הגינה' : 'The Garden Store'}<span>{he ? 'מסחר מקוון' : 'E-commerce'}</span></h4>
        <ol>
          {steps.map((label, i) => (
            <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
              <span>{i < step ? <Check size={13}/> : String(i + 1).padStart(2, '0')}</span>{label}
            </li>
          ))}
        </ol>
      </div>
      <div className="alive-lab-decision" role="status"><Command size={16}/>{
        he ? ['פרטי ליד נאספו', 'ממצאי הסקירה תועדו', 'הצעת עבודה נשלחה לאישור', 'הפרויקט נפתח ומקושר לליד'][step] :
          ['Lead details captured', 'Review findings recorded', 'Proposal submitted for approval', 'Project linked to original lead'][step]
      }</div>
      <div className="alive-lab-actions">
        <button type="button" className="alive-lab-primary" disabled={step === 3} onClick={() => setStep(s => Math.min(3, s + 1))}>
          {he ? 'להתקדם בתהליך' : 'Advance workflow'}<ArrowRight size={15}/>
        </button>
        <button type="button" onClick={() => setStep(0)} disabled={step === 0}><RotateCcw size={15}/>{common[locale].reset}</button>
      </div>
    </LabFrame>
  );
}

function EnsemblisLab({ locale }: Props) {
  const he = locale === 'he';
  const tasks = he ? ['מאסטר אודיו', 'עטיפה מאושרת', 'מטא־דאטה להפצה'] : ['Audio master', 'Approved artwork', 'Release metadata'];
  const [checked, setChecked] = useState<boolean[]>([true, false, false]);
  const ready = checked.every(Boolean);
  return (
    <LabFrame locale={locale} name={he ? 'תכנון ריליס עם תלויות' : 'Release readiness dependencies'}>
      <div className="alive-release">
        <div className="alive-release-art" aria-hidden="true"><div className="alive-release-vinyl"><span/></div></div>
        <div className="alive-release-info">
          <span>{he ? 'ריליס לדוגמה' : 'Sample release'}</span>
          <h4>AFTER HOURS / EP</h4>
          <p>{he ? 'בחרו מה הושלם ותראו האם ניתן להתקדם להפצה.' : 'Complete prerequisites to unlock distribution.'}</p>
        </div>
      </div>
      <div className="alive-lab-checklist">
        {tasks.map((task, i) => (
          <label key={task}><input type="checkbox" checked={checked[i]}
            onChange={() => setChecked(prev => prev.map((v, j) => i === j ? !v : v))}/>
            <span aria-hidden="true">{checked[i] ? <CheckCircle2 size={19}/> : <Circle size={19}/>}</span>{task}
          </label>
        ))}
      </div>
      <div className={'alive-lab-decision' + (ready ? ' is-ready' : '')} role="status">
        {ready ? <CheckCircle2 size={17}/> : <LockKeyhole size={17}/>}
        {ready ? (he ? 'מוכן לסקירת הפצה — כל התלויות סגורות' : 'Ready for distribution review — prerequisites complete')
          : (he ? 'ההפצה חסומה עד שכל התלויות יושלמו' : 'Distribution blocked until prerequisites are complete')}
      </div>
      <div className="alive-lab-actions">
        <button type="button" onClick={() => setChecked([true, false, false])}><RotateCcw size={15}/>{common[locale].reset}</button>
      </div>
    </LabFrame>
  );
}

export function ProjectMiniLab({ slug, locale }: LabProps) {
  switch (slug) {
    case 'starlinker': return <StarLinkerLab locale={locale}/>;
    case 'rightflow': return <RightFlowLab locale={locale}/>;
    case 'wakemyway': return <WakeMyWayLab locale={locale}/>;
    case 'cartshift-studio': return <CartShiftLab locale={locale}/>;
    case 'ensemblis': return <EnsemblisLab locale={locale}/>;
    default: return null;
  }
}

const challengeExamples = {
  en: [
    'An AI agent that can update customer accounts',
    'A Shopify experience with better conversion',
    'An approval process across three teams',
  ],
  he: [
    'סוכן AI שמעדכן חשבונות לקוחות',
    'חנות Shopify עם המרות טובות יותר',
    'תהליך אישורים בין שלושה צוותים',
  ],
};

export function ChallengeLab({ locale, onExplore }: Props & { onExplore: (slug: string) => void }) {
  const he = locale === 'he';
  const [description, setDescription] = useState(challengeExamples[locale][0]);
  const [priority, setPriority] = useState<ChallengePriority>('reliability');
  const [scale, setScale] = useState<ChallengeScale>('prototype');
  const [submitted, setSubmitted] = useState<{ description: string; priority: ChallengePriority; scale: ChallengeScale } | null>(null);
  const plan = useMemo(() => submitted ? buildChallengePlan(submitted.description, locale, submitted.priority, submitted.scale) : null, [locale, submitted]);
  const constraints = submitted ? challengeConstraints(locale, submitted.priority, submitted.scale) : null;
  return (
    <div className="alive-challenge" aria-labelledby="alive-challenge-title">
      <span className="alive-index">03 / DESIGN EXERCISE</span>
      <h3 id="alive-challenge-title">{he ? 'תאתגרו את החשיבה שלי.' : 'Give the thinking a challenge.'}</h3>
      <p className="alive-challenge-lead">{he
        ? 'הגדירו בעיה ואילוצים. קבלו מסגרת הנדסית שקופה, שנבנתה מראש מתוך עקרונות מוצר — לא תשובת AI מומצאת.'
        : 'Describe the problem and set constraints. Explore a transparent engineering playbook — not a fabricated AI consultation.'}</p>
      <form className="alive-challenge-form" onSubmit={event => {
        event.preventDefault();
        if (description.trim().length < 10) return;
        setSubmitted({ description: description.trim().slice(0, 500), priority, scale });
      }}>
        <label htmlFor="alive-challenge-problem">{he ? 'מה הייתם רוצים לבנות?' : 'What would you build?'}</label>
        <textarea id="alive-challenge-problem" value={description} onChange={event => setDescription(event.target.value)}
          maxLength={500} minLength={10} rows={3} required />
        <div className="alive-challenge-examples" aria-label={he ? 'בעיות לדוגמה' : 'Example problems'}>
          {challengeExamples[locale].map(example =>
            <button type="button" key={example} onClick={() => { setDescription(example); setSubmitted(null); }}>{example}</button>)}
        </div>
        <div className="alive-challenge-controls">
          <label>{he ? 'מה הכי חשוב?' : 'Primary constraint'}
            <select value={priority} onChange={event => setPriority(event.target.value as ChallengePriority)}>
              <option value="reliability">{he ? 'אמינות' : 'Reliability'}</option>
              <option value="speed">{he ? 'מהירות יציאה' : 'Speed to launch'}</option>
              <option value="privacy">{he ? 'פרטיות' : 'Privacy'}</option>
            </select>
          </label>
          <label>{he ? 'שלב המוצר' : 'Product scale'}
            <select value={scale} onChange={event => setScale(event.target.value as ChallengeScale)}>
              <option value="prototype">{he ? 'אב־טיפוס' : 'Prototype'}</option>
              <option value="growth">{he ? 'צמיחה' : 'Growth'}</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
        </div>
        <button type="submit" className="alive-lab-primary">
          <Sparkles size={16}/>{he ? 'לבנות גישת פתרון' : 'Explore an approach'}<ArrowRight size={17}/>
        </button>
      </form>
      {plan && constraints && (
        <div className="alive-challenge-result" role="status" aria-label={he ? 'תוכנית פתרון' : 'Solution outline'}>
          <span className="alive-lab-status"><span className="alive-lab-pulse"/>{he ? 'מסגרת חשיבה · לא ייעוץ אישי' : 'STRUCTURED PLAYBOOK · NOT CUSTOM ADVICE'}</span>
          <h4>{plan.title}</h4>
          <p>{plan.summary}</p>
          <div className="alive-challenge-flow" aria-label={he ? 'שלבי תכנון' : 'Architecture boundaries'}>
            {plan.architecture.map((item,i) => <div key={item}><span>0{i+1}</span><strong>{item}</strong></div>)}
          </div>
          <div className="alive-challenge-facts">
            <p><strong>{he ? 'החלטה' : 'Decision'}</strong>{plan.decision}</p>
            <p><strong>{he ? 'מחיר הפשרה' : 'Trade-off'}</strong>{plan.tradeoff}</p>
            <p><strong>{he ? 'סיכון מרכזי' : 'Risk'}</strong>{plan.risk}</p>
            <p><strong>{he ? 'האילוצים שבחרתם' : 'Your constraints'}</strong>{constraints.priority} {constraints.scale}</p>
          </div>
          <div className="alive-challenge-next"><strong>{he ? 'הצעד הראשון' : 'First step'}</strong><p>{plan.nextStep}</p></div>
          <button type="button" className="alive-challenge-related" onClick={() => onExplore(plan.relatedProject)}>
            {he ? 'לראות פרויקט רלוונטי' : 'Explore relevant work'}<ArrowRight size={16}/>
          </button>
        </div>
      )}
      <p className="alive-lab-disclaimer">{he
        ? 'הדמו לא שולח מידע למודל, לא ניגש לפרויקטים אמיתיים ולא שומר את השאלה. תכנון לדוגמה המבוסס על תבניות, לא ייעוץ הנדסי אישי.'
        : 'No model calls, live systems or saved input. An illustrative, deterministic design exercise — not a bespoke engineering specification.'}</p>
    </div>
  );
}
