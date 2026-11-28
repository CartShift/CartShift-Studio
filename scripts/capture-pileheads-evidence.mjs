#!/usr/bin/env node
// Capture public, anonymous local bot gameplay only. Never log in, join an online room,
// or change production data. Artifacts are review candidates, not auto-published.
import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'tmp/pileheads-evidence';
const origin = 'https://pileheads.com';
const captures = [];
await mkdir(output, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const variant of [
    { name: 'desktop', width: 1440, height: 900, mobile: false },
    { name: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    try {
      page.setDefaultTimeout(20000);
      await page.setViewport({ width: variant.width, height: variant.height, isMobile: variant.mobile, hasTouch: variant.mobile, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const response = await page.goto(origin + '/play', { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (!response?.ok() || new URL(page.url()).origin !== origin) throw new Error('Public play route is unavailable');
      async function clickLocalButton(pattern) {
        await page.waitForFunction(source => [...document.querySelectorAll('button')].some(b => !b.disabled && new RegExp(source, 'i').test(b.textContent.trim()) && b.getBoundingClientRect().width > 0), {}, pattern);
        const button = await page.evaluateHandle(source => [...document.querySelectorAll('button')].find(b => !b.disabled && new RegExp(source, 'i').test(b.textContent.trim()) && b.getBoundingClientRect().width > 0), pattern);
        const element = button.asElement();
        if (!element) throw new Error('Missing local game button: ' + pattern);
        await element.click();
        await button.dispose();
      }
      await clickLocalButton('^Start game');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('stack-next-local-save-v1') || 'null')?.game?.phase === 'setup');
      await clickLocalButton('^Start round');
      await page.waitForFunction(() => {
        const game = JSON.parse(localStorage.getItem('stack-next-local-save-v1') || 'null')?.game;
        return game && game.phase !== 'setup' && document.querySelector('.game-table-shell') && document.querySelector('.player-hand');
      });
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForFunction(() => document.querySelector('.player-hand')?.getBoundingClientRect().width > 50);
      const file = 'pileheads-game-' + variant.name + '.png';
      await page.screenshot({ path: output + '/' + file });
      captures.push({ file, url: page.url(), viewport: [variant.width, variant.height], scenario: 'anonymous local bot gameplay' });
      console.log('Captured ' + file);
    } catch (error) {
      console.error(variant.name + ': ' + error.message);
      process.exitCode = 1;
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(output + '/manifest.json', JSON.stringify({ capturedAt: new Date().toISOString(), captures }, null, 2));
}
