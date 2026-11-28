'use client';

import { useState, type ReactNode } from 'react';
import { ArrowRight, Check, FileText, Moon, Music2, Sunrise, Wifi, WifiOff } from 'lucide-react';

const local = (he: boolean, en: string, hebrew: string) => he ? hebrew : en;
type Props = { isHebrew: boolean };

function Frame({ isHebrew: he, slug, title, description, tone, concept = false, children }: Props & { slug: string; title: string; description: string; tone: string; concept?: boolean; children: ReactNode }) {
  return (
    <section data-interactive-proof={slug} className={tone + ' px-5 py-16 sm:px-8 sm:py-24 lg:px-12'}>
      <div className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[.65fr_1fr] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.12em]">{concept ? local(he, 'Interactive concept · in development', 'קונספט אינטראקטיבי · בפיתוח') : local(he, 'Interactive illustration · sample data', 'המחשה אינטראקטיבית · נתוני דוגמה')}</p>
          <h2 className="mt-6 max-w-[14ch] text-4xl font-medium tracking-tight sm:text-6xl">{title}</h2>
          <p className="mt-5 max-w-lg text-base leading-7">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function RightFlowProof({ isHebrew: he }: Props) {
  const [checked, setChecked] = useState(false);
  const [resolved, setResolved] = useState(false);
  const rows = [
    { label: local(he, 'Payroll record', 'רשומת שכר'), value: '240.00' },
    { label: local(he, 'Contribution record', 'רשומת הפקדה'), value: '220.00' },
  ];
  return <Frame isHebrew={he} slug="rightflow" tone="bg-[#dce7f5] text-[#17283e]" title={local(he, 'Make the exception visible.', 'להפוך את החריגה לגלויה.')} description={local(he, 'Compare two fictional records, surface the discrepancy, and acknowledge it for human review. This illustration does not perform pension compliance checks.', 'השוו שתי רשומות פיקטיביות, הציפו את ההפרש וסמנו אותו לסקירה אנושית. ההמחשה אינה בדיקת עמידה בחוקי הפנסיה.')}>
    <div className="border border-[#b7c9e0] bg-white p-5 text-[#17283e] sm:p-8">
      <div className="flex items-center justify-between gap-3 border-b border-[#dce7f5] pb-4"><span className="text-xs font-bold tracking-widest">CASE / SAMPLE-01</span><FileText aria-hidden="true" size={20} /></div>
      {rows.map(row => <div key={row.label} className="flex justify-between gap-4 border-b border-[#dce7f5] py-5"><span>{row.label}</span><strong dir="ltr">€{row.value}</strong></div>)}
      <div className="mt-5 min-h-24 border border-[#dce7f5] bg-[#f3f6fa] p-4" aria-live="polite">
        {!checked ? local(he, 'Ready for comparison.', 'מוכן להשוואה.') : <><strong>{local(he, 'Difference: €20.00', 'הפרש: 20 אירו')}</strong><p className="mt-2 text-sm">{resolved ? local(he, 'Acknowledged for human review; not automatically approved.', 'סומן לסקירה אנושית; לא אושר אוטומטית.') : local(he, 'Exception detected. Human review required.', 'נמצאה חריגה. נדרשת סקירה אנושית.')}</p></>}
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><button type="button" data-proof-action onClick={() => setChecked(true)} disabled={checked} className="min-h-11 bg-[#244d88] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{local(he, 'Compare records', 'השוואת רשומות')}</button><button type="button" onClick={() => setResolved(true)} disabled={!checked || resolved} className="min-h-11 border border-[#244d88] px-4 py-3 text-sm disabled:opacity-50">{local(he, 'Acknowledge exception', 'סימון החריגה')}</button><button type="button" onClick={() => {setChecked(false); setResolved(false);}} className="min-h-11 px-3 text-sm underline">{local(he, 'Reset', 'איפוס')}</button></div>
    </div>
  </Frame>;
}

export function WakeMyWayProof({ isHebrew: he }: Props) {
  const [online, setOnline] = useState(true);
  const [triggered, setTriggered] = useState(false);
  return <Frame isHebrew={he} slug="wakemyway" tone="bg-[#f0dfcf] text-[#392923]" title={local(he, 'The alarm survives the network.', 'השעון לא תלוי ברשת.')} description={local(he, 'Disable the simulated network and trigger the local alarm path. The model illustrates why critical delivery is separated from optional intelligence; it does not schedule an actual alarm.', 'כבו את הרשת בהמחשה והפעילו את נתיב ההשכמה המקומי. המודל מדגים את ההפרדה בין השכמה קריטית ליכולות חכמות, ואינו מתזמן שעון אמיתי.')}>
    <div className="rounded-[2rem] bg-[#241c25] p-6 text-[#fff1e0] sm:p-9">
      <div className="flex items-center justify-between text-xs font-semibold tracking-widest"><span>LOCAL RUNTIME / DEMO</span>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}</div>
      <div className="my-8 text-center">{triggered ? <Sunrise className="mx-auto" size={42} aria-hidden="true" /> : <Moon className="mx-auto" size={42} aria-hidden="true" />}<p dir="ltr" className="mt-3 text-6xl font-medium tracking-tighter">07:00</p><p className="mt-3 text-sm" aria-live="polite">{triggered ? local(he, 'Local alarm delivered (simulation)', 'השכמה מקומית הופעלה (המחשה)') : local(he, 'Local alarm ready', 'השכמה מקומית מוכנה')}</p></div>
      <div className="grid gap-3"><button type="button" data-proof-action aria-pressed={!online} onClick={() => setOnline(v => !v)} className="flex min-h-12 items-center justify-between rounded-xl border border-white/35 p-3 text-start">{local(he, 'Simulated network', 'רשת בהמחשה')}<span>{online ? 'ON' : 'OFF'}</span></button><button type="button" onClick={() => setTriggered(v => !v)} className="min-h-12 rounded-xl bg-[#f0c09d] px-4 text-sm font-bold text-[#241c25]">{triggered ? local(he, 'Reset alarm', 'איפוס השעון') : local(he, 'Trigger local alarm', 'הפעלת השכמה מקומית')}</button></div>
    </div>
  </Frame>;
}

export function CartShiftProof({ isHebrew: he }: Props) {
  const [stage, setStage] = useState(0);
  const stages = [
    { name: local(he, 'Lead', 'ליד'), detail: local(he, 'Capture requirements from a prospective client.', 'קליטת דרישות מלקוח פוטנציאלי.') },
    { name: local(he, 'Proposal', 'הצעה'), detail: local(he, 'Carry the requirements into a scoped proposal.', 'העברת הדרישות להצעת עבודה מוגדרת.') },
    { name: local(he, 'Approval', 'אישור'), detail: local(he, 'Keep the approved scope associated with the same project.', 'שמירת היקף העבודה המאושר באותו פרויקט.') },
    { name: local(he, 'Delivery', 'מסירה'), detail: local(he, 'Expose the work and progress through the client portal.', 'הצגת העבודה וההתקדמות דרך פורטל הלקוח.') },
  ];
  return <Frame isHebrew={he} slug="cartshift-studio" tone="bg-[#e2dff2] text-[#29243c]" title={local(he, 'One client. One continuous workflow.', 'לקוח אחד. תהליך רציף אחד.')} description={local(he, 'Move a fictional project through its lifecycle. The same project context remains visible throughout. No real client, payment or proposal is created.', 'העבירו פרויקט דוגמה בין שלבי העבודה. הקשר הפרויקט נשאר גלוי לאורך כל התהליך. לא נוצר לקוח, תשלום או הצעה אמיתיים.')}>
    <div className="bg-[#25233c] p-5 text-white sm:p-8">
      <p className="border-b border-white/25 pb-4 text-xs font-semibold tracking-widest">PROJECT / DEMO-01</p>
      <ol className="mt-5 grid gap-2 sm:grid-cols-2">{stages.map((s,i) => <li key={s.name} className={'flex min-h-16 items-center gap-3 border p-3 ' + (i === stage ? 'border-[#c9bafa] bg-[#514879]' : 'border-white/25')} aria-current={i === stage ? 'step' : undefined}><span className="grid size-7 shrink-0 place-items-center border border-white/40 text-xs">{i < stage ? <Check size={16} aria-hidden="true" /> : i+1}</span>{s.name}</li>)}</ol>
      <p className="mt-5 min-h-16 text-sm leading-6" aria-live="polite">{stages[stage].detail}</p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" data-proof-action disabled={stage === stages.length-1} onClick={() => setStage(s => Math.min(s+1,stages.length-1))} className="inline-flex min-h-11 items-center gap-2 bg-[#ddd6ff] px-4 py-3 text-sm font-bold text-[#25233c] disabled:opacity-50">{local(he, 'Advance stage', 'לשלב הבא')} <ArrowRight size={16} aria-hidden="true" /></button><button type="button" onClick={() => setStage(0)} className="min-h-11 border border-white/40 px-4 text-sm">{local(he, 'Reset', 'איפוס')}</button></div>
    </div>
  </Frame>;
}

export function EnsemblisProof({ isHebrew: he }: Props) {
  const [done, setDone] = useState<number[]>([]);
  const tasks = [local(he, 'Release artwork', 'גרפיקת הריליס'), local(he, 'Metadata and credits', 'מטא-דאטה וקרדיטים'), local(he, 'Launch content', 'תוכן להשקה'), local(he, 'Distribution preparation', 'הכנה להפצה')];
  return <Frame isHebrew={he} slug="ensemblis" concept tone="bg-[#e8dcef] text-[#302439]" title={local(he, 'One release, one shared context.', 'ריליס אחד, הקשר משותף אחד.')} description={local(he, 'Explore a concept checklist for a fictional release. It illustrates the product direction, not a shipped distribution integration.', 'נסו רשימת משימות רעיונית לריליס פיקטיבי. זו המחשה של הכיוון המוצרי, לא אינטגרציית הפצה שהושקה.')}>
    <div className="bg-[#302439] p-5 text-[#f7edff] sm:p-8">
      <div className="flex items-center gap-4 border-b border-white/25 pb-5"><div className="grid size-16 shrink-0 place-items-center bg-[#79578c]"><Music2 size={30} aria-hidden="true" /></div><div><p className="text-xs tracking-widest">CONCEPT RELEASE / 01</p><p className="mt-2 text-xl font-bold">Night Signals</p></div></div>
      <div className="mt-5 flex justify-between text-sm"><span>{local(he, 'Preparation progress', 'התקדמות ההכנה')}</span><span aria-live="polite">{done.length} / {tasks.length}</span></div>
      <div className="mt-2 h-2 bg-white/15" role="progressbar" aria-label={local(he, 'Preparation progress', 'התקדמות ההכנה')} aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done.length}><div className="h-full bg-[#d6b7ed]" style={{width: (done.length / tasks.length * 100) + '%'}} /></div>
      <div className="mt-5 grid gap-2">{tasks.map((task,i) => <label key={task} className="flex min-h-12 cursor-pointer items-center gap-3 border border-white/25 p-3"><input type="checkbox" data-proof-action={i === 0 ? 'true' : undefined} checked={done.includes(i)} onChange={event => setDone(old => event.target.checked ? [...old,i] : old.filter(v => v !== i))} className="size-5 accent-[#d6b7ed]" /><span>{task}</span></label>)}</div>
    </div>
  </Frame>;
}
