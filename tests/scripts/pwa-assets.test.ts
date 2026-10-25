import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { validateManifestIcons } from '../../scripts/ensure-pwa-icons.mjs';

describe('PWA manifest icon validation', () => {
  it('rejects advertised assets that do not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cartshift-pwa-'));
    try {
      const errors = await validateManifestIcons(dir, {
        icons: [{ src: '/icon-512.png', type: 'image/png', sizes: '512x512' }],
      });
      expect(errors).toContain('Missing manifest icon: /icon-512.png');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects false PNG dimensions and accepts the correct ones', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cartshift-pwa-'));
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'icon-192.png'),
        await sharp({ create: {
          width: 192, height: 192, channels: 4, background: '#0f172a',
        } }).png().toBuffer()
      );
      expect(await validateManifestIcons(dir, {
        icons: [{ src: '/icon-192.png', type: 'image/png', sizes: '512x512' }],
      })).toEqual([expect.stringContaining('expected 512x512 PNG, got 192x192 png')]);
      expect(await validateManifestIcons(dir, {
        icons: [{ src: '/icon-192.png', type: 'image/png', sizes: '192x192' }],
      })).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects path traversal in manifest entries', async () => {
    expect(await validateManifestIcons('/irrelevant', {
      icons: [{ src: '/../private.png', type: 'image/png', sizes: '192x192' }],
    })).toEqual([expect.stringContaining('Invalid icon path')]);
  });
});
