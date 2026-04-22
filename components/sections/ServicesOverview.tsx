'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Section, SectionHeader } from '@/components/ui/Section';
import { TiltCard } from '@/components/ui/TiltCard';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Check, ArrowRight, ShoppingCart, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const ServiceBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.15, 1],
      opacity: [0.1, 0.2, 0.1],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-20',
      className
    )}
  />
);

export const ServicesOverview: React.FC = () => {
  const t = useTranslations();

  const services = [
    {
      title: t('servicesOverview.shopify.title'),
      description: t('servicesOverview.shopify.description'),
      features: t.raw('servicesOverview.shopify.features') as string[],
      href: '/solutions/shopify',
      icon: ShoppingCart,
      color: 'primary',
      blobColor: 'bg-primary-500',
    },
    {
      title: t('servicesOverview.wordpress.title'),
      description: t('servicesOverview.wordpress.description'),
      features: t.raw('servicesOverview.wordpress.features') as string[],
      href: '/solutions/wordpress',
      icon: Globe,
      color: 'accent',
      blobColor: 'bg-accent-500',
    },
  ];

  return (
    <Section background="default" className="relative py-24 overflow-visible">
      <SectionHeader
        title={t('servicesOverview.title')}
        subtitle={t('servicesOverview.subtitle')}
        className="mb-20"
      />

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {services.map((service, index) => {
          const ServiceIcon = service.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              {/* Background Glow */}
              <ServiceBlob
                className={cn(
                  'top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]',
                  service.blobColor
                )}
                delay={index * 3}
              />

              <TiltCard tiltStrength={5} glare>
                <Card
                  variant="glass"
                  hoverEffect="lift"
                  className="h-full group relative overflow-hidden p-8 md:p-12 bg-white/70 dark:bg-surface-900/60 border-surface-200/50 dark:border-white/5 backdrop-blur-xl"
                >
                  <CardHeader className="p-0 border-none mb-8">
                    <div
                      className={cn(
                        'w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg',
                        service.color === 'primary'
                          ? 'bg-primary-500/10 border-primary-500/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white'
                          : 'bg-accent-500/10 border-accent-500/20 text-accent-600 dark:text-accent-400 group-hover:bg-accent-500 group-hover:text-white'
                      )}
                    >
                      <ServiceIcon size={index === 0 ? 32 : 36} strokeWidth={1.5} />
                    </div>
                    <CardTitle className="text-3xl md:text-4xl font-display font-bold mt-8 tracking-tight group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="mb-10 text-lg md:text-xl leading-relaxed text-surface-600 dark:text-surface-300 font-light">
                      {service.description}
                    </p>
                    <ul className="space-y-5 mb-12">
                      {service.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          className="flex items-start group/item"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 me-4 transition-colors',
                              service.color === 'primary'
                                ? 'bg-primary-500/10 text-primary-600'
                                : 'bg-accent-500/10 text-accent-600'
                            )}
                          >
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </div>
                          <span className="text-surface-700 dark:text-surface-200 text-lg font-medium group-hover/item:text-surface-900 dark:group-hover/item:text-white transition-colors">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                    <Link
                      href={service.href}
                      className={cn(
                        'inline-flex items-center gap-3 px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl group/link',
                        service.color === 'primary'
                          ? 'bg-primary-500 text-white hover:bg-primary-600 hover:scale-[1.02]'
                          : 'bg-accent-500 text-white hover:bg-accent-600 hover:scale-[1.02]'
                      )}
                    >
                      {t('common.learnMore')}
                      <ArrowRight
                        className="w-5 h-5 transition-transform group-hover/link:translate-x-1 rtl:rotate-180"
                        strokeWidth={2.5}
                      />
                    </Link>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
};
