import { describe, expect, it } from 'vitest';
import { classifyChanges } from '../../scripts/ci/plan-checks.mjs';

describe('risk-aware CI scope', () => {
  it('runs the frontend gate for app, translation, test and shared UI changes', () => {
    expect(classifyChanges(['app/[locale]/page.tsx'])).toEqual({
      frontend: true, functions: false, rules: false,
    });
    expect(classifyChanges(['messages/src/he/portal.json', 'tests/api/cartshift-mcp.test.ts']).frontend).toBe(true);
  });

  it('runs only Functions QA for Functions-only changes', () => {
    expect(classifyChanges(['functions/index.js', 'tests/functions/retry.test.cjs'])).toEqual({
      frontend: false, functions: true, rules: false,
    });
  });

  it('runs only security-rules QA for Firestore and Storage changes', () => {
    expect(classifyChanges(['firestore.rules', 'tests/storage/tenant-rules.cjs'])).toEqual({
      frontend: false, functions: false, rules: true,
    });
  });

  it('runs relevant gates for mixed changes', () => {
    expect(classifyChanges(['functions/index.js', 'app/page.tsx', 'storage.rules'])).toEqual({
      frontend: true, functions: true, rules: true,
    });
  });

  it('does not install dependencies for documentation-only changes', () => {
    expect(classifyChanges(['docs/engineering/ci.md', 'README.md'])).toEqual({
      frontend: false, functions: false, rules: false,
    });
  });

  it('runs all gates on shared dependency/workflow changes and uncertain diffs', () => {
    for (const file of ['pnpm-lock.yaml', 'pnpm-workspace.yaml', '.github/workflows/ci.yml']) {
      expect(classifyChanges([file])).toEqual({ frontend: true, functions: true, rules: true });
    }
    expect(classifyChanges([])).toEqual({ frontend: true, functions: true, rules: true });
    expect(classifyChanges(null)).toEqual({ frontend: true, functions: true, rules: true });
  });

  it('preserves separate manual-workflow checks', () => {
    expect(classifyChanges(['.github/workflows/functions-qa.yml'])).toEqual({
      frontend: false, functions: true, rules: false,
    });
    expect(classifyChanges(['.github/workflows/firestore-rules-qa.yml'])).toEqual({
      frontend: false, functions: false, rules: true,
    });
  });
});
