import type {
  AnalysisConfidence,
  AnalysisSource,
  DeeperScanAnalysis,
  ProductAnalysis,
  Recommendation,
  SectionResult,
} from '@/lib/types/analyzer';

type SignalState = 'present' | 'weak' | 'missing';

interface CartSignal {
  key: string;
  label: string;
  state: SignalState;
  evidence: string;
  weight: number;
}

interface CartAnalyzerOptions {
  productAnalysis?: ProductAnalysis;
  deeperScan?: DeeperScanAnalysis;
  platform?: string | null;
}

function getScoreStatus(score: number): SectionResult['status'] {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function createRecommendation(
  code: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick',
  source: AnalysisSource = 'static_html',
  confidence: AnalysisConfidence = 'estimated',
  limitation?: string
): Recommendation {
  return {
    code,
    title,
    impact,
    description,
    action,
    evidence,
    effort,
    serviceLink: '/contact',
    source,
    confidence,
    exactEvidence: [evidence],
    limitation,
  };
}

function hasPattern(html: string, pattern: RegExp): boolean {
  return pattern.test(html);
}

function signal(
  key: string,
  label: string,
  state: SignalState,
  evidence: string,
  weight: number
): CartSignal {
  return { key, label, state, evidence, weight };
}

export function analyzeCartExperience(
  html: string,
  options: CartAnalyzerOptions = {}
): SectionResult {
  const { productAnalysis, deeperScan, platform } = options;
  const hasProductSample = Boolean(productAnalysis);
  const hasCartInteraction = Boolean(deeperScan?.cartInteractionSucceeded);
  const staticCheckoutLimitation =
    'Checkout quality was not tested; this is based on static HTML signals only.';
  const signals: CartSignal[] = [];
  const recommendations: Recommendation[] = [];

  const cartEntryVisible =
    hasPattern(html, /href=["'][^"']*(\/cart|cart|basket|bag)[^"']*["']/i) ||
    hasPattern(html, /class=["'][^"']*(cart|basket|bag)[^"']*["']/i) ||
    hasPattern(html, /aria-label=["'][^"']*(cart|basket|bag)[^"']*["']/i);

  signals.push(
    signal(
      'cart-entry',
      'Cart entry point',
      cartEntryVisible ? 'present' : 'missing',
      cartEntryVisible
        ? 'A cart, basket, or bag link/label was detected in the page chrome.'
        : 'No persistent cart, basket, or bag link/label was detected.',
      18
    )
  );

  const addToCartSignal =
    hasPattern(html, /add\s*to\s*(cart|bag)|buy\s*now|add\s*item|purchase/i) ||
    hasPattern(html, /name=["']add["']|id=["'][^"']*addtocart[^"']*["']/i) ||
    hasPattern(html, /class=["'][^"']*(add-to-cart|product-form__submit)[^"']*["']/i);

  const productButtonKnown = productAnalysis?.cartActionabilityStatus;
  const productButtonActionable =
    productButtonKnown === 'clickable' || productButtonKnown === 'redirected_to_cart';

  signals.push(
    signal(
      'purchase-action',
      'Purchase action',
      addToCartSignal || productButtonActionable
        ? 'present'
        : productButtonKnown === 'detected'
          ? 'weak'
          : 'missing',
      productButtonActionable
        ? `A product-page cart action was ${productButtonKnown.replace(/_/g, ' ')}.`
        : addToCartSignal
          ? 'Add-to-cart or buy-now copy was detected in static markup.'
          : productButtonKnown === 'detected'
            ? 'A product-page cart action exists but was not confirmed clickable.'
            : 'No clear add-to-cart, buy-now, or purchase action was detected.',
      24
    )
  );

  const checkoutPath =
    hasPattern(html, /href=["'][^"']*(\/checkout|checkout)[^"']*["']/i) ||
    hasPattern(html, /action=["'][^"']*(\/cart|\/checkout|checkout)[^"']*["']/i) ||
    productAnalysis?.cartActionabilityStatus === 'redirected_to_cart' ||
    Boolean(deeperScan?.cartInteraction?.checkoutLinkDetected);

  signals.push(
    signal(
      'checkout-path',
      'Checkout path',
      checkoutPath ? 'present' : cartEntryVisible ? 'weak' : 'missing',
      checkoutPath
        ? hasCartInteraction
          ? 'A checkout path was detected after a sampled cart interaction.'
          : 'A checkout or cart form path was detected.'
        : cartEntryVisible
          ? 'A cart entry exists, but no checkout form or direct checkout path was visible.'
          : 'No checkout path was detected from homepage or sampled product signals.',
      18
    )
  );

  const paymentCues = hasPattern(
    html,
    /visa|mastercard|amex|paypal|apple\s*pay|google\s*pay|shop\s*pay|klarna|afterpay|payment|payments/i
  );

  signals.push(
    signal(
      'payment-cues',
      'Payment confidence',
      paymentCues ? 'present' : 'missing',
      paymentCues
        ? 'Payment method or secure payment language was detected.'
        : 'No payment method, wallet, or secure payment cue was detected.',
      12
    )
  );

  const policyCues = hasPattern(
    html,
    /returns?|refund|shipping|delivery|warranty|guarantee|secure|ssl|privacy|terms/i
  );

  signals.push(
    signal(
      'policy-cues',
      'Policy reassurance',
      policyCues ? 'present' : 'missing',
      policyCues
        ? 'Shipping, return, warranty, privacy, or security reassurance was detected.'
        : 'No shipping, return, warranty, privacy, or security reassurance was detected.',
      14
    )
  );

  if (platform === 'Shopify') {
    const shopifyAcceleratedCheckout = hasPattern(
      html,
      /shopify-payment-button|shopify_pay|dynamic-checkout|shop-pay/i
    );

    signals.push(
      signal(
        'express-checkout',
        'Express checkout',
        shopifyAcceleratedCheckout ? 'present' : 'weak',
        shopifyAcceleratedCheckout
          ? 'Shopify accelerated checkout markup was detected.'
          : 'Shopify was detected, but accelerated checkout markup was not visible in static HTML.',
        8
      )
    );
  }

  if (productAnalysis) {
    signals.push(
      signal(
        'above-fold-product-cta',
        'Product CTA placement',
        productAnalysis.hasBuyButtonAboveFold ? 'present' : 'weak',
        productAnalysis.hasBuyButtonAboveFold
          ? 'The sampled product page shows the buy button above the fold.'
          : 'The sampled product page did not show the buy button above the fold.',
        6
      )
    );
  }

  if (deeperScan?.categorySamples?.length) {
    const categoryWithGrid = deeperScan.categorySamples.some(sample => sample.visibleProductGrid);
    signals.push(
      signal(
        'category-sample',
        'Category browsing sample',
        categoryWithGrid ? 'present' : 'weak',
        categoryWithGrid
          ? `${deeperScan.categorySamples.length} sampled category page(s) exposed product-listing structure.`
          : `${deeperScan.categorySamples.length} sampled category page(s) did not clearly expose product-listing structure.`,
        6
      )
    );
  }

  if (deeperScan?.cartInteraction?.attempted) {
    signals.push(
      signal(
        'cart-interaction',
        'Cart interaction sample',
        deeperScan.cartInteractionSucceeded ? 'present' : 'weak',
        deeperScan.cartInteractionSucceeded
          ? 'A sampled add-to-cart interaction exposed cart or checkout UI.'
          : 'A sampled add-to-cart interaction did not confirm cart or checkout UI.',
        12
      )
    );
  }

  let score = 12;
  for (const item of signals) {
    if (item.state === 'present') score += item.weight;
    if (item.state === 'weak') score += Math.round(item.weight * 0.45);
  }

  if (!cartEntryVisible) {
    recommendations.push(
      createRecommendation(
        'cart-visible',
        'Make the cart easy to find',
        'high',
        'A hidden cart creates friction for returning shoppers and makes checkout feel less predictable.',
        'Add a persistent cart entry point in the header with a clear icon, accessible label, and item count.',
        signals.find(item => item.key === 'cart-entry')?.evidence ??
          'Cart entry point was missing.',
        'medium',
        'static_html',
        'estimated',
        staticCheckoutLimitation
      )
    );
  }

  if (!addToCartSignal && !productButtonActionable) {
    recommendations.push(
      createRecommendation(
        'add-to-cart-missing',
        'Make the purchase action unmistakable',
        hasProductSample ? 'high' : 'medium',
        'If shoppers cannot immediately identify how to add an item to cart, product intent leaks before checkout begins.',
        'Use a high-contrast add-to-cart or buy-now button on product cards and product pages, with disabled states reserved only for unavailable variants.',
        signals.find(item => item.key === 'purchase-action')?.evidence ??
          'Purchase action was missing.',
        'medium',
        hasProductSample ? 'product_sample' : 'static_html',
        hasProductSample && hasCartInteraction ? 'verified' : 'insufficient_evidence',
        hasProductSample ? undefined : staticCheckoutLimitation
      )
    );
  }

  if (!checkoutPath) {
    recommendations.push(
      createRecommendation(
        'checkout-path-missing',
        'Expose a predictable checkout path',
        hasCartInteraction && !checkoutPath ? 'high' : 'medium',
        'A clear path from cart to checkout reduces hesitation and prevents dead-end shopping sessions.',
        'Ensure cart forms, mini-cart drawers, and checkout buttons use visible labels and link to a real cart or checkout route.',
        signals.find(item => item.key === 'checkout-path')?.evidence ??
          'Checkout path was missing.',
        'medium',
        hasCartInteraction ? 'rendered_browser' : hasProductSample ? 'product_sample' : 'static_html',
        hasCartInteraction ? 'verified' : 'insufficient_evidence',
        hasCartInteraction ? undefined : staticCheckoutLimitation
      )
    );
  }

  if (!paymentCues) {
    recommendations.push(
      createRecommendation(
        'payment-cues-missing',
        'Show accepted payment methods',
        'medium',
        'Payment cues reduce risk perception before shoppers commit to checkout.',
        'Add accepted payment logos or wallet labels near the cart, checkout button, and footer.',
        signals.find(item => item.key === 'payment-cues')?.evidence ?? 'Payment cues were missing.',
        'quick'
      )
    );
  }

  if (!policyCues) {
    recommendations.push(
      createRecommendation(
        'checkout-trust',
        'Add checkout trust cues',
        'medium',
        'Trust cues near purchase actions reduce hesitation when shoppers are about to enter payment details.',
        'Place secure payment, returns, warranty, or guarantee messaging near cart and checkout entry points.',
        signals.find(item => item.key === 'policy-cues')?.evidence ?? 'Trust cues were missing.',
        'quick'
      )
    );
  }

  const normalizedScore = Math.min(100, Math.max(0, score));

  return {
    name: 'Cart & Checkout',
    score: normalizedScore,
    status: getScoreStatus(normalizedScore),
    findings: signals.map(item => ({
      type: item.state === 'present' ? 'positive' : 'issue',
      title: item.label,
      description: item.evidence,
    })),
    recommendations,
  };
}
