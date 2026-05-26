'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { subscribeNewsletter } from '@/lib/services/newsletter-client';
import { trackNewsletterSignup } from '@/lib/analytics';

interface NewsletterSignupFormProps {
  source: 'newsletter_footer' | 'blog_sidebar';
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function NewsletterSignupForm({
  source,
  className,
  inputClassName,
  buttonClassName,
}: NewsletterSignupFormProps) {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'he';
  const isFooter = source === 'newsletter_footer';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await subscribeNewsletter(email.trim(), { locale, source });
      trackNewsletterSignup(source);
      toast.success(t('footer.newsletter.success'));
      setEmail('');
      if (isFooter) setSubscribed(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('footer.newsletter.error');
      if (isFooter) setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isFooter && subscribed) {
    return (
      <div className="flex items-center gap-2 text-success">
        <Icon name="check" size={20} />
        <span className="text-sm font-medium">{t('footer.newsletter.success')}</span>
      </div>
    );
  }

  const defaultInputClassName = isFooter
    ? 'flex-1 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-500 dark:placeholder:text-surface-400 border border-surface-300/60 dark:border-surface-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-sm shadow-sm'
    : 'w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-white/5 bg-white dark:bg-surface-950 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500';

  const placeholder = isFooter
    ? t('footer.newsletter.placeholder')
    : t('blog.content.newsletter.placeholder');

  if (isFooter) {
    return (
      <form onSubmit={handleSubmit} className={className ?? 'space-y-3 max-w-md lg:max-w-none'}>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={placeholder}
            required
            disabled={loading}
            style={{ direction: 'ltr' }}
            className={inputClassName ?? defaultInputClassName}
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            className={buttonClassName ?? '!px-2 !py-2'}
            loading={loading}
            disabled={loading}
            aria-label={t('footer.newsletter.subscribe')}
          >
            <Icon name="mail" size={20} aria-hidden="true" />
            <span className="sr-only">{t('footer.newsletter.subscribe')}</span>
          </Button>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? 'space-y-3'}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={loading}
        style={{ direction: 'ltr' }}
        className={inputClassName ?? defaultInputClassName}
      />
      <button
        type="submit"
        disabled={loading}
        className={
          buttonClassName ??
          'w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600 text-white font-medium transition-colors disabled:opacity-60'
        }
      >
        {loading ? t('footer.newsletter.submitting') : t('blog.content.newsletter.subscribe')}
      </button>
    </form>
  );
}
