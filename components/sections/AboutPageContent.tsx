'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MessagesSquare, Zap, Activity, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BgBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.18, 0.1],
      rotate: [0, 90, 0],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[120px] pointer-events-none opacity-30 dark:opacity-10',
      className
    )}
  />
);

export const AboutPageContent: React.FC = () => {
  const t = useTranslations();
  const storyContent = t.raw('about.story.content') as string[];
  const teamMembers = t.raw('about.team.members') as Array<{ name: string; role: string; bio: string; expertise: string }>;
  const valuesItems = t.raw('about.values.items') as Array<{ title: string; description: string }>;
  const expectContent = t.raw('about.expect.content') as string[];

  const valueIcons = [MessagesSquare, Zap, Activity, CheckCircle];

  return (
    <div className="relative bg-background dark:bg-surface-950 transition-colors duration-500">
      {/* Hero Section - Immersive & Bold */}
      <Section background="glass" className="pt-20 pb-12 md:pt-32 md:pb-24 overflow-visible">
        <BgBlob className="top-10 -start-20 w-[600px] h-[600px] bg-primary-500/30 dark:bg-primary-500/20" />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-surface-900 dark:text-white font-display mb-8 leading-[1.1] tracking-tight">
              {t('about.hero.title')}
              <br />
              <span className="gradient-text">{t('about.hero.subtitle')}</span>
            </h1>
            <div className="space-y-6 max-w-xl">
              {storyContent.slice(0, 2).map((text, index) => (
                <p
                  key={index}
                  className="text-lg md:text-xl text-surface-600 dark:text-surface-300 leading-relaxed font-light"
                >
                  {text}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 rounded-[2.5rem] blur-2xl dark:opacity-40" />
            <div className="relative aspect-[4/5] md:aspect-square rounded-[2rem] overflow-hidden shadow-3xl ring-1 ring-white/20 dark:ring-white/10">
              <Image
                src="/images/yotam-and-adi.png"
                alt="CartShift Studio Team"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent dark:from-surface-950" />
              <div className="absolute inset-x-8 bottom-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="backdrop-blur-md bg-white/10 dark:bg-black/40 p-6 rounded-2xl border border-white/20 dark:border-white/10"
                >
                  <p className="text-white dark:text-surface-100 font-display text-lg italic leading-relaxed">
                    "{storyContent[2]}"
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Team Section - Clean & Interactive */}
      <Section background="default" className="py-16 md:py-24 relative">
        <BgBlob className="top-1/4 -start-20 w-[400px] h-[400px] bg-primary-500/20 dark:bg-primary-600/10" />

        <SectionHeader
          title={t('about.team.title')}
          subtitle={t('about.team.subtitle')}
          className="mb-20"
        />

        <div className="grid md:grid-cols-2 gap-10">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card
                variant="glass"
                hoverEffect="lift"
                className="group p-8 md:p-10 border-white/10 dark:border-white/5 h-full"
              >
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

                  <p className="text-base md:text-lg leading-relaxed text-surface-600 dark:text-surface-300 font-light mb-8 italic">
                    {member.bio}
                  </p>

                  <div className="mt-auto pt-8 border-t border-surface-200/50 dark:border-white/5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500 mb-4">
                      {t('about.team.expertiseLabel')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.split(', ').map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-md bg-white dark:bg-white/5 text-surface-700 dark:text-surface-300 text-xs font-medium border border-surface-200/50 dark:border-white/5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Values Section - Staggered Grid with Icons */}
      <Section background="default" className="py-16 md:py-24 relative overflow-hidden">
        <BgBlob
          className="bottom-0 -end-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-600/10"
          delay={2}
        />

        <SectionHeader title={t('about.values.title')} subtitle={t('about.values.subtitle')} />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuesItems.map((value, index) => {
            const ValIcon = valueIcons[index % valueIcons.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  variant="gradient"
                  hoverEffect="glow"
                  className="h-full p-8 border-none shadow-xl dark:shadow-2xl flex flex-col justify-between group transition-all duration-500"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-6 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                      <ValIcon size={28} />
                    </div>
                    <h4 className="text-xl font-display font-bold text-surface-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {value.title}
                    </h4>
                    <p className="text-base text-surface-600 dark:text-surface-300 leading-relaxed font-light">
                      {value.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Expectation Section - Interactive Progress */}
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
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="flex gap-6 md:gap-8 items-start group"
              >
                <div className="flex-shrink-0 w-1.5 h-auto self-stretch bg-gradient-to-b from-primary-500 to-transparent group-hover:from-accent-500 transition-all duration-500 rounded-full" />
                <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 leading-relaxed font-light group-hover:text-surface-900 dark:group-hover:text-white transition-colors duration-300">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section - Epic Finish with Adaptive Glow */}
      <Section background="glass" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center relative">
          <BgBlob className="top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary-500/20 dark:bg-primary-500/5 blur-[150px]" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-7xl font-bold text-surface-900 dark:text-white font-display mb-10 leading-tight tracking-tight">
              {t('about.cta.title')}
              <br />
              <span className="gradient-text font-black">{t('about.cta.titleSpan')}</span>
            </h2>
            <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {t('about.cta.description')}
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                className="h-16 px-10 text-xl font-bold group shadow-2xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow"
              >
                <span className="flex items-center gap-3">
                  {t('about.cta.button')}
                  <ArrowRight
                    className="w-6 h-6 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};
