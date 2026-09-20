'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, X } from 'lucide-react';
import type { PortfolioShowcaseProject, ShowcaseMedia } from '@/lib/portfolio-showcase';

type Props = {
  project: PortfolioShowcaseProject;
  nextProject: PortfolioShowcaseProject | null;
  locale: string;
};

type StoryProps = {
  project: PortfolioShowcaseProject;
  isHebrew: boolean;
  reveal: MotionProps;
  onOpen: (media: ShowcaseMedia) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;
const copy = (isHebrew: boolean, he: string, en: string) => (isHebrew ? he : en);

function ProductImage({ media, eager = false, className = '' }: { media: ShowcaseMedia; eager?: boolean; className?: string }) {
  return (
    // Native img supports local portfolio assets and public product evidence hosted on GitHub.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.src}
      alt={media.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`${media.contain ? 'object-contain' : 'object-cover'} ${className}`}
    />
  );
}

function Screen({
  media,
  onOpen,
  eager = false,
  mode = 'desktop',
  className = '',
}: {
  media: ShowcaseMedia;
  onOpen: () => void;
  eager?: boolean;
  mode?: 'desktop' | 'phone' | 'bare';
  className?: string;
}) {
  const shell =
    mode === 'phone'
      ? 'aspect-[9/16] rounded-[2.2rem] bg-[#101012] p-2.5 shadow-[0_35px_100px_rgba(0,0,0,.24)] sm:p-3'
      : mode === 'bare'
        ? 'bg-transparent'
        : 'aspect-[16/10] bg-white p-2 shadow-[0_28px_90px_rgba(18,18,20,.14)] sm:p-3';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative block w-full overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111113] ${shell} ${className}`}
      aria-label={media.alt}
    >
      <ProductImage
        media={media}
        eager={eager}
        className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.01] ${mode === 'phone' ? 'rounded-[1.55rem]' : ''}`}
      />
      <span className="absolute end-3 top-3 rounded-full bg-[#111113] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-white opacity-0 transition-opacity group-hover:opacity-100">
        ↗
      </span>
    </button>
  );
}

function Label({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] ${light ? 'text-white/62' : 'text-black/55'}`}>
      {children}
    </p>
  );
}

function ProjectSnapshot({ project, isHebrew }: { project: PortfolioShowcaseProject; isHebrew: boolean }) {
  const labels = isHebrew
    ? { status: 'סטטוס', period: 'תקופה', ownership: 'Ownership', scope: 'Scope מוכח', stack: 'Stack' }
    : { status: 'Status', period: 'Period', ownership: 'Ownership', scope: 'Product scope', stack: 'Stack' };

  return (
    <section className="border-y border-black/12 bg-[#f7f5f0] px-5 py-8 text-[#171719] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-px bg-black/12 lg:grid-cols-[.7fr_.55fr_1.35fr_1.7fr]">
          {[
            [labels.status, project.status ?? (isHebrew ? 'פעיל' : 'Active')],
            [labels.period, project.year],
            [labels.ownership, project.role],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#f7f5f0] p-5 sm:p-6">
              <Label>{label}</Label>
              <p className="mt-3 text-sm leading-6 text-black/68 sm:text-[15px]">{value}</p>
            </div>
          ))}
          <div className="bg-[#f7f5f0] p-5 sm:p-6">
            <Label>{labels.scope}</Label>
            <ul className="mt-3 space-y-2">
              {project.highlights.map(item => (
                <li key={item} className="grid grid-cols-[auto_1fr] gap-2 text-sm leading-6 text-black/68">
                  <span className="mt-[.72rem] h-px w-3 bg-black/38" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-px flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#ece9e2] px-5 py-4 sm:px-6">
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/42">{labels.stack}</span>
          {project.technologies.map(technology => (
            <span key={technology} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/58">{technology}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechnicalEvidence({
  isHebrew,
  eyebrow,
  title,
  body,
  steps,
  dark = false,
}: {
  isHebrew: boolean;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
  dark?: boolean;
}) {
  return (
    <section className={`${dark ? 'bg-[#171719] text-white' : 'bg-white text-[#171719]'} px-5 py-20 sm:px-8 sm:py-28 lg:px-12`}>
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-10 lg:grid-cols-[.34fr_1fr] lg:gap-20">
          <div>
            <Label light={dark}>{eyebrow}</Label>
            <p className={`mt-5 max-w-sm text-sm leading-6 ${dark ? 'text-white/62' : 'text-black/58'}`}>{body}</p>
          </div>
          <div>
            <h2 className="max-w-[12ch] text-[12vw] font-medium leading-[.84] tracking-[-.065em] sm:text-[6.5vw] lg:text-[4.8vw] xl:text-[4.8rem]">{title}</h2>
            <div className={`mt-12 grid gap-px ${dark ? 'bg-white/14' : 'bg-black/14'} sm:grid-cols-2 lg:grid-cols-5`}>
              {steps.map((step, index) => (
                <div key={step} className={`${dark ? 'bg-[#1f1f22]' : 'bg-[#f4f1eb]'} min-h-32 p-5 sm:p-6`}>
                  <span className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/38' : 'text-black/38'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <p className="mt-8 text-base font-medium leading-6 tracking-[-0.02em]">{step}</p>
                </div>
              ))}
            </div>
            <p className={`mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] ${dark ? 'text-white/38' : 'text-black/38'}`}>
              {isHebrew ? 'תרשים מפושט של גבולות המערכת' : 'Simplified system boundary'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EngineeringDecisions({
  isHebrew,
  items,
  dark = false,
}: {
  isHebrew: boolean;
  items: Array<[string, string]>;
  dark?: boolean;
}) {
  return (
    <section className={`${dark ? 'bg-[#171719] text-white' : 'bg-[#eceae5] text-[#171719]'} px-5 py-16 sm:px-8 sm:py-20 lg:px-12`}>
      <div className="mx-auto max-w-[1680px]">
        <div className="grid gap-8 lg:grid-cols-[.28fr_1fr] lg:gap-20">
          <div>
            <Label light={dark}>{isHebrew ? 'החלטות הנדסיות' : 'Engineering decisions'}</Label>
            <p className={`mt-4 max-w-xs text-sm leading-6 ${dark ? 'text-white/62' : 'text-black/58'}`}>
              {isHebrew
                ? 'כמה מהבחירות שמחזיקות את המוצר אמין, ניתן להבנה וניתן לשינוי.'
                : 'A few of the choices that keep the product reliable, understandable and changeable.'}
            </p>
          </div>
          <div className={`grid gap-px ${dark ? 'bg-white/14' : 'bg-black/14'} lg:grid-cols-3`}>
            {items.map(([title, body], index) => (
              <div key={title} className={`${dark ? 'bg-[#1f1f22]' : 'bg-[#f6f3ed]'} p-6 sm:p-7`}>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-white/44' : 'text-black/42'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-7 text-2xl font-medium tracking-[-0.04em]">{title}</h3>
                <p className={`mt-4 text-sm leading-6 ${dark ? 'text-white/66' : 'text-black/62'}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SharedHeader({ project, locale, isHebrew }: { project: PortfolioShowcaseProject; locale: string; isHebrew: boolean }) {
  const portfolioHref = `/${locale}/yotam#work`;
  const cvHref = `/${locale}/yotam#experience`;

  return (
    <header className="absolute inset-x-0 top-0 z-40 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
      <nav className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]" aria-label={isHebrew ? 'ניווט בפרויקט' : 'Project navigation'}>
        <a href={portfolioHref} className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="text-white/50">©</span>
          <span>Yotam Faraggi</span>
        </a>
        <div className="flex items-center gap-4 sm:gap-7">
          <a href={portfolioHref} className="hidden text-white/74 transition-colors hover:text-white sm:inline">{isHebrew ? 'פורטפוליו' : 'Portfolio'}</a>
          <a href={cvHref} className="hidden text-white/74 transition-colors hover:text-white sm:inline">CV</a>
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/20 px-4 py-2.5 text-white backdrop-blur transition-colors hover:bg-white hover:text-[#111113]">
              {isHebrew ? 'למוצר' : 'Live product'} <ArrowUpRight className="size-3.5" />
            </a>
          ) : (
            <span className="rounded-full border border-white/28 bg-black/20 px-4 py-2.5 text-white/78 backdrop-blur">{project.status}</span>
          )}
        </div>
      </nav>
    </header>
  );
}

