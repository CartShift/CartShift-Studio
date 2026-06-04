import { describe, expect, it } from 'vitest';
import {
  generateIdempotencyKey,
  renderEmail,
  renderEmailText,
  sendEmail,
  SUPPORTED_EMAIL_TEMPLATES,
  type EmailTemplate,
} from '../../functions/src/emails/email-service';

const portalUrl = 'https://portal.cart-shift.com/en/requests/request-123';

const templateData: Record<EmailTemplate, Record<string, unknown>> = {
  new_request: {
    clientName: 'Adi Cohen',
    organizationName: 'Demo Store',
    requestTitle: 'Homepage refresh',
    requestDescription: 'Improve hero conversion and checkout clarity.',
    requestType: 'design',
    requestPriority: 'high',
    actionUrl: portalUrl,
    requestId: 'request-123',
    orgId: 'org-123',
  },
  status_update: {
    requestTitle: 'Homepage refresh',
    statusLabel: 'In Progress',
    actionUrl: portalUrl,
    requestId: 'request-123',
  },
  milestone_completed: {
    requestTitle: 'Homepage refresh',
    milestoneTitle: 'Wireframes approved',
    actionUrl: portalUrl,
  },
  quote_received: {
    requestTitle: 'Homepage refresh',
    totalAmount: '$2,400',
    actionUrl: 'https://cart-shift.com/en/proposal/proposal-123',
    locale: 'he',
    clientName: 'Adi',
    validUntil: 'June 30, 2026',
    timeframe: '2 weeks',
  },
  payment_receipt: {
    requestTitle: 'Homepage refresh',
    totalAmount: '$2,400',
    paymentId: 'payment-123',
    actionUrl: portalUrl,
  },
  new_comment: {
    userName: 'Yotam',
    requestTitle: 'Homepage refresh',
    commentText: 'Please review the latest draft.',
    actionUrl: portalUrl,
  },
  contact_form_notification: {
    name: 'Adi Cohen',
    email: 'adi@example.com',
    company: 'Demo Store',
    projectType: 'Shopify optimization',
    message: 'We need help improving conversion.',
    locale: 'he',
    leadsUrl: 'https://portal.cart-shift.com/he/agency/leads',
  },
  team_invite: {
    inviterName: 'Yotam',
    organizationName: 'Demo Store',
    actionUrl: 'https://portal.cart-shift.com/en/invite/invite-code',
    orgId: 'org-123',
    locale: 'he',
  },
};

describe('email template registry', () => {
  it('renders html and text for every supported runtime template', async () => {
    expect(SUPPORTED_EMAIL_TEMPLATES).toEqual([
      'new_request',
      'status_update',
      'milestone_completed',
      'quote_received',
      'payment_receipt',
      'new_comment',
      'contact_form_notification',
      'team_invite',
    ]);

    for (const templateName of SUPPORTED_EMAIL_TEMPLATES) {
      const html = await renderEmail(templateName, templateData[templateName]);
      const text = await renderEmailText(templateName, templateData[templateName]);

      expect(html).toContain('CartShift');
      expect(html.length).toBeGreaterThan(500);
      expect(text.length).toBeGreaterThan(40);
    }
  });

  it('renders localized proposal and invite templates as RTL when Hebrew is requested', async () => {
    await expect(renderEmail('quote_received', templateData.quote_received)).resolves.toContain(
      'dir="rtl"'
    );
    await expect(renderEmail('team_invite', templateData.team_invite)).resolves.toContain(
      'dir="rtl"'
    );
  });
});

describe('email send safety', () => {
  it('uses a stable idempotency key when a unique event id is provided', () => {
    const first = generateIdempotencyKey(
      ['Client@Example.com', 'owner@example.com'],
      'Subject',
      'team_invite',
      'invite-123'
    );
    const second = generateIdempotencyKey(
      ['owner@example.com', 'client@example.com'],
      'Subject',
      'team_invite',
      'invite-123'
    );

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('rejects invalid recipients before provider delivery', async () => {
    const result = await sendEmail('test-api-key', {
      to: 'not-an-email',
      subject: 'Broken recipient',
      templateName: 'team_invite',
      data: templateData.team_invite,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid recipient email address');
  });
});
