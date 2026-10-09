import { describe, expect, it, vi } from 'vitest';
import { classifySafeError, createSafeErrorEvent } from '@/lib/observability/safe-error-event';

describe('safe portal telemetry', () => {
  it('classifies Firebase errors with an allowlist', () => {
    expect(classifySafeError({ code: 'firestore/permission-denied' })).toEqual({
      code: 'permission-denied', category: 'permission',
    });
    expect(classifySafeError({ code: 'unavailable' })).toEqual({
      code: 'unavailable', category: 'transient',
    });
  });

  it('never includes exception messages, URLs, personal details or stacks', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
    try {
      const event = createSafeErrorEvent(Object.assign(new Error('Customer email private@sample.com'), {
        code: 'secret-token',
        stack: 'secret stack',
        url: 'https://example.com/tokens/private',
      }));
      expect(event).toEqual({
        event: 'portal.client_error',
        eventId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        category: 'unknown', code: 'unknown',
      });
      expect(JSON.stringify(event)).not.toMatch(/private|sample|token|secret/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
