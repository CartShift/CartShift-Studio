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
  | 'portal.auth.errors.userNotFound'
  | 'portal.auth.errors.wrongPassword'
  | 'portal.auth.errors.emailInUse'
  | 'portal.auth.errors.weakPassword'
  | 'portal.auth.errors.invalidEmail'
  | 'portal.auth.errors.tooManyRequests'
  | 'portal.auth.errors.popupClosed'
  | 'portal.auth.errors.networkError'
  | 'portal.auth.errors.unauthorized'
  // Portal Onboarding
  | 'onboarding.welcome.title'
  | 'onboarding.welcome.subtitle'
  | 'onboarding.welcome.description'
  | 'onboarding.welcome.cta'
  | 'onboarding.info.title'
  | 'onboarding.info.subtitle'
  | 'onboarding.form.orgNameLabel'
  | 'onboarding.form.orgNamePlaceholder'
  | 'onboarding.form.orgNameHint'
  | 'onboarding.form.industryLabel'
  | 'onboarding.form.industrySelectPlaceholder'
  | 'onboarding.form.sizeLabel'
  | 'onboarding.form.sizeSelectPlaceholder'
  | 'onboarding.form.employeesLabel'
  | 'onboarding.back'
  | 'onboarding.form.createButton'
  | 'onboarding.completion.title'
  | 'onboarding.completion.subtitle'
  | 'onboarding.completion.description'
  | 'onboarding.completion.cta'
  | 'onboarding.error'
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
    raw: (key: ValidTranslationKey) => t.raw(key),
    t: (key: ValidTranslationKey) => t(key),

    // Specific helpers for common patterns
    common: {
      error: () => t('common.error'),
      success: () => t('common.success'),
      cancel: () => t('common.cancel'),
      save: () => t('common.save'),
      delete: () => t('common.delete'),
      edit: () => t('common.edit'),
      loading: () => t('common.loading'),
    },

    portal: {
      auth: {
        errors: {
          userNotFound: () => t('portal.auth.errors.userNotFound'),
          wrongPassword: () => t('portal.auth.errors.wrongPassword'),
          emailInUse: () => t('portal.auth.errors.emailInUse'),
          weakPassword: () => t('portal.auth.errors.weakPassword'),
          invalidEmail: () => t('portal.auth.errors.invalidEmail'),
          tooManyRequests: () => t('portal.auth.errors.tooManyRequests'),
          popupClosed: () => t('portal.auth.errors.popupClosed'),
          networkError: () => t('portal.auth.errors.networkError'),
          unauthorized: () => t('portal.auth.errors.unauthorized'),
        },
      },
    },

    onboarding: {
      welcome: {
        title: () => t('onboarding.welcome.title'),
        subtitle: () => t('onboarding.welcome.subtitle'),
        description: () => t('onboarding.welcome.description'),
        cta: () => t('onboarding.welcome.cta'),
      },
      info: {
        title: () => t('onboarding.info.title'),
        subtitle: () => t('onboarding.info.subtitle'),
      },
      form: {
        orgNameLabel: () => t('onboarding.form.orgNameLabel'),
        orgNamePlaceholder: () => t('onboarding.form.orgNamePlaceholder'),
        orgNameHint: () => t('onboarding.form.orgNameHint'),
        industryLabel: () => t('onboarding.form.industryLabel'),
        industrySelectPlaceholder: () => t('onboarding.form.industrySelectPlaceholder'),
        sizeLabel: () => t('onboarding.form.sizeLabel'),
        sizeSelectPlaceholder: () => t('onboarding.form.sizeSelectPlaceholder'),
        employeesLabel: (count: number) => {
          if (count === 1) return '1 ' + t('industries.technology');
          return `${count} ${t('onboarding.form.employeesLabel')}`;
        },
        createButton: () => t('onboarding.form.createButton'),
      },
      back: () => t('onboarding.back'),
      completion: {
        title: () => t('onboarding.completion.title'),
        subtitle: () => t('onboarding.completion.subtitle'),
        description: () => t('onboarding.completion.description'),
        cta: () => t('onboarding.completion.cta'),
      },
      error: () => t('onboarding.error'),
    },

    organization: {
      createForm: {
        nameLabel: () => t('organization.createForm.nameLabel'),
        namePlaceholder: () => t('organization.createForm.namePlaceholder'),
        website: () => t('organization.createForm.website'),
        websiteLabel: () => t('organization.createForm.websiteLabel'),
        websitePlaceholder: () => t('organization.createForm.websitePlaceholder'),
        industryLabel: () => t('organization.createForm.industryLabel'),
        industryPlaceholder: () => t('organization.createForm.industryPlaceholder'),
        errors: {
          name: (min: number, max: number) => {
            if (min === 3) return t('organization.createForm.errors.name');
            if (max === 100) return t('organization.createForm.errors.nameLong');
            return 'Invalid name';
          },
          industry: () => t('organization.createForm.errors.industry'),
        },
      },
    },

    agency: {
      clients: {
        detail: {
          editClient: () => t('agency.clients.detail.editClient'),
          info: {
            responsibleAgent: () => t('agency.clients.detail.info.responsibleAgent'),
            unassigned: () => t('agency.clients.detail.info.unassigned'),
            status: () => t('agency.clients.detail.info.status'),
          },
        },
        badge: {
          active: () => t('agency.clients.badge.active'),
          inactive: () => t('agency.clients.badge.inactive'),
          suspended: () => t('agency.clients.badge.suspended'),
        },
      },
    },

    analyzer: {
      sections: (key: string) => t(`analyzer.sections.${key}` as ValidTranslationKey),
    },

    industries: {
      ecommerce: () => t('industries.ecommerce'),
      technology: () => t('industries.technology'),
      healthcare: () => t('industries.healthcare'),
      education: () => t('industries.education'),
      finance: () => t('industries.finance'),
      retail: () => t('industries.retail'),
      other: () => t('industries.other'),
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
