'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getRequest } from '@/lib/services/portal-requests';
import { getPricingRequest } from '@/lib/services/pricing-requests';
import { getOrganization } from '@/lib/services/portal-organizations';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
  customLabels?: Record<string, string>;
  maxItems?: number;
}

export function Breadcrumbs({ className, customLabels = {}, maxItems = 4 }: BreadcrumbsProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

  // State for dynamically fetched labels (e.g., request title)
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  // Clear dynamic labels when pathname changes
  useEffect(() => {
    setDynamicLabels({});
  }, [pathname]);

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

  // Extract client ID from path if on a client detail page
  const clientId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/\/agency\/clients\/([^/]+)(?:\/|$)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Fetch request title when on a request detail page
  useEffect(() => {
    if (!requestId) return;

    // Skip fetching for special route segments
    const specialSegments = ['new', 'create', 'edit'];
    if (specialSegments.includes(requestId)) return;

    let cancelled = false;

    async function fetchRequestTitle() {
      try {
        const request = await getRequest(requestId!);
        if (!cancelled && request?.title) {
          setDynamicLabels(prev => ({ ...prev, [requestId!]: request.title }));
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
    if (!pricingId) return;

    // Skip fetching for special route segments
    const specialSegments = ['new', 'create', 'edit', 'calculator'];
    if (specialSegments.includes(pricingId)) return;

    let cancelled = false;

    async function fetchPricingTitle() {
      try {
        const pricing = await getPricingRequest(pricingId!);
        if (!cancelled && pricing?.title) {
          setDynamicLabels(prev => ({ ...prev, [pricingId!]: pricing.title }));
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

  // Fetch client name when on a client detail page
  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    async function fetchClientName() {
      try {
        const client = await getOrganization(clientId!);
        if (!cancelled && client?.name) {
          setDynamicLabels(prev => ({ ...prev, [clientId!]: client.name }));
        }
      } catch (error) {
        console.error('[Breadcrumbs] Error fetching client name:', error);
      }
    }

    fetchClientName();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

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
      calculator: t('portal.breadcrumbs.calculator'),
      sales: t('portal.breadcrumbs.sales'),
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
      });
    }

    // Truncate if too many items
    if (items.length > maxItems) {
      const first = items.slice(0, 1);
      const last = items.slice(-maxItems + 2);
      return [...first, { label: '...', href: '' }, ...last];
    }

    return items;
  }, [pathname, locale, t, customLabels, maxItems, dynamicLabels]);

  if (breadcrumbs.length === 0) return null;

  return <Breadcrumb items={breadcrumbs} className={className} />;
}
