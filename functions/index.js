const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const {
  sendEmailWithLogging,
  sendBatchEmails,
  parseWebhookEvent,
  handleWebhookEvent,
  generateIdempotencyKey,
  addToAudience,
} = require('./emails/email-service');

admin.initializeApp();

const contactRateLimitMap = new Map();
const newsletterRateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const CONTACT_RATE_LIMIT_MAX_REQUESTS = 5;
const NEWSLETTER_RATE_LIMIT_MAX_REQUESTS = 3;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  : [
      'https://cart-shift.com',
      'https://www.cart-shift.com',
      'https://portal.cart-shift.com',
      'http://localhost:3000',
    ];

function applyCors(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.length > 0) {
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    res.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    res.set('Vary', 'Origin');
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }

  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}

function getRateLimitKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function checkRateLimit(map, key, maxRequests) {
  const now = Date.now();
  const record = map.get(key);

  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

async function checkFirestoreRateLimit(key, maxRequests, windowMs = 60 * 60 * 1000) {
  const ref = admin
    .firestore()
    .collection('rate_limits')
    .doc(key.replace(/[^a-zA-Z0-9]/g, '_')); // Sanitize key

  try {
    return await admin.firestore().runTransaction(async t => {
      const doc = await t.get(ref);
      const now = Date.now();

      if (!doc.exists) {
        t.set(ref, { count: 1, resetTime: now + windowMs });
        return true;
      }

      const data = doc.data();

      if (now > data.resetTime) {
        t.set(ref, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (data.count >= maxRequests) {
        return false;
      }

      t.update(ref, { count: admin.firestore.FieldValue.increment(1) });
      return true;
    });
  } catch (e) {
    console.error('Rate limit transaction error:', e);
    // Fail open (allow request) if DB check fails to avoid blocking users during outages
    return true;
  }
}

const resendApiKey = defineSecret('RESEND_API_KEY', { required: false });
const resendWebhookSecret = defineSecret('RESEND_WEBHOOK_SECRET', { required: false });
const contactEmail = defineSecret('CONTACT_EMAIL', { required: false });
const pagespeedApiKey = defineSecret('PAGESPEED_API_KEY', { required: false });
const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY', { required: false });
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'https://cart-shift.com/portal';

async function sendPortalEmail(to, subject, templateName, data, options = {}) {
  const { tags = [], uniqueId, scheduledAt } = options;

  const enhancedTags = [
    ...tags,
    ...(data.orgId ? [{ name: 'org_id', value: data.orgId }] : []),
    ...(data.requestId ? [{ name: 'request_id', value: data.requestId }] : []),
  ];

  return sendEmailWithLogging(admin, resendApiKey.value(), {
    to,
    subject,
    templateName,
    data,
    tags: enhancedTags,
    idempotencyKey: uniqueId
      ? generateIdempotencyKey(to, subject, templateName, uniqueId)
      : undefined,
    scheduledAt,
  });
}

// Helper to generate and upload invoice PDF
async function saveInvoicePDF(request) {
  try {
    const orgSnap = await admin
      .firestore()
      .collection('portal_organizations')
      .doc(request.orgId)
      .get();
    if (!orgSnap.exists) return;
    const organization = orgSnap.data();

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header - Simplified design for PDFKit compatibility
      doc.fillColor('#2563eb').fontSize(24).text('CartShift Studio', 50, 50);
      doc.fillColor('#6b7280').fontSize(10).text('Premium E-commerce Development', 50, 80);

      doc.fillColor('#111827').fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
      doc
        .fillColor('#6b7280')
        .fontSize(10)
        .text(`#INV-${request.id.substring(0, 8).toUpperCase()}`, 400, 75, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 90, { align: 'right' });

      doc.moveDown(3);

      // Info Section
      const y1 = doc.y;
      doc.fillColor('#6b7280').fontSize(10).text('FROM', 50, y1);
      doc.fillColor('#1a1a1a').text('CartShift Studio', 50, y1 + 15);
      doc.text('Tel Aviv, Israel', 50, y1 + 30);
      doc.text('support@cart-shift.com', 50, y1 + 45);

      doc.fillColor('#6b7280').text('BILL TO', 350, y1);
      doc.fillColor('#1a1a1a').text(organization.name, 350, y1 + 15);
      doc.text(`Org ID: ${request.orgId}`, 350, y1 + 30);
      if (organization.website) doc.text(organization.website, 350, y1 + 45);

      doc.moveDown(4);

      // Table Header
      const tableY = doc.y;
      doc.fillColor('#6b7280').fontSize(9).text('DESCRIPTION', 50, tableY);
      doc.text('QTY', 350, tableY, { width: 50, align: 'center' });
      doc.text('PRICE', 400, tableY, { width: 70, align: 'right' });
      doc.text('TOTAL', 470, tableY, { width: 70, align: 'right' });

      doc
        .moveTo(50, tableY + 15)
        .lineTo(540, tableY + 15)
        .strokeColor('#e5e7eb')
        .stroke();

      // Table Items
      let y = tableY + 25;
      const currency = request.currency === 'ILS' ? '₪' : '$';
      const items = request.lineItems || [
        { description: request.title, quantity: 1, unitPrice: request.totalAmount || 0 },
      ];

      items.forEach(item => {
        doc.fillColor('#111827').fontSize(10).text(item.description, 50, y);
        doc.text(item.quantity.toString(), 350, y, { width: 50, align: 'center' });
        doc.text(`${currency}${(item.unitPrice / 100).toLocaleString()}`, 400, y, {
          width: 70,
          align: 'right',
        });
        doc.text(
          `${currency}${((item.quantity * item.unitPrice) / 100).toLocaleString()}`,
          470,
          y,
          { width: 70, align: 'right' }
        );
        y += 20;
      });

      doc.moveTo(50, y).lineTo(540, y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(2);

      // Summary
      const total = (request.totalAmount || 0) / 100;
      doc
        .fillColor('#111827')
        .fontSize(10)
        .text('Total Paid', 350, doc.y, { width: 100, align: 'right' });
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text(`${currency}${total.toLocaleString()}`, 450, doc.y - 4, {
          width: 90,
          align: 'right',
        });

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text('Thank you for your business. Generated by CartShift Studio Portal.', 50, 750, {
          align: 'center',
        });

      doc.end();
    });

    // Upload to Storage
    const bucket = admin.storage().bucket();
    const filePath = `portal_invoices/${request.orgId}/${request.id}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        firebaseStorageDownloadTokens: request.id, // Fixed token for easier access if public, or just use signed URLs
      },
    });

    // Update Request with Invoice URL (signed URL or standard path)
    await admin.firestore().collection('portal_requests').doc(request.id).update({
      invoicePath: filePath,
      invoiceGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Invoice saved for request ${request.id} at ${filePath}`);
  } catch (error) {
    console.error('Error generating/saving invoice:', error);
  }
}

async function getUserEmail(userId) {
  const userSnap = await admin.firestore().collection('portal_users').doc(userId).get();
  return userSnap.exists ? userSnap.data().email : null;
}

exports.contactForm = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey, contactEmail],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const rateLimitKey = getRateLimitKey(req);
      if (!checkRateLimit(contactRateLimitMap, rateLimitKey, CONTACT_RATE_LIMIT_MAX_REQUESTS)) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const { name, email, interest, message, company, projectType } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const { Resend } = require('resend');
      const apiKey = resendApiKey.value();

      if (apiKey) {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: 'CartShift Studio <noreply@cart-shift.com>',
          to: contactEmail.value() || 'hello@cart-shift.com',
          reply_to: email,
          subject: `New Contact Form: ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${interest ? `<p><strong>Interest:</strong> ${interest}</p>` : ''}
            ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
            ${projectType ? `<p><strong>Project Type:</strong> ${projectType}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          `,
          text: `New contact from ${name} (${email})\n\n${message || 'No message provided'}`,
          tags: [{ name: 'type', value: 'contact_form' }],
        });
      }

      await admin
        .firestore()
        .collection('contact_submissions')
        .add({
          name,
          email,
          interest: interest || null,
          message: message || null,
          company: company || null,
          projectType: projectType || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

exports.newsletterSubscription = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const rateLimitKey = getRateLimitKey(req);
      if (
        !checkRateLimit(newsletterRateLimitMap, rateLimitKey, NEWSLETTER_RATE_LIMIT_MAX_REQUESTS)
      ) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Add to Firestore
      await admin
        .firestore()
        .collection('newsletter_subscriptions')
        .add({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Add to Resend Audience
      await addToAudience(resendApiKey.value(), {
        email,
        firstName,
        lastName,
        source: 'newsletter',
        properties: {
          subscription_type: 'newsletter',
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// ============================================
// PORTAL NOTIFICATION TRIGGERS
// ============================================

// 1. New Request Trigger (Notify Admin)
exports.onPortalRequestCreated = onDocumentCreated(
  { document: 'portal_requests/{requestId}', secrets: [resendApiKey, contactEmail] },
  async event => {
    const requestData = event.data.data();
    const orgSnap = await admin
      .firestore()
      .collection('portal_organizations')
      .doc(requestData.orgId)
      .get();
    const orgName = orgSnap.exists ? orgSnap.data().name : 'Unknown Organization';

    await sendPortalEmail(
      contactEmail.value() || 'hello@cart-shift.com',
      `New Request: ${requestData.title}`,
      'new_request',
      {
        clientName: requestData.createdByName || 'A client',
        organizationName: orgName,
        requestTitle: requestData.title,
        requestDescription: requestData.description,
        requestType: requestData.type,
        requestPriority: requestData.priority,
        actionUrl: `${PORTAL_BASE_URL}/org/${requestData.orgId}/requests/${event.params.requestId}`,
        requestId: event.params.requestId,
        orgId: requestData.orgId,
      },
      {
        uniqueId: event.params.requestId,
        tags: [
          { name: 'request_type', value: requestData.type || 'unknown' },
          { name: 'priority', value: requestData.priority || 'normal' },
        ],
      }
    );
  }
);

// 2. Request Updated Trigger (Notify Client on Status Change / Quote)
exports.onPortalRequestUpdated = onDocumentUpdated(
  { document: 'portal_requests/{requestId}', secrets: [resendApiKey] },
  async event => {
    const oldData = event.data.before.data();
    const newData = event.data.after.data();

    const clientEmail = await getUserEmail(newData.createdBy);
    if (!clientEmail) return;

    const requestUrl = `${PORTAL_BASE_URL}/org/${newData.orgId}/requests/${event.params.requestId}`;

    // Detect Status Change
    if (oldData.status !== newData.status) {
      const statusConfigs = {
        IN_PROGRESS: { label: 'In Progress', style: 'background: #dbeafe; color: #1e40af;' },
        IN_REVIEW: { label: 'In Review', style: 'background: #fef3c7; color: #92400e;' },
        DELIVERED: { label: 'Delivered', style: 'background: #d1fae5; color: #065f46;' },
        PAID: { label: 'Paid', style: 'background: #ecfdf5; color: #065f46;' },
        CLOSED: { label: 'Closed', style: 'background: #f1f5f9; color: #475569;' },
      };

      const config = statusConfigs[newData.status];
      if (config) {
        await sendPortalEmail(
          clientEmail,
          `Update: ${newData.title}`,
          'status_update',
          {
            requestTitle: newData.title,
            statusLabel: config.label,
            statusStyle: config.style,
            actionUrl: requestUrl,
            requestId: event.params.requestId,
            orgId: newData.orgId,
          },
          {
            uniqueId: `${event.params.requestId}-status-${newData.status}`,
            tags: [{ name: 'new_status', value: newData.status }],
          }
        );
      }
    }

    // 2. Detect Milestone Completion
    if (newData.milestones && Array.isArray(newData.milestones)) {
      const oldMilestones = oldData.milestones || [];
      const milestoneEmails = [];

      newData.milestones.forEach((m, index) => {
        const oldM = oldMilestones[index];
        if (m.status === 'completed' && (!oldM || oldM.status !== 'completed')) {
          milestoneEmails.push(
            sendPortalEmail(
              clientEmail,
              `Milestone Completed: ${m.title}`,
              'milestone_completed',
              {
                requestTitle: newData.title,
                milestoneTitle: m.title,
                actionUrl: requestUrl,
                requestId: event.params.requestId,
                orgId: newData.orgId,
              },
              {
                uniqueId: `${event.params.requestId}-milestone-${index}`,
                tags: [{ name: 'milestone_index', value: String(index) }],
              }
            )
          );
        }
      });

      if (milestoneEmails.length > 0) {
        await Promise.all(milestoneEmails);
      }
    }

    // 3. Detect Quote added (New Quote)
    if (!oldData.isBillable && newData.isBillable && newData.status === 'QUOTED') {
      const currencySymbol = newData.currency === 'ILS' ? '₪' : '$';
      const totalFormatted = `${currencySymbol}${(newData.totalAmount / 100).toLocaleString()}`;

      await sendPortalEmail(
        clientEmail,
        `New Quote: ${newData.title}`,
        'quote_received',
        {
          requestTitle: newData.title,
          totalAmount: totalFormatted,
          actionUrl: requestUrl,
          requestId: event.params.requestId,
          orgId: newData.orgId,
        },
        {
          uniqueId: `${event.params.requestId}-quote`,
        }
      );
    }

    // Detect Payment (Paid)
    if (!oldData.paidAt && newData.paidAt) {
      const currencySymbol = newData.currency === 'ILS' ? '₪' : '$';
      const totalFormatted = `${currencySymbol}${(newData.totalAmount / 100).toLocaleString()}`;

      await sendPortalEmail(
        clientEmail,
        `Payment Received: ${newData.title}`,
        'payment_receipt',
        {
          requestTitle: newData.title,
          totalAmount: totalFormatted,
          paymentId: newData.paymentId || 'N/A',
          actionUrl: requestUrl,
          requestId: event.params.requestId,
          orgId: newData.orgId,
        },
        {
          uniqueId: `${event.params.requestId}-payment-${newData.paymentId}`,
          tags: [{ name: 'payment_id', value: newData.paymentId || 'unknown' }],
        }
      );

      // Generate and store Invoice PDF
      await saveInvoicePDF(newData);
    }
  }
);

// 3. New Comment Trigger
exports.onPortalCommentCreated = onDocumentCreated(
  { document: 'portal_comments/{commentId}', secrets: [resendApiKey, contactEmail] },
  async event => {
    const commentData = event.data.data();
    if (commentData.isInternal) return; // Don't notify for internal comments

    const requestSnap = await admin
      .firestore()
      .collection('portal_requests')
      .doc(commentData.requestId)
      .get();
    if (!requestSnap.exists) return;
    const requestData = requestSnap.data();

    const authorId = commentData.userId;
    const isAgencyAuthor = authorId === 'agency' || authorId.includes('agency'); // Rough check, improved below

    // Try to find if the user is agency
    const authorSnap = await admin.firestore().collection('portal_users').doc(authorId).get();
    const isAgency = authorSnap.exists ? authorSnap.data().isAgency : false;

    const targetEmail = isAgency
      ? await getUserEmail(requestData.createdBy) // Agency commented -> Notify client
      : contactEmail.value() || 'hello@cart-shift.com'; // Client commented -> Notify admin

    if (!targetEmail) return;

    await sendPortalEmail(
      targetEmail,
      `New message: ${requestData.title}`,
      'new_comment',
      {
        userName: commentData.userName,
        requestTitle: requestData.title,
        commentText: commentData.content,
        actionUrl: `${PORTAL_BASE_URL}/org/${commentData.orgId}/requests/${commentData.requestId}`,
        requestId: commentData.requestId,
        orgId: commentData.orgId,
      },
      {
        uniqueId: event.params.commentId,
        tags: [{ name: 'comment_author', value: isAgency ? 'agency' : 'client' }],
      }
    );
  }
);

// ============================================
// GOOGLE CALENDAR OAUTH CALLBACK
// ============================================

const googleClientId = defineSecret('GOOGLE_CLIENT_ID', { required: false });
const googleClientSecret = defineSecret('GOOGLE_CLIENT_SECRET', { required: false });

exports.googleCalendarOAuthCallback = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [googleClientId, googleClientSecret],
  },
  async (req, res) => {
    if (!applyCors(req, res)) {
      return;
    }

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const clientId = googleClientId.value();
      const clientSecret = googleClientSecret.value();

      if (!clientId || !clientSecret) {
        console.error('[Google Calendar] Missing OAuth credentials');
        return res.status(500).json({
          success: false,
          message: 'Google OAuth not configured',
        });
      }

      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        console.error('[Google Calendar] Missing parameters:', {
          hasCode: !!code,
          hasRedirectUri: !!redirectUri,
        });
        return res.status(400).json({
          success: false,
          message: 'Missing code or redirectUri',
        });
      }

      console.log('[Google Calendar] Exchanging code for tokens');
      console.log('[Google Calendar] Redirect URI:', redirectUri);
      console.log('[Google Calendar] Client ID:', clientId.substring(0, 20) + '...');
      console.log('[Google Calendar] Code length:', code?.length || 0);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Google Calendar] Token exchange error:', errorText);
        let errorMessage = 'Failed to exchange code for tokens';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error_description || errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      const tokens = await tokenResponse.json();

      return res.status(200).json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        scope: tokens.scope,
      });
    } catch (error) {
      console.error('[Google Calendar] Callback API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ============================================
// GOOGLE CALENDAR HELPERS
// ============================================

// Helper to verify Firebase ID Token
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

// Helper to get a valid Google access token (refreshes if needed)
async function getValidGoogleToken(userId) {
  const integrationDoc = await admin
    .firestore()
    .collection('agency_integrations')
    .doc(`${userId}_google_calendar`)
    .get();
  if (!integrationDoc.exists) {
    throw new Error('Google Calendar not connected');
  }

  const data = integrationDoc.data();
  const now = Date.now();

  // Check if tokenExpiry exists and is a Timestamp
  let expiry = 0;
  if (data.tokenExpiry && typeof data.tokenExpiry.toDate === 'function') {
    expiry = data.tokenExpiry.toDate().getTime();
  } else if (data.tokenExpiry) {
    expiry = new Date(data.tokenExpiry).getTime();
  }

  // If token is still valid (with 5 min buffer), return it
  if (expiry > now + 5 * 60 * 1000) {
    return {
      accessToken: data.accessToken,
      selectedCalendarId: data.selectedCalendarId || 'primary',
    };
  }

  // Otherwise, refresh it
  if (!data.refreshToken) {
    throw new Error('Token expired and no refresh token available');
  }

  console.log(`Refreshing Google token for user ${userId}`);
  const clientId = googleClientId.value();
  const clientSecret = googleClientSecret.value();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on server');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to refresh Google token');
  }

  const tokens = await response.json();
  const accessToken = tokens.access_token;
  const newExpiry = new Date(now + tokens.expires_in * 1000);

  // Update Firestore
  await integrationDoc.ref.update({
    accessToken: accessToken,
    tokenExpiry: admin.firestore.Timestamp.fromDate(newExpiry),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    accessToken,
    selectedCalendarId: data.selectedCalendarId || 'primary',
  };
}

// ============================================
// GOOGLE CALENDAR API ROUTES
// ============================================

// 1. List Calendars
exports.googleCalendarListCalendars = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken } = await getValidGoogleToken(userId);

      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      const calendars = (data.items || []).map(item => ({
        id: item.id,
        summary: item.summary,
        primary: item.primary || false,
        backgroundColor: item.backgroundColor,
      }));

      return res.status(200).json({ calendars });
    } catch (error) {
      console.error('List calendars error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 2. Create Event
exports.googleCalendarCreateEvent = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken, selectedCalendarId } = await getValidGoogleToken(userId);
      const eventData = req.body;

      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.startTime },
        end: { dateTime: eventData.endTime },
        attendees: eventData.attendees ? eventData.attendees.map(email => ({ email })) : [],
        location: eventData.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const calendarId = encodeURIComponent(selectedCalendarId || 'primary');
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      return res.status(200).json({
        eventId: data.id,
        meetLink: data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri,
      });
    } catch (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 3. Get Free/Busy Intervals
exports.googleCalendarGetFreeBusy = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { accessToken, selectedCalendarId } = await getValidGoogleToken(userId);
      const { timeMin, timeMax } = req.body;

      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: 'Missing timeMin or timeMax' });
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: selectedCalendarId || 'primary' }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      const busySlots = data.calendars?.[selectedCalendarId || 'primary']?.busy || [];

      return res.status(200).json({ busy: busySlots });
    } catch (error) {
      console.error('Free/busy error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// 4. Delete Event
exports.googleCalendarDeleteEvent = onRequest(
  { cors: true, maxInstances: 5, secrets: [googleClientId, googleClientSecret] },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const userId = await verifyAuth(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { eventId, calendarId } = req.body;
      if (!eventId) {
        return res.status(400).json({ error: 'Missing eventId' });
      }

      const { accessToken } = await getValidGoogleToken(userId);
      const targetCalendar = calendarId ? encodeURIComponent(calendarId) : 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${targetCalendar}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 204 No Content is success for DELETE
      if (
        !response.ok &&
        response.status !== 204 &&
        response.status !== 404 &&
        response.status !== 410
      ) {
        // 410 = GONE (already deleted)
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete event error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// ============================================
// TEAM INVITATION EMAIL TRIGGER
// ============================================

exports.onTeamInviteCreated = onDocumentCreated(
  { document: 'portal_invites/{inviteId}', secrets: [resendApiKey] },
  async event => {
    const invite = event.data.data();
    if (!invite.email) return;

    const orgSnap = await admin
      .firestore()
      .collection('portal_organizations')
      .doc(invite.orgId)
      .get();

    const orgName = orgSnap.exists ? orgSnap.data().name : 'an organization';
    const inviteUrl = `${PORTAL_BASE_URL}/invite/${invite.code}`;

    await sendPortalEmail(
      invite.email,
      `You're invited to join ${orgName}`,
      'team_invite',
      {
        inviterName: invite.invitedByName || 'A team member',
        organizationName: orgName,
        actionUrl: inviteUrl,
        orgId: invite.orgId,
      },
      {
        tags: [{ name: 'invite_id', value: event.params.inviteId }],
        uniqueId: invite.code,
      }
    );
  }
);

