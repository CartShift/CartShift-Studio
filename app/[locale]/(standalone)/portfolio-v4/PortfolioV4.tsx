'use client';

import Image from 'next/image';
import { motion, useReducedMotion, type MotionProps } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Download, MapPin } from 'lucide-react';
import { getPortfolioShowcases, type PortfolioShowcaseProject, type ShowcaseMedia } from '@/lib/portfolio-showcase';

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

function ProductImage({ media, className = '' }: { media: ShowcaseMedia; className?: string }) {
  return (
    // Product evidence can be local or hosted in a public product repository.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.src} alt={media.alt} loading="lazy" decoding="async" className={`${media.contain ? 'object-contain' : 'object-cover'} ${className}`} />
  );
}

function ProjectLink({ project, locale, children, className = '' }: { project: PortfolioShowcaseProject; locale: string; children: React.ReactNode; className?: string }) {
  return <a href={`/${locale}/portfolio/${project.slug}`} className={`group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8] ${className}`}>{children}</a>;
}

function Explore({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.14em] ${light ? 'text-white/72' : 'text-black/62'}`}>
      {label}
      <span className={`inline-flex size-11 items-center justify-center rounded-full transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 ${light ? 'bg-white text-black' : 'bg-[#1d1d1f] text-white'}`}><ArrowUpRight className="size-4" /></span>
    </span>
  );
}

function StarLinkerFeature({ project, locale, explore, motionProps }: { project: PortfolioShowcaseProject; locale: string; explore: string; motionProps: MotionProps }) {
  return (
    <motion.article {...motionProps} className="overflow-hidden border border-black/16 bg-[#f4f1ec]">
      <ProjectLink project={project} locale={locale}>
        <div className="grid lg:grid-cols-[1.18fr_.82fr]">
          <div className="relative min-h-[31rem] overflow-hidden bg-[#d8d3ff] p-5 sm:min-h-[38rem] sm:p-8 lg:p-10">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,30,65,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(34,30,65,.14)_1px,transparent_1px)] [background-size:44px_44px]" />
            <span className="absolute start-[10%] top-[16%] size-3 rounded-full bg-[#7367f0] shadow-[0_0_0_10px_rgba(115,103,240,.12)]" />
            <span className="absolute end-[12%] top-[24%] size-2 rounded-full bg-[#7367f0]/70" />
            <span className="absolute bottom-[17%] start-[18%] size-2.5 rounded-full bg-[#7367f0]/80" />
            {project.hero ? <div className="relative z-10 mt-12 rotate-[-1.2deg] bg-white p-2 shadow-[0_35px_90px_rgba(49,42,112,.2)] sm:p-4"><ProductImage media={project.hero} className="aspect-[16/10] h-full w-full" /></div> : null}
            <div className="absolute inset-x-6 bottom-6 z-20 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-[#2c2851]/58 sm:inset-x-9 sm:bottom-8"><span>Connected workspace</span><span>{project.number}</span></div>
          </div>
          <div className="flex flex-col p-7 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-black/44"><span>AI-native productivity</span><span>{project.year}</span></div>
            <h3 className="mt-10 text-[15vw] font-medium leading-[.8] tracking-[-.07em] text-[#1c1b20] sm:text-7xl lg:text-[5.8rem]" dir="ltr">Star<br />Linker</h3>
            <p className="mt-7 max-w-lg text-base leading-7 text-black/66">{project.summary}</p>
            <div className="mt-10 grid grid-cols-2 gap-px bg-black/12 lg:mt-auto">
              {project.highlights.slice(0, 4).map((item, index) => <div key={item} className="bg-[#f4f1ec] py-4 pe-3 text-[11px] leading-5 text-black/58"><span className="me-2 text-[8px] font-semibold text-[#7367f0]">0{index + 1}</span>{item}</div>)}
            </div>
            <div className="mt-8 flex justify-end"><Explore label={explore} /></div>
          </div>
        </div>
      </ProjectLink>
    </motion.article>
  );
}

function RightFlowFeature({ project, locale, explore, motionProps }: { project: PortfolioShowcaseProject; locale: string; explore: string; motionProps: MotionProps }) {
  return (
    <motion.article {...motionProps} className="overflow-hidden bg-[#132033] text-white">
      <ProjectLink project={project} locale={locale}>
        <div className="grid min-h-[43rem] lg:grid-cols-[.42fr_1fr]">
          <div className="flex flex-col border-white/12 p-7 sm:p-10 lg:border-e lg:p-12">
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-white/48"><span>{project.number}</span><span>{project.year}</span></div>
            <h3 className="mt-14 text-[14vw] font-medium leading-[.8] tracking-[-.07em] text-white sm:text-7xl lg:text-[5.4rem]" dir="ltr">Right<br />Flow</h3>
            <p className="mt-7 max-w-md text-base leading-7 text-white/68">{project.summary}</p>
            <div className="mt-12 border-t border-white/14 lg:mt-auto">
              {['Ingest', 'Verify', 'Decide'].map((item, index) => <div key={item} className="flex items-center gap-4 border-b border-white/12 py-4 text-xs uppercase tracking-[0.12em] text-white/60"><span className="text-[#6fa0ff]">0{index + 1}</span>{item}</div>)}
            </div>
          </div>
          <div className="relative flex items-center overflow-hidden bg-[#cbdcfb] p-5 sm:p-9 lg:p-12">
            <div className="absolute inset-y-0 start-0 hidden w-10 border-e border-[#193357]/12 bg-[#b8cdf0] lg:block" />
            {project.hero ? <div className="relative z-10 w-full bg-white p-2 shadow-[0_35px_100px_rgba(15,31,56,.22)] sm:p-4"><ProductImage media={project.hero} className="aspect-[16/10] h-full w-full" /></div> : null}
            <div className="absolute bottom-7 end-7 z-20"><Explore label={explore} /></div>
          </div>
        </div>
      </ProjectLink>
    </motion.article>
  );
}

function EnsemblisFeature({ project, locale, explore, motionProps, isHebrew }: { project: PortfolioShowcaseProject; locale: string; explore: string; motionProps: MotionProps; isHebrew: boolean }) {
  return (
    <motion.article {...motionProps} className="overflow-hidden bg-[#18121f] text-white">
      <ProjectLink project={project} locale={locale}>
        <div className="relative min-h-[47rem] p-7 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(155,114,242,.45),transparent_31%),radial-gradient(circle_at_12%_88%,rgba(255,89,172,.19),transparent_28%)]" />
          <div className="relative flex h-full min-h-[40rem] flex-col">
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] text-white/52"><span>{project.number} / {project.status}</span><span>Music × AI</span></div>
            <div className="my-auto py-16">
              <p className="text-[9vw] font-medium leading-[.85] tracking-[-.06em] text-[#c7afff] sm:text-[5vw] lg:text-[4.4rem]">{isHebrew ? 'ריליס הוא לא תאריך.' : 'A release is not a date.'}</p>
              <h3 className="mt-3 text-[17vw] font-medium leading-[.73] tracking-[-.08em] text-white sm:text-[10vw] lg:text-[8.5rem]" dir="ltr">Ensemblis</h3>
            </div>
            <div className="grid gap-7 border-t border-white/18 pt-7 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <p className="max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">{project.summary}</p>
              <div className="flex items-end justify-between gap-6 lg:justify-end"><div className="flex flex-wrap gap-2">{project.highlights.map(item => <span key={item} className="border border-white/16 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.13em] text-white/58">{item}</span>)}</div><Explore label={explore} light /></div>
            </div>
          </div>
        </div>
      </ProjectLink>
    </motion.article>
  );
}

function WakeMyWayFeature({ project, locale, explore, motionProps, isHebrew }: { project: PortfolioShowcaseProject; locale: string; explore: string; motionProps: MotionProps; isHebrew: boolean }) {
  const media = [project.gallery[0], project.hero, project.gallery[2]].filter(Boolean) as ShowcaseMedia[];
  return (
    <motion.article {...motionProps} className="overflow-hidden bg-[#fff4ec] text-[#2b1b16]">
      <ProjectLink project={project} locale={locale}>
        <div className="grid lg:grid-cols-[.7fr_1.3fr]">
          <div className="flex flex-col p-7 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-[#2b1b16]/44"><span>{project.number} / Android</span><span>{project.year}</span></div>
            <h3 className="mt-12 text-[14vw] font-medium leading-[.78] tracking-[-.07em] sm:text-7xl lg:text-[5.6rem]" dir="ltr">Wake<br />MyWay</h3>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#2b1b16]/66">{isHebrew ? 'לא רק להעיר. לעזור לגוף לעבור משינה לפעולה, ואז ללמוד מה באמת עבד.' : 'Not just wake you up. Move the body from sleep into action, then learn what actually worked.'}</p>
            <div className="mt-12 flex items-center gap-5 border-t border-[#2b1b16]/14 pt-6 lg:mt-auto"><span className="text-2xl font-medium tracking-[-.04em] text-[#ff6f3d]">23:00</span><span className="h-px flex-1 bg-[#2b1b16]/14" /><span className="text-2xl font-medium tracking-[-.04em] text-[#ff6f3d]">07:05</span></div>
            <div className="mt-7"><Explore label={explore} /></div>
          </div>
          <div className="relative flex min-h-[42rem] items-center justify-center overflow-hidden bg-[#ff8b5f] px-4 py-12 sm:px-10 lg:px-12">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#2b1b16_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="relative grid w-full max-w-[48rem] grid-cols-3 items-end gap-3 sm:gap-6">
              {media.map((item, index) => <div key={item.src} className={`${index === 0 ? 'translate-y-7 rotate-[-2deg]' : index === 2 ? 'translate-y-10 rotate-[2deg]' : 'relative z-10 scale-[1.04]'} overflow-hidden rounded-[1.8rem] bg-[#111113] p-2 shadow-[0_30px_80px_rgba(54,23,12,.25)] sm:rounded-[2.3rem] sm:p-3`}><ProductImage media={item} className="aspect-[9/16] h-full w-full rounded-[1.3rem] sm:rounded-[1.7rem]" /></div>)}
            </div>
          </div>
        </div>
      </ProjectLink>
    </motion.article>
  );
}

