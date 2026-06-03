'use client';

import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { SidebarBrandProps } from './types';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useBranding } from '@/components/providers/BrandingProvider';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

export function SidebarBrand({
  isExpanded,
  isAgency = false,
  isSidebarOpen,
  onToggleSidebar,
}: SidebarBrandProps) {
  const t = useTranslations();
  const tA11y = useTranslations('portal.accessibility');
  const { branding } = useBranding();
  const homeHref = isAgency ? getPortalPath('/agency/workboard/') : getPortalPath('/dashboard/');

  const collapseLabel = isSidebarOpen
    ? t('portal.sidebar.collapse')
    : tA11y('expandSidebar');

  const toggleButton = (
    <button
      type="button"
      onClick={onToggleSidebar}
      className={cn(
        'portal-focus-ring hidden md:flex shrink-0 items-center justify-center',
        'w-8 h-8 rounded-lg touch-target-sm',
        'text-surface-400 hover:text-surface-100 hover:bg-white/5',
        'transition-colors duration-200'
      )}
      aria-label={isSidebarOpen ? tA11y('collapseSidebar') : tA11y('expandSidebar')}
    >
      <ChevronLeft
        size={18}
        className={cn(
          'rtl:rotate-180 transition-transform duration-300 ease-out',
          !isSidebarOpen && 'rotate-180 rtl:rotate-0'
        )}
        aria-hidden
      />
    </button>
  );

  return (
    <div className="h-[var(--portal-header-height)] flex items-center gap-1.5 px-2.5 md:px-3 border-b border-surface-800/40 flex-shrink-0">
      <Link
        href={homeHref}
        className={cn(
          'flex items-center gap-2.5 group min-w-0 transition-[flex]',
          isExpanded ? 'flex-1' : 'flex-1 justify-center'
        )}
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
            className="flex flex-col leading-none min-w-0"
          >
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Brand Logo"
                className={`h-6 object-contain object-left max-w-[124px] ${branding.invertLogoInDarkMode ? 'dark:brightness-0 dark:invert' : ''}`}
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

      {!isExpanded ? (
        <Tooltip content={collapseLabel} side="end" delay={0.15}>
          {toggleButton}
        </Tooltip>
      ) : (
        toggleButton
      )}
    </div>
  );
}
