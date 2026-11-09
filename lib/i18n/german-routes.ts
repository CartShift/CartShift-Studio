/**
 * Marketing/public website paths, shared by EN, HE and DE.
 *
 * These routes do NOT mean the German site is published. The German rollout
 * remains fail-closed until translation and legal review are explicitly signed
 * off. Keep personal/private portal, private reports and unreviewed UGC out.
 */
export const germanMarketingPaths = [
  '/',
  '/about',
  '/contact',
  '/work',
  '/blog',
  '/solutions/seo',
  '/solutions/shopify',
  '/solutions/wordpress',
  '/services/shopify-conversion-optimization',
  '/services/shopify-b2b-integrations',
  '/services/shopify-performance-seo',
  '/services/shopify-subscriptions',
  '/services/wordpress-security',
  '/free-store-review',
  '/tools',
  '/tools/client-portal',
  '/tools/store-analyzer',
  '/privacy',
  '/terms',
  '/pricing',
  '/maintenance',
] as const;

const dynamicPublicPaths = [
  /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/work\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/industries\/(?:fashion|food|health|tech|arts|local)$/,
  /^\/services\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/tools\/store-analyzer\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
] as const;

export function isGermanMarketingPath(pathname: string): boolean {
  const normalized = pathname === '/' || pathname === ''
    ? '/'
    : pathname.replace(/\/$/, '');
  return (germanMarketingPaths as readonly string[]).includes(normalized)
    || dynamicPublicPaths.some(pattern => pattern.test(normalized));
}

/**
 * Both flags must be set explicitly after a passing build, German-language
 * review, verified Impressum, GDPR/cookie audit and successful browser QA.
 * Neither preview nor production enables German implicitly.
 */
export function germanMarketingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED === 'true'
    && process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED === 'true';
}
