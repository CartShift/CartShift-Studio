/**
 * Canonical next-intl wrappers for CartShift namespaces.
 *
 * Prefer these over raw `useTranslations()` / `getTranslations()` so
 * portal, website, common, and analyzer call sites stay consistent.
 */
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

type AppLocale = 'en' | 'he';
type PortalNamespace = 'portal' | `portal.${string}`;

function toAppLocale(locale: string): AppLocale {
  if (locale === 'en' || locale === 'he') return locale;
  throw new Error(`Unsupported locale: ${locale}`);
}

/** Portal UI — keys are relative to `portal` (e.g. `dashboard.title`). */
export function usePortalTranslations(namespace: PortalNamespace = 'portal') {
  return useTranslations(namespace as 'portal');
}

/** Shared chrome / nav / errors from `common.json` top-level keys. */
export function useCommonTranslations() {
  return useTranslations();
}

/**
 * Marketing / website copy. Root hook is intentional: website keys live at
 * the top level of the merged message tree (`hero`, `nav`, `analyzer`, …).
 */
export function useWebsiteTranslations() {
  return useTranslations();
}

/** Store analyzer namespace (`analyzer.*` in website messages). */
export function useAnalyzerTranslations() {
  return useTranslations('analyzer');
}

/** CV standalone page. */
export function useCvTranslations() {
  return useTranslations('cv');
}

/** Proposal standalone page. */
export function useProposalTranslations() {
  return useTranslations('proposal');
}

/** Server equivalent of `usePortalTranslations`. */
export async function getPortalTranslations(
  options?:
    | PortalNamespace
    | {
        locale?: string;
        namespace?: PortalNamespace;
      }
) {
  if (typeof options === 'string' || options === undefined) {
    return getTranslations((options ?? 'portal') as 'portal');
  }
  const { locale, namespace } = options;
  if (locale !== undefined) {
    return getTranslations({
      locale: toAppLocale(locale),
      namespace: (namespace ?? 'portal') as 'portal',
    });
  }
  return getTranslations((namespace ?? 'portal') as 'portal');
}

/** Server equivalent of `useWebsiteTranslations` / `useCommonTranslations`. */
export async function getCommonTranslations(locale?: string) {
  return locale !== undefined
    ? getTranslations({ locale: toAppLocale(locale) })
    : getTranslations();
}

export async function getAnalyzerTranslations(locale?: string) {
  return locale !== undefined
    ? getTranslations({ locale: toAppLocale(locale), namespace: 'analyzer' })
    : getTranslations('analyzer');
}

export async function getCvTranslations(locale?: string) {
  return locale !== undefined
    ? getTranslations({ locale: toAppLocale(locale), namespace: 'cv' })
    : getTranslations('cv');
}
