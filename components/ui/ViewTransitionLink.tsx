'use client';

import { forwardRef, type ReactNode } from 'react';
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
    const { startViewTransition, isSupported } = useViewTransition();

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
      <a ref={ref} href={href} onClick={handleClick} className={className} {...props}>
        {children}
      </a>
    );
  }
);

ViewTransitionLink.displayName = 'ViewTransitionLink';
