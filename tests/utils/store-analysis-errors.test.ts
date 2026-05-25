import { describe, expect, it } from 'vitest';
import { classifyStoreAnalysisError } from '@/lib/utils/store-analysis-errors';

describe('classifyStoreAnalysisError', () => {
  it('classifies store access failures as network errors', () => {
    const result = classifyStoreAnalysisError(new Error('Could not access store URL'));
    expect(result.type).toBe('network');
    expect(result.titleKey).toBe('analyzer.errors.network.title');
    expect(result.retryable).toBe(true);
  });

  it('classifies rate limits as non-retryable validation errors', () => {
    const result = classifyStoreAnalysisError(new Error('Too many requests'));
    expect(result.type).toBe('validation');
    expect(result.titleKey).toBe('analyzer.errors.rateLimit.title');
    expect(result.retryable).toBe(false);
  });

  it('falls back to unknown for unrecognized messages', () => {
    const result = classifyStoreAnalysisError(new Error('Something unexpected'));
    expect(result.type).toBe('unknown');
    expect(result.titleKey).toBe('analyzer.errors.unknown.title');
  });
});
