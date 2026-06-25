import { describe, expect, it } from 'vitest';
import { analyzeCartExperience } from '@/lib/services/cart-analyzer-advanced';
import type { DeeperScanAnalysis, ProductAnalysis } from '@/lib/types/analyzer';

const homepageWithoutPurchase = `<!doctype html>
<html><body>
  <main><h1>Catalog</h1><p>Browse products.</p></main>
</body></html>`;

const productAnalysis: ProductAnalysis = {
  productUrl: 'https://store.example.com/product/demo',
  hasBuyButtonAboveFold: false,
  imageCount: 2,
  hasReviews: false,
  descriptionLength: 80,
  score: 50,
  cartActionabilityStatus: 'unknown',
};

function buildDeeperScan(overrides: Partial<DeeperScanAnalysis> = {}): DeeperScanAnalysis {
  return {
    attempted: true,
    available: true,
    categoryPagesAttempted: 1,
    categoryPagesSucceeded: 1,
    productPagesAttempted: 1,
    productPagesSucceeded: 1,
    cartInteractionAttempted: true,
    cartInteractionSucceeded: false,
    categorySamples: [],
    productSamples: [],
    confidence: 'estimated',
    limitations: [],
    ...overrides,
  };
}

describe('analyzeCartExperience deeper scan gating', () => {
  it('treats untested checkout as a coverage gap instead of a high-impact fix', () => {
    const result = analyzeCartExperience(homepageWithoutPurchase, {
      productAnalysis,
      deeperScan: buildDeeperScan({
        attempted: true,
        available: false,
        cartInteractionAttempted: false,
        cartInteractionSucceeded: false,
      }),
    });

    const checkoutRec = result.recommendations.find(rec => rec.code === 'checkout-flow-not-verified');

    expect(checkoutRec?.title).toBe('Checkout flow not verified');
    expect(checkoutRec?.confidence).toBe('insufficient_evidence');
    expect(checkoutRec?.impact).toBe('low');
    expect(checkoutRec?.excludeFromActionPlan).toBe(true);
  });

  it('keeps purchase recommendations insufficient when product sampling lacks cart interaction', () => {
    const result = analyzeCartExperience(homepageWithoutPurchase, {
      productAnalysis,
      deeperScan: buildDeeperScan(),
    });

    const purchaseRec = result.recommendations.find(rec => rec.code === 'add-to-cart-missing');

    expect(purchaseRec?.confidence).toBe('insufficient_evidence');
    expect(purchaseRec?.impact).toBe('high');
  });

  it('uses verified rendered evidence when sampled cart interaction confirms checkout UI', () => {
    const result = analyzeCartExperience(homepageWithoutPurchase, {
      productAnalysis: {
        ...productAnalysis,
        cartActionabilityStatus: 'clickable',
      },
      deeperScan: buildDeeperScan({
        cartInteractionSucceeded: true,
        cartInteraction: {
          attempted: true,
          productUrl: 'https://store.example.com/product/demo',
          addToCartClicked: true,
          cartCountChanged: true,
          cartDrawerOrPageDetected: true,
          checkoutLinkDetected: true,
          evidence: ['add-to-cart click attempted', 'checkout link/control detected after click'],
        },
        confidence: 'verified',
      }),
    });

    const checkoutFinding = result.findings.find(finding => finding.title === 'Checkout path');
    const checkoutRec = result.recommendations.find(rec => rec.code === 'checkout-flow-not-verified');

    expect(checkoutFinding?.description).toMatch(/sampled cart interaction/i);
    expect(checkoutRec).toBeUndefined();
  });
});
