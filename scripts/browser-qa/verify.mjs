#!/usr/bin/env node
/**
 * End-to-end browser capability check for the owner-only Docker sandbox.
 * No downloaded/x86 Lambda Chromium, no public network needed by default.
 *
 * Usage: node scripts/browser-qa/verify.mjs
 *        node scripts/browser-qa/verify.mjs --url http://127.0.0.1:3000/he/portal/agency/dashboard/
 * Environment: BROWSER_EXECUTABLE_PATH, BROWSER_QA_OUTPUT_DIR
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CANDIDATES = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
const WIDTHS = [320, 375, 390, 768, 1024, 1440];

export function resolveExecutable(env = process.env, executable = p => {
  try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
}) {
  const requested = env.BROWSER_EXECUTABLE_PATH || env.PUPPETEER_EXECUTABLE_PATH || env.CHROMIUM_PATH;
  if (requested) {
    if (!path.isAbsolute(requested) || !executable(requested)) {
      throw new Error('Configured browser is not an executable absolute path: ' + requested);
    }
    return requested;
  }
  const candidate = CANDIDATES.find(executable);
  if (!candidate) {
    throw new Error('No native Chromium found. Install Debian arm64 chromium in the sandbox image; run scripts/browser-qa/install-debian.sh as root, then retry.');
  }
  return candidate;
}

export function parseArgs(argv) {
  const args = { url: null, widths: WIDTHS };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') {
      const value = argv[++i];
      if (!value) throw new Error('--url requires http:// or https:// URL');
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('--url only supports HTTP(S)');
      if (url.username || url.password) throw new Error('Do not embed credentials in --url');
      args.url = url.href;
    } else if (argv[i] === '--widths') {
      const value = argv[++i];
      if (!value) throw new Error('--widths requires comma-separated pixel values');
      const list = value.split(',').map(Number);
      if (list.some(n => !Number.isInteger(n) || n < 280 || n > 3000) || list.length > 12) {
        throw new Error('Invalid viewport widths (280–3000 px; max 12)');
      }
      args.widths = [...new Set(list)];
    } else {
      throw new Error('Unknown argument: ' + argv[i]);
    }
  }
  return args;
}

const fixture = dir => `<!doctype html>
<html lang="${dir === 'rtl' ? 'he' : 'en'}" dir="${dir}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,Arial,sans-serif;color:#182338;background:#f8fafc}
main{max-width:1100px;margin:auto;padding:16px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}
.card{min-width:0;background:white;border:1px solid #ddd;border-radius:12px;padding:16px;overflow-wrap:anywhere}
nav{display:flex;gap:8px;padding:12px;background:#eef2ff}nav span{flex:1;text-align:center}
button{min-height:44px;padding:8px 16px}#response{display:none}.activated #response{display:block}
</style><body><nav><span>Home</span><span>לקוחות</span><span>Settings</span></nav>
<main><h1>${dir === 'rtl' ? 'בדיקת דפדפן: עברית ו־RTL' : 'Browser QA: English and LTR'}</h1>
<div class="cards"><div class="card">₪123,456,789.00 — responsive metrics</div><div class="card">contact-with-long-name@example.com</div>
<div class="card">Navigation, cards and safe wrapping</div></div>
<p><button id="action" onclick="document.body.classList.add('activated')">Test click</button></p>
<p id="response">Interaction passed</p></main></body></html>`;

function normalPath(url) {
  const pathname = new URL(url).pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

export async function run(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv);
  const binary = resolveExecutable(env);
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 10_000 });
  if (version.error || version.status !== 0) {
    throw new Error('Chromium is present but cannot execute: ' + (version.error?.message || (version.stderr || '').slice(0, 240)));
  }
  const versionLabel = (version.stdout || version.stderr).trim();
  const outputDir = env.BROWSER_QA_OUTPUT_DIR ||
    (fs.existsSync('/workspace/artifacts') ? '/workspace/artifacts/browser-qa' : path.resolve('artifacts/browser-qa'));
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

  // puppeteer-core does not download Chrome and must use the native OS binary.
  const puppeteer = (await import('puppeteer-core')).default;
  const browser = await puppeteer.launch({
    executablePath: binary, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 30_000,
  });

  const result = { ok: false, arch: process.arch, platform: process.platform, browser: versionLabel,
    executablePath: binary, testedUrl: options.url ? new URL(options.url).origin + new URL(options.url).pathname : 'built-in local fixture',
    outputDir, checks: [] };
  try {
    const directions = options.url ? [null] : ['ltr', 'rtl'];
    for (const direction of directions) {
      for (const width of options.widths) {
        const page = await browser.newPage();
        try {
          await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
          const address = options.url || 'data:text/html;charset=utf-8,' + encodeURIComponent(fixture(direction));
          const response = await page.goto(address, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.evaluate(() => document.fonts?.ready);
          const currentUrl = page.url();
          const redirected = Boolean(options.url && (
            new URL(currentUrl).origin !== new URL(options.url).origin ||
            normalPath(currentUrl) !== normalPath(options.url)
          ));
          const metrics = await page.evaluate(() => ({
            width: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            direction: getComputedStyle(document.documentElement).direction,
            title: document.title,
          }));
          let interactionPassed = null;
          if (!options.url) {
            await page.click('#action');
            interactionPassed = await page.$eval('#response', el => getComputedStyle(el).display !== 'none');
          }
          const filename = `${direction || 'page'}-${width}.png`;
          await page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
          const check = {
            direction: direction || metrics.direction, width, screenshot: filename,
            overflow: Math.max(metrics.documentWidth, metrics.bodyWidth) > width + 1,
            redirected, httpStatus: response?.status() || null, interactionPassed,
          };
          check.ok = !check.overflow && !check.redirected &&
            (check.httpStatus === null || check.httpStatus < 400) &&
            interactionPassed !== false;
          result.checks.push(check);
        } catch (error) {
          result.checks.push({ direction, width, ok: false, error: error.message });
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  result.ok = result.checks.length > 0 && result.checks.every(c => c.ok);
  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error('BROWSER_QA_FAILED:', error.message);
    process.exitCode = 1;
  });
}
