'use client';

import { PortalNavItem } from '@/components/portal/ui/PortalNavItem';
import type { LucideIcon } from 'lucide-react';

export const AGENCY_SETTINGS_TAB_IDS = [
  'profile',
  'branding',
  'user-profile',
  'services',
  'team',
  'integrations',
  'billing',
  'system',
] as const;

export type AgencySettingsTabId = (typeof AGENCY_SETTINGS_TAB_IDS)[number];

export function isAgencySettingsTab(value: string | null): value is AgencySettingsTabId {
  return value !== null && (AGENCY_SETTINGS_TAB_IDS as readonly string[]).includes(value);
}

export interface AgencySettingsTab {
  id: AgencySettingsTabId;
  label: string;
  icon: LucideIcon;
}

interface AgencySettingsNavGroup {
  label: string;
  tabIds: AgencySettingsTabId[];
}

interface AgencySettingsNavProps {
  tabs: AgencySettingsTab[];
  groups: AgencySettingsNavGroup[];
  activeTab: AgencySettingsTabId;
  onSelect: (tabId: AgencySettingsTabId) => void;
}

export function AgencySettingsNav({
  tabs,
  groups,
  activeTab,
  onSelect,
}: AgencySettingsNavProps) {
  const tabById = new Map(tabs.map(tab => [tab.id, tab]));

  return (
    <nav className="space-y-5" aria-label="Agency settings">
      {groups.map(group => {
        const groupTabs = group.tabIds
          .map(id => tabById.get(id))
          .filter((tab): tab is AgencySettingsTab => Boolean(tab));

        if (groupTabs.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="portal-label-sm text-[10px] px-3 mb-1.5">{group.label}</p>
            <div className="space-y-1">
              {groupTabs.map(tab => (
                <PortalNavItem
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  active={activeTab === tab.id}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  onClick={() => onSelect(tab.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
