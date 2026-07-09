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
  Bell,
  LayoutDashboard,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLocale } from 'next-intl';
import { usePortalTranslations } from '@/lib/i18n/translations';
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
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const t = usePortalTranslations();
  const locale = useLocale();
  const isRTL = isRTLLocale(locale);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

const tourIconClass = 'w-8 h-8 text-primary-500 dark:text-primary-400';

  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.steps.welcome.title'),
      description: t('onboarding.steps.welcome.description'),
      icon: <Sparkles className={tourIconClass} />,
      position: 'center',
    },
    {
      id: 'dashboard',
      title: t('onboarding.steps.dashboard.title'),
      description: t('onboarding.steps.dashboard.description'),
      icon: <LayoutDashboard className={tourIconClass} />,
      highlight: '[data-tour="nav-dashboard"]',
      position: 'bottom-right',
    },
    {
      id: 'requests',
      title: t('onboarding.steps.requests.title'),
      description: t('onboarding.steps.requests.description'),
      icon: <ClipboardList className={tourIconClass} />,
      highlight: '[data-tour="nav-requests"]',
      position: 'bottom-right',
    },
    {
      id: 'team',
      title: t('onboarding.steps.team.title'),
      description: t('onboarding.steps.team.description'),
      icon: <Users className={tourIconClass} />,
      highlight: '[data-tour="nav-team"]',
      position: 'bottom-right',
    },
    {
      id: 'notifications',
      title: t('onboarding.steps.notifications.title'),
      description: t('onboarding.steps.notifications.description'),
      icon: <Bell className={tourIconClass} />,
      highlight: '[data-tour="header-notifications"]',
      position: 'top-center',
    },
    {
      id: 'complete',
      title: t('onboarding.steps.complete.title'),
      description: t('onboarding.steps.complete.description'),
      icon: <Rocket className={tourIconClass} />,
      position: 'center',
    },
  ];

  const step = steps[currentStep];

  useEffect(() => {
    if (!step.highlight) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const target = document.querySelector(step.highlight!);
      if (!target) {
        setHighlightRect(null);
        return;
      }
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      setHighlightRect(target.getBoundingClientRect());
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [currentStep, step.highlight]);

  const handleComplete = useCallback(async () => {
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

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

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

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isAnchored = Boolean(highlightRect);
  const cardStyle = isAnchored
    ? {
        position: 'fixed' as const,
        top: Math.min(
          highlightRect!.bottom + 16,
          window.innerHeight - 420
        ),
        left: Math.min(
          Math.max(highlightRect!.left, 16),
          window.innerWidth - 420
        ),
        width: 'min(100vw - 2rem, 28rem)',
        zIndex: 101,
      }
    : undefined;

  const tourContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-[100] p-4',
          isAnchored ? 'pointer-events-none' : 'flex items-center justify-center'
        )}
      >
        <motion.div
          className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {highlightRect && (
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-primary-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.78)]"
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
            }}
            aria-hidden
          />
        )}

        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={cardStyle}
          className={cn(
            'relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto',
            !isAnchored && 'w-full max-w-lg'
          )}
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
              aria-label={t('onboarding.skip')}
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
              {t('onboarding.step')} {currentStep + 1} / {steps.length}
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
                  {t('onboarding.prev')}
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
                    aria-label={`${t('onboarding.goToStep')} ${index + 1}`}
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
                    {t('onboarding.start')}
                    <Rocket size={18} />
                  </>
                ) : (
                  <>
                    {t('onboarding.next')}
                    <ChevronRight size={18} className={cn(isRTL && 'rotate-180')} />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-surface-400 font-medium">
              {t('onboarding.keyboardHint')}
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
