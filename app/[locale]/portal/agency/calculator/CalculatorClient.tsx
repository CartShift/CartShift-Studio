'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { ArrowLeft, Lightbulb, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PricingCalculator } from '@/components/portal/pricing/PricingCalculator';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function CalculatorClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isAgency, loading: auth } = usePortalAuth();
  const isRTL = locale === 'he';

  // Handle creating offer from calculator
  const handleCreateOffer = (lineItem: {
    description: string;
    quantity: number;
    unitPrice: number;
  }) => {
    // Store the line item in session storage for the pricing form to pick up
    sessionStorage.setItem('calculatorLineItems', JSON.stringify([lineItem]));
    router.push(getPortalPath('/pricing/new/'));
  };

  const handleCreateMultipleOffers = (
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
  ) => {
    // Store all items in session storage
    sessionStorage.setItem('calculatorLineItems', JSON.stringify(lineItems));
    router.push(getPortalPath('/pricing/new/'));
  };

  // Show loading state
  if (auth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect non-agency users
  if (!isAgency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mb-6">
          <DollarSign className="w-10 h-10 text-surface-400" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit mb-2">
          {t('portal.common.accessDenied')}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-md mb-6">
          {t('portal.agency.agencyOnly')}
        </p>
        <Button onClick={() => router.push(getPortalPath('/'))}>{t('portal.common.goBack')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/portal/agency/pricing/')}
            className="text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft size={18} className={cn(isRTL && 'rotate-180')} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
              {t('portal.pricing.calculatorTitle')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
              {t('portal.pricing.calculatorSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calculator */}
        <div className="lg:col-span-2">
          <PricingCalculator
            onCreateOffer={handleCreateOffer}
            onCreateMultipleOffers={handleCreateMultipleOffers}
            showCreateButton={true}
          />
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-4">
          {/* Quick Tips Card */}
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.tips.title')}
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>{t('portal.pricing.tips.tip1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>{t('portal.pricing.tips.tip2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>{t('portal.pricing.tips.tip3')}</span>
              </li>
            </ul>
          </Card>

          {/* Effort Guide Card */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.effortGuide.title')}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {t('portal.pricing.effort.low')}
                </span>
                <span className="text-surface-500">1-4 {t('portal.common.hours')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {t('portal.pricing.effort.medium')}
                </span>
                <span className="text-surface-500">4-12 {t('portal.common.hours')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {t('portal.pricing.effort.high')}
                </span>
                <span className="text-surface-500">12-24 {t('portal.common.hours')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {t('portal.pricing.effort.complex')}
                </span>
                <span className="text-surface-500">24+ {t('portal.common.hours')}</span>
              </div>
            </div>
          </Card>

          {/* Value Prop Card */}
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.valueProps.title')}
              </h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              {t('portal.pricing.valueProps.description')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
