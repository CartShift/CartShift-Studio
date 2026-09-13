'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, Mail, MapPin } from 'lucide-react';
import { useMessages } from 'next-intl';
import { buildCVData, type RawCVMessages } from '@/lib/cv/cv-data';
import { getPortfolioShowcases, type PortfolioShowcaseProject } from '@/lib/portfolio-showcase';

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

function ProjectCardVisual({ project }: { project: PortfolioShowcaseProject }) {
  if (!project.hero) {
    return (
      <div className="relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden bg-[#171719] p-6 text-white sm:min-h-[30rem] sm:p-8">
        <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 78% 18%, ${project.accent}65, transparent 36%), radial-gradient(circle at 14% 86%, ${project.accent}32, transparent 34%)` }} />
        <div className="relative flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] text-white/52"><span>{project.title}</span><span>{project.status}</span></div>
        <p className="relative max-w-[7ch] text-[14vw] font-medium leading-[0.76] tracking-[-0.07em] sm:text-6xl lg:text-7xl">Releases.<br />Content.<br />Audience.</p>
        <div className="relative flex flex-wrap gap-2">
          {project.highlights.map(item => <span key={item} className="rounded-full border border-white/16 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.13em] text-white/62">{item}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[22rem] overflow-hidden sm:min-h-[30rem]" style={{ backgroundColor: project.accentSoft }}>
      {/* Native img keeps public GitHub product screenshots usable without coupling this portfolio to Next image host config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={project.hero.src} alt={project.hero.alt} loading="lazy" decoding="async" className={`h-full w-full transition-transform duration-700 group-hover:scale-[1.012] ${project.hero.contain ? 'object-contain p-5 sm:p-8' : 'object-cover'}`} />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 via-black/5 to-transparent p-5 pt-20 text-[8px] font-semibold uppercase tracking-[0.16em] text-white sm:p-6 sm:text-[9px]"><span>{project.hero.label}</span><span>{project.number}</span></div>
    </div>
  );
}

export default function PortfolioV4({ locale }: { locale: string }) {
  const isHebrew = locale === 'he';
  const messages = useMessages() as { cv: RawCVMessages };
  const cv = useMemo(() => buildCVData(messages.cv), [messages]);
  const projects = useMemo(() => getPortfolioShowcases(locale), [locale]);
  const reduceMotion = useReducedMotion();
  const cvHref = `/${locale}/cv`;
  const pdfHref = `/${locale}/cv/render?variant=default`;

  const copy = isHebrew
    ? {
        navWork: 'עבודות', navApproach: 'גישה', navExperience: 'ניסיון', navCv: 'קורות חיים',
        kicker: 'Senior Product Engineer · ברלין',
        headline: 'אני הופך רעיונות למוצרים שאפשר לראות ולהשתמש בהם.',
        intro: 'מוצר, UX והנדסה באותה יד. אני אוהב לקחת רעיון לא מסודר, לתת לו צורה, לבנות אותו ולהביא אותו למצב שמרגיש כמו מוצר אמיתי.',
        primaryCta: 'לצפייה במוצרים', secondaryCta: 'הורדת CV',
        proofYears: '10+ שנים', proofYearsLabel: 'תוכנה בפרודקשן',
        proofProducts: '5 מוצרים', proofProductsLabel: 'בפורטפוליו הנבחר',
        proofBreadth: 'Web · AI · Mobile', proofBreadthLabel: 'טווח מוצרי',
        proofOwnership: 'End-to-end', proofOwnershipLabel: 'ownership',
        workEyebrow: 'מוצרים נבחרים', workTitle: 'המוצרים עצמם הם ההוכחה.',
        workIntro: 'כל פרויקט נפתח ל-showcase ויזואלי קצר: מה המוצר, למי הוא נועד, איך הוא נראה ובאיזה stack הוא נבנה.',
        builtFor: 'למי', role: 'התפקיד שלי', technology: 'טכנולוגיה', explore: 'פתיחת הפרויקט',
        approachEyebrow: 'איך אני עובד', approachTitle: 'רעיון טוב צריך להגיע עד למסך שעובד.',
        approachIntro: 'אני מחבר product sense, עיצוב מערכת ויכולת full-stack כדי לקצר את המרחק בין רעיון לבין מוצר שאפשר לשים מול משתמשים.',
        principleProduct: 'רעיון למוצר', principleProductText: 'לזקק מה באמת צריך להתקיים, למי ולמה, לפני שהמוצר נהיה אוסף של פיצ׳רים.',
        principleDesign: 'מערכת ולא מסך', principleDesignText: 'לבנות חוויה קוהרנטית, עם שפה ויזואלית, היררכיה ו-UX שעובדים יחד.',
        principleBuild: 'לסגור את הלופ', principleBuildText: 'להיות מספיק hands-on כדי לקחת את המוצר מהקונספט, דרך הקוד, ועד שימוש אמיתי.',
        experienceEyebrow: 'ניסיון', experienceTitle: 'יותר מעשור של בניית תוכנה אמיתית.',
        experienceIntro: 'הפורטפוליו מראה את המוצרים. ה-CV נותן את ההקשר המלא של התפקידים, הצוותים והמערכות שבניתי לאורך הדרך.',
        fullHistory: 'ל-CV המלא', contactEyebrow: 'ברלין · אזרח האיחוד האירופי',
        contactTitle: 'מחפש את המוצר הבא ששווה לבנות.', getInTouch: 'יצירת קשר', location: 'ברלין, גרמניה',
        roleLine: 'Senior Product Engineer · Full-stack · AI · Product', scroll: 'מוצרים',
      }
    : {
        navWork: 'Work', navApproach: 'Approach', navExperience: 'Experience', navCv: 'CV',
        kicker: 'Senior Product Engineer · Berlin',
        headline: 'I turn ideas into products you can actually see and use.',
        intro: 'Product, UX and engineering in one loop. I like taking an unclear idea, giving it shape, building it, and pushing it until it feels like a real product.',
        primaryCta: 'View products', secondaryCta: 'Download CV',
        proofYears: '10+ yrs', proofYearsLabel: 'production software',
        proofProducts: '5 products', proofProductsLabel: 'in selected work',
        proofBreadth: 'Web · AI · Mobile', proofBreadthLabel: 'product range',
        proofOwnership: 'End-to-end', proofOwnershipLabel: 'ownership',
        workEyebrow: 'Selected products', workTitle: 'The products are the proof.',
        workIntro: 'Every project opens into a short visual showcase: what it is, who it is for, what it looks like, and the stack behind it.',
        builtFor: 'Built for', role: 'My role', technology: 'Technology', explore: 'Explore project',
        approachEyebrow: 'How I work', approachTitle: 'A good idea should make it all the way to a working screen.',
        approachIntro: 'I combine product sense, system design and full-stack execution to shorten the distance between an idea and something real people can use.',
        principleProduct: 'Idea to product', principleProductText: 'Clarify what should exist, for whom and why before the product turns into a list of features.',
        principleDesign: 'System, not screen', principleDesignText: 'Build a coherent experience where visual language, hierarchy and UX reinforce each other.',
        principleBuild: 'Close the loop', principleBuildText: 'Stay hands-on enough to take the product from concept through code and into real use.',
        experienceEyebrow: 'Experience', experienceTitle: 'More than a decade building real software.',
        experienceIntro: 'The portfolio shows the products. The CV carries the full context of the roles, teams and systems behind the career.',
        fullHistory: 'View full CV', contactEyebrow: 'Berlin · EU citizen',
        contactTitle: 'Looking for the next product worth building.', getInTouch: 'Get in touch', location: 'Berlin, Germany',
        roleLine: 'Senior Product Engineer · Full-stack · AI · Product', scroll: 'Products',
      };

  const proof = [
    [copy.proofYears, copy.proofYearsLabel], [copy.proofProducts, copy.proofProductsLabel],
    [copy.proofBreadth, copy.proofBreadthLabel], [copy.proofOwnership, copy.proofOwnershipLabel],
  ];
  const experience = cv.recentExperiences.slice(0, 3);
  const sectionReveal = reduceMotion ? { initial: false as const } : { variants: reveal, initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.16 }, transition: { duration: 0.64, ease } };

  return (
    <main className="overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[#6257d8] selection:text-white" dir={isHebrew ? 'rtl' : 'ltr'}>
      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]" aria-label={isHebrew ? 'ניווט בפורטפוליו' : 'Portfolio navigation'}>
          <a href="#top" className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span className="text-white/50">©</span><span className="transition-opacity group-hover:opacity-60">Yotam Faraggi</span></a>
          <div className="flex items-center gap-4 sm:gap-7 lg:gap-9"><a href="#work" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navWork}</a><a href="#approach" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navApproach}</a><a href="#experience" className="hidden transition-opacity hover:opacity-60 md:inline">{copy.navExperience}</a><a href={cvHref} className="rounded-full border border-white/30 px-4 py-2.5 transition-colors hover:bg-white hover:text-[#1d1d1f]">{copy.navCv}</a></div>
        </nav>
      </header>

      <section id="top" className="relative min-h-[100svh] overflow-hidden bg-[#171719] px-5 pb-6 pt-24 text-white sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <Image src="/images/portfolio-v2/hero-art.webp" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover object-center opacity-[0.72] saturate-[0.78] contrast-[1.06] max-sm:hidden" />
        <Image src="/images/portfolio-v2/hero-mobile-art.webp" alt="" fill priority sizes="100vw" className="pointer-events-none object-cover object-[center_40%] opacity-[0.68] saturate-[0.78] contrast-[1.06] sm:hidden" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,25,.06)_0%,rgba(23,23,25,.14)_40%,rgba(23,23,25,.91)_100%),linear-gradient(90deg,rgba(23,23,25,.52)_0%,rgba(23,23,25,.06)_58%,rgba(23,23,25,.26)_100%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1680px] flex-col">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.17em] text-white/62 sm:text-[10px]"><span className="flex items-center gap-2"><MapPin className="size-3" />{copy.location}</span><span className="max-w-[15rem] text-end leading-4 sm:max-w-none sm:leading-5">{copy.roleLine}</span></div>
          <div className="mt-auto max-w-[1220px] pb-10 pt-20 sm:pb-14 lg:pb-16">
            <motion.p initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.05, ease }} className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/58 sm:text-[10px]">{copy.kicker}</motion.p>
            <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 46 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.86, ease }} className="max-w-[10ch] text-[15.4vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9.4vw] lg:text-[7.7vw] xl:text-[7.8rem]">{copy.headline}</motion.h1>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, delay: 0.12, ease }} className="mt-8 flex max-w-4xl flex-col gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-2xl text-base leading-7 text-white/72 sm:text-xl sm:leading-8">{copy.intro}</p><div className="flex shrink-0 flex-wrap gap-3"><a href="#work" className="inline-flex items-center gap-2 rounded-full bg-[#6257d8] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-transform hover:scale-[1.02]">{copy.primaryCta} <ArrowDown className="size-3.5" /></a><a href={pdfHref} className="inline-flex items-center gap-2 rounded-full border border-white/28 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-[#1d1d1f]"><Download className="size-3.5" />{copy.secondaryCta}</a></div></motion.div>
          </div>
          <div className="grid gap-px border-t border-white/15 bg-white/15 sm:grid-cols-4">{proof.map(([value, label]) => <div key={label} className="bg-[#171719]/85 py-4 sm:px-5 sm:py-5 first:sm:ps-0"><p className="text-xl font-medium tracking-[-0.05em] sm:text-3xl">{value}</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/52 sm:text-[9px]">{label}</p></div>)}</div>
          <a href="#work" className="mt-4 flex items-center justify-end gap-2 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/66 sm:text-[9px]">{copy.scroll} <ArrowDown className="size-3.5" /></a>
        </div>
      </section>

      <section id="work" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/52 sm:text-[10px]">01 / {copy.workEyebrow}</p><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><h2 className="max-w-[10ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.workTitle}</h2><p className="max-w-md text-[13px] leading-6 text-black/62 sm:text-sm sm:leading-6 lg:pb-2">{copy.workIntro}</p></div></motion.div>
          <div className="space-y-6 lg:ms-[22%]">
            {projects.map((project, index) => (
              <motion.article key={project.slug} {...(reduceMotion ? { initial: false } : { variants: reveal, initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.12 }, transition: { duration: 0.56, delay: index * 0.03, ease } })} className="overflow-hidden border border-black/18 bg-[#f3f1ec]">
                <a href={`/${locale}/portfolio/${project.slug}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8]">
                  <div className="grid lg:grid-cols-[1.02fr_.98fr]">
                    <ProjectCardVisual project={project} />
                    <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-black/46"><span>{project.number} / {project.descriptor}</span><span>{project.year}</span></div>
                      <h3 className="mt-8 text-[14vw] font-medium leading-[0.82] tracking-[-0.065em] sm:text-6xl lg:text-7xl" dir="ltr">{project.title}</h3>
                      <p className="mt-5 max-w-xl text-sm leading-6 text-black/66 sm:text-base sm:leading-7">{project.summary}</p>
                      <div className="mt-8 grid gap-5 border-t border-black/18 pt-6 sm:grid-cols-2 lg:mt-auto lg:pt-7"><div><p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/45">{copy.role}</p><p className="mt-2 text-[12px] leading-5 text-black/68">{project.role}</p></div><div><p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/45">{copy.technology}</p><p className="mt-2 text-[12px] leading-5 text-black/68">{project.technologies.slice(0, 4).join(' · ')}</p></div></div>
                      <div className="mt-7 flex items-center justify-between"><span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-black/42">{project.status}</span><span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-black/62">{copy.explore}<span className="inline-flex size-11 items-center justify-center rounded-full bg-[#1d1d1f] text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="size-4" /></span></span></div>
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
          <motion.div {...sectionReveal} className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/52 sm:text-[10px]">02 / {copy.approachEyebrow}</p><div><h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.approachTitle}</h2><p className="mt-10 max-w-2xl text-xl leading-[1.25] tracking-[-0.025em] text-white/68 sm:text-2xl lg:ms-[28%] lg:text-3xl">{copy.approachIntro}</p></div></motion.div>
          <div className="mt-20 border-t border-white/16 lg:ms-[22%] lg:mt-28">{[[copy.principleProduct, copy.principleProductText], [copy.principleDesign, copy.principleDesignText], [copy.principleBuild, copy.principleBuildText]].map(([title, text], index) => <div key={title} className="grid gap-4 border-b border-white/16 py-7 sm:grid-cols-[0.1fr_0.5fr_0.8fr] sm:items-start sm:gap-7 sm:py-9"><p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/42">0{index + 1}</p><h3 className="text-[9vw] font-medium leading-[0.92] tracking-[-0.055em] sm:text-4xl lg:text-5xl">{title}</h3><p className="max-w-xl text-[13px] leading-6 text-white/64 sm:text-base sm:leading-7">{text}</p></div>)}</div>
        </div>
      </section>

      <section id="experience" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="mb-14 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-20"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/52 sm:text-[10px]">03 / {copy.experienceEyebrow}</p><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.experienceTitle}</h2><p className="max-w-md text-[13px] leading-6 text-black/62 sm:text-sm sm:leading-6 lg:pb-2">{copy.experienceIntro}</p></div></motion.div>
          <div className="border-t border-black/20 lg:ms-[22%]">{experience.map((item, index) => <div key={item.key} className="grid gap-4 border-b border-black/20 py-6 sm:grid-cols-[0.18fr_0.48fr_0.8fr] sm:items-start sm:gap-7 sm:py-8"><div className="text-[9px] font-semibold uppercase leading-5 tracking-[0.15em] text-black/43"><p>0{index + 1}</p><p className="mt-1">{item.duration}</p></div><div><h3 className="text-[8vw] font-medium leading-[0.92] tracking-[-0.05em] sm:text-3xl lg:text-4xl" dir="ltr">{item.company}</h3><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/50">{item.title}</p></div><p className="max-w-2xl text-[13px] leading-6 text-black/64 sm:text-sm sm:leading-6">{item.description ?? item.highlights[0]}</p></div>)}<div className="pt-7"><a href={cvHref} className="inline-flex items-center gap-2 border-b border-black/40 pb-1 text-xs font-semibold uppercase tracking-[0.13em]">{copy.fullHistory} <ArrowUpRight className="size-3.5" /></a></div></div>
        </div>
      </section>

      <footer id="contact" className="bg-[#6257d8] px-5 pb-8 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1680px]"><div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[10px]">{copy.contactEyebrow}</p><div><h2 className="max-w-[10ch] text-[14vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7vw] xl:text-[7rem]">{copy.contactTitle}</h2><div className="mt-10 flex flex-col gap-8 border-t border-white/30 pt-7 sm:flex-row sm:items-end sm:justify-between"><a href={`mailto:${cv.email}`} className="inline-flex size-32 items-center justify-center rounded-full bg-[#19191b] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.15em] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40"><span className="flex flex-col items-center gap-2"><Mail className="size-4" />{copy.getInTouch}</span></a><div className="flex flex-wrap gap-6 text-[9px] font-semibold uppercase tracking-[0.15em] sm:justify-end sm:text-[10px]"><a href={`mailto:${cv.email}`} className="border-b border-white/55 pb-1">Email</a><a href={cv.contact.linkedinUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">LinkedIn</a><a href={cv.contact.githubUrl} target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">GitHub</a><a href={cvHref} className="border-b border-white/55 pb-1">{copy.navCv}</a></div></div></div></div><div className="mt-20 flex items-center justify-between border-t border-white/30 pt-5 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/72 sm:mt-28 sm:text-[9px]"><span>Yotam Faraggi © 2026</span><a href="#top">{copy.navWork} ↑</a></div></div>
      </footer>
    </main>
  );
}