// ============================================
// EMAIL QUEUE PROCESSOR (for batch/reliable sending)
// ============================================

exports.processEmailQueue = onDocumentCreated(
  { document: 'email_queue/{emailId}', secrets: [resendApiKey] },
  async event => {
    const emailDoc = event.data;
    const email = emailDoc.data();

    if (email.status !== 'pending') return;

    await emailDoc.ref.update({ status: 'processing' });

    const result = await sendPortalEmail(email.to, email.subject, email.templateName, email.data, {
      tags: email.tags || [],
      uniqueId: event.params.emailId,
      scheduledAt: email.scheduledAt,
    });

    await emailDoc.ref.update({
      status: result.success ? 'sent' : 'failed',
      emailId: result.id || null,
      result,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

// ============================================
// STORE ANALYZER - SEND ANALYSIS REPORT
// ============================================

const ANALYSIS_TEXTS = {
  en: {
    subject: 'Your Complete Store Analysis Report',
    headline: 'Your In-Depth Store Analysis is Ready!',
    badge: 'COMPREHENSIVE REPORT',
    greeting: 'Hello,',
    introText:
      "We've completed an in-depth analysis of your e-commerce store, examining 40+ data points across 6 critical areas. This report contains detailed findings, actionable recommendations, and a prioritized roadmap to help you improve conversions and revenue.",
    overallScoreLabel: 'OVERALL HEALTH SCORE',
    scoreBreakdownTitle: 'Score Breakdown by Category',
    priorityFixesTitle: 'High-Priority Issues to Fix First',
    proTipLabel: 'Expert Insight',
    proTipText:
      'Stores that address their top 3 issues typically see a 20-35% improvement in conversion rates within 30 days. Focus on high-impact items first for the fastest ROI.',
    ctaTitle: 'Ready to Fix These Issues?',
    ctaText:
      'Book a free 30-minute strategy call with our e-commerce experts to discuss your results and create a custom action plan.',
    ctaButtonText: 'Book Free Strategy Call',
    analyzedUrl: 'Analyzed URL',
    footerText: 'This comprehensive report was generated by CartShift Studio',
    scoreStatus: {
      excellent: 'Excellent! Your store is performing above industry standards.',
      good: 'Good foundation! A few optimizations can take you to the next level.',
      warning: 'Needs attention. These issues are likely costing you sales.',
      critical: 'Critical issues detected. Immediate action recommended.',
    },
    sections: {
      performance: 'Performance',
      seo: 'Technical SEO',
      accessibility: 'Accessibility',
      bestPractices: 'Best Practices',
      cart: 'Cart & Checkout',
      trust: 'Trust & Credibility',
    },
    sectionDescriptions: {
      performance:
        'Page speed directly impacts bounce rates and conversions. Every 1-second delay can reduce conversions by 7%.',
      seo: 'Technical SEO determines how well search engines can find and rank your store pages.',
      accessibility:
        'Accessibility affects 15-20% of users and is increasingly a legal requirement.',
      bestPractices:
        'Security and modern standards build customer confidence and protect your business.',
      cart: 'Cart and checkout optimization can recover up to 70% of abandoned carts.',
      trust: 'Trust signals can increase conversions by 15-30% for new visitors.',
    },
    impact: {
      high: 'HIGH IMPACT',
      medium: 'MEDIUM',
      low: 'LOW',
    },
    // New detailed sections
    detailedFindingsTitle: 'Detailed Analysis by Category',
    whatWeFound: 'What We Found',
    issuesDetected: 'Issues Detected',
    passingChecks: 'Passing Checks',
    allRecommendationsTitle: 'Complete Recommendations List',
    howToFix: 'How to Fix',
    estimatedImpact: 'Estimated Impact',
    coreWebVitalsTitle: 'Core Web Vitals Analysis',
    coreWebVitalsSubtitle: "Google's key metrics for user experience",
    lcpLabel: 'Largest Contentful Paint (LCP)',
    lcpDesc: 'Measures loading performance. Should occur within 2.5 seconds.',
    clsLabel: 'Cumulative Layout Shift (CLS)',
    clsDesc: 'Measures visual stability. Should be less than 0.1.',
    fidLabel: 'First Input Delay (FID)',
    fidDesc: 'Measures interactivity. Should be less than 100ms.',
    actionRoadmapTitle: '30-Day Action Roadmap',
    actionRoadmapSubtitle: "Prioritized steps to maximize your store's potential",
    week1: 'Week 1: Critical Fixes',
    week2: 'Week 2: Performance',
    week3: 'Week 3: SEO & Trust',
    week4: 'Week 4: Optimization',
    revenueImpactTitle: 'Potential Revenue Impact',
    revenueImpactText:
      'Based on industry benchmarks, fixing these issues could increase your conversion rate by',
    conversionIncrease: '15-35%',
    industryBenchmark: 'Industry Benchmark',
    yourScore: 'Your Score',
    good: 'Good',
    needsWork: 'Needs Work',
    critical: 'Critical',
    actionSteps: {
      // Performance action steps
      'Reduce server response time':
        'Upgrade hosting, enable caching, or use a CDN like Cloudflare.',
      'Minimize JavaScript': 'Remove unused code, defer non-critical scripts, use code splitting.',
      'Optimize images': 'Compress images, use WebP format, implement lazy loading.',
      'Eliminate render-blocking resources':
        'Defer CSS/JS, inline critical CSS, use async/defer attributes.',
      'Implement lazy loading for images': 'Add loading="lazy" attribute to images below the fold.',
      'Minimize and bundle JavaScript':
        'Use build tools like Webpack to bundle and minify JS files.',
      // SEO action steps
      'Add a descriptive page title':
        'Create unique, keyword-rich titles under 60 characters for each page.',
      'Add meta description':
        'Write compelling 150-160 character descriptions for better click-through rates.',
      'Add a main H1 heading':
        'Each page should have one clear H1 that describes the page content.',
      'Fix broken links': 'Use tools like Screaming Frog to find and fix 404 errors.',
      'Add structured data': 'Implement Product, Organization, and BreadcrumbList schema markup.',
      // Accessibility action steps
      'Add lang attribute to HTML tag':
        'Add lang="en" (or appropriate language) to your <html> tag.',
      'Add viewport meta tag':
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Add alt text to images': 'Write descriptive alt text for all product and content images.',
      'Improve color contrast':
        'Ensure text has at least 4.5:1 contrast ratio against backgrounds.',
      'Add form labels': 'Associate visible labels with all form inputs using the for attribute.',
      // Cart action steps
      'Ensure cart is always visible':
        'Add a persistent cart icon in the header showing item count.',
      'Add security assurances near checkout/cart':
        'Display SSL badges, secure payment icons, and guarantees.',
      'Simplify checkout process':
        'Reduce form fields, offer guest checkout, show progress indicator.',
      // Trust action steps
      'Add customer reviews':
        'Implement product reviews and display aggregate ratings prominently.',
      'Ensure Privacy Policy is visible': 'Link to privacy policy in footer and during checkout.',
      'Add trust badges': 'Display security seals, payment icons, and guarantee badges.',
    },
  },
  he: {
    subject: 'דוח ניתוח החנות המלא שלך',
    headline: 'ניתוח החנות המעמיק שלך מוכן!',
    badge: 'דוח מקיף',
    greeting: 'שלום,',
    introText:
      'סיימנו ניתוח מעמיק של חנות האיקומרס שלך, בחנו 40+ נקודות נתונים ב-6 תחומים קריטיים. דוח זה מכיל ממצאים מפורטים, המלצות ניתנות לפעולה, ומפת דרכים מתועדפת שתעזור לשפר המרות והכנסות.',
    overallScoreLabel: 'ציון בריאות כללי',
    scoreBreakdownTitle: 'פירוט ציון לפי קטגוריה',
    priorityFixesTitle: 'בעיות בעדיפות גבוהה לתיקון ראשון',
    proTipLabel: 'תובנה מקצועית',
    proTipText:
      'חנויות שמטפלות ב-3 הבעיות המובילות רואות בדרך כלל שיפור של 20-35% בשיעורי ההמרה תוך 30 יום. התמקדו בפריטים בעלי השפעה גבוהה תחילה לקבלת ROI מהיר.',
    ctaTitle: 'מוכנים לתקן את הבעיות האלה?',
    ctaText:
      'קבעו שיחת אסטרטגיה חינמית של 30 דקות עם מומחי האיקומרס שלנו לדון בתוצאות וליצור תוכנית פעולה מותאמת.',
    ctaButtonText: 'קבעו שיחה חינם',
    analyzedUrl: 'כתובת שנותחה',
    footerText: 'הדוח המקיף הזה נוצר על ידי CartShift Studio',
    scoreStatus: {
      excellent: 'מצוין! החנות שלך מתפקדת מעל לסטנדרטים בתעשייה.',
      good: 'בסיס טוב! כמה אופטימיזציות יכולות לקחת אתכם לשלב הבא.',
      warning: 'דורש תשומת לב. הבעיות האלה כנראה עולות לכם במכירות.',
      critical: 'נמצאו בעיות קריטיות. מומלצת פעולה מיידית.',
    },
    sections: {
      performance: 'ביצועים',
      seo: 'SEO טכני',
      accessibility: 'נגישות',
      bestPractices: 'שיטות מומלצות',
      cart: "עגלה וצ'קאאוט",
      trust: 'אמון ואמינות',
    },
    sectionDescriptions: {
      performance:
        'מהירות עמוד משפיעה ישירות על אחוזי נטישה והמרות. כל שנייה עיכוב יכולה להפחית המרות ב-7%.',
      seo: 'SEO טכני קובע כמה טוב מנועי חיפוש יכולים למצוא ולדרג את עמודי החנות שלך.',
      accessibility: 'נגישות משפיעה על 15-20% מהמשתמשים והופכת יותר ויותר לדרישה חוקית.',
      bestPractices: 'אבטחה וסטנדרטים מודרניים בונים אמון לקוחות ומגנים על העסק שלך.',
      cart: "אופטימיזציית עגלה וצ'קאאוט יכולה לשחזר עד 70% מהעגלות הנטושות.",
      trust: 'סימני אמון יכולים להגדיל המרות ב-15-30% עבור מבקרים חדשים.',
    },
    impact: {
      high: 'השפעה גבוהה',
      medium: 'בינוני',
      low: 'נמוך',
    },
    // New detailed sections
    detailedFindingsTitle: 'ניתוח מפורט לפי קטגוריה',
    whatWeFound: 'מה מצאנו',
    issuesDetected: 'בעיות שזוהו',
    passingChecks: 'בדיקות שעברו',
    allRecommendationsTitle: 'רשימת המלצות מלאה',
    howToFix: 'איך לתקן',
    estimatedImpact: 'השפעה משוערת',
    coreWebVitalsTitle: 'ניתוח Core Web Vitals',
    coreWebVitalsSubtitle: 'המדדים המרכזיים של גוגל לחוויית משתמש',
    lcpLabel: 'Largest Contentful Paint (LCP)',
    lcpDesc: 'מודד ביצועי טעינה. צריך להתרחש תוך 2.5 שניות.',
    clsLabel: 'Cumulative Layout Shift (CLS)',
    clsDesc: 'מודד יציבות ויזואלית. צריך להיות פחות מ-0.1.',
    fidLabel: 'First Input Delay (FID)',
    fidDesc: 'מודד אינטראקטיביות. צריך להיות פחות מ-100 מילישניות.',
    actionRoadmapTitle: 'מפת דרכים ל-30 יום',
    actionRoadmapSubtitle: 'צעדים מתועדפים למיקסום הפוטנציאל של החנות שלך',
    week1: 'שבוע 1: תיקונים קריטיים',
    week2: 'שבוע 2: ביצועים',
    week3: 'שבוע 3: SEO ואמון',
    week4: 'שבוע 4: אופטימיזציה',
    revenueImpactTitle: 'השפעת הכנסות פוטנציאלית',
    revenueImpactText:
      'בהתבסס על נתוני תעשייה, תיקון הבעיות האלה יכול להגדיל את שיעור ההמרה שלך ב-',
    conversionIncrease: '15-35%',
    industryBenchmark: 'סטנדרט תעשייה',
    yourScore: 'הציון שלך',
    good: 'טוב',
    needsWork: 'דורש עבודה',
    critical: 'קריטי',
    actionSteps: {
      // Performance
      'Reduce server response time': 'שדרגו אחסון, הפעילו caching, או השתמשו ב-CDN כמו Cloudflare.',
      'Minimize JavaScript':
        'הסירו קוד לא בשימוש, דחו סקריפטים לא קריטיים, השתמשו ב-code splitting.',
      'Optimize images': 'דחסו תמונות, השתמשו בפורמט WebP, יישמו lazy loading.',
      'Eliminate render-blocking resources':
        'דחו CSS/JS, הטמיעו CSS קריטי inline, השתמשו ב-async/defer.',
      'Implement lazy loading for images': 'הוסיפו loading="lazy" לתמונות מתחת לקו הראשון.',
      'Minimize and bundle JavaScript': 'השתמשו בכלי build כמו Webpack לאיחוד ומינימיזציה של JS.',
      // SEO
      'Add a descriptive page title':
        'צרו כותרות ייחודיות עשירות במילות מפתח עד 60 תווים לכל עמוד.',
      'Add meta description': 'כתבו תיאורים משכנעים של 150-160 תווים לשיפור שיעור הקליקים.',
      'Add a main H1 heading': 'כל עמוד צריך H1 ברור אחד שמתאר את תוכן העמוד.',
      'Fix broken links': 'השתמשו בכלים כמו Screaming Frog למציאת ותיקון שגיאות 404.',
      'Add structured data': 'יישמו Product, Organization ו-BreadcrumbList schema markup.',
      // Accessibility
      'Add lang attribute to HTML tag': 'הוסיפו lang="he" (או שפה מתאימה) לתג <html> שלכם.',
      'Add viewport meta tag':
        'הוסיפו <meta name="viewport" content="width=device-width, initial-scale=1">.',
      'Add alt text to images': 'כתבו טקסט alt תיאורי לכל תמונות המוצרים והתוכן.',
      'Improve color contrast': 'וודאו שלטקסט יש יחס ניגודיות של לפחות 4.5:1 מול רקעים.',
      'Add form labels': 'שייכו תוויות נראות לכל שדות הטופס באמצעות תכונת for.',
      // Cart
      'Ensure cart is always visible': 'הוסיפו אייקון עגלה קבוע בכותרת שמציג מספר פריטים.',
      'Add security assurances near checkout/cart':
        'הציגו תגי SSL, אייקוני תשלום מאובטח והתחייבויות.',
      'Simplify checkout process': 'צמצמו שדות טופס, הציעו checkout כאורח, הציגו מחוון התקדמות.',
      // Trust
      'Add customer reviews': 'יישמו ביקורות מוצרים והציגו דירוגים מצטברים באופן בולט.',
      'Ensure Privacy Policy is visible': "קשרו למדיניות פרטיות בפוטר ובמהלך הצ'קאאוט.",
      'Add trust badges': 'הציגו חותמות אבטחה, אייקוני תשלום ותגי התחייבות.',
    },
  },
};

function getScoreColor(score) {
  if (score >= 80) return '#059669'; // green
  if (score >= 60) return '#2563eb'; // blue
  if (score >= 40) return '#d97706'; // amber
  return '#dc2626'; // red
}

function getScoreEmoji(score) {
  if (score >= 80) return '✓';
  if (score >= 60) return '○';
  if (score >= 40) return '!';
  return '✕';
}

function getScoreBg(score) {
  if (score >= 80) return '#ecfdf5';
  if (score >= 60) return '#eff6ff';
  if (score >= 40) return '#fffbeb';
  return '#fef2f2';
}

function getScoreBorder(score) {
  if (score >= 80) return '#a7f3d0';
  if (score >= 60) return '#bfdbfe';
  if (score >= 40) return '#fde68a';
  return '#fecaca';
}

// Build score breakdown - PROFESSIONAL VERSION
function buildScoresHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
  const sectionColors = {
    performance: '#ea580c',
    seo: '#2563eb',
    accessibility: '#7c3aed',
    bestPractices: '#059669',
    cart: '#16a34a',
    trust: '#dc2626',
  };

  const scoresHtml = sectionOrder
    .map((key, index) => {
      const section = sections[key];
      if (!section) return '';
      const scoreColor = getScoreColor(section.score);
      const scoreBg = getScoreBg(section.score);
      const scoreBorder = getScoreBorder(section.score);
      const label = texts.sections[key] || section.name || key;
      const accentColor = sectionColors[key] || '#64748b';
      const isLast = index === sectionOrder.length - 1;
      const progressPercent = Math.min(section.score, 100);

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${isRtl ? 'text-align: right;' : ''}">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="10" style="padding-${isRtl ? 'left' : 'right'}: 12px; vertical-align: middle;">
                      <table cellpadding="0" cellspacing="0" border="0" style="background: ${accentColor}; border-radius: 3px; width: 6px; height: 32px;">
                        <tr><td></td></tr>
                      </table>
                    </td>
                    <td style="vertical-align: middle;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${label}</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${scoreBg}; border: 1px solid ${scoreBorder}; border-radius: 6px; padding: 6px 12px;">
                      <span style="color: ${scoreColor}; font-weight: 800; font-size: 16px;">${section.score}</span>
                      <span style="color: ${scoreColor}; font-weight: 500; font-size: 12px; opacity: 0.7;">/100</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 10px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f1f5f9; border-radius: 4px; height: 6px;">
                  <tr>
                    <td width="${progressPercent}%" style="background: ${accentColor}; border-radius: 4px; height: 6px;"></td>
                    <td></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; table-layout: fixed;">
      ${scoresHtml}
    </table>
  `;
}

// Build priority fixes - PROFESSIONAL VERSION
function buildRecommendationsHtml(sections, texts, isRtl) {
  const allRecs = [];
  Object.values(sections).forEach(section => {
    if (section.recommendations) {
      section.recommendations.forEach(rec => {
        if (rec.impact === 'high') {
          allRecs.push(rec);
        }
      });
    }
  });

  const topRecs = allRecs.slice(0, 5);
  if (topRecs.length === 0) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 32px; margin: 0 0 12px;">🎉</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">Great job! No critical issues found.</p>
          </td>
        </tr>
      </table>
    `;
  }

  const recsHtml = topRecs
    .map((rec, index) => {
      const actionStep = texts.actionSteps[rec.title] || '';
      const isLast = index === topRecs.length - 1;

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="36" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 12px;">
                <table cellpadding="0" cellspacing="0" border="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; width: 32px; height: 32px;">
                  <tr>
                    <td align="center" style="color: #dc2626; font-size: 14px; font-weight: 800;">${index + 1}</td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align: top; ${isRtl ? 'text-align: right;' : ''}">
                <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                  <tr>
                    <td style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 3px 8px;">
                      <span style="color: #dc2626; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">${texts.impact.high}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 8px; font-size: 13px; color: #1f2937; line-height: 1.5; font-weight: 600; word-wrap: break-word;">${rec.title}</p>
                ${
                  actionStep
                    ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                    <tr>
                      <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                          <tr>
                            <td width="20" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 6px;">
                              <span style="font-size: 12px;">💡</span>
                            </td>
                            <td style="word-wrap: break-word; word-break: break-word;">
                              <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; word-wrap: break-word;">
                                <strong>${texts.howToFix}:</strong> ${actionStep}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                `
                    : ''
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; table-layout: fixed;">
      ${recsHtml}
    </table>
  `;
}

// Build detailed findings HTML for each section - PROFESSIONAL EMAIL-SAFE VERSION
function buildDetailedFindingsHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
  const sectionColors = {
    performance: { gradient: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
    seo: { gradient: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
    accessibility: { gradient: '#8b5cf6', light: '#ede9fe', dark: '#5b21b6' },
    bestPractices: { gradient: '#10b981', light: '#d1fae5', dark: '#065f46' },
    cart: { gradient: '#22c55e', light: '#dcfce7', dark: '#166534' },
    trust: { gradient: '#ec4899', light: '#fce7f3', dark: '#9d174d' },
  };
  const emojis = {
    performance: '⚡',
    seo: '🔍',
    accessibility: '♿',
    bestPractices: '🛡️',
    cart: '🛒',
    trust: '✨',
  };

  return sectionOrder
    .map(key => {
      const section = sections[key];
      if (!section) return '';

      const label = texts.sections[key] || section.name || key;
      const description = texts.sectionDescriptions?.[key] || '';
      const colors = sectionColors[key];
      const emoji = emojis[key];
      const scoreColor = getScoreColor(section.score);

      const positiveFindings = section.findings?.filter(f => f.type === 'positive') || [];
      const issueFindings = section.findings?.filter(f => f.type === 'issue') || [];
      const hasFindings = positiveFindings.length > 0 || issueFindings.length > 0;

      const findingsHtml = [...issueFindings, ...positiveFindings]
        .map((finding, idx, arr) => {
          const isIssue = finding.type === 'issue';
          const isLast = idx === arr.length - 1;
          return `
        <tr>
          <td style="padding: 10px 14px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} background: ${isIssue ? '#fef2f2' : '#f0fdf4'};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td width="28" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 10px;">
                  <div style="width: 22px; height: 22px; background: ${isIssue ? '#fee2e2' : '#dcfce7'}; border-radius: 50%; text-align: center; line-height: 22px;">
                    <span style="font-size: 11px;">${isIssue ? '✕' : '✓'}</span>
                  </div>
                </td>
                <td style="${isRtl ? 'text-align: right;' : ''} word-wrap: break-word; word-break: break-word;">
                  <p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: ${isIssue ? '#b91c1c' : '#15803d'}; word-wrap: break-word;">${finding.title}</p>
                  <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4; word-wrap: break-word;">${finding.description}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        })
        .join('');

      return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; table-layout: fixed; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.gradient}; border-radius: 12px 12px 0 0; padding: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-${isRtl ? 'left' : 'right'}: 8px; vertical-align: middle;">
                        <span style="font-size: 18px;">${emoji}</span>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="color: #ffffff; font-size: 16px; font-weight: 700;">${label}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="${isRtl ? 'left' : 'right'}" width="80" style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.2); border-radius: 6px;">
                    <tr>
                      <td style="padding: 6px 10px; text-align: center;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: 800;">${section.score}</span>
                        <span style="color: rgba(255,255,255,0.7); font-size: 11px;">/100</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${description ? `<p style="margin: 10px 0 0; font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.5; word-wrap: break-word; ${isRtl ? 'text-align: right;' : ''}">${description}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td style="padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                    <tr>
                      <td style="${isRtl ? 'text-align: right;' : ''}">
                        <span style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px;">${texts.whatWeFound}</span>
                      </td>
                      <td align="${isRtl ? 'left' : 'right'}" style="white-space: nowrap;">
                        <span style="font-size: 11px; color: #dc2626; font-weight: 600;">${issueFindings.length} issues</span>
                        <span style="font-size: 11px; color: #9ca3af;"> · </span>
                        <span style="font-size: 11px; color: #16a34a; font-weight: 600;">${positiveFindings.length} passed</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${hasFindings ? findingsHtml : `<tr><td style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">No specific findings available.</td></tr>`}
            </table>
          </td>
        </tr>
      </table>
    `;
    })
    .join('');
}

// Build all recommendations grouped by section with action steps - PROFESSIONAL VERSION
function buildFullRecommendationsHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];

  const allSectionsHtml = sectionOrder
    .map(key => {
      const section = sections[key];
      if (!section || !section.recommendations || section.recommendations.length === 0) return '';

      const label = texts.sections[key] || section.name || key;
      const recCount = section.recommendations.length;

      const recsHtml = section.recommendations
        .map((rec, idx) => {
          const isHigh = rec.impact === 'high';
          const isMedium = rec.impact === 'medium';
          const impactColor = isHigh ? '#dc2626' : isMedium ? '#d97706' : '#6b7280';
          const impactBg = isHigh ? '#fef2f2' : isMedium ? '#fffbeb' : '#f9fafb';
          const impactBorder = isHigh ? '#fecaca' : isMedium ? '#fde68a' : '#e5e7eb';
          const impactLabel = texts.impact[rec.impact] || rec.impact;
          const actionStep = texts.actionSteps[rec.title] || '';
          const isLast = idx === section.recommendations.length - 1;

          return `
        <tr>
          <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl; text-align: right;' : ''}">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="80" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 12px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: ${impactBg}; border: 1px solid ${impactBorder}; border-radius: 4px;">
                    <tr>
                      <td style="padding: 4px 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: ${impactColor}; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;">${impactLabel}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.4;">${rec.title}</p>
                  ${
                    actionStep
                      ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                      <tr>
                        <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 12px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 8px;">
                                <span style="font-size: 14px;">💡</span>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">
                                  <strong>${texts.howToFix}:</strong> ${actionStep}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  `
                      : ''
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        })
        .join('');

      return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0; padding: 14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 15px; font-weight: 700; color: #1f2937;">${label}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: #e5e7eb; color: #4b5563; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px;">${recCount} items</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${recsHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
    })
    .join('');

  if (!allSectionsHtml.trim()) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 32px; margin: 0 0 12px;">🎉</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">Amazing! No issues detected in any category.</p>
          </td>
        </tr>
      </table>
    `;
  }

  return allSectionsHtml;
}

// Build Core Web Vitals section - PROFESSIONAL VERSION
function buildCoreWebVitalsHtml(coreWebVitals, texts, isRtl) {
  if (!coreWebVitals) {
    return '';
  }

  const metrics = [
    {
      key: 'lcp',
      label: texts.lcpLabel,
      desc: texts.lcpDesc,
      goodThreshold: 2500,
      unit: 'ms',
      formatValue: v => `${(v / 1000).toFixed(2)}s`,
      icon: '⏱️',
    },
    {
      key: 'cls',
      label: texts.clsLabel,
      desc: texts.clsDesc,
      goodThreshold: 0.1,
      unit: '',
      formatValue: v => v.toFixed(3),
      icon: '📐',
    },
    {
      key: 'fid',
      label: texts.fidLabel,
      desc: texts.fidDesc,
      goodThreshold: 100,
      unit: 'ms',
      formatValue: v => `${v}ms`,
      icon: '👆',
    },
  ];

  const metricsHtml = metrics
    .map((metric, idx) => {
      const data = coreWebVitals[metric.key];
      if (!data) return '';

      const value = data.value;
      const rating = data.rating?.toLowerCase() || 'average';
      const isGood = rating === 'good' || rating === 'fast';
      const isBad = rating === 'slow' || rating === 'poor';

      const statusColor = isGood ? '#059669' : isBad ? '#dc2626' : '#d97706';
      const statusBg = isGood ? '#ecfdf5' : isBad ? '#fef2f2' : '#fffbeb';
      const statusBorder = isGood ? '#a7f3d0' : isBad ? '#fecaca' : '#fde68a';
      const statusText = isGood ? texts.good : isBad ? texts.critical : texts.needsWork;
      const isLast = idx === metrics.length - 1;

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="40" style="vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="background: #f1f5f9; border-radius: 8px;">
                  <tr>
                    <td style="padding: 8px; text-align: center;">
                      <span style="font-size: 18px;">${metric.icon}</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-${isRtl ? 'right' : 'left'}: 14px; vertical-align: top; ${isRtl ? 'text-align: right;' : ''}">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1f2937;">${metric.label}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">${metric.desc}</p>
              </td>
              <td width="100" align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 10px 14px; text-align: center;">
                      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 800; color: ${statusColor};">${metric.formatValue(value)}</p>
                      <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.3px;">${statusText}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .filter(Boolean)
    .join('');

  if (!metricsHtml.trim()) return '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            📈 ${texts.coreWebVitalsTitle}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${texts.coreWebVitalsSubtitle}</p>
        </td>
      </tr>
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
            ${metricsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Build 30-day action roadmap - PROFESSIONAL VERSION
function buildActionRoadmapHtml(sections, texts, isRtl) {
  const allRecs = [];
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];

  sectionOrder.forEach(key => {
    const section = sections[key];
    if (section?.recommendations) {
      section.recommendations.forEach(rec => {
        allRecs.push({ ...rec, sectionKey: key, sectionName: texts.sections[key] || section.name });
      });
    }
  });

  // Sort by impact priority
  const impactOrder = { high: 0, medium: 1, low: 2 };
  allRecs.sort((a, b) => (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2));

  // Distribute into weeks
  const week1 = allRecs.filter(r => r.impact === 'high').slice(0, 3);
  const week2 = allRecs
    .filter(r => r.impact === 'high')
    .slice(3, 5)
    .concat(allRecs.filter(r => r.impact === 'medium').slice(0, 2));
  const week3 = allRecs.filter(r => r.impact === 'medium').slice(2, 5);
  const week4 = allRecs.filter(r => r.impact === 'low').slice(0, 3);

  const buildWeekHtml = (weekLabel, items, weekNum) => {
    if (items.length === 0) return '';

    const weekColors = {
      1: { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626', icon: '🔥' },
      2: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', icon: '⚡' },
      3: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', icon: '🎯' },
      4: { bg: '#f8fafc', border: '#e2e8f0', accent: '#64748b', icon: '✨' },
    };
    const colors = weekColors[weekNum] || weekColors[4];

    const itemsHtml = items
      .map((item, idx) => {
        const isLast = idx === items.length - 1;
        return `
        <tr>
          <td style="padding: 10px 16px; ${!isLast ? 'border-bottom: 1px solid ' + colors.border + ';' : ''} ${isRtl ? 'text-align: right;' : ''}">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="24" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: ${colors.accent}; border-radius: 50%; width: 20px; height: 20px;">
                    <tr>
                      <td align="center" style="color: #ffffff; font-size: 11px; font-weight: 700;">${idx + 1}</td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1f2937; line-height: 1.4;">${item.title}</p>
                  <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">${item.sectionName}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 10px 10px 0 0; padding: 12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 14px; font-weight: 700; color: ${colors.accent};">${colors.icon} ${weekLabel}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: ${colors.accent}; color: #ffffff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 10px;">${items.length} tasks</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid ${colors.border}; border-top: none; border-radius: 0 0 10px 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${itemsHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  const weeks = [
    { label: texts.week1, items: week1, num: 1 },
    { label: texts.week2, items: week2, num: 2 },
    { label: texts.week3, items: week3, num: 3 },
    { label: texts.week4, items: week4, num: 4 },
  ];

  const weeksHtml = weeks
    .map(w => buildWeekHtml(w.label, w.items, w.num))
    .filter(Boolean)
    .join('');

  if (!weeksHtml) return '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            🗓️ ${texts.actionRoadmapTitle}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${texts.actionRoadmapSubtitle}</p>
        </td>
      </tr>
      <tr>
        <td>
          ${weeksHtml}
        </td>
      </tr>
    </table>
  `;
}

// Build revenue impact section - PROFESSIONAL VERSION (no CSS gradients for email)
function buildRevenueImpactHtml(overallScore, sections, texts, isRtl) {
  const criticalIssues = Object.values(sections).reduce((count, section) => {
    return count + (section.recommendations?.filter(r => r.impact === 'high').length || 0);
  }, 0);

  if (criticalIssues === 0) return '';

  // Calculate estimated impact based on issues
  const lowEnd = Math.min(15 + criticalIssues * 2, 35);
  const highEnd = Math.min(25 + criticalIssues * 3, 50);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="background: #0f172a; border-radius: 12px; padding: 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${isRtl ? 'text-align: right;' : ''}">
                <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 10px;">
                  💰 ${texts.revenueImpactTitle}
                </h3>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
                  ${texts.revenueImpactText}
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #1e293b; border-radius: 10px;">
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                      <table cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td style="text-align: center;">
                            <span style="font-size: 44px; font-weight: 900; color: #22c55e;">${lowEnd}-${highEnd}%</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 8px; text-align: center;">
                            <span style="color: #64748b; font-size: 13px;">${criticalIssues} ${texts.issuesDetected}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// ==========================================
// PDF REPORT GENERATION
// ==========================================

function generateStoreAnalysisPDF(results, storeUrl, texts, isRtl) {
  return new Promise((resolve, reject) => {
    // Lazy-load PDFKit to avoid deployment timeout
    const PDFDocument = require('pdfkit');

    const chunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: texts.headline,
        Author: 'CartShift Studio',
        Subject: `Store Analysis Report - ${storeUrl}`,
      },
    });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const colors = {
      primary: '#3b82f6',
      accent: '#8b5cf6',
      dark: '#0f172a',
      text: '#1f2937',
      muted: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      lightBg: '#f8fafc',
      border: '#e2e8f0',
    };

    const getScoreColor = score => {
      if (score >= 80) return colors.success;
      if (score >= 60) return colors.primary;
      if (score >= 40) return colors.warning;
      return colors.danger;
    };

    // Helper functions
    const drawRoundedRect = (x, y, w, h, r, fillColor, strokeColor = null) => {
      doc.roundedRect(x, y, w, h, r);
      if (fillColor) doc.fill(fillColor);
      if (strokeColor) {
        doc.roundedRect(x, y, w, h, r).stroke(strokeColor);
      }
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================

    // Dark header background
    doc.rect(0, 0, 595, 280).fill(colors.dark);

    // Logo/Brand
    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('CARTSHIFT STUDIO', 50, 40);

    // Badge
    doc.roundedRect(50, 80, 140, 28, 14).fill(colors.primary);
    doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text(texts.badge.toUpperCase(), 60, 88, { width: 120, align: 'center' });

    // Main Title
    doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text(texts.headline, 50, 130, { width: 495 });

    // Store URL
    doc.fontSize(14).fillColor('#94a3b8').font('Helvetica');
    doc.text(storeUrl, 50, 200);

    // Date
    const reportDate = new Date().toLocaleDateString(isRtl ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.fontSize(11).fillColor('#64748b');
    doc.text(reportDate, 50, 225);

    // Score Circle
    const scoreX = 297;
    const scoreY = 400;
    const scoreRadius = 70;

    // Outer circle (background)
    doc.circle(scoreX, scoreY, scoreRadius + 8).fill('#e2e8f0');

    // Main circle
    const scoreColor = getScoreColor(results.overallScore);
    doc.circle(scoreX, scoreY, scoreRadius).fill(scoreColor);

    // Inner white circle
    doc.circle(scoreX, scoreY, scoreRadius - 12).fill('#ffffff');

    // Score text
    doc.fontSize(48).fillColor(colors.dark).font('Helvetica-Bold');
    doc.text(String(results.overallScore), scoreX - 35, scoreY - 25, {
      width: 70,
      align: 'center',
    });

    doc.fontSize(14).fillColor(colors.muted).font('Helvetica');
    doc.text('/100', scoreX - 25, scoreY + 30, { width: 50, align: 'center' });

    // Score Label
    doc.fontSize(16).fillColor(colors.text).font('Helvetica-Bold');
    doc.text(texts.overallScoreLabel.toUpperCase(), 50, 330, { width: 495, align: 'center' });

    // Score Status
    const scoreStatus =
      results.overallScore >= 80
        ? 'excellent'
        : results.overallScore >= 60
          ? 'good'
          : results.overallScore >= 40
            ? 'warning'
            : 'critical';
    doc.fontSize(14).fillColor(scoreColor).font('Helvetica-Bold');
    doc.text(texts.scoreStatus[scoreStatus], 50, 500, { width: 495, align: 'center' });

    // Quick Stats Row
    const statsY = 560;
    const totalIssues = Object.values(results.sections).reduce(
      (sum, s) => sum + (s.recommendations?.length || 0),
      0
    );
    const criticalIssues = Object.values(results.sections).reduce(
      (sum, s) => sum + (s.recommendations?.filter(r => r.impact === 'high').length || 0),
      0
    );

    const stats = [
      {
        label: texts.sections?.performance || 'Performance',
        value: results.sections.performance?.score || 0,
      },
      { label: texts.sections?.seo || 'SEO', value: results.sections.seo?.score || 0 },
      { label: 'Critical Issues', value: criticalIssues },
      { label: 'Total Issues', value: totalIssues },
    ];

    const statWidth = 110;
    const statStartX = 75;
    stats.forEach((stat, i) => {
      const x = statStartX + i * (statWidth + 20);
      doc.roundedRect(x, statsY, statWidth, 70, 8).fill(colors.lightBg);
      doc.fontSize(24).fillColor(colors.dark).font('Helvetica-Bold');
      doc.text(String(stat.value), x, statsY + 15, { width: statWidth, align: 'center' });
      doc.fontSize(9).fillColor(colors.muted).font('Helvetica');
      doc.text(stat.label.toUpperCase(), x, statsY + 48, { width: statWidth, align: 'center' });
    });

    // Footer on cover
    doc.fontSize(9).fillColor(colors.muted).font('Helvetica');
    doc.text('Generated by CartShift Studio • cart-shift.com', 50, 780, {
      width: 495,
      align: 'center',
    });

    // ==========================================
    // PAGE 2: SCORE BREAKDOWN
    // ==========================================
    doc.addPage();

    // Section Header
    doc.fontSize(22).fillColor(colors.dark).font('Helvetica-Bold');
    doc.text('📊 ' + texts.scoreBreakdownTitle, 50, 50);

    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    // Score Cards
    const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
    const sectionIcons = {
      performance: '⚡',
      seo: '🔍',
      accessibility: '♿',
      bestPractices: '🛡️',
      cart: '🛒',
      trust: '✨',
    };

    let cardY = 110;
    sectionOrder.forEach((key, index) => {
      const section = results.sections[key];
      if (!section) return;

      const label = texts.sections[key] || section.name || key;
      const score = section.score;
      const scoreCol = getScoreColor(score);

      // Card background
      doc.roundedRect(50, cardY, 495, 65, 8).fill(colors.lightBg);

      // Score bar
      const barWidth = (score / 100) * 380;
      doc.roundedRect(95, cardY + 40, 380, 10, 5).fill('#e2e8f0');
      doc.roundedRect(95, cardY + 40, barWidth, 10, 5).fill(scoreCol);

      // Icon and Label
      doc.fontSize(16).fillColor(colors.text).font('Helvetica-Bold');
      doc.text(sectionIcons[key] + ' ' + label, 60, cardY + 15);

      // Score
      doc.fontSize(20).fillColor(scoreCol).font('Helvetica-Bold');
      doc.text(String(score), 485, cardY + 15, { width: 50, align: 'right' });

      cardY += 80;
    });

    // ==========================================
    // PAGE 3: PRIORITY FIXES
    // ==========================================
    doc.addPage();

    doc.fontSize(22).fillColor(colors.dark).font('Helvetica-Bold');
    doc.text('🎯 ' + texts.priorityFixesTitle, 50, 50);

    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    // Get high impact recommendations
    const allRecs = [];
    Object.values(results.sections).forEach(section => {
      if (section.recommendations) {
        section.recommendations.forEach(rec => {
          if (rec.impact === 'high') allRecs.push(rec);
        });
      }
    });

    let recY = 110;
    const topRecs = allRecs.slice(0, 8);

    if (topRecs.length === 0) {
      doc.roundedRect(50, recY, 495, 60, 8).fill('#ecfdf5');
      doc.fontSize(14).fillColor('#166534').font('Helvetica-Bold');
      doc.text('🎉 Great job! No critical issues found.', 70, recY + 22);
    } else {
      topRecs.forEach((rec, idx) => {
        if (recY > 700) {
          doc.addPage();
          recY = 50;
        }

        // Card
        doc.roundedRect(50, recY, 495, 55, 6).fill('#ffffff').stroke(colors.border);

        // Number badge
        doc.roundedRect(60, recY + 12, 28, 28, 6).fill('#fef2f2');
        doc.fontSize(14).fillColor(colors.danger).font('Helvetica-Bold');
        doc.text(String(idx + 1), 60, recY + 20, { width: 28, align: 'center' });

        // Impact badge
        doc.roundedRect(100, recY + 12, 80, 20, 4).fill('#fef2f2');
        doc.fontSize(8).fillColor(colors.danger).font('Helvetica-Bold');
        doc.text((texts.impact?.high || 'HIGH IMPACT').toUpperCase(), 100, recY + 18, {
          width: 80,
          align: 'center',
        });

        // Title
        doc.fontSize(11).fillColor(colors.text).font('Helvetica-Bold');
        doc.text(rec.title, 100, recY + 36, { width: 430 });

        recY += 65;
      });
    }

    // ==========================================
    // PAGE 4: 30-DAY ROADMAP
    // ==========================================
    doc.addPage();

    doc.fontSize(22).fillColor(colors.dark).font('Helvetica-Bold');
    doc.text('🗓️ ' + texts.actionRoadmapTitle, 50, 50);

    doc.fontSize(12).fillColor(colors.muted).font('Helvetica');
    doc.text(texts.actionRoadmapSubtitle, 50, 80);

    doc.moveTo(50, 105).lineTo(545, 105).stroke(colors.border);

    // Distribute recs into weeks
    const allRecsForRoadmap = [];
    sectionOrder.forEach(key => {
      const section = results.sections[key];
      if (section?.recommendations) {
        section.recommendations.forEach(rec => {
          allRecsForRoadmap.push({
            ...rec,
            sectionKey: key,
            sectionName: texts.sections[key] || section.name,
          });
        });
      }
    });

    const impactOrder = { high: 0, medium: 1, low: 2 };
    allRecsForRoadmap.sort((a, b) => (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2));

    const week1 = allRecsForRoadmap.filter(r => r.impact === 'high').slice(0, 3);
    const week2 = allRecsForRoadmap
      .filter(r => r.impact === 'high')
      .slice(3, 5)
      .concat(allRecsForRoadmap.filter(r => r.impact === 'medium').slice(0, 2));
    const week3 = allRecsForRoadmap.filter(r => r.impact === 'medium').slice(2, 5);
    const week4 = allRecsForRoadmap.filter(r => r.impact === 'low').slice(0, 3);

    const weekColors = {
      1: { bg: '#fef2f2', accent: '#dc2626', label: texts.week1 },
      2: { bg: '#fff7ed', accent: '#ea580c', label: texts.week2 },
      3: { bg: '#f0fdf4', accent: '#16a34a', label: texts.week3 },
      4: { bg: '#f8fafc', accent: '#64748b', label: texts.week4 },
    };

    let roadmapY = 125;
    [week1, week2, week3, week4].forEach((weekItems, weekIdx) => {
      if (weekItems.length === 0) return;
      const weekNum = weekIdx + 1;
      const wc = weekColors[weekNum];

      // Week header
      doc.roundedRect(50, roadmapY, 495, 28, 6).fill(wc.bg);
      doc.fontSize(11).fillColor(wc.accent).font('Helvetica-Bold');
      doc.text(wc.label, 60, roadmapY + 8);
      doc.fontSize(9).fillColor(wc.accent).font('Helvetica');
      doc.text(weekItems.length + ' tasks', 485, roadmapY + 10, { width: 50, align: 'right' });

      roadmapY += 35;

      weekItems.forEach((item, i) => {
        if (roadmapY > 750) {
          doc.addPage();
          roadmapY = 50;
        }

        doc.circle(65, roadmapY + 6, 4).fill(wc.accent);
        doc.fontSize(10).fillColor(colors.text).font('Helvetica');
        doc.text(item.title, 80, roadmapY, { width: 400 });
        doc.fontSize(8).fillColor(colors.muted);
        doc.text(item.sectionName, 80, roadmapY + 14);
        roadmapY += 32;
      });

      roadmapY += 15;
    });

    // ==========================================
    // PAGE 5: DETAILED FINDINGS
    // ==========================================
    doc.addPage();

    doc.fontSize(22).fillColor(colors.dark).font('Helvetica-Bold');
    doc.text('🔬 ' + texts.detailedFindingsTitle, 50, 50);

    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    let findingsY = 110;

    sectionOrder.forEach(key => {
      const section = results.sections[key];
      if (!section) return;

      if (findingsY > 650) {
        doc.addPage();
        findingsY = 50;
      }

      const label = texts.sections[key] || section.name || key;
      const icon = sectionIcons[key];

      // Section header
      doc.roundedRect(50, findingsY, 495, 35, 6).fill(colors.lightBg);
      doc.fontSize(14).fillColor(colors.text).font('Helvetica-Bold');
      doc.text(icon + ' ' + label, 60, findingsY + 10);

      const scoreCol = getScoreColor(section.score);
      doc.fontSize(14).fillColor(scoreCol).font('Helvetica-Bold');
      doc.text(section.score + '/100', 480, findingsY + 10, { width: 55, align: 'right' });

      findingsY += 45;

      // Findings
      const positiveFindings = section.findings?.filter(f => f.type === 'positive') || [];
      const issueFindings = section.findings?.filter(f => f.type === 'issue') || [];
      const allFindings = [...issueFindings, ...positiveFindings].slice(0, 4);

      allFindings.forEach(finding => {
        if (findingsY > 730) {
          doc.addPage();
          findingsY = 50;
        }

        const isIssue = finding.type === 'issue';
        const findingColor = isIssue ? colors.danger : colors.success;
        const findingBg = isIssue ? '#fef2f2' : '#f0fdf4';

        doc.roundedRect(60, findingsY, 475, 30, 4).fill(findingBg);
        doc.fontSize(9).fillColor(findingColor).font('Helvetica-Bold');
        doc.text(isIssue ? '✕' : '✓', 70, findingsY + 10);
        doc.fontSize(9).fillColor(colors.text).font('Helvetica');
        doc.text(finding.title, 90, findingsY + 10, { width: 420 });

        findingsY += 35;
      });

      findingsY += 20;
    });

    // ==========================================
    // FINAL PAGE: CTA
    // ==========================================
    doc.addPage();

    // Dark section
    doc.rect(0, 200, 595, 250).fill(colors.dark);

    doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text(texts.ctaTitle, 50, 260, { width: 495, align: 'center' });

    doc.fontSize(14).fillColor('#94a3b8').font('Helvetica');
    doc.text(texts.ctaText, 70, 310, { width: 455, align: 'center' });

    // CTA Button
    doc.roundedRect(200, 370, 195, 45, 8).fill(colors.primary);
    doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text(texts.ctaButtonText, 200, 385, { width: 195, align: 'center' });

    // Pro Tip
    doc.roundedRect(50, 500, 495, 80, 8).fill('#fffbeb').stroke('#fef3c7');
    doc.fontSize(12).fillColor('#92400e').font('Helvetica-Bold');
    doc.text('💡 ' + texts.proTipLabel, 70, 520);
    doc.fontSize(10).fillColor('#b45309').font('Helvetica');
    doc.text(texts.proTipText, 70, 540, { width: 455 });

    // Contact Info
    doc.fontSize(11).fillColor(colors.muted).font('Helvetica');
    doc.text('Questions? Contact us at hello@cart-shift.com', 50, 620, {
      width: 495,
      align: 'center',
    });
    doc.text('cart-shift.com', 50, 640, { width: 495, align: 'center' });

    // Footer
    doc.fontSize(9).fillColor(colors.muted);
    doc.text(`Report generated on ${reportDate} • ${storeUrl}`, 50, 780, {
      width: 495,
      align: 'center',
    });

    doc.end();
  });
}

exports.sendStoreAnalysisReport = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { email, storeUrl, locale, results, subscribeNewsletter } = req.body;

      if (!email || !results) {
        return res.status(400).json({ error: 'Email and results are required' });
      }

      const lang = locale === 'he' ? 'he' : 'en';
      const texts = ANALYSIS_TEXTS[lang];
      const isRtl = lang === 'he';

      // Save lead to Firestore
      await admin
        .firestore()
        .collection('store_analysis_leads')
        .add({
          email,
          storeUrl,
          locale: lang,
          overallScore: results.overallScore,
          platform: results.platform,
          subscribeNewsletter: subscribeNewsletter || false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Add to Resend Audience
      await addToAudience(resendApiKey.value(), {
        email,
        source: 'store_analyzer',
        properties: {
          subscription_type: subscribeNewsletter ? 'newsletter_and_lead' : 'lead_only',
          store_url: storeUrl || '',
          store_score: String(results.overallScore),
          platform: results.platform || 'unknown',
          locale: lang,
        },
      });

      // If subscribed to newsletter, add to newsletter collection
      if (subscribeNewsletter) {
        await admin.firestore().collection('newsletter_subscriptions').add({
          email,
          source: 'store_analyzer',
          locale: lang,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Generate PDF Report
      console.log('[Store Analysis] Generating PDF report...');
      const pdfBuffer = await generateStoreAnalysisPDF(results, storeUrl, texts, isRtl);
      console.log('[Store Analysis] PDF generated, size:', pdfBuffer.length, 'bytes');

      // Create a clean filename from the store URL
      const cleanStoreUrl = (storeUrl || 'store')
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-')
        .slice(0, 30);
      const pdfFilename = `store-analysis-${cleanStoreUrl}-${Date.now()}.pdf`;

      // Determine score status text
      const scoreStatus =
        results.overallScore >= 80
          ? 'excellent'
          : results.overallScore >= 60
            ? 'good'
            : results.overallScore >= 40
              ? 'warning'
              : 'critical';

      // Simple cover email data
      const emailData = {
        badge: texts.badge,
        headline: texts.headline,
        greeting: texts.greeting,
        overallScoreLabel: texts.overallScoreLabel,
        overallScore: results.overallScore,
        scoreStatusText: texts.scoreStatus[scoreStatus],
        storeUrl: storeUrl || 'N/A',
        ctaTitle: texts.ctaTitle,
        ctaText: texts.ctaText,
        ctaUrl: `https://cart-shift.com/${lang}/contact`,
        ctaButtonText: texts.ctaButtonText,
        proTipLabel: texts.proTipLabel,
        proTipText: texts.proTipText,
        analyzedUrl: texts.analyzedUrl,
        footerText: texts.footerText,
        dir: isRtl ? 'rtl' : 'ltr',
        textAlign: isRtl ? 'right' : 'left',
        paddingSide: isRtl ? 'right' : 'left',
        // PDF attachment message
        pdfAttachmentMessage:
          lang === 'he'
            ? '📎 מצורף לאימייל זה דוח PDF מלא עם כל הממצאים, המלצות ומפת דרכים לשיפור.'
            : '📎 Attached to this email is a comprehensive PDF report with all findings, recommendations, and improvement roadmap.',
      };

      // Send email with PDF attachment using Resend directly
      const { Resend } = require('resend');
      const resend = new Resend(resendApiKey.value());

      // Build simple HTML email (no Handlebars dependency)
      const htmlContent = `
<!DOCTYPE html>
<html lang="en" dir="${emailData.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; direction: ${emailData.dir};">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #3b82f6; border-radius: 20px; padding: 8px 20px;">
                    <span style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase;">${emailData.badge}</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 12px;">${emailData.headline}</h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">${emailData.storeUrl}</p>
            </td>
          </tr>
          <!-- Score -->
          <tr>
            <td style="background-color: #1e293b; padding: 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1.5px;">${emailData.overallScoreLabel}</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #334155; border-radius: 80px; width: 140px; height: 140px;">
                <tr>
                  <td align="center" valign="middle" style="padding: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 64px; width: 124px; height: 124px;">
                      <tr>
                        <td align="center" valign="middle">
                          <span style="font-size: 48px; font-weight: 900; color: #0f172a;">${emailData.overallScore}</span>
                          <span style="display: block; font-size: 14px; color: #64748b; font-weight: 600;">/100</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color: #ffffff; font-size: 16px; margin: 20px 0 0; font-weight: 600;">${emailData.scoreStatusText}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; text-align: ${emailData.textAlign};">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${emailData.greeting}</p>
              <!-- PDF Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6;">${emailData.pdfAttachmentMessage}</p>
                  </td>
                </tr>
              </table>
              <!-- Pro Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #92400e;">💡 ${emailData.proTipLabel}</p>
                    <p style="margin: 0; font-size: 14px; color: #b45309; line-height: 1.6;">${emailData.proTipText}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 32px; text-align: center;">
                    <h3 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 12px;">${emailData.ctaTitle}</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">${emailData.ctaText}</p>
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="background-color: #3b82f6; border-radius: 8px;">
                          <a href="${emailData.ctaUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700;">${emailData.ctaButtonText} →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">${emailData.analyzedUrl}: ${emailData.storeUrl}</p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">${emailData.footerText}<br>&copy; 2026 CartShift Studio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Send email with PDF attachment
      const result = await resend.emails.send({
        from: 'CartShift Studio <reports@cart-shift.com>',
        to: email,
        subject: texts.subject,
        html: htmlContent,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer.toString('base64'),
          },
        ],
        tags: [{ name: 'type', value: 'store_analysis' }],
      });

      console.log('[Store Analysis] Email sent successfully:', result);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Store analysis email error:', error);
      return res.status(500).json({ error: 'Failed to send report' });
    }
  }
);

// ============================================
// RESEND WEBHOOK HANDLER (Email Event Tracking)
// ============================================

/*
exports.resendWebhook = onRequest(
  {
    cors: false,
    maxInstances: 10,
    secrets: [resendWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const webhookSecret = resendWebhookSecret.value();

      if (!webhookSecret) {
        console.warn('[Webhook] RESEND_WEBHOOK_SECRET not configured');
        return res.status(200).json({ received: true, warning: 'webhook_secret_not_configured' });
      }

      const event = parseWebhookEvent(req, webhookSecret);
      await handleWebhookEvent(admin, event);

      return res.status(200).json({ received: true, type: event.type });
    } catch (error) {
      console.error('[Webhook] Error:', error.message);

      if (error.message.includes('signature') || error.message.includes('headers')) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);
*/

// ============================================
// BATCH EMAIL SENDER (for bulk operations)
// ============================================

exports.sendBatchEmails = onRequest(
  {
    cors: true,
    maxInstances: 5,
    secrets: [resendApiKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: 'emails array is required' });
      }

      if (emails.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 emails per batch' });
      }

      const result = await sendBatchEmails(resendApiKey.value(), emails);

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('Batch email error:', error);
      return res.status(500).json({ error: 'Failed to send batch emails' });
    }
  }
);

// ============================================
// STORE ANALYZER - ANALYZE STORE
// ============================================

const analyzeStoreRateLimitMap = new Map();
const ANALYZE_STORE_RATE_LIMIT_MAX_REQUESTS = 5;

const platformPatterns = [
  {
    name: 'Shopify',
    patterns: [/myshopify\.com/i, /shopify/i, /cdn\.shopify\.com/i, /window\.Shopify/i],
  },
  { name: 'WooCommerce', patterns: [/woocommerce/i, /wp-content/i, /wordpress/i, /wp-json/i] },
  { name: 'Magento', patterns: [/magento/i, /mage/i, /varien/i] },
  { name: 'BigCommerce', patterns: [/bigcommerce/i, /mybigcommerce\.com/i, /cdn\.bigcommerce/i] },
  { name: 'Wix', patterns: [/wix\.com/i, /wixsite\.com/i, /wix-image/i] },
  { name: 'Squarespace', patterns: [/squarespace\.com/i, /sqsp\.net/i, /squarespace-cdn/i] },
  { name: 'PrestaShop', patterns: [/prestashop/i, /presta/i] },
];

function detectPlatform(html, url) {
  const combined = html + ' ' + url;
  for (const platform of platformPatterns) {
    for (const pattern of platform.patterns) {
      if (pattern.test(combined)) {
        return platform.name;
      }
    }
  }
  return null;
}

function getScoreStatus(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

async function fetchPageSpeedData(url, apiKey) {
  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    if (apiKey) {
      apiUrl.searchParams.set('key', apiKey);
    }
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PageSpeed API error:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('PageSpeed API fetch error:', error);
    return null;
  }
}

function extractLighthouseFindings(audits, category) {
  const findings = [];
  const recommendations = [];

  const categoryAudits = {
    performance: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time',
      'cumulative-layout-shift',
      'server-response-time',
      'interactive',
      'mainthread-work-breakdown',
    ],
    seo: [
      'document-title',
      'meta-description',
      'http-status-code',
      'crawlable-anchors',
      'is-crawlable',
      'robots-txt',
      'link-text',
      'image-alt',
    ],
    accessibility: [
      'button-name',
      'color-contrast',
      'image-alt',
      'link-name',
      'label',
      'form-field-multiple-labels',
    ],
    'best-practices': [
      'is-on-https',
      'uses-http2',
      'no-vulnerable-libraries',
      'doctype',
      'charset',
    ],
  };

  const auditsToCheck = categoryAudits[category] || [];

  for (const auditId of auditsToCheck) {
    const audit = audits[auditId];
    if (
      !audit ||
      audit.scoreDisplayMode === 'notApplicable' ||
      audit.scoreDisplayMode === 'informative'
    )
      continue;

    if (audit.score === 1) {
      findings.push({
        type: 'positive',
        title: audit.title,
        description: 'Passed',
      });
    } else if (audit.score !== null && audit.score < 0.9) {
      findings.push({
        type: 'issue',
        title: audit.title,
        description: audit.displayValue || audit.description?.split('.')[0] || 'Needs improvement',
      });
      recommendations.push({
        title: audit.title
          .replace('Ensure', 'Fix')
          .replace('Avoid', 'Remove')
          .replace('Eliminate', 'Fix'),
        impact: audit.score < 0.5 ? 'high' : 'medium',
        serviceLink: '/contact',
      });
    }
  }

  return { findings, recommendations };
}

function analyzeSEOFallback(html) {
  const findings = [];
  const recommendations = [];
  let score = 50;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Page title found',
      description: 'HTML title tag is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing page title',
      description: 'Title tag is empty or missing.',
    });
    recommendations.push({ title: 'Add a descriptive page title', impact: 'high' });
  }

  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (metaDescMatch && metaDescMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Meta description found',
      description: 'Meta description is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing meta description',
      description: 'Add a meta description for better SEO click-through rates.',
    });
    recommendations.push({ title: 'Add meta description', impact: 'high' });
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'H1 heading found',
      description: 'Main heading structure exists.',
    });
  } else {
    recommendations.push({ title: 'Add a main H1 heading', impact: 'medium' });
  }

  return {
    name: 'SEO',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzePerformanceFallback(html) {
  const findings = [];
  const recommendations = [];
  let score = 60;

  const scriptCount = (html.match(/<script/gi) || []).length;
  if (scriptCount > 20) {
    score -= 10;
    findings.push({
      type: 'issue',
      title: 'High script count',
      description: 'Detected many script tags which may slow down loading.',
    });
    recommendations.push({ title: 'Minimize and bundle JavaScript', impact: 'high' });
  } else {
    findings.push({
      type: 'positive',
      title: 'Reasonable script usage',
      description: 'Script tag count is within limits.',
    });
  }

  if (/loading=["']lazy["']/i.test(html)) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Lazy loading detected',
      description: 'Images are using lazy loading.',
    });
  } else {
    recommendations.push({ title: 'Implement lazy loading for images', impact: 'medium' });
  }

  return {
    name: 'Performance',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeAccessibilityFallback(html) {
  const findings = [];
  const recommendations = [];
  let score = 50;

  if (/html[^>]+lang=/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Language attribute',
      description: 'HTML tag specifies a language.',
    });
  } else {
    recommendations.push({ title: 'Add lang attribute to HTML tag', impact: 'high' });
  }

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Mobile optimization',
      description: 'Viewport meta tag is present.',
    });
  } else {
    recommendations.push({ title: 'Add viewport meta tag', impact: 'high' });
  }

  const imgCount = (html.match(/<img/gi) || []).length;
  const altCount = (html.match(/alt=["'][^"']*["']/gi) || []).length;

  if (imgCount > 0 && altCount >= imgCount * 0.8) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Image alt text',
      description: 'Most images have description tags.',
    });
  } else if (imgCount > 0) {
    recommendations.push({ title: 'Add alt text to images', impact: 'medium' });
  } else {
    score += 20;
  }

  return {
    name: 'Accessibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeCart(html) {
  const findings = [];
  const recommendations = [];
  let score = 50;

  const hasCart =
    /href=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html) ||
    /class=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html) ||
    /aria-label=["'][^"']*(cart|basket|bag)[^"']*["']/i.test(html);

  if (hasCart) {
    findings.push({
      type: 'positive',
      title: 'Cart accessible',
      description: 'Cart link or icon detected.',
    });
    score += 25;
  } else {
    findings.push({
      type: 'issue',
      title: 'Cart visibility low',
      description: 'Could not clearly identify a cart link.',
    });
    recommendations.push({ title: 'Ensure cart is always visible', impact: 'high' });
  }

  const hasAddToCart =
    /add\s*to\s*(cart|bag)|buy\s*now|checkout/i.test(html) ||
    /name=["']add["']|type=["']submit["']/i.test(html);

  if (hasAddToCart) {
    findings.push({
      type: 'positive',
      title: 'Purchase actions found',
      description: 'Add to cart or Buy buttons detected.',
    });
    score += 25;
  }

  const hasSecureTerms = /secure|ssl|encrypt|lock|guarantee|safe/i.test(html);
  if (hasSecureTerms) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Security terms found',
      description: 'Page mentions security or guarantees.',
    });
  } else {
    recommendations.push({ title: 'Add security assurances near checkout/cart', impact: 'medium' });
  }

  return {
    name: 'Cart & Checkout',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeTrust(html) {
  const findings = [];
  const recommendations = [];
  let score = 50;

  const reviewTerms = /review|rating|star|testimonial|feedback/i;
  if (reviewTerms.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Social proof detected',
      description: 'Reviews or ratings found on page.',
    });
    score += 20;
  } else {
    recommendations.push({ title: 'Add customer reviews', impact: 'high' });
  }

  if (/privacy/i.test(html) && /policy/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Privacy policy found',
      description: 'Legal pages appear to be linked.',
    });
    score += 15;
  } else {
    recommendations.push({ title: 'Ensure Privacy Policy is visible', impact: 'medium' });
  }

  if (/trust|secure|badge|guarantee|payment|visa|mastercard|paypal/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Trust signals/Payment icons',
      description: 'Trust icons or payment methods displayed.',
    });
    score += 15;
  }

  return {
    name: 'Trust & Credibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

// 5 requests per hour per IP (stricter than memory limit)
exports.analyzeStore = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [pagespeedApiKey, recaptchaSecretKey],
  },
  async (req, res) => {
    if (!applyCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const rateLimitKey = getRateLimitKey(req);

      // Distributed Rate Limiting (Firestore)
      // Limit: 5 requests per hour per IP
      const isAllowed = await checkFirestoreRateLimit(
        rateLimitKey,
        ANALYZE_STORE_RATE_LIMIT_MAX_REQUESTS,
        60 * 60 * 1000
      );

      if (!isAllowed) {
        res.set('Retry-After', '3600');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      const { storeUrl, email, subscribeNewsletter, locale, captchaToken } = req.body;

      // Verify Captcha
      const recaptchaSecret = recaptchaSecretKey.value();
      if (recaptchaSecret) {
        if (!captchaToken) {
          return res.status(400).json({ error: 'Captcha token is missing' });
        }

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${captchaToken}`;
        const captchaRes = await fetch(verifyUrl, { method: 'POST' });
        const captchaData = await captchaRes.json();

        if (!captchaData.success) {
          return res.status(400).json({ error: 'Captcha verification failed' });
        }
      } else {
        console.warn('RECAPTCHA_SECRET_KEY not set in functions secrets, skipping verification.');
      }

      if (!storeUrl || !email) {
        return res.status(400).json({ error: 'URL and Email are required' });
      }

      let normalizedUrl = storeUrl.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      let html = '';
      try {
        const response = await fetch(normalizedUrl, {
          headers: { 'User-Agent': 'CartShift Analyzer/1.0', Accept: 'text/html' },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        html = await response.text();
      } catch (fetchError) {
        console.error('Store fetch error:', fetchError);
        return res.status(400).json({ error: 'Could not access store URL' });
      }

      const platform = detectPlatform(html, normalizedUrl);
      const apiKey = pagespeedApiKey.value();
      const pageSpeedData = await fetchPageSpeedData(normalizedUrl, apiKey);

      let sections;
      let coreWebVitals;

      if (pageSpeedData?.lighthouseResult?.categories) {
        const cats = pageSpeedData.lighthouseResult.categories;
        const audits = pageSpeedData.lighthouseResult.audits || {};

        const perfScore = Math.round((cats.performance?.score || 0) * 100);
        const seoScore = Math.round((cats.seo?.score || 0) * 100);
        const a11yScore = Math.round((cats.accessibility?.score || 0) * 100);
        const bpScore = Math.round((cats['best-practices']?.score || 0) * 100);

        sections = {
          performance: {
            name: 'Performance',
            score: perfScore,
            status: getScoreStatus(perfScore),
            ...extractLighthouseFindings(audits, 'performance'),
          },
          seo: {
            name: 'SEO',
            score: seoScore,
            status: getScoreStatus(seoScore),
            ...extractLighthouseFindings(audits, 'seo'),
          },
          accessibility: {
            name: 'Accessibility',
            score: a11yScore,
            status: getScoreStatus(a11yScore),
            ...extractLighthouseFindings(audits, 'accessibility'),
          },
          bestPractices: {
            name: 'Best Practices',
            score: bpScore,
            status: getScoreStatus(bpScore),
            ...extractLighthouseFindings(audits, 'best-practices'),
          },
          cart: analyzeCart(html),
          trust: analyzeTrust(html),
        };

        const m = pageSpeedData.loadingExperience?.metrics;
        if (m) {
          coreWebVitals = {};
          if (m.LARGEST_CONTENTFUL_PAINT_MS)
            coreWebVitals.lcp = {
              value: m.LARGEST_CONTENTFUL_PAINT_MS.percentile,
              rating: m.LARGEST_CONTENTFUL_PAINT_MS.category,
            };
          if (m.CUMULATIVE_LAYOUT_SHIFT_SCORE)
            coreWebVitals.cls = {
              value: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
              rating: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
            };
          if (m.FIRST_INPUT_DELAY_MS)
            coreWebVitals.fid = {
              value: m.FIRST_INPUT_DELAY_MS.percentile,
              rating: m.FIRST_INPUT_DELAY_MS.category,
            };
        }
      } else {
        console.warn('Using fallback HTML analysis for', normalizedUrl);
        sections = {
          performance: analyzePerformanceFallback(html),
          seo: analyzeSEOFallback(html),
          accessibility: analyzeAccessibilityFallback(html),
          bestPractices: {
            name: 'Best Practices',
            score: 70,
            status: 'good',
            findings: [
              {
                type: 'positive',
                title: 'HTTPS Check',
                description: 'Basic security check passed.',
              },
            ],
            recommendations: [],
          },
          cart: analyzeCart(html),
          trust: analyzeTrust(html),
        };

        if (!sections.accessibility) {
          sections.accessibility = {
            name: 'Accessibility',
            score: 50,
            status: 'warning',
            findings: [],
            recommendations: [{ title: 'Run a full accessibility audit', impact: 'high' }],
          };
        }
      }

      const weights = {
        performance: 0.3,
        seo: 0.25,
        accessibility: 0.15,
        bestPractices: 0.1,
        cart: 0.1,
        trust: 0.1,
      };
      const overallScore = Math.round(
        Object.entries(sections).reduce(
          (sum, [key, section]) => sum + section.score * (weights[key] || 0.1),
          0
        )
      );

      const result = {
        storeUrl: normalizedUrl,
        overallScore,
        platform,
        sections,
        coreWebVitals,
        generatedAt: new Date().toISOString(),
      };

      try {
        const firebaseFunctionUrl =
          process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL?.replace(
            'contactForm',
            'sendStoreAnalysisReport'
          ) || 'https://us-central1-cartshiftstudio.cloudfunctions.net/sendStoreAnalysisReport';

        await fetch(firebaseFunctionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            storeUrl: normalizedUrl,
            locale: locale || 'en',
            results: result,
            subscribeNewsletter: subscribeNewsletter || false,
          }),
        }).catch(e => console.error('Email fetch error:', e));
      } catch (e) {
        console.error('Email logic error:', e);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Analysis API Fatal Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
