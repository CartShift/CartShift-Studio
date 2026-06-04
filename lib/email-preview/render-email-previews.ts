import 'server-only';
import path from 'path';
import { pathToFileURL } from 'url';

export type EmailPreviewLocale = 'en' | 'he';

export type EmailPreviewId =
  | 'new_request'
  | 'status_update'
  | 'milestone_completed'
  | 'quote_received'
  | 'payment_receipt'
  | 'new_comment'
  | 'contact_form_notification'
  | 'team_invite';

export interface EmailPreview {
  id: EmailPreviewId;
  name: string;
  description: string;
  subject: string;
  recipient: string;
  html: string;
  text: string;
}

type PreviewDefinition = {
  id: EmailPreviewId;
  name: string;
  description: string;
  subject: (locale: EmailPreviewLocale) => string;
  recipient: string;
  data: (locale: EmailPreviewLocale) => Record<string, unknown>;
};

type EmailService = {
  renderEmail: (templateName: EmailPreviewId, data: Record<string, unknown>) => Promise<string>;
  renderEmailText: (templateName: EmailPreviewId, data: Record<string, unknown>) => Promise<string>;
  SUPPORTED_EMAIL_TEMPLATES: EmailPreviewId[];
};

const portalUrl = 'https://portal.cart-shift.com/en/requests/request_123';
const proposalUrl = 'https://cart-shift.com/en/proposal/proposal_123';

const definitions: PreviewDefinition[] = [
  {
    id: 'new_request',
    name: 'New request',
    description: 'Agency notification when a client opens a request.',
    subject: locale =>
      locale === 'he' ? 'בקשה חדשה: שיפור דף הבית' : 'New Request: Homepage refresh',
    recipient: 'agency@cart-shift.com',
    data: () => ({
      clientName: 'Adi Cohen',
      organizationName: 'Demo Store',
      requestTitle: 'Homepage refresh',
      requestDescription: 'Improve hero conversion, product trust cues, and checkout clarity.',
      requestType: 'design',
      requestPriority: 'high',
      actionUrl: portalUrl,
      requestId: 'request_123',
      orgId: 'org_123',
    }),
  },
  {
    id: 'status_update',
    name: 'Status update',
    description: 'Client notification when request status changes.',
    subject: locale =>
      locale === 'he' ? 'עדכון סטטוס: שיפור דף הבית' : 'Status Update: Homepage refresh',
    recipient: 'client@example.com',
    data: locale => ({
      requestTitle: locale === 'he' ? 'שיפור דף הבית' : 'Homepage refresh',
      statusLabel: 'In Review',
      actionUrl: portalUrl,
      requestId: 'request_123',
    }),
  },
  {
    id: 'milestone_completed',
    name: 'Milestone completed',
    description: 'Client progress email when an agency milestone is complete.',
    subject: locale => (locale === 'he' ? 'אבן דרך הושלמה' : 'Milestone Completed'),
    recipient: 'client@example.com',
    data: locale => ({
      requestTitle: locale === 'he' ? 'שיפור דף הבית' : 'Homepage refresh',
      milestoneTitle: 'Wireframes approved',
      actionUrl: portalUrl,
    }),
  },
  {
    id: 'quote_received',
    name: 'Proposal ready',
    description: 'Client email for a public proposal link.',
    subject: locale => (locale === 'he' ? 'הצעת המחיר שלך מוכנה' : 'Your proposal is ready'),
    recipient: 'client@example.com',
    data: locale => ({
      requestTitle: locale === 'he' ? 'שיפור דף הבית' : 'Homepage refresh',
      totalAmount: locale === 'he' ? '₪8,400' : '$2,400',
      actionUrl: proposalUrl,
      locale,
      clientName: locale === 'he' ? 'עדי' : 'Adi',
      validUntil: locale === 'he' ? '30 ביוני 2026' : 'June 30, 2026',
      timeframe: locale === 'he' ? 'שבועיים' : '2 weeks',
    }),
  },
  {
    id: 'payment_receipt',
    name: 'Payment receipt',
    description: 'Client receipt after proposal or request payment.',
    subject: locale => (locale === 'he' ? 'אישור תשלום' : 'Payment Receipt'),
    recipient: 'client@example.com',
    data: locale => ({
      requestTitle: locale === 'he' ? 'שיפור דף הבית' : 'Homepage refresh',
      totalAmount: locale === 'he' ? '₪8,400' : '$2,400',
      paymentId: 'pay_123456',
      actionUrl: portalUrl,
    }),
  },
  {
    id: 'new_comment',
    name: 'New comment',
    description: 'Client or agency message notification.',
    subject: locale => (locale === 'he' ? 'הודעה חדשה' : 'New Message'),
    recipient: 'client@example.com',
    data: locale => ({
      userName: 'Yotam',
      requestTitle: locale === 'he' ? 'שיפור דף הבית' : 'Homepage refresh',
      commentText: 'Please review the latest draft and confirm the content direction.',
      actionUrl: portalUrl,
    }),
  },
  {
    id: 'contact_form_notification',
    name: 'Contact form notification',
    description: 'Internal agency alert for high-intent website inquiries.',
    subject: locale =>
      locale === 'he'
        ? 'פנייה חדשה: עדי — Shopify optimization'
        : 'New inquiry: Adi — Shopify optimization',
    recipient: 'agency@cart-shift.com',
    data: locale => ({
      name: locale === 'he' ? 'עדי כהן' : 'Adi Cohen',
      email: 'adi@example.com',
      company: 'Demo Store',
      projectType: 'Shopify optimization',
      message: 'We need help improving product pages and checkout conversion.',
      locale,
      leadsUrl: `https://portal.cart-shift.com/${locale}/agency/leads`,
    }),
  },
  {
    id: 'team_invite',
    name: 'Team invite',
    description: 'Portal invitation email for agency members and client users.',
    subject: locale =>
      locale === 'he' ? 'הוזמנתם להצטרף אל Demo Store' : "You're invited to join Demo Store",
    recipient: 'client@example.com',
    data: locale => ({
      inviterName: locale === 'he' ? 'יותם' : 'Yotam',
      organizationName: 'Demo Store',
      actionUrl: `https://portal.cart-shift.com/${locale}/invite/invite_code`,
      orgId: 'org_123',
      locale,
    }),
  },
];

async function loadEmailService(): Promise<EmailService> {
  const servicePath = path.join(process.cwd(), 'functions/lib/emails/email-service.js');
  const serviceModule = (await import(
    /* webpackIgnore: true */ pathToFileURL(servicePath).href
  )) as EmailService & { default?: EmailService };

  return serviceModule.default ?? serviceModule;
}

export async function renderEmailPreviews(locale: EmailPreviewLocale): Promise<EmailPreview[]> {
  const emailService = await loadEmailService();
  const supported = new Set(emailService.SUPPORTED_EMAIL_TEMPLATES);
  const missingTemplate = definitions.find(definition => !supported.has(definition.id));

  if (missingTemplate) {
    throw new Error(`Email preview template is not registered: ${missingTemplate.id}`);
  }

  return Promise.all(
    definitions.map(async definition => {
      const data = definition.data(locale);
      const [html, text] = await Promise.all([
        emailService.renderEmail(definition.id, data),
        emailService.renderEmailText(definition.id, data),
      ]);

      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        subject: definition.subject(locale),
        recipient: definition.recipient,
        html,
        text,
      };
    })
  );
}
