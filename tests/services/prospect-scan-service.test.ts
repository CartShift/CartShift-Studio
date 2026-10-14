import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({ adminDb: null }));
vi.mock('@/lib/services/prospects-server', () => ({
  requireProspectActor: vi.fn(async (uid: string) => ({ uid, role: 'owner' })),
}));

import { scanProspect } from '@/lib/services/prospect-scan-service';

describe('prospect rollout safety gate', () => {
  it('refuses live scans unless explicitly enabled by server deployment settings', async () => {
    const previous = process.env.PROSPECT_SCANS_ENABLED;
    delete process.env.PROSPECT_SCANS_ENABLED;
    try {
      await expect(scanProspect('prospect_' + 'a'.repeat(32), 'owner'))
        .rejects.toThrow('SCAN_DISABLED');
    } finally {
      if (previous === undefined) delete process.env.PROSPECT_SCANS_ENABLED;
      else process.env.PROSPECT_SCANS_ENABLED = previous;
    }
  });
});
