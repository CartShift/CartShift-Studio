import puppeteer from 'puppeteer';
import { ProductAnalysis } from '@/lib/types/analyzer';
import { Logger } from '@/lib/logger';

export class ProductPageAnalyzerService {
  static async analyze(baseUrl: string): Promise<ProductAnalysis | undefined> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();

      // 1. Visit Homepage to find a product link
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const productUrl = await page.evaluate(() => {
        // Simple heuristic to find a product link
        const anchors = Array.from(document.querySelectorAll('a'));
        const productLink = anchors.find(
          a =>
            (a.href.includes('/product') || a.href.includes('/item/') || a.href.includes('/p/')) &&
            !a.href.includes('cart') &&
            !a.href.includes('search')
        );
        return productLink ? productLink.href : null;
      });

      if (!productUrl) {
        await browser.close();
        return undefined;
      }

      // 2. Analyze Product Page
      await page.goto(productUrl, { waitUntil: 'networkidle0', timeout: 20000 });

      const analysis = await page.evaluate(() => {
        const buyButton = document.querySelector(
          'button[name="add"], button.add-to-cart, .btn-add-to-cart, #AddToCart'
        );
        const images = document.querySelectorAll('img').length; // Crude
        const rvw = document.querySelector('.stars, .reviews, .rating');
        const desc =
          document.querySelector('.description, #description, .product-description')?.textContent
            ?.length || 0;

        // Check fold
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

      // 3. Checkout Simulation (Lightweight)
      let cartStatus: 'detected' | 'clickable' | 'redirected_to_cart' | 'unknown' = 'unknown';

      try {
        const btnSelector =
          'button[name="add"], button.add-to-cart, .btn-add-to-cart, #AddToCart, [aria-label*="cart"]';
        const addToCartBtn = await page.$(btnSelector);

        if (addToCartBtn) {
          cartStatus = 'detected';
          // Check if clickable (visible and enabled)
          const isClickable = await page.evaluate((el: any) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
          }, addToCartBtn);

          if (isClickable) {
            cartStatus = 'clickable';
            // Attempt click (with short timeout to see if url changes or network activity)
            /*
                   // NOTE: Disabled full click-through to separate task/prevent unintentional spamming of analytics on client sites
                   // But we could simulate enabling it:
                   // await Promise.all([
                   //     page.waitForNavigation({ timeout: 5000 }).catch(() => null),
                   //     addToCartBtn.click(),
                   // ]);
                   // if (page.url().includes('cart') || page.url().includes('checkout')) cartStatus = 'redirected_to_cart';
                   */
          }
        }
      } catch (_e) {
        // Ignore simulation errors
      }

      await browser.close();
      return {
        ...analysis,
        productUrl,
        cartActionabilityStatus: cartStatus,
      };
    } catch (error) {
      Logger.error('Product analysis failed', error);
      return undefined;
    }
  }
}
