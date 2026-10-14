import {
  CartInteractionSample,
  CategoryPageSample,
  DeeperScanAnalysis,
  ProductAnalysis,
  ProductPageSample,
  VisualAnalysis,
} from '@/lib/types/analyzer';
import { Logger } from '@/lib/logger';
import { validateStoreUrlForAnalysis } from '@/lib/utils/store-url';
import type { Page } from 'puppeteer-core';
import { launchAnalyzerBrowser, probeAnalyzerBrowser } from '@/lib/services/puppeteer-launch';

export interface ScraperResult {
  visualAnalysis: VisualAnalysis | null;
  productAnalysis: ProductAnalysis | undefined;
  deeperScan?: DeeperScanAnalysis;
}

// Check if Puppeteer/Chrome is available
let puppeteerAvailable: boolean | null = null;

const CATEGORY_PATH_PATTERNS = [
  /\/collections?\//i,
  /\/categories?\//i,
  /\/product-category\//i,
  /\/shop\/?$/i,
  /\/catalog/i,
];

const PRODUCT_PATH_PATTERNS = [/\/products?\//i, /\/product\//i, /\/item\//i, /\/p\//i];
const SCRAPER_TIME_BUDGET_MS = 75_000;

function isPuppeteerRuntimeEnabled(): boolean {
  if (process.env.ANALYZER_ENABLE_PUPPETEER === 'true') return true;
  if (process.env.ANALYZER_DISABLE_PUPPETEER === 'true') return false;
  return true;
}

function unavailableDeeperScan(reason: string, attempted = false): DeeperScanAnalysis {
  return {
    attempted,
    available: false,
    categoryPagesAttempted: 0,
    categoryPagesSucceeded: 0,
    productPagesAttempted: 0,
    productPagesSucceeded: 0,
    cartInteractionAttempted: false,
    cartInteractionSucceeded: false,
    categorySamples: [],
    productSamples: [],
    confidence: 'unavailable',
    limitations: [reason],
  };
}

async function checkPuppeteerAvailability(): Promise<boolean> {
  if (puppeteerAvailable !== null) return puppeteerAvailable;
  puppeteerAvailable = await probeAnalyzerBrowser();
  return puppeteerAvailable;
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map(url => url.split('#')[0]))];
}

async function discoverDeepScanUrls(page: Page, homepageUrl: string) {
  const urls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .map(anchor => anchor.href)
      .filter((href: string) => {
        try {
          const url = new URL(href);
          return url.hostname === window.location.hostname;
        } catch {
          return false;
        }
      });
  });

  const categoryUrls = uniqueUrls(
    urls.filter((url: string) => CATEGORY_PATH_PATTERNS.some(pattern => pattern.test(new URL(url).pathname)))
  ).slice(0, 2);

  const productUrls = uniqueUrls(
    urls.filter((url: string) => PRODUCT_PATH_PATTERNS.some(pattern => pattern.test(new URL(url).pathname)))
  ).slice(0, 3);

  const cartUrls = uniqueUrls(
    urls.filter((url: string) => /\/cart|\/basket|\/bag/i.test(new URL(url).pathname))
  ).slice(0, 1);

  return {
    categoryUrls,
    productUrls,
    cartUrl: cartUrls[0] || new URL('/cart', homepageUrl).toString(),
  };
}

async function sampleCategoryPage(page: Page, url: string): Promise<CategoryPageSample> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });

  return page.evaluate((sampleUrl: string) => {
    const productLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).filter(
      anchor => /\/products?\//i.test(anchor.href) || /\/product\//i.test(anchor.href)
    );
    const visibleProductCards = Array.from(
      document.querySelectorAll(
        '.product, .product-card, .grid__item, [class*="product"], [data-product-id]'
      )
    ).filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const filterOrSortDetected = Boolean(
      document.querySelector(
        'select[name*="sort"], [class*="filter"], [class*="facet"], [aria-label*="filter" i], [aria-label*="sort" i]'
      )
    );
    const addToCartInListDetected = /add\s*to\s*(cart|bag)|quick\s*add|quick\s*shop/i.test(
      document.body.innerText || ''
    );

    return {
      url: sampleUrl,
      productLinkCount: productLinks.length,
      visibleProductGrid: visibleProductCards.length > 0 || productLinks.length >= 4,
      filterOrSortDetected,
      addToCartInListDetected,
      evidence: [
        `${productLinks.length} product-like links`,
        `${visibleProductCards.length} visible product-like cards`,
        filterOrSortDetected ? 'filter/sort UI detected' : 'filter/sort UI not detected',
        addToCartInListDetected ? 'list add-to-cart language detected' : 'list add-to-cart language not detected',
      ],
    };
  }, url);
}

