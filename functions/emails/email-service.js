const { Resend } = require('resend');
const { convert } = require('html-to-text');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let resendClient = null;

function getResendClient(apiKey) {
  if (!resendClient && apiKey) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const EMAIL_CONFIG = {
  from: 'CartShift Studio <noreply@cart-shift.com>',
  replyTo: 'hello@cart-shift.com',
  retryAttempts: 3,
  retryDelayMs: 1000,
  defaultTags: [
    { name: 'app', value: 'cartshift_portal' },
    { name: 'env', value: process.env.NODE_ENV || 'production' },
  ],
};

// ============================================
// TEMPLATE SYSTEM
// ============================================

function loadTemplate(templateName) {
  const basePath = path.join(__dirname);
  const baseHtml = fs.readFileSync(path.join(basePath, 'base.html'), 'utf8');
  const contentHtml = fs.readFileSync(path.join(basePath, `${templateName}.html`), 'utf8');
  return { baseHtml, contentHtml };
}

function interpolate(template, data) {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    // Handle triple braces first (raw HTML)
    result = result.replace(new RegExp(`{{{${key}}}}`, 'g'), String(value));
    // Then handle double braces (escaped)
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), escaped);
  });
  return result;
}

function buildEmailHtml(templateName, data, subject, options = {}) {
  const { baseHtml, contentHtml } = loadTemplate(templateName);
  const body = interpolate(contentHtml, data);

  if (options.layout === false) {
    return body;
  }

  let html = baseHtml.replace('{{{body}}}', body);
  html = html.replace(/{{title}}/g, subject);
  html = html.replace(/{{year}}/g, String(new Date().getFullYear()));
  return html;
}

function htmlToPlainText(html) {
  return convert(html, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'img', format: 'skip' },
    ],
  });
}

// ============================================
// IDEMPOTENCY KEY GENERATION
// ============================================

function generateIdempotencyKey(to, subject, templateName, uniqueId = '') {
  const payload = `${to}-${subject}-${templateName}-${uniqueId}-${Date.now().toString().slice(0, -4)}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 64);
}

// ============================================
// RETRY LOGIC
// ============================================

function isRetryableError(error) {
  const retryableCodes = [429, 500, 502, 503, 504];
  const retryableMessages = ['rate limit', 'timeout', 'network', 'ECONNRESET'];
  if (error.statusCode && retryableCodes.includes(error.statusCode)) return true;
  const msg = (error.message || '').toLowerCase();
  return retryableMessages.some(keyword => msg.includes(keyword));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CORE EMAIL SENDING
// ============================================

async function sendEmail(apiKey, options, attempt = 1) {
  const {
    to,
    subject,
    templateName,
    data,
    tags = [],
    scheduledAt,
    headers = {},
    idempotencyKey,
  } = options;

  const client = getResendClient(apiKey);

  if (!client) {
    console.log('[Email] Skipped: RESEND_API_KEY not configured');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const html = buildEmailHtml(templateName, data, subject, options);
    const text = htmlToPlainText(html);

    const allTags = [
      ...EMAIL_CONFIG.defaultTags,
      { name: 'template', value: templateName },
      ...tags,
    ];

    const emailPayload = {
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: EMAIL_CONFIG.replyTo,
      tags: allTags,
      headers: {
        'X-Entity-Ref-ID': idempotencyKey || generateIdempotencyKey(to, subject, templateName),
        ...headers,
      },
    };

    if (scheduledAt) {
      emailPayload.scheduled_at = scheduledAt;
    }

    const { data: result, error } = await client.emails.send(emailPayload);

    if (error) {
      throw { message: error.message, statusCode: error.statusCode || 400 };
    }

    console.log(`[Email] ✅ Sent to ${to}: "${subject}" (ID: ${result.id})`);
    return { success: true, id: result.id, scheduledAt: scheduledAt || null };
  } catch (error) {
    const maxAttempts = EMAIL_CONFIG.retryAttempts;
    console.error(`[Email] ❌ Attempt ${attempt}/${maxAttempts} failed:`, error.message);

    if (attempt < maxAttempts && isRetryableError(error)) {
      const delay = EMAIL_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
      console.log(`[Email] Retrying in ${delay}ms...`);
      await sleep(delay);
      return sendEmail(apiKey, options, attempt + 1);
    }

    return {
      success: false,
      error: error.message,
      attempts: attempt,
    };
  }
}

// ============================================
// BATCH EMAIL SENDING
// ============================================

async function sendBatchEmails(apiKey, emails) {
  const client = getResendClient(apiKey);

  if (!client) {
    console.log('[Email] Batch skipped: RESEND_API_KEY not configured');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const emailPayloads = emails.map(({ to, subject, templateName, data, tags = [] }) => {
      const html = buildEmailHtml(templateName, data, subject);
      const text = htmlToPlainText(html);

      return {
        from: EMAIL_CONFIG.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: EMAIL_CONFIG.replyTo,
        tags: [...EMAIL_CONFIG.defaultTags, { name: 'template', value: templateName }, ...tags],
      };
    });

    const { data: result, error } = await client.batch.send(emailPayloads);

    if (error) {
      throw { message: error.message, statusCode: error.statusCode || 400 };
    }

    console.log(`[Email] ✅ Batch sent: ${emails.length} emails`);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] ❌ Batch send failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// SCHEDULED EMAIL SENDING
// ============================================

async function sendScheduledEmail(apiKey, options) {
  if (!options.scheduledAt) {
    throw new Error('scheduledAt is required for scheduled emails');
  }
  return sendEmail(apiKey, options);
}

async function cancelScheduledEmail(apiKey, emailId) {
  const client = getResendClient(apiKey);

  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.emails.cancel(emailId);

    if (error) {
      throw { message: error.message };
    }

    console.log(`[Email] ✅ Scheduled email canceled: ${emailId}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] ❌ Cancel failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// EMAIL STATUS & RETRIEVAL
