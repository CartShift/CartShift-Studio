import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockProbeAnalyzerBrowser } = vi.hoisted(() => ({
  mockProbeAnalyzerBrowser: vi.fn(),
}));

vi.mock('@/lib/services/puppeteer-launch', () => ({
  probeAnalyzerBrowser: mockProbeAnalyzerBrowser,
  launchAnalyzerBrowser: vi.fn(),
}));

import { ScraperService } from '@/lib/services/scraper';

describe('ScraperService availability reporting', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('returns an unavailable deep-scan reason when browser automation is disabled', async () => {
    vi.stubEnv('ANALYZER_DISABLE_PUPPETEER', 'true');

    const result = await ScraperService.scrape('https://store.example.com');

    expect(result.visualAnalysis).toBeNull();
    expect(result.productAnalysis).toBeUndefined();
    expect(result.deeperScan).toMatchObject({
      attempted: false,
      available: false,
      confidence: 'unavailable',
      limitations: ['Browser automation is disabled for this runtime.'],
    });
  });

  it('returns an unavailable deep-scan reason when the browser probe fails', async () => {
    vi.stubEnv('ANALYZER_DISABLE_PUPPETEER', 'false');
    mockProbeAnalyzerBrowser.mockResolvedValueOnce(false);

    const result = await ScraperService.scrape('https://store.example.com');

    expect(result.visualAnalysis).toBeNull();
    expect(result.productAnalysis).toBeUndefined();
    expect(result.deeperScan).toMatchObject({
      attempted: true,
      available: false,
      confidence: 'unavailable',
      limitations: ['Browser automation could not launch in this runtime.'],
    });
  });
});
