import { VisualAnalysis, ProductAnalysis } from '@/lib/types/analyzer';
import { Logger } from '@/lib/logger';
import { launchAnalyzerBrowser, probeAnalyzerBrowser } from '@/lib/services/puppeteer-launch';

export interface ScraperResult {
  visualAnalysis: VisualAnalysis | null;
  productAnalysis: ProductAnalysis | undefined;
}

// Check if Puppeteer/Chrome is available
let puppeteerAvailable: boolean | null = null;

function isPuppeteerRuntimeEnabled(): boolean {
  if (process.env.ANALYZER_ENABLE_PUPPETEER === 'true') return true;
  if (process.env.ANALYZER_DISABLE_PUPPETEER === 'true') return false;
  return true;
}

async function checkPuppeteerAvailability(): Promise<boolean> {
  if (puppeteerAvailable !== null) return puppeteerAvailable;
  puppeteerAvailable = await probeAnalyzerBrowser();
  return puppeteerAvailable;
}

export class ScraperService {
  static isEnabled(): boolean {
    return isPuppeteerRuntimeEnabled();
  }

  static async scrape(url: string): Promise<ScraperResult> {
    if (!isPuppeteerRuntimeEnabled()) {
      Logger.debug('Skipping visual/product analysis — Puppeteer disabled for this runtime');
      return { visualAnalysis: null, productAnalysis: undefined };
    }

    const isAvailable = await checkPuppeteerAvailability();
    if (!isAvailable) {
      Logger.warn('Skipping visual/product analysis - Puppeteer unavailable');
      return { visualAnalysis: null, productAnalysis: undefined };
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
        return { visualAnalysis: null, productAnalysis: undefined };
      }

      const page = await browser.newPage();

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

      // 2. PRODUCT ANALYSIS
      // Find link
      const productUrl = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        // Prioritize links that look like products and are internal
        const productLink = anchors.find(
          a =>
            (a.href.includes('/product') || a.href.includes('/item/') || a.href.includes('/p/')) &&
            !a.href.includes('cart') &&
            !a.href.includes('search') &&
            !a.href.includes('collection') &&
            a.hostname === window.location.hostname
        );
        return productLink ? productLink.href : null;
      });

      let productAnalysis: ProductAnalysis | undefined = undefined;

      if (productUrl) {
        try {
          // Use a shorter timeout and domcontentloaded for product page
          await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

          const analysis = await page.evaluate(() => {
            const buyButton = document.querySelector(
              'button[name="add"], button.add-to-cart, .btn-add-to-cart, #AddToCart'
            );
            const images = document.querySelectorAll('img').length;
            const rvw = document.querySelector('.stars, .reviews, .rating');
            const desc =
              document.querySelector('.description, #description, .product-description')
                ?.textContent?.length || 0;

            let aboveFold = false;
            if (buyButton) {
              const rect = buyButton.getBoundingClientRect();
              aboveFold = rect.top < window.innerHeight;
            }

            let score = 50;
            if (aboveFold) score += 20;
            if (images > 3) score += 10;
            if (rvw) score += 10;
            if (desc > 200) score += 10;

            return {
              hasBuyButtonAboveFold: aboveFold,
              imageCount: images,
              hasReviews: !!rvw,
              descriptionLength: desc,
              score: Math.min(100, score),
            };
          });

          // Cart Simulation
          let cartStatus: 'detected' | 'clickable' | 'redirected_to_cart' | 'unknown' = 'unknown';

          const btnSelector =
            'button[name="add"], button.add-to-cart, .btn-add-to-cart, #AddToCart, [aria-label*="cart"]';
          const addToCartBtn = await page.$(btnSelector);

          if (addToCartBtn) {
            cartStatus = 'detected';
            const isClickable = await page.evaluate((el: any) => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
            }, addToCartBtn);
            if (isClickable) cartStatus = 'clickable';
          }

          productAnalysis = {
            ...analysis,
            productUrl,
            cartActionabilityStatus: cartStatus,
          };
        } catch (prodErr) {
          Logger.warn('Product page visit failed', { error: prodErr });
        }
      }

      Logger.debug(`Scraper finished in ${Date.now() - startTime}ms`);
      return { visualAnalysis, productAnalysis };
    } catch (error) {
      Logger.error('ScraperService failed', error);
      return { visualAnalysis: null, productAnalysis: undefined };
    } finally {
      if (browser) await browser.close();
    }
  }
}
