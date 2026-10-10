import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FeaturedShowcase from '@/app/[locale]/(standalone)/yotam/FeaturedShowcase';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

const project = getPortfolioShowcases('en').find(item => item.slug === 'starlinker')!;

describe('featured portfolio case study', () => {
  it('shows the real product before technical detail and actions, with one main heading', () => {
    const html = renderToStaticMarkup(
      createElement(FeaturedShowcase, { project, locale: 'en', isHebrew: false })
    );

    expect(html).toContain('Selected work');
    expect(html).toContain('StarLinker');
    expect(html).toContain('Product preview');
    expect(html).toContain(project.hero!.src);
    expect(html).not.toContain('Not just an idea');
    expect((html.match(/<h2\b/g) ?? []).length).toBe(1);

    const title = html.indexOf('id="yotam-featured-title"');
    const preview = html.indexOf('class="yotam-featured-visual');
    const evidence = html.indexOf('class="yotam-featured-details');
    expect(title).toBeGreaterThan(-1);
    expect(preview).toBeGreaterThan(title);
    expect(evidence).toBeGreaterThan(preview);
    expect(html).toContain('href="/en/portfolio/starlinker"');
    expect(html).toContain('href="#more-work"');
  });

  it('keeps the same project actions accessible in Hebrew', () => {
    const html = renderToStaticMarkup(
      createElement(FeaturedShowcase, { project, locale: 'he', isHebrew: true })
    );

    expect(html).toContain('עבודה נבחרת');
    expect(html).toContain('הצצה למוצר');
    expect(html).toContain('href="/he/portfolio/starlinker"');
    expect(html).toContain('aria-labelledby="yotam-featured-title"');
    expect(html).toContain('alt="StarLinker visual planning workspace"');
  });

  it('protects dark text contrast and a visual-first mobile layout from theme styles', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'app/[locale]/(standalone)/yotam/yotam-profile.css'),
      'utf8'
    );
    expect(css).toMatch(/\.yotam-portfolio \.yotam-featured-title\s*\{[^}]*color: #1d1d1f !important/s);
    expect(css).toMatch(/-webkit-text-fill-color: #1d1d1f !important/);
    expect(css).toMatch(/grid-template-areas:\s*"intro" "visual" "details"/);
  });
});
