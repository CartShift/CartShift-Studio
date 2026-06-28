'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Keyboard, LifeBuoy, Mail, Search, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { ViewTransitionLink } from '@/components/ui/ViewTransitionLink';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { usePlatformModifierKey } from '@/lib/hooks/usePlatformModifierKey';
import { SUPPORT_EMAIL } from '@/lib/constants/contact';
import { getHelpTopicHref } from '@/lib/portal/help-topics';
import { cn } from '@/lib/utils';

type HelpTopic = {
  id: string;
  title: string;
  body: string;
};

export function PortalHelpClient() {
  const t = useTranslations('portal.help');
  const { isAgency } = usePortalAuth();
  const modifier = usePlatformModifierKey();
  const [query, setQuery] = useState('');

  const topics = t.raw(isAgency ? 'topics.agency' : 'topics.client') as HelpTopic[];
  const shortcuts = t.raw('shortcuts.items') as Array<{ label: string; keys: string }>;

  const filteredTopics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return topics;
    return topics.filter(
      topic =>
        topic.title.toLowerCase().includes(normalized) ||
        topic.body.toLowerCase().includes(normalized)
    );
  }, [query, topics]);

  const resolvedShortcuts = useMemo(
    () =>
      shortcuts.map(item => ({
        ...item,
        keys: item.keys.replace('{mod}', modifier),
      })),
    [shortcuts, modifier]
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-200/80 dark:border-surface-800/60 bg-surface-100/60 dark:bg-surface-900/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-surface-500">
          <LifeBuoy size={14} aria-hidden />
          {t('eyebrow')}
        </div>
        <h1 className="portal-page-title">{t('title')}</h1>
        <p className="portal-page-subtitle md:text-base">{t('subtitle')}</p>
      </header>

      <div className="relative">
        <Search
          size={16}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="portal-focus-ring w-full rounded-xl border border-surface-200/80 dark:border-surface-800/60 bg-white/80 dark:bg-surface-900/50 ps-9 pe-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400"
        />
      </div>

      <section aria-labelledby="help-topics-heading" className="space-y-3">
        <CardSectionTitle id="help-topics-heading" className="flex items-center gap-2">
          <BookOpen size={16} aria-hidden />
          {t('topicsHeading')}
        </CardSectionTitle>

        {filteredTopics.length === 0 ? (
          <Card className="p-5 text-sm text-surface-500">{t('noResults')}</Card>
        ) : (
          <div className="grid gap-3">
            {filteredTopics.map(topic => {
              const topicHref = getHelpTopicHref(topic.id, isAgency);

              return (
                <Card
                  key={topic.id}
                  className="p-4 md:p-5 border-surface-200/80 dark:border-surface-800/60"
                >
                  <h2 className="text-sm font-bold text-surface-900 dark:text-white mb-1.5">
                    {topic.title}
                  </h2>
                  <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                    {topic.body}
                  </p>
                  {topicHref && (
                    <ViewTransitionLink
                      href={topicHref}
                      preset="slide"
                      className={cn(
                        'portal-focus-ring mt-3 inline-flex items-center gap-1.5 text-sm font-semibold',
                        'text-primary-600 dark:text-primary-400 hover:underline'
                      )}
                    >
                      {t('openTopic')}
                      <ArrowRight size={14} className="rtl:rotate-180" aria-hidden />
                    </ViewTransitionLink>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="help-shortcuts-heading" className="space-y-3">
        <CardSectionTitle id="help-shortcuts-heading" className="flex items-center gap-2">
          <Keyboard size={16} aria-hidden />
          {t('shortcuts.heading')}
        </CardSectionTitle>
        <Card className="divide-y divide-surface-200/80 dark:divide-surface-800/60 overflow-hidden">
          {resolvedShortcuts.map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="text-surface-700 dark:text-surface-300">{item.label}</span>
              <kbd className="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-2 py-0.5 text-xs font-semibold text-surface-600 dark:text-surface-300 whitespace-nowrap">
                {item.keys}
              </kbd>
            </div>
          ))}
        </Card>
      </section>

      <section aria-labelledby="help-support-heading">
        <Card className="p-4 md:p-5 border-surface-200/80 dark:border-surface-800/60 bg-surface-50/80 dark:bg-surface-900/40">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-xl border border-surface-200/80 dark:border-surface-700/60 p-2">
              <Sparkles size={16} className="text-primary-500" aria-hidden />
            </div>
            <div className="min-w-0 space-y-2">
              <CardSectionTitle id="help-support-heading">{t('support.title')}</CardSectionTitle>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                {t('support.description')}
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={cn(
                  'portal-focus-ring inline-flex items-center gap-2 text-sm font-semibold',
                  'text-primary-600 dark:text-primary-400 hover:underline'
                )}
              >
                <Mail size={15} aria-hidden />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
