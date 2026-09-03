import { pdf } from '@react-pdf/renderer';
import type { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { CVDocument } from '@/app/[locale]/(standalone)/cv/CVDocument';
import { resolveCvPdfAssets } from '@/lib/cv/cv-media';
import { resolveCVVariant, type CVVariantId } from '@/lib/cv/cv-variants';

const tailoredVariants: CVVariantId[] = [
  'product-frontend',
  'fullstack-healthcare',
  'product-ai',
];

async function renderVariantBuffer(id: CVVariantId) {
  const resolvedAssets = await resolveCvPdfAssets();
  const { cv } = resolveCVVariant(id);
  const stream = (await pdf(
    <CVDocument cv={cv} resolvedAssets={resolvedAssets} />
  ).toBuffer()) as Readable;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

describe('tailored CV PDF export', () => {
  for (const id of tailoredVariants) {
    it(`${id} remains a two-page searchable PDF`, async () => {
      const buffer = await renderVariantBuffer(id);
      const raw = buffer.toString('latin1');

      expect(raw.match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
      expect(raw).toContain('/URI (mailto:yotamon@gmail.com)');
      expect(raw).toContain('/URI (https://linkedin.com/in/yotam-faraggi)');
      expect(buffer.length).toBeGreaterThan(20_000);
    }, 30_000);
  }
});
