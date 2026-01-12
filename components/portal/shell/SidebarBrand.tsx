'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { SidebarBrandProps } from './types';
import { getPortalPath } from '@/lib/utils/portal-paths';

export function SidebarBrand({ isExpanded }: SidebarBrandProps) {
  const t = useTranslations();

  return (
    <div className="h-20 flex items-center px-4 border-b border-surface-200/50 dark:border-surface-800/30 flex-shrink-0">
      <Link
        href={getPortalPath('/dashboard/')}
        className="flex items-center gap-3 group w-full min-w-0"
      >
        <div className="w-9 h-9 flex-shrink-0 relative group-hover:scale-110 transition-transform duration-300">
          <Image
            src="/images/CarShift-Icon-Colored.png"
            alt="CartShift Studio"
            fill
            className="object-contain"
            priority
          />
        </div>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col leading-none"
          >
            <span className="font-bold text-base tracking-tight text-surface-900 dark:text-white truncate">
              {t('portal.sidebar.title')}
            </span>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-0.5 opacity-80">
              {t('portal.sidebar.subtitle')}
            </span>
          </motion.div>
        )}
      </Link>
    </div>
  );
}
