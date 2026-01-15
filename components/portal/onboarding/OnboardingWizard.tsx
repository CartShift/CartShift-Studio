'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from '@/lib/motion';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, ArrowLeft, Building2, Sparkles, Check, Users, Briefcase } from 'lucide-react';
import { createOrganization, updateOrganization } from '@/lib/services/portal-organizations';
import { useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getPortalPath } from '@/lib/utils/portal-paths';

type Step = 'welcome' | 'info' | 'completion';

export function OnboardingWizard() {
  const t = useTranslations('portal');
  const router = useRouter();
  const { user } = usePortalAuth();

  const [step, setStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const industries = ['ecommerce', 'saas', 'agency', 'education', 'healthcare', 'other'];

  const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

  const handleNext = () => {
    if (step === 'welcome') setStep('info');
    else if (step === 'info') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'info') setStep('welcome');
  };

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create Organization
      const org = await createOrganization(
        formData.name.trim(),
        user.uid,
        user.email || '',
        user.displayName || undefined
      );

      // 2. Update with additional info if provided
      if (formData.industry || formData.size) {
        await updateOrganization(org.id, {
          industry: formData.industry,
          // bio is used for size momentarily as a placeholder or added to metadata if schema permits
          // reusing 'bio' field for size description for now as it matches string type
          bio: formData.size ? `Size: ${formData.size}` : undefined,
        });
      }

      setCreatedOrgId(org.id);
      setStep('completion');
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError(t('onboarding.error' as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (createdOrgId) {
      // Redirect to clean URL - the org is now stored in context/session
      router.push(getPortalPath('/dashboard/'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-12">
          {['welcome', 'info', 'completion'].map(s => {
            const steps: Step[] = ['welcome', 'info', 'completion'];
            const currentIndex = steps.indexOf(step);
            const sIndex = steps.indexOf(s as Step);
            const isActive = sIndex <= currentIndex;

            return (
              <motion.div
                key={s}
                initial={false}
                animate={{
                  width: isActive ? 32 : 8,
                  backgroundColor: isActive
                    ? 'rgb(var(--color-primary-500))'
                    : 'rgb(var(--color-surface-200))',
                }}
                className="h-2 rounded-full"
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 'welcome' && (
            <OnboardingStep
              key="welcome"
              isActive={step === 'welcome'}
              title={t('onboarding.welcome.title' as any)}
              description={t('onboarding.welcome.subtitle' as any)}
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30"
                >
                  <Sparkles size={48} className="text-white" />
                </motion.div>

                <div className="max-w-md mx-auto">
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
                    {t('onboarding.welcome.description' as any)}
                  </p>
                </div>

                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px] h-14 text-lg font-bold shadow-lg shadow-blue-500/20"
                >
                  {t('onboarding.welcome.cta' as any)}
                  <ArrowRight className="ms-2" size={20} />
                </Button>
              </div>
            </OnboardingStep>
          )}

          {/* STEP 2: ORGANIZATION INFO */}
          {step === 'info' && (
            <OnboardingStep
              key="info"
              isActive={step === 'info'}
              title={t('onboarding.info.title' as any)}
              description={t('onboarding.info.subtitle' as any)}
            >
              <div className="space-y-6">
                <div>
                  <Input
                    label={t('onboarding.form.orgNameLabel' as any)}
                    placeholder={t('onboarding.form.orgNamePlaceholder' as any)}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    leftIcon={<Building2 size={18} />}
                    success={formData.name.length > 2}
                    autoFocus
                  />
                  <p className="text-xs text-surface-500 mt-2">
                    {t('onboarding.form.orgNameHint' as any)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700 dark:text-surface-300">
                      {t('onboarding.form.industryLabel' as any)}
                    </label>
                    <div className="relative">
                      <Briefcase
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                        size={18}
                      />
                      <select
                        value={formData.industry}
                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        className="portal-input w-full ps-10 h-11 bg-white dark:bg-surface-900 appearance-none cursor-pointer"
                      >
                        <option value="">
                          {t('onboarding.form.industrySelectPlaceholder' as any)}
                        </option>
                        {industries.map(ind => (
                          <option key={ind} value={ind}>
                            {t(`industries.${ind}` as any)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700 dark:text-surface-300">
                      {t('onboarding.form.sizeLabel' as any)}
                    </label>
                    <div className="relative">
                      <Users
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                        size={18}
                      />
                      <select
                        value={formData.size}
                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                        className="portal-input w-full ps-10 h-11 bg-white dark:bg-surface-900 appearance-none cursor-pointer"
                      >
                        <option value="">
                          {t('onboarding.form.sizeSelectPlaceholder' as any)}
                        </option>
                        {sizes.map(s => (
                          <option key={s} value={s}>
                            {s} {t('onboarding.form.employeesLabel' as any)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
                  >
                    <ArrowLeft className="me-2" size={18} />
                    {t('onboarding.back' as any)}
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!formData.name.trim()}
                    className="min-w-[140px] shadow-lg shadow-blue-500/20"
                  >
                    <span>{t('onboarding.form.createButton' as any)}</span>
                    {!isSubmitting && <ArrowRight className="ms-2" size={18} />}
                  </Button>
                </div>
              </div>
            </OnboardingStep>
          )}

          {/* STEP 3: COMPLETION */}
          {step === 'completion' && (
            <OnboardingStep
              key="completion"
              isActive={step === 'completion'}
              title={t('onboarding.completion.title' as any)}
              description={t('onboarding.completion.subtitle' as any)}
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                  className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"
                >
                  <Check size={48} className="text-emerald-600 dark:text-emerald-400" />
                </motion.div>

                <p className="text-surface-600 dark:text-surface-300 max-w-sm mx-auto">
                  {t('onboarding.completion.description' as any)}
                </p>

                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px] h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 border-transparent text-white"
                >
                  {t('onboarding.completion.cta' as any)}
                  <ArrowRight className="ms-2" size={20} />
                </Button>
              </div>
            </OnboardingStep>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
