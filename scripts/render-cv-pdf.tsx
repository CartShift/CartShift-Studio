import React from 'react';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pdf } from '@react-pdf/renderer';
import { CVDocument } from '@/app/[locale]/(standalone)/cv/CVDocument';
import { resolveCvPdfAssets } from '@/lib/cv/cv-media';
import {
  cvVariantIds,
  listCVVariants,
  resolveCVVariant,
  type CVVariantId,
} from '@/lib/cv/cv-variants';

const DEFAULT_OUTPUT_DIR = 'generated/cv';

function printUsage() {
  console.log(`CV generator\n\nUsage:\n  pnpm cv:list\n  pnpm cv:render <variant> [--output <directory>]\n  pnpm cv:render:all [--output <directory>]\n\nExamples:\n  pnpm cv:render product-frontend\n  pnpm cv:render fullstack-healthcare --output ./tmp/cvs\n  pnpm cv:render:all\n`);
}

function getOutputDirectory(args: string[]) {
  const outputIndex = args.indexOf('--output');
  if (outputIndex === -1) return resolve(process.cwd(), DEFAULT_OUTPUT_DIR);

  const value = args[outputIndex + 1];
  if (!value || value.startsWith('--')) {
    throw new Error('--output requires a directory path');
  }

  return resolve(process.cwd(), value);
}

function getRequestedVariant(args: string[]): CVVariantId {
  const value = args.find(arg => !arg.startsWith('--') && arg !== args[args.indexOf('--output') + 1]);

  if (!value) {
    throw new Error('Missing CV variant. Run `pnpm cv:list` to see available variants.');
  }

  if (!cvVariantIds.includes(value as CVVariantId)) {
    throw new Error(`Unknown CV variant: ${value}. Run \`pnpm cv:list\` to see available variants.`);
  }

  return value as CVVariantId;
}

async function renderVariant(id: CVVariantId, outputDirectory: string) {
  const { cv, filename, label } = resolveCVVariant(id);
  const resolvedAssets = await resolveCvPdfAssets();
  const outputPath = resolve(outputDirectory, filename);
  const stream = (await pdf(
    <CVDocument cv={cv} resolvedAssets={resolvedAssets} />
  ).toBuffer()) as Readable;

  await mkdir(outputDirectory, { recursive: true });
  await pipeline(stream, createWriteStream(outputPath));

  console.log(`✓ ${label}: ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  if (args.includes('--list')) {
    for (const variant of listCVVariants()) {
      console.log(`${variant.id.padEnd(22)} ${variant.label} -> ${variant.filename}`);
    }
    return;
  }

  const outputDirectory = getOutputDirectory(args);

  if (args.includes('--all')) {
    for (const id of cvVariantIds) {
      await renderVariant(id, outputDirectory);
    }
    return;
  }

  await renderVariant(getRequestedVariant(args), outputDirectory);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
