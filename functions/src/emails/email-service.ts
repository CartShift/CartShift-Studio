import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as crypto from 'crypto';

// Templates
import NewRequest from './templates/NewRequest';
import StatusUpdate from './templates/StatusUpdate';
import MilestoneCompleted from './templates/MilestoneCompleted';
import QuoteReceived from './templates/QuoteReceived';
import PaymentReceipt from './templates/PaymentReceipt';
import NewComment from './templates/NewComment';
import ContactFormNotification from './templates/ContactFormNotification';

// Types
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

// ----------------------------------------------------------------------------
// Render Logic
// ----------------------------------------------------------------------------

export type EmailTemplate =
  | 'new_request'
  | 'status_update'
  | 'milestone_completed'
  | 'quote_received'
  | 'payment_receipt'
  | 'new_comment'
  | 'contact_form_notification';

export const renderEmail = async (templateName: EmailTemplate, data: any): Promise<string> => {
  switch (templateName) {
    case 'new_request':
      return render(NewRequest(data));
    case 'status_update':
      return render(StatusUpdate(data));
    case 'milestone_completed':
      return render(MilestoneCompleted(data));
    case 'quote_received':
      return render(QuoteReceived(data));
    case 'payment_receipt':
      return render(PaymentReceipt(data));
    case 'new_comment':
      return render(NewComment(data));
    case 'contact_form_notification':
      return render(ContactFormNotification(data));
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
};

// ----------------------------------------------------------------------------
// Sending Logic
// ----------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  templateName: EmailTemplate;
  data: any;
  tags?: { name: string; value: string }[];
  scheduledAt?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  uniqueId?: string; // For auto-generating idempotency key
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
    const html = await renderEmail(options.templateName, options.data);
    const text = await render(
      // @ts-ignore - Dynamic dispatch mostly safe here or we can use specific function
      options.templateName === 'new_request'
        ? NewRequest(options.data)
        : options.templateName === 'status_update'
          ? StatusUpdate(options.data)
          : options.templateName === 'milestone_completed'
            ? MilestoneCompleted(options.data)
            : options.templateName === 'quote_received'
              ? QuoteReceived(options.data)
              : options.templateName === 'payment_receipt'
                ? PaymentReceipt(options.data)
                : options.templateName === 'contact_form_notification'
                  ? ContactFormNotification(options.data)
                  : NewComment(options.data),
      { plainText: true }
    );

    const emailPayload: any = {
      from: EMAIL_CONFIG.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
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

    console.log(`[Email] ✅ Sent to ${options.to}: "${options.subject}" (ID: ${result?.id})`);
    return { success: true, id: result?.id };
  } catch (error: any) {
    console.error(`[Email] ❌ Attempt ${attempt} failed:`, error.message);

    if (attempt < EMAIL_CONFIG.retryAttempts && isRetryableError(error)) {
      const delay = EMAIL_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
      return sendEmail(apiKey, options, attempt + 1);
    }

    return { success: false, error: error.message };
  }
}

function isRetryableError(error: any) {
  const retryableCodes = [429, 500, 502, 503, 504];
  const msg = (error.message || '').toLowerCase();
  if (error.statusCode && retryableCodes.includes(error.statusCode)) return true;
  return ['rate limit', 'timeout', 'network', 'econnreset'].some(k => msg.includes(k));
}

// ----------------------------------------------------------------------------
// Logging wrapper
// ----------------------------------------------------------------------------

