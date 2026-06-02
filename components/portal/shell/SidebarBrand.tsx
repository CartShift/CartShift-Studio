'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { SidebarBrandProps } from './types';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useBranding } from '@/components/providers/BrandingProvider';

export function SidebarBrand({ isExpanded, isAgency = false }: SidebarBrandProps) {
  const t = useTranslations();
  const { branding } = useBranding();
  const homeHref = isAgency
    ? getPortalPath('/agency/workboard/')
    : getPortalPath('/dashboard/');

  // Determine which logo to show
  // If expanded: Use branding.logoUrl (full logo) if it exists, otherwise use default icon + text
  // If collapsed: Use branding.iconUrl (mark) if it exists, otherwise use default icon

  return (
    <div className="h-[68px] flex items-center px-3.5 border-b border-surface-800/40 flex-shrink-0">
      <Link
        href={homeHref}
        className="flex items-center gap-2.5 group w-full min-w-0"
      >
        {(!isExpanded || !branding?.logoUrl) && (
          <div className="w-8 h-8 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300">
            {branding?.iconUrl ? (
              <img
                src={branding.iconUrl}
                alt="Brand Icon"
                className={`w-full h-full object-contain ${branding.invertLogoInDarkMode ? 'dark:brightness-0 dark:invert' : ''}`}
              />
            ) : (
              <Image
                src="/images/CarShift-Icon-Colored.png"
                alt="CartShift Studio"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            )}
          </div>
        )}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col leading-none"
          >
            {branding?.logoUrl ? (
              // If text logo is available, we might want to hide the icon or show this instead?
              // Usually a "logoUrl" includes the icon and text.
              // If logoUrl is present, hiding the icon adjacent to it might be needed, or replacing the whole block.
              // But the structure above separates icon div and text div.
              // Let's assume logoUrl is TEXT mostly or full logo.
              // If logoUrl is present, we might want to replace the text part with an image if it's an image.
              <img
                src={branding.logoUrl}
                alt="Brand Logo"
                className={`h-7 object-contain object-left max-w-[132px] ${branding.invertLogoInDarkMode ? 'dark:brightness-0 dark:invert' : ''}`}
              />
            ) : (
              <>
                <span className="font-bold text-sm tracking-tight text-surface-100 truncate">
                  {t('portal.sidebar.title')}
                </span>
                <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider mt-0.5 opacity-90">
                  {t('portal.sidebar.subtitle')}
                </span>
              </>
            )}
          </motion.div>
        )}
      </Link>
    </div>
  );
}
