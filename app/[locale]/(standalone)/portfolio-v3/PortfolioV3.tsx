'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, Mail, MapPin } from 'lucide-react';
import { useMessages } from 'next-intl';
import { buildCVData, type RawCVMessages } from '@/lib/cv/cv-data';

type Project = {
  number: string;
  title: string;
  descriptor: string;
  summary: string;
  ownership: string;
  outcome: string;
  year: string;
  image: string;
  imageAlt: string;
  href: string;
  external: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function PortfolioV3({ locale }: { locale: string }) {
  const isHebrew = locale === 'he';
  const messages = useMessages() as { cv: RawCVMessages };
  const cv = useMemo(() => buildCVData(messages.cv), [messages]);
  const reduceMotion = useReducedMotion();
  const cvHref = `/${locale}/cv`;
  const pdfHref = `/${locale}/cv/render?variant=default`;

  const copy = isHebrew
    ? {
        navWork: 'עבודות',
        navApproach: 'גישה',
        navExperience: 'ניסיון',
        navCv: 'קורות חיים',
        navContact: 'קשר',
        kicker: 'Senior Product Engineer · ברלין',
        headline: 'הופך בעיות מוצר מורכבות לתוכנה שעובדת.',
        intro:
          'אני מחבר חשיבה מוצרית לעומק הנדסי, מהרגע שבו הדרישות עדיין לא מסודרות ועד ארכיטקטורה, פיתוח, השקה ואיטרציה בפרודקשן.',
        primaryCta: 'לצפייה בעבודות',
        secondaryCta: 'הורדת CV',
        proofYears: '10+ שנים',
        proofYearsLabel: 'תוכנה בפרודקשן',
        proofCuralife: '4+ שנים',
        proofCuralifeLabel: 'ownership ב-Curalife',
        proofSync: '85%-',
        proofSyncLabel: 'כשלי סנכרון',
        proofPerf: '60%+',
        proofPerfLabel: 'ביצועי מסלולים מרכזיים',
        workEyebrow: 'עבודות נבחרות',
        workTitle: 'פחות דמואים. יותר ownership אמיתי.',
        workIntro:
          'המכנה המשותף בפרויקטים האלה הוא לא תחום מסוים אלא האחריות: להבין את הבעיה, לבחור ארכיטקטורה, לבנות את החלקים הקשים ולהביא אותם לפרודקשן.',
        ownership: 'מה לקחתי על עצמי',
        outcome: 'תוצאה',
        approachEyebrow: 'איך אני עובד',
        approachTitle: 'אני אוהב להיות קרוב גם לבעיה וגם לקוד.',
        approachIntro:
          'העבודה הכי טובה שלי קורית כשלא צריך לבחור בין product sense לבין engineering depth. אני אוהב להבין למה משהו צריך להיבנות, ואז להיות מספיק hands-on כדי לוודא שהוא באמת עובד.',
        principleProduct: 'להפוך ambiguity להחלטות',
        principleProductText: 'לחדד scope, trade-offs ו-user journey לפני שהמורכבות מתקבעת בקוד.',
        principleSystems: 'לתכנן עבור המציאות',
        principleSystemsText: 'APIs, אינטגרציות, דאטה, ביצועים, אמינות ותחזוקה כחלק מאותו design problem.',
        principleShip: 'להישאר עד אחרי ההשקה',
        principleShipText: 'למדוד, לתקן ולהמשיך לשפר אחרי שהמערכת פוגשת משתמשים ותנאי פרודקשן אמיתיים.',
        experienceEyebrow: 'ניסיון',
        experienceTitle: 'יותר מעשור, ממערכות enterprise ועד מוצרי AI.',
        experienceIntro: 'הקריירה שלי נעה בהדרגה מאינטגרציות ותוכנה enterprise לאחריות מוצרית מלאה על web, commerce ו-AI.',
        fullHistory: 'לניסיון המלא',
        contactEyebrow: 'ברלין · אזרח האיחוד האירופי',
        contactTitle: 'מחפש את הצוות והבעיה הבאים ששווה להתחייב אליהם.',
        getInTouch: 'יצירת קשר',
        location: 'ברלין, גרמניה',
        roleLine: 'Senior Product Engineer · Full-stack · AI · Commerce',
        scroll: 'עבודות',
        curalifeSummary: 'אחריות על חלקים מרכזיים באקוסיסטם Shopify ו-digital health, כולל אינטגרציות, performance ומוצר טלרפואה שנבנה מקצה לקצה.',
        curalifeOwnership: 'Product ownership · Architecture · Full-stack · Shopify · Integrations',
        curalifeOutcome: '85% פחות כשלי סנכרון, שיפור של 60% בביצועים, ומוצר טלרפואה שהפך לערוץ רכישה והכנסות מרכזי.',
        starlinkerSummary: 'מוצר תכנון ויזואלי למטרות, משימות, הרגלים והערות על קנבס מחובר, עם agent שפועל בתוך סביבת העבודה.',
        starlinkerOwnership: 'Founder · Product definition · Architecture · AI · Full-stack',
        starlinkerOutcome: 'נבנה מקצה לקצה מהגדרת המוצר ועד חוויית AI שפועלת ישירות בתוך ה-workspace.',
        rightflowSummary: 'פלטפורמת בדיקה ואימות מסמכים להפקדות פנסיה ושכר עם תהליכי review מובנים וייצוא דוחות.',
        rightflowOwnership: 'Founder · Workflow design · Automation · Full-stack',
        rightflowOutcome: 'תהליך רגיש ורב-מסמכים שהפך ל-workflow מובנה, עקבי וניתן לייצוא.',
        cartshiftSummary: 'סטודיו לפיתוח web ו-commerce שמחבר delivery ללקוחות עם בנייה של מוצרים, אינטגרציות ואוטומציות.',
        cartshiftOwnership: 'Founder · Client delivery · Product engineering · Commerce',
        cartshiftOutcome: 'מערכות production ללקוחות לצד מוצרים עצמאיים, עם ownership מלא על discovery, build ו-release.',
      }
    : {
        navWork: 'Work',
        navApproach: 'Approach',
        navExperience: 'Experience',
        navCv: 'CV',
        navContact: 'Contact',
        kicker: 'Senior Product Engineer · Berlin',
        headline: 'I turn hard product problems into software that works.',
        intro:
          'I connect product thinking with engineering depth, from the first unclear requirement through architecture, implementation, launch and iteration in production.',
        primaryCta: 'View selected work',
        secondaryCta: 'Download CV',
        proofYears: '10+ yrs',
        proofYearsLabel: 'production software',
        proofCuralife: '4+ yrs',
        proofCuralifeLabel: 'ownership at Curalife',
        proofSync: '−85%',
        proofSyncLabel: 'sync failures',
        proofPerf: '+60%',
        proofPerfLabel: 'key-journey performance',
        workEyebrow: 'Selected work',
        workTitle: 'Less demo reel. More real ownership.',
        workIntro:
          'The common thread is not one industry. It is responsibility: understand the problem, choose the architecture, build the hard parts and get them into production.',
        ownership: 'What I owned',
        outcome: 'Outcome',
        approachEyebrow: 'How I work',
        approachTitle: 'I stay close to both the problem and the code.',
        approachIntro:
          'My best work happens when product sense and engineering depth do not have to live in separate rooms. I want to understand why something should exist, then stay hands-on enough to make sure it actually works.',
        principleProduct: 'Turn ambiguity into decisions',
        principleProductText: 'Clarify scope, trade-offs and the user journey before complexity hardens into code.',
        principleSystems: 'Design for reality',
        principleSystemsText: 'Treat APIs, integrations, data, performance, reliability and maintainability as one design problem.',
        principleShip: 'Stay after launch',
        principleShipText: 'Measure, fix and keep improving once the system meets real users and real production constraints.',
        experienceEyebrow: 'Experience',
        experienceTitle: 'A decade-plus, from enterprise systems to AI products.',
        experienceIntro: 'My career moved from enterprise integration and software into end-to-end ownership of web, commerce and AI products.',
        fullHistory: 'View full experience',
        contactEyebrow: 'Berlin · EU citizen',
        contactTitle: 'Looking for the next team and problem worth committing to.',
        getInTouch: 'Get in touch',
        location: 'Berlin, Germany',
        roleLine: 'Senior Product Engineer · Full-stack · AI · Commerce',
        scroll: 'Work',
        curalifeSummary: 'Owned major parts of a Shopify commerce and digital-health ecosystem, including integrations, performance and an end-to-end telemedicine acquisition product.',
        curalifeOwnership: 'Product ownership · Architecture · Full-stack · Shopify · Integrations',
        curalifeOutcome: '85% fewer sync failures, 60% better performance, and a telemedicine product that became a primary acquisition and revenue funnel.',
        starlinkerSummary: 'A visual planning product for goals, tasks, habits and notes on a connected canvas, with an AI agent that can act inside the workspace.',
        starlinkerOwnership: 'Founder · Product definition · Architecture · AI · Full-stack',
        starlinkerOutcome: 'Built end to end from product definition through an AI experience that acts directly inside the workspace.',
        rightflowSummary: 'A document review and verification platform for pension and payroll contribution checks, with structured review flows and report export.',
        rightflowOwnership: 'Founder · Workflow design · Automation · Full-stack',
        rightflowOutcome: 'Turned a sensitive, document-heavy process into a structured, repeatable workflow with report export.',
        cartshiftSummary: 'A web and commerce engineering studio combining client delivery with product, integration and automation work.',
        cartshiftOwnership: 'Founder · Client delivery · Product engineering · Commerce',
        cartshiftOutcome: 'Production client systems alongside independent products, with full ownership across discovery, build and release.',
      };

  const projects: Project[] = [
    {
      number: '01',
      title: 'Curalife',
      descriptor: 'Commerce + Digital Health',
      summary: copy.curalifeSummary,
      ownership: copy.curalifeOwnership,
      outcome: copy.curalifeOutcome,
      year: '2021–25',
      image: '/images/case-studies/curalife-metabolic-wellness-platform/hero.jpg',
      imageAlt: 'Curalife digital health and commerce experience',
      href: `/${locale}/work/curalife-metabolic-wellness-platform`,
      external: false,
    },
    {
      number: '02',
      title: 'StarLinker',
      descriptor: 'AI-native Productivity',
      summary: copy.starlinkerSummary,
      ownership: copy.starlinkerOwnership,
      outcome: copy.starlinkerOutcome,
      year: '2026',
      image: '/images/cv/portfolio/starlinker-en-light.png',
      imageAlt: 'StarLinker visual planning product interface',
      href: 'https://starlinker.io',
      external: true,
    },
    {
      number: '03',
      title: 'RightFlow',
      descriptor: 'Document Intelligence',
      summary: copy.rightflowSummary,
      ownership: copy.rightflowOwnership,
      outcome: copy.rightflowOutcome,
      year: '2025',
      image: '/images/cv/portfolio/rightflow-en-light.png',
      imageAlt: 'RightFlow document review interface',
      href: 'https://right-flow.com',
      external: true,
    },
    {
      number: '04',
      title: 'CartShift Studio',
      descriptor: 'Commerce + Product Engineering',
      summary: copy.cartshiftSummary,
      ownership: copy.cartshiftOwnership,
      outcome: copy.cartshiftOutcome,
      year: '2025–26',
      image: '/images/cv/portfolio/cartshift-en-light.png',
      imageAlt: 'CartShift Studio website and product engineering work',
      href: `https://cart-shift.com/${locale}`,
      external: true,
    },
  ];

  const proof = [
    [copy.proofYears, copy.proofYearsLabel],
    [copy.proofCuralife, copy.proofCuralifeLabel],
    [copy.proofSync, copy.proofSyncLabel],
    [copy.proofPerf, copy.proofPerfLabel],
  ];

  const experience = cv.recentExperiences.slice(0, 3);

  const sectionReveal = reduceMotion
    ? { initial: false as const }
    : {
        variants: reveal,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.16 },
        transition: { duration: 0.64, ease },
      };

  return (
    <main
      className="overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[#6257d8] selection:text-white"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav
          className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]"
          aria-label={isHebrew ? 'ניווט בפורטפוליו' : 'Portfolio navigation'}
        >
          <a href="#top" className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="text-white/50">©</span>
            <span className="transition-opacity group-hover:opacity-60">Yotam Faraggi</span>
          </a>
          <div className="flex items-center gap-4 sm:gap-7 lg:gap-9">
            <a href="#work" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navWork}</a>
            <a href="#approach" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navApproach}</a>
            <a href="#experience" className="hidden transition-opacity hover:opacity-60 md:inline">{copy.navExperience}</a>
            <a href={cvHref} className="rounded-full border border-white/30 px-4 py-2.5 transition-colors hover:bg-white hover:text-[#1d1d1f]">{copy.navCv}</a>
          </div>
        </nav>
      </header>

      <section id="top" className="relative min-h-[100svh] overflow-hidden bg-[#171719] px-5 pb-6 pt-24 text-white sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <Image
          src="/images/portfolio-v2/hero-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-center opacity-[0.72] saturate-[0.78] contrast-[1.06] max-sm:hidden"
        />
        <Image
          src="/images/portfolio-v2/hero-mobile-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_40%] opacity-[0.68] saturate-[0.78] contrast-[1.06] sm:hidden"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,25,.06)_0%,rgba(23,23,25,.14)_40%,rgba(23,23,25,.91)_100%),linear-gradient(90deg,rgba(23,23,25,.52)_0%,rgba(23,23,25,.06)_58%,rgba(23,23,25,.26)_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1680px] flex-col">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.17em] text-white/62 sm:text-[10px]">
            <span className="flex items-center gap-2"><MapPin className="size-3" />{copy.location}</span>
            <span className="max-w-[15rem] text-end leading-4 sm:max-w-none sm:leading-5">{copy.roleLine}</span>
          </div>

          <div className="mt-auto max-w-[1180px] pb-10 pt-20 sm:pb-14 lg:pb-16">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.05, ease }}
              className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/58 sm:text-[10px]"
            >
              {copy.kicker}
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.86, ease }}
              className="max-w-[10ch] text-[15.4vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9.4vw] lg:text-[7.7vw] xl:text-[7.8rem]"
            >
              {copy.headline}
            </motion.h1>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.12, ease }}
              className="mt-8 flex max-w-3xl flex-col gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between"
            >
              <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-xl sm:leading-8">{copy.intro}</p>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a href="#work" className="inline-flex items-center gap-2 rounded-full bg-[#6257d8] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform hover:scale-[1.02]">{copy.primaryCta} <ArrowDown className="size-3.5" /></a>
                <a href={pdfHref} className="inline-flex items-center gap-2 rounded-full border border-white/28 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-[#1d1d1f]"><Download className="size-3.5" />{copy.secondaryCta}</a>
              </div>
            </motion.div>
          </div>

          <div className="grid gap-px border-t border-white/15 bg-white/15 sm:grid-cols-4">
            {proof.map(([value, label]) => (
              <div key={label} className="bg-[#171719]/85 py-4 sm:px-5 sm:py-5 first:sm:ps-0">
                <p className="text-2xl font-medium tracking-[-0.05em] sm:text-3xl">{value}</p>
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/52 sm:text-[9px]">{label}</p>
              </div>
            ))}
          </div>
          <a href="#work" className="mt-4 flex items-center justify-end gap-2 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/66 sm:text-[9px]">{copy.scroll} <ArrowDown className="size-3.5" /></a>
        </div>
      </section>

      <section id="work" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/52 sm:text-[10px]">01 / {copy.workEyebrow}</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[10ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.workTitle}</h2>
              <p className="max-w-md text-[13px] leading-6 text-black/62 sm:text-sm sm:leading-6 lg:pb-2">{copy.workIntro}</p>
            </div>
          </motion.div>

          <div className="space-y-6 lg:ms-[22%]">
            {projects.map((project, index) => (
              <motion.article
                key={project.title}
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      variants: reveal,
                      initial: 'hidden',
                      whileInView: 'visible',
                      viewport: { once: true, amount: 0.12 },
                      transition: { duration: 0.56, delay: index * 0.03, ease },
                    })}
                className="overflow-hidden border border-black/18 bg-[#f3f1ec]"
              >
                <a
                  href={project.href}
                  target={project.external ? '_blank' : undefined}
                  rel={project.external ? 'noreferrer' : undefined}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8]"
                >
                  <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#dedbd3] lg:aspect-auto lg:min-h-[31rem]">
                      <Image
                        src={project.image}
                        alt={project.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 44vw"
                        className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.015] sm:p-8"
                      />
                    </div>
                    <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-black/46">
                        <span>{project.number} / {project.descriptor}</span>
                        <span>{project.year}</span>
                      </div>
                      <h3 className="mt-8 text-[14vw] font-medium leading-[0.82] tracking-[-0.065em] sm:text-6xl lg:text-7xl" dir="ltr">{project.title}</h3>
                      <p className="mt-5 max-w-xl text-sm leading-6 text-black/66 sm:text-base sm:leading-7">{project.summary}</p>
                      <div className="mt-8 grid gap-6 border-t border-black/18 pt-6 sm:grid-cols-2 lg:mt-auto lg:pt-7">
                        <div>
                          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/45">{copy.ownership}</p>
                          <p className="mt-2 text-[12px] leading-5 text-black/68">{project.ownership}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/45">{copy.outcome}</p>
                          <p className="mt-2 text-[12px] leading-5 text-black/68">{project.outcome}</p>
                        </div>
                      </div>
                      <div className="mt-7 flex justify-end"><span className="inline-flex size-11 items-center justify-center rounded-full bg-[#1d1d1f] text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="size-4" /></span></div>
                    </div>
                  </div>
                </a>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="bg-[#19191b] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/52 sm:text-[10px]">02 / {copy.approachEyebrow}</p>
            <div>
              <h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.approachTitle}</h2>
              <p className="mt-10 max-w-2xl text-xl leading-[1.25] tracking-[-0.025em] text-white/68 sm:text-2xl lg:ms-[28%] lg:text-3xl">{copy.approachIntro}</p>
            </div>
          </motion.div>

          <div className="mt-20 border-t border-white/16 lg:ms-[22%] lg:mt-28">
            {[
              [copy.principleProduct, copy.principleProductText],
              [copy.principleSystems, copy.principleSystemsText],
              [copy.principleShip, copy.principleShipText],
            ].map(([title, text], index) => (
              <div key={title} className="grid gap-4 border-b border-white/16 py-7 sm:grid-cols-[0.1fr_0.5fr_0.8fr] sm:items-start sm:gap-7 sm:py-9">
                <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/42">0{index + 1}</p>
                <h3 className="text-[9vw] font-medium leading-[0.92] tracking-[-0.055em] sm:text-4xl lg:text-5xl">{title}</h3>
                <p className="max-w-xl text-[13px] leading-6 text-white/64 sm:text-base sm:leading-7">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/52 sm:text-[10px]">03 / {copy.experienceEyebrow}</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.experienceTitle}</h2>
              <p className="max-w-md text-[13px] leading-6 text-black/62 sm:text-sm sm:leading-6 lg:pb-2">{copy.experienceIntro}</p>
            </div>
          </motion.div>

          <div className="border-t border-black/20 lg:ms-[22%]">
            {experience.map((item, index) => (
              <div key={item.key} className="grid gap-4 border-b border-black/20 py-6 sm:grid-cols-[0.18fr_0.48fr_0.8fr] sm:items-start sm:gap-7 sm:py-8">
                <div className="text-[9px] font-semibold uppercase leading-5 tracking-[0.15em] text-black/43"><p>0{index + 1}</p><p className="mt-1">{item.duration}</p></div>
                <div><h3 className="text-[8vw] font-medium leading-[0.92] tracking-[-0.05em] sm:text-3xl lg:text-4xl" dir="ltr">{item.company}</h3><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/50">{item.title}</p></div>
                <p className="max-w-2xl text-[13px] leading-6 text-black/64 sm:text-sm sm:leading-6">{item.description ?? item.highlights[0]}</p>
              </div>
            ))}
            <div className="pt-7"><a href={cvHref} className="inline-flex items-center gap-2 border-b border-black/40 pb-1 text-xs font-semibold uppercase tracking-[0.13em]">{copy.fullHistory} <ArrowUpRight className="size-3.5" /></a></div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#6257d8] px-5 pb-8 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[10px]">{copy.contactEyebrow}</p>
            <div>
              <h2 className="max-w-[10ch] text-[14vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7vw] xl:text-[7rem]">{copy.contactTitle}</h2>
              <div className="mt-10 flex flex-col gap-8 border-t border-white/30 pt-7 sm:flex-row sm:items-end sm:justify-between">
                <a href={`mailto:${cv.email}`} className="inline-flex size-32 items-center justify-center rounded-full bg-[#19191b] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.15em] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40">
                  <span className="flex flex-col items-center gap-2"><Mail className="size-4" />{copy.getInTouch}</span>
                </a>
                <div className="flex flex-wrap gap-6 text-[9px] font-semibold uppercase tracking-[0.15em] sm:justify-end sm:text-[10px]">
                  <a href={`mailto:${cv.email}`} className="border-b border-white/55 pb-1">Email</a>
                  <a href={cv.contact.linkedinUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">LinkedIn</a>
                  <a href={cv.contact.githubUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">GitHub</a>
                  <a href={cvHref} className="border-b border-white/55 pb-1">{copy.navCv}</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-between border-t border-white/30 pt-5 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/72 sm:mt-28 sm:text-[9px]">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top">{copy.navWork} ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
