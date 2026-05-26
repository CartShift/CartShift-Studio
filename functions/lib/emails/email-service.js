"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmail = exports.EMAIL_CONFIG = void 0;
exports.sendEmail = sendEmail;
exports.sendEmailWithLogging = sendEmailWithLogging;
exports.sendBatchEmails = sendBatchEmails;
exports.sendScheduledEmail = sendScheduledEmail;
exports.cancelScheduledEmail = cancelScheduledEmail;
exports.getEmailStatus = getEmailStatus;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.parseWebhookEvent = parseWebhookEvent;
exports.handleWebhookEvent = handleWebhookEvent;
exports.addToAudience = addToAudience;
exports.updateContact = updateContact;
exports.removeFromAudience = removeFromAudience;
const resend_1 = require("resend");
const render_1 = require("@react-email/render");
const crypto = __importStar(require("crypto"));
// Templates
const NewRequest_1 = __importDefault(require("./templates/NewRequest"));
const StatusUpdate_1 = __importDefault(require("./templates/StatusUpdate"));
const MilestoneCompleted_1 = __importDefault(require("./templates/MilestoneCompleted"));
const QuoteReceived_1 = __importDefault(require("./templates/QuoteReceived"));
const PaymentReceipt_1 = __importDefault(require("./templates/PaymentReceipt"));
const NewComment_1 = __importDefault(require("./templates/NewComment"));
const ContactFormNotification_1 = __importDefault(require("./templates/ContactFormNotification"));
const DEFAULT_CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@cart-shift.com';
exports.EMAIL_CONFIG = {
    from: 'CartShift Studio <noreply@cart-shift.com>',
    replyTo: DEFAULT_CONTACT_EMAIL,
    retryAttempts: 3,
    retryDelayMs: 1000,
    defaultTags: [
        { name: 'app', value: 'cartshift_portal' },
        { name: 'env', value: process.env.NODE_ENV || 'production' },
    ],
};
let resendClient = null;
function getResendClient(apiKey) {
    if (!resendClient && apiKey) {
        resendClient = new resend_1.Resend(apiKey);
    }
    return resendClient;
}
const renderEmail = async (templateName, data) => {
    switch (templateName) {
        case 'new_request':
            return (0, render_1.render)((0, NewRequest_1.default)(data));
        case 'status_update':
            return (0, render_1.render)((0, StatusUpdate_1.default)(data));
        case 'milestone_completed':
            return (0, render_1.render)((0, MilestoneCompleted_1.default)(data));
        case 'quote_received':
            return (0, render_1.render)((0, QuoteReceived_1.default)(data));
        case 'payment_receipt':
            return (0, render_1.render)((0, PaymentReceipt_1.default)(data));
        case 'new_comment':
            return (0, render_1.render)((0, NewComment_1.default)(data));
        case 'contact_form_notification':
            return (0, render_1.render)((0, ContactFormNotification_1.default)(data));
        default:
            throw new Error(`Unknown template: ${templateName}`);
    }
};
exports.renderEmail = renderEmail;
async function sendEmail(apiKey, options, attempt = 1) {
    const client = getResendClient(apiKey);
    if (!client) {
        console.log('[Email] Skipped: RESEND_API_KEY not configured');
        return { success: false, error: 'no_api_key' };
    }
    try {
        const html = await (0, exports.renderEmail)(options.templateName, options.data);
        const text = await (0, render_1.render)(
        // @ts-ignore - Dynamic dispatch mostly safe here or we can use specific function
        options.templateName === 'new_request'
            ? (0, NewRequest_1.default)(options.data)
            : options.templateName === 'status_update'
                ? (0, StatusUpdate_1.default)(options.data)
                : options.templateName === 'milestone_completed'
                    ? (0, MilestoneCompleted_1.default)(options.data)
                    : options.templateName === 'quote_received'
                        ? (0, QuoteReceived_1.default)(options.data)
                        : options.templateName === 'payment_receipt'
                            ? (0, PaymentReceipt_1.default)(options.data)
                            : options.templateName === 'contact_form_notification'
                                ? (0, ContactFormNotification_1.default)(options.data)
                                : (0, NewComment_1.default)(options.data), { plainText: true });
        const emailPayload = {
            from: exports.EMAIL_CONFIG.from,
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            html,
            text,
            reply_to: exports.EMAIL_CONFIG.replyTo,
            tags: [
                ...exports.EMAIL_CONFIG.defaultTags,
                { name: 'template', value: options.templateName },
                ...(options.tags || []),
            ],
            headers: {
                'X-Entity-Ref-ID': options.idempotencyKey ||
                    generateIdempotencyKey(options.to, options.subject, options.templateName, options.uniqueId),
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
        console.log(`[Email] ✅ Sent to ${options.to}: "${options.subject}" (ID: ${result === null || result === void 0 ? void 0 : result.id})`);
        return { success: true, id: result === null || result === void 0 ? void 0 : result.id };
    }
    catch (error) {
        console.error(`[Email] ❌ Attempt ${attempt} failed:`, error.message);
        if (attempt < exports.EMAIL_CONFIG.retryAttempts && isRetryableError(error)) {
            const delay = exports.EMAIL_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
            return sendEmail(apiKey, options, attempt + 1);
        }
        return { success: false, error: error.message };
    }
}
function isRetryableError(error) {
    const retryableCodes = [429, 500, 502, 503, 504];
    const msg = (error.message || '').toLowerCase();
    if (error.statusCode && retryableCodes.includes(error.statusCode))
        return true;
    return ['rate limit', 'timeout', 'network', 'econnreset'].some(k => msg.includes(k));
}
// ----------------------------------------------------------------------------
// Logging wrapper
// ----------------------------------------------------------------------------
async function sendEmailWithLogging(adminInstance, apiKey, options) {
    const result = await sendEmail(apiKey, options);
    const logEntry = {
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
        }
        catch (e) {
            console.error('[Email] Log failed', e);
        }
    }
    else {
        logEntry.status = 'failed';
        logEntry.error = result.error;
        try {
            await adminInstance.firestore().collection('email_failures').add(logEntry);
        }
        catch (e) {
            console.error('[Email] Log failure failed', e);
        }
    }
    return result;
}
// ----------------------------------------------------------------------------
// Utilities (ported from JS)
// ----------------------------------------------------------------------------
function generateIdempotencyKey(to, subject, template, uniqueId = '') {
    const toStr = Array.isArray(to) ? to.join(',') : to;
    const payload = `${toStr}-${subject}-${template}-${uniqueId}-${Date.now().toString().slice(0, -4)}`;
    return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 64);
}
// ----------------------------------------------------------------------------
// Batch Sending
// ----------------------------------------------------------------------------
async function sendBatchEmails(apiKey, emails) {
    const client = getResendClient(apiKey);
    if (!client) {
        return { success: false, reason: 'no_api_key' };
    }
    try {
        const emailPayloads = await Promise.all(emails.map(async (opt) => {
            const html = await (0, exports.renderEmail)(opt.templateName, opt.data);
            const text = await (0, render_1.render)(
            // @ts-ignore
            opt.templateName === 'new_request'
                ? (0, NewRequest_1.default)(opt.data)
                : opt.templateName === 'status_update'
                    ? (0, StatusUpdate_1.default)(opt.data)
                    : opt.templateName === 'milestone_completed'
                        ? (0, MilestoneCompleted_1.default)(opt.data)
                        : opt.templateName === 'quote_received'
                            ? (0, QuoteReceived_1.default)(opt.data)
                            : opt.templateName === 'payment_receipt'
                                ? (0, PaymentReceipt_1.default)(opt.data)
                                : (0, NewComment_1.default)(opt.data), { plainText: true });
            return {
                from: exports.EMAIL_CONFIG.from,
                to: Array.isArray(opt.to) ? opt.to : [opt.to],
                subject: opt.subject,
                html,
                text,
                reply_to: exports.EMAIL_CONFIG.replyTo,
                tags: [
                    ...exports.EMAIL_CONFIG.defaultTags,
                    { name: 'template', value: opt.templateName },
                    ...(opt.tags || []),
                ],
            };
        }));
        const { data: result, error } = await client.batch.send(emailPayloads);
        if (error) {
            throw { message: error.message, statusCode: 400 };
        }
        console.log(`[Email] ✅ Batch sent: ${emails.length} emails`);
        return { success: true, data: result };
    }
    catch (error) {
        console.error('[Email] ❌ Batch send failed:', error.message);
        return { success: false, error: error.message };
    }
}
// ----------------------------------------------------------------------------
// Scheduling
// ----------------------------------------------------------------------------
async function sendScheduledEmail(apiKey, options) {
    if (!options.scheduledAt) {
        throw new Error('scheduledAt is required for scheduled emails');
    }
    return sendEmail(apiKey, options);
}
async function cancelScheduledEmail(apiKey, emailId) {
    const client = getResendClient(apiKey);
    if (!client)
        return { success: false, reason: 'no_api_key' };
    try {
        const { data, error } = await client.emails.cancel(emailId);
        if (error)
            throw { message: error.message };
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
async function getEmailStatus(apiKey, emailId) {
    const client = getResendClient(apiKey);
    if (!client)
        return { success: false, reason: 'no_api_key' };
    try {
        const { data, error } = await client.emails.get(emailId);
        if (error)
            throw { message: error.message };
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
// ----------------------------------------------------------------------------
// Webhooks
// ----------------------------------------------------------------------------
function verifyWebhookSignature(payload, signature, timestamp, secret) {
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('base64');
    const signatures = signature.split(' ').map(sig => sig.replace('v1,', ''));
    return signatures.some(sig => {
        try {
            return crypto.timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expectedSignature, 'base64'));
        }
        catch (_a) {
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
    if (!isValid)
        throw new Error('Invalid webhook signature');
    return req.body;
}
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
        var _a;
        await updateEmailLog(admin, data.email_id, {
            status: 'bounced',
            bouncedAt: new Date(data.created_at),
            bounceReason: ((_a = data.bounce) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown',
        });
    },
    'email.opened': async (admin, data) => {
        await updateEmailLog(admin, data.email_id, {
            opened: true,
            openedAt: admin.firestore.FieldValue.arrayUnion(new Date(data.created_at)),
        });
    },
    'email.clicked': async (admin, data) => {
        var _a;
        await updateEmailLog(admin, data.email_id, {
            clicked: true,
            clicks: admin.firestore.FieldValue.arrayUnion({
                url: (_a = data.click) === null || _a === void 0 ? void 0 : _a.link,
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
    }
    catch (error) {
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
// ----------------------------------------------------------------------------
// Audience
// ----------------------------------------------------------------------------
async function addToAudience(apiKey, contactData) {
    var _a, _b;
    const client = getResendClient(apiKey);
    if (!client)
        return { success: false, reason: 'no_api_key' };
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
            if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('already exists')) {
                return { success: true, exists: true };
            }
            if (error.name === 'restricted_api_key' || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('restricted'))) {
                return { success: false, reason: 'restricted_api_key', skipped: true };
            }
            throw { message: error.message };
        }
        console.log(`[Audience] ✅ Added contact: ${email}`);
        return { success: true, id: data === null || data === void 0 ? void 0 : data.id };
    }
    catch (error) {
        console.error('[Audience] ❌ Failed to add contact:', error.message);
        return { success: false, error: error.message };
    }
}
async function updateContact(apiKey, email, updates) {
    const client = getResendClient(apiKey);
    if (!client)
        return { success: false, reason: 'no_api_key' };
    try {
        const { data, error } = await client.contacts.update({ email, ...updates });
        if (error)
            throw { message: error.message };
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
async function removeFromAudience(apiKey, email) {
    const client = getResendClient(apiKey);
    if (!client)
        return { success: false, reason: 'no_api_key' };
    try {
        const { data, error } = await client.contacts.remove({ email });
        if (error)
            throw { message: error.message };
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=email-service.js.map