// ============================================

async function getEmailStatus(apiKey, emailId) {
  const client = getResendClient(apiKey);

  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.emails.get(emailId);

    if (error) {
      throw { message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Email] ❌ Get status failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

function verifyWebhookSignature(payload, signature, timestamp, secret) {
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

function parseWebhookEvent(req, webhookSecret) {
  const payload = JSON.stringify(req.body);
  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing webhook headers');
  }

  const isValid = verifyWebhookSignature(payload, svixSignature, svixTimestamp, webhookSecret);

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  return req.body;
}

// ============================================
// LOGGING & MONITORING
// ============================================

async function sendEmailWithLogging(admin, apiKey, emailParams) {
  const result = await sendEmail(apiKey, emailParams);

  const logEntry = {
    to: emailParams.to,
    subject: emailParams.subject,
    templateName: emailParams.templateName,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (result.success) {
    logEntry.status = 'sent';
    logEntry.emailId = result.id;
    logEntry.scheduledAt = result.scheduledAt || null;

    try {
      await admin.firestore().collection('email_logs').add(logEntry);
    } catch (logError) {
      console.error('[Email] Failed to log success:', logError.message);
    }
  } else if (result.error) {
    logEntry.status = 'failed';
    logEntry.error = result.error;
    logEntry.attempts = result.attempts || 1;

    try {
      await admin.firestore().collection('email_failures').add(logEntry);
    } catch (logError) {
      console.error('[Email] Failed to log failure:', logError.message);
    }
  }

  return result;
}

// ============================================
// WEBHOOK EVENT HANDLERS
// ============================================

const WEBHOOK_EVENT_HANDLERS = {
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

async function updateEmailLog(admin, emailId, updates) {
  try {
    const logsRef = admin.firestore().collection('email_logs');
    const snapshot = await logsRef.where('emailId', '==', emailId).limit(1).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error(`[Email] Failed to update log for ${emailId}:`, error.message);
  }
}

async function handleWebhookEvent(admin, event) {
  const handler = WEBHOOK_EVENT_HANDLERS[event.type];
  if (handler) {
    await handler(admin, event.data);
    console.log(`[Webhook] Processed ${event.type} for email ${event.data.email_id}`);
  }
}

// ============================================
// AUDIENCE / CONTACTS MANAGEMENT
// ============================================

async function addToAudience(apiKey, contactData) {
  const client = getResendClient(apiKey);

  if (!client) {
    console.log('[Audience] Skipped: RESEND_API_KEY not configured');
    return { success: false, reason: 'no_api_key' };
  }

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
      // If contact already exists, that's OK
      if (error.message?.includes('already exists')) {
        console.log(`[Audience] Contact already exists: ${email}`);
        return { success: true, exists: true };
      }
      // Handle restricted API key - log but don't fail the overall flow
      if (error.name === 'restricted_api_key' || error.message?.includes('restricted')) {
        console.warn(
          `[Audience] ⚠️ API key restricted for contacts. Skipping audience add for: ${email}. ` +
            'To enable contact management, use a full-access Resend API key.'
        );
        return { success: false, reason: 'restricted_api_key', skipped: true };
      }
      throw { message: error.message };
    }

    console.log(`[Audience] ✅ Added contact: ${email} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error) {
    // Also catch restricted key errors at the top level
    if (error.name === 'restricted_api_key' || error.message?.includes('restricted')) {
      console.warn(
        `[Audience] ⚠️ API key restricted. Contact management skipped for: ${contactData.email}`
      );
      return { success: false, reason: 'restricted_api_key', skipped: true };
    }
    console.error('[Audience] ❌ Failed to add contact:', error.message);
    return { success: false, error: error.message };
  }
}

async function updateContact(apiKey, email, updates) {
  const client = getResendClient(apiKey);

  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.contacts.update({
      email,
      ...updates,
    });

    if (error) {
      throw { message: error.message };
    }

    console.log(`[Audience] ✅ Updated contact: ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Audience] ❌ Failed to update contact:', error.message);
    return { success: false, error: error.message };
  }
}

async function removeFromAudience(apiKey, email) {
  const client = getResendClient(apiKey);

  if (!client) {
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.contacts.remove({ email });

    if (error) {
      throw { message: error.message };
    }

    console.log(`[Audience] ✅ Removed contact: ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Audience] ❌ Failed to remove contact:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendEmailWithLogging,
  sendBatchEmails,
  sendScheduledEmail,
  cancelScheduledEmail,
  getEmailStatus,
  buildEmailHtml,
  parseWebhookEvent,
  handleWebhookEvent,
  generateIdempotencyKey,
  addToAudience,
  updateContact,
  removeFromAudience,
  EMAIL_CONFIG,
};
