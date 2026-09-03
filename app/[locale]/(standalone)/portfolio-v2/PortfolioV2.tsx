'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Circle, MapPin, Menu, X } from 'lucide-react';

type Project = {
  number: string;
  title: string;
  headline: string;
  description: string;
  tags: readonly string[];
  href: string | null;
  external: boolean;
  note: string;
  surface: string;
  ink: string;
  image?: string;
  imageAlt?: string;
  secondaryImage?: string;
};

const work: readonly Project[] = [
  {
    number: '01',
    title: 'Curalife',
    headline: 'Commerce meets\ndigital health.',
    description:
      'Owned major customer-facing product and platform work across Shopify commerce and digital health, including a HIPAA-compliant telemedicine acquisition product built end-to-end.',
    tags: ['Product ownership', 'Shopify', 'Healthcare', 'Full-stack'],
    image: '/images/case-studies/curalife-metabolic-wellness-platform/hero.jpg',
    secondaryImage: '/images/case-studies/curalife-metabolic-wellness-platform/gallery-01.jpg',
    imageAlt: 'Curalife digital health and commerce experience',
    href: '/en/work/curalife-metabolic-wellness-platform',
    external: false,
    note: 'Primary acquisition + revenue funnel',
    surface: '#d6ebdd',
    ink: '#102119',
  },
  {
    number: '02',
    title: 'StarLinker',
    headline: 'AI that acts\ninside the product.',
    description:
      'A visual planning product for mapping goals, tasks, habits, and notes on a connected canvas with AI-assisted next-step suggestions and product actions.',
    tags: ['AI-native UX', 'Productivity', 'Next.js', 'Full-stack'],
    image: '/images/cv/portfolio/starlinker-en-light.png',
    imageAlt: 'StarLinker visual planning product interface',
    href: 'https://starlinker.io',
    external: true,
    note: 'Founder-led product',
    surface: '#cfd4ff',
    ink: '#171b43',
  },
  {
    number: '03',
    title: 'Ensemblis',
    headline: 'An operating system\nfor music artists.',
    description:
      'An AI-assisted artist management platform for releases, content creation, media intelligence, marketing workflows, and distribution operations. Currently in development.',
    tags: ['AI workflows', 'Music tech', 'Product design', 'In development'],
    href: null,
    external: false,
    note: 'Building now',
    surface: '#ddd3ff',
    ink: '#21163d',
  },
  {
    number: '04',
    title: 'RightFlow',
    headline: 'Complex documents.\nClear decisions.',
    description:
      'A document review and verification platform for pension and payroll contribution checks, with structured review flows and report export.',
    tags: ['Document workflows', 'Financial data', 'Automation', 'Full-stack'],
    image: '/images/cv/portfolio/rightflow-en-light.png',
    imageAlt: 'RightFlow document review product interface',
    href: 'https://right-flow.com',
    external: true,
    note: 'Founder-led product',
    surface: '#ead9ba',
    ink: '#362716',
  },
];

const experience = [
  {
    years: '2025 / NOW',
    company: 'CartShift Studio',
    role: 'Founder & Senior Full-Stack Engineer',
    detail: 'Independent product engineering, e-commerce, integrations, and AI-assisted software.',
  },
  {
    years: '2021 / 2025',
    company: 'Curalife',
    role: 'Full Stack Developer & R&D Lead',
    detail: 'Commerce, digital health, acquisition products, cloud infrastructure, and integrations.',
  },
  {
    years: '2019 / 2021',
    company: 'ParagonEX',
    role: 'Software & Integration Developer',
    detail: 'Fintech integrations and high-traffic production web systems.',
  },
  {
    years: '2011 / 2019',
    company: 'Earlier engineering',
    role: 'Integration, product & e-commerce',
    detail: 'HOT, Leumi Bank, Elbit Systems, Mamram, independent products, and client work.',
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 38 },
  visible: { opacity: 1, y: 0 },
};

