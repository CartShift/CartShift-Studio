import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBillingProfile } from '@/lib/services/request-billing-server';

const mocks = vi.hoisted(() => ({ session: vi.fn(), collection: vi.fn() }));
vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: mocks.session }));
vi.mock('@/lib/firebase-admin', () => ({ adminDb: { collection: mocks.collection } }));

function setupDb(accountType: 'CLIENT' | 'AGENCY', role = '') {
  mocks.collection.mockImplementation((name: string) => ({
    doc: (id: string) => ({
      get: async () => {
        if (name === 'portal_users') {
          return { exists: true, data: () => ({ accountType, isAgency: accountType === 'AGENCY', agencyRole: role }) };
        }
        if (name === 'system_settings') {
          return { exists: true, data: () => ({ billingProfileOwnerId: 'owner' }) };
        }
        if (name === 'portal_billing_profiles' && id === 'owner') {
          return { exists: true, data: () => ({ businessName: 'Studio', bankDetails: { iban: 'private' } }) };
        }
        throw new Error(`Unexpected query: ${name}/${id}`);
      },
    }),
  }));
}

describe('billing profile API authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ uid: 'caller', email: 'caller@example.com', emailVerified: true });
  });

  it('does not load bank details for a regular signed-in client', async () => {
    setupDb('CLIENT');
    await expect(getBillingProfile()).rejects.toThrow('FORBIDDEN');
    expect(mocks.collection).not.toHaveBeenCalledWith('system_settings');
    expect(mocks.collection).not.toHaveBeenCalledWith('portal_billing_profiles');
  });

  it('does not load bank details for an agency developer without finance permission', async () => {
    setupDb('AGENCY', 'developer');
    await expect(getBillingProfile()).rejects.toThrow('FORBIDDEN');
    expect(mocks.collection).not.toHaveBeenCalledWith('portal_billing_profiles');
  });

  it('allows agency finance roles to read their configured billing profile', async () => {
    setupDb('AGENCY', 'admin');
    const profile = await getBillingProfile();
    expect(profile?.bankDetails?.iban).toBe('private');
    expect(mocks.collection).toHaveBeenCalledWith('portal_billing_profiles');
  });
});
