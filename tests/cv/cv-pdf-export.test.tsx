import { pdf } from '@react-pdf/renderer';
import type { Readable } from 'node:stream';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { CVDocument } from '@/app/[locale]/(standalone)/cv/CVDocument';
import { getEnglishCVData } from '@/lib/cv/cv-data';
import { resolveCvPdfAssets } from '@/lib/cv/cv-media';

async function createCVDocument() {
  const resolvedAssets = await resolveCvPdfAssets();
  return <CVDocument cv={getEnglishCVData()} resolvedAssets={resolvedAssets} />;
}

async function renderPdfBuffer() {
  const stream = (await pdf(await createCVDocument()).toBuffer()) as Readable;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

function extractPdfText(buffer: Buffer) {
  const raw = buffer.toString('latin1');
  let decodedStreams = '';

  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      decodedStreams += inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1');
    } catch {
      // Some PDF streams are not text streams; ignore those for extraction.
    }
  }

  return [...decodedStreams.matchAll(/<([0-9A-Fa-f]+)>/g)]
    .map(match => Buffer.from(match[1], 'hex').toString('latin1'))
    .join('')
    .replace(/\s+/g, ' ');
}

function expectPdfTextIncludes(text: string, expected: string) {
  expect(text.toLowerCase()).toContain(expected.toLowerCase());
}

describe('CV PDF export', () => {
  it('generates a searchable two-page PDF with clickable recruiter contact links', async () => {
    const buffer = await renderPdfBuffer();
    const raw = buffer.toString('latin1');
    const text = extractPdfText(buffer);

    expect(raw.match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
    expect(raw.match(/\/Subtype\s*\/Image\b/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(text.trim().length).toBeGreaterThan(1000);

    expect(raw).toContain('/URI (mailto:yotamon@gmail.com)');
    expect(raw).toContain('/URI (tel:+4915776211298)');
    expect(raw).toContain('/URI (https://linkedin.com/in/yotam-faraggi)');
    expect(raw).toContain('/URI (https://github.com/yotamon)');
    expect(raw).toContain('/URI (https://cart-shift.com/en/cv)');

    [
      'Yotam Faraggi',
      'Senior Product Engineer',
      'EU citizen',
      '+4915776211298',
      'Professional Experience',
      'Technical Skills',
      'Portfolio: cart-shift.com/en/cv',
      'CartShift Studio',
      'Curalife',
      'ParagonEX',
      'HOT',
      'Leumi Bank',
      'Elbit Systems',
      'Israeli Air Force / Mamram',
      'Military Service',
      'IDF School for Computer Professions',
      'Programming Course',
      'Bar-Ilan University',
      'LEGACY ENTERPRISE',
      'WordPress',
      'HubSpot',
      'Web application architecture',
      'Google Cloud Platform',
    ].forEach(expected => expectPdfTextIncludes(text, expected));

    [
      'CartShift Studio CV',
      'R&D Lead & Senior Full Stack Developer',
      'Professional Summary',
      'Earlier Engineering Experience',
      'Page 1 of 2',
      'Page 2 of 2',
      'Live CV & Portfolio',
    ].forEach(forbidden => {
      expect(text).not.toContain(forbidden);
      expect(raw).not.toContain(forbidden);
    });

    expect(raw).not.toMatch(/Page\s+\d+\s+of\s+\d+/i);
    expect(text).not.toMatch(/Word[\s-]+Press/i);
    expect(text).not.toMatch(/Hub[\s-]+Spot/i);
  }, 30_000);
});
