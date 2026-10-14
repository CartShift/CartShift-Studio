'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { trackFunnelEvent } from '@/lib/services/analyzer-events';
import type { AnalyzerIntent } from '@/lib/analyzer/funnel';

export function ContextualAnalyzerCta({
  intent,
  articleSlug,
  variant = 'compact',
}: {
  intent: AnalyzerIntent;
  articleSlug: string;
  variant?: 'compact' | 'full';
}) {
  const t = useTranslations('blogPost.contextualAnalyzer');
  const review = useTranslations('storeReview');
  const ref = useRef<HTMLDivElement>(null);
  const href = `/free-store-review?focus=${intent}&utm_source=blog&utm_medium=organic&utm_campaign=expert_store_review&utm_content=${encodeURIComponent(articleSlug)}`;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          trackFunnelEvent('expert_review_cta_viewed', { intent, article_slug: articleSlug });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [articleSlug, intent]);

  return (
    <div ref={ref} className={variant === 'full' ? 'space-y-3' : undefined}>
      {variant === 'full' ? (
        <>
          <h3 className="text-xl font-bold">{t(`${intent}.title`)}</h3>
          <p className="text-surface-600 dark:text-white/60">{t(`${intent}.description`)}</p>
        </>
      ) : null}
      <Link
        href={href}
        onClick={() =>
          trackFunnelEvent('expert_review_cta_clicked', { intent, article_slug: articleSlug })
        }
      >
        <Button variant="secondary" size="lg" className="w-full md:w-auto">
          {review('submit')} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
        </Button>
      </Link>
    </div>
  );
}
