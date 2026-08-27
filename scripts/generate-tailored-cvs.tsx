import React from 'react';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { renderToFile } from '@react-pdf/renderer';
import { CVDocument } from '../app/[locale]/(standalone)/cv/CVDocument';
import { resolveCvPdfAssets } from '../lib/cv/cv-media';
import {
  cvVariantDefinitions,
  cvVariantIds,
  getCVDataForVariant,
} from '../lib/cv/cv-variants';

async function main() {
  const outputDir = join(process.cwd(), 'artifacts', 'cv-tailored');
  await mkdir(outputDir, { recursive: true });

  const resolvedAssets = await resolveCvPdfAssets();

  for (const variant of cvVariantIds) {
    const definition = cvVariantDefinitions[variant];
    const cv = getCVDataForVariant(variant);
    const outputPath = join(outputDir, definition.filename);

    await renderToFile(
      React.createElement(CVDocument, {
        cv,
        resolvedAssets,
      }),
      outputPath
    );

    console.log(`Generated ${definition.label}: ${outputPath}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
