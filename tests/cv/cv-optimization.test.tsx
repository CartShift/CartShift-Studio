import { render, screen, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import CVPageContent from '@/app/[locale]/(standalone)/cv/CVPageContent';
import { CookieConsent } from '@/components/ui/CookieConsent';

vi.mock('@/lib/hooks/useLanguageSync', () => ({
  useLanguageSync: vi.fn(),
}));

const enMessages = JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'));
const heMessages = JSON.parse(readFileSync(join(process.cwd(), 'messages/he.json'), 'utf8'));

function renderWithMessages(ui: React.ReactElement, locale: 'en' | 'he' = 'en') {
  return render(
    <NextIntlClientProvider messages={locale === 'he' ? heMessages : enMessages} locale={locale}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('CV recruiter optimization', () => {
  it('renders recruiter-focused skill groups and filled independent roles', () => {
    renderWithMessages(<CVPageContent />);

    expect(screen.getByText('Primary Stack')).toBeInTheDocument();
    expect(screen.getByText('E-Commerce & Integrations')).toBeInTheDocument();
    expect(screen.getByText('AI & Automation')).toBeInTheDocument();
    expect(screen.getByText('Cloud & Data')).toBeInTheDocument();
    expect(screen.getByText('Legacy Enterprise')).toBeInTheDocument();

    expect(screen.getByText('E-Commerce Founder & Developer')).toBeInTheDocument();
    expect(
      screen.getByText(/Built and operated direct-to-consumer e-commerce experiments/)
    ).toBeInTheDocument();
    expect(screen.getByText('Entrepreneur & Freelance Developer')).toBeInTheDocument();
    expect(
      screen.getByText(/Delivered freelance web and integration projects/)
    ).toBeInTheDocument();
  });

  it('keeps Hebrew recruiter skill groups localized', () => {
    renderWithMessages(<CVPageContent />, 'he');

    expect(screen.getByText('סטאק מרכזי')).toBeInTheDocument();
    expect(screen.getByText('איקומרס ואינטגרציות')).toBeInTheDocument();
    expect(screen.getByText('ענן ונתונים')).toBeInTheDocument();
    expect(screen.getAllByText('פתוח להזדמנויות').length).toBeGreaterThan(0);
  });
});

describe('CV compact cookie consent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders the compact localized consent without extra English privacy copy', async () => {
    const { container } = renderWithMessages(<CookieConsent variant="compact" delayMs={1} />, 'he');

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(container.querySelector('[data-cookie-consent-variant="compact"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'למידע נוסף' })).toBeInTheDocument();
    expect(screen.queryByText(/about our Privacy Policy/i)).not.toBeInTheDocument();
  });
});
