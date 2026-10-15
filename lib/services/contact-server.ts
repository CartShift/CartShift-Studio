import 'server-only';

import { randomBytes, createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { ContactFormData } from '@/lib/validation';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An accepted contact request creates its submission, conversion signal and
 * notification job in one Firestore transaction. No external email is sent
 * in the HTTP request, so an interruption cannot silently lose the message.
 *
 * This writes the existing marketing_leads shape and explicitly never enrolls
 * a contact inquiry in a marketing sequence without an independent opt-in.
 */
export async function persistContactInquiry(input: ContactFormData): Promise<{ submissionId: string }> {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const email = input.email.trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) throw new Error('INVALID_CONTACT_EMAIL');

  const db = adminDb;
  const leadId = createHash('sha256').update(email).digest('hex').slice(0, 32);
  const leadRef = db.collection('marketing_leads').doc(leadId);
  const submissionRef = db.collection('contact_submissions').doc();
  const emailRef = db.collection('email_queue').doc(`contact_${submissionRef.id}`);
  const marketingEventRef = db.collection('marketing_events').doc();
  const locale = input.locale === 'he' ? 'he' : 'en';
  const now = FieldValue.serverTimestamp();
  const name = input.name;
  const interest = input.interest || null;
  const projectType = input.projectType || null;
  const company = input.company || null;
  const message = input.message || null;
  const teamEmail = process.env.CONTACT_EMAIL || 'hello@cart-shift.com';
  const portalBase = (process.env.PORTAL_BASE_URL || 'https://portal.cart-shift.com').replace(/\/$/, '');
  const subject = locale === 'he'
    ? `פנייה חדשה: ${name}${projectType ? ` — ${projectType}` : ''}`
    : `New inquiry: ${name}${projectType ? ` — ${projectType}` : ''}`;

  await db.runTransaction(async tx => {
    const leadSnapshot = await tx.get(leadRef);
    const existing = leadSnapshot.data() || {};
    tx.create(submissionRef, {
      name, email, interest, message, company, projectType,
      locale, timestamp: now,
    });

    tx.set(leadRef, {
      leadId,
      email,
      normalizedEmail: email,
      locale,
      name: name || existing.name || null,
      company: company || existing.company || null,
      interest: interest || existing.interest || null,
      projectType: projectType || existing.projectType || null,
      primarySource: existing.primarySource || 'contact_form',
      latestSource: 'contact_form',
      sources: FieldValue.arrayUnion('contact_form'),
      marketingConsent: existing.marketingConsent === true,
      subscribeNewsletter: existing.subscribeNewsletter === true,
      conversionStatus: 'project_inquiry',
      funnelStage: 'converted',
      leadScore: FieldValue.increment(60),
      unsubscribeToken: existing.unsubscribeToken || randomBytes(24).toString('hex'),
      lastEngagedAt: now,
      updatedAt: now,
      createdAt: existing.createdAt || now,
    }, { merge: true });

    tx.create(marketingEventRef, {
      leadId, type: 'project_inquiry_started', source: 'contact_form',
      locale, createdAt: now,
    });

    tx.create(emailRef, {
      status: 'pending',
      to: teamEmail,
      subject,
      templateName: 'contact_form_notification',
      data: {
        name, email, company, projectType: projectType || interest,
        message, locale, leadsUrl: `${portalBase}/${locale}/portal/agency/leads`,
      },
      tags: [{ name: 'type', value: 'contact_form_notification' }],
      createdAt: now,
      updatedAt: now,
    });
  });

  // Nurture sends are also blocked by their worker when the lead is converted.
  // Cancel pending jobs proactively; a failure here must not lose the inquiry.
  try {
    const jobs = await db.collection('marketing_email_jobs')
      .where('leadId', '==', leadId).where('status', '==', 'pending').limit(100).get();
    if (!jobs.empty) {
      const batch = db.batch();
      for (const doc of jobs.docs) {
        batch.update(doc.ref, {
          status: 'canceled',
          cancelReason: 'converted',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('[Contact] Pending nurture cancellation failed', {
      submissionId: submissionRef.id, message: error instanceof Error ? error.message : 'unknown',
    });
  }

  return { submissionId: submissionRef.id };
}
