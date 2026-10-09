import { describe, expect, it } from 'vitest';
import { previewMayContainInternalComment } from '@/lib/domain/internal-comment-preview-audit';

describe('historical internal comment preview audit', () => {
  it('flags a matching complete or truncated private note', () => {
    expect(previewMayContainInternalComment('Budget confidential', 'Budget confidential')).toBe(true);
    expect(previewMayContainInternalComment('A'.repeat(100) + '...', 'A'.repeat(120))).toBe(true);
  });

  it('does not flag irrelevant, missing or malformed content', () => {
    expect(previewMayContainInternalComment('Visible message', 'Private message')).toBe(false);
    expect(previewMayContainInternalComment(null, 'Private message')).toBe(false);
    expect(previewMayContainInternalComment('foo', undefined)).toBe(false);
  });
});
