import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('German public-content release contract', () => {
  it('has the same source-key coverage and Markdown link/media structure as English', () => {
    const script = path.join(process.cwd(), 'scripts/check-german-parity.cjs');
    const result = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 2_000_000,
    });
    expect(result.error?.message).toBeUndefined();
    expect(result.status, [result.stdout, result.stderr].filter(Boolean).join('\n')).toBe(0);
    expect(result.stdout).toMatch(/\d+ blog articles; \d+ case studies/);
  });
});
