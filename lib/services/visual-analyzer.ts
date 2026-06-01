import puppeteer from 'puppeteer';
import { Logger } from '@/lib/logger';
import { VisualAnalysis } from '@/lib/types/analyzer';

export class VisualAnalyzerService {
  static async analyze(url: string): Promise<VisualAnalysis | null> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();

      // Mobile Viewport
      await page.setViewport({ width: 375, height: 667, isMobile: true });
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // 1. Mobile Screenshot
      const mobileScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 60,
      });

      // 2. Basic Mobile Responsiveness Check
      // Check for horizontal scroll (often indicates responsive issues)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      // 3. Touch Targets Check (Simulated)
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

      // Switch to Desktop
      await page.setViewport({ width: 1440, height: 900 });
      // Wait a bit for layout to adjust (some hydration might occur)
      await new Promise(r => setTimeout(r, 1000));
      const desktopScreenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 60,
      });

      // 4. Color Extraction (Simple JS approach on page to avoid Sharp overhead for now)
      const dominantColors = await page.evaluate(() => {
        const rgbToHex = (r: number, g: number, b: number) =>
          '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        // Sample simple elements for colors (Backgrounds, Buttons)
        const colors = new Set<string>();
        const elements = document.querySelectorAll('body, header, footer, button, a.btn');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            // Parse rgb/rgba
            const rgb = style.backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              colors.add(rgbToHex(Number(rgb[0]), Number(rgb[1]), Number(rgb[2])));
            }
          }
        });
        return Array.from(colors).slice(0, 5);
      });

      await browser.close();

      return {
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
    } catch (error) {
      Logger.error('Visual analysis failed', error);
      return null;
    }
  }
}
