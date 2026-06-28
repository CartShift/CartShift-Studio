const platformPatterns = [
  {
    name: 'Shopify',
    patterns: [
      /cdn\.shopify\.com/i,
      /myshopify\.com/i,
      /shopify-features/i,
      /shopify-payment-button/i,
      /shopify\.theme/i,
    ],
  },
  {
    name: 'WooCommerce',
    patterns: [/wp-content\/plugins\/woocommerce/i, /wc-ajax/i, /wp-json\/wc/i],
  },
  { name: 'Magento', patterns: [/static\/_requirejs/i, /magento/i] },
  { name: 'BigCommerce', patterns: [/cdn\.bigcommerce\.com/i, /mybigcommerce\.com/i] },
  { name: 'Wix', patterns: [/wix-image/i, /wix-code/i, /wix\.com\/_partials/i] },
  { name: 'Squarespace', patterns: [/squarespace-cdn/i, /sqsp\.net/i] },
  { name: 'PrestaShop', patterns: [/prestashop/i] },
];

export function detectPlatform(html: string, url: string): string | null {
  const combined = html + ' ' + url;
  for (const platform of platformPatterns) {
    for (const pattern of platform.patterns) {
      if (pattern.test(combined)) {
        return platform.name;
      }
    }
  }
  return null;
}

export function getScoreStatus(score: number): 'critical' | 'warning' | 'good' | 'excellent' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}
