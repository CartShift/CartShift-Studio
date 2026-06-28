'use client';

import { PortalNavItem } from '@/components/portal/ui/PortalNavItem';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CLIENT_SETTINGS_TAB_IDS = [
  'general',
  'profile',
  'notifications',
  'security',
  'billing',
] as const;

export type ClientSettingsTabId = (typeof CLIENT_SETTINGS_TAB_IDS)[number];

export function isClientSettingsTab(value: string | null): value is ClientSettingsTabId {
  return value !== null && (CLIENT_SETTINGS_TAB_IDS as readonly string[]).includes(value);
}

export interface ClientSettingsTab {
  id: ClientSettingsTabId;
  label: string;
  icon: LucideIcon;
}

interface ClientSettingsNavProps {
  tabs: ClientSettingsTab[];
  activeTab: ClientSettingsTabId;
  onSelect: (tabId: ClientSettingsTabId) => void;
  className?: string;
}

export function ClientSettingsNav({ tabs, activeTab, onSelect, className }: ClientSettingsNavProps) {
  return (
    <nav
      className={cn(
        'flex lg:flex-col gap-2 lg:gap-1.5 lg:sticky lg:top-24 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible pb-1',
        className
      )}
      aria-label="Workspace settings"
    >
      {tabs.map(tab => (
        <PortalNavItem
          key={tab.id}
          label={tab.label}
          icon={tab.icon}
          active={activeTab === tab.id}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
          className="whitespace-nowrap shrink-0 lg:w-full min-h-[48px] px-4 py-3 touch-manipulation"
        />
      ))}
    </nav>
  );
}
