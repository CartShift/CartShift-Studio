'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  Star,
  Quote,
  Sparkles,
  ThumbsUp,
  Send,
  Check,
  MessageSquareHeart,
  Award,
  Clock,
  Zap,
  Heart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTestimonials } from '@/lib/hooks/useTestimonials';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import { useDirection } from '@/lib/i18n-utils';

// ============================================
// CVA Variants
// ============================================

const starVariants = cva('cursor-pointer transition-all duration-200 stroke-[1.5]', {
  variants: {
    state: {
      empty:
        'text-surface-300 dark:text-surface-600 hover:text-amber-400 dark:hover:text-amber-400',
      filled: 'text-amber-400 fill-amber-400',
      hovered: 'text-amber-300 fill-amber-300',
    },
    size: {
      sm: 'w-5 h-5',
      md: 'w-7 h-7',
      lg: 'w-9 h-9',
    },
  },
  defaultVariants: {
    state: 'empty',
    size: 'md',
  },
});

const aspectCardVariants = cva(
  'relative rounded-xl p-3 transition-all duration-200 cursor-pointer',
  {
    variants: {
      selected: {
        true: [
          'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/40 dark:to-accent-950/40',
          'border-2 border-primary-300 dark:border-primary-600',
          'shadow-md shadow-primary-500/10',
        ],
        false: [
          'bg-surface-50 dark:bg-surface-800/50',
          'border border-surface-200 dark:border-surface-700',
          'hover:border-primary-200 dark:hover:border-primary-800',
          'hover:bg-surface-100 dark:hover:bg-surface-800',
        ],
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

// ============================================
// Star Rating Component
// ============================================

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: VariantProps<typeof starVariants>['size'];
  label?: string;
  showLabel?: boolean;
}

function StarRating({ value, onChange, size = 'md', label, showLabel = true }: StarRatingProps) {
  const t = useTranslations('portal');
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const ratingLabels = useMemo(
    () => [
      t('testimonial.ratings.1'),
      t('testimonial.ratings.2'),
      t('testimonial.ratings.3'),
      t('testimonial.ratings.4'),
      t('testimonial.ratings.5'),
    ],
    [t]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-bold text-surface-700 dark:text-surface-300">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayValue;
          const isHovered = hoverValue !== null && star <= hoverValue;

          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full"
            >
              <Star
                className={cn(
                  starVariants({
                    state: isFilled ? (isHovered ? 'hovered' : 'filled') : 'empty',
                    size,
                  })
                )}
              />
            </motion.button>
          );
        })}
        {showLabel && displayValue > 0 && (
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ms-3 text-sm font-medium text-surface-600 dark:text-surface-400"
          >
            {ratingLabels[displayValue - 1]}
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Aspect Rating Component (Mini stars)
// ============================================

interface AspectRatingProps {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

function AspectRating({ icon: Icon, label, value, onChange, color }: AspectRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className={cn(aspectCardVariants({ selected: value > 0 }))}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-lg', color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-bold text-surface-700 dark:text-surface-300">{label}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="focus:outline-none"
            >
              <Star
                className={cn(
                  'w-4 h-4 transition-all duration-150',
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-surface-300 dark:text-surface-600 hover:text-amber-300'
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Recommend Toggle
// ============================================

interface RecommendToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

function RecommendToggle({ value, onChange }: RecommendToggleProps) {
  const t = useTranslations('portal');

  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'w-full p-4 rounded-2xl border-2 transition-all duration-300',
        'flex items-center gap-4',
        value
          ? 'border-emerald-400 dark:border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30'
          : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:border-emerald-200 dark:hover:border-emerald-800'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <motion.div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          value
            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
            : 'bg-surface-200 dark:bg-surface-700'
        )}
        animate={value ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {value ? (
          <Heart className="w-6 h-6 text-white fill-white" />
        ) : (
          <ThumbsUp className="w-6 h-6 text-surface-400" />
        )}
      </motion.div>
      <div className="text-start flex-1">
        <p className="font-bold text-surface-900 dark:text-white">
          {t('testimonial.testimonial.wouldRecommend')}
        </p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {value
            ? t('testimonial.testimonial.wouldRecommendYes')
            : t('testimonial.testimonial.wouldRecommendNo')}
        </p>
      </div>
      <motion.div
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0',
          value ? 'border-emerald-500 bg-emerald-500' : 'border-surface-300 dark:border-surface-600'
        )}
        animate={value ? { scale: [1, 1.15, 1] } : {}}
      >
        {value && <Check className="w-5 h-5 text-white" />}
      </motion.div>
    </motion.button>
  );
}

// ============================================
// Textarea Component
// ============================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label className="text-sm font-bold text-surface-700 dark:text-surface-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl border transition-all duration-200',
            'bg-white dark:bg-surface-900/80',
            'text-surface-900 dark:text-white',
            'placeholder:text-surface-400 dark:placeholder:text-surface-500',
            'focus:outline-none',
            'text-sm font-medium p-4 resize-none',
            'shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)]',
            error
              ? 'border-rose-300 dark:border-rose-500/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-surface-200/80 dark:border-white/[0.08] hover:border-surface-300 dark:hover:border-white/[0.12] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:ring-primary-400/20 dark:focus:border-primary-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
        {!error && hint && <p className="text-xs text-surface-500 dark:text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// Multi-Step Form Steps
// ============================================

const STEPS = ['rating', 'details', 'aspects', 'confirm'] as const;
type Step = (typeof STEPS)[number];

// ============================================
// Main TestimonialForm Component
// ============================================

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
  const { hasSubmitted, testimonial, createTestimonial, isCreating } = useTestimonials(orgId);

  // Get current org name
  const currentOrg = fullOrganizations.find(org => org.id === orgId);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('rating');
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [projectHighlight, setProjectHighlight] = useState('');
  const [role, setRole] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [aspects, setAspects] = useState({
    communication: 0,
    quality: 0,
    timeliness: 0,
    value: 0,
  });

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback(
    (step: Step): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 'rating') {
        if (rating === 0) {
          newErrors.rating = t('testimonial.testimonial.errors.ratingRequired');
        }
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

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  // Already submitted view
  if (hasSubmitted && testimonial) {
    return (
      <Card variant="gradient" className="overflow-hidden">
        <div className="text-center py-8 space-y-4">
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
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
                "{testimonial.headline}"
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

  return (
    <Card variant="glass" className="overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1 bg-surface-200 dark:bg-surface-800 -mx-4 -mt-4 md:-mx-5 md:-mt-5 mb-6">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <motion.div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                index < currentStepIndex
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                  : index === currentStepIndex
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30'
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

      {/* Form Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Overall Rating */}
        {currentStep === 'rating' && (
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
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
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
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            {errors.rating && <p className="text-center text-sm text-red-500">{errors.rating}</p>}
          </motion.div>
        )}

        {/* Step 2: Details */}
        {currentStep === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
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
                onChange={e => setRole(e.target.value)}
              />

              <Input
                label={t('testimonial.fields.headline')}
                placeholder={t('testimonial.placeholders.headline')}
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                error={errors.headline}
              />

              <Textarea
                label={t('testimonial.fields.content')}
                placeholder={t('testimonial.placeholders.content')}
                value={content}
                onChange={e => setContent(e.target.value)}
                error={errors.content}
                rows={4}
              />

              <Input
                label={t('testimonial.fields.projectHighlight')}
                placeholder={t('testimonial.placeholders.projectHighlight')}
                value={projectHighlight}
                onChange={e => setProjectHighlight(e.target.value)}
                hint={t('testimonial.testimonial.hints.projectHighlight')}
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Aspects & Recommend */}
        {currentStep === 'aspects' && (
          <motion.div
            key="aspects"
            initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
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
                onChange={v => setAspects(prev => ({ ...prev, communication: v }))}
                color="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <AspectRating
                icon={Sparkles}
                label={t('testimonial.testimonial.aspects.quality')}
                value={aspects.quality}
                onChange={v => setAspects(prev => ({ ...prev, quality: v }))}
                color="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <AspectRating
                icon={Clock}
                label={t('testimonial.testimonial.aspects.timeliness')}
                value={aspects.timeliness}
                onChange={v => setAspects(prev => ({ ...prev, timeliness: v }))}
                color="bg-gradient-to-br from-amber-500 to-orange-500"
              />
              <AspectRating
                icon={Zap}
                label={t('testimonial.testimonial.aspects.value')}
                value={aspects.value}
                onChange={v => setAspects(prev => ({ ...prev, value: v }))}
                color="bg-gradient-to-br from-emerald-500 to-teal-500"
              />
            </div>

            <RecommendToggle value={wouldRecommend} onChange={setWouldRecommend} />
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 'confirm' && (
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
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
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

            {/* Preview */}
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
                <p className="font-bold text-lg text-surface-900 dark:text-white">"{headline}"</p>
                <p className="text-surface-600 dark:text-surface-400 mt-2">{content}</p>
              </div>

              {projectHighlight && (
                <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-1">
                    {t('testimonial.fields.projectHighlight')}
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    {projectHighlight}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                  {userData?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-surface-900 dark:text-white text-sm">
                    {userData?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-surface-500">
                    {role || t('testimonial.testimonial.noRole')} • {currentOrg?.name || 'Company'}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
        {currentStepIndex > 0 ? (
          <Button variant="ghost" onClick={goToPrevStep} className="gap-2">
            <PrevIcon className="w-4 h-4" />
            {t('testimonial.testimonial.actions.back')}
          </Button>
        ) : (
          <div />
        )}

        {currentStep === 'confirm' ? (
          <Button variant="gradient" onClick={handleSubmit} disabled={isCreating} className="gap-2">
            {isCreating ? (
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
          <Button variant="primary" onClick={goToNextStep} className="gap-2">
            {t('testimonial.testimonial.actions.next')}
            <NextIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export { StarRating };
