'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { isRTLLocale } from '@/lib/locale-config';
import { getRequest } from '@/lib/services/portal-requests';
import { getPricingRequest } from '@/lib/services/pricing-requests';
import { getPortalPath } from '@/lib/utils/portal-paths';

const breadcrumbItemVariants = cva(
  "truncate max-w-[200px] transition-colors",
  {
    variants: {
      active: {
        true: "font-semibold text-surface-900 dark:text-white",
        false: "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:underline underline-offset-4 decoration-2 decoration-surface-300 dark:decoration-surface-700 max-w-[150px]",
      },
      truncated: {
        true: "text-surface-400 px-1",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      truncated: false,
    },
  }
);

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
  customLabels?: Record<string, string>;
  maxItems?: number;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumbs({
  className,
  customLabels = {},
  maxItems = 4,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const isRTL = isRTLLocale(locale);

  // State for dynamically fetched labels (e.g., request title)
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  // Extract request ID from path if on a request detail page
  const requestId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/\/requests\/([^/]+)(?:\/|$)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Extract pricing ID from path if on a pricing detail page
  const pricingId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/\/pricing\/([^/]+)(?:\/|$)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Fetch request title when on a request detail page
  useEffect(() => {
    if (!requestId) {
      setDynamicLabels({});
      return;
    }

    let cancelled = false;

    async function fetchRequestTitle() {
      try {
        const request = await getRequest(requestId!);
        if (!cancelled && request?.title) {
          setDynamicLabels({ [requestId!]: request.title });
        }
      } catch (error) {
        console.error('[Breadcrumbs] Error fetching request title:', error);
      }
    }

    fetchRequestTitle();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  // Fetch pricing offer title when on a pricing detail page
  useEffect(() => {
    if (!pricingId) {
      return;
    }

    let cancelled = false;

    async function fetchPricingTitle() {
      try {
        const pricing = await getPricingRequest(pricingId!);
        if (!cancelled && pricing?.title) {
          setDynamicLabels((prev) => ({ ...prev, [pricingId!]: pricing.title }));
        }
      } catch (error) {
        console.error('[Breadcrumbs] Error fetching pricing offer title:', error);
      }
    }

    fetchPricingTitle();

    return () => {
      cancelled = true;
    };
  }, [pricingId]);

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!pathname) return [];

    // Remove locale prefix and split path
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    const segments = pathWithoutLocale.split('/').filter(Boolean);

    // Don't show breadcrumbs for root paths
    if (segments.length <= 2) return [];

    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    // Translation map for common path segments
    const segmentLabels: Record<string, string> = {
      portal: t('portal.breadcrumbs.portal'),
      org: t('portal.breadcrumbs.organization'),
      dashboard: t('portal.breadcrumbs.dashboard'),
      requests: t('portal.breadcrumbs.requests'),
      settings: t('portal.breadcrumbs.settings'),
      team: t('portal.breadcrumbs.team'),
      files: t('portal.breadcrumbs.files'),
      pricing: t('portal.breadcrumbs.pricing'),
      consultations: t('portal.breadcrumbs.consultations'),
      agency: t('portal.breadcrumbs.agency'),
      workboard: t('portal.breadcrumbs.workboard'),
      clients: t('portal.breadcrumbs.clients'),
      new: t('portal.breadcrumbs.new'),
      ...customLabels,
    };

    // Skip 'portal' from visible breadcrumbs, but keep them in path

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Skip 'portal' and 'org' segments, and org IDs from visible items
      if (segment === 'portal' || segment === 'org') continue;

      // Skip org ID (looks like a random ID)
      if (segments[i - 1] === 'org' && segment.length > 10) continue;

      const isLast = i === segments.length - 1;

      // Get label: dynamic (e.g., request title) > custom > translation > formatted segment
      let label = dynamicLabels[segment] || customLabels[segment] || segmentLabels[segment];

      if (!label) {
        // Format segment: kebab-case to Title Case
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      items.push({
        label,
        href: getPortalPath(currentPath),
        isLast,
      });
    }

    // Truncate if too many items
    if (items.length > maxItems) {
      const first = items.slice(0, 1);
      const last = items.slice(-maxItems + 2);
      return [...first, { label: '...', href: '', isLast: false }, ...last];
    }

    return items;
  }, [pathname, locale, t, customLabels, maxItems, dynamicLabels]);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-sm overflow-x-auto scrollbar-hide', className)}
    >


      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 flex-shrink-0">
          {index > 0 && (
            <ChevronRight
              size={14}
              className={cn(
                'text-surface-300 dark:text-surface-700 flex-shrink-0',
                isRTL && 'rotate-180'
              )}
            />
          )}
          {item.label === '...' ? (
            <span className={breadcrumbItemVariants({ truncated: true })}>...</span>
          ) : item.isLast ? (
            <span
              className={breadcrumbItemVariants({ active: true })}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className={breadcrumbItemVariants({ active: false })}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export { breadcrumbItemVariants };
