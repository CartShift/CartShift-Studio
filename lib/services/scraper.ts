import puppeteer from 'puppeteer';
import { VisualAnalysis, ProductAnalysis } from '@/lib/types/analyzer';
import { Logger } from '@/lib/logger';

export interface ScraperResult {
  visualAnalysis: VisualAnalysis | null;
  productAnalysis: ProductAnalysis | undefined;
}

export class ScraperService {
  static async scrape(url: string): Promise<ScraperResult> {
    let browser = null;
    try {
      Logger.debug('Starting ScraperService for ' + url);
      const startTime = Date.now();

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Docker/CloudRun optimization
          '--disable-gpu',
          '--single-process', // Sometimes clearer for cleanup
        ],
        timeout: 30000,
      });

      const page = await browser.newPage();

      // Optimization: Block extensive resources if possible, but we need images for visual audit.
      // Maybe block ads/trackers? For now keep simple to avoid breaking site layout.

      // 1. VISUAL ANALYSIS (HOMEPAGE)
      // Mobile Viewport first
      await page.setViewport({ width: 375, height: 667, isMobile: true });

      // Timeout 25s to leave buffer
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

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
        contrastIssues: 0,
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
          await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

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
