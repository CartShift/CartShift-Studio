'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import {
  Sparkles,
  Bug,
  Zap,
  FileText,
  Palette,
  HelpCircle,
  Clock,
  Flame,
  Package,
  Users,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Settings2,
  Layers,
  Coins,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePricingCalculator } from '@/lib/hooks/usePricingCalculator';
import { RequestType, REQUEST_TYPE, Currency } from '@/lib/types/portal';
import { EffortLevel, EFFORT_LEVEL_CONFIG } from '@/lib/types/pricing-calculator';
import { formatCalculatorPrice } from '@/lib/services/pricing-calculator';

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

interface PricingCalculatorProps {
  onCreateOffer?: (lineItem: { description: string; quantity: number; unitPrice: number }) => void;
  onCreateMultipleOffers?: (
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
  ) => void;
  showCreateButton?: boolean;
  className?: string;
  compact?: boolean;
}

export function PricingCalculator({
  onCreateOffer,
  onCreateMultipleOffers,
  showCreateButton = true,
  className,
  compact: _compact = false,
}: PricingCalculatorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'he';

  const {
    requestType,
    effortLevel,
    currency,
    modifiers,
    setRequestType,
    setEffortLevel,
    setCurrency,
    toggleModifier,
    result,
    formattedPrice,
    reset,
    getLineItem,
    quoteItems,
    addToQuote,
    removeFromQuote,
    clearQuote,
    formattedQuoteTotalPrice,
    quoteHasItems,
    getAllLineItems,
    quoteResult,
  } = usePricingCalculator({ defaultCurrency: 'ILS' });

  const effortLevels: EffortLevel[] = ['low', 'medium', 'high', 'complex'];
  const requestTypes = Object.values(REQUEST_TYPE) as RequestType[];

  // Handlers for the buttons
  const handleSingleOffer = () => {
    if (onCreateOffer) {
      onCreateOffer(getLineItem(locale));
    }
  };

  const handleMultipleOffers = () => {
    if (onCreateMultipleOffers) {
      onCreateMultipleOffers(getAllLineItems(locale));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* ============================================ */}
      {/* SECTION 1: GLOBAL SETTINGS */}
      {/* ============================================ */}
      <Card className="overflow-hidden border-surface-200 dark:border-surface-800">
        {/* Global Settings Header */}
        <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-zinc-600 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.globalSettings')}
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {t('portal.pricing.globalSettingsDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Currency Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-surface-400" />
              <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
                {t('portal.pricing.form.currency')}
              </label>
            </div>
            <div className="flex gap-2">
              {(['ILS', 'USD', 'EUR'] as Currency[]).map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl font-bold font-outfit text-sm transition-all',
                    currency === curr
                      ? 'bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-lg'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Global Modifiers */}
          <div className="space-y-3">
            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
              {t('portal.pricing.modifiers.title')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Urgent */}
              <button
                onClick={() => toggleModifier('urgent')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                  modifiers.isUrgent
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                    : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    modifiers.isUrgent
                      ? 'bg-orange-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                  )}
                >
                  <Flame size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-surface-900 dark:text-white font-outfit text-sm">
                    {t('portal.pricing.modifiers.urgent')}
                  </div>
                  <div className="text-xs text-surface-500">
                    {t('portal.pricing.modifiers.urgentDesc')}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                    modifiers.isUrgent
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-surface-300 dark:border-surface-600'
                  )}
                >
                  {modifiers.isUrgent && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>

              {/* Recurring Client */}
              <button
                onClick={() => toggleModifier('recurring')}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                  modifiers.isRecurringClient
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    modifiers.isRecurringClient
                      ? 'bg-green-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                  )}
                >
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-surface-900 dark:text-white font-outfit text-sm">
                    {t('portal.pricing.modifiers.recurring')}
                  </div>
                  <div className="text-xs text-surface-500">
                    {t('portal.pricing.modifiers.recurringDesc')}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                    modifiers.isRecurringClient
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-surface-300 dark:border-surface-600'
                  )}
                >
                  {modifiers.isRecurringClient && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* SECTION 2: ITEM BUILDER */}
      {/* ============================================ */}
      <Card className="overflow-hidden border-surface-200 dark:border-surface-800">
        {/* Item Builder Header */}
        <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.itemBuilder')}
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {t('portal.pricing.itemBuilderDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Request Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
              {t('portal.requests.form.type')}
            </label>
            <div className="flex flex-wrap gap-2">
              {requestTypes.map(type => {
                const Icon = TYPE_ICONS[type];
                const colors = TYPE_COLORS[type];
                const isSelected = requestType === type;

                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRequestType(type)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-outfit font-bold text-sm',
                      isSelected
                        ? cn(colors.bg, colors.text, colors.border, 'shadow-md')
                        : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                    )}
                  >
                    <Icon size={16} />
                    {t(`portal.requests.types.${type}`)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Effort Level Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
              {t('portal.pricing.effortLevel')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {effortLevels.map(level => {
                const config = EFFORT_LEVEL_CONFIG[level];
                const isSelected = effortLevel === level;

                return (
                  <motion.button
                    key={level}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEffortLevel(level)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all text-start',
                      isSelected
                        ? cn(config.bgColor, 'border-current shadow-md', config.color)
                        : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                    )}
                  >
                    <div
                      className={cn(
                        'font-bold font-outfit',
                        isSelected ? config.color : 'text-surface-900 dark:text-white'
                      )}
                    >
                      {isRTL ? config.labelHe : config.label}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {isRTL ? config.hoursRangeHe : config.hoursRange}
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="effort-indicator"
                        className={cn(
                          'absolute inset-0 rounded-xl border-2',
                          config.color.replace('text-', 'border-')
                        )}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Current Item Preview */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1">
                  {t('portal.pricing.itemPrice')}
                </div>
                <motion.div
                  key={result.adjustedPrice}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-outfit"
                >
                  {formattedPrice}
                </motion.div>
              </div>
              <div className="text-end">
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {t('portal.common.estimated')} {result.estimatedHours.min}-
                  {result.estimatedHours.max} {t('portal.common.hours')}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={reset}
              className="px-4"
              title={t('portal.pricing.actions.reset')}
            >
              <RotateCcw size={16} />
            </Button>

            <Button
              variant="outline"
              className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              onClick={() => addToQuote(locale)}
            >
              <Plus size={16} className={cn(isRTL ? 'ms-2' : 'me-2')} />
              {t('portal.pricing.actions.addToQuote')}
            </Button>

            {showCreateButton && !quoteHasItems && (
              <Button
                onClick={handleSingleOffer}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {t('portal.pricing.actions.createOffer')}
                <ArrowRight size={16} className={cn(isRTL ? 'me-2 rotate-180' : 'ms-2')} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* SECTION 3: QUOTE SUMMARY */}
      {/* ============================================ */}
      <AnimatePresence>
        {quoteHasItems && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="overflow-hidden border-blue-200 dark:border-blue-900 shadow-xl shadow-blue-500/5">
              {/* Quote Header */}
              <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                      {t('portal.pricing.quote.items')} ({quoteItems.length})
                    </h3>
                    <p className="text-xs text-surface-500">
                      {t('portal.pricing.quote.reviewItems')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearQuote}
                  className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10"
                >
                  {t('portal.pricing.actions.clearQuote')}
                </button>
              </div>

              {/* Quote Items List */}
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {quoteItems.map(item => {
                  const Icon = TYPE_ICONS[item.requestType];
                  const colors = TYPE_COLORS[item.requestType];
                  const itemRatio = quoteResult.totalAdjustedPrice / quoteResult.totalBasePrice;
                  const itemAdjustedPrice = Math.round(item.basePrice * itemRatio);

                  return (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between group hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                            colors.bg,
                            colors.text
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-surface-900 dark:text-white font-outfit text-sm">
                            {item.description}
                          </div>
                          <div className="text-xs text-surface-500 flex items-center gap-2">
                            <span className="capitalize">
                              {t(`portal.pricing.effort.${item.effortLevel}`)}
                            </span>
                            <span className="text-surface-300">•</span>
                            <span>
                              {formatCalculatorPrice(item.basePrice, currency)}{' '}
                              {t('portal.pricing.quote.base')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-end">
                          <div className="font-black text-surface-900 dark:text-white font-outfit">
                            {formatCalculatorPrice(itemAdjustedPrice, currency)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQuote(item.id)}
                          className="p-2 text-surface-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all opacity-0 group-hover:opacity-100"
                          title={t('portal.pricing.quote.remove')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quote Breakdown Section */}
              {quoteResult.breakdown.filter(b => b.type !== 'base').length > 0 && (
                <div className="p-5 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-100 dark:border-surface-800">
                  <div className="space-y-2">
                    {quoteResult.breakdown
                      .filter(b => b.type !== 'base')
                      .map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs font-medium"
                        >
                          <span className="text-surface-500 flex items-center gap-2">
                            {item.type === 'add' ? (
                              <TrendingUp size={12} className="text-rose-500" />
                            ) : (
                              <TrendingDown size={12} className="text-green-500" />
                            )}
                            {isRTL ? item.labelHe : item.label}
                            {item.percentage && (
                              <span className="opacity-60">
                                ({item.type === 'add' ? '+' : '-'}
                                {item.percentage}%)
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(item.type === 'add' ? 'text-rose-600' : 'text-green-600')}
                          >
                            {item.type === 'add' ? '+' : '-'}
                            {formatCalculatorPrice(Math.abs(item.amount), currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quote Total & CTA */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs font-black text-white/70 uppercase tracking-widest mb-1">
                      {t('portal.pricing.quote.total')}
                    </div>
                    <div className="text-4xl font-black font-outfit">
                      {formattedQuoteTotalPrice}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-medium text-white/80">
                      {t('portal.pricing.quote.jobsCount', { count: quoteItems.length })}
                    </div>
                    <div className="text-[10px] text-white/60">
                      {quoteResult.totalEstimatedHours.min}-{quoteResult.totalEstimatedHours.max}{' '}
                      {t('portal.common.hours')} {t('portal.pricing.quote.totalHours')}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleMultipleOffers}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none shadow-xl h-14 text-lg font-black font-outfit"
                >
                  {t('portal.pricing.actions.createOffer')}
                  <ArrowRight size={20} className={cn(isRTL ? 'me-2 rotate-180' : 'ms-2')} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
