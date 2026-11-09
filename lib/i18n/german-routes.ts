/**
 * Curated German marketing routes. Untranslated pages must never masquerade as German.
 * The launch remains opt-in until the German legal review and QA sign-off.
 */
export const germanMarketingPaths = [
  '/',
  '/contact',
  '/solutions/shopify',
  '/solutions/wordpress',
] as const;

export function isGermanMarketingPath(pathname: string): boolean {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return (germanMarketingPaths as readonly string[]).includes(normalized);
}

export function germanMarketingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED === 'true';
}
