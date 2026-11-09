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
 * Protected QA: Vercel's framework public system variables make the dedicated
 * feature-branch preview testable without writing team-level environment vars.
 * The branch-specific exception is never active in production or on main.
 */
export function germanMarketingEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED === 'true') return true;
  if (process.env.NEXT_PUBLIC_CARTSHIFT_DE_PREVIEW === 'true') return true;
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'feat/german-market-launch-20261109'
  );
}
