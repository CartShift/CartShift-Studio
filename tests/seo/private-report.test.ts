import { describe, expect, it } from 'vitest';
import { metadata } from '@/app/[locale]/(website)/tools/store-analyzer/report/[token]/page';

describe('private analyzer reports', () => {
  it('are never indexable', () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false, nocache: true });
  });
});
