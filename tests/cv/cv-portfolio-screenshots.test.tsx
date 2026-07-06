import { render, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import CVPageContent from '@/app/[locale]/(standalone)/cv/CVPageContent';

vi.mock('@/lib/hooks/useLanguageSync', () => ({
  useLanguageSync: vi.fn(),
}));

const enMessages = JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'));
const heMessages = JSON.parse(readFileSync(join(process.cwd(), 'messages/he.json'), 'utf8'));

function renderCV(locale: 'en' | 'he') {
  return render(
    <NextIntlClientProvider messages={locale === 'he' ? heMessages : enMessages} locale={locale}>
      <CVPageContent />
    </NextIntlClientProvider>
  );
}

function expectImage(container: HTMLElement, src: string) {
  expect(
    container.querySelector(`img[src="${src}"], img[src^="${src}?"]`)
  ).toBeInTheDocument();
}

describe('CV portfolio screenshot variants', () => {
  it('uses English light and dark screenshots on the English CV', () => {
    const { container } = renderCV('en');

    expectImage(container, '/images/cv/portfolio/cartshift-en-light.png');
    expectImage(container, '/images/cv/portfolio/cartshift-en-dark.png');
    expectImage(container, '/images/cv/portfolio/rightflow-en-light.png');
    expectImage(container, '/images/cv/portfolio/rightflow-en-dark.png');
    expect(
      container.querySelector('[aria-label="Preview light screenshot"]')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[aria-label="Preview dark screenshot"]')
    ).not.toBeInTheDocument();
  }, 10000);

  it('syncs portfolio screenshots to the current page theme', async () => {
    document.documentElement.classList.add('dark');
    const { container, unmount } = renderCV('en');

    await waitFor(() => {
      expect(
        container.querySelector(
          'img[src="/images/cv/portfolio/rightflow-en-dark.png"], img[src^="/images/cv/portfolio/rightflow-en-dark.png?"]'
        )
      ).toHaveClass('opacity-100');
    });
    expect(
      container.querySelector(
        'img[src="/images/cv/portfolio/rightflow-en-light.png"], img[src^="/images/cv/portfolio/rightflow-en-light.png?"]'
      )
    ).toHaveClass('opacity-0');

    unmount();
    document.documentElement.classList.remove('dark');
  });

  it('uses Hebrew screenshots for localized projects on the Hebrew CV', () => {
    const { container } = renderCV('he');

    expectImage(container, '/images/cv/portfolio/cartshift-he-light.png');
    expectImage(container, '/images/cv/portfolio/cartshift-he-dark.png');
    expectImage(container, '/images/cv/portfolio/rightflow-he-light.png');
    expectImage(container, '/images/cv/portfolio/rightflow-he-dark.png');
  });

  it('falls back to English screenshots for English-only projects on the Hebrew CV', () => {
    const { container } = renderCV('he');

    expectImage(container, '/images/cv/portfolio/atlas-irwin-en-light.png');
    expectImage(container, '/images/cv/portfolio/atlas-irwin-en-dark.png');
    expectImage(container, '/images/cv/portfolio/starlinker-en-light.png');
    expectImage(container, '/images/cv/portfolio/starlinker-en-dark.png');
    expect(
      container.querySelector('img[src="/images/cv/portfolio/atlas-irwin-he-light.png"]')
    ).toBe(null);
    expect(container.querySelector('img[src="/images/cv/portfolio/starlinker-he-light.png"]')).toBe(
      null
    );
  });
});