export async function sendEmailWithLogging(
  adminInstance: any,
  apiKey: string,
  options: SendEmailOptions
) {
  const result = await sendEmail(apiKey, options);

  const logEntry: any = {
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

// ----------------------------------------------------------------------------
// Utilities (ported from JS)
// ----------------------------------------------------------------------------

function generateIdempotencyKey(
  to: string | string[],
  subject: string,
  template: string,
  uniqueId = ''
) {
  const toStr = Array.isArray(to) ? to.join(',') : to;
  const payload = `${toStr}-${subject}-${template}-${uniqueId}-${Date.now().toString().slice(0, -4)}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 64);
}

// ----------------------------------------------------------------------------
// Batch Sending
// ----------------------------------------------------------------------------

export async function sendBatchEmails(apiKey: string, emails: SendEmailOptions[]) {
  const client = getResendClient(apiKey);
  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const emailPayloads = await Promise.all(
      emails.map(async opt => {
        const html = await renderEmail(opt.templateName, opt.data);
        const text = await render(
          // @ts-ignore
          opt.templateName === 'new_request'
            ? NewRequest(opt.data)
            : opt.templateName === 'status_update'
              ? StatusUpdate(opt.data)
              : opt.templateName === 'milestone_completed'
                ? MilestoneCompleted(opt.data)
                : opt.templateName === 'quote_received'
                  ? QuoteReceived(opt.data)
                  : opt.templateName === 'payment_receipt'
                    ? PaymentReceipt(opt.data)
                    : NewComment(opt.data),
          { plainText: true }
        );

        return {
          from: EMAIL_CONFIG.from,
          to: Array.isArray(opt.to) ? opt.to : [opt.to],
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
  } catch (error: any) {
    console.error('[Email] ❌ Batch send failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------------
// Scheduling
// ----------------------------------------------------------------------------

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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEmailStatus(apiKey: string, emailId: string) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.emails.get(emailId);
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------------
// Webhooks
// ----------------------------------------------------------------------------

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

export function parseWebhookEvent(req: any, webhookSecret: string) {
  const payload = JSON.stringify(req.body);
  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing webhook headers');
  }

  const isValid = verifyWebhookSignature(payload, svixSignature, svixTimestamp, webhookSecret);
  if (!isValid) throw new Error('Invalid webhook signature');

  return req.body;
}

const WEBHOOK_EVENT_HANDLERS: any = {
  'email.sent': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'sent',
      sentAt: new Date(data.created_at),
    });
  },
  'email.delivered': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'delivered',
      deliveredAt: new Date(data.created_at),
    });
  },
  'email.bounced': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'bounced',
      bouncedAt: new Date(data.created_at),
      bounceReason: data.bounce?.message || 'Unknown',
    });
  },
  'email.opened': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      opened: true,
      openedAt: admin.firestore.FieldValue.arrayUnion(new Date(data.created_at)),
    });
  },
  'email.clicked': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      clicked: true,
      clicks: admin.firestore.FieldValue.arrayUnion({
        url: data.click?.link,
        at: new Date(data.created_at),
      }),
    });
  },
  'email.complained': async (admin: any, data: any) => {
    await updateEmailLog(admin, data.email_id, {
      status: 'complained',
      complainedAt: new Date(data.created_at),
    });
  },
};

async function updateEmailLog(admin: any, emailId: string, updates: any) {
  try {
    const logsRef = admin.firestore().collection('email_logs');
    const snapshot = await logsRef.where('emailId', '==', emailId).limit(1).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error: any) {
    console.error(`[Email] Failed to update log for ${emailId}:`, error.message);
  }
}

export async function handleWebhookEvent(admin: any, event: any) {
  const handler = WEBHOOK_EVENT_HANDLERS[event.type];
  if (handler) {
    await handler(admin, event.data);
    console.log(`[Webhook] Processed ${event.type} for email ${event.data.email_id}`);
  }
}

// ----------------------------------------------------------------------------
// Audience
// ----------------------------------------------------------------------------

export async function addToAudience(apiKey: string, contactData: any) {
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
        return { success: true, exists: true };
      }
      if (error.name === 'restricted_api_key' || error.message?.includes('restricted')) {
        return { success: false, reason: 'restricted_api_key', skipped: true };
      }
      throw { message: error.message };
    }

    console.log(`[Audience] ✅ Added contact: ${email}`);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('[Audience] ❌ Failed to add contact:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateContact(apiKey: string, email: string, updates: any) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.contacts.update({ email, ...updates });
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeFromAudience(apiKey: string, email: string) {
  const client = getResendClient(apiKey);
  if (!client) return { success: false, reason: 'no_api_key' };

  try {
    const { data, error } = await client.contacts.remove({ email });
    if (error) throw { message: error.message };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
