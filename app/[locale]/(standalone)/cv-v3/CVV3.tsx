'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, Mail, MapPin } from 'lucide-react';
import { useLocale, useMessages } from 'next-intl';
import { buildCVData, type RawCVMessages } from '@/lib/cv/cv-data';

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function CVV3() {
  const locale = useLocale();
  const messages = useMessages() as { cv: RawCVMessages };
  const cv = useMemo(() => buildCVData(messages.cv), [messages]);
  const reduceMotion = useReducedMotion();
  const isHebrew = locale === 'he';
  const portfolioHref = `/${locale}/portfolio`;
  const pdfHref = `/${locale}/cv/render?variant=default`;

  const copy = isHebrew
    ? {
        portfolio: 'פורטפוליו',
        download: 'הורדת PDF',
        experience: 'ניסיון',
        capabilities: 'יכולות',
        work: 'עבודות נבחרות',
        foundation: 'השכלה ושפות',
        contact: 'יצירת קשר',
        scroll: 'לניסיון',
        kicker: 'Senior Product Engineer / ברלין',
        headline: 'בונה מוצרים מורכבים עד לפרודקשן.',
        intro:
          'יותר מעשור של Full-Stack, מסחר, אינטגרציות ו-AI. אני נכנס בשלב שבו הדרישות עדיין לא מסודרות ונשאר עד שהמוצר עובד בצורה אמינה אצל משתמשים אמיתיים.',
        proofYears: '10+ שנים',
        proofYearsLabel: 'תוכנה בפרודקשן',
        proofCuralife: '4+ שנים',
        proofCuralifeLabel: 'אחריות מוצרית ב-Curalife',
        proofSync: '85%-',
        proofSyncLabel: 'כשלי סנכרון',
        proofPerf: '60%+',
        proofPerfLabel: 'ביצועים במסלולים מרכזיים',
        profileTitle: 'מוצר, ארכיטקטורה והוצאה לפועל באותה יד.',
        profileBody:
          'אני עובד הכי טוב על מוצרים שבהם צריך לחבר בין החלטות מוצריות לעומק טכני: frontend, backend, APIs, אינטגרציות, דאטה, cloud ואילוצי פרודקשן. הניסיון שלי משלב חברות מוצר, מערכות enterprise, e-commerce ועבודה founder-led.',
        recentTitle: 'הניסיון שמגדיר את העבודה שלי היום.',
        earlierTitle: 'ניסיון הנדסי מוקדם',
        earlierIntro: 'Enterprise integrations, software development ויזמות טכנולוגית משנת 2011.',
        skillsTitle: 'היכולות שבהן אני הכי חזק.',
        workTitle: 'מוצרים שממחישים ownership אמיתי.',
        foundationTitle: 'בסיס מקצועי ותקשורת.',
        contactTitle: 'מחפש את הבעיה הבאה ששווה לקחת עליה אחריות.',
        availability: 'ברלין · אזרח האיחוד האירופי',
        viewPortfolio: 'לפורטפוליו המלא',
        selectedImpact: 'השפעה',
        curalifeImpact: '85% פחות כשלי סנכרון, שיפור של 60% בביצועים, ומוצר טלרפואה שהפך לערוץ רכישה והכנסות מרכזי.',
        starlinkerImpact: 'מוצר founder-led שנבנה מהגדרת המוצר והארכיטקטורה ועד agent שפועל בתוך סביבת העבודה.',
        rightflowImpact: 'תהליך בדיקה רגיש ורב-מסמכים שהפך ל-workflow מובנה, עקבי וניתן לייצוא.',
        cartshiftImpact: 'סטודיו פעיל שמחבר delivery ללקוחות עם בנייה של מוצרי web, commerce ו-AI בפרודקשן.',
      }
    : {
        portfolio: 'Portfolio',
        download: 'Download PDF',
        experience: 'Experience',
        capabilities: 'Capabilities',
        work: 'Selected work',
        foundation: 'Education & languages',
        contact: 'Contact',
        scroll: 'Experience',
        kicker: 'Senior Product Engineer / Berlin',
        headline: 'I build complex products all the way to production.',
        intro:
          '10+ years across full-stack, commerce, integrations and AI. I work best where requirements are still messy, then stay with the problem until reliable software is in real users’ hands.',
        proofYears: '10+ yrs',
        proofYearsLabel: 'production software',
        proofCuralife: '4+ yrs',
        proofCuralifeLabel: 'product ownership at Curalife',
        proofSync: '−85%',
        proofSyncLabel: 'sync failures',
        proofPerf: '+60%',
        proofPerfLabel: 'key-journey performance',
        profileTitle: 'Product, architecture and execution in one loop.',
        profileBody:
          'I am strongest on products where product decisions and technical depth have to move together: frontend, backend, APIs, integrations, data, cloud and production constraints. My background spans product companies, enterprise systems, e-commerce and founder-led software.',
        recentTitle: 'The experience that defines how I work today.',
        earlierTitle: 'Earlier engineering',
        earlierIntro: 'Enterprise integrations, software development and entrepreneurship from 2011 onward.',
        skillsTitle: 'The capabilities I rely on most.',
        workTitle: 'Products that show real ownership.',
        foundationTitle: 'Foundation & communication.',
        contactTitle: 'Looking for the next problem worth owning.',
        availability: 'Berlin · EU citizen',
        viewPortfolio: 'View full portfolio',
        selectedImpact: 'Impact',
        curalifeImpact: '85% fewer sync failures, 60% better performance, and a telemedicine product that became a primary acquisition and revenue funnel.',
        starlinkerImpact: 'Founder-led from product definition and architecture through an AI agent that acts inside the workspace.',
        rightflowImpact: 'A sensitive, document-heavy verification process turned into a structured, repeatable workflow with report export.',
        cartshiftImpact: 'An active studio combining client delivery with production web, commerce and AI product work.',
      };

  const sectionReveal = reduceMotion
    ? { initial: false as const }
    : {
        variants: reveal,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.16 },
        transition: { duration: 0.62, ease },
      };

  const proof = [
    [copy.proofYears, copy.proofYearsLabel],
    [copy.proofCuralife, copy.proofCuralifeLabel],
    [copy.proofSync, copy.proofSyncLabel],
    [copy.proofPerf, copy.proofPerfLabel],
  ];

  const projects = [
    {
      name: 'Curalife',
      descriptor: 'Commerce + Digital Health',
      impact: copy.curalifeImpact,
      href: `/${locale}/work/curalife-metabolic-wellness-platform`,
      external: false,
    },
    {
      name: 'StarLinker',
      descriptor: 'AI-native Productivity',
      impact: copy.starlinkerImpact,
      href: 'https://starlinker.io',
      external: true,
    },
    {
      name: 'RightFlow',
      descriptor: 'Document Intelligence',
      impact: copy.rightflowImpact,
      href: 'https://right-flow.com',
      external: true,
    },
    {
      name: 'CartShift Studio',
      descriptor: 'Commerce + Product Engineering',
      impact: copy.cartshiftImpact,
      href: `https://cart-shift.com/${locale}`,
      external: true,
    },
  ];

  return (
    <main
      className="overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[#6257d8] selection:text-white"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav
          className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]"
          aria-label={isHebrew ? 'ניווט בקורות החיים' : 'CV navigation'}
        >
          <a href={portfolioHref} className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="text-white/50">©</span>
            <span className="transition-opacity group-hover:opacity-60">Yotam Faraggi</span>
          </a>
          <div className="flex items-center gap-4 sm:gap-8">
            <a href="#experience" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.experience}</a>
            <a href={portfolioHref} className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.portfolio}</a>
            <a
              href={pdfHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 transition-colors hover:bg-white hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{copy.download}</span>
              <span className="sm:hidden">PDF</span>
            </a>
          </div>
        </nav>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden bg-[#171719] px-5 pb-6 pt-24 text-white sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <Image
          src="/images/portfolio-v2/hero-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-center opacity-[0.62] saturate-[0.72] contrast-[1.08] max-sm:hidden"
        />
        <Image
          src="/images/portfolio-v2/hero-mobile-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_40%] opacity-[0.58] saturate-[0.72] contrast-[1.08] sm:hidden"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,25,.08)_0%,rgba(23,23,25,.22)_45%,rgba(23,23,25,.92)_100%),linear-gradient(90deg,rgba(23,23,25,.55)_0%,rgba(23,23,25,.08)_58%,rgba(23,23,25,.3)_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1680px] flex-col">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.17em] text-white/62 sm:text-[10px]">
            <span className="flex items-center gap-2"><MapPin className="size-3" />{cv.location}</span>
            <span className="max-w-[13rem] text-end leading-4 sm:max-w-none sm:leading-5">{copy.availability}<br />Full-stack · AI · Commerce</span>
          </div>

          <div className="mt-auto max-w-[1160px] pb-10 pt-20 sm:pb-14 lg:pb-16">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.05, ease }}
              className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/58 sm:text-[10px]"
            >
              {copy.kicker}
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.88, ease }}
              className="max-w-[10ch] text-[15vw] font-medium leading-[0.82] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.5vw] xl:text-[7.5rem]"
            >
              {copy.headline}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.12, ease }}
              className="mt-8 max-w-2xl text-base leading-7 text-white/72 sm:text-xl sm:leading-8"
            >
              {copy.intro}
            </motion.p>
          </div>

          <div className="grid gap-px border-t border-white/15 bg-white/15 sm:grid-cols-4">
            {proof.map(([value, label]) => (
              <div key={label} className="bg-[#171719]/85 px-0 py-4 sm:px-5 sm:py-5 first:sm:ps-0">
                <p className="text-2xl font-medium tracking-[-0.05em] sm:text-3xl">{value}</p>
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/52 sm:text-[9px]">{label}</p>
              </div>
            ))}
          </div>

          <a href="#experience" className="mt-4 flex items-center justify-end gap-2 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/70 sm:text-[9px]">
            {copy.scroll} <ArrowDown className="size-3.5" />
          </a>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <motion.div {...sectionReveal} className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:text-[10px]">01 / Profile</p>
          <div>
            <h2 className="max-w-[12ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.7vw] xl:text-[5.8rem]">{copy.profileTitle}</h2>
            <div className="mt-10 grid gap-8 border-t border-black/20 pt-7 sm:grid-cols-2 lg:mt-14">
              <p className="max-w-2xl text-lg leading-7 tracking-[-0.02em] text-black/72 sm:text-2xl sm:leading-9">{copy.profileBody}</p>
              <div className="grid content-start border-t border-black/20 sm:border-t-0">
                {[
                  ['Location', cv.location],
                  ['Authorization', cv.workAuthorization],
                  ['Email', cv.email],
                  ['Phone', cv.phone],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[0.38fr_0.62fr] gap-4 border-b border-black/20 py-4 text-[11px] leading-5 sm:text-xs">
                    <span className="font-semibold uppercase tracking-[0.12em] text-black/50">{label}</span>
                    <span className="text-black/72" dir={label === 'Email' || label === 'Phone' ? 'ltr' : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="experience" className="bg-[#19191b] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-[10px]">02 / {copy.experience}</p>
            <h2 className="max-w-[11ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.7vw] xl:text-[5.8rem]">{copy.recentTitle}</h2>
          </motion.div>

          <div className="border-t border-white/18 lg:ms-[22%]">
            {cv.recentExperiences.map((item, index) => (
              <motion.article
                key={item.key}
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      variants: reveal,
                      initial: 'hidden',
                      whileInView: 'visible',
                      viewport: { once: true, amount: 0.12 },
                      transition: { duration: 0.54, delay: index * 0.03, ease },
                    })}
                className="grid gap-5 border-b border-white/18 py-7 sm:grid-cols-[0.18fr_0.5fr_0.9fr] sm:gap-8 sm:py-9"
              >
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/48">
                  <p>{String(index + 1).padStart(2, '0')}</p>
                  <p className="mt-2 leading-5">{item.duration}</p>
                </div>
                <div>
                  <h3 className="text-[8vw] font-medium leading-[0.92] tracking-[-0.05em] sm:text-3xl lg:text-4xl" dir="ltr">{item.company}</h3>
                  <p className="mt-2 text-[10px] font-semibold uppercase leading-5 tracking-[0.13em] text-white/58">{item.title}</p>
                  {item.location ? <p className="mt-1 text-[11px] text-white/48">{item.location}</p> : null}
                </div>
                <div>
                  {item.description ? <p className="max-w-2xl text-sm leading-6 text-white/67 sm:text-base sm:leading-7">{item.description}</p> : null}
                  <ul className="mt-5 space-y-3">
                    {item.highlights.map(highlight => (
                      <li key={highlight} className="grid grid-cols-[auto_1fr] gap-3 text-[13px] leading-6 text-white/68 sm:text-sm">
                        <span className="mt-[0.72rem] h-px w-4 bg-[#776be6]" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mt-20">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">{copy.earlierTitle}</p>
              <p className="mt-3 max-w-[15rem] text-[12px] leading-5 text-white/48">{copy.earlierIntro}</p>
            </div>
            <div className="border-t border-white/18">
              {cv.earlierExperiences.map(item => (
                <div key={item.key} className="grid gap-2 border-b border-white/18 py-5 sm:grid-cols-[0.25fr_0.45fr_0.7fr] sm:items-center sm:gap-6">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">{item.duration}</p>
                  <h3 className="text-xl font-medium tracking-[-0.035em]" dir="ltr">{item.company}</h3>
                  <p className="text-[12px] leading-5 text-white/58">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:text-[10px]">03 / {copy.capabilities}</p>
            <h2 className="max-w-[11ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.7vw] xl:text-[5.8rem]">{copy.skillsTitle}</h2>
          </motion.div>
          <div className="border-t border-black/20 lg:ms-[22%]">
            {cv.skills.map((skill, index) => (
              <div key={skill.key} className="grid gap-4 border-b border-black/20 py-6 sm:grid-cols-[0.1fr_0.42fr_0.9fr] sm:gap-7 sm:py-7">
                <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-black/45">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-[7.5vw] font-medium leading-none tracking-[-0.05em] sm:text-2xl lg:text-3xl">{skill.category}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-2 text-[12px] leading-5 text-black/66 sm:text-sm sm:leading-6">
                  {skill.items.map((item, itemIndex) => (
                    <span key={item}>{item}{itemIndex < skill.items.length - 1 ? <span className="ms-3 text-black/28">/</span> : null}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="bg-[#d9d5cc] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:text-[10px]">04 / {copy.work}</p>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[11ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.7vw] xl:text-[5.8rem]">{copy.workTitle}</h2>
              <a href={portfolioHref} className="inline-flex w-fit items-center gap-2 border-b border-black/45 pb-1 text-xs font-semibold uppercase tracking-[0.13em]">{copy.viewPortfolio} <ArrowUpRight className="size-3.5" /></a>
            </div>
          </motion.div>
          <div className="border-t border-black/20 lg:ms-[22%]">
            {projects.map((project, index) => (
              <a
                key={project.name}
                href={project.href}
                target={project.external ? '_blank' : undefined}
                rel={project.external ? 'noreferrer' : undefined}
                className="group block border-b border-black/20 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8] sm:py-8"
              >
                <div className="grid gap-4 sm:grid-cols-[0.1fr_0.48fr_0.8fr_auto] sm:items-center sm:gap-7">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-black/45">{String(index + 1).padStart(2, '0')}</p>
                  <div>
                    <h3 className="text-[10vw] font-medium leading-[0.86] tracking-[-0.055em] sm:text-4xl lg:text-5xl" dir="ltr">{project.name}</h3>
                    <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-black/50">{project.descriptor}</p>
                  </div>
                  <p className="max-w-xl text-[12px] leading-5 text-black/68 sm:text-sm sm:leading-6"><span className="font-semibold uppercase tracking-[0.08em] text-black/55">{copy.selectedImpact}: </span>{project.impact}</p>
                  <ArrowUpRight className="hidden size-5 text-black/38 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:block" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:text-[10px]">05 / {copy.foundation}</p>
          <div>
            <motion.h2 {...sectionReveal} className="max-w-[11ch] text-[12vw] font-medium leading-[0.84] tracking-[-0.065em] sm:text-[7vw] lg:text-[5.7vw] xl:text-[5.8rem]">{copy.foundationTitle}</motion.h2>
            <div className="mt-12 grid gap-12 border-t border-black/20 pt-8 lg:grid-cols-2">
              <div>
                <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.17em] text-black/50">{cv.sections.education}</p>
                {cv.education.map(item => (
                  <div key={`${item.institution}-${item.program}`} className="border-b border-black/20 py-5 first:pt-0">
                    <h3 className="text-xl font-medium tracking-[-0.035em]">{item.institution}</h3>
                    <p className="mt-1 text-sm text-black/67">{item.program}</p>
                    {item.years ? <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-black/48">{item.years}</p> : null}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.17em] text-black/50">{cv.sections.languages}</p>
                <div className="border-t border-black/20">
                  {cv.languages.map(language => (
                    <div key={language.key} className="grid grid-cols-2 gap-5 border-b border-black/20 py-5">
                      <h3 className="text-xl font-medium tracking-[-0.035em]">{language.name}</h3>
                      <p className="text-sm text-black/67">{language.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#6257d8] px-5 pb-8 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[10px]">{copy.availability}</p>
            <div>
              <h2 className="max-w-[10ch] text-[14vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7vw] xl:text-[7rem]">{copy.contactTitle}</h2>
              <div className="mt-10 flex flex-col gap-8 border-t border-white/30 pt-7 sm:flex-row sm:items-end sm:justify-between">
                <a href={`mailto:${cv.email}`} className="inline-flex size-32 items-center justify-center rounded-full bg-[#19191b] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.15em] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40">
                  <span className="flex flex-col items-center gap-2"><Mail className="size-4" />{copy.contact}</span>
                </a>
                <div className="flex flex-wrap gap-6 text-[9px] font-semibold uppercase tracking-[0.15em] sm:justify-end sm:text-[10px]">
                  <a href={`mailto:${cv.email}`} className="border-b border-white/55 pb-1">Email</a>
                  <a href={cv.contact.linkedinUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">LinkedIn</a>
                  <a href={cv.contact.githubUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">GitHub</a>
                  <a href={portfolioHref} className="border-b border-white/55 pb-1">{copy.portfolio}</a>
                  <a href={pdfHref} className="border-b border-white/55 pb-1">PDF</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-between border-t border-white/30 pt-5 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/72 sm:mt-28 sm:text-[9px]">
            <span>Yotam Faraggi © 2026</span>
            <a href={portfolioHref}>{copy.portfolio} <ArrowUpRight className="ms-1 inline size-3" /></a>
          </div>
        </div>
      </footer>
    </main>
  );
}
