'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';
import { Globe, Mail, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface AnalyzerFormData {
  storeUrl: string;
  email: string;
  subscribeNewsletter: boolean;
}

interface AnalyzerFormProps {
  onSubmit: (data: AnalyzerFormData & { captchaToken: string }) => Promise<void>;
  variant?: 'default' | 'dark';
}

const platformPatterns = [
  { name: 'Shopify', pattern: /shopify|myshopify\.com/i, icon: '/icons/shopify.svg' },
  { name: 'WooCommerce', pattern: /woo|wordpress/i, icon: '/icons/wordpress.svg' },
  { name: 'Wix', pattern: /wix/i, icon: '/icons/wix.svg' },
  { name: 'BigCommerce', pattern: /bigcommerce/i, icon: '/icons/bigcommerce.svg' },
  { name: 'Squarespace', pattern: /squarespace/i, icon: '/icons/squarespace.svg' },
  { name: 'Webflow', pattern: /webflow/i, icon: '/icons/webflow.svg' },
];

export const AnalyzerForm: React.FC<AnalyzerFormProps> = ({ onSubmit, variant = 'default' }) => {
  const isDark = variant === 'dark';
  const t = useTranslations();
  const [loading, set] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AnalyzerFormData>({
    defaultValues: {
      storeUrl: '',
      email: '',
      subscribeNewsletter: true,
    },
  });

  const storeUrl = watch('storeUrl');

  // Detect platform from URL
  React.useEffect(() => {
    if (storeUrl) {
      const platform = platformPatterns.find(p => p.pattern.test(storeUrl));
      setDetectedPlatform(platform ? { name: platform.name, icon: platform.icon } : null);
    } else {
      setDetectedPlatform(null);
    }
  }, [storeUrl]);

  const handleFormSubmit = async (data: AnalyzerFormData) => {
    set(true);
    try {
      if (!executeRecaptcha) {
        console.warn('Execute recaptcha not yet available');
      }

      const token = executeRecaptcha ? await executeRecaptcha('analyze_store') : '';
      await onSubmit({ ...data, captchaToken: token });
    } catch (e) {
      console.error('Submission error', e);
    } finally {
      set(false);
    }
  };

  // URL validation pattern
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Store URL Field */}
      <div>
        <Input
          label={t('analyzer.form.urlLabel') || 'Your Store URL'}
          placeholder={t('analyzer.form.urlPlaceholder') || 'https://your-store.com'}
          {...register('storeUrl', {
            required: t('analyzer.form.urlRequired') || 'Store URL is required',
            pattern: {
              value: urlPattern,
              message: t('analyzer.form.urlInvalid') || 'Please enter a valid URL',
            },
          })}
          error={errors.storeUrl?.message}
          disabled={loading}
          leftIcon={
            detectedPlatform ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-5 h-5 relative"
              >
                <Image
                  src={detectedPlatform.icon}
                  alt={detectedPlatform.name}
                  fill
                  className="object-contain"
                />
              </motion.div>
            ) : (
              <Globe className="w-5 h-5 text-surface-400" />
            )
          }
          rightIcon={
            detectedPlatform && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full">
                  {detectedPlatform.name}
                </span>
              </motion.div>
            )
          }
        />
      </div>

      {/* Email Field */}
      <div>
        <Input
          label={t('analyzer.form.emailLabel') || 'Email Address'}
          placeholder={t('analyzer.form.emailPlaceholder') || 'you@example.com'}
          type="email"
          style={{ direction: 'ltr' }}
          {...register('email', {
            required: t('analyzer.form.emailRequired') || 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('analyzer.form.emailInvalid') || 'Invalid email address',
            },
          })}
          error={errors.email?.message}
          disabled={loading}
          leftIcon={<Mail className="w-5 h-5 text-surface-400" />}
          hint={t('analyzer.form.emailHint') || "We'll send your detailed report here"}
        />
      </div>

      {/* Newsletter Checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="subscribeNewsletter"
          type="checkbox"
          {...register('subscribeNewsletter')}
          className={`mt-1 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer ${isDark ? 'border-white/20 bg-white/5' : 'border-surface-300 dark:border-surface-600'}`}
          disabled={loading}
        />
        <label
          htmlFor="subscribeNewsletter"
          className={`text-sm cursor-pointer ${isDark ? 'text-white/60' : 'text-surface-600 dark:text-surface-300'}`}
        >
          {t('analyzer.form.newsletterLabel') ||
            'Send me tips and insights to grow my store (recommended)'}
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full text-lg py-5"
        size="lg"
        disabled={loading}
        loading={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('analyzer.form.analyzing') || 'Analyzing...'}
          </span>
        ) : (
          t('analyzer.form.submitButton') || 'Analyze My Store — Free'
        )}
      </Button>

      {/* Privacy Notice */}
      <p
        className={`text-xs text-center ${isDark ? 'text-white/30' : 'text-surface-400 dark:text-surface-500'}`}
      >
        {t('analyzer.form.privacy') ||
          'Your data is secure. We never share your information with third parties.'}
      </p>
    </form>
  );
};