function StarLinkerStory({ project, isHebrew, reveal, onOpen }: StoryProps) {
  const hero = project.hero;
  const dark = project.gallery[0];

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-[#111113] px-5 pb-8 pt-28 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12">
        <div className="pointer-events-none absolute end-[-12%] top-[8%] size-[62vw] rounded-full bg-[#7568f2]/20 blur-[120px]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-9rem)] max-w-[1680px] items-end gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
          <div className="pb-8 lg:pb-14">
            <Label light>{project.number} · {project.year}</Label>
            <motion.h1 initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mt-7 text-[18vw] font-medium leading-[.76] tracking-[-.075em] text-white sm:text-[11vw] lg:text-[7.8vw] xl:text-[7.8rem]" dir="ltr">
              Star<br />Linker
            </motion.h1>
            <p className="mt-8 max-w-xl text-lg leading-7 text-white/76 sm:text-2xl sm:leading-9">
              {copy(isHebrew, 'לא עוד מנהל משימות. מרחב חשיבה שבו מטרות, פרויקטים, משימות והרגלים באמת קשורים זה לזה.', 'Not another task manager. A thinking space where goals, projects, tasks and habits are actually connected.')}
            </p>
          </div>
          {hero ? (
            <motion.div {...reveal} className="relative self-end lg:-mb-10">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#7568f2]/16 blur-2xl" />
              <div className="relative rotate-[1.2deg] bg-[#d8d3ff] p-3 sm:p-5">
                <Screen media={hero} onOpen={() => onOpen(hero)} eager />
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      <ProjectSnapshot project={project} isHebrew={isHebrew} />

      <section className="bg-[#eceae5] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.34fr_1fr] lg:gap-20">
            <Label>{copy(isHebrew, 'הרעיון', 'The idea')}</Label>
            <div>
              <h2 className="max-w-[11ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] text-[#171719] sm:text-[7vw] lg:text-[5.8vw] xl:text-[5.8rem]">
                {copy(isHebrew, 'הקשרים הם המוצר.', 'The connections are the product.')}
              </h2>
              <p className="mt-10 max-w-3xl text-xl leading-8 text-black/68 sm:text-3xl sm:leading-[1.22]">
                {copy(isHebrew, 'רוב כלי הפרודוקטיביות שומרים מידע. StarLinker מנסה לשמור הקשר: למה המשימה קיימת, לאיזו מטרה היא שייכת ומה עוד זז יחד איתה.', 'Most productivity tools store information. StarLinker is built to preserve context: why a task exists, which goal it serves, and what else moves with it.')}
              </p>
            </div>
          </motion.div>

          <motion.div {...reveal} className="mt-20 grid gap-px bg-black/15 sm:grid-cols-4 lg:ms-[24%] lg:mt-28">
            {[copy(isHebrew, 'מטרות', 'Goals'), copy(isHebrew, 'פרויקטים', 'Projects'), copy(isHebrew, 'משימות', 'Tasks'), copy(isHebrew, 'הרגלים', 'Habits')].map((item, index) => (
              <div key={item} className="bg-[#f5f3ef] p-6 sm:min-h-44 sm:p-7">
                <span className="text-[9px] font-semibold tracking-[0.16em] text-black/35">0{index + 1}</span>
                <p className="mt-12 text-2xl font-medium tracking-[-.04em] sm:text-3xl">{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {dark ? (
        <section className="overflow-hidden bg-[#19191c] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[.42fr_1fr] lg:items-center lg:gap-16">
            <motion.div {...reveal}>
              <Label light>{copy(isHebrew, 'הסוכן', 'The agent')}</Label>
              <h2 className="mt-7 max-w-[9ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] sm:text-[7vw] lg:text-[5.2vw] xl:text-[5.2rem]">
                {copy(isHebrew, 'AI שנמצא בתוך המפה.', 'AI that lives inside the map.')}
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-8 text-white/68">
                {copy(isHebrew, 'היעד לא היה צ׳אט בצד. הסוכן צריך להבין את מבנה סביבת העבודה ולבצע פעולות אמיתיות בתוכה.', 'The goal was never a chat box on the side. The agent needs to understand the workspace structure and take real actions inside it.')}
              </p>
            </motion.div>
            <motion.div {...reveal} className="bg-[#26242d] p-3 sm:p-6">
              <Screen media={dark} onOpen={() => onOpen(dark)} />
            </motion.div>
          </div>
        </section>
      ) : null}

      <TechnicalEvidence
        isHebrew={isHebrew}
        eyebrow={copy(isHebrew, 'מתחת לממשק', 'Under the hood')}
        title={copy(isHebrew, 'Graph אחד. נתיב mutation אחד.', 'One graph. One mutation path.')}
        body={copy(
          isHebrew,
          'ה-UI עובד מול graph state מקומי. Replicache מנהל mutations ו-sync, PostgreSQL/Drizzle נשארים בסיס הנתונים, ו-Supabase משמש ל-auth, storage ואותות realtime. כלי ה-AI פועלים דרך פעולות domain עם הרשאות במקום לעקוף את המודל.',
          'The UI works against local graph state. Replicache owns mutations and sync, PostgreSQL/Drizzle remain the database, and Supabase handles auth, storage and realtime signals. AI tools go through permission-aware domain actions instead of bypassing the model.'
        )}
        steps={[
          'Graph UI + Zustand',
          'Replicache mutations',
          'Push / pull sync',
          'PostgreSQL + Drizzle',
          'Realtime + AI tools',
        ]}
        dark
      />

      <EngineeringDecisions
        isHebrew={isHebrew}
        items={[
          [
            copy(isHebrew, 'פעולות מפורשות לסוכן', 'Explicit agent actions'),
            copy(
              isHebrew,
              'פעולות AI עוברות דרך פעולות מוגדרות והרשאות במקום לאפשר לסוכן לשנות את הממשק בצורה חופשית.',
              'AI changes go through defined, permissioned actions instead of letting the agent mutate the interface freely.'
            ),
          ],
          [
            copy(isHebrew, 'ה-State נשאר מקור האמת', 'State stays authoritative'),
            copy(
              isHebrew,
              'פעולות הסוכן מתעדכנות דרך מצב האפליקציה ומופיעות מיד ב-UI, כך שהמוצר והסוכן נשארים מסונכרנים.',
              'Agent actions flow through application state and surface as live UI updates, keeping the product and agent in sync.'
            ),
          ],
          [
            copy(isHebrew, 'AI שניתן לבטל', 'Reversible AI'),
            copy(
              isHebrew,
              'שינויים שמגיעים מהסוכן ניתנים ל-undo כדי שמשתמשים יוכלו לבדוק פעולה, לשנות כיוון ולשמור שליטה.',
              'Agent-driven changes are undoable so users can inspect an action, change direction and stay in control.'
            ),
          ],
        ]}
      />
      <ProjectCredits project={project} isHebrew={isHebrew} tone="light" lead={copy(isHebrew, 'מוצר founder-led שנבנה מהרעיון ועד הקוד.', 'A founder-led product built from concept through code.')} />
    </>
  );
}

function RightFlowStory({ project, isHebrew, reveal, onOpen }: StoryProps) {
  const hero = project.hero;
  const review = project.gallery[0];
  const steps = [
    [copy(isHebrew, 'קליטה', 'Ingest'), copy(isHebrew, 'מסמכים ממקורות שונים נכנסים לאותו תיק בדיקה.', 'Documents from different sources enter one review case.')],
    [copy(isHebrew, 'אימות', 'Verify'), copy(isHebrew, 'המערכת הופכת בדיקות חוזרות לזרימה עקבית עם חריגות ברורות.', 'Repeated checks become a consistent flow with explicit exceptions.')],
    [copy(isHebrew, 'החלטה', 'Decide'), copy(isHebrew, 'הממצאים נשארים ניתנים להסבר ויוצאים לדוח שימושי.', 'Findings remain explainable and export into a usable report.')],
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[#0f1724] px-5 pb-20 pt-32 text-white sm:px-8 sm:pb-28 lg:px-12 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-[1680px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_.38fr] lg:items-end">
            <div>
              <Label light>{project.number} · {copy(isHebrew, 'מערכת אימות', 'Verification system')}</Label>
              <motion.h1 initial={{ opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mt-8 max-w-[10ch] text-[18vw] font-medium leading-[.76] tracking-[-.075em] text-white sm:text-[11vw] lg:text-[8vw] xl:text-[8rem]" dir="ltr">
                RightFlow
              </motion.h1>
            </div>
            <p className="border-t border-white/22 pt-6 text-lg leading-8 text-white/72 sm:text-xl">
              {copy(isHebrew, 'מערכת שמחליפה ערימות מסמכים ותהליך בדיקה עמום בנתיב החלטה שאפשר לעקוב אחריו.', 'A system that turns document piles and ambiguous review work into a decision trail you can follow.')}
            </p>
          </div>
          {hero ? (
            <motion.div {...reveal} className="mt-14 overflow-hidden border border-white/12 bg-[#dbe7fb] p-3 sm:mt-20 sm:p-6">
              <Screen media={hero} onOpen={() => onOpen(hero)} eager />
            </motion.div>
          ) : null}
        </div>
      </section>

      <ProjectSnapshot project={project} isHebrew={isHebrew} />

      <section className="bg-white px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.28fr_1fr] lg:gap-20">
            <Label>{copy(isHebrew, 'הזרימה', 'The workflow')}</Label>
            <h2 className="max-w-[12ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] text-[#172033] sm:text-[7vw] lg:text-[5.8vw] xl:text-[5.8rem]">
              {copy(isHebrew, 'ממסמך גולמי לממצא שאפשר להגן עליו.', 'From raw document to defensible finding.')}
            </h2>
          </motion.div>
          <div className="mt-20 grid gap-5 lg:ms-[28%] lg:grid-cols-3">
            {steps.map(([title, description], index) => (
              <motion.div {...reveal} key={title} className="border-t-4 border-[#2563eb] bg-[#f1f5fb] p-6 sm:min-h-[22rem] sm:p-8">
                <span className="text-[10px] font-semibold tracking-[0.18em] text-[#2563eb]">0{index + 1}</span>
                <h3 className="mt-14 text-4xl font-medium tracking-[-.055em] text-[#172033]">{title}</h3>
                <p className="mt-6 text-sm leading-6 text-black/62 sm:text-base sm:leading-7">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {review ? (
        <section className="bg-[#dfe6ef] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[1fr_.34fr] lg:items-center lg:gap-16">
            <motion.div {...reveal} className="bg-[#172033] p-3 sm:p-6">
              <Screen media={review} onOpen={() => onOpen(review)} />
            </motion.div>
            <motion.div {...reveal}>
              <Label>{copy(isHebrew, 'עקרון מוצר', 'Product principle')}</Label>
              <h2 className="mt-7 text-[12vw] font-medium leading-[.84] tracking-[-.065em] text-[#172033] sm:text-[6.5vw] lg:text-[4.5vw] xl:text-[4.5rem]">
                {copy(isHebrew, 'צפוף, אבל אף פעם לא מעורפל.', 'Dense, never opaque.')}
              </h2>
              <p className="mt-8 text-lg leading-8 text-black/64">
                {copy(isHebrew, 'ה־UX לא מנסה להסתיר את המורכבות של העבודה. הוא מארגן אותה כך שהבודק תמיד יודע מה נבדק, מה חריג ומה דורש החלטה.', 'The UX does not pretend the work is simple. It organizes complexity so the reviewer always knows what was checked, what is exceptional, and what still needs a decision.')}
              </p>
            </motion.div>
          </div>
        </section>
      ) : null}

      <TechnicalEvidence
        isHebrew={isHebrew}
        eyebrow={copy(isHebrew, 'נתיב בדיקה', 'Review pipeline')}
        title={copy(isHebrew, 'פורמט המסמך לא מנהל את הלוגיקה.', 'Document format does not own the logic.')}
        body={copy(
          isHebrew,
          'המסמכים עוברים קודם לנרמול של תיק בדיקה עקבי. רק אחר כך מופעלות בדיקות, חריגות נשמרות במפורש, והממצא שיוצא לדוח נשאר ניתן למעקב ולסקירה אנושית.',
          'Documents are first normalized into a consistent review case. Verification runs only after that boundary, exceptions remain explicit, and report findings stay traceable for human review.'
        )}
        steps={[
          copy(isHebrew, 'מסמכי מקור', 'Source docs'),
          copy(isHebrew, 'נרמול תיק', 'Normalize case'),
          copy(isHebrew, 'בדיקות', 'Verify'),
          copy(isHebrew, 'חריגה מפורשת', 'Exception'),
          copy(isHebrew, 'ממצא לדוח', 'Report finding'),
        ]}
      />

      <EngineeringDecisions
        isHebrew={isHebrew}
        dark
        items={[
          [
            copy(isHebrew, 'הפרדה בין קליטה לאימות', 'Separate ingest from verification'),
            copy(
              isHebrew,
              'המסמכים נכנסים קודם למבנה עקבי לפני שלוגיקת האימות פועלת, כדי ששינוי בפורמט מקור לא ישבור את כל ה-workflow.',
              'Documents are normalized into a consistent structure before verification logic runs, so source-format changes do not destabilize the whole workflow.'
            ),
          ],
          [
            copy(isHebrew, 'חריגות הן חלק מהמודל', 'Exceptions are first-class'),
            copy(
              isHebrew,
              'מקרים שלא עוברים בדיקה לא מוסתרים. הם נשמרים כחריגות מפורשות שדורשות סקירה או החלטה.',
              'Failed or ambiguous checks are not hidden. They remain explicit exceptions that require review or a decision.'
            ),
          ],
          [
            copy(isHebrew, 'ממצא שניתן להסביר', 'Explainable findings'),
            copy(
              isHebrew,
              'המערכת שומרת את מסלול הבדיקה ברור מספיק כדי שהבודק יבין מה נבדק ולמה הממצא הגיע לדוח.',
              'The review trail stays clear enough for the operator to understand what was checked and why a finding reaches the report.'
            ),
          ],
        ]}
      />
      <ProjectCredits project={project} isHebrew={isHebrew} tone="dark" lead={copy(isHebrew, 'Workflow product שנבנה סביב אמינות והסבריות.', 'A workflow product built around reliability and explainability.')} />
    </>
  );
}

function EnsemblisStory({ project, isHebrew, reveal }: StoryProps) {
  const phases = [
    [copy(isHebrew, 'להכין', 'Prepare'), copy(isHebrew, 'ריליס, נכסים, מסרים ולוח תוכן באותו קונטקסט.', 'Release, assets, messaging and content plan in one context.')],
    [copy(isHebrew, 'להוציא', 'Release'), copy(isHebrew, 'תפעול ההשקה וההפצה בלי לקפוץ בין כלים.', 'Run launch and distribution without hopping between tools.')],
    [copy(isHebrew, 'להגביר', 'Amplify'), copy(isHebrew, 'מדיה, תוכן ותובנות ממשיכים להזין את הקמפיין.', 'Media, content and intelligence keep feeding the campaign.')],
  ];

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-[#16121f] px-5 pb-10 pt-28 text-white sm:px-8 sm:pt-32 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(155,114,242,.38),transparent_32%),radial-gradient(circle_at_16%_80%,rgba(255,77,164,.18),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-[1680px] flex-col justify-between">
          <div className="flex items-center justify-between">
            <Label light>{project.number} · {project.status}</Label>
            <span className="rounded-full border border-white/25 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/72">Music × AI</span>
          </div>
          <div className="py-16 sm:py-24">
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-[10vw] font-medium leading-[.86] tracking-[-.065em] text-[#c9b1ff] sm:text-[6vw] lg:text-[4.6vw]">
              {copy(isHebrew, 'Release is not a date.', 'A release is not a date.')}
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.06, ease }} className="mt-4 text-[20vw] font-medium leading-[.72] tracking-[-.08em] text-white sm:text-[12vw] lg:text-[9vw] xl:text-[9rem]" dir="ltr">
              Ensemblis
            </motion.h1>
          </div>
          <div className="grid gap-8 border-t border-white/18 py-8 lg:grid-cols-[.56fr_1fr] lg:items-end">
            <p className="max-w-2xl text-xl leading-8 text-white/72 sm:text-2xl sm:leading-9">
              {copy(isHebrew, 'מערכת הפעלה לאמנים עצמאיים שמנסה לחבר את כל מה שקורה לפני, בזמן ואחרי ריליס.', 'An operating system for independent artists that connects everything happening before, during and after a release.')}
            </p>
            <div className="grid gap-px bg-white/15 sm:grid-cols-3">
              {[copy(isHebrew, 'ריליסים', 'Releases'), copy(isHebrew, 'תוכן', 'Content'), copy(isHebrew, 'קהל', 'Audience')].map((item) => <div key={item} className="bg-[#1d1828] p-5 text-sm text-white/76">{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <ProjectSnapshot project={project} isHebrew={isHebrew} />

      <section className="bg-[#f3eff8] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.28fr_1fr] lg:gap-20">
            <Label>{copy(isHebrew, 'מחזור הריליס', 'Release lifecycle')}</Label>
            <h2 className="max-w-[11ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] text-[#241a32] sm:text-[7vw] lg:text-[5.8vw] xl:text-[5.8rem]">
              {copy(isHebrew, 'לא עוד אוסף כלים. רצף אחד.', 'Not a stack of tools. One continuum.')}
            </h2>
          </motion.div>
          <div className="mt-20 border-y border-[#2a2036]/18 lg:ms-[28%]">
            {phases.map(([title, description], index) => (
              <motion.div {...reveal} key={title} className="grid gap-5 border-b border-[#2a2036]/14 py-8 last:border-b-0 sm:grid-cols-[5rem_.42fr_1fr] sm:items-start sm:py-10">
                <span className="text-sm font-semibold text-[#9b72f2]">0{index + 1}</span>
                <h3 className="text-4xl font-medium tracking-[-.05em] text-[#241a32] sm:text-5xl">{title}</h3>
                <p className="max-w-xl text-base leading-7 text-[#241a32]/62">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#9b72f2] px-5 py-24 text-[#16121f] sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <motion.div {...reveal} className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[.7fr_1fr] lg:gap-24">
          <div>
            <Label>{copy(isHebrew, 'למה עכשיו', 'Why it exists')}</Label>
            <h2 className="mt-7 max-w-[9ch] text-[13vw] font-medium leading-[.8] tracking-[-.07em] sm:text-[7vw] lg:text-[5.4vw] xl:text-[5.4rem]">
              {copy(isHebrew, 'אמנים עובדים כמו צוות. הכלים עדיין מתייחסים אליהם כמשתמש בודד.', 'Artists operate like teams. Their tools still treat them like isolated users.')}
            </h2>
          </div>
          <div className="self-end border-t border-[#16121f]/30 pt-7">
            <p className="max-w-2xl text-xl leading-8 sm:text-2xl sm:leading-9">{project.audience}</p>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#16121f]/62">{project.role}</p>
          </div>
        </motion.div>
      </section>

      <TechnicalEvidence
        isHebrew={isHebrew}
        eyebrow={copy(isHebrew, 'גבול המוצר', 'Product boundary')}
        title={copy(isHebrew, 'ריליס אחד, קונטקסט אחד.', 'One release, one operating context.')}
        body={copy(
          isHebrew,
          'זהו גבול המוצר שנבנה כרגע, לא טענה שכל surface כבר shipped. המטרה היא לשמור תכנון, נכסים, תוכן, מודיעין מדיה והפצה סביב אותו ריליס במקום לפצל אותם בין מערכות.',
          'This is the product boundary currently being built, not a claim that every surface is already shipped. The goal is to keep planning, assets, content, media intelligence and distribution around the same release context.'
        )}
        steps={[
          copy(isHebrew, 'תכנון ריליס', 'Release plan'),
          copy(isHebrew, 'נכסים ומסרים', 'Assets + messaging'),
          copy(isHebrew, 'תוכן', 'Content'),
          copy(isHebrew, 'מודיעין מדיה', 'Media intelligence'),
          copy(isHebrew, 'הפצה', 'Distribution'),
        ]}
        dark
      />

      <ProjectCredits project={project} isHebrew={isHebrew} tone="light" lead={copy(isHebrew, 'כרגע בפיתוח. הכיוון המוצרי כבר מוגדר, ה־UI עדיין מתפתח.', 'Currently in development. The product direction is defined; the interface is still evolving.')} />
    </>
  );
}

function WakeMyWayStory({ project, isHebrew, reveal, onOpen }: StoryProps) {
  const hero = project.hero;
  const [empty, schedule, active] = project.gallery;

  return (
    <>
      <section className="relative overflow-hidden bg-[#171312] px-5 pb-20 pt-32 text-white sm:px-8 sm:pb-28 lg:px-12 lg:pb-32">
        <div className="pointer-events-none absolute end-[-10%] top-[-10%] size-[55vw] rounded-full bg-[#ff8b5f]/24 blur-[120px]" />
        <div className="relative mx-auto max-w-[1680px]">
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
            <div>
              <Label light>{project.number} · Android</Label>
              <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mt-8 text-[17vw] font-medium leading-[.76] tracking-[-.075em] text-white sm:text-[10vw] lg:text-[7vw] xl:text-[7rem]" dir="ltr">
                Wake<br />MyWay
              </motion.h1>
              <p className="mt-8 max-w-xl text-xl leading-8 text-white/72 sm:text-2xl sm:leading-9">
                {copy(isHebrew, 'הבעיה היא לא לשמוע את השעון. הבעיה היא להפוך מאדם ישן לאדם שפועל.', 'The hard part is not hearing an alarm. It is becoming a functioning person after it rings.')}
              </p>
            </div>
            <motion.div {...reveal} className="grid grid-cols-3 items-end gap-3 sm:gap-5 lg:ps-10">
              {empty ? <div className="translate-y-8"><Screen media={empty} onOpen={() => onOpen(empty)} mode="phone" /></div> : null}
              {hero ? <div className="relative z-10 scale-[1.04]"><Screen media={hero} onOpen={() => onOpen(hero)} mode="phone" eager /></div> : null}
              {active ? <div className="translate-y-12"><Screen media={active} onOpen={() => onOpen(active)} mode="phone" /></div> : null}
            </motion.div>
          </div>
        </div>
      </section>

      <ProjectSnapshot project={project} isHebrew={isHebrew} />

      <section className="bg-[#fff6ef] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.3fr_1fr] lg:gap-20">
            <Label>{copy(isHebrew, 'מסע השכמה', 'Wake journey')}</Label>
            <h2 className="max-w-[12ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] text-[#2b1b16] sm:text-[7vw] lg:text-[5.8vw] xl:text-[5.8rem]">
              {copy(isHebrew, 'המוצר מתחיל בלילה, לא בבוקר.', 'The product starts the night before.')}
            </h2>
          </motion.div>

          <div className="mt-20 border-t border-[#2b1b16]/18 lg:ms-[30%]">
            {[
              ['23:00', copy(isHebrew, 'הכנה רגועה', 'Set up calmly'), copy(isHebrew, 'בחירת שעת קימה ותכנון מראש בלי להעמיס החלטות על הבוקר.', 'Choose the wake time and prepare ahead so the morning carries fewer decisions.')],
              ['07:00', copy(isHebrew, 'השכמה שיחתית', 'Conversational wake'), copy(isHebrew, 'קול, תנועה ורמזים פיזיים מתחילים להעביר את הגוף ממצב שינה לפעולה.', 'Voice, movement and physical cues start moving the body out of sleep inertia.')],
              ['07:05', copy(isHebrew, 'למידה מקומית', 'Learn locally'), copy(isHebrew, 'המערכת לומדת מה עבד בלי להפוך את ההשכמה לעוד שירות ענן שמכיר את כל הבוקר שלך.', 'The app learns what worked without turning your wake-up routine into another cloud service that knows your morning.')],
            ].map(([time, title, text]) => (
              <motion.div {...reveal} key={time} className="grid gap-5 border-b border-[#2b1b16]/14 py-8 sm:grid-cols-[7rem_.45fr_1fr] sm:py-10">
                <span className="text-2xl font-medium tracking-[-.04em] text-[#ff6f3d]">{time}</span>
                <h3 className="text-3xl font-medium tracking-[-.05em] text-[#2b1b16]">{title}</h3>
                <p className="max-w-xl text-base leading-7 text-[#2b1b16]/62">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {schedule ? (
        <section className="bg-[#ff8b5f] px-5 py-24 text-[#24130d] sm:px-8 sm:py-32 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[.48fr_1fr] lg:items-center lg:gap-24">
            <motion.div {...reveal} className="mx-auto w-full max-w-[24rem]">
              <Screen media={schedule} onOpen={() => onOpen(schedule)} mode="phone" />
            </motion.div>
            <motion.div {...reveal}>
              <Label>{copy(isHebrew, 'אמינות לפני קסם', 'Reliability before magic')}</Label>
              <h2 className="mt-7 max-w-[10ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] sm:text-[7vw] lg:text-[5.5vw] xl:text-[5.5rem]">
                {copy(isHebrew, 'שעון מעורר חייב לעבוד גם כשה־AI לא מעניין אף אחד.', 'An alarm still has to work when nobody cares about the AI.')}
              </h2>
              <p className="mt-9 max-w-2xl text-lg leading-8 text-[#24130d]/72 sm:text-xl">{project.summary}</p>
            </motion.div>
          </div>
        </section>
      ) : null}

      <TechnicalEvidence
        isHebrew={isHebrew}
        eyebrow={copy(isHebrew, 'גבול אמינות', 'Reliability boundary')}
        title={copy(isHebrew, 'ה-AI יכול להיכשל. השעון לא.', 'Intelligence may fail. The alarm may not.')}
        body={copy(
          isHebrew,
          'AlarmManager ו-Alarm Kernel אחראים למסירה הקריטית, כולל recovery לאחר Direct Boot ו-playback מקומי. רק אחרי שההשכמה התחילה מצטרף Wake Runtime דטרמיניסטי שמפעיל קול, תנועה ולמידה מקומית.',
          'AlarmManager and the Alarm Kernel own critical delivery, including Direct Boot recovery and local playback. Only after wake delivery begins does a deterministic Wake Runtime add voice, motion and local learning.'
        )}
        steps={[
          'AlarmManager',
          'Alarm Kernel',
          copy(isHebrew, 'אודיו מקומי קריטי', 'Critical local audio'),
          'Wake Runtime',
          copy(isHebrew, 'קול + תנועה', 'Voice + motion'),
        ]}
        dark
      />

      <EngineeringDecisions
        isHebrew={isHebrew}
        dark
        items={[
          [
            copy(isHebrew, 'נתיב alarm native', 'Native alarm path'),
            copy(
              isHebrew,
              'ההשכמה הקריטית נשענת על יכולות Android native ו-AlarmManager במקום על scheduler בענן או תהליך AI.',
              'The critical wake path relies on native Android capabilities and AlarmManager rather than a cloud scheduler or AI process.'
            ),
          ],
          [
            copy(isHebrew, 'Local-first לשלב הקריטי', 'Local-first critical path'),
            copy(
              isHebrew,
              'Speech והלוגיקה של ההשכמה נשארים ככל האפשר על המכשיר, כדי שחיבור רשת לא יהיה תנאי לשעון שעובד.',
              'Speech and wake logic stay on-device where possible so network availability is not a prerequisite for a working alarm.'
            ),
          ],
          [
            copy(isHebrew, 'בדיקות לממשק native', 'Native UI regression checks'),
            copy(
              isHebrew,
              'Roborazzi ו-GitHub Actions משמשים כדי לתפוס שינויים בממשק וב-build לפני שהם מגיעים לנתיב ההשכמה.',
              'Roborazzi and GitHub Actions help catch UI and build regressions before they reach the wake flow.'
            ),
          ],
        ]}
      />
      <ProjectCredits project={project} isHebrew={isHebrew} tone="dark" lead={copy(isHebrew, 'Native Android, local-first, ונבנה קודם כל לשימוש אמיתי.', 'Native Android, local-first, and designed first for real daily use.')} />
    </>
  );
}

function CartShiftStory({ project, isHebrew, reveal, onOpen }: StoryProps) {
  const hero = project.hero;
  const dark = project.gallery[0];
  const stages = [
    [copy(isHebrew, 'למשוך', 'Acquire'), copy(isHebrew, 'אתר, תוכן, analyzer ולידים.', 'Site, content, analyzer and lead capture.')],
    [copy(isHebrew, 'לסגור', 'Close'), copy(isHebrew, 'הצעות, תמחור, אישור ותשלום.', 'Proposals, pricing, approval and payment.')],
    [copy(isHebrew, 'לספק', 'Deliver'), copy(isHebrew, 'פורטל, בקשות, מסירה וקשר מתמשך.', 'Portal, requests, delivery and ongoing relationship.')],
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[#111113] px-5 pb-16 pt-32 text-white sm:px-8 sm:pb-24 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-[1680px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <Label light>{project.number} · {copy(isHebrew, 'Studio operating system', 'Studio operating system')}</Label>
              <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mt-7 max-w-[9ch] text-[17vw] font-medium leading-[.77] tracking-[-.075em] text-white sm:text-[10vw] lg:text-[7.4vw] xl:text-[7.4rem]" dir="ltr">
                CartShift<br />Studio
              </motion.h1>
            </div>
            <p className="max-w-lg border-t border-white/20 pt-5 text-lg leading-8 text-white/70">
              {copy(isHebrew, 'הסטודיו עצמו הפך למוצר: acquisition, proposals, clients ו־delivery בתוך מערכת אחת שאני ממשיך לבנות תוך כדי עבודה.', 'The studio itself became a product: acquisition, proposals, clients and delivery inside one system I keep evolving while using it.')}
            </p>
          </div>
          {hero ? (
            <motion.div {...reveal} className="mt-16 bg-[#d7d2ff] p-3 sm:mt-20 sm:p-6">
              <Screen media={hero} onOpen={() => onOpen(hero)} eager />
            </motion.div>
          ) : null}
        </div>
      </section>

      <ProjectSnapshot project={project} isHebrew={isHebrew} />

      <section className="bg-[#eceae5] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.28fr_1fr] lg:gap-20">
            <Label>{copy(isHebrew, 'מערכת אחת', 'One operating loop')}</Label>
            <h2 className="max-w-[11ch] text-[13vw] font-medium leading-[.82] tracking-[-.068em] text-[#1c1b20] sm:text-[7vw] lg:text-[5.8vw] xl:text-[5.8rem]">
              {copy(isHebrew, 'לא רק אתר. איך העסק עובד.', 'Not just the website. How the business runs.')}
            </h2>
          </motion.div>
          <div className="mt-20 grid gap-4 lg:ms-[28%] lg:grid-cols-3">
            {stages.map(([title, text], index) => (
              <motion.div {...reveal} key={title} className="relative min-h-[24rem] overflow-hidden bg-[#1c1b20] p-7 text-white sm:p-8">
                <div className="absolute end-[-20%] top-[-15%] size-56 rounded-full bg-[#6257d8]/30 blur-3xl" />
                <span className="relative text-[9px] font-semibold tracking-[0.16em] text-white/42">0{index + 1}</span>
                <h3 className="relative mt-20 text-4xl font-medium tracking-[-.055em] sm:text-5xl">{title}</h3>
                <p className="relative mt-7 text-base leading-7 text-white/62">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {dark ? (
        <section className="bg-[#d7d2ff] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
          <div className="mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[1fr_.38fr] lg:items-center lg:gap-20">
            <motion.div {...reveal} className="bg-[#111113] p-3 sm:p-6">
              <Screen media={dark} onOpen={() => onOpen(dark)} />
            </motion.div>
            <motion.div {...reveal}>
              <Label>{copy(isHebrew, 'Dogfooding', 'Dogfooding')}</Label>
              <h2 className="mt-7 text-[12vw] font-medium leading-[.84] tracking-[-.065em] text-[#1c1b20] sm:text-[6vw] lg:text-[4.5vw] xl:text-[4.5rem]">
                {copy(isHebrew, 'אני הלקוח הכי תובעני של המוצר הזה.', 'I am the most demanding client of this product.')}
              </h2>
              <p className="mt-8 text-lg leading-8 text-[#1c1b20]/66">
                {copy(isHebrew, 'כל flow שנבנה כאן נבחן על עבודה אמיתית עם לקוחות, כסף, מסמכים ולחץ זמן. זה מונע ממני לבנות features תיאורטיים.', 'Every flow is tested against real client work, money, documents and time pressure. That keeps the platform grounded instead of turning into a feature catalogue.')}
              </p>
            </motion.div>
          </div>
        </section>
      ) : null}

      <TechnicalEvidence
        isHebrew={isHebrew}
        eyebrow={copy(isHebrew, 'המערכת בפועל', 'Operational spine')}
        title={copy(isHebrew, 'מליד ל-delivery בלי לאבד קונטקסט.', 'From lead to delivery without losing context.')}
        body={copy(
          isHebrew,
          'ה-analyzer והלידים מזינים הצעה, אישור ותשלום; משם אותו רצף ממשיך לפורטל הלקוח, בקשות, מסירה וכלים פנימיים. המערכת מפעילה עבודה אמיתית של הסטודיו ולא demo נפרד.',
          'Analyzer and lead data feed proposal, approval and payment; the same workflow continues into the client portal, requests, delivery and internal tooling. The platform runs real studio work rather than a separate demo.'
        )}
        steps={[
          copy(isHebrew, 'Analyzer / ליד', 'Analyzer / lead'),
          copy(isHebrew, 'הצעה', 'Proposal'),
          copy(isHebrew, 'אישור + תשלום', 'Approval + payment'),
          copy(isHebrew, 'פורטל לקוח', 'Client portal'),
          copy(isHebrew, 'Delivery + ops', 'Delivery + ops'),
        ]}
      />

      <EngineeringDecisions
        isHebrew={isHebrew}
        items={[
          [
            copy(isHebrew, 'מערכת אחת במקום אוסף כלים', 'One system, not a tool pile'),
            copy(
              isHebrew,
              'Acquisition, proposals, client workflows וכלים פנימיים חיים באותו מוצר מתפתח במקום להיפרד למערכות שלא חולקות הקשר.',
              'Acquisition, proposals, client workflows and internal tools live in one evolving product instead of disconnected systems that lose context.'
            ),
          ],
          [
            copy(isHebrew, 'State משותף לאורך ה-funnel', 'Shared workflow state'),
            copy(
              isHebrew,
              'המעבר מליד להצעה, תשלום ו-delivery מתוכנן כרצף אחד, כדי לצמצם העתקת מידע ידנית בין שלבים.',
              'The path from lead to proposal, payment and delivery is treated as one workflow, reducing manual handoffs between stages.'
            ),
          ],
          [
            copy(isHebrew, 'Dogfooding כמשוב הנדסי', 'Dogfooding as engineering feedback'),
            copy(
              isHebrew,
              'הפלטפורמה מופעלת על עבודת לקוחות אמיתית, כך שחיכוך תפעולי הופך ישירות לקלט עבור שינויי architecture ו-workflow.',
              'The platform runs real client work, turning operational friction directly into input for architecture and workflow changes.'
            ),
          ],
        ]}
      />
      <ProjectCredits project={project} isHebrew={isHebrew} tone="light" lead={copy(isHebrew, 'פלטפורמה פנימית וחיצונית שאני מפעיל עליה את העסק בפועל.', 'An internal and client-facing platform I actually run the business on.')} />
    </>
  );
}

function ProjectCredits({ project, isHebrew, tone, lead }: { project: PortfolioShowcaseProject; isHebrew: boolean; tone: 'light' | 'dark'; lead: string }) {
  const dark = tone === 'dark';
  return (
    <section className={`${dark ? 'bg-[#171719] text-white' : 'bg-[#f7f5f0] text-[#171719]'} px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28`}>
      <div className="mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[.45fr_1fr] lg:gap-20">
        <div>
          <Label light={dark}>{copy(isHebrew, 'מה עשיתי', 'My contribution')}</Label>
          <p className={`mt-6 max-w-lg text-2xl leading-[1.25] tracking-[-.03em] sm:text-3xl ${dark ? 'text-white/78' : 'text-black/72'}`}>{lead}</p>
        </div>
        <div>
          <p className={`text-lg leading-8 ${dark ? 'text-white/70' : 'text-black/66'}`}>{project.role}</p>
          <div className={`mt-10 flex flex-wrap gap-x-4 gap-y-3 border-t pt-6 ${dark ? 'border-white/16' : 'border-black/16'}`}>
            {project.technologies.map((technology) => (
              <span key={technology} className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-white/58' : 'text-black/55'}`}>{technology}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {project.repositoryUrl ? <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] ${dark ? 'border-white/25 text-white hover:bg-white hover:text-black' : 'border-black/20 text-black hover:bg-black hover:text-white'} transition-colors`}><Github className="size-4" /> GitHub</a> : null}
            {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] ${dark ? 'bg-white text-black' : 'bg-[#171719] text-white'}`}>{isHebrew ? 'פתיחת המוצר' : 'Open product'} <ArrowUpRight className="size-4" /></a> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function NextProject({ nextProject, locale, isHebrew }: { nextProject: PortfolioShowcaseProject; locale: string; isHebrew: boolean }) {
  return (
    <a href={`/${locale}/portfolio/${nextProject.slug}`} className="group block bg-[#0f0f11] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1680px]">
        <div className="flex items-center justify-between border-b border-white/18 pb-5">
          <Label light>{nextProject.number} · {isHebrew ? 'הפרויקט הבא' : 'Next project'}</Label>
          <span className="flex size-11 items-center justify-center rounded-full border border-white/22 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            <ArrowRight className={`size-4 ${isHebrew ? 'rotate-180' : ''}`} />
          </span>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_.38fr] lg:items-end">
          <h2 className="text-[17vw] font-medium leading-[.74] tracking-[-.078em] text-white sm:text-[10vw] lg:text-[7.5vw] xl:text-[7.5rem]" dir="ltr">{nextProject.title}</h2>
          <div className="border-t border-white/16 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/48">{nextProject.descriptor}</p>
            <p className="mt-4 text-base leading-7 text-white/68">{nextProject.summary}</p>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ProjectShowcase({ project, nextProject, locale }: Props) {
  const isHebrew = locale === 'he';
  const reduceMotion = useReducedMotion();
  const [activeMedia, setActiveMedia] = useState<ShowcaseMedia | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const portfolioHref = `/${locale}/yotam#work`;

  useEffect(() => {
    if (!activeMedia) return;

    const previousOverflow = document.body.style.overflow;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const focusCloseButton = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveMedia(null);
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusCloseButton);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [activeMedia]);

  const reveal: MotionProps = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.68, ease },
      };

  const themeStyle = {
    '--project-accent': project.accent,
    '--project-accent-soft': project.accentSoft,
  } as CSSProperties;

  const storyProps = { project, isHebrew, reveal, onOpen: setActiveMedia };

  return (
    <main data-project={project.slug} dir={isHebrew ? 'rtl' : 'ltr'} style={themeStyle} className="overflow-x-clip bg-[#eceae5] text-[#171719] selection:bg-black selection:text-white">
      <SharedHeader project={project} locale={locale} isHebrew={isHebrew} />

      {project.slug === 'starlinker' ? <StarLinkerStory {...storyProps} /> : null}
      {project.slug === 'rightflow' ? <RightFlowStory {...storyProps} /> : null}
      {project.slug === 'ensemblis' ? <EnsemblisStory {...storyProps} /> : null}
      {project.slug === 'wakemyway' ? <WakeMyWayStory {...storyProps} /> : null}
      {project.slug === 'cartshift-studio' ? <CartShiftStory {...storyProps} /> : null}

      {nextProject ? <NextProject nextProject={nextProject} locale={locale} isHebrew={isHebrew} /> : null}

      <footer className="bg-[#0f0f11] px-5 py-6 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between border-t border-white/12 pt-6 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/52 sm:text-[9px]">
          <a href={portfolioHref} className="inline-flex items-center gap-2 transition-colors hover:text-white"><ArrowLeft className={`size-3.5 ${isHebrew ? 'rotate-180' : ''}`} />{isHebrew ? 'כל הפרויקטים' : 'All projects'}</a>
          <span>Yotam Faraggi © 2026</span>
        </div>
      </footer>

      <AnimatePresence>
        {activeMedia ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/94 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={activeMedia.label} onClick={() => setActiveMedia(null)}>
            <button ref={closeButtonRef} type="button" onClick={() => setActiveMedia(null)} className="absolute end-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:end-7 sm:top-7" aria-label={isHebrew ? 'סגירה' : 'Close'}><X className="size-5" /></button>
            <motion.div initial={reduceMotion ? false : { scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={reduceMotion ? undefined : { scale: 0.98, y: 8 }} transition={{ duration: 0.35, ease }} className={`relative flex max-h-[90vh] max-w-[94vw] items-center justify-center ${activeMedia.aspect === 'portrait' ? 'h-[88vh] w-auto' : 'w-[94vw]'}`} onClick={event => event.stopPropagation()}>
              <ProductImage media={activeMedia} className="max-h-[90vh] max-w-full object-contain" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
