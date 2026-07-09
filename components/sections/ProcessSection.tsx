'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

interface ProcessSectionProps {
  processPath: string;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ processPath }) => {
  const t = useTranslations();
  const processData = t.raw(processPath as never) as {
    title: string;
    subtitle: string;
    steps: Array<{ title: string; description: string }>;
  };

  return (
    <Section background="default" className="relative overflow-hidden">
      <SectionHeader title={processData.title} subtitle={processData.subtitle} />
      <div className="grid md:grid-cols-2 gap-8">
        {processData.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card hover glow="glow" className="h-full group relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent-500/15 dark:bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-xl border border-accent-500/20 dark:border-transparent">
                    {index + 1}
                  </div>
                  <CardTitle className="text-xl md:text-2xl">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
