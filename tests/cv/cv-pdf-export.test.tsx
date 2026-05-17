import { pdf } from '@react-pdf/renderer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { CVDocument } from '@/app/[locale]/cv/CVDocument';

const enMessages = JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'));

const experienceKeys = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
] as const;

const skillKeys = ['primary', 'ecommerce', 'ai', 'cloud', 'legacy'] as const;
const languageKeys = ['hebrew', 'english', 'german'] as const;

function createCVDocument() {
  const cv = enMessages.cv;

  return (
    <CVDocument
      name={cv.name}
      subtitle={cv.subtitle}
      location={cv.location}
      email={cv.email}
      github="https://github.com/yotamon"
      linkedin="https://linkedin.com/in/yotam-faraggi"
      summary={cv.summary.text}
      experiences={experienceKeys.map(key => ({
        company: cv.experience[key].company,
        title: cv.experience[key].title,
        duration: cv.experience[key].duration,
        durationYears: cv.experience[key].durationYears,
        location: 'location' in cv.experience[key] ? cv.experience[key].location : undefined,
        description:
          'description' in cv.experience[key] ? cv.experience[key].description : undefined,
        highlights: cv.experience[key].highlights,
      }))}
      skills={skillKeys.map(key => ({
        category: cv.skills[key].category,
        items: cv.skills[key].items,
      }))}
      education={cv.education}
      languages={languageKeys.map(key => ({
        name: cv.languageSkills[key].name,
        level: cv.languageSkills[key].level,
      }))}
    />
  );
}

async function renderPdfBuffer() {
  const stream = (await pdf(createCVDocument()).toBuffer()) as Readable;

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
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

describe('CV PDF export', () => {
  it('generates a searchable two-page PDF with clickable recruiter contact links', async () => {
    const buffer = await renderPdfBuffer();
    const raw = buffer.toString('latin1');
    const text = extractPdfText(buffer);

    expect(raw.match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
    expect(raw).toContain('/URI (mailto:yotamon@gmail.com)');
    expect(raw).toContain('/URI (https://linkedin.com/in/yotam-faraggi)');
    expect(raw).toContain('/URI (https://github.com/yotamon)');

    expect(text).toContain('professional summary');
    expect(text).toContain('professional experience');
    expect(text).toContain('technical skills');
    expect(text).toContain('education');
    expect(text).toContain('languages');
    expect(text).toContain('primary stack');
    expect(text).toContain('yotam faraggi');
  });
});
