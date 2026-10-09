import { describe, expect, it, vi } from 'vitest';
import { isTransientFirebaseError, withRetry } from '@/lib/utils/retry';

describe('retry safety', () => {
  it('retries only transient errors', () => {
    expect(isTransientFirebaseError({ code: 'unavailable' })).toBe(true);
    expect(isTransientFirebaseError({ code: 'firestore/deadline-exceeded' })).toBe(true);
    expect(isTransientFirebaseError({ code: 'permission-denied' })).toBe(false);
    expect(isTransientFirebaseError(new Error('validation failed'))).toBe(false);
  });

  it('does not replay a forbidden or invalid write', async () => {
    const action = vi.fn().mockRejectedValue({ code: 'permission-denied' });
    await expect(withRetry(action, { initialDelay: 0 })).rejects.toEqual({ code: 'permission-denied' });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('retries a temporary outage and returns the successful result', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce({ code: 'unavailable' })
      .mockResolvedValueOnce('saved');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await expect(withRetry(action, { initialDelay: 0 })).resolves.toBe('saved');
      expect(action).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });
});