async function sampleProductPage(page: Page, url: string): Promise<ProductPageSample> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 14000 });

  const analysis = await page.evaluate((sampleUrl: string) => {
    const buttonSelector =
      'button[name="add"], button.add-to-cart, button.single_add_to_cart_button, .btn-add-to-cart, #AddToCart, [data-add-to-cart], [class*="add-to-cart"], form[action*="/cart/add"] button[type="submit"]';
    const buyButton = document.querySelector(buttonSelector) as HTMLElement | null;
    const images = document.querySelectorAll('img').length;
    const reviews = document.querySelector('.stars, .reviews, .rating, [class*="review"], [class*="rating"]');
    const desc =
      document.querySelector('.description, #description, .product-description, [class*="description"]')
        ?.textContent?.length || 0;
    const text = document.body.innerText || '';
    const priceDetected = /[$€£₪]\s?\d|\d+\s?(USD|EUR|ILS|NIS|GBP)/i.test(text);
    const stockSignalDetected = /in stock|out of stock|available|sold out|אזל|זמין/i.test(text);
    const variantSelectorDetected = Boolean(
      document.querySelector('select[name*="option"], select[name*="variant"], [class*="variant"], [data-option]')
    );

    let aboveFold = false;
    let addToCartSelectorFound = false;
    if (buyButton) {
      addToCartSelectorFound = true;
      const rect = buyButton.getBoundingClientRect();
      aboveFold = rect.top < window.innerHeight;
    }

    let score = 50;
    if (aboveFold) score += 20;
    if (images > 3) score += 10;
    if (reviews) score += 10;
    if (desc > 200) score += 10;

    return {
      url: sampleUrl,
      productUrl: sampleUrl,
      hasBuyButtonAboveFold: aboveFold,
      imageCount: images,
      hasReviews: Boolean(reviews),
      descriptionLength: desc,
      score: Math.min(100, score),
      cartActionabilityStatus: addToCartSelectorFound ? ('detected' as const) : ('unknown' as const),
      addToCartSelectorFound,
      variantSelectorDetected,
      priceDetected,
      stockSignalDetected,
      evidence: [
        addToCartSelectorFound ? 'add-to-cart control detected' : 'add-to-cart control not detected',
        aboveFold ? 'add-to-cart appears above fold' : 'add-to-cart not confirmed above fold',
        priceDetected ? 'price text detected' : 'price text not detected',
        stockSignalDetected ? 'stock/availability language detected' : 'stock/availability language not detected',
      ],
    };
  }, url);

  const btnSelector =
    'button[name="add"], button.add-to-cart, button.single_add_to_cart_button, .btn-add-to-cart, #AddToCart, [data-add-to-cart], [class*="add-to-cart"], form[action*="/cart/add"] button[type="submit"]';
  const addToCartBtn = await page.$(btnSelector);

  if (!addToCartBtn) return analysis;

  const isClickable = await page.evaluate((el: Element) => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !('disabled' in htmlEl && Boolean((htmlEl as HTMLButtonElement).disabled))
    );
  }, addToCartBtn);

  return {
    ...analysis,
    cartActionabilityStatus: isClickable ? 'clickable' : 'detected',
    evidence: [
      ...analysis.evidence,
      isClickable ? 'add-to-cart control appears clickable' : 'add-to-cart control appears disabled or hidden',
    ],
  };
}

