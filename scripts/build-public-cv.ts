/**
 * Pre-render the public master CV during the Vercel build, not per visitor.
 *
 * Chromium startup, embedded image loading, layout checks, and PDF generation
 * happen once at build time. Production visitors receive static PDF assets.
 *
 * Run after translations are validated and before `next build`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getEnglishCVData } from '../lib/cv/cv-data';
import { renderEditorialCvHtml } from '../lib/cv/cv-print-html-editorial';
import { resolveCvPdfAssets } from '../lib/cv/cv-media';
import {
  CV_STATIC_DOWNLOAD_PATH,
  CV_STATIC_INLINE_PATH,
} from '../lib/cv/cv-static';
import { launchAnalyzerBrowser } from '../lib/services/puppeteer-launch';

async function main() {
  const cv = getEnglishCVData();
  const html = renderEditorialCvHtml(cv, await resolveCvPdfAssets());
  const browser = await launchAnalyzerBrowser(90_000);

  try {
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      await page.emulateMediaType('print');
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      const clipping = await page.evaluate(() => {
        const tolerance = 2;
        return ['.page', '.hero', '.main', '.side'].flatMap(selector => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return [`${selector}: missing`];
          const issues: string[] = [];
          if (element.scrollWidth - element.clientWidth > tolerance) {
            issues.push(`${selector}: horizontal overflow`);
          }
          if (element.scrollHeight - element.clientHeight > tolerance) {
            issues.push(`${selector}: vertical overflow`);
          }
          return issues;
        });
      });

      if (clipping.length) {
        throw new Error(`CV A4 layout overflow: ${clipping.join(', ')}`);
      }

      const pdf = await page.pdf({
        format: 'A4',
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      if (pdf.byteLength < 10_000) {
        throw new Error('CV PDF unexpectedly small: build is not safe to deploy.');
      }

      for (const publicPath of [CV_STATIC_INLINE_PATH, CV_STATIC_DOWNLOAD_PATH]) {
        const absolute = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
        await mkdir(join(absolute, '..'), { recursive: true });
        await writeFile(absolute, pdf);
        console.log(`Generated ${publicPath} (${pdf.byteLength} bytes)`);
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('CV static PDF generation failed:', error);
  process.exitCode = 1;
});
