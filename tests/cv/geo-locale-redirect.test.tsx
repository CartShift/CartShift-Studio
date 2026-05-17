import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GeoLocaleRedirect, isExplicitCvPath } from '@/components/providers/GeoLocaleRedirect';

const mockReplace = vi.fn();
let mockPathname = '/en/cv';
let mockLocale = 'en';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
}));

describe('GeoLocaleRedirect CV behavior', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('geo_locale_detected', 'IL');
    localStorage.setItem('geo_locale_timestamp', Date.now().toString());
  });

  it.each(['/en/cv', '/he/cv'])('does not geo-redirect explicit CV path %s', path => {
    mockPathname = path;
    mockLocale = path.startsWith('/he') ? 'he' : 'en';

    render(<GeoLocaleRedirect />);

    expect(isExplicitCvPath(path)).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
