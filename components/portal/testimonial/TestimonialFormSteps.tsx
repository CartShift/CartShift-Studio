'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  Star,
  Quote,
  Sparkles,
  MessageSquareHeart,
  Award,
  Clock,
  Zap,
  Heart,
  Check,
  Send,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
import { StarRating } from './StarRating';
import { AspectRating } from './AspectRating';
import { RecommendToggle } from './RecommendToggle';

export const STEPS = ['rating', 'details', 'aspects', 'confirm'] as const;
export type Step = (typeof STEPS)[number];

export type TestimonialAspects = {
  communication: number;
  quality: number;
  timeliness: number;
  value: number;
};

interface SubmittedTestimonial {
  rating: number;
  headline: string;
  content: string;
}

export function AlreadySubmittedView({ testimonial }: { testimonial: SubmittedTestimonial }) {
  const t = useTranslations('portal');

  return (
    <Card variant="gradient" className="overflow-hidden">
      <div className="text-center py-8 space-y-4">
        <motion.div
          className="w-20 h-20 mx-auto rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Award className="w-10 h-10 text-white" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
            {t('testimonial.testimonial.alreadySubmitted.title')}
          </h3>
          <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto">
            {t('testimonial.testimonial.alreadySubmitted.description')}
          </p>
        </div>
        <div className="pt-4">
          <Card variant="glass" className="inline-block text-start max-w-md mx-auto">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn(
                    'w-5 h-5',
                    star <= testimonial.rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-surface-300'
                  )}
                />
              ))}
            </div>
            <p className="font-bold text-surface-900 dark:text-white mb-1">
              &ldquo;{testimonial.headline}&rdquo;
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
              {testimonial.content}
            </p>
          </Card>
        </div>
      </div>
    </Card>
  );
}

