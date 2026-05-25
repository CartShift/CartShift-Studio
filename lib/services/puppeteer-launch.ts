import type { Browser } from 'puppeteer-core';
import { Logger } from '@/lib/logger';

const LOCAL_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--disable-extensions',
];

export function isServerlessBrowserRuntime(): boolean {
  return process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION);
}

export async function launchAnalyzerBrowser(timeoutMs = 30_000): Promise<Browser> {
  if (isServerlessBrowserRuntime()) {
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');
    const executablePath = await chromium.default.executablePath();

    return puppeteer.default.launch({
      args: chromium.default.args,
      executablePath,
      headless: true,
      timeout: timeoutMs,
    });
  }

  const puppeteer = await import('puppeteer');
  return puppeteer.default.launch({
    headless: true,
    args: LOCAL_LAUNCH_ARGS,
    timeout: timeoutMs,
  }) as unknown as Browser;
}

export async function probeAnalyzerBrowser(): Promise<boolean> {
  try {
    const browser = await launchAnalyzerBrowser(8_000);
    await browser.close();
    return true;
  } catch (error) {
    Logger.warn('Analyzer browser probe failed', { error });
    return false;
  }
}
