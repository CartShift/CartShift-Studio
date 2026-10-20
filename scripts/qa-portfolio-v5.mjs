#!/usr/bin/env node
/**
 * On-demand browser smoke checks for Portfolio V5.
 * Uses dependencies already included in CartShift. Does not deploy or mutate data.
 * Usage:
 *   PORTFOLIO_V5_BASE_URL=https://cart-shift.com node scripts/qa-yotam.mjs
 *   PORTFOLIO_V5_BASE_URL=http://localhost:3000 V5_QA_SCREENSHOTS=1 node scripts/qa-yotam.mjs
 */
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { mkdir } from 'node:fs/promises';

const base = (process.env.PORTFOLIO_V5_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const screenshots = process.env.V5_QA_SCREENSHOTS === '1';
const output = './tmp/yotam-qa';
const cases = [
  { locale: 'en', page: '', width: 390, height: 844, mobile: true },
  { locale: 'en', page: '', width: 1440, height: 900, mobile: false },
  { locale: 'he', page: '', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'work', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'work/starlinker', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'work/wakemyway', width: 1440, height: 900, mobile: false },
  { locale: 'en', page: 'work/rightflow', width: 390, height: 844, mobile: true },
  { locale: 'he', page: 'work/cartshift-studio', width: 1440, height: 900, mobile: false },
  { locale: 'he', page: 'work/ensemblis', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'experience', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'experience', width: 1440, height: 900, mobile: false },
  { locale: 'en', page: 'about', width: 390, height: 844, mobile: true },
  { locale: 'en', page: 'contact', width: 390, height: 844, mobile: true },
  { locale: 'he', page: 'work', width: 390, height: 844, mobile: true },
  { locale: 'he', page: 'experience', width: 390, height: 844, mobile: true },
  { locale: 'he', page: 'about', width: 390, height: 844, mobile: true },
  { locale: 'he', page: 'contact', width: 390, height: 844, mobile: true },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  if (screenshots) await mkdir(output, { recursive: true });
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader'],
    executablePath: process.env.CHROMIUM_PATH || await chromium.executablePath(),
    headless: true,
  });
  const failures = [];
  try {
    for (const test of cases) {
      const path = '/' + test.locale + '/yotam' + (test.page ? '/' + test.page : '');
      const name = test.locale + '-' + (test.page || 'home').replaceAll('/', '-') + '-' + (test.mobile ? 'mobile' : 'desktop');
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(8_000);
      await page.setViewport({ width: test.width, height: test.height, isMobile: test.mobile, hasTouch: test.mobile, deviceScaleFactor: 1 });
      try {
        const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        assert(response && [200, 304].includes(response.status()), name + ': bad HTTP status ' + response?.status());
        assert(await page.$('h1'), name + ': missing h1');
        assert(!(await page.$('meta[name="robots"][content*="noindex"]')), name + ': personal portfolio unexpectedly noindex');
        const canonical = await page.$eval('link[rel="canonical"]', element => element.getAttribute('href'));
        assert(canonical?.endsWith(path), name + ': wrong canonical URL ' + canonical);
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(width <= test.width + 1, name + ': horizontal overflow ' + width + ' > ' + test.width);
        if (test.page?.startsWith('work/')) {
          const story = await page.$('main[data-project]');
          assert(story, name + ': bespoke project story not rendered');
          const storySlug = await page.$eval('main[data-project]', node => node.getAttribute('data-project'));
          assert(storySlug === test.page.split('/')[1], name + ': wrong project story: ' + storySlug);
          assert(await page.$('main[data-project] h1'), name + ': project headline missing');
          assert(await page.$('main[data-project] img'), name + ': original project media missing');
          assert((await page.$('main[data-project] > section')).length >= 4, name + ': incomplete unique story sections');
          assert(!(await page.$('.v5-case-study')), name + ': generic replacement template should not render');
        }
        if (test.page === 'experience') {
          const counts = await page.evaluate(() => ({
            recent: document.querySelectorAll('.v5-exp-timeline > li').length,
            earlier: document.querySelectorAll('.v5-exp-early-list > li').length,
            skills: document.querySelectorAll('.v5-exp-skill').length,
            pdf: !!document.querySelector('.v5-exp-actions a[download]'),
          }));
          assert(counts.recent === 3, name + ': expected 3 detailed recent roles');
          assert(counts.earlier === 6, name + ': expected 6 earlier roles');
          assert(counts.skills === 6, name + ': expected 6 skill families');
          assert(counts.pdf, name + ': missing CV download');
        }
        if (!test.page) {
          await page.waitForSelector('.v5-immersive-title', { visible: true });
          assert(await page.$('a[href$="/yotam/work"]'), name + ': missing work link');
          assert(await page.$('a[href$="/yotam/about"]'), name + ': missing about link');
          assert((await page.$$('.v5-editorial-project')).length === 5, name + ': expected five featured projects');
          assert((await page.$$('.v5-editorial-project-visual img')).length === 5, name + ': missing product previews');
          assert(await page.$('a[href$="/yotam/work/starlinker"]'), name + ': missing canonical case study link');
          const canvas = await page.$('.v5-fluid-canvas');
          assert(canvas, name + ': missing procedural artwork canvas');
          await page.waitForFunction(() => document.querySelector('.v5-fluid-canvas')?.dataset.rendered === 'true',
            { timeout: 7_000 }).catch(() => null);
          const rendering = await page.evaluate(() => !!document.querySelector('.v5-fluid-canvas')?.dataset.rendered);
          const fallbackVisible = await page.evaluate(() => getComputedStyle(document.querySelector('.v5-fluid-fallback')).opacity !== '0');
          assert(rendering || fallbackVisible, name + ': neither WebGL nor fallback artwork is visible');
        }
        if (name === 'en-home-mobile') {
          await page.click('.v5-menu-toggle');
          assert(await page.evaluate(() => document.querySelector('dialog.v5-menu-panel')?.open), 'native dialog did not open');
          const focusInDialog = await page.evaluate(() => document.querySelector('dialog.v5-menu-panel').contains(document.activeElement));
          assert(focusInDialog, 'modal did not receive keyboard focus');
          await page.keyboard.press('Escape');
          assert(await page.evaluate(() => !document.querySelector('dialog.v5-menu-panel')?.open), 'Escape did not dismiss the modal');
          const focusedTrigger = await page.evaluate(() => document.activeElement?.classList.contains('v5-menu-toggle'));
          assert(focusedTrigger, 'focus did not return to menu trigger');
          await page.click('.v5-motion-button');
          assert(await page.$eval('.v5-motion-button', button => button.getAttribute('aria-pressed') === 'true'), 'motion pause failed');
          // Users can still navigate with motion paused; requestAnimationFrame is suspended.
          await page.click('.v5-motion-button');
          assert(await page.$eval('.v5-motion-button', button => button.getAttribute('aria-pressed') === 'false'), 'motion resume failed');
        }
        if (screenshots) await page.screenshot({ path: output + '/' + name + '.png' });
        if (name === 'en-home-desktop' && process.env.V5_QA_SKIP_MOTION !== '1') {
          await page.click('.v5-immersive-links a[href$="/work"]');
          const wipe = await page.$eval('.v5-transition-wipe', node =>
            node.classList.contains('v5-transition-wipe--cover'));
          assert(wipe, 'portfolio page transition did not start');
          await page.waitForFunction(() => location.pathname.endsWith('/yotam/work'),
            { timeout: 20_000 });
          await page.waitForFunction(() => document.querySelector('.v5-transition-wipe')
            ?.classList.contains('v5-transition-wipe--idle'), { timeout: 5_000 });
          await page.waitForSelector('.v5-work-row', { timeout: 8_000 });
          assert((await page.evaluate(() => document.querySelectorAll('.v5-work-row').length)) > 0,
            'portfolio page transition did not reveal the destination');
        }
        assert(errors.length === 0, name + ': uncaught errors: ' + errors.join(', '));
        console.log('PASS ' + name + ' HTTP ' + response.status() + ' / width ' + width + 'px');
      } catch (error) {
        failures.push({ page: name, error: error.message });
        console.error('FAIL ' + name + ': ' + error.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log('Portfolio V5: all checks passed.');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