export function StepIndicator({
  currentStepIndex,
  progress,
}: {
  currentStepIndex: number;
  progress: number;
}) {
  return (
    <>
      <div className="h-1 bg-surface-200 dark:bg-surface-800 -mx-4 -mt-4 md:-mx-5 md:-mt-5 mb-6">
        <motion.div
          className="h-full bg-primary-600 dark:bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <motion.div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                index < currentStepIndex
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : index === currentStepIndex
                    ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
              )}
              animate={index === currentStepIndex ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
            </motion.div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 rounded-full transition-all duration-300',
                  index < currentStepIndex ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-700'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

interface FormNavigationProps {
  currentStep: Step;
  currentStepIndex: number;
  isRtl: boolean;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function FormNavigation({
  currentStep,
  currentStepIndex,
  isRtl,
  isLoading,
  onPrev,
  onNext,
  onSubmit,
}: FormNavigationProps) {
  const t = useTranslations('portal');
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
      {currentStepIndex > 0 ? (
        <Button variant="ghost" onClick={onPrev} className="gap-2">
          <PrevIcon className="w-4 h-4" />
          {t('testimonial.testimonial.actions.back')}
        </Button>
      ) : (
        <div />
      )}

      {currentStep === 'confirm' ? (
        <Button variant="gradient" onClick={onSubmit} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              {t('testimonial.testimonial.actions.submitting')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('testimonial.testimonial.actions.submit')}
            </>
          )}
        </Button>
      ) : (
        <Button variant="gradient" onClick={onNext} className="gap-2">
          {t('testimonial.testimonial.actions.next')}
          <NextIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

interface StepMotionProps {
  isRtl: boolean;
}

interface RatingStepProps extends StepMotionProps {
  rating: number;
  onRatingChange: (value: number) => void;
  error?: string;
}

export function RatingStep({ isRtl, rating, onRatingChange, error }: RatingStepProps) {
  const t = useTranslations('portal');

  return (
    <motion.div
      key="rating"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          className="w-16 h-16 mx-auto rounded-2xl bg-amber-600 dark:bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('testimonial.steps.rating.title')}
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          {t('testimonial.steps.rating.subtitle')}
        </p>
      </div>

      <div className="flex justify-center py-4">
        <StarRating value={rating} onChange={onRatingChange} size="lg" />
      </div>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </motion.div>
  );
}

interface DetailsStepProps extends StepMotionProps {
  role: string;
  onRoleChange: (value: string) => void;
  headline: string;
  onHeadlineChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  projectHighlight: string;
  onProjectHighlightChange: (value: string) => void;
  errors: Record<string, string>;
}

export function DetailsStep({
  isRtl,
  role,
  onRoleChange,
  headline,
  onHeadlineChange,
  content,
  onContentChange,
  projectHighlight,
  onProjectHighlightChange,
  errors,
}: DetailsStepProps) {
  const t = useTranslations('portal');

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div className="w-16 h-16 mx-auto rounded-2xl bg-primary-600 dark:bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <MessageSquareHeart className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('testimonial.steps.details.title')}
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          {t('testimonial.steps.details.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t('testimonial.fields.role')}
          placeholder={t('testimonial.placeholders.role')}
          value={role}
          onChange={e => onRoleChange(e.target.value)}
        />

        <Input
          label={t('testimonial.fields.headline')}
          placeholder={t('testimonial.placeholders.headline')}
          value={headline}
          onChange={e => onHeadlineChange(e.target.value)}
          error={errors.headline}
        />

        <PortalFormField label={t('testimonial.fields.content')} error={errors.content}>
          <Textarea
            placeholder={t('testimonial.placeholders.content')}
            value={content}
            onChange={e => onContentChange(e.target.value)}
            rows={4}
          />
        </PortalFormField>

        <Input
          label={t('testimonial.fields.projectHighlight')}
          placeholder={t('testimonial.placeholders.projectHighlight')}
          value={projectHighlight}
          onChange={e => onProjectHighlightChange(e.target.value)}
          hint={t('testimonial.testimonial.hints.projectHighlight')}
        />
      </div>
    </motion.div>
  );
}

interface AspectsStepProps extends StepMotionProps {
  aspects: TestimonialAspects;
  onAspectChange: (key: keyof TestimonialAspects, value: number) => void;
  wouldRecommend: boolean;
  onWouldRecommendChange: (value: boolean) => void;
}

export function AspectsStep({
  isRtl,
  aspects,
  onAspectChange,
  wouldRecommend,
  onWouldRecommendChange,
}: AspectsStepProps) {
  const t = useTranslations('portal');

  return (
    <motion.div
      key="aspects"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div className="w-16 h-16 mx-auto rounded-2xl bg-primary-600 dark:bg-primary-500 flex items-center justify-center shadow-sm">
          <Award className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('testimonial.steps.aspects.title')}
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          {t('testimonial.steps.aspects.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AspectRating
          icon={MessageSquareHeart}
          label={t('testimonial.testimonial.aspects.communication')}
          value={aspects.communication}
          onChange={v => onAspectChange('communication', v)}
          color="bg-primary-600 dark:bg-primary-500"
        />
        <AspectRating
          icon={Sparkles}
          label={t('testimonial.testimonial.aspects.quality')}
          value={aspects.quality}
          onChange={v => onAspectChange('quality', v)}
          color="bg-accent-600 dark:bg-accent-500"
        />
        <AspectRating
          icon={Clock}
          label={t('testimonial.testimonial.aspects.timeliness')}
          value={aspects.timeliness}
          onChange={v => onAspectChange('timeliness', v)}
          color="bg-amber-600 dark:bg-amber-500"
        />
        <AspectRating
          icon={Zap}
          label={t('testimonial.testimonial.aspects.value')}
          value={aspects.value}
          onChange={v => onAspectChange('value', v)}
          color="bg-emerald-600 dark:bg-emerald-500"
        />
      </div>

      <RecommendToggle value={wouldRecommend} onChange={onWouldRecommendChange} />
    </motion.div>
  );
}

interface ConfirmStepProps extends StepMotionProps {
  rating: number;
  headline: string;
  content: string;
  projectHighlight: string;
  role: string;
  wouldRecommend: boolean;
  userName?: string;
  orgName?: string;
}

export function ConfirmStep({
  isRtl,
  rating,
  headline,
  content,
  projectHighlight,
  role,
  wouldRecommend,
  userName,
  orgName,
}: ConfirmStepProps) {
  const t = useTranslations('portal');

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Quote className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('testimonial.steps.confirm.title')}
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          {t('testimonial.steps.confirm.subtitle')}
        </p>
      </div>

      <Card variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={cn(
                  'w-5 h-5',
                  star <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'
                )}
              />
            ))}
          </div>
          {wouldRecommend && (
            <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
              <Heart className="w-4 h-4 fill-emerald-500" />
              {t('testimonial.testimonial.wouldRecommendBadge')}
            </span>
          )}
        </div>

        <div>
          <p className="font-bold text-lg text-surface-900 dark:text-white">&ldquo;{headline}&rdquo;</p>
          <p className="text-surface-600 dark:text-surface-400 mt-2">{content}</p>
        </div>

        {projectHighlight && (
          <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-1">
              {t('testimonial.fields.projectHighlight')}
            </p>
            <p className="text-sm text-surface-600 dark:text-surface-400">{projectHighlight}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-800">
          <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-bold">
            {userName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white text-sm">
              {userName || 'Anonymous'}
            </p>
            <p className="text-xs text-surface-500">
              {role || t('testimonial.testimonial.noRole')} • {orgName || 'Company'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
