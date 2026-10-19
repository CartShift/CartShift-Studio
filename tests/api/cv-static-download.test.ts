import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/cv/render/route';
import {
  CV_STATIC_INLINE_PATH,
  CV_STATIC_DOWNLOAD_PATH,
} from '@/lib/cv/cv-static';

describe('Public CV download — static delivery', () => {
  it('opens the editorial master as a static PDF without starting Chromium', async () => {
    const response = await GET(
      new Request('https://cart-shift.com/api/cv/render?variant=default&inline=1')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      `https://cart-shift.com${CV_STATIC_INLINE_PATH}`
    );
    expect(response.headers.get('x-cv-renderer')).toBe('static-build');
  });

  it('preserves the normal recruiter download behavior', async () => {
    const response = await GET(
      new Request('https://cart-shift.com/api/cv/render?variant=default')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      `https://cart-shift.com${CV_STATIC_DOWNLOAD_PATH}`
    );
  });

  it('rejects invalid design names rather than accidentally downloading', async () => {
    const response = await GET(
      new Request('https://cart-shift.com/api/cv/render?variant=default&design=unknown')
    );
    expect(response.status).toBe(400);
  });

  it('serves only PDF assets with separate inline and attachment URLs', () => {
    expect(CV_STATIC_DOWNLOAD_PATH).toMatch(/\.pdf$/);
    expect(CV_STATIC_INLINE_PATH).toMatch(/\.pdf$/);
    expect(CV_STATIC_INLINE_PATH).not.toBe(CV_STATIC_DOWNLOAD_PATH);
  });
});
