'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OrganizationSwitcherProps } from './types';

export function OrganizationSwitcher({
  organizations,
  currentOrgId,
  onSwitch,
  isExpanded,
}: OrganizationSwitcherProps) {
  const t = useTranslations('portal.accessibility');

  if (!isExpanded || organizations.length <= 1) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-b border-surface-200/50 dark:border-surface-800/30">
      <div className="relative">
        <select
          value={currentOrgId || ''}
          onChange={e => onSwitch(e.target.value)}
          aria-label={t('switchOrganization')}
          className="portal-focus-ring w-full px-3 py-2 text-sm font-medium bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg appearance-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-900 dark:text-white text-start"
        >
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <div
          className="absolute inset-y-0 end-0 flex items-center pe-2 pointer-events-none"
          aria-hidden
        >
          <ChevronDown size={16} className="text-surface-400" />
        </div>
      </div>
    </div>
  );
}
