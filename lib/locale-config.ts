import { he, enUS } from 'date-fns/locale';

export interface LocaleConfig {
  /** Text direction for the locale */
  direction: 'ltr' | 'rtl';
  /** Date formatting locale */
  dateLocale: typeof enUS;
  /** Locale string for JavaScript Date methods */
  dateLocaleString: string;
  /** Font family to use */
  fontFamily: string;
  /** Whether this is an RTL locale */
  isRTL: boolean;
}

/**
 * Centralized locale configuration
 * Maps locale codes to their configuration
 */
export const LOCALE_CONFIG: Record<string, LocaleConfig> = {
  en: {
    direction: 'ltr',
    dateLocale: enUS,
    dateLocaleString: 'en-US',
    fontFamily: 'font-outfit',
    isRTL: false,
  },
  he: {
    direction: 'rtl',
    dateLocale: he,
    dateLocaleString: 'he-IL',
    fontFamily: 'font-rubik',
    isRTL: true,
  },
};

/**
 * Get locale configuration for a given locale
 */
export function getLocaleConfig(locale: string): LocaleConfig {
  return LOCALE_CONFIG[locale] || LOCALE_CONFIG['en'];
}

/**
 * Get direction for a locale
 */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  return getLocaleConfig(locale).direction;
}

/**
 * Get date locale for a locale
 */
export function getDateLocale(locale: string) {
  return getLocaleConfig(locale).dateLocale;
}

/**
 * Get date locale string for a locale
 */
export function getDateLocaleString(locale: string): string {
  return getLocaleConfig(locale).dateLocaleString;
}

/**
 * Get font family for a locale
 */
export function getLocaleFontFamily(locale: string): string {
  return getLocaleConfig(locale).fontFamily;
}

/**
 * Check if a locale is RTL
 */
export function isRTLLocale(locale: string): boolean {
  return getLocaleConfig(locale).isRTL;
}
