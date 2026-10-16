'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { OrganizationSwitcherProps } from './types';

function dedupeOrganizations(organizations: OrganizationSwitcherProps['organizations']) {
  const seen = new Set<string>();
  return organizations.filter(org => {
    if (seen.has(org.id)) return false;
    seen.add(org.id);
    return true;
  });
}

export function OrganizationSwitcher({
  organizations,
  currentOrgId,
  onSwitch,
  isExpanded,
}: OrganizationSwitcherProps) {
  const t = useTranslations('portal.accessibility');

  const uniqueOrganizations = useMemo(
    () => dedupeOrganizations(organizations),
    [organizations]
  );

  const currentOrg = uniqueOrganizations.find(org => org.id === currentOrgId);
  const nameCounts = new Map<string, number>();
  for (const org of uniqueOrganizations) {
    nameCounts.set(org.name, (nameCounts.get(org.name) ?? 0) + 1);
  }
  const orgLabel = (org: (typeof uniqueOrganizations)[number]) =>
    (nameCounts.get(org.name) ?? 0) > 1
      ? `${org.name} · ${org.id.slice(-6)}`
      : org.name;

  if (!isExpanded || uniqueOrganizations.length <= 1 || !currentOrg) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-b border-surface-800/40">
      <div className="mb-1.5 px-1 text-[11px] font-semibold text-surface-400">
        {t('switchOrganization')}
      </div>
      <Select
        value={currentOrgId ?? ''}
        valueLabel={orgLabel(currentOrg)}
        onValueChange={onSwitch}
        aria-label={t('switchOrganization')}
        className="h-9 border-surface-700/60 bg-surface-900/60 text-surface-100 shadow-none hover:bg-surface-800/80 hover:border-surface-600/60 focus:border-primary-400 focus:ring-primary-400/20 dark:border-surface-700/60 dark:bg-surface-900/60 dark:text-surface-100 dark:hover:bg-surface-800/80"
        options={uniqueOrganizations.map(org => ({
          value: org.id,
          label: orgLabel(org),
        }))}
      />
    </div>
  );
}
