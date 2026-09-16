import { describe, expect, it } from 'vitest';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import { renderCvHtml } from '@/lib/cv/cv-print-html';

describe('CV browser print template', () => {
  const html = renderCvHtml(getEnglishCVData(), {});

  it('renders the approved one-page A4 layout', () => {
    expect(html).toContain('@page { size: A4; margin: 0; }');
    expect(html).toContain('width:210mm; height:297mm');
    expect(html).toContain('Senior Full-Stack Product Engineer');
    expect(html).toContain('INDEPENDENT VENTURE');
  });

  it('keeps the compact career hierarchy and understated early systems role', () => {
    expect(html).toContain('Professional Experience');
    expect(html).toContain('Earlier Experience');
    expect(html).toContain('Mamram / Technical Systems Unit');
    expect(html).not.toContain('IDF / Mamram');
    expect(html).not.toContain('text-overflow:ellipsis');
  });

  it('renders all selected products with clickable destinations', () => {
    expect(html).toContain('https://starlinker.io');
    expect(html).toContain('https://wakemyway.vercel.app');
    expect(html).toContain('https://right-flow.com');
    expect(html).toContain('https://github.com/yotamon/Liquid-Loom');
    expect(html).toContain('WakeMyWay');
    expect(html).toContain('Liquid Loom');
  });

  it('keeps the approved design free of the removed decorative quote', () => {
    expect(html).not.toContain('Turn complexity');
    expect(html).not.toContain('quote-card');
  });
});
