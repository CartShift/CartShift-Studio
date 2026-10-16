import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const productionConfig = JSON.parse(readFileSync(join(root, 'tsconfig.build.json'), 'utf8'));
const defaultConfig = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'));

describe('production TypeScript scope', () => {
  it('inherits the strict project compiler options rather than bypassing errors', () => {
    expect(productionConfig.extends).toBe('./tsconfig.json');
    expect(defaultConfig.compilerOptions.strict).toBe(true);
    expect(defaultConfig.compilerOptions.noEmit).toBe(true);
    expect(productionConfig.compilerOptions.strict).toBeUndefined();
    expect(productionConfig.compilerOptions.noEmit).toBeUndefined();
    expect(productionConfig.compilerOptions.tsBuildInfoFile).not.toBe(
      defaultConfig.compilerOptions.tsBuildInfoFile
    );
  });

  it('excludes developer-only sources without hiding production application code', () => {
    for (const folder of ['tests', 'scripts', 'functions', 'node_modules']) {
      expect(productionConfig.exclude).toContain(folder);
    }
    for (const folder of ['app', 'components', 'lib', 'i18n', 'types']) {
      expect(productionConfig.exclude).not.toContain(folder);
    }
    expect(defaultConfig.include).toContain('**/*.ts');
    expect(defaultConfig.include).toContain('**/*.tsx');
  });

  it('keeps the Next.js production TypeScript gate enabled', () => {
    const nextConfig = readFileSync(join(root, 'next.config.mjs'), 'utf8');
    expect(nextConfig).toContain('ignoreBuildErrors: false');
    expect(nextConfig).toContain("'tsconfig.build.json'");
    expect(nextConfig).toContain("'tsconfig.json'");
  });
});
