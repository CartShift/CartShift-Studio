/**
 * Derive PWA assets from the approved CartShift brand image.
 *
 * Keep these build-generated files out of git. This prevents the manifest from
 * advertising files that do not exist on deployments without duplicating
 * hand-maintained image variants in the repository.
 */
import { mkdir, readFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const ICON_VARIANTS = [
  { file: 'icon-192.png', size: 192, artworkFraction: 0.72 },
  { file: 'icon-512.png', size: 512, artworkFraction: 0.72 },
  // The content is intentionally inside the Android maskable safe-zone circle.
  { file: 'icon-maskable-512.png', size: 512, artworkFraction: 0.54 },
  { file: 'favicon-16x16.png', size: 16, artworkFraction: 0.72 },
  { file: 'favicon-32x32.png', size: 32, artworkFraction: 0.72 },
  { file: 'apple-touch-icon-180.png', size: 180, artworkFraction: 0.72 },
];

const BACKGROUND = '#0f172a';
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function validateManifestIcons(publicDir, manifest) {
  const problems = [];
  for (const icon of manifest.icons ?? []) {
    const src = icon.src;
    if (typeof src !== 'string' || !/^\/[A-Za-z0-9_./-]+$/.test(src) || src.includes('..')) {
      problems.push('Invalid icon path: ' + String(src));
      continue;
    }

    const absolute = join(publicDir, src.slice(1));
    try {
      await access(absolute);
    } catch {
      problems.push('Missing manifest icon: ' + src);
      continue;
    }

    if (icon.type !== 'image/png') continue; // favicon.ico declares multiple ICO sizes.
    const match = /^(\d+)x(\d+)$/.exec(icon.sizes ?? '');
    if (!match) {
      problems.push('Invalid PNG dimensions in manifest: ' + src);
      continue;
    }
    try {
      const metadata = await sharp(absolute).metadata();
      const expected = [Number(match[1]), Number(match[2])];
      if (metadata.format !== 'png' || metadata.width !== expected[0] || metadata.height !== expected[1]) {
        problems.push(
          `${src}: expected ${expected.join('x')} PNG, got ${metadata.width}x${metadata.height} ${metadata.format}`
        );
      }
    } catch (error) {
      problems.push(`${src}: cannot inspect PNG (${error instanceof Error ? error.message : error})`);
    }
  }
  return problems;
}

export async function generatePwaIcons(root = PROJECT_ROOT) {
  const publicDir = join(root, 'public');
  const source = join(publicDir, 'images', 'CarShift-Icon-Colored.png');
  const sourceMetadata = await sharp(source).metadata();
  if (!sourceMetadata.width || !sourceMetadata.height) {
    throw new Error('Approved CartShift source artwork is missing or invalid.');
  }

  await mkdir(publicDir, { recursive: true });
  for (const { file, size, artworkFraction } of ICON_VARIANTS) {
    const contained = Math.round(size * artworkFraction);
    const image = await sharp(source)
      .resize(contained, contained, { fit: 'inside' })
      .png()
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: BACKGROUND },
    })
      .composite([{ input: image, gravity: 'centre' }])
      .png()
      .toFile(join(publicDir, file));
  }

  const manifest = JSON.parse(await readFile(join(publicDir, 'manifest.json'), 'utf8'));
  const problems = await validateManifestIcons(publicDir, manifest);
  if (problems.length) throw new Error('PWA asset validation failed:\n' + problems.join('\n'));

  console.log(`Generated ${ICON_VARIANTS.length} branded PWA assets and validated manifest icons.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generatePwaIcons().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
