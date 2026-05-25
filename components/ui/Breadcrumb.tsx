'use client';

import React from 'react';
import { ViewTransitionLink } from '@/components/ui/ViewTransitionLink';
import { generateBreadcrumbSchema } from '@/lib/seo';
import Script from 'next/script';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

// Helper for RTL
const isRTLLocale = (locale: string) => locale === 'he' || locale === 'ar';

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
  showHome = false,
  homeHref = '/',
}) => {
  // Map items to schema format
  const schemaItems = items.map(item => ({
    name: item.label,
    url: item.href || '',
  }));

  const locale = useLocale();
  const breadcrumbSchema = generateBreadcrumbSchema(schemaItems, locale as 'en' | 'he');
  const isRTL = isRTLLocale(locale);

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
        <ol
          className="flex items-center gap-1.5 flex-wrap"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {showHome && (
            <li className="flex items-center">
              <ViewTransitionLink
                href={homeHref}
                preset="fade"
                className="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                aria-label="Home"
              >
                <Home size={16} />
              </ViewTransitionLink>
            </li>
          )}

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            // Schema.org formatting
            const position = index + 1 + (showHome ? 1 : 0);

            return (
              <li
                key={index}
                className="flex items-center gap-1.5"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {/* Separator (except for first item if no Home, but here we render separator BEFORE item if it's not the absolute first element)
                    Actually, standard breadcrumb logic: Item > Item > Item.
                    If showHome is true, we need separator before first item.
                    If showHome is false, we don't need separator before first item.
                */}
                {(showHome || index > 0) && (
                  <ChevronRight
                    size={14}
                    className={cn(
                      'text-surface-300 dark:text-surface-600 flex-shrink-0',
                      isRTL && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                )}

                {isLast || !item.href ? (
                  <span
                    itemProp="name"
                    className="font-medium truncate max-w-[200px] text-surface-900 dark:text-white"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <ViewTransitionLink
                    href={item.href}
                    itemProp="item"
                    preset="fade"
                    className="font-medium truncate max-w-[200px] text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                  >
                    <span itemProp="name">{item.label}</span>
                  </ViewTransitionLink>
                )}
                <meta itemProp="position" content={String(position)} />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
