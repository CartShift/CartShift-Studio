'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Sparkles,
  Bug,
  Zap,
  FileText,
  Palette,
  HelpCircle,
  Clock,
  Calculator,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { usePricingCalculator } from '@/lib/hooks/usePricingCalculator';
import { RequestType, REQUEST_TYPE, Currency } from '@/lib/types/portal';
import { EffortLevel, EFFORT_LEVEL_CONFIG } from '@/lib/types/pricing-calculator';

// Icon mapping for request types
const TYPE_ICONS: Record<RequestType, React.ElementType> = {
  feature: Sparkles,
  bug: Bug,
  optimization: Zap,
  content: FileText,
  design: Palette,
  other: HelpCircle,
};

// Colors for request type pills
const TYPE_COLORS: Record<RequestType, { bg: string; text: string; border: string }> = {
  feature: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  bug: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  optimization: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  content: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  design: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  other: {
    bg: 'bg-surface-100 dark:bg-surface-800',
    text: 'text-surface-700 dark:text-surface-300',
    border: 'border-surface-200 dark:border-surface-700',
  },
};

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface EmbeddedCalculatorProps {
  /** Callback when user adds item to the pricing form */
  onAddItem: (item: LineItem) => void;
  /** Currency to use for calculations - synced with form */
  currency: Currency;
  /** Whether the calculator is initially expanded */
  defaultExpanded?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Embedded pricing calculator for use within Create/Edit pricing forms.
 * Provides a streamlined way to calculate and add line items.
 */
export function EmbeddedCalculator({
  onAddItem,
  currency,
  defaultExpanded = false,
  className,
}: EmbeddedCalculatorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'he';

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    requestType,
    effortLevel,
    setRequestType,
    setEffortLevel,
    setCurrency,
    result,
    formattedPrice,
  } = usePricingCalculator({ defaultCurrency: currency });

  // Sync currency when parent form changes it
  useEffect(() => {
    setCurrency(currency);
  }, [currency, setCurrency]);

  const effortLevels: EffortLevel[] = ['low', 'medium', 'high', 'complex'];
  const requestTypes = Object.values(REQUEST_TYPE) as RequestType[];

  const handleAddItem = () => {
    onAddItem({
      description: generateDescription(),
      quantity: 1,
      unitPrice: result.adjustedPrice / 100, // Convert from cents to dollars for the form
    });
  };

  const generateDescription = () => {
    const typeLabel = t(`portal.requests.types.${requestType}`);
    const effortConfig = EFFORT_LEVEL_CONFIG[effortLevel];
    const effortLabel = isRTL ? effortConfig.labelHe : effortConfig.label;
    return `${typeLabel} - ${effortLabel}`;
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-2xl transition-all duration-300',
        isExpanded
          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20'
          : 'border-surface-200 dark:border-surface-700',
        className
      )}
    >
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between gap-3 text-start"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              isExpanded
                ? 'bg-blue-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
            )}
          >
            <Calculator size={20} />
          </div>
          <div>
            <h4 className="font-bold text-surface-900 dark:text-white font-outfit">
              {t('portal.pricing.calculator')}
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {t('portal.pricing.calculatorSubtitle')}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'text-surface-400 transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Calculator Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-5">
              {/* Request Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
                  {t('portal.requests.form.type')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {requestTypes.map(type => {
                    const Icon = TYPE_ICONS[type];
                    const colors = TYPE_COLORS[type];
                    const isSelected = requestType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRequestType(type)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all font-outfit font-bold text-sm',
                          isSelected
                            ? cn(colors.bg, colors.text, colors.border, 'shadow-sm')
                            : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                        )}
                      >
                        <Icon size={14} />
                        {t(`portal.requests.types.${type}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Effort Level Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
                  {t('portal.pricing.effortLevel')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {effortLevels.map(level => {
                    const config = EFFORT_LEVEL_CONFIG[level];
                    const isSelected = effortLevel === level;

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEffortLevel(level)}
                        className={cn(
                          'relative p-3 rounded-xl border-2 transition-all text-start',
                          isSelected
                            ? cn(config.bgColor, 'border-current shadow-sm', config.color)
                            : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300'
                        )}
                      >
                        <div
                          className={cn(
                            'font-bold font-outfit text-sm',
                            isSelected ? config.color : 'text-surface-900 dark:text-white'
                          )}
                        >
                          {isRTL ? config.labelHe : config.label}
                        </div>
                        <div className="text-[10px] text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {isRTL ? config.hoursRangeHe : config.hoursRange}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Preview & Add Button */}
              <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                <div>
                  <div className="text-xs font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                    {t('portal.pricing.itemPrice')}
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-outfit">
                    {formattedPrice}
                  </div>
                  <div className="text-xs text-surface-500 mt-1">
                    {result.estimatedHours.min}-{result.estimatedHours.max}{' '}
                    {t('portal.common.hours')}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="h-12 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus size={18} className={cn(isRTL ? 'ms-2' : 'me-2')} />
                  {t('portal.pricing.form.addItem')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
