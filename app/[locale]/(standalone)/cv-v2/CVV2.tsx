'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, Mail, MapPin } from 'lucide-react';
import { useLocale, useMessages } from 'next-intl';
import { buildCVData, type RawCVMessages } from '@/lib/cv/cv-data';

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

type SelectedProject = {
  key: string;
  name: string;
  eyebrow: string;
  description: string;
  href: string;
  external: boolean;
};

export default function CVV2() {
  const locale = useLocale();
  const messages = useMessages() as { cv: RawCVMessages };
  const cv = useMemo(() => buildCVData(messages.cv), [messages]);
  const reduceMotion = useReducedMotion();
  const isHebrew = locale === 'he';
  const portfolioHref = `/${locale}/portfolio`;
  const phone = cv.phone.startsWith('+972') ? '+4915776211298' : cv.phone;

  const copy = isHebrew
    ? {
        portfolio: 'פורטפוליו',
        download: 'הורדת PDF',
        profile: 'פרופיל',
        career: 'ניסיון מקצועי',
        capabilities: 'יכולות',
        selectedWork: 'עבודות נבחרות',
        foundation: 'השכלה ושפות',
        contact: 'יצירת קשר',
        scroll: 'לגלול',
        available: 'ברלין / פתוח להזדמנות הנכונה',
        built: 'נבנה כמוצר, לא כמסמך.',
        years: '10+ שנות ניסיון בתוכנה בפרודקשן',
        heroKicker: 'קורות חיים / 2026',
        heroRole: 'Senior Product Engineer',
        heroStack: 'Full-stack · AI · Commerce · Integrations',
        heroSummary: 'Senior Product Engineer שבונה מוצרי Full-Stack מרעיון לא ברור ועד פרודקשן, עם עומק במסחר, אינטגרציות, AI ומערכות ללקוחות.',
        lastDecade: 'יותר מעשור, בפרודקשן.',
        capabilityTitle: 'חשיבה מוצרית. עומק הנדסי.',
        selectedTitle: 'מוצרים נבחרים.',
        foundationTitle: 'בסיס ותקשורת.',
        contactTitle: 'בואו נבנה משהו שבאמת חשוב.',
        location: 'מיקום',
        authorization: 'אישור עבודה',
        email: 'אימייל',
        phone: 'טלפון',
        curalifeEyebrow: 'Commerce + Digital Health',
        curalifeDescription: 'אחריות על חלקים מרכזיים באקוסיסטם Shopify ו-digital health, כולל אינטגרציות, ביצועים ומוצר טלרפואה שנבנה מקצה לקצה והפך לערוץ רכישה והכנסות מרכזי.',
        externalLabel: 'נפתח בלשונית חדשה',
      }
    : {
        portfolio: 'Portfolio',
        download: 'Download PDF',
        profile: 'Profile',
        career: 'Experience',
        capabilities: 'Capabilities',
        selectedWork: 'Selected work',
        foundation: 'Education & languages',
        contact: 'Contact',
        scroll: 'Scroll',
        available: 'Berlin / available for the right next team',
        built: 'Built like a product, not a document.',
        years: '10+ years building production software',
        heroKicker: 'Curriculum Vitae / 2026',
        heroRole: 'Senior Product Engineer',
        heroStack: 'Full-stack · AI · Commerce · Integrations',
        heroSummary: 'Senior Product Engineer taking full-stack products from ambiguous requirements to production, with deep experience across commerce, integrations, AI-assisted software, and customer-facing platforms.',
        lastDecade: 'More than a decade, in production.',
        capabilityTitle: 'Product thinking. Engineering depth.',
        selectedTitle: 'Selected products.',
        foundationTitle: 'Foundation & communication.',
        contactTitle: 'Let’s build something that matters.',
        location: 'Location',
        authorization: 'Work authorization',
        email: 'Email',
        phone: 'Phone',
        curalifeEyebrow: 'Commerce + Digital Health',
        curalifeDescription: 'Owned major parts of the Shopify and digital-health ecosystem, including integrations, performance, and an end-to-end telemedicine product that became a primary acquisition and revenue funnel.',
        externalLabel: 'opens in a new tab',
      };

  const findProject = (key: 'cartshift' | 'rightflow' | 'starlinker') =>
    cv.portfolio.projects.find(project => project.key === key);

  const selectedProjects: SelectedProject[] = [
    {
      key: 'curalife',
      name: 'Curalife',
      eyebrow: copy.curalifeEyebrow,
      description: copy.curalifeDescription,
      href: `/${locale}/work/curalife-metabolic-wellness-platform`,
      external: false,
    },
    {
      key: 'starlinker',
      name: 'StarLinker',
      eyebrow: findProject('starlinker')?.eyebrow ?? 'StarLinker',
      description: findProject('starlinker')?.description ?? '',
      href: 'https://starlinker.io',
      external: true,
    },
    {
      key: 'rightflow',
      name: 'RightFlow',
      eyebrow: findProject('rightflow')?.eyebrow ?? 'RightFlow',
      description: findProject('rightflow')?.description ?? '',
      href: 'https://right-flow.com',
      external: true,
    },
    {
      key: 'cartshift',
      name: 'CartShift Studio',
      eyebrow: findProject('cartshift')?.eyebrow ?? 'CartShift Studio',
      description: findProject('cartshift')?.description ?? '',
      href: `https://cart-shift.com/${locale}`,
      external: true,
    },
  ];

  const sectionReveal = reduceMotion
    ? { initial: false as const }
    : {
        variants: reveal,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.72, ease },
      };

  return (
    <main
      className="overflow-x-clip bg-[#e9e8e3] text-[#1c1d20] selection:bg-[#6157d8] selection:text-white"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-[#f3eee5] sm:px-8 sm:py-7 lg:px-12">
        <nav
          className="mx-auto flex max-w-[1760px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px]"
          aria-label={isHebrew ? 'ניווט בקורות החיים' : 'CV navigation'}
        >
          <a href={portfolioHref} className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="text-white/60">©</span>
            <span className="transition-opacity group-hover:opacity-60">Code by Yotam</span>
          </a>
          <div className="flex items-center gap-5 sm:gap-8 lg:gap-11">
            <a href={portfolioHref} className="hidden transition-opacity hover:opacity-55 sm:inline">{copy.portfolio}</a>
            <a href="#experience" className="hidden transition-opacity hover:opacity-55 sm:inline">{copy.career}</a>
            <a
              href={`/${locale}/cv/render?variant=default`}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-[#f3eee5] transition-colors hover:bg-white hover:text-[#1c1d20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{copy.download}</span>
              <span className="sm:hidden">PDF</span>
            </a>
          </div>
        </nav>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden bg-[#1c1d20] px-5 pb-6 pt-24 text-[#f3eee5] sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <Image
          src="/images/portfolio-v2/hero-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-center opacity-[0.94] saturate-[0.78] contrast-[1.04] max-sm:hidden"
        />
        <Image
          src="/images/portfolio-v2/hero-mobile-art.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_42%] opacity-[0.92] saturate-[0.78] contrast-[1.04] sm:hidden"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(28,29,32,0.10)_0%,rgba(28,29,32,0.08)_36%,rgba(28,29,32,0.80)_78%,rgba(28,29,32,0.94)_100%),linear-gradient(90deg,rgba(28,29,32,0.34),rgba(28,29,32,0.03)_55%,rgba(28,29,32,0.24))] sm:bg-[linear-gradient(180deg,rgba(28,29,32,0.16)_0%,rgba(28,29,32,0.08)_42%,rgba(28,29,32,0.70)_100%),linear-gradient(90deg,rgba(28,29,32,0.32)_0%,rgba(28,29,32,0.03)_52%,rgba(28,29,32,0.24)_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1760px] flex-col">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.17em] text-white/65 sm:text-[10px]">
            <div className="flex items-center gap-2"><MapPin className="size-3" />{cv.location}</div>
            <div className="max-w-[18rem] text-end leading-4 sm:max-w-none sm:leading-5">
              {copy.heroRole}<br />{copy.heroStack}
            </div>
          </div>

          <div className="mt-auto pb-10 pt-20 sm:pb-14 lg:pb-16">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.78, delay: 0.08, ease }}
              className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60 sm:mb-7 sm:text-[10px]"
            >
              {copy.heroKicker}
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 64 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.02, delay: 0.03, ease }}
              className="text-[18.2vw] font-medium uppercase leading-[0.74] tracking-[-0.082em] text-[#f3eee5] sm:text-[14.4vw] sm:leading-[0.72] lg:text-[12.2vw] xl:text-[11.6rem]"
              dir="ltr"
            >
              <span className="block">Yotam</span>
              <span className="block ms-[5vw] sm:ms-[13vw]">Faraggi<span className="text-[#776be6]">.</span></span>
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.2, ease }}
              className="mt-8 max-w-2xl text-base leading-6 text-white/75 sm:ms-[13vw] sm:mt-10 sm:text-xl sm:leading-8"
            >
              {copy.heroSummary}
            </motion.p>
          </div>

          <div className="flex items-end justify-between border-t border-white/20 pt-4 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/65 sm:text-[10px]">
            <span>{copy.years}</span>
            <a href="#profile" className="flex items-center gap-2 text-white/90">{copy.scroll} <ArrowDown className="size-3.5" /></a>
          </div>
        </div>
      </section>

      <section id="profile" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <motion.div {...sectionReveal} className="mx-auto grid max-w-[1760px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">01 / {copy.profile}</p>
          <div>
            <h2 className="max-w-[10ch] text-[14.5vw] font-medium leading-[0.82] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.built}</h2>
            <div className="mt-12 grid gap-8 border-t border-black/20 pt-7 sm:grid-cols-2 lg:mt-16">
              <p className="max-w-2xl text-lg leading-7 tracking-[-0.025em] text-black/75 sm:text-2xl sm:leading-9">{cv.summary.text}</p>
              <div className="grid content-start gap-0 border-t border-black/20 sm:border-t-0">
                {[
                  [copy.location, cv.location],
                  [copy.authorization, cv.workAuthorization],
                  [copy.email, cv.email],
                  [copy.phone, phone],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[0.42fr_0.58fr] gap-5 border-b border-black/20 py-4 text-[11px] leading-5 sm:text-xs">
                    <span className="font-semibold uppercase tracking-[0.13em] text-black/60">{label}</span>
                    <span className="text-black/75" dir={label === copy.phone || label === copy.email ? 'ltr' : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="experience" className="bg-[#1c1d20] px-5 py-24 text-[#f3eee5] sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1760px]">
          <motion.div {...sectionReveal} className="mb-16 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-24">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60 sm:text-[10px]">02 / {copy.career}</p>
            <h2 className="max-w-[10ch] text-[14.2vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.lastDecade}</h2>
          </motion.div>

          <div className="border-t border-white/20 lg:ms-[22%]">
            {cv.experiences.map((experience, index) => (
              <motion.article
                key={experience.key}
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      variants: reveal,
                      initial: 'hidden',
                      whileInView: 'visible',
                      viewport: { once: true, amount: 0.16 },
                      transition: { duration: 0.62, delay: Math.min(index, 6) * 0.025, ease },
                    })}
                className="grid gap-5 border-b border-white/20 py-7 sm:grid-cols-[0.18fr_0.52fr_0.85fr] sm:gap-8 sm:py-9"
              >
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-[10px]">
                  <p>{String(index + 1).padStart(2, '0')}</p>
                  <p className="mt-2 leading-5">{experience.duration}</p>
                </div>
                <div>
                  <h3 className="text-[9vw] font-medium leading-[0.9] tracking-[-0.055em] sm:text-4xl lg:text-5xl" dir="ltr">{experience.company}</h3>
                  <p className="mt-2 text-[11px] font-semibold uppercase leading-5 tracking-[0.14em] text-white/65">{experience.title}</p>
                  {experience.location ? <p className="mt-1 text-[11px] text-white/55">{experience.location}</p> : null}
                </div>
                <div>
                  {experience.description ? <p className="max-w-2xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7">{experience.description}</p> : null}
                  <ul className="mt-5 space-y-3">
                    {experience.highlights.map(highlight => (
                      <li key={highlight} className="grid grid-cols-[auto_1fr] gap-3 text-[13px] leading-6 text-white/70 sm:text-sm">
                        <span className="mt-[0.7rem] h-px w-4 bg-[#776be6]" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1760px]">
          <motion.div {...sectionReveal} className="mb-16 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-24">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">03 / {copy.capabilities}</p>
            <h2 className="max-w-[10ch] text-[14.5vw] font-medium leading-[0.82] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.capabilityTitle}</h2>
          </motion.div>

          <div className="border-t border-black/20 lg:ms-[22%]">
            {cv.skills.map((skill, index) => (
              <motion.div
                key={skill.key}
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      variants: reveal,
                      initial: 'hidden',
                      whileInView: 'visible',
                      viewport: { once: true, amount: 0.2 },
                      transition: { duration: 0.58, delay: index * 0.025, ease },
                    })}
                className="grid gap-4 border-b border-black/20 py-6 sm:grid-cols-[0.1fr_0.45fr_0.85fr] sm:items-start sm:gap-7 sm:py-8"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-[8vw] font-medium leading-none tracking-[-0.055em] sm:text-3xl lg:text-4xl">{skill.category}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-2 text-[12px] leading-5 text-black/70 sm:text-sm sm:leading-6">
                  {skill.items.map((item, itemIndex) => (
                    <span key={item}>{item}{itemIndex < skill.items.length - 1 ? <span className="ms-3 text-black/35">/</span> : null}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="bg-[#d8d5cd] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1760px]">
          <motion.div {...sectionReveal} className="mb-16 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-24">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">04 / {copy.selectedWork}</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[9ch] text-[14.5vw] font-medium leading-[0.82] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.selectedTitle}</h2>
              <a href={`${portfolioHref}#work`} className="inline-flex w-fit items-center gap-2 border-b border-black/45 pb-1 text-xs font-semibold uppercase tracking-[0.14em]">
                {copy.portfolio} <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </motion.div>

          <div className="border-t border-black/20 lg:ms-[22%]">
            {selectedProjects.map((project, index) => (
              <a
                key={project.key}
                href={project.href}
                target={project.external ? '_blank' : undefined}
                rel={project.external ? 'noreferrer' : undefined}
                aria-label={`${project.name}${project.external ? ` (${copy.externalLabel})` : ''}`}
                className="group block border-b border-black/20 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6157d8] sm:py-8"
              >
                <div className="grid gap-4 sm:grid-cols-[0.1fr_0.55fr_0.75fr_auto] sm:items-center sm:gap-7">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="text-[11vw] font-medium leading-[0.82] tracking-[-0.065em] transition-transform duration-300 group-hover:translate-x-2 sm:text-5xl lg:text-6xl" dir="ltr">{project.name}</h3>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/60">{project.eyebrow}</p>
                    <p className="mt-2 max-w-xl text-[12px] leading-5 text-black/70 sm:text-sm sm:leading-6">{project.description}</p>
                  </div>
                  <ArrowUpRight className="hidden size-5 text-black/45 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:block" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="education" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto grid max-w-[1760px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">05 / {copy.foundation}</p>
          <div>
            <motion.h2 {...sectionReveal} className="max-w-[10ch] text-[14.5vw] font-medium leading-[0.82] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.foundationTitle}</motion.h2>
            <div className="mt-16 grid gap-12 border-t border-black/20 pt-8 lg:grid-cols-2">
              <div>
                <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60">{cv.sections.education}</p>
                {cv.education.map(item => (
                  <div key={`${item.institution}-${item.program}`} className="border-b border-black/20 py-5 first:pt-0">
                    <h3 className="text-2xl font-medium tracking-[-0.04em]">{item.institution}</h3>
                    <p className="mt-1 text-sm text-black/70">{item.program}</p>
                    {item.years ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">{item.years}</p> : null}
                    {item.description ? <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">{item.description}</p> : null}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60">{cv.sections.languages}</p>
                <div className="border-t border-black/20">
                  {cv.languages.map(language => (
                    <div key={language.key} className="grid grid-cols-[0.5fr_0.5fr] gap-5 border-b border-black/20 py-5">
                      <h3 className="text-2xl font-medium tracking-[-0.04em]">{language.name}</h3>
                      <p className="text-sm text-black/70">{language.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative overflow-hidden bg-[#6157d8] px-5 pb-7 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 lg:pt-40">
        <div className="relative mx-auto max-w-[1760px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-[10px]">{copy.available}</p>
            <div>
              <h2 className="max-w-[10ch] text-[15vw] font-medium leading-[0.78] tracking-[-0.08em] sm:text-[10vw] lg:text-[8vw] xl:text-[8rem]">{copy.contactTitle}</h2>
              <div className="mt-12 flex flex-col gap-10 border-t border-white/30 pt-8 sm:flex-row sm:items-end sm:justify-between">
                <a href={`mailto:${cv.email}`} className="inline-flex size-32 items-center justify-center rounded-full bg-[#1c1d20] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-white transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40 sm:text-[11px]">
                  <span className="flex flex-col items-center gap-2"><Mail className="size-4" />{copy.contact}</span>
                </a>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[9px] font-semibold uppercase tracking-[0.16em] sm:flex sm:flex-wrap sm:justify-end sm:text-[10px]">
                  <a href={`mailto:${cv.email}`} className="border-b border-white/55 pb-1">Email</a>
                  <a href={cv.contact.linkedinUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">LinkedIn</a>
                  <a href={cv.contact.githubUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">GitHub</a>
                  <a href={portfolioHref} className="border-b border-white/55 pb-1">{copy.portfolio}</a>
                  <a href={`/${locale}/cv/render?variant=default`} className="border-b border-white/55 pb-1">PDF</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-24 flex items-center justify-between border-t border-white/30 pt-5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/80 sm:mt-32 sm:text-[10px]">
            <span>Yotam Faraggi © 2026</span>
            <a href={portfolioHref}>{copy.portfolio} ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
