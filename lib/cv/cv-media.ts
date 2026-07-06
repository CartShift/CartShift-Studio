import type { CVExperienceKey } from './cv-data';

export const CV_PROFILE_IMAGE = '/images/yotam-programmer.png';

export const CV_LIVE_CV_URL = 'https://cart-shift.com/en/cv';
export const CV_LIVE_CV_DISPLAY = 'cart-shift.com/en/cv';

export const companyLogos: Partial<Record<CVExperienceKey, string>> = {
  cartshift: '/images/cv/cart_shift_logo.jpg',
  curalife: '/images/cv/curalife_logo.jpg',
  paragonex: '/images/cv/paragon_ex_logo.jpg',
  hot: '/images/cv/hot_logo.jpg',
  leumi: '/images/cv/bank_leumi_logo.jpg',
  elbit: '/images/cv/elbit_systems_ltd_logo.jpg',
  airforce: '/images/cv/israeli_air_force_logo.jpg',
};

export function resolveCvPdfAsset(assetPath: string): string {
  if (/^(https?:|data:|file:)/.test(assetPath)) return assetPath;

  if (typeof window === 'undefined' || process.env.VITEST) {
    const { join, extname } = require('node:path') as typeof import('node:path');
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const filePath = join(process.cwd(), 'public', assetPath.replace(/^\//, ''));
    const mime = extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;
  }

  return new URL(assetPath, window.location.origin).href;
}
