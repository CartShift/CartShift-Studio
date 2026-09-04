'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowDown, ArrowUpRight, MapPin, Menu, X } from 'lucide-react';

type Project = {
  number: string;
  title: string;
  descriptor: string;
  description: string;
  services: string;
  impact: string;
  year: string;
  href: string | null;
  external: boolean;
  surface: string;
  image?: string;
  imageAlt?: string;
};

type PortfolioCopy = {
  portfolioLabel: string;
  nav: { work: string; about: string; experience: string; cv: string; contact: string };
  openMenu: string;
  closeMenu: string;
  mobileNavLabel: string;
  location: string;
  role: string;
  availability: string;
  heroIntro: string;
  heroPromise: string;
  scroll: string;
  recentWork: string;
  workRange: string;
  workTitle: string;
  workIntro: string;
  impact: string;
  fullCareer: string;
  aboutLabel: string;
  aboutTitle: string;
  aboutIntro: string;
  principles: readonly [string, string, string][];
  experience: string;
  experienceIntro: string;
  fullHistory: string;
  viewCv: string;
  contactEyebrow: string;
  contactTitle: string;
  getInTouch: string;
  backToTop: string;
  externalLabel: string;
  buildingNow: string;
  ensemblisLine: string;
};

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 42 },
  visible: { opacity: 1, y: 0 },
};

function getCopy(isHebrew: boolean): PortfolioCopy {
  return isHebrew
    ? {
        portfolioLabel: 'פורטפוליו / 2026',
        nav: { work: 'עבודות', about: 'אודות', experience: 'ניסיון', cv: 'קורות חיים', contact: 'קשר' },
        openMenu: 'פתיחת תפריט',
        closeMenu: 'סגירת תפריט',
        mobileNavLabel: 'ניווט בפורטפוליו',
        location: 'ברלין, גרמניה',
        role: 'Senior Product Engineer',
        availability: 'פתוח להזדמנות הנכונה',
        heroIntro: 'אני לוקח רעיונות לא מסודרים והופך אותם למוצרים אמינים שאנשים באמת משתמשים בהם.',
        heroPromise: 'חשיבה מוצרית, עומק הנדסי ואחריות מקצה לקצה.',
        scroll: 'לגלול',
        recentWork: 'עבודות נבחרות',
        workRange: '2021 / 2026',
        workTitle: 'מוצרים שלקחתי מרעיון לפרודקשן.',
        workIntro: 'תחומים שונים, אותה גישה: להבין את הבעיה לעומק, לקחת אחריות על החלק הקשה ולשחרר מוצר שעובד.',
        impact: 'השפעה',
        fullCareer: 'כל הקריירה\nבקורות החיים',
        aboutLabel: 'אודות / גישה',
        aboutTitle: 'אני אוהב לקחת אחריות על כל הבעיה.',
        aboutIntro: 'Product engineering טוב הוא לא רק כתיבת קוד. הוא להבין מה צריך להתקיים, איך הוא צריך להתנהג ומה נדרש כדי שיישאר אמין גם אחרי ההשקה.',
        principles: [
          ['מוצר', 'להפוך דרישות לא ברורות למשהו קונקרטי שאפשר לבנות, לבדוק ולשפר.'],
          ['הנדסה', 'לעבור בחופשיות בין frontend, backend, ארכיטקטורה, אינטגרציות, דאטה ואילוצי פרודקשן.'],
          ['שחרור', 'להישאר קרוב לנקודה שבה הארכיטקטורה הופכת לתוכנה אמינה שנמצאת בידיים של משתמשים.'],
        ],
        experience: 'ניסיון',
        experienceIntro: 'תפקידים נבחרים מתוך יותר מעשור של בניית תוכנה לפרודקשן.',
        fullHistory: 'ההיסטוריה המלאה, הטכנולוגיות, ההשכלה והתפקידים המוקדמים נמצאים בקורות החיים.',
        viewCv: 'לצפייה בקורות החיים',
        contactEyebrow: 'ברלין / פתוח להזדמנות הנכונה',
        contactTitle: 'בואו נבנה משהו שבאמת חשוב.',
        getInTouch: 'יצירת\nקשר',
        backToTop: 'חזרה למעלה ↑',
        externalLabel: 'נפתח בלשונית חדשה',
        buildingNow: 'בפיתוח עכשיו',
        ensemblisLine: 'ריליסים. תוכן. קהל.',
      }
    : {
        portfolioLabel: 'Portfolio / 2026',
        nav: { work: 'Work', about: 'About', experience: 'Experience', cv: 'CV', contact: 'Contact' },
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        mobileNavLabel: 'Mobile portfolio navigation',
        location: 'Berlin, Germany',
        role: 'Senior Product Engineer',
        availability: 'Available for the right team',
        heroIntro: 'I build products from the first messy idea to reliable software people actually use.',
        heroPromise: 'Product thinking, engineering depth, end-to-end ownership.',
        scroll: 'Scroll',
        recentWork: 'Recent work',
        workRange: '2021 / 2026',
        workTitle: 'Products I took from idea to production.',
        workIntro: 'Different domains, same instinct: understand the problem deeply, own the hard part, and ship the thing.',
        impact: 'Impact',
        fullCareer: 'Full career\nin the CV',
        aboutLabel: 'About / approach',
        aboutTitle: 'I like owning the whole problem.',
        aboutIntro: 'Good product engineering is not just writing code. It is understanding what should exist, how it should behave, and what it takes to keep it reliable after launch.',
        principles: [
          ['Product', 'Turn unclear requirements into something concrete enough to build, test and improve.'],
          ['Engineering', 'Move across frontend, backend, architecture, integrations, data and production constraints.'],
          ['Shipping', 'Stay close to the point where the architecture becomes reliable software in someone’s hands.'],
        ],
        experience: 'Experience',
        experienceIntro: 'Selected roles from more than a decade building production software.',
        fullHistory: 'Full history, technologies, education, and earlier roles live in the CV.',
        viewCv: 'View CV',
        contactEyebrow: 'Berlin / available for the right next team',
        contactTitle: 'Let’s build something that matters.',
        getInTouch: 'Get in\ntouch',
        backToTop: 'Back to top ↑',
        externalLabel: 'opens in a new tab',
        buildingNow: 'Building now',
        ensemblisLine: 'Releases. Content. Audience.',
      };
}

