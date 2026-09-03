'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';

const work = [
  {
    number: '01',
    title: 'Curalife',
    headline: 'Commerce meets\ndigital health.',
    description:
      'Owned major customer-facing product and platform work across Shopify commerce and digital health, including a HIPAA-compliant telemedicine acquisition product built end-to-end.',
    tags: ['Product ownership', 'Shopify', 'Healthcare', 'Full-stack'],
    image: '/images/case-studies/curalife-metabolic-wellness-platform/hero.jpg',
    imageAlt: 'Curalife digital health and commerce experience',
    href: '/en/work/curalife-metabolic-wellness-platform',
    external: false,
    note: 'Primary acquisition & revenue funnel',
    visualClass: 'bg-[#d8efe0]',
  },
  {
    number: '02',
    title: 'StarLinker',
    headline: 'AI that operates\nthe product.',
    description:
      'A visual planning product for mapping goals, tasks, habits, and notes on a connected canvas with AI-assisted next-step suggestions and product actions.',
    tags: ['AI-native UX', 'Productivity', 'Next.js', 'Full-stack'],
    image: '/images/cv/portfolio/starlinker-en-light.png',
    imageAlt: 'StarLinker visual planning product interface',
    href: 'https://starlinker.io',
    external: true,
    note: 'Founder-led product',
    visualClass: 'bg-[#d9ddff]',
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
    visualClass: 'bg-[#ddd5ff]',
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
    visualClass: 'bg-[#f0dfc3]',
  },
] as const;

const experience = [
  {
    years: '2025 — NOW',
    company: 'CartShift Studio',
    role: 'Founder & Senior Full-Stack Engineer',
    detail: 'Independent product engineering, e-commerce, integrations, and AI-assisted software.',
  },
  {
    years: '2021 — 2025',
    company: 'Curalife',
    role: 'Full Stack Developer & R&D Lead',
    detail: 'Commerce, digital health, acquisition products, cloud infrastructure, and integrations.',
  },
  {
    years: '2019 — 2021',
    company: 'ParagonEX',
    role: 'Software & Integration Developer',
    detail: 'Fintech integrations and high-traffic production web systems.',
  },
  {
    years: '2016 — 2019',
    company: 'Earlier engineering',
    role: 'Integration, product & e-commerce',
    detail: 'HOT, Leumi Bank, and an independent direct-to-consumer venture.',
  },
] as const;

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0 },
};

function EnsemblisVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden p-5 sm:p-8 lg:p-12">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#171717_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative mx-auto flex h-full max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[1.5rem] border border-black/20 bg-[#151515] text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:px-7">
            <span>Ensemblis / Artist workspace</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-white/70">Atlas Irwin</span>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-[#151515] p-5 sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Next release</p>
              <h3 className="mt-5 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">Dancing in Color</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                Release intelligence, assets, campaign planning, distribution, and content in one workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Lyrics parsed', 'Stems ready', 'Campaign draft', 'Metadata 92%'].map(item => (
                  <span key={item} className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-white/65">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-[#1d1d1d] p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Content', '14 ideas', 'From lyrics, audio, stems'],
                  ['Distribution', 'Ready', 'Release package validated'],
                  ['Audience', '+18.4%', 'Signals from last 30 days'],
                  ['Media', '32 assets', 'Production-ready variants'],
                ].map(([label, value, helper]) => (
                  <div key={label} className="min-h-32 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:min-h-40">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
                    <p className="mt-5 text-2xl font-medium tracking-[-0.04em] sm:text-3xl">{value}</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">{helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectVisual({ project }: { project: (typeof work)[number] }) {
  const reduceMotion = useReducedMotion();

  const content = (
    <motion.div
      className={`group relative aspect-[16/10] overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] ${project.visualClass}`}
      whileHover={reduceMotion ? undefined : { scale: 0.992 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {project.title === 'Ensemblis' ? (
        <EnsemblisVisual />
      ) : (
        <>
          <Image
            src={project.image!}
            alt={project.imageAlt!}
            fill
            sizes="(max-width: 768px) 100vw, 86vw"
            className="object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:p-10 lg:p-16"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </>
      )}
      <div className="absolute end-4 top-4 rounded-full bg-[#171717] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white sm:end-6 sm:top-6">
        {project.note}
      </div>
      {project.href ? (
        <div className="absolute bottom-4 end-4 flex size-12 items-center justify-center rounded-full bg-[#171717] text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:bottom-6 sm:end-6 sm:size-16">
          <ArrowUpRight className="size-5 sm:size-6" aria-hidden="true" />
        </div>
      ) : null}
    </motion.div>
  );

  if (!project.href) return content;

  return (
    <a
      href={project.href}
      target={project.external ? '_blank' : undefined}
      rel={project.external ? 'noreferrer' : undefined}
      aria-label={`${project.title}${project.external ? ' (opens in a new tab)' : ''}`}
    >
      {content}
    </a>
  );
}

export default function PortfolioV2({ locale }: { locale: string }) {
  const reduceMotion = useReducedMotion();
  const cvHref = `/${locale}/cv`;

  return (
    <main className="scroll-smooth bg-[#d8d5cd] text-[#171717] selection:bg-[#171717] selection:text-white" dir="ltr">
      <header className="absolute inset-x-0 top-0 z-20 px-5 py-6 sm:px-8 lg:px-12">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em]" aria-label="Portfolio navigation">
          <a href="#top" className="transition-opacity hover:opacity-55">
            YF©26
          </a>
          <div className="flex items-center gap-5 sm:gap-8">
            <a href="#work" className="hidden transition-opacity hover:opacity-55 sm:inline">Work</a>
            <a href="#about" className="hidden transition-opacity hover:opacity-55 sm:inline">About</a>
            <a href={cvHref} className="transition-opacity hover:opacity-55">CV</a>
            <a href="#contact" className="transition-opacity hover:opacity-55">Contact</a>
          </div>
        </nav>
      </header>

      <section id="top" className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-5 pb-7 pt-28 sm:px-8 sm:pb-9 lg:px-12 lg:pb-12">
        <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-6 text-[10px] font-semibold uppercase tracking-[0.17em] sm:text-[11px]">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5" aria-hidden="true" />
            Berlin, Germany
          </div>
          <div className="text-end">
            Senior Product Engineer<br />
            Full-stack / AI / Commerce
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 46 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1600px] py-14 sm:py-20"
        >
          <p className="mb-6 text-xs uppercase tracking-[0.22em] text-black/55 sm:mb-8">Yotam Faraggi</p>
          <h1 className="max-w-[14ch] text-[19vw] font-medium uppercase leading-[0.78] tracking-[-0.075em] sm:text-[15vw] lg:text-[12.2vw] xl:text-[11rem]">
            I build<br />products.
          </h1>
          <div className="mt-9 flex max-w-2xl flex-col gap-6 sm:ms-[42%] sm:mt-12 lg:ms-[50%]">
            <p className="text-xl leading-[1.25] tracking-[-0.025em] sm:text-2xl lg:text-3xl">
              From ambiguous ideas to production software people actually use.
            </p>
            <p className="max-w-lg text-sm leading-6 text-black/58 sm:text-base sm:leading-7">
              I work across product definition, frontend, backend, architecture, integrations, and shipping — without losing sight of the user or the business.
            </p>
          </div>
        </motion.div>

        <div className="mx-auto flex w-full max-w-[1600px] items-end justify-between border-t border-black/25 pt-5 text-[10px] font-semibold uppercase tracking-[0.17em] sm:text-[11px]">
          <span>10+ years building production software</span>
          <a href="#work" className="flex items-center gap-2 transition-opacity hover:opacity-55">
            Selected work <ArrowDown className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="work" className="bg-[#f2f0ea] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1600px]">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20 grid gap-8 border-b border-black/20 pb-10 sm:mb-28 lg:grid-cols-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Selected work / 2021—2026</p>
            <h2 className="max-w-3xl text-4xl font-medium leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Four products.<br />Four kinds of hard problems.
            </h2>
          </motion.div>

          <div className="space-y-28 sm:space-y-40">
            {work.map((project, index) => (
              <motion.article
                key={project.title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.7, delay: reduceMotion ? 0 : index * 0.03, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-7 grid gap-6 lg:grid-cols-[0.45fr_1.1fr_0.7fr] lg:items-end">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                    {project.number} / {project.title}
                  </div>
                  <h3 className="whitespace-pre-line text-4xl font-medium leading-[0.9] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                    {project.headline}
                  </h3>
                  <div className="lg:ps-8">
                    <p className="text-sm leading-6 text-black/62 sm:text-base sm:leading-7">{project.description}</p>
                    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/48">
                      {project.tags.map(tag => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                </div>
                <ProjectVisual project={project} />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#171717] px-5 py-24 text-[#efede7] sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1600px]">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">How I work</p>
            <h2 className="max-w-[11ch] text-[14vw] font-medium uppercase leading-[0.78] tracking-[-0.075em] sm:text-[11vw] lg:text-[8.5rem]">
              I like owning the whole problem.
            </h2>
          </motion.div>

          <div className="mt-20 grid border-t border-white/20 lg:mt-28 lg:grid-cols-3">
            {[
              ['01', 'Product', 'Turn unclear requirements into something concrete enough to build, test, and improve.'],
              ['02', 'Engineering', 'Move comfortably across frontend, backend, architecture, integrations, and production constraints.'],
              ['03', 'Shipping', 'Care about the point where the architecture diagram becomes reliable software in someone’s hands.'],
            ].map(([number, title, text], index) => (
              <motion.div
                key={title}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-white/20 py-8 lg:border-b-0 lg:border-e lg:pe-10 lg:ps-10 first:lg:ps-0 last:lg:border-e-0 last:lg:pe-0"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{number}</p>
                <h3 className="mt-10 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">{title}</h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/55 sm:text-base sm:leading-7">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d8d5cd] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-12 lg:grid-cols-[0.55fr_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Experience / selected</p>
              <h2 className="mt-8 max-w-[8ch] text-6xl font-medium uppercase leading-[0.83] tracking-[-0.065em] sm:text-7xl lg:text-8xl">
                The last decade.
              </h2>
            </div>
            <div className="border-t border-black/25">
              {experience.map(item => (
                <div key={item.years} className="grid gap-3 border-b border-black/25 py-7 sm:grid-cols-[0.35fr_0.75fr_1fr] sm:gap-6 sm:py-9">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/52">{item.years}</p>
                  <div>
                    <h3 className="text-xl font-medium tracking-[-0.03em] sm:text-2xl">{item.company}</h3>
                    <p className="mt-1 text-xs text-black/50 sm:text-sm">{item.role}</p>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-black/58 sm:text-base sm:leading-7">{item.detail}</p>
                </div>
              ))}
              <div className="pt-7 text-sm text-black/52">
                Full history, technologies, education, and earlier engineering roles are available in the CV.
                <a href={cvHref} className="ms-2 inline-flex items-center gap-1 border-b border-black/40 pb-0.5 font-medium text-black transition-opacity hover:opacity-55">
                  View CV <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#8d83e8] px-5 pb-8 pt-24 text-[#171717] sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 lg:pt-40">
        <div className="mx-auto max-w-[1600px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Berlin / available for the right next team</p>
          <h2 className="mt-10 max-w-[11ch] text-[14vw] font-medium uppercase leading-[0.78] tracking-[-0.075em] sm:text-[11vw] lg:text-[8.5rem]">
            Have a hard product problem?
          </h2>
          <div className="mt-14 grid gap-10 border-t border-black/25 pt-8 lg:grid-cols-2 lg:items-end">
            <p className="max-w-xl text-2xl leading-[1.2] tracking-[-0.03em] sm:text-3xl">I like those.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.16em] lg:justify-end">
              <a href="mailto:yotamon@gmail.com" className="border-b border-black/45 pb-1 transition-opacity hover:opacity-55">Email</a>
              <a href="https://linkedin.com/in/yotam-faraggi" target="_blank" rel="noreferrer" className="border-b border-black/45 pb-1 transition-opacity hover:opacity-55">LinkedIn</a>
              <a href="https://github.com/yotamon" target="_blank" rel="noreferrer" className="border-b border-black/45 pb-1 transition-opacity hover:opacity-55">GitHub</a>
              <a href={cvHref} className="border-b border-black/45 pb-1 transition-opacity hover:opacity-55">CV</a>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-between border-t border-black/25 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] sm:mt-28">
            <span>Yotam Faraggi © 2026</span>
            <a href="#top" className="transition-opacity hover:opacity-55">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
