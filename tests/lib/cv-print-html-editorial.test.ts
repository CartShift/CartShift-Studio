import { describe, expect, it } from 'vitest';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import { renderCvHtml } from '@/lib/cv/cv-print-html';
import { renderEditorialCvHtml } from '@/lib/cv/cv-print-html-editorial';

describe('CV editorial PDF design (opt-in)', () => {
  const cv = getEnglishCVData();
  const classic = renderCvHtml(cv);
  const editorial = renderEditorialCvHtml(cv);

  it('does not change the approved classic PDF template', () => {
    expect(classic).toContain('class="portrait"');
    expect(classic).toContain('height:51mm');
    expect(classic).not.toContain('Opt-in CV treatment');
  });

  it('keeps the original single-page A4 two-column structure', () => {
    expect(editorial).toContain('@page { size: A4; margin: 0; }');
    expect(editorial).toContain('width:210mm; height:297mm');
    expect(editorial).toContain('height:46mm');
    expect(editorial).toContain('height:251mm');
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
    expect(editorial).toContain('Opt-in CV treatment');
    expect(editorial).toContain('.hero::before, .hero::after { display:none; }');
    expect(editorial).toContain('background:#f0efeb');
    expect(editorial).toContain('background:#f7f6f3');
    expect(editorial).toContain('.section-icon { display:none; }');
  });
});
