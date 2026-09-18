import { describe, expect, it } from 'vitest';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import { renderCvHtml } from '@/lib/cv/cv-print-html';

describe('CV PDF export source', () => {
  const html = renderCvHtml(getEnglishCVData(), {});

  it('renders a single A4 browser-print document with recruiter contact links', () => {
    expect(html).toContain('@page { size: A4; margin: 0; }');
    expect(html).toContain('width:210mm; height:297mm');
    expect(html).toContain('overflow:hidden');

    expect(html).toContain('mailto:yotamon@gmail.com');
    expect(html).toContain('tel:+4915776211298');
    expect(html).toContain('https://linkedin.com/in/yotam-faraggi');
    expect(html).toContain('https://github.com/yotamon');
    expect(html).toContain('https://cart-shift.com/en/yotam');
  });

  it('contains the approved master CV hierarchy and content', () => {
    [
      'Yotam Faraggi',
      'Senior Full-Stack Product Engineer',
      'EU citizen',
      'Professional Experience',
      'Earlier Experience',
      'Selected Products',
      'Core Skills',
      'CartShift Studio',
      'INDEPENDENT VENTURE',
      'Curalife',
      'ParagonEX',
      'HOT',
      'Leumi Bank',
      'Elbit Systems',
      'Mamram / Technical Systems Unit',
      'Basmach',
      'Bar-Ilan University',
    ].forEach(expected => expect(html).toContain(expected));

    [
      'IDF / Mamram',
      'Israeli Air Force',
      'Military Service',
      'Turn complexity',
      'Page 1 of 2',
      'Page 2 of 2',
    ].forEach(forbidden => expect(html).not.toContain(forbidden));
  });

  it('contains all approved product links and thumbnails', () => {
    expect(html).toContain('StarLinker');
    expect(html).toContain('https://starlinker.io');
    expect(html).toContain('WakeMyWay');
    expect(html).toContain('https://wakemyway.vercel.app');
    expect(html).toContain('RightFlow');
    expect(html).toContain('https://right-flow.com');
    expect(html).toContain('Liquid Loom');
    expect(html).toContain('https://github.com/yotamon/Liquid-Loom');

    // Project thumbnails are inline SVG so they remain crisp in the generated PDF.
    expect(html.match(/class="product-icon"/g)?.length).toBe(4);
  });

  it('uses stable date/location columns instead of overlapping metadata', () => {
    expect(html).toContain('class="job-meta"');
    expect(html).toContain('class="meta-date"');
    expect(html).toContain('class="meta-place"');
    expect(html).toContain('flex:0 0 31mm');
    expect(html).not.toContain('.job-meta { position:absolute');
  });
});
