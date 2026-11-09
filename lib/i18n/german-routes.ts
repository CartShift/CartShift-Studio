/**
 * Curated German marketing routes. Untranslated pages must never masquerade as German.
 * The launch remains opt-in until the German legal review and QA sign-off.
 */
export const germanMarketingPaths = [
  '/',
  '/contact',
  '/about',
  '/work',
  '/solutions/seo',
  '/solutions/shopify',
  '/solutions/wordpress',
] as const;

export function isGermanMarketingPath(pathname: string): boolean {
  const normalized = pathname === '/' || pathname === '' ? '/' : pathname.replace(/\/$/, '');
  return (germanMarketingPaths as readonly string[]).includes(normalized);
}

/**
 * An incomplete translation is not a German-language page.
 * Both toggles must be explicitly enabled only after automated source parity
 * and human review. Preview and production default to closed.
 */
export function germanMarketingEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED === 'true' &&
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED === 'true'
  );
}