async function sampleCartInteraction(page: Page, productUrl?: string): Promise<CartInteractionSample> {
  const evidence: string[] = [];
  const result: CartInteractionSample = {
    attempted: Boolean(productUrl),
    productUrl,
    addToCartClicked: false,
    cartCountChanged: false,
    cartDrawerOrPageDetected: false,
    checkoutLinkDetected: false,
    evidence,
  };

  if (!productUrl) {
    result.error = 'No sampled product URL was available for cart interaction.';
    evidence.push(result.error);
    return result;
  }

  try {
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 14000 });
    result.cartUrlBefore = page.url();
    const beforeCount = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const match = text.match(/\bCart\s*\(?(\d+)\)?|\bBag\s*\(?(\d+)\)?/i);
      return match ? Number(match[1] || match[2] || 0) : null;
    });

    const btnSelector =
      'button[name="add"], button.add-to-cart, button.single_add_to_cart_button, .btn-add-to-cart, #AddToCart, [data-add-to-cart], [class*="add-to-cart"], form[action*="/cart/add"] button[type="submit"]';
    const addToCartBtn = await page.$(btnSelector);
    if (!addToCartBtn) {
      result.error = 'No clickable add-to-cart control was found for interaction.';
      evidence.push(result.error);
      return result;
    }

    try {
      await addToCartBtn.click();
      result.addToCartClicked = true;
    } catch {
      result.error = 'The add-to-cart control could not be clicked in this browser sample.';
      evidence.push(result.error);
      return result;
    }
    evidence.push('add-to-cart click attempted');
    await new Promise(resolve => setTimeout(resolve, 1500));
    result.cartUrlAfter = page.url();

    const afterSignals = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const checkoutLink = Boolean(
        document.querySelector('a[href*="/checkout"], form[action*="/checkout"], button[name="checkout"], button[id*="checkout"]')
      );
      const cartUi = Boolean(
        document.querySelector('[data-cart-drawer], [class*="cart-drawer"], [class*="mini-cart"], [role="dialog"][class*="cart"], main form[action*="/cart"]')
      );
      const match = text.match(/\bCart\s*\(?(\d+)\)?|\bBag\s*\(?(\d+)\)?/i);
      return {
        checkoutLink,
        cartUi,
        cartCount: match ? Number(match[1] || match[2] || 0) : null,
        onCartPage: /^\/(cart|basket|bag)(\/|$)/i.test(window.location.pathname),
      };
    });

    result.cartCountChanged =
      typeof beforeCount === 'number' &&
      typeof afterSignals.cartCount === 'number' &&
      afterSignals.cartCount > beforeCount;
    result.cartDrawerOrPageDetected = afterSignals.cartUi || afterSignals.onCartPage || result.cartCountChanged;
    result.checkoutLinkDetected = afterSignals.checkoutLink;
    evidence.push(
      result.cartDrawerOrPageDetected
        ? 'cart UI or cart page detected after click'
        : 'cart UI not detected after click'
    );
    evidence.push(
      result.checkoutLinkDetected
        ? 'checkout link/control detected after click'
        : 'checkout link/control not detected after click'
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cart interaction failed.';
    result.error = message;
    evidence.push(message);
  }

  return result;
}

export class ScraperService {
  static isEnabled(): boolean {
    return isPuppeteerRuntimeEnabled();
  }

  static async scrape(url: string): Promise<ScraperResult> {
    if (!isPuppeteerRuntimeEnabled()) {
      Logger.debug('Skipping visual/product analysis — Puppeteer disabled for this runtime');
      return {
        visualAnalysis: null,
        productAnalysis: undefined,
        deeperScan: unavailableDeeperScan('Browser automation is disabled for this runtime.', false),
      };
    }

    const isAvailable = await checkPuppeteerAvailability();
    if (!isAvailable) {
      Logger.warn('Skipping visual/product analysis - Puppeteer unavailable');
      return {
        visualAnalysis: null,
        productAnalysis: undefined,
        deeperScan: unavailableDeeperScan('Browser automation could not launch in this runtime.', true),
      };
    }

    let browser = null;
    try {
      Logger.debug('Starting ScraperService for ' + url);
      const startTime = Date.now();

      // Try to launch browser with extended timeout and better error handling
      try {
        browser = await launchAnalyzerBrowser(30_000);
      } catch (launchError) {
        Logger.error('Puppeteer launch failed', launchError);
        // Return graceful fallback instead of crashing
        return {
          visualAnalysis: null,
          productAnalysis: undefined,
          deeperScan: unavailableDeeperScan('Browser launch failed before visual or deep-scan sampling.', true),
        };
      }

      const page = await browser.newPage();

      // Every storefront is untrusted. Block private-network requests and unsafe
      // protocols before Chromium fetches assets, scripts or navigations.
      const checkedHosts = new Map<string, Promise<boolean>>();
      await page.setRequestInterception(true);
      page.on('request', request => {
        let target: URL;
        try {
          target = new URL(request.url());
        } catch {
          void request.abort().catch(() => undefined);
          return;
        }
        if (target.protocol === 'data:' || target.protocol === 'blob:') {
          void request.continue().catch(() => undefined);
          return;
        }
        if (target.protocol !== 'http:' && target.protocol !== 'https:') {
          void request.abort().catch(() => undefined);
          return;
        }
        const key = target.origin;
        let allowed = checkedHosts.get(key);
        if (!allowed) {
          allowed = validateStoreUrlForAnalysis(key)
            .then(result => result.ok)
            .catch(() => false);
          checkedHosts.set(key, allowed);
        }
        void allowed.then(ok =>
          ok ? request.continue() : request.abort()
        ).catch(() => undefined);
      });

      // Set a default timeout for all operations
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(25000);

      // Optimization: Block extensive resources if possible, but we need images for visual audit.
      // Maybe block ads/trackers? For now keep simple to avoid breaking site layout.

      // 1. VISUAL ANALYSIS (HOMEPAGE)
      // Mobile Viewport first
      await page.setViewport({ width: 375, height: 667, isMobile: true });

      // Timeout 25s to leave buffer - use domcontentloaded for faster response
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

      // Mobile Screenshot
      const mobileScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 60,
      });

