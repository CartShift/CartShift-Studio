'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from '@/lib/motion';
import { useReducedMotion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MessagesSquare, Zap, Activity, CheckCircle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BgBlob = ({
  className,
  delay = 0,
  reducedMotion = false,
}: {
  className?: string;
  delay?: number;
  reducedMotion?: boolean;
}) => (
  <motion.div
    initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
    animate={
      reducedMotion
        ? { scale: 1, opacity: 0.1, rotate: 0 }
        : {
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.18, 0.1],
            rotate: [0, 90, 0],
          }
    }
    transition={reducedMotion ? undefined : { duration: 15, repeat: Infinity, ease: 'easeInOut', delay }}
    className={cn(
      'absolute rounded-full blur-[120px] pointer-events-none opacity-30 dark:opacity-10',
      className
    )}
  />
);

export const AboutPageContent: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const isHebrew = locale === 'he';
  const reduceMotion = Boolean(useReducedMotion());
  const valuesItems = t.raw('about.values.items') as Array<{ title: string; description: string }>;
  const expectContent = t.raw('about.expect.content') as string[];

  const copy = isHebrew
    ? {
        heroTitle: 'אודות CartShift Studio',
        heroSubtitle: 'חשיבה מוצרית. עומק טכני. עבודה אנושית.',
        story: [
          'CartShift Studio הוא סטודיו קטן למוצר, מסחר ופיתוח Web שנבנה סביב רעיון פשוט: העבודה הדיגיטלית הטובה ביותר נוצרת כשחשיבה עסקית, החלטות מוצר והביצוע הטכני נשארים קרובים זה לזה.',
          'יותם מביא יותר מעשור של הנדסת תוכנה ומערכות פרודקשן. עדי מחברת פיתוח עם אסטרטגיה עסקית, ניהול לקוחות והבנה של קהל. יחד אנחנו לוקחים בעיה מהקשר עסקי ועד מוצר שעובד באמת.',
          'אנחנו מקשיבים קודם, מגדירים את הבעיה האמיתית, ואז בונים את הדבר הנכון בצורה נקייה, שקופה וניתנת להמשך.',
        ],
        teamTitle: 'מי אנחנו',
        teamSubtitle: 'האנשים שמאחורי CartShift Studio',
        expertiseLabel: 'תחומי חוזקה',
        portfolioLabel: 'הפורטפוליו של יותם',
        cvLabel: 'קורות החיים של יותם',
        members: [
          {
            name: "יותם פרג'י",
            role: 'Co-Founder & Senior Product Engineer',
            bio: 'Senior Product Engineer בברלין עם יותר מ-10 שנות ניסיון בתוכנה לפרודקשן. אני עובד על מוצרים שבהם צריך לחבר החלטות מוצריות לעומק טכני, כולל Full-Stack, מסחר, APIs, אינטגרציות, דאטה, cloud ו-AI. ב-CartShift אני מביא את אותו סטנדרט של ownership מקצה לקצה גם לעבודה עם לקוחות וגם למוצרים שאנחנו בונים בעצמנו.',
            expertise: 'Product Engineering, Full-Stack, Shopify, APIs & Integrations, AI-assisted Products, Performance & Reliability',
          },
          {
            name: 'עדי זלטר',
            role: 'Co-Founder · Business Strategy & Web Development',
            bio: 'עדי מחברת בין פיתוח לבין הצד העסקי של כל פרויקט. הרקע שלה במוזיקה ובחיי הלילה חידד אצלה הבנה של קהל, חוויה ותקשורת, והיום היא מביאה את זה לבניית אתרי WordPress, ניהול פרויקטים ועבודה ישירה עם לקוחות. היא דואגת שהמוצר לא רק יעבוד, אלא גם יהיה ברור, שימושי ומחובר למטרה העסקית שלו.',
            expertise: 'Business Strategy, WordPress Development, Project Management, Client Relations, Audience Experience, Digital Growth',
          },
        ],
        ctaTitle: 'יש לכם משהו ששווה',
        ctaTitleSpan: 'לבנות נכון?',
        ctaDescription: 'חנות, אתר, מערכת פנימית או רעיון שעדיין לא מסודר. נעזור להגדיר את הבעיה, לבחור את היקף העבודה הנכון ולהביא אותה לפרודקשן.',
        ctaButton: 'דברו איתנו',
      }
    : {
        heroTitle: 'About CartShift Studio',
        heroSubtitle: 'Product thinking. Technical depth. Human collaboration.',
        story: [
          'CartShift Studio is a small product, commerce and web engineering studio built around a simple idea: the best digital work happens when business context, product decisions and technical execution stay close together.',
          'Yotam brings more than a decade of software engineering and production systems. Adi connects development with business strategy, client leadership and audience understanding. Together, we take a problem from business context to a product that works in the real world.',
          'We listen first, define the real problem, then build the right thing with clean execution, clear communication and room to keep improving.',
        ],
        teamTitle: 'Who We Are',
        teamSubtitle: 'The people behind CartShift Studio',
        expertiseLabel: 'Strengths',
        portfolioLabel: "Yotam's portfolio",
        cvLabel: "Yotam's CV",
        members: [
          {
            name: 'Yotam Faraggi',
            role: 'Co-Founder & Senior Product Engineer',
            bio: 'Berlin-based Senior Product Engineer with 10+ years building and operating production software. I work best where product decisions and technical depth have to move together, across full-stack systems, commerce, APIs, integrations, data, cloud and AI. At CartShift, I bring that same end-to-end ownership to both client work and the products we build ourselves.',
            expertise: 'Product Engineering, Full-Stack, Shopify, APIs & Integrations, AI-assisted Products, Performance & Reliability',
          },
          {
            name: 'Adi Zelter',
            role: 'Co-Founder · Business Strategy & Web Development',
            bio: 'Adi connects development with the business side of every project. Her background in music and nightlife sharpened her understanding of audiences, experience and communication; today she applies that perspective to WordPress development, project leadership and direct client work. She keeps the work useful, clear and connected to the business goal behind it.',
            expertise: 'Business Strategy, WordPress Development, Project Management, Client Relations, Audience Experience, Digital Growth',
          },
        ],
        ctaTitle: 'Have something worth',
        ctaTitleSpan: 'building properly?',
        ctaDescription: 'A store, a website, an internal system, or an idea that is still messy. We can help define the problem, right-size the scope and take it into production.',
        ctaButton: 'Talk to us',
      };

  const valueIcons = [MessagesSquare, Zap, Activity, CheckCircle];
  const entrance = reduceMotion ? { initial: false as const } : undefined;

  return (
    <div className="relative bg-background dark:bg-surface-950 transition-colors duration-500">
      <Section background="glass" className="pt-20 pb-12 md:pt-32 md:pb-24 overflow-visible">
        <BgBlob reducedMotion={reduceMotion} className="top-10 -start-20 w-[600px] h-[600px] bg-primary-500/30 dark:bg-primary-500/20" />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            {...entrance}
            initial={reduceMotion ? false : { opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.8 }}
            className="relative z-10"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-surface-900 dark:text-white font-display mb-8 leading-[1.1] tracking-tight">
              {copy.heroTitle}
              <br />
              <span className="gradient-text">{copy.heroSubtitle}</span>
            </h1>
            <div className="space-y-6 max-w-2xl">
              {copy.story.slice(0, 2).map((text, index) => (
                <p key={index} className="text-lg md:text-xl text-surface-600 dark:text-surface-300 leading-relaxed font-light">
                  {text}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={reduceMotion ? undefined : { duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 rounded-[2.5rem] blur-2xl dark:opacity-40" />
            <div className="relative aspect-[4/5] md:aspect-square rounded-[2rem] overflow-hidden shadow-3xl ring-1 ring-white/20 dark:ring-white/10">
              <Image
                src="/images/yotam-and-adi.png"
                alt={isHebrew ? 'יותם פרג׳י ועדי זלטר, CartShift Studio' : 'Yotam Faraggi and Adi Zelter, CartShift Studio'}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700 motion-reduce:transform-none motion-reduce:transition-none"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent dark:from-surface-950" />
              <div className="absolute inset-x-8 bottom-8">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? undefined : { delay: 0.6 }}
                  className="backdrop-blur-md bg-white/10 dark:bg-black/40 p-6 rounded-2xl border border-white/20 dark:border-white/10"
                >
                  <p className="text-white dark:text-surface-100 font-display text-lg italic leading-relaxed">
                    “{copy.story[2]}”
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      <Section background="default" className="py-16 md:py-24 relative">
        <BgBlob reducedMotion={reduceMotion} className="top-1/4 -start-20 w-[400px] h-[400px] bg-primary-500/20 dark:bg-primary-600/10" />

        <SectionHeader title={copy.teamTitle} subtitle={copy.teamSubtitle} className="mb-20" />

        <div className="grid md:grid-cols-2 gap-10">
          {copy.members.map((member, index) => (
            <motion.div
              key={member.name}
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={reduceMotion ? undefined : { duration: 0.6, delay: index * 0.2 }}
            >
              <Card variant="glass" hoverEffect="lift" className="group p-8 md:p-10 border-white/10 dark:border-white/5 h-full">
                <div className="flex flex-col h-full">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold font-display text-surface-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                        {member.name}
                      </h3>
                      <p className="inline-block px-3 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-base md:text-lg leading-relaxed text-surface-600 dark:text-surface-300 font-light mb-8">
                    {member.bio}
                  </p>

                  <div className="mt-auto pt-8 border-t border-surface-200/50 dark:border-white/5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500 mb-4">
                      {copy.expertiseLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.split(', ').map((skill: string) => (
                        <span key={skill} className="px-3 py-1 rounded-md bg-white dark:bg-white/5 text-surface-700 dark:text-surface-300 text-xs font-medium border border-surface-200/50 dark:border-white/5">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {index === 0 ? (
                      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        <Link href="/portfolio" className="inline-flex items-center gap-1.5 hover:underline underline-offset-4">
                          {copy.portfolioLabel} <ArrowUpRight className="size-4" />
                        </Link>
                        <Link href="/cv" className="inline-flex items-center gap-1.5 hover:underline underline-offset-4">
                          {copy.cvLabel} <ArrowUpRight className="size-4" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section background="default" className="py-16 md:py-24 relative overflow-hidden">
        <BgBlob reducedMotion={reduceMotion} className="bottom-0 -end-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-600/10" delay={2} />

        <SectionHeader title={t('about.values.title')} subtitle={t('about.values.subtitle')} />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuesItems.map((value, index) => {
            const ValIcon = valueIcons[index % valueIcons.length];
            return (
              <motion.div
                key={value.title}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={reduceMotion ? undefined : { duration: 0.5, delay: index * 0.1 }}
              >
                <Card variant="gradient" hoverEffect="glow" className="h-full p-8 border-none shadow-xl dark:shadow-2xl flex flex-col justify-between group transition-all duration-500">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-6 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                      <ValIcon size={28} />
                    </div>
                    <h4 className="text-xl font-display font-bold text-surface-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {value.title}
                    </h4>
                    <p className="text-base text-surface-600 dark:text-surface-300 leading-relaxed font-light">{value.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section background="default" className="py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-surface-900 dark:text-white font-display mb-6 tracking-tight">
              {t('about.expect.title')}
              <br />
              <span className="gradient-text">{t('about.expect.titleSpan')}</span>
            </h2>
          </div>

          <div className="space-y-12">
            {expectContent.map((text, index) => (
              <motion.div
                key={text}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={reduceMotion ? undefined : { duration: 0.8, delay: index * 0.2 }}
                className="flex gap-6 md:gap-8 items-start group"
              >
                <div className="flex-shrink-0 w-1.5 h-auto self-stretch bg-gradient-to-b from-primary-500 to-transparent group-hover:from-accent-500 transition-all duration-500" />
                <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 leading-relaxed font-light group-hover:text-surface-900 dark:group-hover:text-white transition-colors duration-300">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section background="glass" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center relative">
          <BgBlob reducedMotion={reduceMotion} className="top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary-500/20 dark:bg-primary-500/5 blur-[150px]" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={reduceMotion ? undefined : { duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-7xl font-bold text-surface-900 dark:text-white font-display mb-10 leading-tight tracking-tight">
              {copy.ctaTitle}
              <br />
              <span className="gradient-text font-black">{copy.ctaTitleSpan}</span>
            </h2>
            <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {copy.ctaDescription}
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-16 px-10 text-xl font-bold group shadow-2xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow">
                <span className="flex items-center gap-3">
                  {copy.ctaButton}
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" strokeWidth={2.5} />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};
