import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as crypto from 'crypto';
import type * as React from 'react';
import NewRequest from './templates/NewRequest';
import StatusUpdate from './templates/StatusUpdate';
import MilestoneCompleted from './templates/MilestoneCompleted';
import QuoteReceived from './templates/QuoteReceived';
import PaymentReceipt from './templates/PaymentReceipt';
import NewComment from './templates/NewComment';
import ContactFormNotification from './templates/ContactFormNotification';
import TeamInvite from './templates/TeamInvite';

export interface EmailConfig {
  from: string;
  replyTo: string;
  retryAttempts: number;
  retryDelayMs: number;
  defaultTags: { name: string; value: string }[];
}

const DEFAULT_CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@cart-shift.com';

export const EMAIL_CONFIG: EmailConfig = {
  from: 'CartShift Studio <noreply@cart-shift.com>',
  replyTo: DEFAULT_CONTACT_EMAIL,
  retryAttempts: 3,
  retryDelayMs: 1000,
  defaultTags: [
    { name: 'app', value: 'cartshift_portal' },
    { name: 'env', value: process.env.NODE_ENV || 'production' },
  ],
};

let resendClient: Resend | null = null;

function getResendClient(apiKey?: string): Resend | null {
  if (!resendClient && apiKey) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getErrMsg(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function getErrStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const code = (error as { statusCode: unknown }).statusCode;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}

export type EmailTemplate =
  | 'new_request'
  | 'status_update'
  | 'milestone_completed'
  | 'quote_received'
  | 'payment_receipt'
  | 'new_comment'
  | 'contact_form_notification'
  | 'team_invite';

type EmailTemplateData = Record<string, unknown>;
type EmailTemplateComponent = (data: EmailTemplateData) => React.ReactElement;

const EMAIL_TEMPLATE_REGISTRY = {
  new_request: NewRequest,
  status_update: StatusUpdate,
  milestone_completed: MilestoneCompleted,
  quote_received: QuoteReceived,
  payment_receipt: PaymentReceipt,
  new_comment: NewComment,
  contact_form_notification: ContactFormNotification,
  team_invite: TeamInvite,
} as unknown as Record<EmailTemplate, EmailTemplateComponent>;

export const SUPPORTED_EMAIL_TEMPLATES = Object.keys(EMAIL_TEMPLATE_REGISTRY) as EmailTemplate[];

function getTemplateComponent(templateName: EmailTemplate): EmailTemplateComponent {
  const Template = EMAIL_TEMPLATE_REGISTRY[templateName];
  if (!Template) {
    throw new Error(`Unknown template: ${templateName}`);
  }
  return Template;
}

function renderTemplate(templateName: EmailTemplate, data: EmailTemplateData) {
  return getTemplateComponent(templateName)(data);
}

export const renderEmail = async (
  templateName: EmailTemplate,
  data: EmailTemplateData
): Promise<string> => {
  return render(renderTemplate(templateName, data));
};

export const renderEmailText = async (
  templateName: EmailTemplate,
  data: EmailTemplateData
): Promise<string> => {
  return render(renderTemplate(templateName, data), { plainText: true });
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  templateName: EmailTemplate;
  data: EmailTemplateData;
  tags?: { name: string; value: string }[];
  scheduledAt?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  uniqueId?: string;
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to: string;
  tags: { name: string; value: string }[];
  headers: Record<string, string>;
  scheduled_at?: string;
}

interface FirebaseAdminLike {
  firestore: {
    (): {
      collection: (name: string) => {
        add: (data: Record<string, unknown>) => Promise<unknown>;
        where: (
          field: string,
          op: string,
          value: unknown
        ) => {
          limit: (n: number) => {
            get: () => Promise<{
              empty: boolean;
              docs: Array<{ ref: { update: (data: Record<string, unknown>) => Promise<unknown> } }>;
            }>;
          };
        };
      };
    };
    FieldValue: {
      serverTimestamp: () => unknown;
      arrayUnion: (...elements: unknown[]) => unknown;
    };
  };
}

interface WebhookRequest {
  body: ResendWebhookEvent;
  headers: Record<string, string | string[] | undefined>;
}

interface ResendWebhookEventData {
  email_id: string;
  created_at: string;
  bounce?: { message?: string };
  click?: { link?: string };
}

interface ResendWebhookEvent {
  type: string;
  data: ResendWebhookEventData;
}

interface AudienceContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  properties?: Record<string, string>;
}

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRecipients(to: string | string[]): string[] {
  const recipients = (Array.isArray(to) ? to : [to]).map(item => item.trim().toLowerCase());
  const invalid = recipients.filter(item => !EMAIL_ADDRESS_PATTERN.test(item));

  if (recipients.length === 0 || invalid.length > 0) {
    throw new Error(`Invalid recipient email address: ${invalid[0] || 'missing recipient'}`);
  }

  return [...new Set(recipients)];
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function sendEmail(
  apiKey: string,
  options: SendEmailOptions,
  attempt = 1
): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResendClient(apiKey);
  if (!client) {
    console.log('[Email] Skipped: RESEND_API_KEY not configured');
    return { success: false, error: 'no_api_key' };
  }

  try {
    const recipients = normalizeRecipients(options.to);
    const html = await renderEmail(options.templateName, options.data);
    const text = await renderEmailText(options.templateName, options.data);

    const emailPayload: ResendEmailPayload = {
      from: EMAIL_CONFIG.from,
      to: recipients,
      subject: options.subject,
      html,
      text,
      reply_to: EMAIL_CONFIG.replyTo,
      tags: [
        ...EMAIL_CONFIG.defaultTags,
        { name: 'template', value: options.templateName },
        ...(options.tags || []),
      ],
      headers: {
        'X-Entity-Ref-ID':
          options.idempotencyKey ||
          generateIdempotencyKey(
            options.to,
            options.subject,
            options.templateName,
            options.uniqueId
          ),
        ...(options.headers || {}),
      },
    };

    if (options.scheduledAt) {
      emailPayload.scheduled_at = options.scheduledAt;
    }

    const { data: result, error } = await client.emails.send(emailPayload);

    if (error) {
      throw { message: error.message, statusCode: 400 };
    }

    console.log(
      `[Email] Sent to ${recipients.join(',')}: "${options.subject}" (ID: ${result?.id})`
    );
    return { success: true, id: result?.id };
  } catch (error: unknown) {
    console.error(`[Email] ❌ Attempt ${attempt} failed:`, getErrMsg(error));

    if (attempt < EMAIL_CONFIG.retryAttempts && isRetryableError(error)) {
      const delay = EMAIL_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
      return sendEmail(apiKey, options, attempt + 1);
    }

    return { success: false, error: getErrMsg(error) };
  }
}

