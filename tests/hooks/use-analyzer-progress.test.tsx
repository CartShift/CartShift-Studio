import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalyzerProgress } from '@/lib/hooks/use-analyzer-progress';

describe('useAnalyzerProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle when inactive', () => {
    const { result } = renderHook(() => useAnalyzerProgress(false));

    expect(result.current.progress).toBe(0);
    expect(result.current.phase).toBe('connecting');
    expect(result.current.elapsedMs).toBe(0);
  });

  it('ticks progress while active and jumps to 100 when complete', () => {
    const { result } = renderHook(() => useAnalyzerProgress(true));

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.progress).toBeGreaterThan(0);
    expect(result.current.progress).toBeLessThan(85);
    expect(result.current.phase).toBe('performance');

    act(() => {
      result.current.markComplete();
    });

    expect(result.current.progress).toBe(100);
    expect(result.current.phase).toBe('generating');
  });

  it('resets when deactivated', () => {
    const { result, rerender } = renderHook(({ active }) => useAnalyzerProgress(active), {
      initialProps: { active: true },
    });

    act(() => {
      vi.advanceTimersByTime(10_000);
      result.current.markComplete();
    });

    expect(result.current.progress).toBe(100);

    rerender({ active: false });

    expect(result.current.progress).toBe(0);
    expect(result.current.elapsedMs).toBe(0);
  });
});
