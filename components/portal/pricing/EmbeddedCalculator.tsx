'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Clock,
  Calculator,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { usePricingCalculator } from '@/lib/hooks/usePricingCalculator';
import { RequestType, REQUEST_TYPE, Currency } from '@/lib/types/portal';
import { EffortLevel, EFFORT_LEVEL_CONFIG } from '@/lib/types/pricing-calculator';
import {
  CALCULATOR_TYPE_ICONS as TYPE_ICONS,
  CALCULATOR_TYPE_COLORS as TYPE_COLORS,
} from '@/lib/constants/request-type-ui';

// Icon mapping for request types

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
  const t = usePortalTranslations();
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
    const typeLabel = t(`requests.types.${requestType}`);
    const effortConfig = EFFORT_LEVEL_CONFIG[effortLevel];
    const effortLabel = isRTL ? effortConfig.labelHe : effortConfig.label;
    return `${typeLabel} - ${effortLabel}`;
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-2xl transition-all duration-300',
        isExpanded
          ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/20'
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
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
            )}
          >
            <Calculator size={20} />
          </div>
          <div>
            <h4 className="font-bold text-surface-900 dark:text-white font-outfit">
              {t('pricing.calculator')}
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {t('pricing.calculatorSubtitle')}
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
                <label className="portal-label-sm">
                  {t('requests.form.type')}
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
                        {t(`requests.types.${type}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Effort Level Selection */}
              <div className="space-y-2">
                <label className="portal-label-sm">
                  {t('pricing.effortLevel')}
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
              <div className="flex items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                <div>
                  <div className="text-xs font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">
                    {t('pricing.itemPrice')}
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-outfit">
                    {formattedPrice}
                  </div>
                  <div className="text-xs text-surface-500 mt-1">
                    {result.estimatedHours.min}-{result.estimatedHours.max}{' '}
                    {t('common.hours')}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Plus size={18} className={cn(isRTL ? 'ms-2' : 'me-2')} />
                  {t('pricing.form.addItem')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