function isRetryableError(error: unknown) {
  const retryableCodes = [429, 500, 502, 503, 504];
  const msg = getErrMsg(error).toLowerCase();
  const statusCode = getErrStatus(error);
  if (statusCode && retryableCodes.includes(statusCode)) return true;
  return ['rate limit', 'timeout', 'network', 'econnreset'].some(k => msg.includes(k));
}

export async function sendEmailWithLogging(
  adminInstance: FirebaseAdminLike,
  apiKey: string,
  options: SendEmailOptions
) {
  const result = await sendEmail(apiKey, options);

  const logEntry: Record<string, unknown> = {
    to: options.to,
    subject: options.subject,
    templateName: options.templateName,
    timestamp: adminInstance.firestore.FieldValue.serverTimestamp(),
  };

  if (result.success) {
    logEntry.status = 'sent';
    logEntry.emailId = result.id;
    try {
      await adminInstance.firestore().collection('email_logs').add(logEntry);
    } catch (e) {
      console.error('[Email] Log failed', e);
    }
  } else {
    logEntry.status = 'failed';
    logEntry.error = result.error;
    try {
      await adminInstance.firestore().collection('email_failures').add(logEntry);
    } catch (e) {
      console.error('[Email] Log failure failed', e);
    }
  }

  return result;
}

