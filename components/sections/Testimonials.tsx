'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Icon } from '@/components/ui/Icon';
import { Parallax } from '@/components/ui/Parallax';

import { useTranslations } from 'next-intl';

export const Testimonials: React.FC = () => {
  const t = useTranslations();
  const testimonials = t.raw('testimonials.items') as any[];

  if (!testimonials || testimonials.length === 0) return null;

  const featuredTestimonial = testimonials[0];
  const otherTestimonials = testimonials.slice(1);

  return (
    <Section background="light" className="relative overflow-hidden">
      {/* Parallax background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ambient glow orbs with parallax */}
        <Parallax speed={0.12}>
          <div className="absolute top-[8%] end-[5%] w-[400px] h-[400px] bg-accent-500/12 dark:bg-accent-500/6 rounded-full blur-[90px]"></div>
        </Parallax>
        <Parallax speed={-0.15}>
          <div className="absolute top-[50%] start-[3%] w-[450px] h-[450px] bg-primary-500/15 dark:bg-primary-500/8 rounded-full blur-[100px]"></div>
        </Parallax>
        <Parallax speed={0.2}>
          <div className="absolute top-[30%] start-[40%] w-[500px] h-[500px] bg-accent-400/10 dark:bg-accent-400/5 rounded-full blur-[120px]"></div>
        </Parallax>
        <Parallax speed={-0.1}>
          <div className="absolute bottom-[5%] end-[20%] w-[400px] h-[400px] bg-primary-400/12 dark:bg-primary-400/6 rounded-full blur-[100px]"></div>
        </Parallax>

        {/* Floating geometric shapes - CTA style */}
        <Parallax speed={0.3}>
          <motion.div
            className="absolute top-[15%] start-[8%] w-18 h-18 border-2 border-accent-500/15 dark:border-accent-400/10 rounded-xl"
            animate={{ rotate: [0, -90, -180, -270, -360], y: [0, 15, 0, -15, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          />
        </Parallax>

        <Parallax speed={-0.25}>
          <motion.div
            className="absolute top-[70%] end-[10%] w-20 h-20 border-2 border-primary-500/15 dark:border-primary-400/10 rounded-full"
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.18}>
          <motion.div
            className="absolute top-[40%] end-[5%] w-24 h-24 border border-accent-400/10 dark:border-accent-300/6 rounded-2xl"
            animate={{ rotate: [0, 40, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={-0.35}>
          <motion.div
            className="absolute top-[20%] end-[25%] w-12 h-12 bg-primary-500/6 dark:bg-primary-400/4 rounded-lg"
            animate={{ y: [0, -20, 0], rotate: [0, -45, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.22}>
          <motion.div
            className="absolute bottom-[35%] start-[15%] w-14 h-14 border border-accent-500/12 dark:border-accent-400/8 rounded-full"
            animate={{ scale: [1, 1.3, 1], x: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={-0.18}>
          <motion.div
            className="absolute top-[55%] start-[50%] w-10 h-10 border-2 border-primary-400/10 dark:border-primary-300/6 rounded-lg"
            animate={{ rotate: [-45, 0, -45], y: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        <Parallax speed={0.28}>
          <motion.div
            className="absolute bottom-[25%] end-[40%] w-8 h-8 bg-accent-400/10 dark:bg-accent-300/6 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </Parallax>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--surface-800-rgb),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--surface-800-rgb),0.03)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]" />
      </div>

      <SectionHeader title={t('testimonials.title')} subtitle={t('testimonials.subtitle')} />

      {/* Featured Spotlight Testimonial */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-10"
      >
        <div className="relative rounded-[2rem] p-10 md:p-14 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 dark:from-surface-800 dark:via-surface-900 dark:to-surface-800 shadow-2xl overflow-hidden">
          {/* Large decorative quote */}
          <div className="absolute top-6 start-8 md:start-12 text-[120px] md:text-[180px] font-serif text-white/10 dark:text-white/5 leading-none select-none pointer-events-none">
            "
          </div>
          <div className="absolute bottom-0 end-8 md:end-12 text-[120px] md:text-[180px] font-serif text-white/10 dark:text-white/5 leading-none select-none pointer-events-none rotate-180">
            "
          </div>

          {/* Glow effect */}
          <div className="absolute top-1/2 start-1/2 rtl:translate-x-1/2 ltr:-translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-500/20 dark:bg-accent-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-dropdown">
            {/* Star Rating - Animated */}
            <div className="flex gap-1.5 mb-8">
              {[...Array(featuredTestimonial.rating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  <Icon name="star" className="w-6 h-6 md:w-7 md:h-7 text-amber-400" size={28} />
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-xl md:text-2xl lg:text-3xl font-medium text-white leading-relaxed mb-10 max-w-4xl">
              "{featuredTestimonial.quote}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                {featuredTestimonial.author
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </div>
              <div>
                <p className="font-bold text-white text-lg md:text-xl">
                  {featuredTestimonial.author}
                </p>
                <p className="text-sm md:text-base text-white dark:text-surface-300">
                  {featuredTestimonial.company}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other Testimonials - Smaller Cards */}
      {otherTestimonials.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {otherTestimonials.map((testimonial, index) => (
            <motion.div
              key={index + 1}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1, type: 'spring' }}
            >
              <div className="h-full liquid-glass liquid-glass-highlight rounded-2xl p-7 md:p-8 group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                {/* Subtle quote icon */}
                <div className="absolute top-4 end-4 text-4xl font-serif text-accent-500/10 select-none">
                  "
                </div>

                {/* Star Rating */}
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Icon key={i} name="star" className="w-4 h-4 text-amber-400" size={16} />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-surface-700 dark:text-surface-100 mb-6 text-base md:text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-5 border-t border-surface-300/50 dark:border-white/10">
                  <div className="w-10 h-10 rounded-full bg-surface-200/70 dark:bg-surface-800 flex items-center justify-center border border-surface-300/60 dark:border-surface-700 flex-shrink-0">
                    <span className="text-surface-700 dark:text-white font-semibold text-sm">
                      {testimonial.author
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white text-sm md:text-base">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
};