function getProjects(isHebrew: boolean): readonly Project[] {
  return [
    {
      number: '01',
      title: 'Curalife',
      descriptor: isHebrew ? 'מסחר + digital health' : 'Commerce + digital health',
      description: isHebrew
        ? 'אחריות על חלקים מרכזיים במוצר ובפלטפורמה של Shopify ו-digital health, כולל מוצר רכישה לטלרפואה שנבנה מקצה לקצה.'
        : 'Owned major customer-facing product and platform work across Shopify commerce and digital health, including a telemedicine acquisition product built end-to-end.',
      services: isHebrew ? 'Product ownership / Full-stack / Shopify' : 'Product ownership / Full-stack / Shopify',
      impact: isHebrew
        ? '85% פחות כשלי סנכרון, שיפור של 60% בביצועי מסלולים מרכזיים ומוצר טלרפואה שהפך לערוץ רכישה והכנסות מרכזי.'
        : '85% fewer sync failures, 60% better performance on key journeys, and a telemedicine product that became a primary acquisition and revenue funnel.',
      year: '2021–25',
      image: '/images/case-studies/curalife-metabolic-wellness-platform/hero.jpg',
      imageAlt: 'Curalife digital health and commerce experience',
      href: '/work/curalife-metabolic-wellness-platform',
      external: false,
      surface: '#d5e8dc',
    },
    {
      number: '02',
      title: 'StarLinker',
      descriptor: isHebrew ? 'פרודוקטיביות AI-native' : 'AI-native productivity',
      description: isHebrew
        ? 'מוצר תכנון ויזואלי למטרות, משימות, הרגלים והערות על קנבס מחובר, עם סוכן AI שפועל בתוך המוצר.'
        : 'A visual planning product for mapping goals, tasks, habits, and notes on a connected canvas, with an AI agent that can act inside the product.',
      services: 'Founder / Product / AI / Full-stack',
      impact: isHebrew
        ? 'הובלה מקצה לקצה מהגדרת המוצר והארכיטקטורה ועד חוויית AI שפועלת ישירות בתוך סביבת העבודה.'
        : 'Founder-led end to end, from product definition and architecture to an AI agent that acts directly inside the workspace.',
      year: '2026',
      image: '/images/cv/portfolio/starlinker-en-light.png',
      imageAlt: 'StarLinker visual planning product interface',
      href: 'https://starlinker.io',
      external: true,
      surface: '#cbd0ff',
    },
    {
      number: '03',
      title: 'Ensemblis',
      descriptor: isHebrew ? 'מערכת הפעלה לאמנים' : 'Artist operating system',
      description: isHebrew
        ? 'פלטפורמה בסיוע AI לניהול ריליסים, יצירת תוכן, מודיעין מדיה, תהליכי שיווק ותפעול הפצה.'
        : 'An AI-assisted artist management platform for releases, content creation, media intelligence, marketing workflows, and distribution operations.',
      services: 'Founder / Product design / AI systems',
      impact: isHebrew
        ? 'מערכת אחת שמאחדת תהליכי יצירה, שיווק, מדיה והפצה שבדרך כלל מפוזרים בין כלים רבים.'
        : 'One operating layer for creative, marketing, media, and distribution workflows that are normally fragmented across tools.',
      year: '2026',
      href: null,
      external: false,
      surface: '#dcd1ff',
    },
    {
      number: '04',
      title: 'RightFlow',
      descriptor: isHebrew ? 'Document intelligence' : 'Document intelligence',
      description: isHebrew
        ? 'פלטפורמת בדיקה ואימות מסמכים להפקדות פנסיה ושכר, עם תהליכי סקירה מובנים וייצוא דוחות.'
        : 'A document review and verification platform for pension and payroll contribution checks, with structured review flows and report export.',
      services: 'Founder / Automation / Full-stack',
      impact: isHebrew
        ? 'הפיכת בדיקה רגישה ורבת מסמכים ל-workflow מובנה, עקבי וניתן לייצוא.'
        : 'Turned a sensitive, document-heavy verification process into a structured, repeatable workflow with report export.',
      year: '2025',
      image: '/images/cv/portfolio/rightflow-en-light.png',
      imageAlt: 'RightFlow document review product interface',
      href: 'https://right-flow.com',
      external: true,
      surface: '#e7d5b4',
    },
  ];
}

