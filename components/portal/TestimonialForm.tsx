'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { useTestimonials } from '@/lib/hooks/useTestimonials';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import { useDirection } from '@/lib/i18n-utils';
import {
  STEPS,
  type Step,
  type TestimonialAspects,
  AlreadySubmittedView,
  StepIndicator,
  FormNavigation,
  RatingStep,
  DetailsStep,
  AspectsStep,
  ConfirmStep,
} from './testimonial/TestimonialFormSteps';

interface TestimonialFormProps {
  onSuccess?: () => void;
}

export function TestimonialForm({ onSuccess }: TestimonialFormProps) {
  const t = useTranslations('portal');
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const orgId = useResolvedOrgId();
  const { userData, user } = usePortalAuth();
  const { fullOrganizations } = useOrg();
  const { hasSubmitted, testimonial, createTestimonial, isLoading } = useTestimonials(orgId);

  const currentOrg = fullOrganizations.find(org => org.id === orgId);

  const [currentStep, setCurrentStep] = useState<Step>('rating');
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [projectHighlight, setProjectHighlight] = useState('');
  const [role, setRole] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [aspects, setAspects] = useState<TestimonialAspects>({
    communication: 0,
    quality: 0,
    timeliness: 0,
    value: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback(
    (step: Step): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 'rating' && rating === 0) {
        newErrors.rating = t('testimonial.testimonial.errors.ratingRequired');
      }

      if (step === 'details') {
        if (!headline.trim()) {
          newErrors.headline = t('testimonial.testimonial.errors.headlineRequired');
        }
        if (!content.trim()) {
          newErrors.content = t('testimonial.testimonial.errors.contentRequired');
        } else if (content.trim().length < 20) {
          newErrors.content = t('testimonial.testimonial.errors.contentTooShort');
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [rating, headline, content, t]
  );

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goToNextStep = useCallback(() => {
    if (!validateStep(currentStep)) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStep, currentStepIndex, validateStep]);

  const goToPrevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleAspectChange = useCallback((key: keyof TestimonialAspects, value: number) => {
    setAspects(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!orgId || !userData || !user) return;

    createTestimonial({
      orgId,
      userId: user.uid,
      userName: userData.name || 'Anonymous',
      userEmail: userData.email,
      companyName: currentOrg?.name || 'Unknown Company',
      data: {
        rating,
        headline,
        content,
        projectHighlight: projectHighlight || undefined,
        role: role || undefined,
        wouldRecommend,
        aspects: Object.values(aspects).some(v => v > 0) ? aspects : undefined,
      },
    });

    onSuccess?.();
  }, [
    orgId,
    userData,
    user,
    currentOrg,
    rating,
    headline,
    content,
    projectHighlight,
    role,
    wouldRecommend,
    aspects,
    createTestimonial,
    onSuccess,
  ]);

  if (hasSubmitted && testimonial) {
    return <AlreadySubmittedView testimonial={testimonial} />;
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <StepIndicator currentStepIndex={currentStepIndex} progress={progress} />

      <AnimatePresence mode="wait">
        {currentStep === 'rating' && (
          <RatingStep
            isRtl={isRtl}
            rating={rating}
            onRatingChange={setRating}
            error={errors.rating}
          />
        )}
        {currentStep === 'details' && (
          <DetailsStep
            isRtl={isRtl}
            role={role}
            onRoleChange={setRole}
            headline={headline}
            onHeadlineChange={setHeadline}
            content={content}
            onContentChange={setContent}
            projectHighlight={projectHighlight}
            onProjectHighlightChange={setProjectHighlight}
            errors={errors}
          />
        )}
        {currentStep === 'aspects' && (
          <AspectsStep
            isRtl={isRtl}
            aspects={aspects}
            onAspectChange={handleAspectChange}
            wouldRecommend={wouldRecommend}
            onWouldRecommendChange={setWouldRecommend}
          />
        )}
        {currentStep === 'confirm' && (
          <ConfirmStep
            isRtl={isRtl}
            rating={rating}
            headline={headline}
            content={content}
            projectHighlight={projectHighlight}
            role={role}
            wouldRecommend={wouldRecommend}
            userName={userData?.name}
            orgName={currentOrg?.name}
          />
        )}
      </AnimatePresence>

      <FormNavigation
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        isRtl={isRtl}
        isLoading={isLoading}
        onPrev={goToPrevStep}
        onNext={goToNextStep}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}

export { StarRating } from './testimonial/StarRating';