function CartShiftFeature({ project, locale, explore, motionProps, isHebrew }: { project: PortfolioShowcaseProject; locale: string; explore: string; motionProps: MotionProps; isHebrew: boolean }) {
  const dark = project.gallery[0];
  return (
    <motion.article {...motionProps} className="overflow-hidden border border-black/16 bg-[#eeeae3]">
      <ProjectLink project={project} locale={locale}>
        <div className="p-7 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-black/44"><span>{project.number} / Studio operating system</span><span>{project.year}</span></div>
          <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
            <h3 className="text-[14vw] font-medium leading-[.78] tracking-[-.07em] text-[#1d1d1f] sm:text-[8vw] lg:text-[6.5rem]" dir="ltr">CartShift<br />Studio</h3>
            <p className="max-w-xl text-base leading-7 text-black/64">{isHebrew ? 'הסטודיו עצמו כמוצר: acquisition, proposals, client operations ו-delivery באותה מערכת.' : 'The studio itself as a product: acquisition, proposals, client operations and delivery in one system.'}</p>
          </div>
        </div>
        <div className="relative min-h-[34rem] overflow-hidden bg-[#d7d2ff] p-5 sm:min-h-[42rem] sm:p-9 lg:p-12">
          {project.hero ? <div className="absolute start-[5%] top-[9%] z-10 w-[72%] bg-white p-2 shadow-[0_35px_100px_rgba(38,31,100,.2)] sm:p-4"><ProductImage media={project.hero} className="aspect-[16/10] h-full w-full" /></div> : null}
          {dark ? <div className="absolute bottom-[8%] end-[5%] z-20 w-[62%] bg-[#171719] p-2 shadow-[0_35px_100px_rgba(24,20,58,.28)] sm:p-4"><ProductImage media={dark} className="aspect-[16/10] h-full w-full" /></div> : null}
          <div className="absolute bottom-7 start-7 z-30 sm:bottom-9 sm:start-9"><Explore label={explore} /></div>
        </div>
      </ProjectLink>
    </motion.article>
  );
}

