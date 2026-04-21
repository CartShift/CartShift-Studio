import type { CSSProperties } from 'react';
import type { CaseStudyBrand } from '@/lib/case-studies';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): RgbColor {
  const sanitized = hex.replace('#', '').trim();
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map(char => char + char)
          .join('')
      : sanitized;

  const value = normalized.padEnd(6, '0').slice(0, 6);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mix(color: RgbColor, target: RgbColor, weight: number): RgbColor {
  return {
    r: clamp(color.r + (target.r - color.r) * weight),
    g: clamp(color.g + (target.g - color.g) * weight),
    b: clamp(color.b + (target.b - color.b) * weight),
  };
}

function toCssRgb(color: RgbColor) {
  return `${color.r}, ${color.g}, ${color.b}`;
}

export function getCaseStudyThemeStyle(brand: CaseStudyBrand): CSSProperties {
  const primary = hexToRgb(brand.primary);
  const accent = hexToRgb(brand.accent || brand.primary);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 2, g: 6, b: 23 };

  const surface = mix(primary, white, 0.88);
  const border = mix(primary, white, 0.56);
  const muted = mix(primary, black, 0.18);

  return {
    '--case-primary-rgb': toCssRgb(primary),
    '--case-accent-rgb': toCssRgb(accent),
    '--case-surface-rgb': toCssRgb(surface),
    '--case-border-rgb': toCssRgb(border),
    '--case-muted-rgb': toCssRgb(muted),
  } as CSSProperties;
}
