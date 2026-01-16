/**
 * Type-Safe Translation Utility
 * Provides typed translation keys to avoid 'as any' usage
 */

import { useTranslations } from 'next-intl';

// Define all valid translation key paths
type TranslationKey =
  // Common
  | 'common.error'
  | 'common.success'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.loading'
  | 'common.required'
  | 'common.optional'
  // Portal Auth
  | 'portal.auth.title'
  | 'portal.auth.subtitle'
  | 'portal.auth.errors.userNot'
  | 'portal.auth.errors.wrongPassword'
  | 'portal.auth.errors.emailInUse'
  | 'portal.auth.errors.weakPassword'
  | 'portal.auth.errors.invalidEmail'
  | 'portal.auth.errors.tooManyRequests'
  | 'portal.auth.errors.popupClosed'
  // Organization
  | 'organization.createForm.nameLabel'
  | 'organization.createForm.namePlaceholder'
  | 'organization.createForm.website'
  | 'organization.createForm.websiteLabel'
  | 'organization.createForm.websitePlaceholder'
  | 'organization.createForm.industryLabel'
  | 'organization.createForm.industryPlaceholder'
  | 'organization.createForm.errors.name'
  | 'organization.createForm.errors.nameLong'
  | 'organization.createForm.errors.industry'
  // Agency Clients
  | 'agency.clients.detail.editClient'
  | 'agency.clients.detail.info.responsibleAgent'
  | 'agency.clients.detail.info.unassigned'
  | 'agency.clients.detail.info.status'
  | 'agency.clients.badge.active'
  | 'agency.clients.badge.inactive'
  | 'agency.clients.badge.suspended'
  // Pricing/Analyzer
  | `analyzer.sections.${'performance' | 'seo' | 'accessibility' | 'bestPractices' | 'cart' | 'trust'}`
  // Industries
  | 'industries.ecommerce'
  | 'industries.technology'
  | 'industries.healthcare'
  | 'industries.education'
  | 'industries.finance'
  | 'industries.retail'
  | 'industries.other';
// Add more translation keys as needed...

// Create a union type for dynamic key patterns
type DynamicTranslationKey = `analyzer.sections.${string}` | `industries.${string}`;

// Combined type
type ValidTranslationKey = TranslationKey | DynamicTranslationKey;

/**
 * Type-safe translation hook
 * Ensures only valid translation keys can be used
 */
export function useTypedTranslations() {
  const t = useTranslations();

  return {
    // Common methods
    raw: (key: ValidTranslationKey) => t.raw(key as any),
    t: (key: ValidTranslationKey) => t(key as any),

    // Specific helpers for common patterns
    common: {
      error: () => t('common.error' as any),
      success: () => t('common.success' as any),
      cancel: () => t('common.cancel' as any),
      save: () => t('common.save' as any),
      delete: () => t('common.delete' as any),
      edit: () => t('common.edit' as any),
      loading: () => t('common.loading' as any),
    },

    portal: {
      auth: {
        errors: {
          userNot: () => t('portal.auth.errors.userNot' as any),
          wrongPassword: () => t('portal.auth.errors.wrongPassword' as any),
          emailInUse: () => t('portal.auth.errors.emailInUse' as any),
          weakPassword: () => t('portal.auth.errors.weakPassword' as any),
          invalidEmail: () => t('portal.auth.errors.invalidEmail' as any),
          tooManyRequests: () => t('portal.auth.errors.tooManyRequests' as any),
          popupClosed: () => t('portal.auth.errors.popupClosed' as any),
        },
      },
    },

    organization: {
      createForm: {
        nameLabel: () => t('organization.createForm.nameLabel' as any),
        namePlaceholder: () => t('organization.createForm.namePlaceholder' as any),
        website: () => t('organization.createForm.website' as any),
        websiteLabel: () => t('organization.createForm.websiteLabel' as any),
        websitePlaceholder: () => t('organization.createForm.websitePlaceholder' as any),
        industryLabel: () => t('organization.createForm.industryLabel' as any),
        industryPlaceholder: () => t('organization.createForm.industryPlaceholder' as any),
        errors: {
          name: (min: number, max: number) => {
            if (min === 3) return t('organization.createForm.errors.name' as any);
            if (max === 100) return t('organization.createForm.errors.nameLong' as any);
            return 'Invalid name';
          },
          industry: () => t('organization.createForm.errors.industry' as any),
        },
      },
    },

    agency: {
      clients: {
        detail: {
          editClient: () => t('agency.clients.detail.editClient' as any),
          info: {
            responsibleAgent: () => t('agency.clients.detail.info.responsibleAgent' as any),
            unassigned: () => t('agency.clients.detail.info.unassigned' as any),
            status: () => t('agency.clients.detail.info.status' as any),
          },
        },
        badge: {
          active: () => t('agency.clients.badge.active' as any),
          inactive: () => t('agency.clients.badge.inactive' as any),
          suspended: () => t('agency.clients.badge.suspended' as any),
        },
      },
    },

    analyzer: {
      sections: (key: string) => t(`analyzer.sections.${key}` as any),
    },

    industries: {
      ecommerce: () => t('industries.ecommerce' as any),
      technology: () => t('industries.technology' as any),
      healthcare: () => t('industries.healthcare' as any),
      education: () => t('industries.education' as any),
      finance: () => t('industries.finance' as any),
      retail: () => t('industries.retail' as any),
      other: () => t('industries.other' as any),
    },
  };
}

/**
 * Helper for server-side translation access (outside React components)
 */
export function getTranslationKey(key: ValidTranslationKey): ValidTranslationKey {
  return key;
}

// Type assertion helper for dynamic keys
export function asTranslationKey(key: string): ValidTranslationKey {
  return key as ValidTranslationKey;
}
