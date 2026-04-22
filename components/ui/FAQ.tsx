'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { faqItem } from '@/lib/animation-variants';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  className?: string;
  allowMultiple?: boolean;
  showExpandAll?: boolean;
}

export const FAQ: React.FC<FAQProps> = ({
  items,
  className = '',
  allowMultiple = false,
  showExpandAll = false,
}) => {
  const t = useTranslations();
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setOpenIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (allowMultiple) {
          newSet.add(index);
        } else {
          newSet.clear();
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  const isOpen = (index: number) => openIndices.has(index);
  const allExpanded = openIndices.size === items.length;

  const toggleAll = () => {
    if (allExpanded) {
      setOpenIndices(new Set());
    } else {
      setOpenIndices(new Set(items.map((_, i) => i)));
    }
  };

  return (
    <div className={className}>
      {showExpandAll && items.length > 1 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <ChevronsUpDown className="w-4 h-4" />
            {allExpanded ? t('faq.collapseAll') : t('faq.expandAll')}
          </button>
        </div>
      )}
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={faqItem}
            custom={index * 0.1}
            layout
            className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-800 shadow-sm transition-shadow"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 md:px-6 py-4 md:py-5 text-start flex items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors touch-manipulation"
              aria-expanded={isOpen(index)}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className="text-base md:text-lg lg:text-xl font-bold text-surface-900 dark:text-white pe-4 md:pe-8 leading-snug md:leading-normal">
                {item.question}
              </h3>
              <motion.div
                animate={{ rotate: isOpen(index) ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown
                  className="w-6 h-6 text-accent-500 dark:text-accent-400 flex-shrink-0"
                  strokeWidth={2.5}
                />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen(index) && (
                <motion.div
                  id={`faq-answer-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-5 pt-0 text-surface-600 dark:text-surface-300 leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
