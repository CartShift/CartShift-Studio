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

export const cvPdfAssetPaths = [
  CV_PROFILE_IMAGE,
  ...Object.values(companyLogos),
] as const;

async function toDataUri(filePath: string): Promise<string> {
  const { extname } = await import('node:path');
  const { readFileSync } = await import('node:fs');
  const ext = extname(filePath).toLowerCase();
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;
}

export function resolveCvPdfAsset(assetPath: string): string {
  if (/^(https?:|data:|file:)/.test(assetPath)) return assetPath;

  if (typeof window === 'undefined') {
    return assetPath;
  }

  return new URL(assetPath, window.location.origin).href;
}

export async function resolveCvPdfAssetAsync(assetPath: string): Promise<string> {
  if (/^(https?:|data:|file:)/.test(assetPath)) return assetPath;

  if (typeof window === 'undefined' || process.env.VITEST) {
    const { join } = await import('node:path');
    const filePath = join(process.cwd(), 'public', assetPath.replace(/^\//, ''));
    return toDataUri(filePath);
  }

  const response = await fetch(new URL(assetPath, window.location.origin).href);
  if (!response.ok) {
    throw new Error(`Failed to load CV asset: ${assetPath}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }

  const ext = assetPath.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function resolveCvPdfAssets(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    cvPdfAssetPaths.map(async assetPath => [assetPath, await resolveCvPdfAssetAsync(assetPath)] as const)
  );

  return Object.fromEntries(entries);
}
