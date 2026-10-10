'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import FeaturedShowcase from './FeaturedShowcase';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, Mail, MapPin } from 'lucide-react';
import { useLocale, useMessages } from 'next-intl';
import { buildCVData, type RawCVMessages } from '@/lib/cv/cv-data';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = { hidden: { opacity: 0, y: 26 }, visible: { opacity: 1, y: 0 } };
export default function YotamProfile() {
  const locale = useLocale();
  const messages = useMessages() as { cv: RawCVMessages };
  const cv = useMemo(() => buildCVData(messages.cv), [messages]);
  const projects = useMemo(() => getPortfolioShowcases(locale), [locale]);
  const featuredProject = projects.find(project => project.slug === 'starlinker') ?? projects[0];
  const selectedProjects = projects.filter(project => project.slug !== featuredProject?.slug);
  const reduceMotion = useReducedMotion();
  const isHebrew = locale === 'he';
  const profileHref = `/${locale}/yotam`;
  const pdfHref = `/${locale}/cv/render?variant=default`;
  const clientWorkHref = `/${locale}/work`;

  const copy = isHebrew
    ? {
        experience: 'ניסיון',
        work: 'עבודות נבחרות',
        capabilities: 'יכולות',
        foundation: 'השכלה ושפות',
        profile: 'פרופיל',
        contact: 'יצירת קשר',
        download: 'הורדת CV',
        scroll: 'לניסיון',
        kicker: "יותם פרג'י · Senior Product Engineer · ברלין",
        headline: 'אני בונה את המוצר כולו. מהרעיון הראשון ועד לפרודקשן.',
        intro:
          'יותר מעשור בהנדסת תוכנה בחברות מוצר, מערכות enterprise, מסחר ומוצרים עצמאיים. אני עובד לאורך כל המערכת, מ-frontend ו-backend דרך APIs, אינטגרציות ו-cloud, מדרישות לא מסודרות ועד מוצר אמין בפרודקשן.',
        profileTitle: 'מוצר, ארכיטקטורה והוצאה לפועל באותה יד.',
        profileBody:
          'אני עובד הכי טוב במוצרים שבהם שיקול דעת מוצרי ועומק הנדסי צריכים להתקדם יחד. הניסיון שלי משתרע על מוצרי web ללקוחות, APIs ואינטגרציות, מערכות cloud ו-production ownership בתחומי healthcare, commerce, fintech ו-enterprise.',
        signalExperience: 'תוכנה בפרודקשן',
        signalOwnership: 'Product · architecture · implementation · deployment',
        signalAuthorization: 'אזרח האיחוד האירופי · מורשה לעבוד בגרמניה',
        signalAvailability: 'ברלין · האיחוד האירופי',
        locationLabel: 'מיקום',
        authorizationLabel: 'אישור עבודה',
        emailLabel: 'אימייל',
        statusLabel: 'סטטוס',
        openToWork: 'פתוח לתפקיד Full-time Senior Product / Full-Stack Engineering',
        recentTitle: 'הניסיון שמגדיר את העבודה שלי היום.',
        earlierTitle: 'ניסיון הנדסי מוקדם',
        earlierIntro: 'Enterprise integrations, software development ויזמות טכנולוגית משנת 2011.',
        workTitle: 'עוד מוצרים. אתגרים שונים. אותה מחויבות.',
        workIntro:
          'מבחר מוצרים בתחומי web, Android וטכנולוגיה יצירתית, עם אחריות על כל מחזור החיים של המוצר.',
        roleLabel: 'התפקיד שלי',
        viewCaseStudy: 'ל-Case study',
        clientWorkEyebrow: 'עבודה מסחרית',
        clientWorkTitle: 'Shopify, e-commerce, אינטגרציות ומערכות web מותאמות.',
        clientWorkBody:
          'לצד מוצרי ה-founder, אני מפתח ומוסר מערכות ללקוחות: חנויות, אינטגרציות, שיפורי ביצועים ו-conversion, ואפליקציות web מותאמות.',
        clientWorkCta: 'לכל עבודות הלקוחות',
        skillsTitle: 'היכולות שעליהן אני נשען הכי הרבה.',
        foundationTitle: 'בסיס מקצועי ותקשורת.',
        contactTitle: 'מחפש את הבעיה הבאה ששווה לקחת עליה אחריות.',
        availability: 'פתוח לתפקידי Full-time Senior · ברלין / האיחוד האירופי',
      }
    : {
        experience: 'Experience',
        work: 'Selected work',
        capabilities: 'Capabilities',
        foundation: 'Education & languages',
        profile: 'Profile',
        contact: 'Contact',
        download: 'Download CV',
        scroll: 'Experience',
        kicker: 'Yotam Faraggi · Senior Product Engineer · Berlin',
        headline: 'I build the whole product. From first idea to production.',
        intro:
          '10+ years in software engineering across product companies, enterprise systems, commerce and founder-led software. I work across the full system, from frontend and backend to APIs, integrations and cloud, taking ambiguous requirements through production and iteration.',
        profileTitle: 'Product, architecture and execution in one loop.',
        profileBody:
          'I work best on products where product judgment and engineering depth have to move together. My experience spans customer-facing web products, APIs and integrations, cloud systems, and production ownership across healthcare, commerce, fintech and enterprise software.',
        signalExperience: 'Production software',
        signalOwnership: 'Product · architecture · implementation · deployment',
        signalAuthorization: 'EU citizen · Authorized to work in Germany',
        signalAvailability: 'Berlin · EU',
        locationLabel: 'Location',
        authorizationLabel: 'Authorization',
        emailLabel: 'Email',
        statusLabel: 'Status',
        openToWork: 'Open to full-time Senior Product / Full-Stack Engineering roles',
        recentTitle: 'The experience that defines how I work today.',
        earlierTitle: 'Earlier engineering',
        earlierIntro: 'Enterprise integrations, software development and entrepreneurship from 2011 onward.',
        workTitle: 'More products. Different problems. The same ownership.',
        workIntro:
          'A selection of product work spanning web platforms, Android and creative technology, with ownership across the complete product lifecycle.',
        roleLabel: 'My role',
        viewCaseStudy: 'View case study',
        clientWorkEyebrow: 'Commercial delivery',
        clientWorkTitle: 'Shopify, e-commerce, integrations and custom web systems.',
        clientWorkBody:
          'Alongside founder-led products, I ship client systems spanning storefronts, integrations, performance and conversion work, and custom web applications.',
        clientWorkCta: 'View all client work',
        skillsTitle: 'The capabilities I rely on most.',
        foundationTitle: 'Foundation & communication.',
        contactTitle: 'Looking for the next problem worth owning.',
        availability: 'Open to full-time senior roles · Berlin / EU',
      };

  const sectionReveal = reduceMotion
    ? { initial: false as const }
    : {
        variants: reveal,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.14 },
        transition: { duration: 0.58, ease },
      };

  const profileSignals = [
    ['10+ years', copy.signalExperience],
    ['End-to-end', copy.signalOwnership],
    ['EU citizen', copy.signalAuthorization],
    ['Full-time', copy.signalAvailability],
  ];

  return (
    <main
      id="top"
      className="yotam-portfolio overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[#6257d8] selection:text-white"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <a href="#work" className="yotam-skip">{isHebrew ? "דלג לעבודות" : "Skip to featured work"}</a>
      <header className="yotam-header absolute inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav
          className="mx-auto flex max-w-[1680px] items-center justify-between gap-3 text-xs font-semibold tracking-[0.045em]"
          aria-label={isHebrew ? 'ניווט בפרופיל המקצועי' : 'Professional profile navigation'}
        >
          <a
            href={profileHref}
            className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[14px] font-semibold tracking-[-0.035em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base"
          >
            <span>Yotam</span><span className="text-[#bdb2ff]">.</span><span className="hidden sm:inline">Faraggi</span>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-4 lg:gap-7">
            <a href="#work" className="yotam-header-link inline-flex min-h-11 items-center px-1 text-[12px] sm:px-2 sm:text-[13px]"><span className="hidden sm:inline">{copy.work}</span><span className="sm:hidden">{isHebrew ? 'עבודות' : 'Work'}</span></a>
            <a href="#experience" className="yotam-header-link hidden min-h-11 items-center text-[13px] md:inline-flex">{copy.experience}</a>
            <a href="#capabilities" className="yotam-header-link hidden min-h-11 items-center text-[13px] lg:inline-flex">{copy.capabilities}</a>
            <a
              href={'mailto:' + cv.email}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/25 px-2.5 text-white transition-colors hover:border-white/70 hover:bg-white/10 sm:px-3.5"
              aria-label={copy.contact}
            >
              <Mail className="size-4" />
              <span className="hidden sm:inline">{copy.contact}</span>
            </a>
            <a
              href={pdfHref}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/45 bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white hover:text-[#171719] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-4 sm:text-[13px]"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">{copy.download}</span>
              <span className="sm:hidden">CV</span>
            </a>
            <a
              href={'/' + (isHebrew ? 'en' : 'he') + '/yotam'}
              hrefLang={isHebrew ? 'en' : 'he'}
              lang={isHebrew ? 'en' : 'he'}
              aria-label={isHebrew ? 'Switch to English' : 'מעבר לעברית'}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/30 px-2.5 text-xs font-semibold transition-colors hover:bg-white hover:text-[#171719]"
            >
              {isHebrew ? 'EN' : 'HE'}
            </a>
          </div>
        </nav>
      </header>

      <section className="yotam-hero relative min-h-[100svh] overflow-hidden bg-[#171719] px-5 pb-6 pt-24 text-white sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
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
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,25,.08)_0%,rgba(23,23,25,.24)_45%,rgba(23,23,25,.94)_100%),linear-gradient(90deg,rgba(23,23,25,.58)_0%,rgba(23,23,25,.08)_58%,rgba(23,23,25,.32)_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1680px] flex-col">
          <div className="flex items-start justify-between text-[13px] font-semibold uppercase tracking-[0.14em] text-white/72 sm:text-xs">
            <span className="flex items-center gap-2">
              <MapPin className="size-3" />
              {cv.location}
            </span>
            <span className="max-w-[15rem] text-end leading-5 sm:max-w-none">
              {copy.availability}
              <br />
              {isHebrew ? 'מוצר · Full-stack · אינטגרציות' : 'Full-stack · Product · Commerce · Integrations'}
            </span>
          </div>

          <div className="mt-auto max-w-[1180px] pb-8 pt-20 sm:pb-12 lg:pb-14">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.04, ease }}
              className="mb-5 text-xs font-semibold uppercase tracking-[0.17em] text-white/60 sm:text-[13px]"
            >
              {copy.kicker}
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.82, ease }}
              className="yotam-hero-headline text-balance font-medium text-white"
            >
              {copy.headline}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.1, ease }}
              className="mt-7 max-w-3xl text-base leading-7 text-white/72 sm:text-xl sm:leading-8"
            >
              {copy.intro}
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.16, ease }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <a
                href="#work"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#1d1d1f] transition-transform hover:-translate-y-0.5"
              >
                {copy.work} <ArrowDown className="size-3.5" />
              </a>
              <a
                href={pdfHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white transition-colors hover:bg-white/10"
              >
                <Download className="size-3.5" /> {copy.download}
              </a>
            </motion.div>
            <div className="yotam-hero-proof mt-8" aria-label={isHebrew ? 'פרטים מקצועיים' : 'Professional snapshot'}>
              <span><strong>10+</strong> {copy.signalExperience}</span>
              <span><strong>{isHebrew ? 'מקצה לקצה' : 'End-to-end'}</strong> · {isHebrew ? 'מוצר · הנדסה' : 'Product · Engineering'}</span>
              <span>{copy.signalAuthorization}</span>
            </div>
          </div>

          <a
            href="#experience"
            className="mt-4 flex items-center justify-end gap-2 border-t border-white/15 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-[13px]"
          >
            {copy.scroll} <ArrowDown className="size-3.5" />
          </a>
        </div>
      </section>

      {featuredProject ? (
        <FeaturedShowcase project={featuredProject} locale={locale} isHebrew={isHebrew} />
      ) : null}

      <section
        id="experience"
        className="bg-[#19191b] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-[1680px]">
          <motion.div
            {...sectionReveal}
            className="mb-14 grid gap-8 sm:mb-20 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/72 sm:text-[13px]">
              02 / {copy.experience}
            </p>
            <h2 className="max-w-[14ch] text-balance text-[clamp(2.35rem,6.8vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-white">
              {copy.recentTitle}
            </h2>
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
                      viewport: { once: true, amount: 0.1 },
                      transition: { duration: 0.5, delay: index * 0.025, ease },
                    })}
                className="grid gap-5 border-b border-white/18 py-7 sm:grid-cols-[0.18fr_0.5fr_0.9fr] sm:gap-8 sm:py-9"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/62 sm:text-xs">
                  <p>{String(index + 1).padStart(2, '0')}</p>
                  <p className="mt-2 leading-5">{item.duration}</p>
                </div>
                <div>
                  <h3
                    className="text-[clamp(1.75rem,5.5vw,2.2rem)] font-medium leading-[0.94] tracking-[-0.05em] text-white"
                    dir="ltr"
                  >
                    {item.company}
                  </h3>
                  <p className="mt-2 text-[13px] font-semibold uppercase leading-5 tracking-[0.12em] text-white/70">
                    {item.title}
                  </p>
                  {item.location ? (
                    <p className="mt-1 text-xs text-white/72">{item.location}</p>
                  ) : null}
                </div>
                <div>
                  {item.description ? (
                    <p className="max-w-2xl text-sm leading-6 text-white/67 sm:text-base sm:leading-7">
                      {item.description}
                    </p>
                  ) : null}
                  <ul className="mt-5 space-y-3">
                    {item.highlights.map(highlight => (
                      <li
                        key={highlight}
                        className="grid grid-cols-[auto_1fr] gap-3 text-[13px] leading-6 text-white/76 sm:text-[15px]"
                      >
                        <span className="mt-[0.72rem] h-px w-4 bg-[#776be6]" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 sm:mt-20 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/72 sm:text-[13px]">
                {copy.earlierTitle}
              </p>
              <p className="mt-3 max-w-[15rem] text-[13px] leading-5 text-white/72">
                {copy.earlierIntro}
              </p>
            </div>
            <div className="border-t border-white/18">
              {cv.earlierExperiences.map(item => (
                <div
                  key={item.key}
                  className="grid gap-2 border-b border-white/18 py-5 sm:grid-cols-[0.25fr_0.45fr_0.7fr] sm:items-center sm:gap-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/72 sm:text-[13px]">
                    {item.duration}
                  </p>
                  <h3 className="text-xl font-medium tracking-[-0.035em] text-white" dir="ltr">
                    {item.company}
                  </h3>
                  <p className="text-[13px] leading-5 text-white/70">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="profile" className="yotam-profile-section px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-28">
        <motion.div
          {...sectionReveal}
          className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-black/55 sm:text-[13px]">
            03 / {copy.profile}
          </p>
          <div>
            <h2 className="max-w-[16ch] text-balance text-[clamp(2.35rem,6.8vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#1d1d1f]">
              {copy.profileTitle}
            </h2>
            <div className="mt-9 border-t border-black/20 pt-7 lg:mt-11">
              <p className="max-w-4xl text-lg leading-7 tracking-[-0.02em] text-black/74 sm:text-2xl sm:leading-9">
                {copy.profileBody}
              </p>
              <div className="mt-9 grid border-y border-black/20 sm:grid-cols-2 lg:grid-cols-4">
                {profileSignals.map(([value, label]) => (
                  <div
                    key={value}
                    className="border-b border-black/20 py-5 sm:px-5 sm:[&:nth-child(odd)]:border-e lg:border-b-0 lg:border-e lg:first:ps-0 lg:last:border-e-0"
                  >
                    <p className="text-2xl font-medium tracking-[-0.045em] text-[#1d1d1f]">{value}</p>
                    <p className="mt-2 max-w-[17rem] text-xs leading-5 text-black/62 sm:text-[13px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="more-work" className="yotam-work-section bg-[#d9d5cc] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1680px]">
          <motion.div
            {...sectionReveal}
            className="mb-14 grid gap-8 sm:mb-20 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-black/55 sm:text-[13px]">
              04 / {copy.work}
            </p>
            <div className="grid gap-7 lg:grid-cols-[1fr_.6fr] lg:items-end">
              <h2 className="max-w-[14ch] text-balance text-[clamp(2.35rem,6.8vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#1d1d1f]">
                {copy.workTitle}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-black/62 sm:text-base sm:leading-7">
                {copy.workIntro}
              </p>
            </div>
          </motion.div>

          <div className="yotam-project-grid grid gap-5 lg:ms-[10%] lg:grid-cols-2 lg:gap-6">
            {selectedProjects.map((project, index) => (
              <motion.a
                key={project.slug}
                href={`/${locale}/portfolio/${project.slug}`}
                {...(reduceMotion
                  ? { initial: false }
                  : {
                      variants: reveal,
                      initial: 'hidden',
                      whileInView: 'visible',
                      viewport: { once: true, amount: 0.08 },
                      transition: { duration: 0.5, delay: (index % 2) * 0.04, ease },
                    })}
                style={{ borderTopColor: project.accent }}
                className="yotam-project-card group overflow-hidden border border-black/15 bg-[#f2efe9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8]"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-black/12 bg-[#dedbd4]">
                  {project.hero ? (
                    // Portfolio evidence may be local or hosted in a public project repository.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.hero.src}
                      alt={project.hero.alt}
                      loading="lazy"
                      decoding="async"
                      className={`yotam-project-image h-full w-full transition-transform duration-500 group-hover:scale-[1.015] ${
                        project.hero.contain ? 'object-contain p-4 sm:p-6' : 'object-cover'
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.15em] text-black/65 sm:text-[13px]">
                      {project.descriptor}
                    </div>
                  )}
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.13em] text-black/65 sm:inset-x-5 sm:top-5 sm:text-[13px]">
                    <span className="yotam-card-status px-2 py-1.5 backdrop-blur-sm">{project.status}</span>
                    <span className="bg-[#f2efe9]/88 px-2 py-1 backdrop-blur-sm">{project.year}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-black/67 sm:text-[13px]">
                        {project.descriptor}
                      </p>
                      <h3
                        className="yotam-project-title mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-medium leading-[0.9] tracking-[-0.055em] text-[#1d1d1f]"
                        dir="ltr"
                      >
                        {project.title}
                      </h3>
                    </div>
                    <ArrowUpRight className="mt-1 size-5 shrink-0 text-black/40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>

                  <p className="yotam-project-summary mt-5 text-sm leading-6 text-black/72 sm:text-[15px] sm:leading-7">
                    {project.summary}
                  </p>

                  <div className="mt-6 border-t border-black/14 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-black/65 sm:text-[13px]">
                      {copy.roleLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/75">{project.role}</p>
                    <p className="yotam-card-proof text-[14px] leading-6"><strong>{isHebrew ? 'האתגר ההנדסי' : 'Engineering focus'}</strong>{project.highlights[0]}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.slice(0, 3).map(technology => (
                        <span
                          key={technology}
                          className="border border-black/13 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.09em] text-black/65"
                        >
                          {technology}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/55 sm:text-[13px]">
                    {copy.viewCaseStudy} <ArrowUpRight className="size-3.5" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          <motion.a
            href={clientWorkHref}
            {...sectionReveal}
            className="group mt-10 grid gap-6 border-y border-black/20 py-8 lg:ms-[10%] lg:grid-cols-[0.28fr_1fr_auto] lg:items-center lg:gap-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60 sm:text-xs">
              {copy.clientWorkEyebrow}
            </p>
            <div>
              <h3 className="max-w-3xl text-2xl font-medium leading-tight tracking-[-0.035em] text-[#1d1d1f] sm:text-3xl">
                {copy.clientWorkTitle}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-black/62 sm:text-base sm:leading-7">
                {copy.clientWorkBody}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/58 sm:text-[13px]">
              {copy.clientWorkCta}
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </span>
          </motion.a>
        </div>
      </section>

      <section id="capabilities" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1680px]">
          <motion.div
            {...sectionReveal}
            className="mb-14 grid gap-8 sm:mb-20 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-black/55 sm:text-[13px]">
              05 / {copy.capabilities}
            </p>
            <h2 className="max-w-[14ch] text-balance text-[clamp(2.35rem,6.8vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#1d1d1f]">
              {copy.skillsTitle}
            </h2>
          </motion.div>
          <div className="border-t border-black/20 lg:ms-[22%]">
            {cv.skills.map((skill, index) => (
              <div
                key={skill.key}
                className="grid gap-4 border-b border-black/20 py-6 sm:grid-cols-[0.1fr_0.42fr_0.9fr] sm:gap-7 sm:py-7"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/67 sm:text-[13px]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-[clamp(1.65rem,4.5vw,2.5rem)] font-medium leading-none tracking-[-0.05em] text-[#1d1d1f]">
                  {skill.category}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-2 text-[13px] leading-5 text-black/66 sm:text-sm sm:leading-6">
                  {skill.items.map((item, itemIndex) => (
                    <span key={item}>
                      {item}
                      {itemIndex < skill.items.length - 1 ? (
                        <span className="ms-3 text-black/28">/</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f1ec] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-black/55 sm:text-[13px]">
            06 / {copy.foundation}
          </p>
          <div>
            <motion.h2
              {...sectionReveal}
              className="max-w-[14ch] text-balance text-[clamp(2.35rem,6.8vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#1d1d1f]"
            >
              {copy.foundationTitle}
            </motion.h2>
            <div className="mt-12 grid gap-12 border-t border-black/20 pt-8 lg:grid-cols-2">
              <div>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-black/50 sm:text-[13px]">
                  {cv.sections.education}
                </p>
                {cv.education.map(item => (
                  <div
                    key={`${item.institution}-${item.program}`}
                    className="border-b border-black/20 py-5 first:pt-0"
                  >
                    <h3 className="text-xl font-medium tracking-[-0.035em] text-[#1d1d1f]">
                      {item.institution}
                    </h3>
                    <p className="mt-1 text-sm text-black/67">{item.program}</p>
                    {item.years ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/60 sm:text-xs">
                        {item.years}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-black/50 sm:text-[13px]">
                  {cv.sections.languages}
                </p>
                <div className="border-t border-black/20">
                  {cv.languages.map(language => (
                    <div
                      key={language.key}
                      className="grid grid-cols-2 gap-5 border-b border-black/20 py-5"
                    >
                      <h3 className="text-xl font-medium tracking-[-0.035em] text-[#1d1d1f]">
                        {language.name}
                      </h3>
                      <p className="text-sm text-black/67">{language.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#6257d8] px-5 pb-8 pt-20 text-white sm:px-8 sm:pb-10 sm:pt-28 lg:px-12 lg:pt-28">
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/72 sm:text-[13px]">
              {copy.availability}
            </p>
            <div>
              <h2 className="max-w-[12ch] text-balance text-[clamp(2.75rem,8vw,5.6rem)] font-medium leading-[0.84] tracking-[-0.07em] text-white">
                {copy.contactTitle}
              </h2>
              <div className="mt-10 flex flex-col gap-8 border-t border-white/30 pt-7 sm:flex-row sm:items-end sm:justify-between">
                <a
                  href={`mailto:${cv.email}`}
                  className="inline-flex size-32 items-center justify-center rounded-full bg-[#19191b] text-center text-xs font-semibold uppercase leading-4 tracking-[0.14em] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40 sm:text-[13px]"
                >
                  <span className="flex flex-col items-center gap-2">
                    <Mail className="size-4" />
                    {copy.contact}
                  </span>
                </a>
                <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.14em] sm:justify-end sm:text-[13px]">
                  <a href={`mailto:${cv.email}`} className="border-b border-white/55 pb-1">
                    Email
                  </a>
                  <a
                    href={cv.contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-white/55 pb-1"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={cv.contact.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-white/55 pb-1"
                  >
                    GitHub
                  </a>
                  <a href="#work" className="border-b border-white/55 pb-1">
                    {copy.work}
                  </a>
                  <a href={pdfHref} className="border-b border-white/55 pb-1">
                    CV PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-between border-t border-white/30 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/72 sm:mt-28 sm:text-[13px]">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top">
              Yotam Faraggi <ArrowUpRight className="ms-1 inline size-3" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