function getExperience(isHebrew: boolean) {
  return isHebrew
    ? [
        ['2025 / NOW', 'CartShift Studio', 'Founder & Senior Full-Stack Engineer'],
        ['2021 / 2025', 'Curalife', 'Full Stack Developer & R&D Lead'],
        ['2019 / 2021', 'ParagonEX', 'Software & Integration Developer'],
        ['2011 / 2019', 'ניסיון מוקדם', 'אינטגרציות, מוצר ו-e-commerce'],
      ] as const
    : [
        ['2025 / NOW', 'CartShift Studio', 'Founder & Senior Full-Stack Engineer'],
        ['2021 / 2025', 'Curalife', 'Full Stack Developer & R&D Lead'],
        ['2019 / 2021', 'ParagonEX', 'Software & Integration Developer'],
        ['2011 / 2019', 'Earlier engineering', 'Integration, product & e-commerce'],
      ] as const;
}

function resolveHref(project: Project, locale: string) {
  if (!project.href) return null;
  return project.external ? project.href : `/${locale}${project.href}`;
}

function MagneticLink({ href, children }: { href: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <motion.a
      href={href}
      onMouseMove={event => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setOffset({
          x: (event.clientX - rect.left - rect.width / 2) * 0.17,
          y: (event.clientY - rect.top - rect.height / 2) * 0.17,
        });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.4 }}
      className="inline-flex items-center justify-center"
    >
      {children}
    </motion.a>
  );
}

