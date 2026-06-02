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
