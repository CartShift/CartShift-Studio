import { describe, expect, it } from 'vitest';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import { renderCvHtml } from '@/lib/cv/cv-print-html';
import { renderEditorialCvHtml, resolveCVPrintDesign } from '@/lib/cv/cv-print-html-editorial';

describe('CV editorial PDF design (production default)', () => {
  const cv = getEnglishCVData();
  const classic = renderCvHtml(cv);
  const editorial = renderEditorialCvHtml(cv);

  it('defaults every production CV render to editorial while allowing classic rollback', () => {
    expect(resolveCVPrintDesign(null)).toBe('editorial');
    expect(resolveCVPrintDesign('')).toBe('editorial');
    expect(resolveCVPrintDesign('editorial')).toBe('editorial');
    expect(resolveCVPrintDesign('classic')).toBe('classic');
    expect(() => resolveCVPrintDesign('unknown')).toThrow('Unknown CV design');
  });

  it('does not change the approved classic PDF template', () => {
    expect(classic).toContain('class="portrait"');
    expect(classic).toContain('height:51mm');
    expect(classic).not.toContain('Editorial A4 treatment');
  });

  it('keeps the original single-page A4 two-column structure', () => {
    expect(editorial).toContain('@page { size: A4; margin: 0; }');
    expect(editorial).toContain('width:210mm; height:297mm');
    expect(editorial).toContain('height:51mm');
    expect(editorial).toContain('height:246mm');
    expect(editorial).toContain('grid-template-columns:138.5mm 71.5mm');
    expect(editorial.match(/class="page"/g)).toHaveLength(1);
  });

  it('omits the headshot while retaining the original contact and career content', () => {
    expect(editorial).not.toContain('class="portrait"');
    expect(editorial).not.toContain('/images/yotam-programmer.png');
    expect(editorial).toContain('Yotam Faraggi');
    expect(editorial).toContain('Professional Experience');
    expect(editorial).toContain('Earlier Experience');
    expect(editorial).toContain('Selected Products');
    expect(editorial).toContain('Core Skills');
    expect(editorial).toContain('Education');
    expect(editorial).toContain('Languages');
    expect(editorial).toContain('mailto:yotamon@gmail.com');
    expect(editorial).toContain('https://starlinker.io');
  });

  it('overrides the original decorative hero with a restrained neutral palette', () => {
    expect(editorial).toContain('Editorial A4 treatment');
    expect(editorial).toContain('.hero::before, .hero::after { display:none; }');
    expect(editorial).toContain('background:#eceae5');
    expect(editorial).toContain('background:#f6f5f2');
    expect(editorial).toContain('.section-icon { display:none; }');
  });

  it('uses readable type, measured spacing, and a consistent neutral logo treatment', () => {
    expect(editorial).toContain('font-size:6.94pt');
    expect(editorial).toContain('font-size:6.4pt');
    expect(editorial).toContain('font-size:6.18pt');
    expect(editorial).toContain('font-size:9.45pt');
    expect(editorial).toContain('font-size:29pt');
    expect(editorial).toContain('filter:grayscale(.86) saturate(.35)');
    expect(editorial).toContain('filter:grayscale(.88) saturate(.4)');
    expect(editorial).not.toContain('CURRICULUM VITAE');
    expect(editorial).not.toContain('.hero-grid::before');
    expect(editorial).toContain('border-top:1.05mm solid #7060a5');
    expect(editorial).toContain('color:#594a86');
    expect(editorial).toContain('background:#7868ae');
    expect(editorial).toContain('background:#f7f6fa');
    expect(editorial).toContain('filter:grayscale(.65) saturate(.7)');
  });

  it('keeps the entire approved CV content and exact number of selected products', () => {
    const classicBody = classic.slice(classic.indexOf('<div class="body">'));
    const editorialBody = editorial.slice(editorial.indexOf('<div class="body">'));
    expect(editorialBody).toEqual(classicBody);
    expect(editorial.match(/class="product-icon"/g)).toHaveLength(4);
    expect(editorial.match(/class="earlier-row"/g)).toHaveLength(6);
    expect(editorial.match(/class="job"/g)).toHaveLength(3);
  });
});