function MobileMenu({
  open,
  onClose,
  cvHref,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  cvHref: string;
  copy: PortfolioCopy;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  const links = [
    [copy.nav.work, '#work'],
    [copy.nav.about, '#about'],
    [copy.nav.experience, '#experience'],
    [copy.nav.cv, cvHref],
    [copy.nav.contact, '#contact'],
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id="portfolio-mobile-menu"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.mobileNavLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-[#1c1d20] text-[#f2f0eb] sm:hidden"
        >
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.55, ease }}
            className="flex h-full flex-col px-5 pb-7 pt-5"
          >
            <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.17em] text-white/55">
              <span>{copy.portfolioLabel}</span>
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-full bg-[#6157d8] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={copy.closeMenu}
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="mt-auto border-t border-white/15" aria-label={copy.mobileNavLabel}>
              {links.map(([label, href], index) => (
                <motion.a
                  key={label}
                  href={href}
                  onClick={onClose}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.045, duration: 0.42, ease }}
                  className="flex items-center justify-between border-b border-white/15 py-4 text-[12.5vw] font-medium leading-[0.9] tracking-[-0.06em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  <span>{label}</span>
                  <span className="text-[9px] font-semibold tracking-[0.18em] text-white/45">0{index + 1}</span>
                </motion.a>
              ))}
            </nav>

            <div className="mt-7 flex items-end justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-white/50">
              <span>{copy.location}</span>
              <span className="text-end">{copy.role}<br />{copy.availability}</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EnsemblisPreview({ compact, copy }: { compact: boolean; copy: PortfolioCopy }) {
  return (
    <div className="relative h-full overflow-hidden bg-[#151515] text-[#f1efea]">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#a99af0_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
        <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-[9px]">
          <span>Ensemblis / Artist OS</span>
          <span>{copy.buildingNow}</span>
        </div>
        <div>
          <p className={`${compact ? 'text-[10vw]' : 'text-5xl'} max-w-[7ch] font-medium leading-[0.82] tracking-[-0.065em] sm:text-6xl`}>
            {copy.ensemblisLine}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectPreview({ project, compact = false, copy }: { project: Project; compact?: boolean; copy: PortfolioCopy }) {
  if (!project.image) return <EnsemblisPreview compact={compact} copy={copy} />;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: project.surface }}>
      <Image
        src={project.image}
        alt={project.imageAlt ?? project.title}
        fill
        sizes={compact ? '100vw' : '560px'}
        className="object-contain object-center p-4 sm:p-7"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/50 via-black/10 to-transparent p-4 pt-16 text-[8px] font-semibold uppercase tracking-[0.17em] text-white sm:p-5 sm:text-[9px]">
        <span>{project.descriptor}</span>
        <span>{project.number}</span>
      </div>
    </div>
  );
}