      // Mobile Checks
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      const smallTargets = await page.evaluate(() => {
        let count = 0;
        const clickable = document.querySelectorAll('a, button, input');
        clickable.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            count++;
          }
        });
        return count;
      });

      const contrastIssues = await page.evaluate(() => {
        const parseRgb = (value: string) => {
          const channels = value.match(/\d+(\.\d+)?/g)?.map(Number);
          if (!channels || channels.length < 3) return null;
          return channels.slice(0, 3);
        };

        const parseOpaqueRgb = (value: string) => {
          const channels = value.match(/\d+(\.\d+)?/g)?.map(Number);
          if (!channels || channels.length < 3) return null;
          const alpha = channels.length >= 4 ? channels[3] : 1;
          return alpha === 0 ? null : channels.slice(0, 3);
        };

        const findOpaqueBackground = (element: Element) => {
          let current: Element | null = element;
          while (current) {
            const background = parseOpaqueRgb(window.getComputedStyle(current).backgroundColor);
            if (background) return background;
            current = current.parentElement;
          }
          return parseOpaqueRgb(window.getComputedStyle(document.body).backgroundColor);
        };

        const luminance = ([r, g, b]: number[]) => {
          const normalize = (channel: number) => {
            const value = channel / 255;
            return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
        };

        const contrastRatio = (foreground: number[], background: number[]) => {
          const lighter = Math.max(luminance(foreground), luminance(background));
          const darker = Math.min(luminance(foreground), luminance(background));
          return (lighter + 0.05) / (darker + 0.05);
        };

        const visibleTextElements = Array.from(
          document.querySelectorAll('p, span, a, button, label, li, h1, h2, h3, h4')
        ).slice(0, 160);

        let issues = 0;
        for (const element of visibleTextElements) {
          const rect = element.getBoundingClientRect();
          const text = element.textContent?.trim();
          if (!text || rect.width === 0 || rect.height === 0) continue;

          const style = window.getComputedStyle(element);
          const foreground = parseRgb(style.color);
          const background = findOpaqueBackground(element);
          if (!foreground || !background) continue;

          const fontSize = Number.parseFloat(style.fontSize || '16');
          const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
          const minimumRatio = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700) ? 3 : 4.5;

          if (contrastRatio(foreground, background) < minimumRatio) {
            issues++;
          }
        }

        return issues;
      });

      // Desktop Viewport
      await page.setViewport({ width: 1440, height: 900 });
      await new Promise(r => setTimeout(r, 500)); // Brief layout settle
      const desktopScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 50,
      }); // Lower quality for speed

      // Colors
      const dominantColors = await page.evaluate(() => {
        const rgbToHex = (r: number, g: number, b: number) =>
          '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        const colors = new Set<string>();
        const elements = document.querySelectorAll('body, header, footer, button, a.btn');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            const rgb = style.backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              colors.add(rgbToHex(Number(rgb[0]), Number(rgb[1]), Number(rgb[2])));
            }
          }
        });
        return Array.from(colors).slice(0, 5);
      });

      const visualAnalysis: VisualAnalysis = {
        screenshots: [
          {
            url: `data:image/jpeg;base64,${mobileScreenshot}`,
            device: 'mobile',
            label: 'Mobile View',
          },
          {
            url: `data:image/jpeg;base64,${desktopScreenshot}`,
            device: 'desktop',
            label: 'Desktop View',
          },
        ],
        contrastIssues,
        mobileResponsivenessScore: hasHorizontalScroll ? 50 : Math.max(0, 100 - smallTargets * 2),
        dominantColors,
      };

      // 2. DEEPER CATEGORY / PRODUCT / CART SAMPLING
      const discoveredUrls = await discoverDeepScanUrls(page, url);
      const categorySamples: CategoryPageSample[] = [];
      const productSamples: ProductPageSample[] = [];
      const limitations: string[] = [];
      let productAnalysis: ProductAnalysis | undefined = undefined;

      if (discoveredUrls.categoryUrls.length === 0) {
        limitations.push('No same-origin category URLs were discovered from visible homepage links.');
      }

      if (discoveredUrls.productUrls.length === 0) {
        limitations.push('No same-origin product URLs were discovered from visible homepage links.');
      }

      const deepScanDeadline = startTime + SCRAPER_TIME_BUDGET_MS;
      for (const categoryUrl of discoveredUrls.categoryUrls) {
        if (Date.now() + 14_000 >= deepScanDeadline) {
          limitations.push('Browser time budget reached before all category pages could be sampled.');
          break;
        }
        try {
          categorySamples.push(await sampleCategoryPage(page, categoryUrl));
        } catch (categoryErr) {
          Logger.warn('Category page sample failed', { categoryUrl, error: categoryErr });
          limitations.push(`Category page sample failed: ${categoryUrl}`);
        }
      }

      for (const productUrl of discoveredUrls.productUrls) {
        if (Date.now() + 16_000 >= deepScanDeadline) {
          limitations.push('Browser time budget reached before all product pages could be sampled.');
          break;
        }
        try {
          productSamples.push(await sampleProductPage(page, productUrl));
        } catch (prodErr) {
          Logger.warn('Product page visit failed', { productUrl, error: prodErr });
          limitations.push(`Product page sample failed: ${productUrl}`);
        }
      }

      productAnalysis = productSamples[0]
        ? {
            productUrl: productSamples[0].url,
            hasBuyButtonAboveFold: productSamples[0].hasBuyButtonAboveFold,
            imageCount: productSamples[0].imageCount,
            hasReviews: productSamples[0].hasReviews,
            descriptionLength: productSamples[0].descriptionLength,
            score: productSamples[0].score,
            cartActionabilityStatus: productSamples[0].cartActionabilityStatus,
          }
        : undefined;

      const cartInteraction: CartInteractionSample =
        Date.now() + 16_000 < deepScanDeadline
          ? await sampleCartInteraction(page, productSamples[0]?.url)
          : {
              attempted: false,
              addToCartClicked: false,
              cartCountChanged: false,
              cartDrawerOrPageDetected: false,
              checkoutLinkDetected: false,
              evidence: [],
            };
      if (!cartInteraction.attempted && productSamples.length > 0) {
        limitations.push('Cart interaction skipped to stay within the browser scan time budget.');
      }
      if (cartInteraction.error) limitations.push(cartInteraction.error);

      const deeperScan: DeeperScanAnalysis = {
        attempted: true,
        available: categorySamples.length > 0 || productSamples.length > 0 || cartInteraction.addToCartClicked,
        categoryPagesAttempted: discoveredUrls.categoryUrls.length,
        categoryPagesSucceeded: categorySamples.length,
        productPagesAttempted: discoveredUrls.productUrls.length,
        productPagesSucceeded: productSamples.length,
        cartInteractionAttempted: cartInteraction.attempted,
        cartInteractionSucceeded:
          cartInteraction.addToCartClicked &&
          (cartInteraction.cartDrawerOrPageDetected || cartInteraction.checkoutLinkDetected),
        categorySamples,
        productSamples,
        cartInteraction,
        confidence:
          cartInteraction.addToCartClicked && productSamples.length > 0
            ? 'verified'
            : productSamples.length > 0 || categorySamples.length > 0
              ? 'estimated'
              : 'insufficient_evidence',
        limitations,
      };

      Logger.debug(`Scraper finished in ${Date.now() - startTime}ms`);
      return { visualAnalysis, productAnalysis, deeperScan };
    } catch (error) {
      Logger.error('ScraperService failed', error);
      return {
        visualAnalysis: null,
        productAnalysis: undefined,
        deeperScan: unavailableDeeperScan('Browser automation failed during visual or deep-scan sampling.', true),
      };
    } finally {
      if (browser) await browser.close();
    }
  }
}