export function generateIdempotencyKey(
  to: string | string[],
  subject: string,
  template: string,
  uniqueId = ''
) {
  const toStr = Array.isArray(to) ? to.join(',') : to;
  const normalizedTo = toStr
    .split(',')
    .map(item => item.trim().toLowerCase())
    .sort()
    .join(',');
  const stableOrBucket = uniqueId || Date.now().toString().slice(0, -4);
  const payload = `${normalizedTo}-${subject}-${template}-${stableOrBucket}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 64);
}

export async function sendBatchEmails(apiKey: string, emails: SendEmailOptions[]) {
  const client = getResendClient(apiKey);
  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const emailPayloads = await Promise.all(
      emails.map(async opt => {
        const recipients = normalizeRecipients(opt.to);
        const html = await renderEmail(opt.templateName, opt.data);
        const text = await renderEmailText(opt.templateName, opt.data);

        return {
          from: EMAIL_CONFIG.from,
          to: recipients,
          subject: opt.subject,
          html,
          text,
          reply_to: EMAIL_CONFIG.replyTo,
          tags: [
            ...EMAIL_CONFIG.defaultTags,
            { name: 'template', value: opt.templateName },
            ...(opt.tags || []),
          ],
        };
      })
    );

    const { data: result, error } = await client.batch.send(emailPayloads);

    if (error) {
      throw { message: error.message, statusCode: 400 };
    }

    console.log(`[Email] ✅ Batch sent: ${emails.length} emails`);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('[Email] ❌ Batch send failed:', getErrMsg(error));
    return { success: false, error: getErrMsg(error) };
  }
}

export async function sendScheduledEmail(apiKey: string, options: SendEmailOptions) {
  if (!options.scheduledAt) {
    throw new Error('scheduledAt is required for scheduled emails');
  }
  return sendEmail(apiKey, options);
}

export async function cancelScheduledEmail(apiKey: string, emailId: string) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.emails.cancel(emailId);
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrMsg(error) };
  }
}

export async function getEmailStatus(apiKey: string, emailId: string) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.emails.get(emailId);
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrMsg(error) };
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
) {
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');

  const signatures = signature.split(' ').map(sig => sig.replace('v1,', ''));
  return signatures.some(sig => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig, 'base64'),
        Buffer.from(expectedSignature, 'base64')
      );
    } catch {
      return false;
    }
  });
}

export function parseWebhookEvent(req: WebhookRequest, webhookSecret: string) {
  const payload = JSON.stringify(req.body);
  const svixId = headerValue(req.headers['svix-id']);
  const svixTimestamp = headerValue(req.headers['svix-timestamp']);
  const svixSignature = headerValue(req.headers['svix-signature']);

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing webhook headers');
  }

  const isValid = verifyWebhookSignature(payload, svixSignature, svixTimestamp, webhookSecret);
  if (!isValid) throw new Error('Invalid webhook signature');

  return req.body;
}

type WebhookHandler = (
  admin: FirebaseAdminLike,
  data: ResendWebhookEventData
) => Promise<void>;

const WEBHOOK_EVENT_HANDLERS: Record<string, WebhookHandler> = {
  'email.sent': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'sent',
      sentAt: new Date(data.created_at),
    });
  },
  'email.delivered': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'delivered',
      deliveredAt: new Date(data.created_at),
    });
  },
  'email.bounced': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'bounced',
      bouncedAt: new Date(data.created_at),
      bounceReason: data.bounce?.message || 'Unknown',
    });
  },
  'email.opened': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      opened: true,
      openedAt: admin.firestore.FieldValue.arrayUnion(new Date(data.created_at)),
    });
  },
  'email.clicked': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      clicked: true,
      clicks: admin.firestore.FieldValue.arrayUnion({
        url: data.click?.link,
        at: new Date(data.created_at),
      }),
    });
  },
  'email.complained': async (admin, data) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'complained',
      complainedAt: new Date(data.created_at),
    });
  },
};

async function updateEmailLog(
  admin: FirebaseAdminLike,
  emailId: string,
  updates: Record<string, unknown>
) {
  try {
    const logsRef = admin.firestore().collection('email_logs');
    const snapshot = await logsRef.where('emailId', '==', emailId).limit(1).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error: unknown) {
    console.error(`[Email] Failed to update log for ${emailId}:`, getErrMsg(error));
  }
}

export async function handleWebhookEvent(
  admin: FirebaseAdminLike,
  event: ResendWebhookEvent
) {
  const handler = WEBHOOK_EVENT_HANDLERS[event.type];
  if (handler) {
    await handler(admin, event.data);
    console.log(`[Webhook] Processed ${event.type} for email ${event.data.email_id}`);
  }
}

export async function addToAudience(apiKey: string, contactData: AudienceContactData) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { email, firstName, lastName, source, properties = {} } = contactData;
    const contactPayload = {
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsubscribed: false,
      properties: {
        source: source || 'website',
        added_at: new Date().toISOString(),
        ...properties,
      },
    };

    const { data, error } = await client.contacts.create(contactPayload);

    if (error) {
      if (error.message?.includes('already exists')) {
        const updateResult = await client.contacts.update(contactPayload);
        if (updateResult.error) {
          throw { message: updateResult.error.message };
        }
        console.log(`[Audience] ✅ Updated existing contact: ${email}`);
        return { success: true, exists: true, updated: true, id: updateResult.data?.id };
      }
      if (error.name === 'restricted_api_key' || error.message?.includes('restricted')) {
        return { success: false, reason: 'restricted_api_key', skipped: true };
      }
      throw { message: error.message };
    }

    console.log(`[Audience] ✅ Added contact: ${email}`);
    return { success: true, id: data?.id };
  } catch (error: unknown) {
    console.error('[Audience] ❌ Failed to add contact:', getErrMsg(error));
    return { success: false, error: getErrMsg(error) };
  }
}

export async function updateContact(
  apiKey: string,
  email: string,
  updates: Record<string, unknown>
) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.contacts.update({ email, ...updates });
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrMsg(error) };
  }
}

export async function removeFromAudience(apiKey: string, email: string) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.contacts.remove({ email });
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: getErrMsg(error) };
  }
}
