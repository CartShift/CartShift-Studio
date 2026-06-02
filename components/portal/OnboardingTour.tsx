'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ClipboardList,
  Users,
  DollarSign,
  Bell,
  LayoutDashboard,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslations, useLocale } from 'next-intl';
import { isRTLLocale } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { updateOnboardingStatus } from '@/lib/services/portal-users';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  position?: 'center' | 'bottom-right' | 'top-center';
}

interface OnboardingTourProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userId, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = isRTLLocale(locale);

  useEffect(() => {
    setMounted(true);
    // Prevent scroll during tour
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: t('portal.onboarding.steps.welcome.title'),
      description: t('portal.onboarding.steps.welcome.description'),
      icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
      position: 'center',
    },
    {
      id: 'dashboard',
      title: t('portal.onboarding.steps.dashboard.title'),
      description: t('portal.onboarding.steps.dashboard.description'),
      icon: <LayoutDashboard className="w-8 h-8 text-primary-500" />,
      position: 'center',
    },
    {
      id: 'requests',
      title: t('portal.onboarding.steps.requests.title'),
      description: t('portal.onboarding.steps.requests.description'),
      icon: <ClipboardList className="w-8 h-8 text-purple-500" />,
      position: 'center',
    },
    {
      id: 'pricing',
      title: t('portal.onboarding.steps.pricing.title'),
      description: t('portal.onboarding.steps.pricing.description'),
      icon: <DollarSign className="w-8 h-8 text-green-500" />,
      position: 'center',
    },
    {
      id: 'team',
      title: t('portal.onboarding.steps.team.title'),
      description: t('portal.onboarding.steps.team.description'),
      icon: <Users className="w-8 h-8 text-indigo-500" />,
      position: 'center',
    },
    {
      id: 'notifications',
      title: t('portal.onboarding.steps.notifications.title'),
      description: t('portal.onboarding.steps.notifications.description'),
      icon: <Bell className="w-8 h-8 text-amber-500" />,
      position: 'center',
    },
    {
      id: 'complete',
      title: t('portal.onboarding.steps.complete.title'),
      description: t('portal.onboarding.steps.complete.description'),
      icon: <Rocket className="w-8 h-8 text-primary-600" />,
      position: 'center',
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      console.warn('handleComplete called on server side, skipping');
      return;
    }

    try {
      await updateOnboardingStatus(userId, {
        onboardingComplete: true,
        onboardingCompletedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
    onComplete();
  }, [userId, onComplete]);

  const handleSkip = useCallback(async () => {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      console.warn('handleSkip called on server side, skipping');
      return;
    }

    try {
      await updateOnboardingStatus(userId, {
        onboardingComplete: true,
        onboardingSkipped: true,
      });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
    onSkip();
  }, [userId, onSkip]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip]);

  if (!mounted) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const tourContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Tour Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 start-0 end-0 h-1 bg-surface-100 dark:bg-surface-800">
            <motion.div
              className="h-full bg-primary-600 dark:bg-primary-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Skip Button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="absolute top-4 end-4 rtl:end-auto rtl:start-4 p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800"
              aria-label={t('portal.onboarding.skip')}
            >
              <X size={20} />
            </button>
          )}

          {/* Content */}
          <div className="pt-12 pb-8 px-8 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center shadow-lg shadow-surface-200/50 dark:shadow-surface-900/50 border border-surface-100 dark:border-surface-700"
            >
              {step.icon}
            </motion.div>

            {/* Step Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <CheckCircle2 size={12} />
              {t('portal.onboarding.step')} {currentStep + 1} / {steps.length}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-surface-900 dark:text-white mb-3 font-outfit"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-surface-500 dark:text-surface-400 text-base leading-relaxed max-w-sm mx-auto"
            >
              {step.description}
            </motion.p>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between gap-4">
              {/* Previous Button */}
              {!isFirstStep ? (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex items-center gap-2 border-surface-200 dark:border-surface-700"
                >
                  <ChevronLeft size={18} className={cn(isRTL && 'rotate-180')} />
                  {t('portal.onboarding.prev')}
                </Button>
              ) : (
                <div />
              )}

              {/* Step Indicators */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index === currentStep
                        ? 'w-6 bg-primary-500'
                        : index < currentStep
                          ? 'bg-primary-300 dark:bg-primary-700'
                          : 'bg-surface-200 dark:bg-surface-700'
                    )}
                    aria-label={`${t('portal.onboarding.goToStep')} ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next/Complete Button */}
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
              >
                {isLastStep ? (
                  <>
                    {t('portal.onboarding.start')}
                    <Rocket size={18} />
                  </>
                ) : (
                  <>
                    {t('portal.onboarding.next')}
                    <ChevronRight size={18} className={cn(isRTL && 'rotate-180')} />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-surface-400 font-medium">
              {t('portal.onboarding.keyboardHint')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Don't render if document.body is not available
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(tourContent, document.body);
};
