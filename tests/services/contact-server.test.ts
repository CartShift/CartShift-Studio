import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), create: vi.fn(), set: vi.fn(), batchUpdate: vi.fn(),
  commit: vi.fn(), runTransaction: vi.fn(), jobsGet: vi.fn(),
}));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-time',
    increment: (value: number) => ({ increment: value }),
    arrayUnion: (value: string) => ({ union: value }),
  },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (collectionName: string) => ({
      doc: (id?: string) => ({ path: `${collectionName}/${id || 'generated'}`, id: id || 'generated' }),
      where: () => ({
        where: () => ({ limit: () => ({ get: mocks.jobsGet }) }),
      }),
    }),
    runTransaction: (...args: unknown[]) => mocks.runTransaction(...args),
    batch: () => ({ update: mocks.batchUpdate, commit: mocks.commit }),
  },
}));
import { persistContactInquiry } from '@/lib/services/contact-server';

const inquiry = {
  name: 'Store Owner',
  email: 'OWNER@Example.com',
  company: 'Acme',
  projectType: 'shopify',
  message: 'Please review our store',
  locale: 'he' as const,
};

describe('Vercel contact inquiry domain service', () => {
  const original = process.env.CONTACT_EMAIL;
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CONTACT_EMAIL = 'team@cart-shift.com';
    mocks.get.mockResolvedValue({ exists: false, data: () => undefined });
    mocks.runTransaction.mockImplementation(async callback => {
      return callback({ get: mocks.get, create: mocks.create, set: mocks.set });
    });
    mocks.jobsGet.mockResolvedValue({ empty: true, docs: [] });
    mocks.commit.mockResolvedValue(undefined);
  });
  afterEach(() => {
    if (original === undefined) delete process.env.CONTACT_EMAIL;
    else process.env.CONTACT_EMAIL = original;
  });

  it('atomically persists a contact inquiry, marks the lead converted and queues notification', async () => {
    const result = await persistContactInquiry(inquiry);
    expect(result.submissionId).toBe('generated');
    expect(mocks.runTransaction).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(
      { path: 'contact_submissions/generated', id: 'generated' },
      expect.objectContaining({ email: 'owner@example.com', name: 'Store Owner' }),
    );
    expect(mocks.create).toHaveBeenCalledWith(
      { path: 'email_queue/contact_generated', id: 'contact_generated' },
      expect.objectContaining({
        status: 'pending', to: 'team@cart-shift.com', templateName: 'contact_form_notification',
      }),
    );
    expect(mocks.create).toHaveBeenCalledWith(
      { path: 'marketing_events/generated', id: 'generated' },
      expect.objectContaining({ type: 'project_inquiry_started', source: 'contact_form' }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringMatching(/^marketing_leads\/[a-f0-9]{32}$/) }),
      expect.objectContaining({
        conversionStatus: 'project_inquiry',
        funnelStage: 'converted',
        marketingConsent: false,
        subscribeNewsletter: false,
        leadScore: { increment: 60 },
      }),
      { merge: true },
    );
    expect(mocks.jobsGet).toHaveBeenCalledOnce();
  });

  it('preserves prior consent and unsubscribes the converted lead from pending nurture', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({ marketingConsent: true, subscribeNewsletter: true, name: 'Old', createdAt: 'oldDate' }),
    });
    mocks.jobsGet.mockResolvedValue({ empty: false, docs: [
      { ref: { path: 'marketing_email_jobs/job-1' } },
    ] });
    await persistContactInquiry(inquiry);
    expect(mocks.set).toHaveBeenCalledWith(expect.anything(),
      expect.objectContaining({ marketingConsent: true, subscribeNewsletter: true, createdAt: 'oldDate' }),
      { merge: true },
    );
    expect(mocks.batchUpdate).toHaveBeenCalledWith(
      { path: 'marketing_email_jobs/job-1' },
      expect.objectContaining({ status: 'canceled', cancelReason: 'converted' }),
    );
    expect(mocks.commit).toHaveBeenCalledOnce();
  });

  it('does not create a job if the transaction fails', async () => {
    mocks.runTransaction.mockRejectedValue(new Error('db failed'));
    await expect(persistContactInquiry(inquiry)).rejects.toThrow('db failed');
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.jobsGet).not.toHaveBeenCalled();
  });

  it('rejects a malformed email before reading or writing Firestore', async () => {
    await expect(persistContactInquiry({ ...inquiry, email: 'bad address' })).rejects.toThrow('INVALID_CONTACT_EMAIL');
    expect(mocks.runTransaction).not.toHaveBeenCalled();
  });
});