function BrowserFrame({
  src,
  alt,
  className = '',
  imageClassName = 'object-contain object-top',
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1rem] border border-black/15 bg-[#f8f7f2] shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[1.45rem] sm:shadow-[0_42px_100px_rgba(0,0,0,0.2)] ${className}`}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-black/10 bg-white/80 px-3 backdrop-blur sm:h-11 sm:px-5">
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="size-1.5 rounded-full bg-black/20 sm:size-2" />
        <span className="ms-2 h-2 w-16 rounded-full bg-black/[0.055] sm:ms-3 sm:h-2.5 sm:w-36" />
      </div>
      <div className="relative aspect-[16/9] overflow-hidden bg-white">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 92vw, 72vw" className={imageClassName} />
      </div>
    </div>
  );
}

function MobileMenu({ open, onClose, cvHref }: { open: boolean; onClose: () => void; cvHref: string }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[80] bg-[#171717] text-[#f2f0e9] sm:hidden"
        >
          <div className="flex h-full flex-col px-5 pb-7 pt-5">
            <div className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/25 text-[10px] font-semibold uppercase tracking-[0.14em]">YF</span>
              <button
                type="button"
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-full border border-white/20"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="mt-auto border-t border-white/15" aria-label="Mobile portfolio navigation">
              {[
                ['Work', '#work'],
                ['Approach', '#about'],
                ['CV', cvHref],
                ['Contact', '#contact'],
              ].map(([label, href], index) => (
                <motion.a
                  key={label}
                  href={href}
                  onClick={onClose}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.35, ease }}
                  className="flex items-center justify-between border-b border-white/15 py-5 text-[13vw] font-medium uppercase leading-none tracking-[-0.065em]"
                >
                  <span>{label}</span>
                  <span className="text-xs tracking-normal text-white/35">0{index + 1}</span>
                </motion.a>
              ))}
            </nav>

            <div className="mt-7 flex items-end justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <span>Berlin, Germany</span>
              <span className="text-end">Senior Product Engineer<br />2026</span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EnsemblisVisual() {
  return (
    <div className="relative min-h-[34rem] overflow-hidden px-4 pb-5 pt-20 sm:min-h-[42rem] sm:p-8 sm:pt-24 lg:min-h-[49rem] lg:p-12 lg:pt-28">
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(#21163d_1px,transparent_1px)] [background-size:18px_18px] sm:[background-size:22px_22px]" />
      <div className="absolute -end-24 -top-24 size-80 rounded-full border border-[#21163d]/10 sm:size-[30rem]" />
      <div className="absolute -end-10 -top-14 size-60 rounded-full border border-[#21163d]/10 sm:size-[23rem]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[1.2rem] border border-black/20 bg-[#131313] text-white shadow-[0_35px_90px_rgba(38,20,78,0.38)] sm:rounded-[2rem] sm:shadow-[0_55px_120px_rgba(38,20,78,0.35)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:px-7 sm:py-4 sm:text-[10px]">
            <span>Ensemblis / Artist OS</span>
            <span className="rounded-full border border-white/15 bg-white/[0.035] px-2.5 py-1 text-white/75 sm:px-3 sm:py-1.5">Atlas Irwin</span>
          </div>

          <div className="bg-[#131313] p-5 sm:p-7 lg:grid lg:grid-cols-[0.82fr_1.18fr] lg:gap-px lg:bg-white/10 lg:p-0">
            <div className="lg:bg-[#131313] lg:p-9">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#b8a9ff] sm:text-[10px]">
                <span className="size-1.5 rounded-full bg-[#b8a9ff]" />
                Next release
              </div>
              <h3 className="mt-6 max-w-[8ch] text-[12vw] font-medium leading-[0.87] tracking-[-0.06em] sm:mt-8 sm:text-6xl">
                Dancing in Color
              </h3>
              <p className="mt-4 max-w-sm text-xs leading-5 text-white/45 sm:mt-5 sm:text-base sm:leading-7">
                Release intelligence, assets, campaign planning, distribution, and content in one connected workspace.
              </p>
              <div className="mt-7 space-y-2 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[0.15em] text-white/42 sm:mt-10 sm:pt-5 sm:text-[10px]">
                {['Lyrics analyzed', 'Stems indexed', 'Campaign draft', 'Metadata 92%'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                    <span>{item}</span>
                    <span className="text-white/20">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 bg-[#1b1b1b] p-2 lg:mt-0 lg:p-7">
              {[
                ['Content', '14', 'ideas'],
                ['Distribution', 'Ready', 'validated'],
                ['Audience', '+18%', '30 days'],
                ['Media', '32', 'assets'],
              ].map(([label, value, helper], index) => (
                <div key={label} className="flex min-h-28 flex-col justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:min-h-48 sm:rounded-[1.25rem] sm:p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-[7px] uppercase tracking-[0.16em] text-white/38 sm:text-[10px]">{label}</p>
                    <p className="text-[7px] text-white/18 sm:text-[9px]">0{index + 1}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-[-0.055em] sm:text-4xl">{value}</p>
                    <p className="mt-1 text-[9px] text-white/30 sm:mt-2 sm:text-xs">{helper}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneDetail({ project }: { project: Project }) {
  if (project.title === 'StarLinker') {
    return (
      <div className="absolute bottom-5 start-5 z-20 w-[62%] max-w-xs rounded-2xl border border-black/10 bg-[#f5f2eb]/90 p-4 shadow-xl backdrop-blur-md sm:bottom-9 sm:start-9 sm:w-72 sm:p-5">
        <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.16em] text-black/40 sm:text-[9px]">
          <span>Cosmo / AI agent</span><span>Live action</span>
        </div>
        <p className="mt-4 text-sm leading-5 tracking-[-0.02em] sm:text-base">Move tomorrow&apos;s workout to Friday.</p>
        <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-black/45">
          <span className="size-1.5 rounded-full bg-[#6157c8]" />
          Done. Calendar updated.
        </div>
      </div>
    );
  }

  if (project.title === 'RightFlow') {
    return (
      <div className="absolute bottom-5 start-5 z-20 rounded-2xl border border-black/10 bg-[#f7f1e4]/92 p-4 shadow-xl backdrop-blur-md sm:bottom-9 sm:start-9 sm:p-5">
        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/40 sm:text-[9px]">Review engine</p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-medium tracking-[-0.06em] sm:text-4xl">47</span>
          <span className="text-[9px] uppercase tracking-[0.14em] text-black/40">checks resolved</span>
        </div>
      </div>
    );
  }

  return null;
}

function ProjectVisual({ project }: { project: Project }) {
  const reduceMotion = useReducedMotion();

  const visual = (
    <motion.div
      className="group relative -mx-5 overflow-hidden rounded-none sm:mx-0 sm:rounded-[2.75rem]"
      style={{ backgroundColor: project.surface, color: project.ink }}
      whileHover={reduceMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.6, ease }}
    >
      <div className="absolute start-5 top-5 z-30 flex max-w-[72%] items-center gap-2 rounded-full border border-black/10 bg-white/65 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md sm:start-7 sm:top-7 sm:max-w-none sm:px-4 sm:text-[10px]">
        <Circle className="size-2 shrink-0 fill-current" aria-hidden="true" />
        <span className="truncate">{project.note}</span>
      </div>

      {project.title === 'Ensemblis' ? (
        <EnsemblisVisual />
      ) : project.title === 'Curalife' && project.image && project.secondaryImage ? (
        <div className="relative min-h-[35rem] overflow-hidden px-3 pb-8 pt-20 sm:min-h-[46rem] sm:p-10 sm:pt-24 lg:min-h-[55rem] lg:p-16 lg:pt-28">
          <div className="absolute -end-12 bottom-0 text-[46vw] font-semibold leading-none tracking-[-0.1em] opacity-[0.045] sm:text-[18vw] lg:text-[14rem]">01</div>
          <BrowserFrame
            src={project.image}
            alt={project.imageAlt ?? project.title}
            imageClassName="object-contain object-top"
            className="relative z-10 mx-auto w-[106%] -translate-x-[3%] rotate-[-1.6deg] sm:w-[86%] sm:translate-x-0 lg:w-[76%]"
          />
          <BrowserFrame
            src={project.secondaryImage}
            alt="Curalife secondary product view"
            imageClassName="object-cover object-top"
            className="absolute bottom-10 end-[-5%] z-20 w-[62%] rotate-[3deg] sm:bottom-10 sm:end-10 sm:w-[38%]"
          />
          <div className="absolute bottom-6 start-5 z-20 max-w-[11rem] text-[9px] font-semibold uppercase leading-4 tracking-[0.15em] text-black/45 sm:bottom-10 sm:start-10 sm:max-w-xs sm:text-[10px]">
            Qualification, eligibility, purchase, and care flow in one acquisition product.
          </div>
        </div>
      ) : project.image ? (
        <div className="relative min-h-[33rem] overflow-hidden px-3 pb-8 pt-20 sm:min-h-[44rem] sm:p-10 sm:pt-24 lg:min-h-[52rem] lg:p-16 lg:pt-28">
          <div className="absolute -end-10 bottom-0 text-[46vw] font-semibold leading-none tracking-[-0.1em] opacity-[0.045] sm:text-[18vw] lg:text-[14rem]">{project.number}</div>
          <BrowserFrame
            src={project.image}
            alt={project.imageAlt ?? project.title}
            imageClassName="object-contain object-top"
            className="relative z-10 mx-auto w-[106%] -translate-x-[3%] rotate-[1deg] transition-transform duration-700 ease-out group-hover:rotate-0 group-hover:scale-[1.01] sm:w-[88%] sm:translate-x-0 lg:w-[80%]"
          />
          <SceneDetail project={project} />
        </div>
      ) : null}

      {project.href ? (
        <div className="absolute bottom-5 end-5 z-40 flex size-12 items-center justify-center rounded-full bg-[#171717] text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:bottom-8 sm:end-8 sm:size-16">
          <ArrowUpRight className="size-5 sm:size-6" aria-hidden="true" />
        </div>
      ) : null}
    </motion.div>
  );

  if (!project.href) return visual;

  return (
    <a
      href={project.href}
      target={project.external ? '_blank' : undefined}
      rel={project.external ? 'noreferrer' : undefined}
      aria-label={`${project.title}${project.external ? ' (opens in a new tab)' : ''}`}
    >
      {visual}
    </a>
  );
}

function ProjectSection({ project, index }: { project: Project; index: number }) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const numberY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const visualY = useTransform(scrollYProgress, [0, 0.35, 1], [55, 0, -25]);
  const visualScale = useTransform(scrollYProgress, [0, 0.28, 0.8, 1], [0.96, 1, 1, 0.985]);

  return (
    <motion.article
      ref={sectionRef}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      transition={{ duration: 0.85, delay: reduceMotion ? 0 : index * 0.02, ease }}
      className="relative"
    >
      <div className="grid gap-7 lg:grid-cols-[0.24fr_0.96fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between border-t border-black/20 pt-4 lg:block lg:border-t-0 lg:pt-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:text-[11px]">{project.number} / {project.title}</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-black/30 lg:mt-3">Selected work</p>
          </div>
          <motion.div
            aria-hidden="true"
            style={{ y: reduceMotion ? 0 : numberY }}
            className="pointer-events-none mt-14 hidden text-[8rem] font-semibold leading-none tracking-[-0.09em] text-black/[0.05] lg:block xl:text-[10rem]"
          >
            {project.number}
          </motion.div>
        </div>

        <div>
          <div className="mb-7 lg:mb-10 xl:grid xl:grid-cols-[1.08fr_0.62fr] xl:items-end xl:gap-14">
            <h3 className="whitespace-pre-line text-[15vw] font-medium leading-[0.83] tracking-[-0.07em] sm:text-[10vw] lg:text-[6.5vw] xl:text-[6.4rem]">
              {project.headline}
            </h3>
            <div className="mt-6 border-t border-black/15 pt-5 xl:mt-0 xl:border-t-0 xl:pt-0">
              <p className="max-w-xl text-[14px] leading-6 text-black/56 sm:text-base sm:leading-7">{project.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[8px] font-semibold uppercase tracking-[0.15em] text-black/40 sm:text-[10px]">
                {project.tags.map(tag => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          </div>

          <motion.div style={reduceMotion ? undefined : { y: visualY, scale: visualScale }}>
            <ProjectVisual project={project} />
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

function Marquee() {
  const reduceMotion = useReducedMotion();
  const items = 'PRODUCT ENGINEERING  •  SYSTEMS  •  AI  •  COMMERCE  •  FULL-STACK  •  SHIPPING  •  ';

  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#171717] py-4 text-[#f2f0e9] sm:py-5">
      <motion.div
        className="flex w-max whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
        animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={reduceMotion ? undefined : { duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        <span>{items.repeat(4)}</span>
        <span aria-hidden="true">{items.repeat(4)}</span>
      </motion.div>
    </div>
  );
}

export default function PortfolioV2({ locale }: { locale: string }) {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const cvHref = `/${locale}/cv`;
  const { scrollYProgress } = useScroll();
  const heroDrift = useTransform(scrollYProgress, [0, 0.2], [0, -72]);
  const heroFade = useTransform(scrollYProgress, [0, 0.16], [1, 0.72]);

  return (
    <main className="scroll-smooth overflow-x-clip bg-[#d9d6ce] text-[#171717] selection:bg-[#171717] selection:text-white" dir="ltr">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} cvHref={cvHref} />

      <header className="absolute inset-x-0 top-0 z-50 px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <nav className="mx-auto flex max-w-[1720px] items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]" aria-label="Portfolio navigation">
          <a href="#top" className="group flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-black/25 transition-colors group-hover:bg-black group-hover:text-white">YF</span>
            <span className="hidden sm:inline">Portfolio / 2026</span>
          </a>

          <div className="hidden items-center gap-8 sm:flex lg:gap-10">
            <a href="#work" className="border-b border-transparent pb-1 transition-colors hover:border-black/40">Work</a>
            <a href="#about" className="border-b border-transparent pb-1 transition-colors hover:border-black/40">Approach</a>
            <a href={cvHref} className="border-b border-transparent pb-1 transition-colors hover:border-black/40">CV</a>
            <a href="#contact" className="rounded-full bg-[#171717] px-5 py-2 text-white transition-transform hover:-translate-y-0.5">Contact</a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-10 items-center justify-center rounded-full border border-black/25 sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
        </nav>
      </header>

      <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-5 pt-24 sm:px-8 sm:pb-8 sm:pt-28 lg:px-12 lg:pb-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:25%_100%] sm:[background-size:12.5%_100%]" />
        <div className="pointer-events-none absolute -end-[42vw] top-[12vh] size-[105vw] rounded-full border border-black/[0.06] sm:-end-[12vw] sm:top-[8vh] sm:size-[48vw]" />
        <div className="pointer-events-none absolute -end-[26vw] top-[18vh] size-[72vw] rounded-full border border-black/[0.06] sm:-end-[7vw] sm:top-[13vh] sm:size-[38vw]" />

        <div className="relative mx-auto flex w-full max-w-[1720px] items-start justify-between gap-5 text-[8px] font-semibold uppercase tracking-[0.17em] text-black/48 sm:text-[10px]">
          <div className="flex items-center gap-2"><MapPin className="size-3" aria-hidden="true" />Berlin, Germany</div>
          <div className="text-end leading-4 sm:leading-5">Senior Product Engineer<br />Full-stack / AI / Commerce</div>
        </div>

        <motion.div
          style={reduceMotion ? undefined : { y: heroDrift, opacity: heroFade }}
          initial={reduceMotion ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.06, ease }}
          className="relative mx-auto flex w-full max-w-[1720px] flex-1 flex-col justify-center py-10 sm:py-16"
        >
          <div className="mb-4 flex items-end justify-between sm:mb-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/36 sm:text-[11px]">Yotam Faraggi</p>
            <p className="hidden max-w-[24ch] text-end text-xs leading-5 text-black/42 md:block">Product thinking, engineering depth, end-to-end ownership.</p>
          </div>

          <h1 className="relative text-[22vw] font-medium uppercase leading-[0.72] tracking-[-0.09em] sm:text-[16.5vw] lg:text-[13.5vw] xl:text-[12.7rem]">
            <span className="block">I build</span>
            <span className="relative ms-[10vw] block sm:ms-[11vw]">
              products<span className="text-[#7669df]">.</span>
              <span className="absolute -end-[12vw] top-[48%] h-px w-[26vw] bg-black/20 sm:-end-2 sm:w-[18vw]" />
            </span>
          </h1>

          <div className="mt-8 grid gap-5 border-t border-black/20 pt-5 sm:mt-12 sm:grid-cols-[0.5fr_0.98fr_0.48fr] sm:gap-8 sm:pt-7">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-black/38 sm:block">10+ years / production software</p>
            <p className="max-w-2xl text-[1.4rem] leading-[1.08] tracking-[-0.045em] sm:text-2xl sm:leading-[1.18] lg:text-3xl xl:text-[2rem]">
              From ambiguous ideas to production software people actually use.
            </p>
            <p className="max-w-[29rem] text-[12px] leading-5 text-black/48 sm:max-w-xs sm:justify-self-end sm:text-sm sm:leading-6">
              Product, frontend, backend, architecture and integrations. I prefer owning the problem instead of handing it off between disciplines.
            </p>
          </div>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-[1720px] items-end justify-between border-t border-black/20 pt-4 text-[8px] font-semibold uppercase tracking-[0.16em] sm:text-[10px]">
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#2f7d49]" />Available for the right team</span>
          <a href="#work" className="flex items-center gap-2">Work <ArrowDown className="size-3.5" aria-hidden="true" /></a>
        </div>
      </section>

      <Marquee />

      <section id="work" className="bg-[#f2f0e9] px-5 py-20 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1720px]">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease }}
            className="mb-24 grid gap-9 border-b border-black/20 pb-10 sm:mb-32 lg:grid-cols-[0.24fr_0.96fr] lg:gap-14 lg:pb-16"
          >
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/42 sm:text-[11px]">Selected work</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-black/28 sm:mt-3 sm:text-[10px]">2021 / 2026</p>
            </div>
            <div className="grid gap-7 xl:grid-cols-[1fr_0.5fr] xl:items-end">
              <h2 className="max-w-[9.5ch] text-[14vw] font-medium leading-[0.85] tracking-[-0.07em] sm:text-7xl sm:leading-[0.9] lg:text-8xl xl:text-[7rem]">
                Different products. Same instinct to own the hard part.
              </h2>
              <p className="max-w-md text-[13px] leading-5 text-black/45 sm:text-base sm:leading-7">Digital health, commerce, AI-native software, music technology, and document automation.</p>
            </div>
          </motion.div>

          <div className="space-y-32 sm:space-y-48 lg:space-y-56">
            {work.map((project, index) => <ProjectSection key={project.title} project={project} index={index} />)}
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden bg-[#151515] px-5 py-24 text-[#efede7] sm:px-8 sm:py-32 lg:px-12 lg:py-44">
        <div className="pointer-events-none absolute -end-[18vw] top-10 text-[46vw] font-semibold leading-none tracking-[-0.1em] text-white/[0.025] sm:-end-[10vw] sm:top-16 sm:text-[28vw]">YF</div>
        <div className="mx-auto max-w-[1720px]">
          <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.85, ease }}>
            <div className="grid gap-8 lg:grid-cols-[0.24fr_0.96fr] lg:gap-14">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/32 sm:text-[11px]">Approach / 01</p>
              <div>
                <h2 className="max-w-[9.5ch] text-[16vw] font-medium uppercase leading-[0.75] tracking-[-0.085em] sm:text-[10vw] lg:text-[7.5vw] xl:text-[8.8rem]">I like owning the whole problem.</h2>
                <p className="mt-9 max-w-2xl text-xl leading-[1.18] tracking-[-0.035em] text-white/55 sm:mt-10 sm:text-2xl lg:ms-[34%] lg:text-3xl">
                  Good product engineering is understanding what should exist, how it should work, and what it takes to keep it reliable after launch.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-20 border-t border-white/15 lg:ms-[24%] lg:mt-36">
            {[
              ['01', 'Product', 'Turn unclear requirements into something concrete enough to build, test, and improve.'],
              ['02', 'Engineering', 'Move comfortably across frontend, backend, architecture, integrations, data, and production constraints.'],
              ['03', 'Shipping', 'Care about the point where the architecture diagram becomes reliable software in someone’s hands.'],
            ].map(([number, title, text], index) => (
              <motion.div
                key={title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.06, ease }}
                className="group grid gap-5 border-b border-white/15 py-7 sm:grid-cols-[0.16fr_0.55fr_0.9fr_auto] sm:items-center sm:gap-7 sm:py-9"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 sm:text-[10px]">{number}</p>
                <h3 className="text-4xl font-medium tracking-[-0.055em] sm:text-5xl">{title}</h3>
                <p className="max-w-lg text-sm leading-6 text-white/42 sm:text-base sm:leading-7">{text}</p>
                <ArrowUpRight className="hidden size-5 text-white/15 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white/45 sm:block" aria-hidden="true" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d9d6ce] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1720px]">
          <div className="grid gap-12 lg:grid-cols-[0.24fr_0.96fr] lg:gap-14">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/42 sm:text-[11px]">Experience / selected</p>
              <h2 className="mt-7 max-w-[7ch] text-[16vw] font-medium uppercase leading-[0.78] tracking-[-0.075em] sm:text-8xl lg:text-[6.8rem]">Built over time.</h2>
            </div>

            <div className="border-t border-black/20">
              {experience.map((item, index) => (
                <motion.div
                  key={item.years}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.035, ease }}
                  className="group grid gap-4 border-b border-black/20 py-6 transition-colors sm:grid-cols-[0.28fr_0.72fr_0.9fr] sm:gap-7 sm:px-3 sm:py-9 sm:hover:bg-black/[0.025]"
                >
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-black/40 sm:text-[10px]">{item.years}</p>
                  <div>
                    <h3 className="text-[1.7rem] font-medium leading-none tracking-[-0.045em] sm:text-3xl">{item.company}</h3>
                    <p className="mt-2 text-[11px] text-black/40 sm:text-sm">{item.role}</p>
                  </div>
                  <p className="max-w-xl text-[13px] leading-5 text-black/48 sm:text-base sm:leading-7">{item.detail}</p>
                </motion.div>
              ))}

              <div className="flex flex-col gap-4 pt-7 text-[12px] leading-5 text-black/44 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <span>Full history, technologies, education, and earlier roles live in the CV.</span>
                <a href={cvHref} className="inline-flex w-fit items-center gap-2 border-b border-black/35 pb-1 font-medium text-black">View CV <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative overflow-hidden bg-[#8175e1] px-5 pb-7 pt-24 text-[#171717] sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 lg:pt-44">
        <div className="pointer-events-none absolute -end-40 -top-20 size-[95vw] rounded-full border border-black/10 sm:-end-20 sm:-top-24 sm:size-[42vw]" />
        <div className="pointer-events-none absolute -end-24 -top-6 size-[70vw] rounded-full border border-black/10 sm:-end-10 sm:-top-14 sm:size-[34vw]" />
        <div className="mx-auto max-w-[1720px]">
          <div className="grid gap-8 lg:grid-cols-[0.24fr_0.96fr] lg:gap-14">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]">Berlin / available for the right next team</p>
            <div>
              <h2 className="max-w-[9.5ch] text-[16vw] font-medium uppercase leading-[0.75] tracking-[-0.085em] sm:text-[10vw] lg:text-[7.5vw] xl:text-[8.8rem]">Have a hard product problem?</h2>
              <div className="mt-10 grid gap-8 border-t border-black/20 pt-7 sm:mt-12 lg:grid-cols-[0.65fr_1fr] lg:items-end">
                <p className="max-w-xl text-4xl leading-[0.95] tracking-[-0.055em] sm:text-4xl">I like those.</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[9px] font-semibold uppercase tracking-[0.16em] sm:flex sm:flex-wrap sm:justify-end sm:text-[10px]">
                  <a href="mailto:yotamon@gmail.com" className="group inline-flex items-center gap-2 border-b border-black/35 pb-1">Email <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href="https://linkedin.com/in/yotam-faraggi" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 border-b border-black/35 pb-1">LinkedIn <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href="https://github.com/yotamon" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 border-b border-black/35 pb-1">GitHub <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                  <a href={cvHref} className="group inline-flex items-center gap-2 border-b border-black/35 pb-1">CV <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 flex items-center justify-between border-t border-black/20 pt-5 text-[8px] font-semibold uppercase tracking-[0.16em] sm:mt-32 sm:text-[10px]">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