function ProjectFeature({ project, locale, explore, isHebrew, motionProps }: { project: PortfolioShowcaseProject; locale: string; explore: string; isHebrew: boolean; motionProps: MotionProps }) {
  if (project.slug === 'starlinker') return <StarLinkerFeature project={project} locale={locale} explore={explore} motionProps={motionProps} />;
  if (project.slug === 'rightflow') return <RightFlowFeature project={project} locale={locale} explore={explore} motionProps={motionProps} />;
  if (project.slug === 'ensemblis') return <EnsemblisFeature project={project} locale={locale} explore={explore} motionProps={motionProps} isHebrew={isHebrew} />;
  if (project.slug === 'wakemyway') return <WakeMyWayFeature project={project} locale={locale} explore={explore} motionProps={motionProps} isHebrew={isHebrew} />;
  return <CartShiftFeature project={project} locale={locale} explore={explore} motionProps={motionProps} isHebrew={isHebrew} />;
}

export default function PortfolioV4({ locale }: { locale: string }) {
  const isHebrew = locale === 'he';
  const projects = getPortfolioShowcases(locale);
  const reduceMotion = useReducedMotion();
  const cvHref = `/${locale}/cv`;
  const pdfHref = `/${locale}/cv/render?variant=default`;

  const copy = isHebrew
    ? {
        navWork: 'מוצרים', navApproach: 'גישה', navCv: 'קורות חיים', kicker: 'Senior Product Engineer · ברלין',
        headline: 'אני הופך רעיונות למוצרים שאפשר לראות ולהשתמש בהם.',
        intro: 'מוצר, UX והנדסה באותה יד. אני אוהב לקחת רעיון לא מסודר, לתת לו צורה, לבנות אותו ולהביא אותו למצב שמרגיש כמו מוצר אמיתי.',
        primaryCta: 'לצפייה במוצרים', secondaryCta: 'הורדת CV', proofYears: '10+ שנים', proofYearsLabel: 'תוכנה בפרודקשן',
        proofProducts: '5 מוצרים', proofProductsLabel: 'בפורטפוליו הנבחר', proofBreadth: 'Web · AI · Mobile', proofBreadthLabel: 'טווח מוצרי',
        proofOwnership: 'End-to-end', proofOwnershipLabel: 'ownership', workEyebrow: 'מוצרים נבחרים', workTitle: 'חמישה מוצרים. חמש בעיות שונות.',
        workIntro: 'במקום להכניס כל מוצר לאותה תבנית, כל אחד מוצג דרך הדבר שמגדיר אותו: מרחב, workflow, lifecycle, רגע שימוש או מערכת תפעול.',
        explore: 'פתיחת הפרויקט', approachEyebrow: 'איך אני עובד', approachTitle: 'רעיון טוב צריך להגיע עד למסך שעובד.',
        approachIntro: 'אני מחבר product sense, עיצוב מערכת ויכולת full-stack כדי לקצר את המרחק בין רעיון לבין מוצר שאפשר לשים מול משתמשים.',
        principleProduct: 'רעיון למוצר', principleProductText: 'לזקק מה באמת צריך להתקיים, למי ולמה, לפני שהמוצר נהיה אוסף של פיצ׳רים.',
        principleDesign: 'מערכת ולא מסך', principleDesignText: 'לבנות חוויה קוהרנטית עם שפה ויזואלית, היררכיה ו-UX שעובדים יחד.',
        principleBuild: 'לסגור את הלופ', principleBuildText: 'להיות מספיק hands-on כדי לקחת את המוצר מהקונספט, דרך הקוד, ועד שימוש אמיתי.',
        contactEyebrow: 'ברלין · אזרח האיחוד האירופי', contactTitle: 'מחפש את המוצר הבא ששווה לבנות.', viewCv: 'ל-CV המלא',
        location: 'ברלין, גרמניה', roleLine: 'Senior Product Engineer · Full-stack · AI · Product', scroll: 'מוצרים',
      }
    : {
        navWork: 'Products', navApproach: 'Approach', navCv: 'CV', kicker: 'Senior Product Engineer · Berlin',
        headline: 'I turn ideas into products you can actually see and use.',
        intro: 'Product, UX and engineering in one loop. I like taking an unclear idea, giving it shape, building it, and pushing it until it feels like a real product.',
        primaryCta: 'View products', secondaryCta: 'Download CV', proofYears: '10+ yrs', proofYearsLabel: 'production software',
        proofProducts: '5 products', proofProductsLabel: 'in selected work', proofBreadth: 'Web · AI · Mobile', proofBreadthLabel: 'product range',
        proofOwnership: 'End-to-end', proofOwnershipLabel: 'ownership', workEyebrow: 'Selected products', workTitle: 'Five products. Five different problems.',
        workIntro: 'Instead of forcing every product into the same case-study template, each one is introduced through what defines it: a space, workflow, lifecycle, moment of use, or operating system.',
        explore: 'Explore project', approachEyebrow: 'How I work', approachTitle: 'A good idea should make it all the way to a working screen.',
        approachIntro: 'I combine product sense, system design and full-stack execution to shorten the distance between an idea and something real people can use.',
        principleProduct: 'Idea to product', principleProductText: 'Clarify what should exist, for whom and why before the product turns into a list of features.',
        principleDesign: 'System, not screen', principleDesignText: 'Build a coherent experience where visual language, hierarchy and UX reinforce each other.',
        principleBuild: 'Close the loop', principleBuildText: 'Stay hands-on enough to take the product from concept through code and into real use.',
        contactEyebrow: 'Berlin · EU citizen', contactTitle: 'Looking for the next product worth building.', viewCv: 'View full CV',
        location: 'Berlin, Germany', roleLine: 'Senior Product Engineer · Full-stack · AI · Product', scroll: 'Products',
      };

  const proof = [[copy.proofYears, copy.proofYearsLabel], [copy.proofProducts, copy.proofProductsLabel], [copy.proofBreadth, copy.proofBreadthLabel], [copy.proofOwnership, copy.proofOwnershipLabel]];
  const sectionReveal: MotionProps = reduceMotion ? { initial: false } : { variants: reveal, initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.16 }, transition: { duration: 0.64, ease } };
  const featureMotion = (index: number): MotionProps => reduceMotion ? { initial: false } : { variants: reveal, initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.08 }, transition: { duration: 0.58, delay: index * 0.025, ease } };

  return (
    <main className="overflow-x-clip bg-[#eceae5] text-[#1d1d1f] selection:bg-[#6257d8] selection:text-white" dir={isHebrew ? 'rtl' : 'ltr'}>
      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1680px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] sm:text-[10px]" aria-label={isHebrew ? 'ניווט בפורטפוליו' : 'Portfolio navigation'}>
          <a href="#top" className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span className="text-white/50">©</span><span className="transition-opacity group-hover:opacity-60">Yotam Faraggi</span></a>
          <div className="flex items-center gap-4 sm:gap-7 lg:gap-9"><a href="#work" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navWork}</a><a href="#approach" className="hidden transition-opacity hover:opacity-60 sm:inline">{copy.navApproach}</a><a href={cvHref} className="rounded-full border border-white/30 px-4 py-2.5 transition-colors hover:bg-white hover:text-[#1d1d1f]">{copy.navCv}</a></div>
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
          <motion.div {...sectionReveal} className="mb-16 grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12 sm:mb-24"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/52 sm:text-[10px]">01 / {copy.workEyebrow}</p><div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.workTitle}</h2><p className="max-w-md text-[13px] leading-6 text-black/62 sm:text-sm sm:leading-6 lg:pb-2">{copy.workIntro}</p></div></motion.div>
          <div className="space-y-10 lg:ms-[10%] lg:space-y-14">{projects.map((project, index) => <ProjectFeature key={project.slug} project={project} locale={locale} explore={copy.explore} isHebrew={isHebrew} motionProps={featureMotion(index)} />)}</div>
        </div>
      </section>

      <section id="approach" className="bg-[#19191b] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1680px]">
          <motion.div {...sectionReveal} className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/52 sm:text-[10px]">02 / {copy.approachEyebrow}</p><div><h2 className="max-w-[11ch] text-[13vw] font-medium leading-[0.82] tracking-[-0.07em] sm:text-[7.6vw] lg:text-[6vw] xl:text-[6.1rem]">{copy.approachTitle}</h2><p className="mt-10 max-w-2xl text-xl leading-[1.25] tracking-[-0.025em] text-white/68 sm:text-2xl lg:ms-[28%] lg:text-3xl">{copy.approachIntro}</p></div></motion.div>
          <div className="mt-20 border-t border-white/16 lg:ms-[22%] lg:mt-28">{[[copy.principleProduct, copy.principleProductText], [copy.principleDesign, copy.principleDesignText], [copy.principleBuild, copy.principleBuildText]].map(([title, text], index) => <div key={title} className="grid gap-4 border-b border-white/16 py-7 sm:grid-cols-[0.1fr_0.5fr_0.8fr] sm:items-start sm:gap-7 sm:py-9"><p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/42">0{index + 1}</p><h3 className="text-[9vw] font-medium leading-[0.92] tracking-[-0.055em] sm:text-4xl lg:text-5xl">{title}</h3><p className="max-w-xl text-[13px] leading-6 text-white/64 sm:text-base sm:leading-7">{text}</p></div>)}</div>
        </div>
      </section>

      <footer className="bg-[#6257d8] px-5 pb-8 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1680px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[10px]">{copy.contactEyebrow}</p><div><h2 className="max-w-[10ch] text-[14vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7vw] xl:text-[7rem]">{copy.contactTitle}</h2><div className="mt-10 flex flex-col gap-8 border-t border-white/30 pt-7 sm:flex-row sm:items-end sm:justify-between"><a href={cvHref} className="inline-flex size-32 items-center justify-center rounded-full bg-[#19191b] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.15em] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-40">{copy.viewCv}</a><div className="flex flex-wrap gap-6 text-[9px] font-semibold uppercase tracking-[0.15em] sm:justify-end sm:text-[10px]"><a href={cvHref} className="border-b border-white/55 pb-1">CV</a><a href="https://github.com/yotamon" target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">GitHub</a><a href="https://linkedin.com/in/yotam-faraggi" target="_blank" rel="noreferrer" className="border-b border-white/55 pb-1">LinkedIn</a></div></div></div></div>
          <div className="mt-20 flex items-center justify-between border-t border-white/30 pt-5 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/72 sm:mt-28 sm:text-[9px]"><span>Yotam Faraggi © 2026</span><a href="#top">{copy.navWork} ↑</a></div>
        </div>
      </footer>
    </main>
  );
}
