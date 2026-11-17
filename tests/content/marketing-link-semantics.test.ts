import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const marketingSections = join(process.cwd(), 'components', 'sections');

describe('marketing link semantics', () => {
  it('never places an interactive button inside a navigation link', () => {
    const violations: string[] = [];
    for (const file of readdirSync(marketingSections).filter(name => name.endsWith('.tsx'))) {
      const source = readFileSync(join(marketingSections, file), 'utf8');
      for (const match of source.matchAll(/<(?:Link|a)\b[^>]*>\s*<Button\b([^>]*)>/gs)) {
        if (!/\bas=["'](?:span|div)["']/.test(match[1])) violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
