'use client';

import { forwardRef, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  useViewTransition,
  type ViewTransitionOptions,
  type TransitionPreset,
} from '@/lib/hooks/useViewTransition';

export interface ViewTransitionLinkProps extends Omit<React.ComponentPropsWithoutRef<'a'>, 'ref'> {
  children: ReactNode;
  href: string;
  viewTransition?: boolean;
  transitionOptions?: Omit<ViewTransitionOptions, 'skipTransition'>;
  preset?: TransitionPreset;
}

function getCrawlableHref(href: string, locale: string): string {
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    /^https?:\/\//i.test(href)
  ) {
    return href;
  }

  const path = href.startsWith('/') ? href : `/${href}`;

  if (path === '/') {
    return `/${locale}`;
  }

  if (/^\/(en|he)(?:\/|$)/.test(path)) {
    return path;
  }

  return `/${locale}${path}`;
}

export const ViewTransitionLink = forwardRef<HTMLAnchorElement, ViewTransitionLinkProps>(
  (
    {
      children,
      viewTransition = true,
      transitionOptions,
      preset,
      onClick,
      href,
      className,
      ...props
    },
    ref
  ) => {
    const router = useRouter();
    const locale = useLocale();
    const { startViewTransition, isSupported } = useViewTransition();
    const crawlableHref = getCrawlableHref(href, locale);

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e);
      }

      if (!viewTransition || e.defaultPrevented) {
        return;
      }

      const isExternalLink = props.target === '_blank' || props.rel?.includes('external');
      const isHashLink = href.startsWith('#');
      const isMailto = href.startsWith('mailto:');
      const isTel = href.startsWith('tel:');

      if (isExternalLink || isHashLink || isMailto || isTel) {
        return;
      }

      if (!isSupported) {
        return;
      }

      e.preventDefault();

      await startViewTransition(
        () => {
          router.push(href);
        },
        {
          ...transitionOptions,
          preset,
          disableForReducedMotion: true,
        }
      );
    };

    return (
      <a ref={ref} href={crawlableHref} onClick={handleClick} className={className} {...props}>
        {children}
      </a>
    );
  }
);

ViewTransitionLink.displayName = 'ViewTransitionLink';
