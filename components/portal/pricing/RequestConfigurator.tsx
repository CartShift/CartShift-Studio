'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EffortLevel, EFFORT_LEVEL_CONFIG } from '@/lib/types/pricing-calculator';
import { CURRENCY_CONFIG, Currency } from '@/lib/types/portal';
import { formatCalculatorPrice } from '@/lib/services/pricing-calculator';
import { PRICING_UI, PRICING_ERRORS } from '@/lib/constants/pricing';

interface RequestConfiguratorProps {
  requestId: string;
  config: any;
  result: any;
  currency: string;
  onUpdateConfig: (requestId: string, updates: any) => void;
  isExpanded: boolean;
}

/**
 * RequestConfigurator component - Individual request configuration panel
 * Follows AGENTS.md guidelines for RTL support and accessibility
 */
export function RequestConfigurator({
  requestId,
  config,
  result,
  currency,
  onUpdateConfig,
  isExpanded,
}: RequestConfiguratorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'he';
  const effortLevels: EffortLevel[] = ['low', 'medium', 'high', 'complex'];

  if (!config || !result) return null;

  const renderEffortSelector = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {effortLevels.map(level => {
        const levelConfig = EFFORT_LEVEL_CONFIG[level];
        const isSelected = config.effortLevel === level;

        return (
          <button
            key={level}
            type="button"
            onClick={() => updateConfig({ effortLevel: level })}
            aria-pressed={isSelected}
            aria-label={`${levelConfig.label} - ${levelConfig.hoursRange}`}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-start',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
              isSelected
                ? cn(levelConfig.bgColor, 'border-current', levelConfig.color, 'shadow-sm')
                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
            )}
          >
            <div
              className={cn(
                'font-bold text-sm',
                isSelected ? levelConfig.color : 'text-surface-900 dark:text-white'
              )}
            >
              {isRTL ? levelConfig.labelHe : levelConfig.label}
            </div>
            <div className="text-[10px] text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-1">
              <Clock size={10} />
              {isRTL ? levelConfig.hoursRangeHe : levelConfig.hoursRange}
            </div>
          </button>
        );
      })}
    </div>
  );

  const updateConfig = (updates: any) => {
    onUpdateConfig(requestId, updates);
  };

  const handleCustomPriceChange = (value: string) => {
    if (value === '' || value === undefined) {
      updateConfig({ customPrice: undefined });
    } else {
      const parsed = parseFloat(value);
      if (
        !isNaN(parsed) &&
        parsed >= PRICING_UI.MIN_CUSTOM_PRICE &&
        parsed <= PRICING_UI.MAX_CUSTOM_PRICE
      ) {
        updateConfig({ customPrice: Math.round(parsed * 100) });
      }
    }
  };

  const resetCustomPrice = () => {
    updateConfig({ customPrice: undefined });
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: PRICING_UI.EXPANSION_ANIMATION_DURATION, ease: 'easeInOut' }}
          className="overflow-hidden bg-blue-50/30 dark:bg-blue-900/5"
        >
          <div className="px-4 pb-4 ps-10 sm:ps-16 pe-4 space-y-4 border-t border-surface-100 dark:border-surface-800 pt-4">
            {/* Effort Level */}
            <div className="space-y-2">
              <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
                {t('portal.pricing.effortLevel')}
              </label>
              {renderEffortSelector()}
            </div>

            {/* Price Override */}
            {result && (
              <div className="space-y-3">
                {/* Custom Price Input */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-black text-surface-500 uppercase tracking-widest mb-2 block">
                      {t('portal.pricing.customPrice' as never) || 'Custom Price'}
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">
                        {CURRENCY_CONFIG[currency as Currency]?.symbol || '$'}
                      </span>
                      <input
                        type="number"
                        min={PRICING_UI.MIN_CUSTOM_PRICE}
                        max={PRICING_UI.MAX_CUSTOM_PRICE}
                        step={0.01}
                        value={
                          config.customPrice !== undefined
                            ? config.customPrice / 100
                            : result.adjustedPrice / 100
                        }
                        onChange={e => handleCustomPriceChange(e.target.value)}
                        aria-label={t('portal.pricing.customPrice')}
                        aria-describedby="custom-price-hint"
                        className={cn(
                          'portal-input w-full ps-8 text-lg font-bold',
                          config.customPrice !== undefined &&
                            'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20'
                        )}
                        placeholder={String(result.adjustedPrice / 100)}
                      />
                    </div>
                    <div id="custom-price-hint" className="text-xs text-surface-500 mt-1">
                      {t('portal.pricing.calculatorSubtitle') ||
                        'Leave empty to use calculated price'}
                    </div>
                  </div>
                  {config.customPrice !== undefined && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={resetCustomPrice}
                      className="gap-1.5"
                      aria-label={t('portal.pricing.resetToCalculated')}
                    >
                      <RotateCcw size={14} />
                      {t('portal.pricing.resetToCalculated' as never) || 'Reset'}
                    </Button>
                  )}
                </div>

                {/* Price Summary */}
                <div
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border',
                    config.customPrice !== undefined
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/30'
                      : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/30'
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        'text-xs font-black uppercase tracking-widest mb-1',
                        config.customPrice !== undefined
                          ? 'text-amber-600/70 dark:text-amber-400/70'
                          : 'text-emerald-600/70 dark:text-emerald-400/70'
                      )}
                    >
                      {config.customPrice !== undefined
                        ? t('portal.pricing.overriddenPrice' as never) || 'Overridden Price'
                        : t('portal.pricing.itemPrice')}
                    </div>
                    <div
                      className={cn(
                        'text-2xl font-black font-outfit',
                        config.customPrice !== undefined
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      {formatCalculatorPrice(result.adjustedPrice, currency as Currency)}
                    </div>
                    {config.customPrice !== undefined && (
                      <div className="text-xs text-surface-500 mt-1 line-through">
                        {t('portal.pricing.calculatedPrice' as never) || 'Calculated'}:{' '}
                        {formatCalculatorPrice(result.basePrice, currency as Currency)}
                      </div>
                    )}
                  </div>
                  <div className="text-start sm:text-end text-xs text-surface-600 dark:text-surface-400">
                    <div className="text-surface-500">{t('portal.common.estimated')}</div>
                    <div className="font-bold text-sm">
                      {result.estimatedHours.min}-{result.estimatedHours.max}{' '}
                      {t('portal.common.hours')}
                    </div>
                  </div>
                </div>

                {/* Validation Error Display */}
                {config.customPrice !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle size={12} />
                    <span>
                      {config.customPrice > PRICING_UI.MAX_CUSTOM_PRICE
                        ? PRICING_ERRORS.PRICE_TOO_HIGH
                        : config.customPrice < PRICING_UI.MIN_CUSTOM_PRICE
                          ? PRICING_ERRORS.PRICE_TOO_LOW
                          : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
