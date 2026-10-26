import { describe, expect, it } from 'vitest';
import { parseArgs, resolveExecutable } from '../../scripts/browser-qa/verify.mjs';

describe('Docker browser capability checker', () => {
  it('uses an OS browser instead of downloaded Lambda/x86 Chromium', () => {
    const available = path => path === '/usr/bin/chromium';
    expect(resolveExecutable({}, available)).toBe('/usr/bin/chromium');
    expect(() => resolveExecutable({}, () => false)).toThrow(/No native Chromium found/);
  });

  it('requires explicit executable paths to be absolute and runnable', () => {
    expect(() => resolveExecutable({ BROWSER_EXECUTABLE_PATH: 'chromium' }, () => true))
      .toThrow(/executable absolute path/);
    expect(() => resolveExecutable({ CHROMIUM_PATH: '/tmp/chromium' }, () => false))
      .toThrow(/executable absolute path/);
    expect(resolveExecutable({ PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium' }, () => true))
      .toBe('/usr/bin/chromium');
  });

  it('validates target URLs and never accepts embedded credentials', () => {
    expect(parseArgs([]).url).toBe(null);
    expect(parseArgs(['--url', 'http://127.0.0.1:3000/he/portal/']).url)
      .toBe('http://127.0.0.1:3000/he/portal/');
    expect(() => parseArgs(['--url', 'file:///tmp/index.html'])).toThrow(/HTTP\(S\)/);
    expect(() => parseArgs(['--url', 'https://u:p@example.com/'])).toThrow(/credentials/);
    expect(() => parseArgs(['--url'])).toThrow(/requires/);
    expect(() => parseArgs(['--unexpected'])).toThrow(/Unknown argument/);
  });

  it('limits and deduplicates viewport widths', () => {
    expect(parseArgs(['--widths', '320,390,768,390']).widths).toEqual([320, 390, 768]);
    for (const input of ['320,0', '100', '5000', 'foo',
      '320,375,390,400,500,600,700,800,900,1000,1100,1200,1300']) {
      expect(() => parseArgs(['--widths', input])).toThrow(/Invalid viewport widths/);
    }
  });
});
