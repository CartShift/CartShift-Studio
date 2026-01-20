'use client';

import { ChevronLeft } from 'lucide-react';
import { OrganizationSwitcherProps } from './types';

export function OrganizationSwitcher({
  organizations,
  currentOrgId,
  onSwitch,
  isExpanded,
}: OrganizationSwitcherProps) {
  if (!isExpanded || organizations.length <= 1) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-b border-surface-200/50 dark:border-surface-800/30">
      <div className="relative">
        <select
          value={currentOrgId || ''}
          onChange={e => onSwitch(e.target.value)}
          className="w-full px-3 py-2 text-sm font-medium bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg appearance-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-surface-900 dark:text-white"
        >
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 end-0 flex items-center pe-2 pointer-events-none">
          <ChevronLeft size={16} className="rotate-[-90deg] text-surface-400" />
        </div>
      </div>
    </div>
  );
}
