'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
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
      <Select
        value={currentOrgId || ''}
        onChange={e => onSwitch(e.target.value)}
        aria-label={t('switchOrganization')}
        className="text-sm font-medium cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800"
        options={organizations.map(org => ({
          value: org.id,
          label: org.name,
        }))}
      />
    </div>
  );
}