function WorkIndex({ locale, projects, copy }: { locale: string; projects: readonly Project[]; copy: PortfolioCopy }) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 24, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 180, damping: 24, mass: 0.5 });

  return (
    <div
      ref={sectionRef}
      className="relative"
      onMouseMove={event => {
        if (reduceMotion || !sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        x.set(event.clientX - rect.left + 40);
        y.set(event.clientY - rect.top + 8);
      }}
      onMouseLeave={() => setActiveIndex(null)}
    >
      <div className="border-t border-black/20">
        {projects.map((project, index) => {
          const href = resolveHref(project, locale);
          const row = (
            <motion.div onMouseEnter={() => setActiveIndex(index)} className="group border-b border-black/20 py-5 sm:py-7 lg:py-8">
              <div className="grid items-start gap-3 sm:grid-cols-[0.1fr_0.72fr_0.48fr_0.1fr] sm:gap-6">
                <p className="hidden pt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 sm:block">{project.number}</p>
                <div>
                  <motion.h3
                    whileHover={reduceMotion ? undefined : { x: locale === 'he' ? -12 : 12 }}
                    transition={{ duration: 0.35, ease }}
                    className="text-[15vw] font-medium leading-[0.78] tracking-[-0.072em] sm:text-[7.5vw] lg:text-[6.4vw] xl:text-[6.7rem]"
                    dir="ltr"
                  >
                    {project.title}
                  </motion.h3>
                  <div className="mt-3 flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.15em] text-black/55 sm:hidden">
                    <span>{project.descriptor}</span>
                    <span>{project.year}</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-semibold uppercase leading-5 tracking-[0.16em] text-black/60 lg:text-[11px]">{project.services}</p>
                  <p className="mt-2 text-[11px] leading-5 text-black/55">{project.description}</p>
                  <p className="mt-3 text-[11px] leading-5 text-black/70"><span className="font-semibold uppercase tracking-[0.1em]">{copy.impact}:</span> {project.impact}</p>
                </div>
                <div className="hidden items-center justify-end gap-3 pt-2 sm:flex">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/55">{project.year}</span>
                  {href ? <ArrowUpRight className="size-4 text-black/45 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" /> : null}
                </div>
              </div>

              <div className="mt-5 overflow-hidden sm:hidden">
                <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: project.surface }}>
                  <ProjectPreview project={project} compact copy={copy} />
                </div>
                <p className="mt-4 max-w-xl text-[13px] leading-5 text-black/65">{project.description}</p>
                <p className="mt-2 max-w-xl text-[12px] leading-5 text-black/75"><span className="font-semibold">{copy.impact}:</span> {project.impact}</p>
              </div>
            </motion.div>
          );

          if (!href) return <div key={project.title}>{row}</div>;

          return (
            <a
              key={project.title}
              href={href}
              target={project.external ? '_blank' : undefined}
              rel={project.external ? 'noreferrer' : undefined}
              aria-label={`${project.title}${project.external ? ` (${copy.externalLabel})` : ''}`}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6157d8]"
            >
              {row}
            </a>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeIndex !== null ? (
          <motion.div
            key={projects[activeIndex].title}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: activeIndex % 2 === 0 ? -1.5 : 1.5 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease }}
            style={{ x: springX, y: springY }}
            className="pointer-events-none absolute left-0 top-0 z-30 hidden lg:block"
          >
            <div
              className="h-[20rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden shadow-[0_32px_90px_rgba(0,0,0,0.24)] xl:h-[22rem] xl:w-[35rem]"
              style={{ backgroundColor: projects[activeIndex].surface }}
            >
              <ProjectPreview project={projects[activeIndex]} copy={copy} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function PortfolioV2({ locale }: { locale: string }) {
  const isHebrew = locale === 'he';
  const copy = getCopy(isHebrew);
  const projects = getProjects(isHebrew);
  const experience = getExperience(isHebrew);
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const cvHref = `/${locale}/cv`;
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.35]);

  return (
    <main className="overflow-x-clip bg-[#e9e8e3] text-[#1c1d20] selection:bg-[#6157d8] selection:text-white" dir={isHebrew ? 'rtl' : 'ltr'}>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} cvHref={cvHref} copy={copy} />

      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 text-[#f1efea] sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1760px] items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px]" aria-label={copy.mobileNavLabel}>
          <a href="#top" className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="text-white/55">©</span>
            <span className="transition-opacity group-hover:opacity-60">Code by Yotam</span>
          </a>

          <div className="hidden items-center gap-8 sm:flex lg:gap-11">
            <a href="#work" className="transition-opacity hover:opacity-55">{copy.nav.work}</a>
            <a href="#about" className="transition-opacity hover:opacity-55">{copy.nav.about}</a>
            <a href={cvHref} className="transition-opacity hover:opacity-55">{copy.nav.cv}</a>
            <a href="#contact" className="transition-opacity hover:opacity-55">{copy.nav.contact}</a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 items-center justify-center rounded-full bg-[#6157d8] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden"
            aria-label={copy.openMenu}
            aria-expanded={menuOpen}
            aria-controls="portfolio-mobile-menu"
          >
            <Menu className="size-4" />
          </button>
        </nav>
      </header>

      <section id="top" className="relative min-h-[100svh] overflow-hidden bg-[#1c1d20] px-5 pb-6 pt-24 text-[#f1efea] sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1760px] flex-col">
          <div className="flex items-start justify-between text-[8px] font-semibold uppercase tracking-[0.17em] text-white/60 sm:text-[10px]">
            <div className="flex items-center gap-2"><MapPin className="size-3" />{copy.location}</div>
            <div className="text-end leading-4 sm:leading-5">{copy.role}<br />Full-stack / AI / Commerce</div>
          </div>

          <motion.div style={reduceMotion ? undefined : { y: heroY, opacity: heroOpacity }} className="mt-auto pb-10 pt-20 sm:pb-14 lg:pb-16">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease }}
              className="mb-5 max-w-[22rem] text-[12px] leading-5 text-white/65 sm:mb-7 sm:text-sm sm:leading-6"
            >
              {copy.heroIntro}
            </motion.p>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 70 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.05, delay: 0.04, ease }}
              className="portfolio-name text-[19.5vw] font-medium uppercase leading-[0.72] tracking-[-0.085em] sm:text-[14.4vw] lg:text-[12.2vw] xl:text-[11.6rem]"
              dir="ltr"
            >
              <span className="block">Yotam</span>
              <span className="block sm:ms-[13vw]">Faraggi<span className="text-[#776be6]">.</span></span>
            </motion.h1>
          </motion.div>

          <div className="flex items-end justify-between border-t border-white/15 pt-4 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/60 sm:text-[10px]">
            <span className="max-w-[19rem]">{copy.heroPromise}</span>
            <a href="#work" className="flex items-center gap-2 text-white/85">{copy.scroll} <ArrowDown className="size-3.5" /></a>
          </div>
        </div>
      </section>

      <section id="work" className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1760px]">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.85, ease }} className="mb-16 grid gap-8 sm:mb-24 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">{copy.recentWork}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-black/50">{copy.workRange}</p>
            </div>
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[10ch] text-[15vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.8vw] xl:text-[7.7rem]">{copy.workTitle}</h2>
              <p className="max-w-sm text-[13px] leading-5 text-black/65 sm:text-sm sm:leading-6 lg:pb-2">{copy.workIntro}</p>
            </div>
          </motion.div>

          <WorkIndex locale={locale} projects={projects} copy={copy} />

          <div className="mt-12 flex justify-end sm:mt-16">
            <MagneticLink href={cvHref}>
              <span className="flex size-32 items-center justify-center whitespace-pre-line rounded-full bg-[#6157d8] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-white sm:size-40 sm:text-[11px]">
                {copy.fullCareer}
              </span>
            </MagneticLink>
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden bg-[#1c1d20] px-5 py-24 text-[#f1efea] sm:px-8 sm:py-32 lg:px-12 lg:py-44">
        <div className="relative mx-auto max-w-[1760px]">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.85, ease }} className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-[10px]">{copy.aboutLabel}</p>
            <div>
              <h2 className="max-w-[10ch] text-[15vw] font-medium leading-[0.8] tracking-[-0.075em] sm:text-[9vw] lg:text-[7.6vw] xl:text-[7.7rem]">{copy.aboutTitle}</h2>
              <p className="mt-10 max-w-2xl text-xl leading-[1.2] tracking-[-0.03em] text-white/70 sm:text-2xl lg:ms-[30%] lg:text-3xl">{copy.aboutIntro}</p>
            </div>
          </motion.div>

          <div className="mt-24 border-t border-white/15 lg:ms-[22%] lg:mt-36">
            {copy.principles.map(([title, text], index) => (
              <motion.div
                key={title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.05, ease }}
                className="group grid gap-4 border-b border-white/15 py-7 sm:grid-cols-[0.12fr_0.45fr_0.8fr_auto] sm:items-center sm:gap-7 sm:py-9"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">0{index + 1}</p>
                <h3 className="text-[11vw] font-medium leading-none tracking-[-0.06em] sm:text-5xl">{title}</h3>
                <p className="max-w-xl text-[13px] leading-5 text-white/65 sm:text-base sm:leading-7">{text}</p>
                <ArrowUpRight className="hidden size-5 text-white/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white/70 sm:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1760px]">
          <div className="grid gap-12 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/60 sm:text-[10px]">{copy.experience}</p>
              <p className="mt-3 max-w-[16rem] text-[13px] leading-5 text-black/65">{copy.experienceIntro}</p>
            </div>

            <div className="border-t border-black/20">
              {experience.map((item, index) => (
                <motion.div
                  key={item[0]}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.035, ease }}
                  className="grid gap-3 border-b border-black/20 py-6 sm:grid-cols-[0.22fr_0.58fr_0.75fr] sm:items-center sm:gap-7 sm:py-8"
                >
                  <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/55 sm:text-[10px]">{item[0]}</p>
                  <h3 className="text-[8vw] font-medium leading-none tracking-[-0.055em] sm:text-3xl lg:text-4xl" dir="ltr">{item[1]}</h3>
                  <p className="text-[12px] leading-5 text-black/65 sm:text-sm sm:leading-6">{item[2]}</p>
                </motion.div>
              ))}

              <div className="flex flex-col gap-4 pt-7 text-[12px] leading-5 text-black/65 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <span>{copy.fullHistory}</span>
                <a href={cvHref} className="inline-flex w-fit items-center gap-2 border-b border-black/40 pb-1 font-medium text-black">{copy.viewCv} <ArrowUpRight className="size-3.5" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative overflow-hidden bg-[#6157d8] px-5 pb-7 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 lg:pt-40">
        <div className="mx-auto max-w-[1760px]">
          <div className="grid gap-8 lg:grid-cols-[0.22fr_0.78fr] lg:gap-12">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-[10px]">{copy.contactEyebrow}</p>
            <div>
              <h2 className="max-w-[10ch] text-[16vw] font-medium leading-[0.78] tracking-[-0.08em] sm:text-[10vw] lg:text-[8vw] xl:text-[8rem]">{copy.contactTitle}</h2>
              <div className="mt-12 flex flex-col gap-10 border-t border-white/25 pt-8 sm:flex-row sm:items-end sm:justify-between">
                <MagneticLink href="mailto:yotamon@gmail.com">
                  <span className="flex size-32 items-center justify-center whitespace-pre-line rounded-full bg-[#1c1d20] text-center text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-white sm:size-40 sm:text-[11px]">{copy.getInTouch}</span>
                </MagneticLink>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[9px] font-semibold uppercase tracking-[0.16em] sm:flex sm:flex-wrap sm:justify-end sm:text-[10px]">
                  <a href="mailto:yotamon@gmail.com" className="border-b border-white/50 pb-1">Email</a>
                  <a href="https://linkedin.com/in/yotam-faraggi" target="_blank" rel="noreferrer" className="border-b border-white/50 pb-1">LinkedIn</a>
                  <a href="https://github.com/yotamon" target="_blank" rel="noreferrer" className="border-b border-white/50 pb-1">GitHub</a>
                  <a href={cvHref} className="border-b border-white/50 pb-1">{copy.nav.cv}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 flex items-center justify-between border-t border-white/25 pt-5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:mt-32 sm:text-[10px]">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top">{copy.backToTop}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
